/**
 * @fileoverview Advanced logging system for Moosek Music Bot
 * @author ryxu-xo
 * @version 1.0.0
 */

const winston = require('winston');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom format for console output with colors
 */
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack }) => {
        const time = chalk.gray(`[${timestamp}]`);
        let levelColor = '';
        
        switch (level) {
            case 'error':
                levelColor = chalk.red.bold('ERROR');
                break;
            case 'warn':
                levelColor = chalk.yellow.bold('WARN');
                break;
            case 'info':
                levelColor = chalk.blue.bold('INFO');
                break;
            case 'debug':
                levelColor = chalk.magenta.bold('DEBUG');
                break;
            default:
                levelColor = chalk.white.bold(level.toUpperCase());
        }
        
        const content = stack || message;
        return `${time} ${levelColor} ${content}`;
    })
);

/**
 * File format for persistent logging
 */
const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

/**
 * Create the main logger instance
 */
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: fileFormat,
    defaultMeta: { service: 'moosek-bot' },
    transports: [
        // Error log file
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Combined log file
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

/**
 * Enhanced logging methods with better formatting
 */
class Logger {
    /**
     * Log an info message
     * @param {string} message - The message to log
     * @param {Object} meta - Additional metadata
     */
    static info(message, meta = {}) {
        logger.info(message, meta);
    }

    /**
     * Log a warning message
     * @param {string} message - The message to log
     * @param {Object} meta - Additional metadata
     */
    static warn(message, meta = {}) {
        logger.warn(message, meta);
    }

    /**
     * Log an error message
     * @param {string} message - The message to log
     * @param {Error|Object} error - Error object or metadata
     */
    static error(message, error = {}) {
        if (error instanceof Error) {
            logger.error(message, { stack: error.stack, ...error });
        } else {
            logger.error(message, error);
        }
    }

    /**
     * Log a debug message
     * @param {string} message - The message to log
     * @param {Object} meta - Additional metadata
     */
    static debug(message, meta = {}) {
        logger.debug(message, meta);
    }

    /**
     * Log a success message (info level with success formatting)
     * @param {string} message - The message to log
     * @param {Object} meta - Additional metadata
     */
    static success(message, meta = {}) {
        logger.info(chalk.green(`✓ ${message}`), meta);
    }

    /**
     * Log a command execution
     * @param {string} command - Command name
     * @param {string} user - User who executed the command
     * @param {string} guild - Guild where command was executed
     */
    static command(command, user, guild) {
        logger.info(`Command executed: ${command}`, {
            user: user,
            guild: guild,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Log a music event
     * @param {string} event - Event name
     * @param {string} guild - Guild ID
     * @param {Object} data - Event data
     */
    static music(event, guild, data = {}) {
        logger.info(`Music event: ${event}`, {
            guild: guild,
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Log system startup information
     * @param {Object} info - Startup information
     */
    static startup(info) {
        logger.info('Bot startup', info);
    }

    /**
     * Log system shutdown information
     * @param {Object} info - Shutdown information
     */
    static shutdown(info) {
        logger.info('Bot shutdown', info);
    }
}

module.exports = Logger;
