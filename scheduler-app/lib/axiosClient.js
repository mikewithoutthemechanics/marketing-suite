const axios = require('axios');
const axiosRetry = require('axios-retry');

const client = axios.create({ timeout: 15000 });
axiosRetry(client, { retries: 3, retryDelay: axiosRetry.exponentialDelay, retryCondition: axiosRetry.isNetworkOrIdempotentRequestError });

module.exports = client;
