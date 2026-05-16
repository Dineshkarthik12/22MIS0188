const { safeLog } = require('../utils/logger');

const requestLogger = async (req, res, next) => {
  const start = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - start;
    await safeLog(
      'info',
      'route',
      `${req.method} ${req.originalUrl} responded with status ${res.statusCode} in ${duration}ms`
    );
  });

  await safeLog('info', 'route', `Incoming ${req.method} request to ${req.originalUrl}`);
  next();
};

module.exports = requestLogger;
