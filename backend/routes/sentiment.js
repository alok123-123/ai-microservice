const express = require('express');
const router = express.Router();
const Sentiment = require('../models/Sentiment');
const axios = require('axios');

// Get historical sentiment for a ticker
router.get('/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const limit = parseInt(req.query.limit) || 30; // default 30 days
    
    const sentiments = await Sentiment.find({ ticker })
      .sort({ date: -1 })
      .limit(limit);
      
    res.json(sentiments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger an immediate manual fetch (for testing or immediate sync)
router.post('/fetch/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const PYTHON_API = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';
    
    // Fetch from python microservice
    const response = await axios.get(`${PYTHON_API}/api/news/${ticker}`);
    const data = response.data;
    
    if (!data.articles || data.articles.length === 0) {
      return res.status(404).json({ error: 'No articles found' });
    }
    
    // Calculate average score
    const totalScore = data.articles.reduce((acc, curr) => acc + (curr.sentiment_score || 0), 0);
    const avgScore = totalScore / data.articles.length;
    
    // Map articles
    const mappedArticles = data.articles.map(a => ({
      title: a.title,
      source: a.source,
      url: a.url,
      sentimentScore: a.sentiment_score,
      sentimentLabel: a.sentiment_label
    }));
    
    // Save to DB
    const sentimentRecord = new Sentiment({
      ticker,
      date: new Date(),
      averageScore: avgScore,
      totalArticles: data.articles.length,
      articles: mappedArticles
    });
    
    await sentimentRecord.save();
    
    res.json(sentimentRecord);
  } catch (err) {
    console.error('Error fetching sentiment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
