const httpClient = require('./httpClient');
const { getAccessToken, clearTokenCache } = require('./tokenManager');
const { safeLog } = require('../utils/logger');
const { AppError } = require('../utils/errors');

const authorizedGet = async (path, resourceName) => {
  let accessToken = await getAccessToken();

  const executeRequest = async (token) => {
    return httpClient.get(path, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  try {
    await safeLog('info', 'service', `Fetching ${resourceName} from evaluation API at ${path}`);
    const response = await executeRequest(accessToken);
    await safeLog(
      'info',
      'service',
      `${resourceName} API fetch completed successfully with status ${response.status}`
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      await safeLog(
        'warn',
        'auth',
        `Failed to fetch ${resourceName} due to expired authorization token; refreshing token`
      );
      clearTokenCache();
      accessToken = await getAccessToken(true);
      try {
        const retryResponse = await executeRequest(accessToken);
        await safeLog('info', 'service', `${resourceName} API fetch succeeded after token refresh`);
        return retryResponse.data;
      } catch (retryError) {
        const msg = retryError.response?.data?.message || retryError.message;
        throw new AppError(
          `Failed to fetch ${resourceName} after token refresh: ${msg}`,
          retryError.response?.status || 502
        );
      }
    }

    if (error.code === 'ECONNABORTED') {
      throw new AppError(`Evaluation API timeout while fetching ${resourceName}`, 504);
    }

    const apiMessage = error.response?.data?.message || error.message;
    throw new AppError(`Unable to fetch ${resourceName} API: ${apiMessage}`, error.response?.status || 502);
  }
};

const normalizeArray = (data, key, resourceName) => {
  const items = data?.[key] || data;
  if (!Array.isArray(items)) {
    throw new AppError(`Invalid ${resourceName} API response: expected array under "${key}"`, 502);
  }
  return items;
};

const fetchDepots = async () => {
  const data = await authorizedGet('/depots', 'depots');
  return normalizeArray(data, 'depots', 'depots');
};

const fetchVehicles = async () => {
  const data = await authorizedGet('/vehicles', 'vehicles');
  return normalizeArray(data, 'vehicles', 'vehicles');
};

const fetchNotifications = async () => {
  const data = await authorizedGet('/notifications', 'notifications');
  return normalizeArray(data, 'notifications', 'notifications');
};

module.exports = {
  fetchDepots,
  fetchVehicles,
  fetchNotifications,
};
