/**
 * Custom error hierarchy.
 *
 * Every error carries a human-safe `message`, an HTTP `statusCode`, and an
 * optional machine-readable `code` for programmatic consumers.
 */

class AppError extends Error {
  /**
   * @param {string}  message    – User-facing message (safe to send to clients).
   * @param {number}  statusCode – HTTP status code (default 500).
   * @param {string}  [code]     – Machine-readable error code (e.g. 'VALIDATION_ERROR').
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // distinguishes expected errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

class ExternalServiceError extends AppError {
  constructor(service = 'External service', originalError = null) {
    super(`${service} is unavailable. Please try again later.`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.originalError = originalError;
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  ExternalServiceError,
};
