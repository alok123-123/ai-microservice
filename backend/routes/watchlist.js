const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const Sentiment = require('../models/Sentiment');

// GET all watched stocks
router.get('/', async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ addedAt: -1 });
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

    let stock = await Stock.findOne({ ticker: ticker.toUpperCase() });
    if (stock) {
      return res.status(400).json({ error: 'Stock is already in watchlist' });
    }

    stock = new Stock({ ticker, companyName });
    await stock.save();
    
    // Trigger immediate sentiment fetch (in real app, this might be asynchronous)
    // We'll leave the cron job to handle data fetching mostly, 
    // but for now just returning the added stock.
    res.status(201).json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE stock from watchlist
router.delete('/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    await Stock.findOneAndDelete({ ticker });
    // Optionally delete associated sentiment data
    // await Sentiment.deleteMany({ ticker });
    res.json({ message: 'Stock removed from watchlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
