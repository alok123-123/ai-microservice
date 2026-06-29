const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Sentiment = require('../models/Sentiment');

// @route   GET /api/markets/overview
// @desc    Get market overview (top bullish, bearish, and active)
// @access  Private
router.get('/overview', auth, async (req, res, next) => {
  try {
    // We aggregate the most recent sentiment for each ticker
    const pipeline = [
      { $sort: { date: -1 } },
      { 
        $group: {
          _id: '$ticker',
          latestScore: { $first: '$averageScore' },
          totalArticles: { $first: '$totalArticles' },
          date: { $first: '$date' }
        }
      },
      {
        $project: {
          ticker: '$_id',
          _id: 0,
          latestScore: 1,
          totalArticles: 1,
          date: 1
        }
      }
    ];

    const allTickers = await Sentiment.aggregate(pipeline);

    if (!allTickers || allTickers.length === 0) {
      return res.json({ topBullish: [], topBearish: [], mostActive: [] });
    }

    // Sort for top bullish (highest score)
    const topBullish = [...allTickers]
      .filter(t => t.latestScore > 0) // Any positive score
      .sort((a, b) => b.latestScore - a.latestScore)
      .slice(0, 5);

    // Sort for top bearish (lowest score)
    const topBearish = [...allTickers]
      .filter(t => t.latestScore < 0) // Any negative score
      .sort((a, b) => a.latestScore - b.latestScore)
      .slice(0, 5);

    // Sort for most active (highest total articles)
    const mostActive = [...allTickers]
      .sort((a, b) => b.totalArticles - a.totalArticles)
      .slice(0, 5);

    res.json({
      topBullish,
      topBearish,
      mostActive,
      totalTracked: allTickers.length
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
