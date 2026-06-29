/**
 * Weighted Sentiment Aggregation Engine
 *
 * Replaces naive averaging with a multi-factor weighting system:
 *   1. Source credibility  — trusted financial outlets weigh more
 *   2. Recency decay       — newer articles weigh more
 *   3. Model confidence    — high-confidence scores weigh more
 *   4. Duplicate detection — near-duplicate headlines are collapsed
 *   5. Relevance filter    — articles mentioning the ticker weigh more
 *
 * Also computes explainability metadata (Phase 3).
 */

// ── Source credibility weights ──────────────────────────────────────────────

const SOURCE_CREDIBILITY = {
  // Tier 1 — major financial wire services
  'reuters':        1.0,
  'bloomberg':      1.0,
  'the wall street journal': 1.0,
  'financial times': 1.0,
  'associated press': 0.95,

  // Tier 2 — well-known financial news
  'cnbc':           0.9,
  'marketwatch':    0.9,
  'barron\'s':      0.9,
  'the motley fool': 0.85,
  'investopedia':   0.85,
  'seeking alpha':  0.85,
  'benzinga':       0.85,

  // Tier 3 — major general news
  'bbc news':       0.8,
  'cnn':            0.8,
  'the new york times': 0.8,
  'the washington post': 0.8,
  'the guardian':   0.8,

  // Tier 4 — aggregators / scrape sources
  'yahoo finance':  0.75,
  'google news':    0.7,

  // Default for unknown sources
  _default:         0.4,
};

const SENTIMENT_THRESHOLD = 0.05;
const MAX_ARTICLES_STORED = 20;

/**
 * Get credibility weight for a source name.
 */
function getSourceWeight(sourceName) {
  if (!sourceName) return SOURCE_CREDIBILITY._default;
  const key = sourceName.toLowerCase().trim();
  return SOURCE_CREDIBILITY[key] ?? SOURCE_CREDIBILITY._default;
}

/**
 * Compute a recency weight.  Articles from today get 1.0, yesterday 0.9, etc.
 * Anything older than 7 days gets a floor of 0.3.
 */
function getRecencyWeight(publishedAt) {
  if (!publishedAt) return 0.5; // unknown date, moderate weight
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays < 0) return 1.0; // future dates (clock skew) treated as fresh
  if (ageDays <= 1) return 1.0;
  if (ageDays <= 2) return 0.9;
  if (ageDays <= 3) return 0.8;
  if (ageDays <= 5) return 0.6;
  if (ageDays <= 7) return 0.4;
  return 0.3;
}

/**
 * Confidence weight derived from the sentiment score magnitude.
 * |score| close to 1 → high confidence → higher weight.
 * |score| close to 0 → neutral / low confidence → lower weight.
 */
function getConfidenceWeight(sentimentScore) {
  if (sentimentScore == null) return 0.5;
  return 0.3 + 0.7 * Math.abs(sentimentScore); // range: 0.3 – 1.0
}

/**
 * Simple Jaccard similarity on word sets for fuzzy duplicate detection.
 */
