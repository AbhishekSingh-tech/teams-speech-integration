const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'teams-speech-integration' },
    transports: [
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        
        // Write all logs with level 'info' and below to combined.log
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Create a stream object for Morgan HTTP logging
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

// Helper methods for specific log types
logger.logCall = (callId, action, details = {}) => {
    logger.info(`Call ${action}`, {
        callId,
        action,
        ...details
    });
};

logger.logAudio = (callId, action, bytes, details = {}) => {
    logger.debug(`Audio ${action}`, {
        callId,
        action,
        bytes,
        ...details
    });
};

logger.logWebSocket = (action, details = {}) => {
    logger.info(`WebSocket ${action}`, {
        action,
        ...details
    });
};

logger.logTeams = (action, details = {}) => {
    logger.info(`Teams ${action}`, {
        action,
        ...details
    });
};

// Error logging with context
logger.logError = (error, context = {}) => {
    logger.error('Application error', {
        error: error.message,
        stack: error.stack,
        ...context
    });
};

module.exports = { logger }; 