const { Log } = require('logging_middleware/src/logger');

const safeLog = async (level, packageName, message) => {
  try {
    await Log('backend', level, packageName, message);
  } catch (error) {
    console.error(`[Logger] Remote log failed: ${error.message}`);
  }
};

module.exports = {
  safeLog,
};
