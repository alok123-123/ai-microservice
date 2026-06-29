const express = require('express');
const router = express.Router();
const axios = require('axios');
const Sentiment = require('../models/Sentiment');
const auth = require('../middleware/auth');
const config = require('../config');
const { calculateWeightedSentiment } = require('../utils/sentimentAggregator');
const { ValidationError, NotFoundError, ExternalServiceError } = require('../utils/errors');

const TICKER_REGEX = /^[A-Z]{1,5}$/;

// Get historical sentiment for a ticker
router.get('/:ticker', async (req, res, next) => {
  try {
    const ticker = req.params.ticker.toUpperCase();

    if (!TICKER_REGEX.test(ticker)) {
      throw new ValidationError('Ticker must be 1-5 uppercase letters (e.g. AAPL, TSLA).');
    }

    const limit = parseInt(req.query.limit) || 30;

    const sentiments = await Sentiment.find({ ticker })
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    if (sentiments.length > 0) {
      const { getRealTimePrice } = require('../services/marketData');
      const marketData = await getRealTimePrice(ticker);
      if (marketData) {
        sentiments[0].marketData = marketData;
      }
    }

    res.json(sentiments);
  } catch (err) {
    next(err);
  }
});

// Trigger an immediate manual fetch (protected — requires auth)
router.post('/fetch/:ticker', auth, async (req, res, next) => {
  try {
    const ticker = req.params.ticker.toUpperCase();

    if (!TICKER_REGEX.test(ticker)) {
      throw new ValidationError('Ticker must be 1-5 uppercase letters (e.g. AAPL, TSLA).');
    }

    let response;
    try {
      response = await axios.get(`${config.PYTHON_API_URL}/api/news/${ticker}`);
    } catch (err) {
      throw new ExternalServiceError('AI Microservice', err);
    }

    const data = response.data;

    if (!data.articles || data.articles.length === 0) {
      throw new NotFoundError(`Articles for ticker ${ticker}`);
    }

    // Phase 2: Weighted aggregation with explainability
    const aggregation = calculateWeightedSentiment(
      data.articles,
      ticker,
      data.company || ''
    );

    const sentimentRecord = new Sentiment({
      ticker,
      date: new Date(),
      averageScore: aggregation.weightedScore,
      totalArticles: aggregation.totalArticles,
      articles: aggregation.articles,
      explainability: aggregation.explainability,
    });

    await sentimentRecord.save();

    const { getRealTimePrice } = require('../services/marketData');
    const marketData = await getRealTimePrice(ticker);

    const responseObject = sentimentRecord.toObject();
    if (marketData) {
      responseObject.marketData = marketData;
    }

    res.json(responseObject);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
