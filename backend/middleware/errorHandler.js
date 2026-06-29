/**
 * Global Express error-handling middleware.
 *
 * Must be registered AFTER all routes (`app.use(errorHandler)`).
 * Catches all errors thrown or passed via `next(err)` and returns a
 * consistent JSON envelope with sanitised messages in production.
 */

const { AppError } = require('../utils/errors');
const config = require('../config');

// eslint-disable-next-line no-unused-vars -- Express requires exactly 4 params
function errorHandler(err, req, res, _next) {
  // Default to 500 if not one of our custom errors
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const isOperational = err.isOperational || false;

  // Structured log
  const logEntry = {
    timestamp: new Date().toISOString(),
    requestId: req.requestId || 'unknown',
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
    message: err.message,
    ...(config.isDev && { stack: err.stack }),
    ...(err.originalError && { cause: err.originalError.message }),
  };

  if (statusCode >= 500) {
    console.error('❌ Server Error:', JSON.stringify(logEntry, null, 2));
  } else {
    console.warn('⚠️  Client Error:', JSON.stringify(logEntry, null, 2));
  }

  // Response — hide internals in production
  res.status(statusCode).json({
    error: {
      code,
      message: isOperational
        ? err.message
        : config.isDev
          ? err.message
          : 'An unexpected error occurred. Please try again later.',
      requestId: req.requestId || undefined,
    },
  });
}

module.exports = errorHandler;
