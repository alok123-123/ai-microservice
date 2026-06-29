const config = require('./config'); // Phase 7: centralized config (loads dotenv)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

// Phase 8: middleware
const requestId = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user'); // Phase 12
const watchlistRoutes = require('./routes/watchlist');
const sentimentRoutes = require('./routes/sentiment');
const analyticsRoutes = require('./routes/analytics'); // Phase 4
const marketsRoutes = require('./routes/markets'); // Phase 12
const reportsRoutes = require('./routes/reports'); // Phase 12

// Import cron job (side-effect: registers the scheduled task)
require('./cron/sentimentJob');

const app = express();

// ── Security middleware ─────────────────────────────────────────────────────

// Phase 8: Unique request ID on every request
app.use(requestId);

// Phase 7: HTTP security headers
app.use(helmet());

// Phase 7: CORS — restrict to configured origins instead of wildcard
app.use(cors({
  origin: config.CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Phase 7: Limit request body size
app.use(express.json({ limit: '10kb' }));

// Phase 7: Rate limiting
let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch {
  // express-rate-limit may not be installed yet; skip gracefully in dev
  rateLimit = null;
}

if (rateLimit) {
  // General rate limit
  app.use(rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMIT', message: 'Too many requests. Please try again later.' } },
  }));

  // Stricter limit on auth endpoints
  app.use('/api/auth', rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMIT', message: 'Too many authentication attempts. Please try again later.' } },
  }));
}

// ── MongoDB Connection ──────────────────────────────────────────────────────

mongoose.connect(config.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Fail fast — no point running without DB
  });

// ── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); // Phase 12
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/sentiment', sentimentRoutes);
app.use('/api/analytics', analyticsRoutes); // Phase 4
app.use('/api/markets', marketsRoutes); // Phase 12
app.use('/api/reports', reportsRoutes); // Phase 12

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Stock Sentiment Backend',
    requestId: req.requestId,
  });
});

// ── Phase 8: Global error handler (must be AFTER all routes) ────────────────
app.use(errorHandler);

// ── Start server ────────────────────────────────────────────────────────────

app.listen(config.PORT, () => {
  console.log(`🚀 Server running on port ${config.PORT} (${config.NODE_ENV})`);
});
