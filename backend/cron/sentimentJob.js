const cron = require('node-cron');
const axios = require('axios');
const Stock = require('../models/Stock');
const Sentiment = require('../models/Sentiment');

const PYTHON_API = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

// Run every day at midnight (0 0 * * *)
cron.schedule('0 0 * * *', async () => {
  console.log('⏳ Running daily sentiment aggregation job...');
  try {
    const stocks = await Stock.find();
    if (stocks.length === 0) {
      console.log('No stocks in watchlist to process.');
      return;
    }

    for (let stock of stocks) {
      try {
        console.log(`Fetching news for ${stock.ticker}...`);
        const response = await axios.get(`${PYTHON_API}/api/news/${stock.ticker}`);
        const data = response.data;

        if (data.articles && data.articles.length > 0) {
          const totalScore = data.articles.reduce((acc, curr) => acc + (curr.sentiment_score || 0), 0);
          const avgScore = totalScore / data.articles.length;

          const mappedArticles = data.articles.map(a => ({
            title: a.title,
            source: a.source,
            url: a.url,
            sentimentScore: a.sentiment_score,
            sentimentLabel: a.sentiment_label
          }));

          const sentimentRecord = new Sentiment({
            ticker: stock.ticker,
            date: new Date(),
            averageScore: avgScore,
            totalArticles: data.articles.length,
            articles: mappedArticles
          });

          await sentimentRecord.save();
          console.log(`✅ Saved daily sentiment for ${stock.ticker}`);

          // Trigger alert checking
          if (stock.sentimentAlertThreshold !== null && stock.sentimentAlertThreshold !== undefined && avgScore < stock.sentimentAlertThreshold) {
            console.log(`🚨 ALERT: Ticker ${stock.ticker} sentiment (${avgScore.toFixed(4)}) has fallen below threshold (${stock.sentimentAlertThreshold})!`);
          }
        } else {
          console.log(`⚠️ No articles found for ${stock.ticker}`);
        }
      } catch (err) {
        console.error(`❌ Error processing ${stock.ticker}:`, err.message);
      }
    }
    console.log('🏁 Daily sentiment aggregation complete.');
  } catch (err) {
    console.error('❌ Error in cron job:', err);
  }
});
