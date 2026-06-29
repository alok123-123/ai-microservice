"""
Web-scraping fallback service using BeautifulSoup.

Used when the NewsAPI key is missing or the NewsAPI returns no results.
Scrapes Google News RSS and Yahoo Finance for headlines related to a ticker.
"""

import logging
from datetime import datetime, timezone

import httpx
from bs4 import BeautifulSoup

from config import TICKER_COMPANY_MAP
from models.schemas import NewsArticle

logger = logging.getLogger(__name__)

# ── Google News RSS ──────────────────────────────────────────────────────────

GOOGLE_NEWS_RSS = "https://news.google.com/rss/search"
YAHOO_FINANCE_URL = "https://finance.yahoo.com/quote/{ticker}/news/"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

MIN_TITLE_LENGTH = 15


async def _scrape_google_news_rss(
    ticker: str,
    max_articles: int = 15,
    client: httpx.AsyncClient | None = None,
) -> list[NewsArticle]:
    """Parse Google News RSS feed for stock-related headlines."""

    ticker_upper = ticker.upper()
    company = TICKER_COMPANY_MAP.get(ticker_upper, ticker_upper)
    query = f"{company} stock"

    params = {
        "q": query,
        "hl": "en-US",
        "gl": "US",
        "ceid": "US:en",
    }

    try:
        if client:
            resp = await client.get(GOOGLE_NEWS_RSS, params=params)
        else:
            async with httpx.AsyncClient(timeout=15.0, headers=HEADERS, follow_redirects=True) as temp:
                resp = await temp.get(GOOGLE_NEWS_RSS, params=params)

        if resp.status_code != 200:
            logger.warning("Google News RSS returned %s", resp.status_code)
            return []

        soup = BeautifulSoup(resp.text, "lxml-xml")          # XML parser for RSS
        items = soup.find_all("item", limit=max_articles)

        articles: list[NewsArticle] = []
        for item in items:
            title_tag = item.find("title")
            link_tag = item.find("link")
            pub_date_tag = item.find("pubDate")
            source_tag = item.find("source")

            if not title_tag or not title_tag.text:
                continue

            # Convert pubDate (RFC 822) → ISO 8601
            published_at = None
            if pub_date_tag and pub_date_tag.text:
                try:
                    dt = datetime.strptime(
                        pub_date_tag.text.strip(), "%a, %d %b %Y %H:%M:%S %Z"
                    )
                    published_at = dt.replace(tzinfo=timezone.utc).isoformat()
                except ValueError:
                    published_at = pub_date_tag.text.strip()

            articles.append(
                NewsArticle(
                    title=title_tag.text.strip(),
                    description=None,              # RSS items rarely have a summary
                    source=source_tag.text.strip() if source_tag else "Google News",
                    url=link_tag.text.strip() if link_tag else "",
                    published_at=published_at,
                    image_url=None,
                )
            )

        logger.info("Google News RSS returned %d articles for ticker=%s", len(articles), ticker_upper)
        return articles

    except httpx.TimeoutException:
        logger.error("Google News RSS timed out for ticker=%s", ticker)
        return []
    except Exception:
        logger.exception("Error scraping Google News RSS for ticker=%s", ticker)
        return []


# ── Yahoo Finance ────────────────────────────────────────────────────────────

async def _scrape_yahoo_finance(
    ticker: str,
    max_articles: int = 15,
    client: httpx.AsyncClient | None = None,
) -> list[NewsArticle]:
    """Scrape Yahoo Finance news page for a given ticker."""

    ticker_upper = ticker.upper()
    url = YAHOO_FINANCE_URL.format(ticker=ticker_upper)

    try:
        if client:
            resp = await client.get(url)
        else:
            async with httpx.AsyncClient(timeout=15.0, headers=HEADERS, follow_redirects=True) as temp:
                resp = await temp.get(url)

        if resp.status_code != 200:
            logger.warning("Yahoo Finance returned %s for %s", resp.status_code, ticker_upper)
            return []

        soup = BeautifulSoup(resp.text, "lxml")
        articles: list[NewsArticle] = []

        # Yahoo Finance renders news items in <h3> tags inside the news section
        # We look for links within the news stream
        news_links = soup.select("a[href*='/news/']")
        seen_titles: set[str] = set()

        for link in news_links:
            title = link.get_text(strip=True)
            href = link.get("href", "")

            if not title or len(title) < MIN_TITLE_LENGTH or title in seen_titles:
                continue
            seen_titles.add(title)

            # Make relative URLs absolute
            if href.startswith("/"):
                href = f"https://finance.yahoo.com{href}"

            articles.append(
                NewsArticle(
                    title=title,
                    description=None,
                    source="Yahoo Finance",
                    url=href,
                    published_at=None,
                    image_url=None,
                )
            )

            if len(articles) >= max_articles:
                break

        logger.info("Yahoo Finance returned %d articles for ticker=%s", len(articles), ticker_upper)
        return articles

    except httpx.TimeoutException:
        logger.error("Yahoo Finance timed out for ticker=%s", ticker_upper)
        return []
    except Exception:
        logger.exception("Error scraping Yahoo Finance for ticker=%s", ticker_upper)
        return []


# ── Public interface ─────────────────────────────────────────────────────────

async def scrape_news(
    ticker: str,
    max_articles: int = 15,
    client: httpx.AsyncClient | None = None,
) -> list[NewsArticle]:
    """
    Try Google News RSS first, then Yahoo Finance as a fallback.

    Returns the merged, deduplicated list of articles (up to *max_articles*).
    """
    articles = await _scrape_google_news_rss(ticker, max_articles, client=client)

    if len(articles) < 3:
        logger.info("Google News RSS yielded few results, trying Yahoo Finance…")
        yahoo_articles = await _scrape_yahoo_finance(ticker, max_articles, client=client)

        # Deduplicate by title
        existing_titles = {a.title.lower() for a in articles}
        for art in yahoo_articles:
            if art.title.lower() not in existing_titles:
                articles.append(art)
                existing_titles.add(art.title.lower())

    return articles[:max_articles]
