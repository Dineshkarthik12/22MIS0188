const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { registerClient } = require('../src/services/registrationService');

const upsertEnvValue = (content, key, value) => {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  if (regex.test(content)) return content.replace(regex, line);
  return `${content.trim()}\n${line}\n`;
};

const saveCredentials = (clientID, clientSecret) => {
  const envPaths = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../vehicle_maintenance_scheduler/.env'),
  ];

  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;
    let content = fs.readFileSync(envPath, 'utf8');
    content = upsertEnvValue(content, 'CLIENT_ID', clientID);
    content = upsertEnvValue(content, 'CLIENT_SECRET', clientSecret);
    fs.writeFileSync(envPath, content);
    console.log(`Updated ${path.basename(path.dirname(envPath))}/${path.basename(envPath)}`);
  }
};

const runRegistration = async () => {
  try {
    console.log('Starting client registration with evaluation service...');
    const { clientID, clientSecret } = await registerClient();
    saveCredentials(clientID, clientSecret);
    console.log('\nRegistration successful. CLIENT_ID and CLIENT_SECRET saved.');
  } catch (error) {
    console.error('Registration failed:', error.message);
    process.exit(1);
  }
};

runRegistration();
