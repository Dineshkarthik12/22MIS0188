const { sendError } = require('../utils/response');
const { safeLog } = require('../utils/logger');

const validateBody = (validatorFn) => {
  return async (req, res, next) => {
    const errors = validatorFn(req.body);

    if (errors.length > 0) {
      const message = `Request validation failed: ${errors.join('; ')}`;
      await safeLog('warn', 'middleware', message);
      return sendError(res, 400, message);
    }

    return next();
  };
};

module.exports = {
  validateBody,
};
