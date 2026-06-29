/**
 * Centralized configuration module.
 *
 * Single source of truth for every environment variable the backend uses.
 * Validates required values on startup so the server fails fast instead of
 * silently falling back to insecure defaults.
 */

require('dotenv').config();

// ── Helpers ─────────────────────────────────────────────────────────────────

const NODE_ENV = process.env.NODE_ENV || 'development';
const isDev = NODE_ENV === 'development';

/**
 * Read an env var.  When `required` is true the process exits immediately
 * if the value is missing — unless we are in development mode AND a
 * `devDefault` has been provided (so `npm start` still works locally).
 */
function env(key, { required = false, devDefault = undefined } = {}) {
  const value = process.env[key];
  if (value !== undefined) return value;

  if (required) {
    if (isDev && devDefault !== undefined) {
      console.warn(
        `⚠️  ${key} is not set — using development default. ` +
        `Set it properly before deploying to production.`
      );
      return devDefault;
    }
    console.error(`❌ Required environment variable ${key} is not set. Exiting.`);
    process.exit(1);
  }

  return devDefault;
}

// ── Exported config ─────────────────────────────────────────────────────────

const config = {
  NODE_ENV,
  isDev,

  // Server
  PORT: parseInt(env('PORT', { devDefault: '5000' }), 10),

  // MongoDB — accept both spellings so existing .env files keep working
  MONGODB_URI: env('MONGODB_URI', {
    required: true,
    devDefault: env('MONGO_URI', { devDefault: 'mongodb://localhost:27017/stock-sentiment' }),
  }),

  // Auth
  JWT_SECRET: env('JWT_SECRET', {
    required: true,
    devDefault: 'dev-only-secret-do-not-use-in-prod-' + Date.now(),
  }),
  JWT_EXPIRES_IN: env('JWT_EXPIRES_IN', { devDefault: '7d' }),

  // Python AI microservice
  PYTHON_API_URL: env('PYTHON_API_URL', {
    required: true,
    devDefault: 'http://127.0.0.1:8000',
  }),

  // CORS — comma-separated list of allowed origins
  CORS_ORIGINS: (env('CORS_ORIGINS', { devDefault: 'http://localhost:5173,http://localhost:3000' }))
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(env('RATE_LIMIT_WINDOW_MS', { devDefault: '900000' }), 10), // 15 min
  RATE_LIMIT_MAX: parseInt(env('RATE_LIMIT_MAX', { devDefault: '100' }), 10),
  AUTH_RATE_LIMIT_MAX: parseInt(env('AUTH_RATE_LIMIT_MAX', { devDefault: '20' }), 10),

  // Third Party APIs
  ALPHA_VANTAGE_API_KEY: env('ALPHA_VANTAGE_API_KEY', { required: false }),
};

module.exports = config;
