const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

const axios = require('axios');
const PYTHON_API = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

// GET all available stock ticker mappings from Python microservice
router.get('/tickers', async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_API}/api/tickers`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all watched stocks for the authenticated user
router.get('/', async (req, res) => {
  try {
    const stocks = await Stock.find({ userId: req.user._id }).sort({ addedAt: -1 });
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add a new stock to watchlist
router.post('/', async (req, res) => {
  try {
    const { ticker, companyName } = req.body;
    if (!ticker) return res.status(400).json({ error: 'Ticker is required' });

    const existingStock = await Stock.findOne({
      ticker: ticker.toUpperCase(),
      userId: req.user._id
    });
    if (existingStock) {
      return res.status(400).json({ error: 'Stock is already in your watchlist' });
    }

    const stock = new Stock({
      ticker: ticker.toUpperCase(),
      companyName,
      userId: req.user._id
    });
    await stock.save();
    res.status(201).json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE stock from watchlist
router.delete('/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    await Stock.findOneAndDelete({ ticker, userId: req.user._id });
    res.json({ message: 'Stock removed from watchlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update alert threshold for a stock
router.put('/threshold/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const { sentimentAlertThreshold } = req.body;
    
    const stock = await Stock.findOneAndUpdate(
      { ticker, userId: req.user._id },
      { sentimentAlertThreshold: sentimentAlertThreshold === '' ? null : sentimentAlertThreshold },
      { new: true }
    );
    
    if (!stock) return res.status(404).json({ error: 'Stock not found in watchlist' });
    res.json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
