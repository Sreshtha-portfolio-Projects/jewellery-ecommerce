/**
 * Production-Safe Error Logger
 * Ensures errors are logged with context but sensitive data is never exposed
 */

/**
 * Log error with production-safe formatting
 * @param {Error} error - Error object
 * @param {Object} context - Additional context (endpoint, userId, etc.)
 * @param {Object} req - Express request object (optional)
 */
const logError = (error, context = {}, req = null) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const timestamp = new Date().toISOString();
  
  const logData = {
    timestamp,
    error: {
      name: error?.name || 'Error',
      message: error?.message || 'Unknown error',
      ...(isProduction ? {} : { stack: error?.stack })
    },
    context: {
      ...context,
      ...(req && {
        method: req.method,
        path: req.path,
        ip: req.ip || req.connection?.remoteAddress || 'unknown'
      })
    }
  };

  // In production, log to console (can be redirected to logging service)
  // In development, include stack traces
  if (isProduction) {
    console.error(`[ERROR] ${timestamp}`, JSON.stringify(logData, null, 2));
  } else {
    console.error('Error Details:', logData);
    if (error?.stack) {
      console.error('Stack Trace:', error.stack);
    }
  }
};

/**
 * Sanitize error message for client response
 * Never exposes stack traces or sensitive data
 */
const sanitizeErrorMessage = (error, defaultMessage = 'An error occurred') => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // In production, return generic message
    return defaultMessage;
  }
  
  // In development, return error message but not stack
  return error?.message || defaultMessage;
};

module.exports = {
  logError,
  sanitizeErrorMessage
};
