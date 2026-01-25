require('dotenv').config();

const { configSchema } = require('./schema');
const env = process.env.NODE_ENV || 'development';
const envConfig = require(`./environments/${env}`);

const configEnv = {
  ...envConfig,
  ...process.env,
};

const config = configSchema.validate(configEnv, { stripUnknown: true });

module.exports = config;