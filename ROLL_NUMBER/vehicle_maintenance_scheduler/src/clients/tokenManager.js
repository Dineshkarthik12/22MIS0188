const httpClient = require('./httpClient');
const { config, validateAuthConfig } = require('../config');
const { safeLog } = require('../utils/logger');

let cachedAccessToken = null;
let tokenExpiresAt = null;

const clearTokenCache = () => {
  cachedAccessToken = null;
  tokenExpiresAt = null;
};

const setTokenCache = (accessToken, expiresInSeconds) => {
  cachedAccessToken = accessToken;
  tokenExpiresAt = expiresInSeconds
    ? Date.now() + expiresInSeconds * 1000
    : Date.now() + 55 * 60 * 1000;
};

const isTokenExpired = () => {
  if (!cachedAccessToken) return true;
  if (!tokenExpiresAt) return false;
  return Date.now() >= tokenExpiresAt - 30 * 1000;
};

const authenticate = async (retryAttempt = 0) => {
  validateAuthConfig();

  try {
    await safeLog('info', 'auth', 'Evaluation service authentication request initiated');

    const response = await httpClient.post('/auth', {
      email: config.email,
      name: config.name,
      rollNo: config.rollNo,
      accessCode: config.accessCode,
      clientID: config.clientId,
      clientSecret: config.clientSecret,
    });

    const accessToken =
      response.data?.access_token ||
      response.data?.accessToken ||
      response.data?.token;

    if (!accessToken) {
      throw new Error('Auth response missing access_token field');
    }

    const expiresIn = response.data?.expires_in || response.data?.expiresIn || null;
    setTokenCache(accessToken, expiresIn);

    await safeLog('info', 'auth', 'Evaluation service access token obtained and cached successfully');
    return accessToken;
  } catch (error) {
    if (retryAttempt < 1) {
      clearTokenCache();
      await safeLog('warn', 'auth', 'Authentication failed; retrying once with cleared token cache');
      return authenticate(retryAttempt + 1);
    }

    const apiMessage = error.response?.data?.message || error.response?.data?.error;
    throw new Error(
      `Failed to authenticate with evaluation service after retry: ${apiMessage || error.message}`
    );
  }
};

const getAccessToken = async (forceRefresh = false) => {
  if (!forceRefresh && cachedAccessToken && !isTokenExpired()) {
    return cachedAccessToken;
  }

  clearTokenCache();
  await safeLog('info', 'auth', 'Access token expired or missing; refreshing Bearer token');
  return authenticate();
};

module.exports = {
  getAccessToken,
  clearTokenCache,
  isTokenExpired,
};
