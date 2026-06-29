const axios = require('axios');
const config = require('../config');

// In-memory cache to avoid hitting Alpha Vantage's strict rate limits
// Cache structure: { 'AAPL': { data: {...}, timestamp: 123456789 } }
const priceCache = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

/**
 * Fetches real-time price and daily change from Alpha Vantage
 * Endpoint: GLOBAL_QUOTE
 * @param {string} ticker 
 * @returns {Object|null} { price, change, changePercent, volume }
 */
const getRealTimePrice = async (ticker) => {
  if (!config.ALPHA_VANTAGE_API_KEY) {
    console.warn('Alpha Vantage API key not found in config.');
    return null;
  }

  const now = Date.now();
  if (priceCache[ticker] && (now - priceCache[ticker].timestamp < CACHE_TTL_MS)) {
    return priceCache[ticker].data;
  }

  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${config.ALPHA_VANTAGE_API_KEY}`;
    const response = await axios.get(url);
    
    // Check if Alpha Vantage returned an API rate limit error or empty data
    if (response.data['Information'] || response.data['Note']) {
      console.warn(`Alpha Vantage rate limit or info message: ${response.data['Information'] || response.data['Note']}`);
      // Fallback to cache if exists, even if expired, to prevent UI crash
      return priceCache[ticker]?.data || null;
    }

    const quote = response.data['Global Quote'];
    if (!quote || Object.keys(quote).length === 0) {
      return null;
    }

    const data = {
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume'], 10)
    };

    // Save to cache
    priceCache[ticker] = {
      data,
      timestamp: now
    };

    return data;
  } catch (error) {
    console.error(`Error fetching Alpha Vantage data for ${ticker}:`, error.message);
    return priceCache[ticker]?.data || null;
  }
};

module.exports = {
  getRealTimePrice
};
