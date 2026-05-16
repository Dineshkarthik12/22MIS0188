const ALLOWED_STACKS = ['backend', 'frontend'];

const ALLOWED_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];

const BACKEND_PACKAGES = [
  'cache',
  'controller',
  'cron_job',
  'db',
  'domain',
  'handler',
  'repository',
  'route',
  'service',
  'auth',
  'config',
  'middleware',
  'utils',
];

const API_PATHS = {
  REGISTER: '/register',
  AUTH: '/auth',
  LOGS: '/logs',
};

module.exports = {
  ALLOWED_STACKS,
  ALLOWED_LEVELS,
  BACKEND_PACKAGES,
  API_PATHS,
};
