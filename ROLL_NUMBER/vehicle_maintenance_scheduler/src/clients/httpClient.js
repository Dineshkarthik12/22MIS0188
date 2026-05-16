const axios = require('axios');
const { config } = require('../config');

const httpClient = axios.create({
  baseURL: config.baseUrl,
  timeout: config.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

module.exports = httpClient;
