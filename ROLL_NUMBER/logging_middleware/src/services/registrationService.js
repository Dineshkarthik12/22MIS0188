const httpClient = require('../utils/httpClient');
const { config, validateRegistrationConfig } = require('../config');
const { API_PATHS } = require('../constants');

const registerClient = async () => {
  validateRegistrationConfig();

  try {
    const response = await httpClient.post(API_PATHS.REGISTER, {
      email: config.email,
      name: config.name,
      mobileNo: config.mobileNo,
      githubUsername: config.githubUsername,
      rollNo: config.rollNo,
      accessCode: config.accessCode,
    });

    const clientID = response.data?.clientID || response.data?.clientId;
    const clientSecret = response.data?.clientSecret;

    if (!clientID || !clientSecret) {
      throw new Error(
        'Registration response missing clientID or clientSecret. Check API response format.'
      );
    }

    return { clientID, clientSecret };
  } catch (error) {
    const apiMessage = error.response?.data?.message || error.response?.data?.error;
    throw new Error(
      `Registration failed: ${apiMessage || error.message}`
    );
  }
};

module.exports = {
  registerClient,
};
