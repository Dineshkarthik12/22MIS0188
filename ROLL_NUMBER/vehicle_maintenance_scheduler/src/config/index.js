const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  baseUrl: process.env.EVALUATION_BASE_URL || 'http://4.224.186.213/evaluation-service',
  email: process.env.EMAIL,
  name: process.env.NAME,
  mobileNo: process.env.MOBILE_NO,
  githubUsername: process.env.GITHUB_USERNAME,
  rollNo: process.env.ROLL_NO,
  accessCode: process.env.ACCESS_CODE,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  apiTimeout: parseInt(process.env.API_TIMEOUT, 10) || 15000,
  priorityInboxSize: parseInt(process.env.PRIORITY_INBOX_SIZE, 10) || 10,
};

const validateAuthConfig = () => {
  const required = ['email', 'name', 'rollNo', 'accessCode', 'clientId', 'clientSecret'];
  const missing = required.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(
      `Evaluation API auth config incomplete: missing ${missing.join(', ')}. Register client and update .env.`
    );
  }
};

module.exports = {
  config,
  validateAuthConfig,
};
