const httpClient = require('../utils/httpClient');
const { config, validateAuthConfig } = require('../config');
const { API_PATHS } = require('../constants');

let cachedAccessToken = null;
let tokenExpiresAt = null;

const clearTokenCache = () => {
  cachedAccessToken = null;
  tokenExpiresAt = null;
};

const setTokenCache = (accessToken, expiresInSeconds) => {
  cachedAccessToken = accessToken;
  if (expiresInSeconds) {
    tokenExpiresAt = Date.now() + expiresInSeconds * 1000;
  } else {
    // Default 55 minutes if expiry not provided
    tokenExpiresAt = Date.now() + 55 * 60 * 1000;
  }
};

const isTokenExpired = () => {
  if (!cachedAccessToken) return true;
  if (!tokenExpiresAt) return false;
  return Date.now() >= tokenExpiresAt - 30 * 1000;
};

const authenticate = async (retryAttempt = 0) => {
  validateAuthConfig();

  try {
    const response = await httpClient.post(API_PATHS.AUTH, {
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
      throw new Error('Auth response missing access_token');
    }

    const expiresIn =
      response.data?.expires_in ||
      response.data?.expiresIn ||
      null;

    setTokenCache(accessToken, expiresIn);
    return accessToken;
  } catch (error) {
    if (retryAttempt < 1) {
      clearTokenCache();
      return authenticate(retryAttempt + 1);
    }

    const apiMessage = error.response?.data?.message || error.response?.data?.error;
    throw new Error(`Authentication failed after retry: ${apiMessage || error.message}`);
  }
};

const getAccessToken = async (forceRefresh = false) => {
  if (!forceRefresh && cachedAccessToken && !isTokenExpired()) {
    return cachedAccessToken;
  }

  clearTokenCache();
  return authenticate();
};

module.exports = {
  authenticate,
  getAccessToken,
  clearTokenCache,
  isTokenExpired,
};
