const { validateLogInputs } = require('./utils/validation');
const { submitLog } = require('./services/logService');

const formatMessageWithTimestamp = (message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${message}`;
};

/**
 * Reusable async logger for remote evaluation service.
 * @param {string} stack - backend | frontend
 * @param {string} level - debug | info | warn | error | fatal
 * @param {string} packageName - backend package identifier
 * @param {string} message - descriptive log message
 */
const Log = async (stack, level, packageName, message) => {
  try {
    validateLogInputs(stack, level, packageName, message);

    const timestampedMessage = formatMessageWithTimestamp(message);
    const result = await submitLog(stack, level, packageName, timestampedMessage);
    return result;
  } catch (error) {
    const wrappedError = new Error(`Logger error: ${error.message}`);
    wrappedError.originalError = error;
    throw wrappedError;
  }
};

module.exports = {
  Log,
};
