const axios = require('axios');
const { config } = require('../config');

const httpClient = axios.create({
  baseURL: config.baseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

module.exports = httpClient;
