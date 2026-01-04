/**
 * Custom error class for handling operational errors (expected, user-friendly errors).
 * Allows setting a specific HTTP status code for API responses.
 */
class AppError extends Error {
  /**
   * @param {string} message - The error message.
   * @param {number} statusCode - The HTTP status code (e.g., 400, 404, 403).
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Signals that this is a trusted, handled error

    // Captures the stack trace, excluding the constructor call itself
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;