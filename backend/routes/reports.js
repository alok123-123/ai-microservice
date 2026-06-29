const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Sentiment = require('../models/Sentiment');

// @route   GET /api/reports/:ticker
// @desc    Get detailed report for a specific ticker over the last 30 days
// @access  Private
router.get('/:ticker', auth, async (req, res, next) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    
    // Fetch last 30 days of sentiment
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const history = await Sentiment.find({
      ticker,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 }); // Oldest to newest for timeseries

    if (!history || history.length === 0) {
      return res.status(404).json({ error: 'No report data found for this ticker.' });
    }

    // Compute aggregate stats
    let totalArticles = 0;
    let sumScore = 0;
    
    history.forEach(record => {
      totalArticles += record.totalArticles;
      sumScore += record.averageScore;
    });

    const averageSentiment = sumScore / history.length;
    
    // Compute volatility (Standard Deviation of sentiment)
    let varianceSum = 0;
    history.forEach(record => {
      varianceSum += Math.pow(record.averageScore - averageSentiment, 2);
    });
    const volatility = Math.sqrt(varianceSum / history.length);

    // Determine trend (Last 7 days avg vs Previous 7 days avg)
    const last7 = history.slice(-7);
    const prev7 = history.slice(-14, -7);
    
    const last7Avg = last7.length > 0 ? last7.reduce((acc, curr) => acc + curr.averageScore, 0) / last7.length : 0;
    const prev7Avg = prev7.length > 0 ? prev7.reduce((acc, curr) => acc + curr.averageScore, 0) / prev7.length : 0;
    
    const trendShift = last7Avg - prev7Avg;
    let trendDirection = 'NEUTRAL';
    if (trendShift > 0.1) trendDirection = 'BULLISH';
    if (trendShift < -0.1) trendDirection = 'BEARISH';

    const report = {
      ticker,
      timeframe: '30D',
      totalDaysTracked: history.length,
      totalArticlesAnalyzed: totalArticles,
      averageSentiment: averageSentiment,
      volatility: volatility,
      trendShift: trendShift,
      trendDirection: trendDirection,
      history: history.map(h => ({
        date: h.date,
        score: h.averageScore,
        articles: h.totalArticles
      }))
    };

    res.json(report);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
