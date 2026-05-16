const {
  ALLOWED_STACKS,
  ALLOWED_LEVELS,
  BACKEND_PACKAGES,
} = require('../constants');

const validateLogInputs = (stack, level, packageName, message) => {
  if (!stack || typeof stack !== 'string') {
    throw new Error('Log validation failed: stack is required and must be a string');
  }

  if (!ALLOWED_STACKS.includes(stack)) {
    throw new Error(
      `Log validation failed: invalid stack "${stack}". Allowed: ${ALLOWED_STACKS.join(', ')}`
    );
  }

  if (!level || typeof level !== 'string') {
    throw new Error('Log validation failed: level is required and must be a string');
  }

  if (!ALLOWED_LEVELS.includes(level)) {
    throw new Error(
      `Log validation failed: invalid level "${level}". Allowed: ${ALLOWED_LEVELS.join(', ')}`
    );
  }

  if (!packageName || typeof packageName !== 'string') {
    throw new Error('Log validation failed: packageName is required and must be a string');
  }

  if (stack === 'backend' && !BACKEND_PACKAGES.includes(packageName)) {
    throw new Error(
      `Log validation failed: invalid backend package "${packageName}". Allowed: ${BACKEND_PACKAGES.join(', ')}`
    );
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('Log validation failed: message is required and must be a non-empty string');
  }
};

module.exports = {
  validateLogInputs,
};
