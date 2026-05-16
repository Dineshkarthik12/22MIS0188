const httpClient = require('../utils/httpClient');
const { getAccessToken, clearTokenCache } = require('./authService');
const { API_PATHS } = require('../constants');

const sendLogToApi = async (payload, accessToken) => {
  try {
    const response = await httpClient.post(API_PATHS.LOGS, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      const authError = new Error('LOG_AUTH_EXPIRED');
      authError.isAuthExpired = true;
      throw authError;
    }

    const apiMessage = error.response?.data?.message || error.response?.data?.error;
    throw new Error(`Log API request failed: ${apiMessage || error.message}`);
  }
};

const submitLog = async (stack, level, packageName, message) => {
  const payload = {
    stack,
    level,
    package: packageName,
    message,
  };

  let accessToken = await getAccessToken();

  try {
    return await sendLogToApi(payload, accessToken);
  } catch (error) {
    if (error.isAuthExpired || error.message === 'LOG_AUTH_EXPIRED') {
      clearTokenCache();
      accessToken = await getAccessToken(true);
      return sendLogToApi(payload, accessToken);
    }
    throw error;
  }
};

module.exports = {
  submitLog,
};
