# Architecture — AI Stock Sentiment Analyzer

## System Overview

```
┌─────────────────────┐
│   React Frontend    │  Port 5173 (Vite dev)
│   (Vite + Tailwind) │
└────────┬────────────┘
         │ HTTP (REST)
         ▼
┌─────────────────────┐
│  Express Backend    │  Port 5000
│  (Node.js)          │
│  ├─ Auth (JWT)      │
│  ├─ Watchlist CRUD  │
│  ├─ Sentiment Store │
│  ├─ Analytics       │
│  └─ Cron Job        │
└───┬─────────┬───────┘
    │         │
    ▼         ▼
┌────────┐  ┌──────────────────┐
│MongoDB │  │ FastAPI           │  Port 8000
│        │  │ AI Microservice   │
└────────┘  │ ├─ NewsAPI.org    │
            │ ├─ Web Scraper    │
            │ └─ FinBERT/VADER  │
            └──────────────────┘
```

## Component Details

### Frontend (React + Vite)
- **Framework**: React 19 with Vite 8
- **Styling**: Tailwind CSS 3 with custom glassmorphism components
- **State**: React Context (AuthContext) + component-level state
- **Charts**: Chart.js via react-chartjs-2
- **Key Components**: Dashboard, Watchlist, SentimentChart, SentimentBreakdown, NewsFeed

### Backend (Express)
- **Runtime**: Node.js with Express 5
- **Database**: MongoDB via Mongoose 9
- **Auth**: JWT-based (bcrypt password hashing)
- **Security**: Helmet, express-rate-limit, CORS whitelist
- **Scheduling**: node-cron for daily sentiment aggregation
- **Error Handling**: Custom error class hierarchy + global error middleware

### AI Microservice (FastAPI)
- **Framework**: FastAPI with uvicorn
- **Primary NLP**: FinBERT (ProsusAI/finbert) — financial sentiment transformer
- **Fallback NLP**: VADER — lexicon-based sentiment analyzer
- **News Sources**: NewsAPI.org (primary), Google News RSS + Yahoo Finance scraping (fallback)
- **Performance**: Batch inference, TTL caching, shared HTTP connection pooling

## Data Flow

1. User adds a stock ticker to their watchlist
2. Dashboard requests sentiment data from Express
3. If no data exists, Express triggers a fetch:
   - Express calls FastAPI `/api/news/{ticker}`
   - FastAPI fetches news from NewsAPI.org or web scrapers
   - FinBERT/VADER analyzes each article's sentiment
   - Results returned to Express
4. Express computes **weighted aggregate sentiment** using:
   - Source credibility (Reuters > Unknown blog)
   - Article recency (today > last week)
   - Model confidence (high |score| > low |score|)
   - Duplicate detection (Jaccard similarity)
   - Relevance filtering (mentions ticker/company)
5. Express stores the record in MongoDB with explainability metadata
6. Frontend renders charts, analytics, and explainability details

## Database Schema

### Users
```
{ name, email, password (hashed), createdAt }
Index: { email: 1 } (unique)
```

### Stocks (Watchlist)
```
{ ticker, companyName, userId, sentimentAlertThreshold, addedAt }
Index: { userId: 1, ticker: 1 } (unique)
```

### Sentiments
```
{ ticker, date, averageScore, totalArticles, articles[], explainability{} }
Index: { ticker: 1, date: -1 }
```
