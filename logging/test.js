// Marketing Suite/logging/test.js
// Test script to verify the logging implementation

const logger = require('./logger');
const config = require('./config');

console.log('=== Testing Marketing Suite Logging System ===');

// Test configuration
console.log('\n1. Configuration Test:');
console.log('Log Level:', config.logLevel);
console.log('Environment:', config.environment);
console.log('Service Name:', config.serviceName);
console.log('Console Enabled:', config.consoleEnabled);
console.log('File Enabled:', config.fileEnabled);

// Test different log levels
console.log('\n2. Log Level Testing:');
logger.debug('This is a debug message');
logger.info('This is an info message');
logger.warn('This is a warning message');
logger.error('This is an error message');

// Test structured logging with context
console.log('\n3. Structured Logging Test:');
logger.info('User login attempt', {
  userId: 'user_123',
  email: 'test@example.com',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0'
});

// Test error logging with stack trace
console.log('\n4. Error Logging Test:');
try {
  throw new Error('Test error for logging');
} catch (error) {
  logger.error('Caught an error', {
    error: error.message,
    stack: error.stack,
    context: 'test script'
  });
}

// Test logging with request context
console.log('\n5. Request Context Test:');
logger.info('API request processed', {
  requestId: 'req_456',
  endpoint: '/api/posts',
  method: 'POST',
  statusCode: 200,
  responseTime: '125ms'
});

console.log('\n6. Logger Stream Test:');
// Test the stream functionality
logger.stream.write('Stream test message\n');

console.log('\n=== Logging System Test Complete ===');
console.log('Check your console and log files for the structured JSON output.');

// Export for programmatic testing
module.exports = {
  testConfiguration: () => config,
  testLogging: () => {
    logger.info('Programmatic test log');
    return 'Logging test completed';
  }
};