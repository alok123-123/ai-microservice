/**
 * Analytics API route.
 *
 * GET /api/analytics/:ticker — returns computed trend metrics.
 */

const express = require('express');
const router = express.Router();
const { computeAnalytics } = require('../utils/analyticsService');
const { ValidationError } = require('../utils/errors');

const TICKER_REGEX = /^[A-Z]{1,5}$/;

router.get('/:ticker', async (req, res, next) => {
  try {
    const ticker = req.params.ticker.toUpperCase();

    if (!TICKER_REGEX.test(ticker)) {
      throw new ValidationError('Ticker must be 1-5 uppercase letters (e.g. AAPL, TSLA).');
    }

    const limit = parseInt(req.query.limit) || 30;
    const analytics = await computeAnalytics(ticker, limit);

    res.json(analytics);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
