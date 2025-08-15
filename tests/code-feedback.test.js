/**
 * Tests for AI Code Feedback functionality
 */

import {
  handleCodeFeedback,
} from '../src/handlers/tools.js';

describe('AI Code Feedback', () => {
  describe('handleCodeFeedback', () => {
    test('should handle code feedback for non-ollama providers', async() => {
      const args = {
        code: 'function hello() { return "world"; }',
        language: 'javascript',
        provider: 'github',
        feedbackType: 'general',
      };

      const result = await handleCodeFeedback(args);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBe(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('github');
      expect(result.content[0].text).toContain('javascript');
      expect(result.content[0].text).toContain('general');
    });

    test('should handle different feedback types', async() => {
      const args = {
        code: 'const x = 1; console.log(x);',
        language: 'javascript',
        provider: 'claude',
        feedbackType: 'security',
      };

      const result = await handleCodeFeedback(args);

      expect(result.content[0].text).toContain('claude');
      expect(result.content[0].text).toContain('security');
    });

    test('should handle different programming languages', async() => {
      const args = {
        code: 'def hello():\n    return "world"',
        language: 'python',
        provider: 'chatgpt',
        feedbackType: 'style',
      };

      const result = await handleCodeFeedback(args);

      expect(result.content[0].text).toContain('chatgpt');
      expect(result.content[0].text).toContain('python');
      expect(result.content[0].text).toContain('style');
    });

    test('should validate required fields', async() => {
      const args = {
        code: 'test code',
        // missing language and provider
      };

      await expect(handleCodeFeedback(args)).rejects.toThrow('Invalid code feedback parameters');
    });

    test('should require model for ollama provider', async() => {
      const args = {
        code: 'test code',
        language: 'javascript',
        provider: 'ollama',
        // missing model
      };

      await expect(handleCodeFeedback(args)).rejects.toThrow('Invalid code feedback parameters');
    });
  });
});