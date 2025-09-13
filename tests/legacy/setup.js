/**
 * Test setup file
 * Global test configuration and mocks
 */

// Mock console methods to prevent test output pollution
global.console = {
  ...console,
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
};

// Set test environment variables
process.env.OLLAMA_API = 'http://localhost:11434';
process.env.SILENCE_STARTUP = 'true';
process.env.DEBUG = 'false';
