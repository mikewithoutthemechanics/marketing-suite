# Marketing Suite/logging/python_logger.py
# Python logging implementation with structured JSON logging

import logging
import json
import os
from datetime import datetime
from typing import Dict, Any

class JSONFormatter(logging.Formatter):
    """Custom formatter for JSON structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'message': record.getMessage(),
            'logger': record.name,
            'service': os.getenv('SERVICE_NAME', 'marketing-suite'),
            'environment': os.getenv('NODE_ENV', 'development')
        }
        
        # Add extra fields if they exist
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        if hasattr(record, 'session_id'):
            log_data['session_id'] = record.session_id
        
        # Add exception info if available
        if record.exc_info:
            log_data['error'] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)

class RotatingFileHandler(logging.handlers.RotatingFileHandler):
    """Custom rotating file handler with enhanced rotation"""
    
    def __init__(self, filename: str, maxBytes: int = 20971520, backupCount: int = 14, **kwargs):
        super().__init__(filename, maxBytes=maxBytes, backupCount=backupCount, **kwargs)

def setup_logger(name: str = 'marketing-suite', level: str = None) -> logging.Logger:
    """Setup and configure the logger with structured JSON logging"""
    
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(level or os.getenv('LOG_LEVEL', 'INFO').upper())
    
    # Prevent duplicate handlers
    if logger.handlers:
        return logger
    
    # Create formatter
    formatter = JSONFormatter()
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (only in production)
    if os.getenv('NODE_ENV') == 'production':
        # Ensure logs directory exists
        os.makedirs('logs', exist_ok=True)
        
        # Application logs
        file_handler = RotatingFileHandler(
            filename='logs/python-application.log',
            maxBytes=20971520,  # 20MB
            backupCount=14
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        
        # Error logs
        error_handler = RotatingFileHandler(
            filename='logs/python-error.log',
            maxBytes=20971520,  # 20MB
            backupCount=30
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(formatter)
        logger.addHandler(error_handler)
    
    return logger

# Create default logger instance
logger = setup_logger()

# Helper methods for different log levels
def debug(message: str, extra: Dict[str, Any] = None):
    if extra:
        logger.debug(message, extra=extra)
    else:
        logger.debug(message)

def info(message: str, extra: Dict[str, Any] = None):
    if extra:
        logger.info(message, extra=extra)
    else:
        logger.info(message)

def warn(message: str, extra: Dict[str, Any] = None):
    if extra:
        logger.warning(message, extra=extra)
    else:
        logger.warning(message)

def error(message: str, extra: Dict[str, Any] = None):
    if extra:
        logger.error(message, extra=extra)
    else:
        logger.error(message)

if __name__ == '__main__':
    # Test the logger
    logger.info('Python logger initialized successfully')
    logger.debug('Debug message test')
    logger.warning('Warning message test')
    logger.error('Error message test')