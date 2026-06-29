/**
 * Daily Sentiment Aggregation Cron Job
 *
 * Runs at midnight every day. For each unique ticker in any user's watchlist,
 * fetches fresh news from the AI microservice, computes weighted sentiment,
 * and upserts a single daily record into MongoDB.
 */

const cron = require('node-cron');
const axios = require('axios');
const Stock = require('../models/Stock');
const Sentiment = require('../models/Sentiment');
const config = require('../config');
const { calculateWeightedSentiment } = require('../utils/sentimentAggregator');

/**
 * Process a single ticker: fetch news → aggregate → upsert.
 * Extracted so it can also be called from tests or manual triggers.
 */
async function processTicker(ticker) {
  console.log(`  ⏳ Fetching news for ${ticker}…`);

  const response = await axios.get(`${config.PYTHON_API_URL}/api/news/${ticker}`);
  const data = response.data;

  if (!data.articles || data.articles.length === 0) {
    console.log(`  ⚠️  No articles found for ${ticker}`);
    return null;
  }

  // Weighted aggregation with explainability
  const aggregation = calculateWeightedSentiment(
    data.articles,
    ticker,
    data.company || ''
  );

  // Upsert: one record per ticker per calendar day
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sentimentRecord = await Sentiment.findOneAndUpdate(
    {
      ticker,
      date: { $gte: today, $lt: new Date(today.getTime() + 86400000) },
    },
    {
      ticker,
      date: new Date(),
      averageScore: aggregation.weightedScore,
      totalArticles: aggregation.totalArticles,
      articles: aggregation.articles,
      explainability: aggregation.explainability,
    },
    { upsert: true, new: true }
  );

  console.log(`  ✅ Saved daily sentiment for ${ticker} (score: ${aggregation.weightedScore})`);

  return sentimentRecord;
}

// ── Scheduled job ───────────────────────────────────────────────────────────

// Run every day at midnight (0 0 * * *)
cron.schedule('0 0 * * *', async () => {
  const startTime = Date.now();
  console.log('──────────────────────────────────────────────────────');
  console.log('⏳ Running daily sentiment aggregation job…');

  try {
    // Phase 6: Use distinct() to avoid processing duplicate tickers
    // when multiple users watch the same stock
    const tickers = await Stock.distinct('ticker');

    if (tickers.length === 0) {
      console.log('  No tickers in any watchlist to process.');
      return;
    }

    console.log(`  Processing ${tickers.length} unique ticker(s): ${tickers.join(', ')}`);

    let successCount = 0;
    let errorCount = 0;

    for (const ticker of tickers) {
      try {
        const record = await processTicker(ticker);
        if (record) {
          successCount++;

          // Check alert thresholds for all users watching this ticker
          const stocks = await Stock.find({ ticker });
          for (const stock of stocks) {
            if (
              stock.sentimentAlertThreshold != null &&
              record.averageScore < stock.sentimentAlertThreshold
            ) {
              console.log(
                `  🚨 ALERT: ${ticker} sentiment (${record.averageScore.toFixed(4)}) ` +
                `fell below threshold (${stock.sentimentAlertThreshold}) ` +
                `for user ${stock.userId}`
              );
            }
          }
        }
      } catch (err) {
        errorCount++;
        console.error(`  ❌ Error processing ${ticker}:`, err.message);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `🏁 Daily aggregation complete in ${elapsed}s — ` +
      `${successCount} succeeded, ${errorCount} failed`
    );
  } catch (err) {
    console.error('❌ Fatal error in cron job:', err);
  }
});

module.exports = { processTicker };
