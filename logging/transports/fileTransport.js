// Marketing Suite/logging/transports/fileTransport.js
// Custom file transport with rotation and retention

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { format } = require('winston');
const { combine, timestamp, json } = format;

class FileTransport extends DailyRotateFile {
  constructor(options) {
    const defaultOptions = {
      filename: options.filename || 'logs/application-%DATE%.log',
      datePattern: options.datePattern || 'YYYY-MM-DD',
      maxSize: options.maxSize || '20m',
      maxFiles: options.maxFiles || '14d',
      level: options.level || 'info',
      format: options.format || combine(
        timestamp(),
        json()
      ),
      zippedArchive: options.zippedArchive !== undefined ? options.zippedArchive : true
    };
    
    super(defaultOptions);
  }
}

module.exports = FileTransport;