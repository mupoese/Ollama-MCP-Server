/**
 * HTTP client utility with retry logic for Ollama API calls
 */

import axios from 'axios';
import { getConfig } from '../config/index.js';
import { logger } from './logger.js';

/**
 * HTTP client class for making requests to Ollama API
 */
export class OllamaClient {
  constructor() {
    this.config = getConfig();
    this.baseURL = this.config.OLLAMA_API;

    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.config.REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Make HTTP request with retry logic
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} [data] - Request data
   * @param {number} [retries] - Number of retries remaining
   * @returns {Promise<Object>} Response data
   * @throws {Error} If request fails after all retries
   */
  async makeRequest(method, endpoint, data = null, retries = this.config.MAX_RETRIES) {
    try {
      logger.debug(`Making ${method.toUpperCase()} request to ${endpoint}`, {
        endpoint,
        hasData: !!data,
        retries,
      });

      const response = await this.client.request({
        method,
        url: endpoint,
        data,
      });

      logger.debug('Request successful', {
        endpoint,
        status: response.status,
        hasData: !!response.data,
      });

      return response.data;
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);

      logger.warn('Request failed', {
        endpoint,
        error: errorMessage,
        retriesLeft: retries,
        status: error.response?.status,
      });

      // If we have retries left and it's a retryable error, try again
      if (retries > 0 && this.isRetryableError(error)) {
        const delay = this.calculateRetryDelay(this.config.MAX_RETRIES - retries);
        logger.debug(`Retrying request after ${delay}ms delay`);

        await this.sleep(delay);
        return this.makeRequest(method, endpoint, data, retries - 1);
      }

      // No more retries or non-retryable error
      const finalError = new Error(`Ollama API request failed: ${errorMessage}`);
      finalError.originalError = error;
      finalError.endpoint = endpoint;
      finalError.status = error.response?.status;

      throw finalError;
    }
  }

  /**
   * Extract error message from axios error
   * @param {Error} error - Axios error
   * @returns {string} Error message
   */
  extractErrorMessage(error) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }

    if (error.response?.statusText) {
      return `${error.response.status} ${error.response.statusText}`;
    }

    if (error.code === 'ECONNREFUSED') {
      return 'Connection refused - is Ollama running?';
    }

    if (error.code === 'ETIMEDOUT') {
      return 'Request timeout';
    }

    return error.message || 'Unknown error';
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is retryable
   */
  isRetryableError(error) {
    // Don't retry client errors (4xx)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return false;
    }

    // Retry server errors (5xx), timeouts, and connection errors
    return (
      error.response?.status >= 500 ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND'
    );
  }

  /**
   * Calculate retry delay with exponential backoff
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {number} Delay in milliseconds
   */
  calculateRetryDelay(attempt) {
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds

    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;

    return Math.floor(delay + jitter);
  }

  /**
   * Sleep for specified duration
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make GET request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>} Response data
   */
  async get(endpoint) {
    return this.makeRequest('GET', endpoint);
  }

  /**
   * Make POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @returns {Promise<Object>} Response data
   */
  async post(endpoint, data) {
    return this.makeRequest('POST', endpoint, data);
  }
}

// Export singleton client instance
export const ollamaClient = new OllamaClient();
