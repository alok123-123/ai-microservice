require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import routes
const authRoutes = require('./routes/auth');
const watchlistRoutes = require('./routes/watchlist');
const sentimentRoutes = require('./routes/sentiment');

// Import cron job
require('./cron/sentimentJob');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stock-sentiment')
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/sentiment', sentimentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Stock Sentiment Backend' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
