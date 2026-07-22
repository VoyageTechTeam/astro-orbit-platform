/* eslint-disable no-unused-vars */
/**
 * Centralized fallback error handler. Individual controllers already
 * catch and format their own domain errors — this exists as a safety
 * net for anything unexpected (e.g. malformed JSON bodies, multer
 * upload errors).
 */
function errorHandler(err, req, res, next) {
  console.error('[Unhandled Error]', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : err.message,
  });
}

module.exports = errorHandler;
