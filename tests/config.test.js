/**
 * Tests for configuration module
 */

import { loadConfig, getConfig } from '../src/config/index.js';

describe('Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('loadConfig', () => {
    test('should load default configuration', () => {
      delete process.env.OLLAMA_API;
      delete process.env.SILENCE_STARTUP;
      delete process.env.DEBUG;

      const config = loadConfig();

      expect(config.OLLAMA_API).toBe('http://host.docker.internal:11434');
      expect(config.SILENCE_STARTUP).toBe(false);
      expect(config.DEBUG).toBe(false);
      expect(config.SERVER_NAME).toBe('ollama-mcp-server');
      expect(config.SERVER_VERSION).toBe('1.0.0');
      expect(config.REQUEST_TIMEOUT).toBe(30000);
      expect(config.MAX_RETRIES).toBe(3);
    });

    test('should load configuration from environment variables', () => {
      process.env.OLLAMA_API = 'http://localhost:8080';
      process.env.SILENCE_STARTUP = 'true';
      process.env.DEBUG = 'true';
      process.env.REQUEST_TIMEOUT = '60000';
      process.env.MAX_RETRIES = '5';

      const config = loadConfig();

      expect(config.OLLAMA_API).toBe('http://localhost:8080');
      expect(config.SILENCE_STARTUP).toBe(true);
      expect(config.DEBUG).toBe(true);
      expect(config.REQUEST_TIMEOUT).toBe(60000);
      expect(config.MAX_RETRIES).toBe(5);
    });

    test('should throw error for invalid OLLAMA_API URL', () => {
      process.env.OLLAMA_API = 'invalid-url';

      expect(() => loadConfig()).toThrow('Invalid OLLAMA_API URL');
    });

    test('should throw error for invalid REQUEST_TIMEOUT', () => {
      process.env.REQUEST_TIMEOUT = '500';

      expect(() => loadConfig()).toThrow('REQUEST_TIMEOUT must be at least 1000ms');
    });

    test('should throw error for invalid MAX_RETRIES', () => {
      process.env.MAX_RETRIES = '15';

      expect(() => loadConfig()).toThrow('MAX_RETRIES must be between 0 and 10');
    });
  });

  describe('getConfig', () => {
    test('should return current configuration', () => {
      const config = getConfig();
      expect(config).toBeDefined();
      expect(typeof config.OLLAMA_API).toBe('string');
      expect(typeof config.SILENCE_STARTUP).toBe('boolean');
    });
  });
});
