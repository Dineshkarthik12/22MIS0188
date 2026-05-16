/**
 * One-time setup: sync .env to subprojects and register with evaluation API.
 * Usage: node scripts/setup.js
 */
const fs = require('fs');
const path = require('path');
const { rollNumberRoot, loadSharedEnv } = require('./loadEnv');

const ROOT_ENV = path.join(rollNumberRoot, '.env');
const TARGETS = [
  path.join(rollNumberRoot, 'logging_middleware', '.env'),
  path.join(rollNumberRoot, 'vehicle_maintenance_scheduler', '.env'),
];

const REQUIRED_FIELDS = ['EMAIL', 'NAME', 'MOBILE_NO', 'GITHUB_USERNAME', 'ROLL_NO', 'ACCESS_CODE'];

const readEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
};

const parseEnv = (content) => {
  const map = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    map[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return map;
};

const upsertEnvValue = (content, key, value) => {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  if (regex.test(content)) {
    return content.replace(regex, line);
  }
  return `${content.trim()}\n${line}\n`;
};

const syncEnvFiles = () => {
  if (!fs.existsSync(ROOT_ENV)) {
    const example = path.join(rollNumberRoot, '.env.example');
    if (fs.existsSync(example)) {
      fs.copyFileSync(example, ROOT_ENV);
      console.log('Created .env from .env.example — please fill in your credentials.');
    } else {
      throw new Error('Missing .env file. Create ROLL_NUMBER/.env with your evaluation credentials.');
    }
  }

  const rootContent = readEnvFile(ROOT_ENV);
  for (const target of TARGETS) {
    fs.writeFileSync(target, rootContent);
    console.log(`Synced → ${path.relative(rollNumberRoot, target)}`);
  }
};

const validateCredentials = () => {
  loadSharedEnv();
  const missing = REQUIRED_FIELDS.filter((key) => !process.env[key] || process.env[key].includes('your.'));
  if (missing.length > 0) {
    throw new Error(
      `Edit ROLL_NUMBER/.env and set: ${missing.join(', ')}\nGet these from your evaluation portal.`
    );
  }
};

const runRegistration = async () => {
  loadSharedEnv();

  if (process.env.CLIENT_ID && process.env.CLIENT_SECRET) {
    console.log('CLIENT_ID and CLIENT_SECRET already set — skipping registration.');
    return;
  }

  const { registerClient } = require(path.join(
    rollNumberRoot,
    'logging_middleware/src/services/registrationService'
  ));

  console.log('Registering with evaluation service...');
  const { clientID, clientSecret } = await registerClient();

  let content = readEnvFile(ROOT_ENV);
  content = upsertEnvValue(content, 'CLIENT_ID', clientID);
  content = upsertEnvValue(content, 'CLIENT_SECRET', clientSecret);
  fs.writeFileSync(ROOT_ENV, content);

  for (const target of TARGETS) {
    fs.writeFileSync(target, content);
  }

  console.log('Registration successful — CLIENT_ID and CLIENT_SECRET saved to .env files.');
};

const main = async () => {
  try {
    syncEnvFiles();
    validateCredentials();
    await runRegistration();
    console.log('\nSetup complete. Start the server:\n  cd vehicle_maintenance_scheduler\n  npm run dev\n');
  } catch (error) {
    console.error('\nSetup failed:', error.message);
    process.exit(1);
  }
};

main();
