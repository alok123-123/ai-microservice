"""
AI-Powered Stock Market Sentiment Analyzer — Data Acquisition Microservice

FastAPI server that fetches financial news articles for a given stock ticker
using NewsAPI.org (primary) and BeautifulSoup web scraping (fallback),
then applies FinBERT/VADER sentiment analysis.

Run with:
    uvicorn main:app --reload
"""

import logging
import re
import time
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import (
    HOST, PORT, NEWS_API_KEY, TICKER_COMPANY_MAP, CORS_ORIGINS,
    RESPONSE_CACHE_TTL_SECONDS, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE,
)
from models.schemas import NewsResponse, ErrorResponse
from services.news_api_service import fetch_news_from_newsapi
from services.scraper_service import scrape_news
from services.sentiment_service import get_sentiment_scores_batch_async

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(name)s │ %(message)s",
)
logger = logging.getLogger(__name__)

# ── Response-level TTL cache ─────────────────────────────────────────────────
# Key: (ticker, page_size, source)  →  (NewsResponse dict, timestamp)
_response_cache: dict[tuple, tuple[dict, float]] = {}
_RESPONSE_CACHE_MAX = 200

TICKER_REGEX = re.compile(r"^[A-Z]{1,5}$")


def _get_cached_response(ticker: str, page_size: int, source: str) -> dict | None:
    key = (ticker, page_size, source)
    entry = _response_cache.get(key)
    if entry is None:
        return None
    data, ts = entry
    if time.time() - ts > RESPONSE_CACHE_TTL_SECONDS:
        del _response_cache[key]
        return None
    logger.info("Cache HIT for ticker=%s (age=%.0fs)", ticker, time.time() - ts)
    return data


def _set_cached_response(ticker: str, page_size: int, source: str, data: dict) -> None:
    if len(_response_cache) >= _RESPONSE_CACHE_MAX:
        oldest = min(_response_cache, key=lambda k: _response_cache[k][1])
        del _response_cache[oldest]
    _response_cache[(ticker, page_size, source)] = (data, time.time())


# ── Shared HTTP client ───────────────────────────────────────────────────────
# Created once at startup, reused for connection pooling (Phase 5)
_http_client: httpx.AsyncClient | None = None


# ── Application lifecycle ────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _http_client
    logger.info("🚀 AI Sentiment Microservice starting…")
    if NEWS_API_KEY:
        logger.info("✅ NEWS_API_KEY detected — NewsAPI.org is the primary source.")
    else:
        logger.warning(
            "⚠️  NEWS_API_KEY not set — will use web-scraping fallback only. "
            "Get a free key at https://newsapi.org/register"
        )

    # Create shared HTTP client
    _http_client = httpx.AsyncClient(
        timeout=15.0,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        },
        follow_redirects=True,
    )
    logger.info("✅ Shared HTTP client created (connection pooling enabled)")

    yield

    await _http_client.aclose()
    logger.info("👋 Shutting down…")


# ── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Stock Sentiment Analyzer — AI Microservice",
    description=(
        "Fetches recent financial news articles for a given stock ticker. "
        "Uses NewsAPI.org as the primary source with a BeautifulSoup "
        "web-scraper fallback."
    ),
    version="2.0.0",
    lifespan=lifespan,
    responses={
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)

# Phase 7: Restrict CORS to configured origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def root():
    """Health-check / landing endpoint."""
    return {
        "service": "Stock Sentiment Analyzer — AI Microservice",
        "version": "2.0.0",
        "status": "healthy",
        "docs": "/docs",
    }


@app.get(
    "/api/news/{ticker}",
    response_model=NewsResponse,
    tags=["News"],
    summary="Get news articles for a stock ticker",
    responses={
        200: {"description": "List of news articles"},
        404: {"model": ErrorResponse, "description": "No articles found"},
    },
)
async def get_news(
    ticker: str,
    page_size: int = Query(
        default=DEFAULT_PAGE_SIZE,
        ge=1,
        le=MAX_PAGE_SIZE,
        description="Maximum number of articles to return",
    ),
    source: str = Query(
        default="auto",
        description="Data source: 'newsapi', 'scraper', or 'auto' (try NewsAPI first, fall back to scraper)",
    ),
):
    """
    Fetch recent news articles related to a stock ticker.

    - **ticker** — Stock symbol (e.g. `AAPL`, `GOOGL`, `TSLA`)
    - **page_size** — Max results (1–50, default 15)
    - **source** — Force a specific data source or let the service choose
    """
    ticker_upper = ticker.upper().strip()

    # Phase 7: Validate ticker format
    if not TICKER_REGEX.match(ticker_upper):
        raise HTTPException(
            status_code=422,
            detail="Ticker must be 1-5 uppercase letters (e.g. AAPL, TSLA).",
        )

    # Phase 5: Check response cache
    cached = _get_cached_response(ticker_upper, page_size, source)
    if cached is not None:
        return cached

    company = TICKER_COMPANY_MAP.get(ticker_upper)
    articles = []
    source_used = ""

    try:
        # ── Strategy: NewsAPI first, scraper fallback ────────────────────
        if source in ("newsapi", "auto"):
            articles = await fetch_news_from_newsapi(
                ticker_upper, page_size, client=_http_client
            )
            if articles:
                source_used = "newsapi"

        if not articles and source in ("scraper", "auto"):
            articles = await scrape_news(
                ticker_upper, page_size, client=_http_client
            )
            if articles:
                source_used = "scraper"

        # ── Force a specific source ──────────────────────────────────────
        if source == "newsapi" and not articles:
            source_used = "newsapi"
        elif source == "scraper" and not articles:
            source_used = "scraper"

        if not articles:
            raise HTTPException(
                status_code=404,
                detail=f"No news articles found for ticker '{ticker_upper}'. "
                       f"Try a different ticker or check back later.",
            )

        # ── Phase 5: Batch sentiment analysis (async, non-blocking) ──────
        texts_to_analyze = [
            f"{article.title}. {article.description or ''}" for article in articles
        ]
        sentiments = await get_sentiment_scores_batch_async(texts_to_analyze)

        for article, sentiment in zip(articles, sentiments):
            article.sentiment_score = sentiment["score"]
            article.sentiment_label = sentiment["label"]

        response_data = NewsResponse(
            ticker=ticker_upper,
            company=company,
            total_results=len(articles),
            source_used=source_used,
            articles=articles,
        )

        # Cache the response
        _set_cached_response(ticker_upper, page_size, source, response_data)

        return response_data

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unhandled error for ticker=%s", ticker_upper)
        raise HTTPException(status_code=500, detail=str(exc))


@app.get(
    "/api/tickers",
    tags=["Utilities"],
    summary="List known ticker → company mappings",
)
async def list_tickers():
    """Return the pre-configured ticker-to-company-name map."""
    return {
        "count": len(TICKER_COMPANY_MAP),
        "tickers": TICKER_COMPANY_MAP,
    }


# ── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=int(PORT), reload=True)
