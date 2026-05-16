require('dotenv').config();

const config = {
  baseUrl: process.env.EVALUATION_BASE_URL || 'http://4.224.186.213/evaluation-service',
  email: process.env.EMAIL,
  name: process.env.NAME,
  mobileNo: process.env.MOBILE_NO,
  githubUsername: process.env.GITHUB_USERNAME,
  rollNo: process.env.ROLL_NO,
  accessCode: process.env.ACCESS_CODE,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
};

const validateRegistrationConfig = () => {
  const required = ['email', 'name', 'mobileNo', 'githubUsername', 'rollNo', 'accessCode'];
  const missing = required.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Registration config missing: ${missing.join(', ')}`);
  }
};

const validateAuthConfig = () => {
  const required = ['email', 'name', 'rollNo', 'accessCode', 'clientId', 'clientSecret'];
  const missing = required.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Auth config missing: ${missing.join(', ')}. Run registration first.`);
  }
};

module.exports = {
  config,
  validateRegistrationConfig,
  validateAuthConfig,
};
