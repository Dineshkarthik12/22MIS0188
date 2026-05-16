const { sendError } = require('../utils/response');
const { safeLog } = require('../utils/logger');

const errorHandler = async (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error occurred while processing request';

  await safeLog(
    'error',
    'handler',
    `Request ${req.method} ${req.originalUrl} failed with status ${statusCode}: ${message}`
  );

  if (res.headersSent) {
    return next(err);
  }

  return sendError(res, statusCode, message);
};

module.exports = errorHandler;
