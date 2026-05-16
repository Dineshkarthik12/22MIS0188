const { sendError } = require('../utils/response');
const { safeLog } = require('../utils/logger');

const errorHandler = async (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error occurred';

  await safeLog(
    'error',
    'handler',
    `Unhandled error on ${req.method} ${req.originalUrl}: ${message}`
  );

  if (res.headersSent) {
    return next(err);
  }

  return sendError(res, statusCode, message);
};

module.exports = errorHandler;
