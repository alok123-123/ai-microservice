const mongoose = require('mongoose');

const sentimentSchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: true,
    uppercase: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  averageScore: {
    type: Number,
    required: true,
  },
  totalArticles: {
    type: Number,
    required: true,
  },
  articles: [{
    title: String,
    source: String,
    url: String,
    sentimentScore: Number,
    sentimentLabel: String
  }]
});

// Ensure we only have one daily record per ticker (if doing daily aggregation)
// sentimentSchema.index({ ticker: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Sentiment', sentimentSchema);
