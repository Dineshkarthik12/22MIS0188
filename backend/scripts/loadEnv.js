const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const rollNumberRoot = path.resolve(__dirname, '..');

const loadSharedEnv = () => {
  const envPaths = [
    path.join(rollNumberRoot, '.env'),
    path.join(rollNumberRoot, 'logging_middleware', '.env'),
    path.join(rollNumberRoot, 'vehicle_maintenance_scheduler', '.env'),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false });
    }
  }
};

module.exports = {
  rollNumberRoot,
  loadSharedEnv,
};
