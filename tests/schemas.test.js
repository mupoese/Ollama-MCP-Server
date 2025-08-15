/**
 * Tests for tool schemas
 */

import {
  TOOL_DEFINITIONS,
  getToolDefinition,
  getToolNames,
  isValidToolName,
} from '../src/handlers/schemas.js';

describe('Tool Schemas', () => {
  describe('TOOL_DEFINITIONS', () => {
    test('should contain all expected tools', () => {
      const toolNames = TOOL_DEFINITIONS.map(tool => tool.name);
      expect(toolNames).toContain('ollama_list_models');
      expect(toolNames).toContain('ollama_chat');
      expect(toolNames).toContain('ollama_generate');
      expect(toolNames).toContain('ollama_pull_model');
    });

    test('should have valid schema structure for each tool', () => {
      TOOL_DEFINITIONS.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.inputSchema).toBe('object');
      });
    });

    test('ollama_list_models should have empty input schema', () => {
      const tool = TOOL_DEFINITIONS.find(t => t.name === 'ollama_list_models');
      expect(tool.inputSchema.properties).toEqual({});
    });

    test('ollama_chat should have required model and messages', () => {
      const tool = TOOL_DEFINITIONS.find(t => t.name === 'ollama_chat');
      expect(tool.inputSchema.required).toContain('model');
      expect(tool.inputSchema.required).toContain('messages');
      expect(tool.inputSchema.properties.model.type).toBe('string');
      expect(tool.inputSchema.properties.messages.type).toBe('array');
    });

    test('ollama_generate should have required model and prompt', () => {
      const tool = TOOL_DEFINITIONS.find(t => t.name === 'ollama_generate');
      expect(tool.inputSchema.required).toContain('model');
      expect(tool.inputSchema.required).toContain('prompt');
      expect(tool.inputSchema.properties.model.type).toBe('string');
      expect(tool.inputSchema.properties.prompt.type).toBe('string');
    });

    test('ollama_pull_model should have required name with pattern', () => {
      const tool = TOOL_DEFINITIONS.find(t => t.name === 'ollama_pull_model');
      expect(tool.inputSchema.required).toContain('name');
      expect(tool.inputSchema.properties.name.type).toBe('string');
      expect(tool.inputSchema.properties.name.pattern).toBeDefined();
    });
  });

  describe('getToolDefinition', () => {
    test('should return tool definition for valid tool name', () => {
      const tool = getToolDefinition('ollama_list_models');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('ollama_list_models');
    });

    test('should return null for invalid tool name', () => {
      const tool = getToolDefinition('invalid_tool');
      expect(tool).toBeNull();
    });
  });

  describe('getToolNames', () => {
    test('should return array of all tool names', () => {
      const names = getToolNames();
      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBe(74); // Updated to reflect all tools including new ai_code_feedback tool
      expect(names).toContain('ollama_list_models');
      expect(names).toContain('ollama_chat');
      expect(names).toContain('ollama_generate');
      expect(names).toContain('ollama_pull_model');
      expect(names).toContain('ai_code_feedback');
      // New tools
      expect(names).toContain('terminal_execute');
      expect(names).toContain('file_read');
      expect(names).toContain('file_write');
      expect(names).toContain('file_list');
      expect(names).toContain('test_run');
      expect(names).toContain('test_discover');
      expect(names).toContain('lint_check');
      expect(names).toContain('audit_security');
      expect(names).toContain('server_status');
      expect(names).toContain('validate_config');
      // GitHub MCP Tools
      expect(names).toContain('get_commit');
      expect(names).toContain('get_pull_request');
      expect(names).toContain('list_issues');
      expect(names).toContain('search_code');
      // Browser Tools
      expect(names).toContain('browser_navigate');
      expect(names).toContain('browser_click');
      expect(names).toContain('browser_take_screenshot');
    });
  });

  describe('isValidToolName', () => {
    test('should return true for valid tool names', () => {
      expect(isValidToolName('ollama_list_models')).toBe(true);
      expect(isValidToolName('ollama_chat')).toBe(true);
      expect(isValidToolName('ollama_generate')).toBe(true);
      expect(isValidToolName('ollama_pull_model')).toBe(true);
      // GitHub tools
      expect(isValidToolName('get_commit')).toBe(true);
      expect(isValidToolName('list_pull_requests')).toBe(true);
      expect(isValidToolName('search_repositories')).toBe(true);
      // Browser tools
      expect(isValidToolName('browser_navigate')).toBe(true);
      expect(isValidToolName('browser_click')).toBe(true);
      expect(isValidToolName('browser_take_screenshot')).toBe(true);
    });

    test('should return false for invalid tool names', () => {
      expect(isValidToolName('invalid_tool')).toBe(false);
      expect(isValidToolName('')).toBe(false);
      expect(isValidToolName(null)).toBe(false);
      expect(isValidToolName(undefined)).toBe(false);
    });
  });
});
