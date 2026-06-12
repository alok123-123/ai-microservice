"""
Application configuration loaded from environment variables.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ── NewsAPI.org ──────────────────────────────────────────────────────────────
NEWS_API_KEY: str = os.getenv("NEWS_API_KEY", "")
NEWS_API_BASE_URL: str = "https://newsapi.org/v2"

# ── Server ───────────────────────────────────────────────────────────────────
HOST: str = os.getenv("HOST", "0.0.0.0")
PORT: int = int(os.getenv("PORT", "8000"))

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
