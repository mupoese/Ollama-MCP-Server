/**
 * MCP tool definitions and schemas
 * Defines the available tools and their input schemas
 */

/**
 * Tool definitions for the Ollama MCP Server
 */
export const TOOL_DEFINITIONS = [
  {
    name: 'ollama_list_models',
    description: 'List all available Ollama models',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'ollama_chat',
    description: 'Chat with an Ollama model using the chat API',
    inputSchema: {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          description: 'The model name to use for chat (e.g., \'llama2\', \'codellama\')',
          minLength: 1,
        },
        messages: {
          type: 'array',
          description: 'Array of message objects with role and content',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              role: {
                type: 'string',
                enum: ['system', 'user', 'assistant'],
                description: 'The role of the message sender',
              },
              content: {
                type: 'string',
                description: 'The content of the message',
                minLength: 1,
              },
            },
            required: ['role', 'content'],
            additionalProperties: false,
          },
        },
        options: {
          type: 'object',
          description: 'Optional parameters for the model',
          properties: {
            temperature: {
              type: 'number',
              description: 'Controls randomness in generation (0.0 to 2.0)',
              minimum: 0.0,
              maximum: 2.0,
            },
            top_p: {
              type: 'number',
              description: 'Controls nucleus sampling (0.0 to 1.0)',
              minimum: 0.0,
              maximum: 1.0,
            },
            top_k: {
              type: 'integer',
              description: 'Limits the next token selection to the K most probable tokens',
              minimum: 1,
            },
          },
          additionalProperties: false,
        },
      },
      required: ['model', 'messages'],
      additionalProperties: false,
    },
  },
  {
    name: 'ollama_generate',
    description: 'Generate text with an Ollama model using the generate API',
    inputSchema: {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          description: 'The model name to use for generation (e.g., \'llama2\', \'codellama\')',
          minLength: 1,
        },
        prompt: {
          type: 'string',
          description: 'The prompt to generate from',
          minLength: 1,
        },
        options: {
          type: 'object',
          description: 'Optional parameters for the model',
          properties: {
            temperature: {
              type: 'number',
              description: 'Controls randomness in generation (0.0 to 2.0)',
              minimum: 0.0,
              maximum: 2.0,
            },
            top_p: {
              type: 'number',
              description: 'Controls nucleus sampling (0.0 to 1.0)',
              minimum: 0.0,
              maximum: 1.0,
            },
            top_k: {
              type: 'integer',
              description: 'Limits the next token selection to the K most probable tokens',
              minimum: 1,
            },
          },
          additionalProperties: false,
        },
      },
      required: ['model', 'prompt'],
      additionalProperties: false,
    },
  },
  {
    name: 'ollama_pull_model',
    description: 'Pull/download a model from the Ollama registry',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The model name to pull (e.g., \'llama2\', \'codellama:7b\')',
          minLength: 1,
          pattern: '^[a-zA-Z0-9._-]+(?::[a-zA-Z0-9._-]+)?$',
        },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
  // Terminal Tool
  {
    name: 'terminal_execute',
    description: 'Execute shell commands in a controlled environment',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute',
          minLength: 1,
        },
        workingDirectory: {
          type: 'string',
          description: 'Working directory for command execution (optional)',
        },
        environment: {
          type: 'object',
          description: 'Environment variables to set for command execution',
          additionalProperties: {
            type: 'string',
          },
        },
        timeout: {
          type: 'integer',
          description: 'Command timeout in seconds (default: 30)',
          minimum: 1,
          maximum: 300,
        },
      },
      required: ['command'],
      additionalProperties: false,
    },
  },
  // File Management Tools
  {
    name: 'file_read',
    description: 'Read file contents with optional encoding',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file to read',
          minLength: 1,
        },
        encoding: {
          type: 'string',
          description: 'File encoding (default: utf8)',
          enum: ['utf8', 'ascii', 'base64', 'binary', 'hex'],
        },
        maxSize: {
          type: 'integer',
          description: 'Maximum file size to read in bytes (default: 1MB)',
          minimum: 1,
          maximum: 10485760, // 10MB max
        },
      },
      required: ['path'],
      additionalProperties: false,
    },
  },
  {
    name: 'file_write',
    description: 'Write content to a file with optional encoding',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file to write',
          minLength: 1,
        },
        content: {
          type: 'string',
          description: 'Content to write to the file',
        },
        encoding: {
          type: 'string',
          description: 'File encoding (default: utf8)',
          enum: ['utf8', 'ascii', 'base64', 'binary', 'hex'],
        },
        createDirectories: {
          type: 'boolean',
          description: 'Create parent directories if they don\'t exist (default: false)',
        },
        backup: {
          type: 'boolean',
          description: 'Create backup of existing file (default: false)',
        },
      },
      required: ['path', 'content'],
      additionalProperties: false,
    },
  },
  {
    name: 'file_list',
    description: 'List files and directories with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory path to list (default: current directory)',
        },
        pattern: {
          type: 'string',
          description: 'Glob pattern for filtering files',
        },
        recursive: {
          type: 'boolean',
          description: 'List files recursively (default: false)',
        },
        includeHidden: {
          type: 'boolean',
          description: 'Include hidden files and directories (default: false)',
        },
        details: {
          type: 'boolean',
          description: 'Include file details (size, modified date, permissions)',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  // Testing Framework Tools
  {
    name: 'test_run',
    description: 'Run tests with configurable options',
    inputSchema: {
      type: 'object',
      properties: {
        testPath: {
          type: 'string',
          description: 'Specific test file or directory to run',
        },
        pattern: {
          type: 'string',
          description: 'Test name pattern to match',
        },
        watch: {
          type: 'boolean',
          description: 'Run tests in watch mode (default: false)',
        },
        coverage: {
          type: 'boolean',
          description: 'Generate coverage report (default: false)',
        },
        verbose: {
          type: 'boolean',
          description: 'Verbose output (default: false)',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'test_discover',
    description: 'Discover and list available tests',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory to search for tests (default: tests/)',
        },
        pattern: {
          type: 'string',
          description: 'Test file pattern (default: *.test.js)',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  // Code Quality Tools
  {
    name: 'lint_check',
    description: 'Run ESLint on specified files or directories',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File or directory path to lint (default: current directory)',
        },
        fix: {
          type: 'boolean',
          description: 'Automatically fix linting issues (default: false)',
        },
        format: {
          type: 'string',
          description: 'Output format for lint results',
          enum: ['stylish', 'compact', 'json', 'unix', 'visualstudio'],
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'audit_security',
    description: 'Run security audit on dependencies',
    inputSchema: {
      type: 'object',
      properties: {
        fix: {
          type: 'boolean',
          description: 'Automatically fix security issues (default: false)',
        },
        level: {
          type: 'string',
          description: 'Minimum severity level to report',
          enum: ['info', 'low', 'moderate', 'high', 'critical'],
        },
        production: {
          type: 'boolean',
          description: 'Only audit production dependencies (default: false)',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  // MCP Server Specific Tools
  {
    name: 'server_status',
    description: 'Get current MCP server status and diagnostics',
    inputSchema: {
      type: 'object',
      properties: {
        detailed: {
          type: 'boolean',
          description: 'Include detailed diagnostics (default: false)',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'validate_config',
    description: 'Validate MCP server configuration',
    inputSchema: {
      type: 'object',
      properties: {
        configPath: {
          type: 'string',
          description: 'Path to configuration file (optional)',
        },
        showDetails: {
          type: 'boolean',
          description: 'Show detailed validation results (default: true)',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
];

/**
 * Get tool definition by name
 * @param {string} toolName - Name of the tool
 * @returns {Object|null} Tool definition or null if not found
 */
export function getToolDefinition(toolName) {
  return TOOL_DEFINITIONS.find(tool => tool.name === toolName) || null;
}

/**
 * Get all tool names
 * @returns {string[]} Array of tool names
 */
export function getToolNames() {
  return TOOL_DEFINITIONS.map(tool => tool.name);
}

/**
 * Validate if a tool name is supported
 * @param {string} toolName - Name of the tool to validate
 * @returns {boolean} True if tool is supported
 */
export function isValidToolName(toolName) {
  return getToolNames().includes(toolName);
}
