require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  upcomingServiceDays: parseInt(process.env.UPCOMING_SERVICE_DAYS, 10) || 30,
  dataDir: process.env.DATA_DIR || `${__dirname}/../data`,
};

module.exports = config;
