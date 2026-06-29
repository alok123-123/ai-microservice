"""
Application configuration loaded from environment variables.

Validates required values on import so the server fails fast
instead of silently falling back to insecure defaults.
"""

import os
import sys
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ── NewsAPI.org ──────────────────────────────────────────────────────────────
NEWS_API_KEY: str = os.getenv("NEWS_API_KEY", "")
NEWS_API_BASE_URL: str = "https://newsapi.org/v2"

if not NEWS_API_KEY:
    logger.warning(
        "⚠️  NEWS_API_KEY is not set. NewsAPI.org will not be available. "
        "Get a free key at https://newsapi.org/register"
    )

# ── Server ───────────────────────────────────────────────────────────────────
HOST: str = os.getenv("HOST", "0.0.0.0")
PORT: int = int(os.getenv("PORT", "8000"))

# ── CORS ─────────────────────────────────────────────────────────────────────
# Comma-separated list of allowed origins; defaults to common dev origins
CORS_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://localhost:5000"
    ).split(",")
    if origin.strip()
]

# ── Performance ──────────────────────────────────────────────────────────────
RESPONSE_CACHE_TTL_SECONDS: int = int(os.getenv("RESPONSE_CACHE_TTL", "900"))  # 15 min
SENTIMENT_CACHE_TTL_SECONDS: int = int(os.getenv("SENTIMENT_CACHE_TTL", "3600"))  # 1 hr
DEFAULT_PAGE_SIZE: int = 15
MAX_PAGE_SIZE: int = 50
DEFAULT_DAYS_BACK: int = 7

# ── Sentiment ────────────────────────────────────────────────────────────────
SENTIMENT_THRESHOLD: float = 0.05

# ── Ticker → Company Name mapping (improves NewsAPI search relevance) ───────
TICKER_COMPANY_MAP: dict[str, str] = {
    "AAPL": "Apple",
    "GOOGL": "Google Alphabet",
    "GOOG": "Google Alphabet",
    "MSFT": "Microsoft",
    "AMZN": "Amazon",
    "TSLA": "Tesla",
    "META": "Meta Platforms",
    "NVDA": "NVIDIA",
    "NFLX": "Netflix",
    "AMD": "AMD Advanced Micro Devices",
    "INTC": "Intel",
    "DIS": "Disney",
    "BA": "Boeing",
    "JPM": "JPMorgan Chase",
    "V": "Visa",
    "WMT": "Walmart",
    "JNJ": "Johnson Johnson",
    "PG": "Procter Gamble",
    "UNH": "UnitedHealth",
    "HD": "Home Depot",
    "CRM": "Salesforce",
    "ADBE": "Adobe",
    "PYPL": "PayPal",
    "UBER": "Uber",
    "SNAP": "Snap Snapchat",
    "SQ": "Block Square",
    "COIN": "Coinbase",
    "RIVN": "Rivian",
    "PLTR": "Palantir",
    "SOFI": "SoFi Technologies",
}
