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
    sentimentLabel: String,
    weight: Number,           // Phase 2: per-article aggregation weight
    publishedAt: Date,
  }],
  // Phase 3: Explainability metadata
  explainability: {
    topPositiveArticles: [{
      title: String,
      source: String,
      score: Number,
    }],
    topNegativeArticles: [{
      title: String,
      source: String,
      score: Number,
    }],
    strongestContributors: [{
      title: String,
      weight: Number,
      sentimentLabel: String,
    }],
    confidence: Number,
    overallLabel: String,
    breakdown: {
      positivePercent: Number,
      negativePercent: Number,
      neutralPercent: Number,
      positiveCount: Number,
      negativeCount: Number,
      neutralCount: Number,
    },
  },
});

// Phase 6: Compound index for efficient per-ticker chronological queries
// Also supports the upsert pattern in the cron job (one record per ticker per day)
sentimentSchema.index({ ticker: 1, date: -1 });

module.exports = mongoose.model('Sentiment', sentimentSchema);
