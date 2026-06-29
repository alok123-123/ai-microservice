const express = require('express');
const router = express.Router();
const axios = require('axios');
const Stock = require('../models/Stock');
const auth = require('../middleware/auth');
const config = require('../config');
const { ValidationError, NotFoundError, ConflictError, ExternalServiceError } = require('../utils/errors');

const TICKER_REGEX = /^[A-Z]{1,5}$/;

// All routes require authentication
router.use(auth);

// GET all available stock ticker mappings from Python microservice
router.get('/tickers', async (req, res, next) => {
  try {
    const response = await axios.get(`${config.PYTHON_API_URL}/api/tickers`);
    res.json(response.data);
  } catch (err) {
    next(new ExternalServiceError('AI Microservice', err));
  }
});

// GET all watched stocks for the authenticated user
router.get('/', async (req, res, next) => {
  try {
    const stocks = await Stock.find({ userId: req.user._id }).sort({ addedAt: -1 });
    res.json(stocks);
  } catch (err) {
    next(err);
  }
});

// POST add a new stock to watchlist
router.post('/', async (req, res, next) => {
  try {
    const { ticker, companyName } = req.body;

    if (!ticker || typeof ticker !== 'string') {
      throw new ValidationError('Ticker is required and must be a string.');
    }

    const tickerUpper = ticker.toUpperCase().trim();

    if (!TICKER_REGEX.test(tickerUpper)) {
      throw new ValidationError('Ticker must be 1-5 uppercase letters (e.g. AAPL, TSLA).');
    }

    const existingStock = await Stock.findOne({
      ticker: tickerUpper,
      userId: req.user._id,
    });
    if (existingStock) {
      throw new ConflictError('Stock is already in your watchlist.');
    }

    const stock = new Stock({
      ticker: tickerUpper,
      companyName: companyName ? String(companyName).trim() : undefined,
      userId: req.user._id,
    });
    await stock.save();
    res.status(201).json(stock);
  } catch (err) {
    next(err);
  }
});

// DELETE stock from watchlist
router.delete('/:ticker', async (req, res, next) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const result = await Stock.findOneAndDelete({ ticker, userId: req.user._id });

    if (!result) {
      throw new NotFoundError(`Stock ${ticker} in watchlist`);
    }

    res.json({ message: 'Stock removed from watchlist' });
  } catch (err) {
    next(err);
  }
});

// PUT update alert threshold for a stock
router.put('/threshold/:ticker', async (req, res, next) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const { sentimentAlertThreshold } = req.body;

    // Validate threshold range if provided
    if (sentimentAlertThreshold !== '' && sentimentAlertThreshold != null) {
      const num = parseFloat(sentimentAlertThreshold);
      if (isNaN(num) || num < -1 || num > 1) {
        throw new ValidationError('Threshold must be a number between -1.0 and 1.0.');
      }
    }

    const stock = await Stock.findOneAndUpdate(
      { ticker, userId: req.user._id },
      { sentimentAlertThreshold: sentimentAlertThreshold === '' ? null : sentimentAlertThreshold },
      { new: true }
    );

    if (!stock) {
      throw new NotFoundError(`Stock ${ticker} in watchlist`);
    }

    res.json(stock);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
