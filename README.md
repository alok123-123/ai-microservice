🧠 AI-Powered Stock Market Sentiment Analyzer — AI Microservice
Week 1 Deliverable: Data Acquisition Microservice built with Python + FastAPI

This microservice fetches recent financial news articles for a given stock ticker symbol. It serves as the AI backbone of the Sentiment Analyzer project.

🏗️ Architecture
┌──────────────────────────────────────────────┐
│            FastAPI Microservice              │
│                                              │
│  GET /api/news/{ticker}                      │
│      │                                       │
│      ├── 1. Try NewsAPI.org (primary)        │
│      │      └── /v2/everything               │
│      │                                       │
│      └── 2. Fallback: Web Scraping           │
│             ├── Google News RSS              │
│             └── Yahoo Finance                │
│                                              │
│  GET /api/tickers                            │
│      └── List known ticker mappings          │
└──────────────────────────────────────────────┘
⚡ Quick Start
1. Create & activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
2. Install dependencies
pip install -r requirements.txt
3. Configure environment
cp .env.example .env
# Edit .env and add your NewsAPI key (optional — scraper works without it)
4. Run the server
uvicorn main:app --reload
The server starts at http://localhost:8000. Interactive API docs available at http://localhost:8000/docs.

📡 API Endpoints
GET /api/news/{ticker}
Fetch recent news articles for a stock ticker.

Parameter	Type	Default	Description
ticker	path	—	Stock symbol (e.g. AAPL, GOOGL, TSLA)
page_size	query	15	Max articles to return (1–50)
source	query	auto	newsapi, scraper, or auto
Example:

curl http://localhost:8000/api/news/AAPL?page_size=5
Response:

{
  "ticker": "AAPL",
  "company": "Apple",
  "total_results": 5,
  "source_used": "newsapi",
  "articles": [
    {
      "title": "Apple Reports Record Revenue...",
      "description": "...",
      "source": "Bloomberg",
      "url": "https://...",
      "published_at": "2026-06-12T10:00:00Z",
      "image_url": "https://..."
    }
  ]
}
GET /api/tickers
List all pre-configured ticker → company name mappings.

GET /
Health check endpoint.

🔑 NewsAPI Key (Optional)
Register at https://newsapi.org/register
Add your key to .env:
NEWS_API_KEY=49b6db216c3f4ad29860c1b2d430c7ac
Without a key, the service automatically falls back to web scraping (Google News RSS + Yahoo Finance).

📁 Project Structure
ai-microservice/
├── main.py                  # FastAPI application entry point
├── config.py                # Environment config & ticker mappings
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variable template
├── .env                     # Your local config (git-ignored)
├── models/
│   ├── __init__.py
│   └── schemas.py           # Pydantic request/response models
└── services/
    ├── __init__.py
    ├── news_api_service.py  # NewsAPI.org integration
    └── scraper_service.py   # BeautifulSoup web scraper fallback
🛠️ Tech Stack
Python 3.11+
FastAPI — async web framework with auto-generated OpenAPI docs
httpx — async HTTP client
BeautifulSoup4 — HTML/XML parsing for web scraping
Pydantic — data validation and serialization
