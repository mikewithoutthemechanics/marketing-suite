// Marketing Suite/logging/transports/consoleTransport.js
// Custom console transport with enhanced features

const winston = require('winston');
const { format } = require('winston');
const { combine, colorize, timestamp, printf } = format;

class ConsoleTransport extends winston.transports.Console {
  constructor(options) {
    super(options);
    this.customFormat = options.format || combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      printf((info) => {
        return `${info.timestamp} [${info.level}]: ${info.message}`;
      })
    );
  }
  
  log(info, callback) {
    // Add service context
    info.service = process.env.SERVICE_NAME || 'marketing-suite';
    info.environment = process.env.NODE_ENV || 'development';
    
    super.log(info, callback);
  }
}

module.exports = ConsoleTransport;