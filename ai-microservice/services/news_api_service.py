"""
NewsAPI.org integration service.

Primary data source — uses the /v2/everything endpoint to fetch recent
English-language news articles related to a given stock ticker.
"""

import logging
from datetime import datetime, timedelta, timezone

import httpx

from config import NEWS_API_KEY, NEWS_API_BASE_URL, TICKER_COMPANY_MAP, DEFAULT_DAYS_BACK
from models.schemas import NewsArticle

logger = logging.getLogger(__name__)


async def fetch_news_from_newsapi(
    ticker: str,
    page_size: int = 15,
    days_back: int = DEFAULT_DAYS_BACK,
    client: httpx.AsyncClient | None = None,
) -> list[NewsArticle]:
    """
    Fetch news articles for *ticker* from NewsAPI.org.

    Parameters
    ----------
    ticker : str
        Stock ticker symbol (e.g. "AAPL").
    page_size : int
        Max number of articles to return (NewsAPI caps free-tier at 100).
    days_back : int
        How far back (in days) to search.
    client : httpx.AsyncClient | None
        Optional shared HTTP client for connection pooling.

    Returns
    -------
    list[NewsArticle]
        Parsed articles; empty list on failure.
    """
    if not NEWS_API_KEY:
        logger.warning("NEWS_API_KEY is not set — skipping NewsAPI source.")
        return []

    ticker_upper = ticker.upper()
    # Use the human-readable company name for better search results,
    # but also include the ticker itself for precision.
    company = TICKER_COMPANY_MAP.get(ticker_upper)
    query = f'"{ticker_upper}" OR "{company}"' if company else f'"{ticker_upper}"'

    from_date = (
        datetime.now(timezone.utc) - timedelta(days=days_back)
    ).strftime("%Y-%m-%d")

    params = {
        "q": query,
        "from": from_date,
        "sortBy": "publishedAt",
        "pageSize": min(page_size, 100),
        "language": "en",
        "apiKey": NEWS_API_KEY,
    }

    try:
        # Phase 5: Use shared client if provided, otherwise create a temporary one
        if client:
            resp = await client.get(f"{NEWS_API_BASE_URL}/everything", params=params)
        else:
            async with httpx.AsyncClient(timeout=15.0) as temp_client:
                resp = await temp_client.get(f"{NEWS_API_BASE_URL}/everything", params=params)

        if resp.status_code != 200:
            body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
            logger.error(
                "NewsAPI returned %s: %s", resp.status_code, body.get("message", resp.text[:200])
            )
            return []

        data = resp.json()
        articles: list[NewsArticle] = []

        for item in data.get("articles", []):
            # NewsAPI sometimes returns "[Removed]" placeholder articles
            if item.get("title") in (None, "", "[Removed]"):
                continue

            articles.append(
                NewsArticle(
                    title=item["title"],
                    description=item.get("description"),
                    source=item.get("source", {}).get("name", "Unknown"),
                    url=item.get("url", ""),
                    published_at=item.get("publishedAt"),
                    image_url=item.get("urlToImage"),
                )
            )

        logger.info("NewsAPI returned %d articles for ticker=%s", len(articles), ticker_upper)
        return articles

    except httpx.TimeoutException:
        logger.error("NewsAPI request timed out for ticker=%s", ticker_upper)
        return []
    except Exception:
        logger.exception("Unexpected error fetching from NewsAPI for ticker=%s", ticker_upper)
        return []
