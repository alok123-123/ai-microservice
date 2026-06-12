"""
AI-Powered Stock Market Sentiment Analyzer — Data Acquisition Microservice

Week 1 deliverable: FastAPI server that fetches financial news articles
for a given stock ticker using NewsAPI.org (primary) and BeautifulSoup
web scraping (fallback).

Run with:
    uvicorn main:app --reload
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import HOST, PORT, NEWS_API_KEY, TICKER_COMPANY_MAP
from models.schemas import NewsResponse, ErrorResponse
from services.news_api_service import fetch_news_from_newsapi
from services.scraper_service import scrape_news
from services.sentiment_service import get_sentiment_score

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(name)s │ %(message)s",
)
logger = logging.getLogger(__name__)


# ── Application lifecycle ────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 AI Sentiment Microservice starting…")
    if NEWS_API_KEY:
        logger.info("✅ NEWS_API_KEY detected — NewsAPI.org is the primary source.")
    else:
        logger.warning(
            "⚠️  NEWS_API_KEY not set — will use web-scraping fallback only. "
            "Get a free key at https://newsapi.org/register"
        )
    yield
    logger.info("👋 Shutting down…")


# ── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Stock Sentiment Analyzer — AI Microservice",
    description=(
        "Fetches recent financial news articles for a given stock ticker. "
        "Uses NewsAPI.org as the primary source with a BeautifulSoup "
        "web-scraper fallback."
    ),
    version="1.0.0",
    lifespan=lifespan,
    responses={
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)

# Allow the Node.js backend (and local dev frontends) to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def root():
    """Health-check / landing endpoint."""
    return {
        "service": "Stock Sentiment Analyzer — AI Microservice",
        "version": "1.0.0",
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
        default=15,
        ge=1,
        le=50,
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
    company = TICKER_COMPANY_MAP.get(ticker_upper)
    articles = []
    source_used = ""

    try:
        # ── Strategy: NewsAPI first, scraper fallback ────────────────────
        if source in ("newsapi", "auto"):
            articles = await fetch_news_from_newsapi(ticker_upper, page_size)
            if articles:
                source_used = "newsapi"

        if not articles and source in ("scraper", "auto"):
            articles = await scrape_news(ticker_upper, page_size)
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

        # ── Apply sentiment analysis ───────────────────────────────────────
        for article in articles:
            text_to_analyze = f"{article.title}. {article.description or ''}"
            sentiment = get_sentiment_score(text_to_analyze)
            article.sentiment_score = sentiment["score"]
            article.sentiment_label = sentiment["label"]

        return NewsResponse(
            ticker=ticker_upper,
            company=company,
            total_results=len(articles),
            source_used=source_used,
            articles=articles,
        )

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
