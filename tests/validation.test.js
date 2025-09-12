/**
 * Tests for validation utilities
 */

import {
  ValidationError,
  validateRequiredString,
  validateRequiredArray,
  validateChatMessages,
  validateOptions,
  validateChatArgs,
  validateGenerateArgs,
  validatePullModelArgs,
  validateCodeFeedbackArgs,
} from '../src/utils/validation.js';

describe('Validation', () => {
  describe('ValidationError', () => {
    test('should create validation error with message and field', () => {
      const error = new ValidationError('Test error', 'testField');
      expect(error.message).toBe('Test error');
      expect(error.field).toBe('testField');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('validateRequiredString', () => {
    test('should pass for valid string', () => {
      expect(() => validateRequiredString('test', 'field')).not.toThrow();
    });

    test('should throw for non-string', () => {
      expect(() => validateRequiredString(123, 'field')).toThrow('field must be a string, received number');
    });

    test('should throw for empty string', () => {
      expect(() => validateRequiredString('', 'field')).toThrow('field is required and cannot be empty');
    });

    test('should throw for whitespace-only string', () => {
      expect(() => validateRequiredString('   ', 'field')).toThrow('field is required and cannot be empty');
    });
  });

  describe('validateRequiredArray', () => {
    test('should pass for valid non-empty array', () => {
      expect(() => validateRequiredArray(['item'], 'field')).not.toThrow();
    });

    test('should throw for non-array', () => {
      expect(() => validateRequiredArray('not array', 'field')).toThrow('field must be a array, received string');
    });

    test('should throw for empty array', () => {
      expect(() => validateRequiredArray([], 'field')).toThrow('field is required and cannot be empty');
    });
  });

  describe('validateChatMessages', () => {
    test('should pass for valid messages', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];
      expect(() => validateChatMessages(messages)).not.toThrow();
    });

    test('should throw for invalid message object', () => {
      const messages = ['invalid'];
      expect(() => validateChatMessages(messages)).toThrow('messages[0] must be a object, received string');
    });

    test('should throw for missing role', () => {
      const messages = [{ content: 'Hello' }];
      expect(() => validateChatMessages(messages)).toThrow('messages[0].role is required and cannot be empty');
    });

    test('should throw for invalid role', () => {
      const messages = [{ role: 'invalid', content: 'Hello' }];
      expect(() => validateChatMessages(messages)).toThrow('messages[0].role has invalid value "invalid". Allowed values: system, user, assistant');
    });

    test('should throw for non-string content', () => {
      const messages = [{ role: 'user', content: 123 }];
      expect(() => validateChatMessages(messages)).toThrow('messages[0].content must be a string, received number');
    });

    test('should throw for empty content', () => {
      const messages = [{ role: 'user', content: '' }];
      expect(() => validateChatMessages(messages)).toThrow('messages[0].content is required and cannot be empty');
    });
  });

  describe('validateOptions', () => {
    test('should pass for valid options', () => {
      const options = {
        temperature: 0.7,
        top_p: 0.9,
        top_k: 50,
      };
      expect(() => validateOptions(options)).not.toThrow();
    });

    test('should pass for undefined options', () => {
      expect(() => validateOptions(undefined)).not.toThrow();
    });

    test('should throw for non-object options', () => {
      expect(() => validateOptions('invalid')).toThrow('options must be a object, received string');
    });

    test('should throw for invalid temperature', () => {
      expect(() => validateOptions({ temperature: 3 })).toThrow('options.temperature has invalid value "3". Allowed values: 0-2 range');
    });

    test('should throw for invalid top_p', () => {
      expect(() => validateOptions({ top_p: 1.5 })).toThrow('options.top_p has invalid value "1.5". Allowed values: 0-1 range');
    });

    test('should throw for invalid top_k', () => {
      expect(() => validateOptions({ top_k: 0 })).toThrow('options.top_k has invalid value "0". Allowed values: minimum value: 1');
    });
  });

  describe('validateChatArgs', () => {
    test('should pass for valid chat arguments', () => {
      const args = {
        model: 'llama2',
        messages: [{ role: 'user', content: 'Hello' }],
        options: { temperature: 0.7 },
      };
      const result = validateChatArgs(args);
      expect(result.model).toBe('llama2');
      expect(result.messages).toEqual(args.messages);
      expect(result.options).toEqual(args.options);
    });

    test('should throw for missing model', () => {
      const args = {
        messages: [{ role: 'user', content: 'Hello' }],
      };
      expect(() => validateChatArgs(args)).toThrow('model is required and cannot be empty');
    });
  });

  describe('validateGenerateArgs', () => {
    test('should pass for valid generate arguments', () => {
      const args = {
        model: 'llama2',
        prompt: 'Generate text',
        options: { temperature: 0.7 },
      };
      const result = validateGenerateArgs(args);
      expect(result.model).toBe('llama2');
      expect(result.prompt).toBe('Generate text');
      expect(result.options).toEqual(args.options);
    });

    test('should throw for missing prompt', () => {
      const args = {
        model: 'llama2',
      };
      expect(() => validateGenerateArgs(args)).toThrow('prompt is required and cannot be empty');
    });
  });

  describe('validatePullModelArgs', () => {
    test('should pass for valid model name', () => {
      const args = { name: 'llama2:7b' };
      const result = validatePullModelArgs(args);
      expect(result.name).toBe('llama2:7b');
    });

    test('should throw for invalid model name format', () => {
      const args = { name: 'invalid/model@name' };
      expect(() => validatePullModelArgs(args)).toThrow('Model name must contain only');
    });

    test('should throw for missing name', () => {
      const args = {};
      expect(() => validatePullModelArgs(args)).toThrow('name is required and cannot be empty');
    });
  });

  describe('validateCodeFeedbackArgs', () => {
    test('should pass for valid code feedback arguments', () => {
      const args = {
        code: 'function hello() { return "world"; }',
        language: 'javascript',
        provider: 'ollama',
        model: 'llama2',
        feedbackType: 'general',
      };
      const result = validateCodeFeedbackArgs(args);
      expect(result.code).toBe(args.code);
      expect(result.language).toBe(args.language);
      expect(result.provider).toBe(args.provider);
      expect(result.model).toBe(args.model);
      expect(result.feedbackType).toBe(args.feedbackType);
    });

    test('should throw for missing code', () => {
      const args = {
        language: 'javascript',
        provider: 'ollama',
      };
      expect(() => validateCodeFeedbackArgs(args)).toThrow('code is required and cannot be empty');
    });

    test('should throw for missing language', () => {
      const args = {
        code: 'test code',
        provider: 'ollama',
      };
      expect(() => validateCodeFeedbackArgs(args)).toThrow('language is required and cannot be empty');
    });

    test('should throw for missing provider', () => {
      const args = {
        code: 'test code',
        language: 'javascript',
      };
      expect(() => validateCodeFeedbackArgs(args)).toThrow('provider is required and cannot be empty');
    });

    test('should throw for invalid provider', () => {
      const args = {
        code: 'test code',
        language: 'javascript',
        provider: 'invalid-provider',
      };
      expect(() => validateCodeFeedbackArgs(args)).toThrow('provider has invalid value "invalid-provider". Allowed values: ollama, github, claude, chatgpt');
    });

    test('should throw for missing model when using ollama provider', () => {
      const args = {
        code: 'test code',
        language: 'javascript',
        provider: 'ollama',
      };
      expect(() => validateCodeFeedbackArgs(args)).toThrow('model is required and cannot be empty');
    });

    test('should not require model for non-ollama providers', () => {
      const args = {
        code: 'test code',
        language: 'javascript',
        provider: 'github',
      };
      const result = validateCodeFeedbackArgs(args);
      expect(result.model).toBeUndefined();
    });

    test('should set default feedbackType to general', () => {
      const args = {
        code: 'test code',
        language: 'javascript',
        provider: 'github',
      };
      const result = validateCodeFeedbackArgs(args);
      expect(result.feedbackType).toBe('general');
    });

    test('should throw for invalid feedbackType', () => {
      const args = {
        code: 'test code',
        language: 'javascript',
        provider: 'github',
        feedbackType: 'invalid-type',
      };
      expect(() => validateCodeFeedbackArgs(args)).toThrow('feedbackType has invalid value "invalid-type". Allowed values: general, performance, security, style, bugs');
    });
  });
});
