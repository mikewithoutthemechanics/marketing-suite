// Marketing Suite/logging/logger.js
// Node.js Winston logger implementation

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { combine, timestamp } = winston.format;
const config = require('./config');

// Custom JSON formatter
const jsonFormatter = config.jsonFormatter;

// Create transports for different environments
const transports = [];

// Console transport (always available)
transports.push(
  new winston.transports.Console({
    level: config.logLevel,
    format: combine(
      timestamp(),
      jsonFormatter
    )
  })
);

// File transport with rotation for production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: config.logLevel,
      format: combine(
        timestamp(),
        jsonFormatter
      )
    })
  );
  
  // Error-specific log file
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: combine(
        timestamp(),
        jsonFormatter
      )
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(
    timestamp(),
    jsonFormatter
  ),
  transports: transports,
  exitOnError: false
});

// Add stream method for morgan or other stream-based logging
logger.stream = {
  write: function(message) {
    logger.info(message.trim());
  }
};

module.exports = logger;