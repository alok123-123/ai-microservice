/**
 * Historical Analytics Service
 *
 * Computes trend metrics from stored Sentiment records:
 *   - 7-day / 30-day linear trend (slope)
 *   - Daily change
 *   - 7-day simple moving average
 *   - Sentiment volatility (std dev)
 *   - Highest positive / negative days
 */

const Sentiment = require('../models/Sentiment');

/**
 * Compute analytics for a ticker.
 *
 * @param {string} ticker – Uppercased stock ticker
 * @param {number} [limit=30] – Max days of history to consider
 * @returns {Promise<object>} analytics object
 */
async function computeAnalytics(ticker, limit = 30) {
  const records = await Sentiment.find({ ticker })
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  if (records.length === 0) {
    return _emptyAnalytics(ticker);
  }

  // Records are newest-first; reverse for chronological order
  const chronological = [...records].reverse();
  const scores = chronological.map(r => r.averageScore);
  const dates  = chronological.map(r => r.date);

  // ── Daily change ──────────────────────────────────────────────────────
  const latest   = scores[scores.length - 1];
  const previous = scores.length >= 2 ? scores[scores.length - 2] : null;
  const dailyChange = previous !== null ? _round(latest - previous) : null;

  // ── 7-day trend (linear regression slope) ─────────────────────────────
  const last7 = scores.slice(-7);
  const trend7d = last7.length >= 2 ? _round(_linearSlope(last7)) : null;

  // ── 30-day trend ──────────────────────────────────────────────────────
  const trend30d = scores.length >= 2 ? _round(_linearSlope(scores)) : null;

  // ── 7-day simple moving average ───────────────────────────────────────
  const sma7 = last7.length > 0 ? _round(last7.reduce((a, b) => a + b, 0) / last7.length) : null;

  // ── Volatility (standard deviation) ───────────────────────────────────
  const volatility = scores.length >= 2 ? _round(_stddev(scores)) : null;

  // ── Extremes ──────────────────────────────────────────────────────────
  let highestPositive = { score: -Infinity, date: null };
  let highestNegative = { score: Infinity, date: null };

  for (let i = 0; i < scores.length; i++) {
    if (scores[i] > highestPositive.score) {
      highestPositive = { score: scores[i], date: dates[i] };
    }
    if (scores[i] < highestNegative.score) {
      highestNegative = { score: scores[i], date: dates[i] };
    }
  }

  return {
    ticker,
    dataPoints: scores.length,
    latestScore: _round(latest),
    dailyChange,
    trend7d,
    trend30d,
    sma7,
    volatility,
    highestPositiveDay: {
      score: _round(highestPositive.score),
      date: highestPositive.date,
    },
    highestNegativeDay: {
      score: _round(highestNegative.score),
      date: highestNegative.date,
    },
  };
}

// ── Math helpers ────────────────────────────────────────────────────────────

/**
 * Linear regression slope for evenly-spaced y-values.
 * Uses indices [0, 1, 2, …] as x values.
 */
function _linearSlope(values) {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

/**
 * Population standard deviation.
 */
function _stddev(values) {
  const n = values.length;
  if (n === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  return Math.sqrt(variance);
}

function _round(v, decimals = 4) {
  const factor = 10 ** decimals;
  return Math.round(v * factor) / factor;
}

function _emptyAnalytics(ticker) {
  return {
    ticker,
    dataPoints: 0,
    latestScore: null,
    dailyChange: null,
    trend7d: null,
    trend30d: null,
    sma7: null,
    volatility: null,
    highestPositiveDay: null,
    highestNegativeDay: null,
  };
}

module.exports = { computeAnalytics };
