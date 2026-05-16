const { Log } = require('logging_middleware/src/logger');

const safeLog = async (level, packageName, message) => {
  try {
    await Log('backend', level, packageName, message);
  } catch (error) {
    // Remote logging must not crash business logic; no console output per requirements
  }
};

module.exports = {
  safeLog,
};
