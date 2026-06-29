# API Documentation

## Express Backend (Port 5000)

### Authentication

#### `POST /api/auth/register`
Create a new user account.

**Body:**
```json
{ "name": "John Doe", "email": "john@example.com", "password": "secret123" }
```

**Response (201):**
```json
{ "token": "jwt...", "user": { "id": "...", "name": "John Doe", "email": "john@example.com", "createdAt": "..." } }
```

#### `POST /api/auth/login`
Authenticate and receive a JWT token.

**Body:**
```json
{ "email": "john@example.com", "password": "secret123" }
```

**Response (200):** Same format as register.

#### `GET /api/auth/me` 🔒
Get the currently authenticated user.

**Headers:** `Authorization: Bearer <token>`

---

### Watchlist (all routes require auth 🔒)

#### `GET /api/watchlist`
List all stocks in the authenticated user's watchlist.

#### `POST /api/watchlist`
Add a stock to the watchlist.

**Body:**
```json
{ "ticker": "AAPL", "companyName": "Apple" }
```

#### `DELETE /api/watchlist/:ticker`
Remove a stock from the watchlist.

#### `PUT /api/watchlist/threshold/:ticker`
Set a sentiment alert threshold.

**Body:**
```json
{ "sentimentAlertThreshold": -0.2 }
```

#### `GET /api/watchlist/tickers`
Get all known ticker → company name mappings from the AI microservice.

---

### Sentiment

#### `GET /api/sentiment/:ticker`
Get historical sentiment records for a ticker.

**Query params:** `limit` (default: 30)

#### `POST /api/sentiment/fetch/:ticker` 🔒
Trigger an immediate sentiment fetch and analysis.

**Response includes:**
```json
{
  "ticker": "AAPL",
  "date": "2024-01-15T00:00:00.000Z",
  "averageScore": 0.3421,
  "totalArticles": 12,
  "articles": [...],
  "explainability": {
    "topPositiveArticles": [...],
    "topNegativeArticles": [...],
    "strongestContributors": [...],
    "confidence": 0.7234,
    "overallLabel": "Positive",
    "breakdown": {
      "positivePercent": 58.33,
      "negativePercent": 16.67,
      "neutralPercent": 25.0,
      "positiveCount": 7,
      "negativeCount": 2,
      "neutralCount": 3
    }
  }
}
```

---

### Analytics

#### `GET /api/analytics/:ticker`
Get computed trend metrics for a ticker.

**Query params:** `limit` (default: 30, max historical records)

**Response:**
```json
{
  "ticker": "AAPL",
  "dataPoints": 15,
  "latestScore": 0.3421,
  "dailyChange": 0.0523,
  "trend7d": 0.0312,
  "trend30d": 0.0089,
  "sma7": 0.2891,
  "volatility": 0.1234,
  "highestPositiveDay": { "score": 0.8123, "date": "..." },
  "highestNegativeDay": { "score": -0.4521, "date": "..." }
}
```

---

### Health

#### `GET /api/health`
Health check endpoint.

---

## FastAPI AI Microservice (Port 8000)

Interactive docs available at `http://localhost:8000/docs` (Swagger UI).

#### `GET /`
Health check.

#### `GET /api/news/{ticker}`
Fetch and analyze news articles.

**Query params:**
- `page_size` (1-50, default: 15)
- `source` ("auto", "newsapi", "scraper")

#### `GET /api/tickers`
List known ticker → company mappings.

---

## Error Response Format

All errors follow a consistent envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ticker must be 1-5 uppercase letters.",
    "requestId": "a1b2c3d4-..."
  }
}
```

Error codes: `VALIDATION_ERROR`, `AUTH_ERROR`, `NOT_FOUND`, `CONFLICT`, `EXTERNAL_SERVICE_ERROR`, `RATE_LIMIT`, `INTERNAL_ERROR`.
