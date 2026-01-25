// Marketing Suite/logging/formatters/jsonFormatter.js
// Custom JSON formatter for Winston

const { format } = require('winston');
const { combine, timestamp, printf } = format;

const jsonFormatter = combine(
  timestamp(),
  printf((info) => {
    const logObject = {
      timestamp: info.timestamp,
      level: info.level,
      message: info.message,
      service: process.env.SERVICE_NAME || 'marketing-suite',
      environment: process.env.NODE_ENV || 'development'
    };
    
    // Add additional context if available
    if (info.context) {
      logObject.context = info.context;
    }
    
    if (info.requestId) {
      logObject.requestId = info.requestId;
    }
    
    if (info.userId) {
      logObject.userId = info.userId;
    }
    
    if (info.sessionId) {
      logObject.sessionId = info.sessionId;
    }
    
    // Handle errors
    if (info instanceof Error) {
      logObject.error = {
        message: info.message,
        stack: info.stack
      };
    }
    
    // Add metadata if available
    if (info.metadata) {
      logObject.metadata = info.metadata;
    }
    
    return JSON.stringify(logObject);
  })
);

module.exports = jsonFormatter;