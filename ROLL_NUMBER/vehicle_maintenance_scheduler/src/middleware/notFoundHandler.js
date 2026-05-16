const { sendError } = require('../utils/response');
const { safeLog } = require('../utils/logger');

const notFoundHandler = async (req, res) => {
  await safeLog(
    'warn',
    'route',
    `No route handler found for ${req.method} ${req.originalUrl}`
  );
  return sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

module.exports = notFoundHandler;
