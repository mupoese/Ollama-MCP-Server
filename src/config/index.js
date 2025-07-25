/**
 * Configuration module for the Ollama MCP Server
 * Handles environment variables and configuration validation
 */

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  OLLAMA_API: 'http://host.docker.internal:11434',
  SILENCE_STARTUP: false,
  DEBUG: false,
  SERVER_NAME: 'ollama-mcp-server',
  SERVER_VERSION: '1.0.0',
  REQUEST_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
};

/**
 * Load and validate configuration from environment variables
 * @returns {Object} Configuration object
 */
export function loadConfig() {
  const config = {
    OLLAMA_API: process.env.OLLAMA_API || DEFAULT_CONFIG.OLLAMA_API,
    SILENCE_STARTUP: process.env.SILENCE_STARTUP === 'true',
    DEBUG: process.env.DEBUG === 'true',
    SERVER_NAME: process.env.SERVER_NAME || DEFAULT_CONFIG.SERVER_NAME,
    SERVER_VERSION: process.env.SERVER_VERSION || DEFAULT_CONFIG.SERVER_VERSION,
    REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT) || DEFAULT_CONFIG.REQUEST_TIMEOUT,
    MAX_RETRIES: parseInt(process.env.MAX_RETRIES) || DEFAULT_CONFIG.MAX_RETRIES,
  };

  // Validate configuration
  validateConfig(config);

  return config;
}

/**
 * Validate configuration values
 * @param {Object} config - Configuration object to validate
 * @throws {Error} If configuration is invalid
 */
function validateConfig(config) {
  if (!config.OLLAMA_API) {
    throw new Error('OLLAMA_API configuration is required');
  }

  try {
    new globalThis.URL(config.OLLAMA_API);
  } catch {
    throw new Error(`Invalid OLLAMA_API URL: ${config.OLLAMA_API}`);
  }

  if (config.REQUEST_TIMEOUT < 1000) {
    throw new Error('REQUEST_TIMEOUT must be at least 1000ms');
  }

  if (config.MAX_RETRIES < 0 || config.MAX_RETRIES > 10) {
    throw new Error('MAX_RETRIES must be between 0 and 10');
  }
}

/**
 * Get current configuration
 * @returns {Object} Current configuration
 */
export function getConfig() {
  return loadConfig();
}
