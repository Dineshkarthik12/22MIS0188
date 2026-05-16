const express = require('express');
const config = require('./src/config');
const routes = require('./src/routes');
const requestLogger = require('./src/middleware/requestLogger');
const errorHandler = require('./src/middleware/errorHandler');
const notFoundHandler = require('./src/middleware/notFoundHandler');
const { ensureDataFiles } = require('./src/data/store');
const { safeLog } = require('./src/utils/logger');

const app = express();

ensureDataFiles();

app.use(express.json());
app.use(requestLogger);

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    app.listen(config.port, async () => {
      console.log(`Vehicle Maintenance Scheduler running on port ${config.port}`);
      await safeLog(
        'info',
        'config',
        `Vehicle Maintenance Scheduler started on port ${config.port}`
      );
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    await safeLog('fatal', 'config', `Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = app;
