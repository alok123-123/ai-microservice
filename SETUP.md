# Setup Guide — AI Stock Sentiment Analyzer

## Prerequisites

- **Node.js** 18+ (for Express backend and React frontend)
- **Python** 3.10+ (for FastAPI AI microservice)
- **MongoDB** 6+ (local or cloud instance, e.g. MongoDB Atlas)
- **pip** (Python package manager)

## 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-microservice-master
```

## 2. AI Microservice (FastAPI)

```bash
cd ai-microservice

# Create and activate a virtual environment (recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — add your NewsAPI.org key (get one free at https://newsapi.org/register)

# Start the server
uvicorn main:app --reload
```

The server starts on `http://localhost:8000`. Visit `http://localhost:8000/docs` for Swagger UI.

> **Note:** On first run, FinBERT downloads a ~400MB model. If the download fails or your machine lacks memory, the service gracefully falls back to VADER sentiment analysis.

## 3. Express Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — update MONGODB_URI if using a remote database

# Start the server
npm start
```

The server starts on `http://localhost:5000`.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Server port |
| `MONGODB_URI` | Yes (prod) | `mongodb://localhost:27017/stock-sentiment` | MongoDB connection string |
| `JWT_SECRET` | Yes (prod) | Auto-generated in dev | JWT signing secret |
| `PYTHON_API_URL` | Yes (prod) | `http://127.0.0.1:8000` | FastAPI microservice URL |
| `CORS_ORIGINS` | No | `http://localhost:5173,http://localhost:3000` | Allowed frontend origins |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per 15 minutes |
| `AUTH_RATE_LIMIT_MAX` | No | `20` | Max auth requests per 15 minutes |

## 4. React Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app opens at `http://localhost:5173`.

To point at a different backend, create a `.env` file:
```
VITE_API_BASE=http://your-backend:5000/api
```

## 5. Verify Everything Works

1. Ensure MongoDB is running locally (or your Atlas cluster is reachable)
2. Start the AI microservice (port 8000)
3. Start the Express backend (port 5000)
4. Start the React frontend (port 5173)
5. Register a new account in the UI
6. Add a stock ticker (e.g. AAPL) to your watchlist
7. Click on it — sentiment analysis should load

## Production Deployment Notes

- Set `NODE_ENV=production` for the Express backend
- Generate a strong, unique `JWT_SECRET` (e.g. `openssl rand -base64 32`)
- Use a production MongoDB instance with authentication
- Configure `CORS_ORIGINS` to your actual frontend domain
- Consider running the FastAPI service behind a reverse proxy (nginx)
- Set `NEWS_API_KEY` for reliable news data (free tier: 100 req/day)
