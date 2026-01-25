// Marketing Suite/logging/index.js
// Main logging module that provides a unified interface for both Node.js and Python

const logger = require('./logger');
const config = require('./config');

module.exports = {
  logger,
  config
};