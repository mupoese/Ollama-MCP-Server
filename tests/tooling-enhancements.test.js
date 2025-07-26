/**
 * Tests for new MCP tooling enhancements
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
  handleTerminalExecute,
  handleFileRead,
  handleFileWrite,
  handleFileList,
  handleTestRun,
  handleTestDiscover,
  handleLintCheck,
  handleAuditSecurity,
  handleServerStatus,
  handleValidateConfig,
} from '../src/handlers/tools.js';
import fs from 'fs/promises';
import path from 'path';

describe('MCP Tooling Enhancements', () => {
  const testDir = path.join(process.cwd(), 'temp_test_files');
  
  beforeEach(async () => {
    // Create temporary test directory
    try {
      await fs.mkdir(testDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  afterEach(async () => {
    // Clean up temporary test files
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist or might not be empty
    }
  });

  describe('Terminal Tool', () => {
    test('should execute simple command successfully', async () => {
      const result = await handleTerminalExecute({
        command: 'echo "test output"',
      });

      expect(result).toHaveProperty('content');
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('test output');
    });

    test('should reject dangerous commands', async () => {
      await expect(
        handleTerminalExecute({
          command: 'rm -rf /',
        }),
      ).rejects.toThrow('Command contains potentially dangerous operations');
    });

    test('should respect working directory', async () => {
      const result = await handleTerminalExecute({
        command: 'pwd',
        workingDirectory: testDir,
      });

      expect(result.content[0].text).toContain(testDir);
    });
  });

  describe('File Management Tools', () => {
    const testFile = path.join(testDir, 'test.txt');
    const testContent = 'Hello, World!\nThis is test content.';

    test('file_write should create file successfully', async () => {
      const result = await handleFileWrite({
        path: testFile,
        content: testContent,
        createDirectories: true,
      });

      expect(result.content[0].text).toContain('written successfully');
      
      // Verify file was created
      const fileExists = await fs.access(testFile).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });

    test('file_read should read file contents', async () => {
      // First create a file to read
      await fs.writeFile(testFile, testContent);

      const result = await handleFileRead({
        path: testFile,
      });

      expect(result.content[0].text).toContain(testContent);
    });

    test('file_list should list directory contents', async () => {
      // Create some test files
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(testDir, 'file2.txt'), 'content2');

      const result = await handleFileList({
        path: testDir,
        details: false,
      });

      expect(result.content[0].text).toContain('file1.txt');
      expect(result.content[0].text).toContain('file2.txt');
    });

    test('should prevent access to restricted paths', async () => {
      await expect(
        handleFileRead({
          path: '/etc/passwd',
        }),
      ).rejects.toThrow('Access to this path is not allowed');
    });
  });

  describe('Testing Framework Tools', () => {
    test('test_discover should find test files', async () => {
      const result = await handleTestDiscover({
        path: 'tests/',
        pattern: '*.test.js',
      });

      expect(result.content[0].text).toContain('test files');
      expect(result.content[0].text).toContain('.test.js');
    });

    test('test_run should execute tests', async () => {
      const result = await handleTestRun({
        testPath: 'tests/config.test.js',
        verbose: false,
      });

      expect(result.content[0].text).toContain('Test Command:');
      // The result should contain either success output or failure output
      expect(result.content[0].text.length).toBeGreaterThan(0);
    });
  });

  describe('Code Quality Tools', () => {
    test('lint_check should run ESLint', async () => {
      const result = await handleLintCheck({
        path: 'src/config/index.js',
        format: 'stylish',
      });

      expect(result.content[0].text).toContain('ESLint');
      // Should either show "No linting issues found!" or actual issues
      expect(result.content[0].text.length).toBeGreaterThan(0);
    });

    test('audit_security should run npm audit', async () => {
      const result = await handleAuditSecurity({
        level: 'moderate',
        production: false,
      });

      expect(result.content[0].text).toContain('Security Audit');
      expect(result.content[0].text.length).toBeGreaterThan(0);
    });
  });

  describe('MCP Server Specific Tools', () => {
    test('server_status should return server information', async () => {
      const result = await handleServerStatus({
        detailed: false,
      });

      expect(result.content[0].text).toContain('MCP Server Status');
      expect(result.content[0].text).toContain('Status: Running');
      expect(result.content[0].text).toContain('Uptime:');
      expect(result.content[0].text).toContain('Memory Usage:');
    });

    test('server_status with detailed info should include more data', async () => {
      const result = await handleServerStatus({
        detailed: true,
      });

      expect(result.content[0].text).toContain('Detailed Memory Usage');
      expect(result.content[0].text).toContain('Environment:');
      expect(result.content[0].text).toContain('Platform:');
      // Note: Ollama connection test may timeout, but we still get other details
    }, 10000); // Increase timeout to 10 seconds

    test('validate_config should check configuration', async () => {
      const result = await handleValidateConfig({
        showDetails: false,
      });

      expect(result.content[0].text).toContain('Configuration Validation');
      expect(result.content[0].text).toContain('Environment Variables:');
      expect(result.content[0].text).toContain('Ollama Connection Test:');
      // Note: Ollama connection test may fail in test environment
    }, 10000); // Increase timeout to 10 seconds
  });

  describe('Input Validation', () => {
    test('should validate terminal_execute parameters', async () => {
      // Test missing required parameter
      await expect(
        handleTerminalExecute({}),
      ).rejects.toThrow();
    });

    test('should validate file operations parameters', async () => {
      // Test file_read without path
      await expect(
        handleFileRead({}),
      ).rejects.toThrow();

      // Test file_write without required parameters
      await expect(
        handleFileWrite({ path: 'test.txt' }),
      ).rejects.toThrow();
    });
  });
});