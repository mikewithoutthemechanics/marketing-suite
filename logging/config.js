// Marketing Suite/logging/config.js
// Centralized logging configuration with environment-specific settings

const path = require('path');

// Base configuration
const baseConfig = {
  logLevel: process.env.LOG_LEVEL || 'info',
  jsonFormatter: require('./formatters/jsonFormatter'),
  serviceName: process.env.SERVICE_NAME || 'marketing-suite',
  environment: process.env.NODE_ENV || 'development'
};

// Environment-specific configurations
const envConfigs = {
  development: {
    logLevel: 'debug',
    consoleEnabled: true,
    fileEnabled: false,
    maxFileSize: '10m',
    maxFiles: '7d'
  },
  production: {
    logLevel: 'info',
    consoleEnabled: true,
    fileEnabled: true,
    maxFileSize: '20m',
    maxFiles: '14d',
    errorMaxFiles: '30d'
  },
  test: {
    logLevel: 'error',
    consoleEnabled: true,
    fileEnabled: false
  }
};

// Merge configurations
const config = {
  ...baseConfig,
  ...envConfigs[baseConfig.environment]
};

// Ensure logs directory exists in production
if (config.fileEnabled && config.environment === 'production') {
  const fs = require('fs');
  const logsDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

module.exports = config;