function jaccardSimilarity(a, b) {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Deduplicate articles by near-identical titles (Jaccard ≥ 0.7).
 * Keeps the first occurrence of each cluster.
 */
function deduplicateArticles(articles) {
  const kept = [];
  for (const article of articles) {
    const isDupe = kept.some(
      existing => jaccardSimilarity(existing.title || '', article.title || '') >= 0.7
    );
    if (!isDupe) kept.push(article);
  }
  return kept;
}

/**
 * Relevance weight — boost articles that mention the ticker or company name.
 */
function getRelevanceWeight(article, ticker, companyName) {
  const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
  const tickerLower = (ticker || '').toLowerCase();
  const companyLower = (companyName || '').toLowerCase();

  if (tickerLower && text.includes(tickerLower)) return 1.0;
  if (companyLower && text.includes(companyLower)) return 1.0;
  return 0.5; // article doesn't directly mention the stock
}

/**
 * Main aggregation function.
 *
 * @param {Array} articles   – Array of article objects with sentimentScore, sentimentLabel, title, source, url, published_at/publishedAt
 * @param {string} ticker    – The stock ticker being analyzed
 * @param {string} [company] – Optional company name for relevance matching
 * @returns {{ weightedScore, totalArticles, articles, explainability }}
 */
function calculateWeightedSentiment(articles, ticker, company = '') {
  if (!articles || articles.length === 0) {
    return {
      weightedScore: 0,
      totalArticles: 0,
      articles: [],
      explainability: _emptyExplainability(),
    };
  }

  // Step 1: Deduplicate
  const uniqueArticles = deduplicateArticles(articles);

  // Step 2: Compute weights and weighted scores
  let totalWeight = 0;
  let weightedSum = 0;
  const scoredArticles = [];

  for (const article of uniqueArticles) {
    const score = article.sentimentScore ?? article.sentiment_score ?? 0;
    const source = article.source || 'Unknown';
    const publishedAt = article.publishedAt || article.published_at || null;

    const srcWeight  = getSourceWeight(source);
    const recWeight  = getRecencyWeight(publishedAt);
    const confWeight = getConfidenceWeight(score);
    const relWeight  = getRelevanceWeight(article, ticker, company);

    // Combined weight (multiplicative)
    const combinedWeight = srcWeight * recWeight * confWeight * relWeight;

    weightedSum += score * combinedWeight;
    totalWeight += combinedWeight;

    scoredArticles.push({
      title: article.title,
      source,
      url: article.url,
      sentimentScore: score,
      sentimentLabel: article.sentimentLabel || article.sentiment_label || _scoreToLabel(score),
      weight: Math.round(combinedWeight * 1000) / 1000,
      publishedAt,
    });
  }

  const weightedScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Step 3: Build explainability metadata
  const explainability = _buildExplainability(scoredArticles, weightedScore);

  // Step 4: Cap stored articles to the most significant ones
  const cappedArticles = scoredArticles
    .sort((a, b) => b.weight - a.weight)
    .slice(0, MAX_ARTICLES_STORED);

  return {
    weightedScore: Math.round(weightedScore * 10000) / 10000,
    totalArticles: uniqueArticles.length,
    articles: cappedArticles,
    explainability,
  };
}

// ── Explainability helpers ──────────────────────────────────────────────────

function _scoreToLabel(score) {
  if (score >= SENTIMENT_THRESHOLD) return 'Positive';
  if (score <= -SENTIMENT_THRESHOLD) return 'Negative';
  return 'Neutral';
}

function _buildExplainability(articles, weightedScore) {
  const positive = articles.filter(a => a.sentimentLabel === 'Positive');
  const negative = articles.filter(a => a.sentimentLabel === 'Negative');
  const neutral  = articles.filter(a => a.sentimentLabel === 'Neutral');

  // Top 3 positive by score (descending)
  const topPositive = [...positive]
    .sort((a, b) => b.sentimentScore - a.sentimentScore)
    .slice(0, 3)
    .map(a => ({ title: a.title, source: a.source, score: a.sentimentScore }));

  // Top 3 negative by score (ascending, most negative first)
  const topNegative = [...negative]
    .sort((a, b) => a.sentimentScore - b.sentimentScore)
    .slice(0, 3)
    .map(a => ({ title: a.title, source: a.source, score: a.sentimentScore }));

  // Top 5 strongest contributors by weight
  const strongestContributors = [...articles]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map(a => ({ title: a.title, weight: a.weight, sentimentLabel: a.sentimentLabel }));

  // Confidence = average |score| across all articles
  const avgAbsScore = articles.length > 0
    ? articles.reduce((sum, a) => sum + Math.abs(a.sentimentScore), 0) / articles.length
    : 0;

  const total = articles.length || 1; // avoid division by zero

  return {
    topPositiveArticles: topPositive,
    topNegativeArticles: topNegative,
    strongestContributors,
    confidence: Math.round(avgAbsScore * 10000) / 10000,
    overallLabel: _scoreToLabel(weightedScore),
    breakdown: {
      positivePercent: Math.round((positive.length / total) * 10000) / 100,
      negativePercent: Math.round((negative.length / total) * 10000) / 100,
      neutralPercent:  Math.round((neutral.length / total) * 10000) / 100,
      positiveCount: positive.length,
      negativeCount: negative.length,
      neutralCount:  neutral.length,
    },
  };
}

function _emptyExplainability() {
  return {
    topPositiveArticles: [],
    topNegativeArticles: [],
    strongestContributors: [],
    confidence: 0,
    overallLabel: 'Neutral',
    breakdown: {
      positivePercent: 0,
      negativePercent: 0,
      neutralPercent: 0,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
    },
  };
}

module.exports = {
  calculateWeightedSentiment,
  deduplicateArticles,
  getSourceWeight,
  getRecencyWeight,
  getConfidenceWeight,
  getRelevanceWeight,
  SENTIMENT_THRESHOLD,
  MAX_ARTICLES_STORED,
};
