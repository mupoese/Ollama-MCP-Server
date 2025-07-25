/**
 * Logging utility for the Ollama MCP Server
 * Provides structured logging with different levels
 */

import { getConfig } from '../config/index.js';

/**
 * Log levels
 */
export const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

/**
 * Logger class for structured logging
 */
class Logger {
  constructor() {
    this.config = getConfig();
  }

  /**
   * Format log message with timestamp and level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   * @returns {string} Formatted log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const baseLog = `[${timestamp}] [${level}] ${message}`;

    if (Object.keys(meta).length > 0) {
      return `${baseLog} ${JSON.stringify(meta)}`;
    }

    return baseLog;
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Error|Object} [error] - Error object or metadata
   */
  error(message, error = {}) {
    const meta = error instanceof Error
      ? { error: error.message, stack: error.stack }
      : error;

    // Always log errors to stderr, regardless of SILENCE_STARTUP
    console.error(this.formatMessage(LOG_LEVELS.ERROR, message, meta));
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} [meta] - Additional metadata
   */
  warn(message, meta = {}) {
    if (!this.config.SILENCE_STARTUP) {
      console.error(this.formatMessage(LOG_LEVELS.WARN, message, meta));
    }
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {Object} [meta] - Additional metadata
   */
  info(message, meta = {}) {
    if (!this.config.SILENCE_STARTUP) {
      console.error(this.formatMessage(LOG_LEVELS.INFO, message, meta));
    }
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {Object} [meta] - Additional metadata
   */
  debug(message, meta = {}) {
    if (this.config.DEBUG && !this.config.SILENCE_STARTUP) {
      console.error(this.formatMessage(LOG_LEVELS.DEBUG, message, meta));
    }
  }
}

// Export singleton logger instance
export const logger = new Logger();
