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
  // GitHub MCP Tools
  {
    name: 'download_workflow_run_artifact',
    description: 'Download artifact from a workflow run',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        artifact_id: {
          type: 'number',
          description: 'The unique identifier of the artifact',
        },
      },
      required: ['owner', 'repo', 'artifact_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_code_scanning_alert',
    description: 'Get details of a specific code scanning alert',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        alertNumber: {
          type: 'number',
          description: 'The number of the alert',
        },
      },
      required: ['owner', 'repo', 'alertNumber'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_commit',
    description: 'Get details for a commit from a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        sha: {
          type: 'string',
          description: 'Commit SHA, branch name, or tag name',
          minLength: 1,
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (min 1)',
          minimum: 1,
        },
        perPage: {
          type: 'number',
          description: 'Results per page for pagination (min 1, max 100)',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['owner', 'repo', 'sha'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_file_contents',
    description: 'Get the contents of a file or directory from a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner (username or organization)',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        path: {
          type: 'string',
          description: 'Path to file/directory (directories must end with a slash \'/\')',
          default: '/',
        },
        ref: {
          type: 'string',
          description: 'Accepts optional git refs such as refs/tags/{tag}, refs/heads/{branch} or refs/pull/{pr_number}/head',
        },
        sha: {
          type: 'string',
          description: 'Accepts optional commit SHA. If specified, it will be used instead of ref',
        },
      },
      required: ['owner', 'repo'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_issue',
    description: 'Get details of a specific issue in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        issue_number: {
          type: 'number',
          description: 'The number of the issue',
        },
      },
      required: ['owner', 'repo', 'issue_number'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_issue_comments',
    description: 'Get comments for a specific issue in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        issue_number: {
          type: 'number',
          description: 'Issue number',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (min 1)',
          minimum: 1,
        },
        perPage: {
          type: 'number',
          description: 'Results per page for pagination (min 1, max 100)',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['owner', 'repo', 'issue_number'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_job_logs',
    description: 'Download logs for a specific workflow job',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        job_id: {
          type: 'number',
          description: 'The unique identifier of the workflow job',
        },
        run_id: {
          type: 'number',
          description: 'Workflow run ID (required when using failed_only)',
        },
        failed_only: {
          type: 'boolean',
          description: 'When true, gets logs for all failed jobs in run_id',
        },
        return_content: {
          type: 'boolean',
          description: 'Returns actual log content instead of URLs',
        },
        tail_lines: {
          type: 'number',
          description: 'Number of lines to return from the end of the log',
          default: 500,
        },
      },
      required: ['owner', 'repo'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_pull_request',
    description: 'Get details of a specific pull request in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        pullNumber: {
          type: 'number',
          description: 'Pull request number',
        },
      },
      required: ['owner', 'repo', 'pullNumber'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_pull_request_comments',
    description: 'Get comments for a specific pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        pullNumber: {
          type: 'number',
          description: 'Pull request number',
        },
      },
      required: ['owner', 'repo', 'pullNumber'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_pull_request_diff',
    description: 'Get the diff of a pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        pullNumber: {
          type: 'number',
          description: 'Pull request number',
        },
      },
      required: ['owner', 'repo', 'pullNumber'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_pull_request_files',
    description: 'Get the files changed in a specific pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        pullNumber: {
          type: 'number',
          description: 'Pull request number',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (min 1)',
          minimum: 1,
        },
        perPage: {
          type: 'number',
          description: 'Results per page for pagination (min 1, max 100)',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['owner', 'repo', 'pullNumber'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_pull_request_reviews',
    description: 'Get reviews for a specific pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        pullNumber: {
          type: 'number',
          description: 'Pull request number',
        },
      },
      required: ['owner', 'repo', 'pullNumber'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_pull_request_status',
    description: 'Get the status of a specific pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        pullNumber: {
          type: 'number',
          description: 'Pull request number',
        },
      },
      required: ['owner', 'repo', 'pullNumber'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_secret_scanning_alert',
    description: 'Get details of a specific secret scanning alert',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        alertNumber: {
          type: 'number',
          description: 'The number of the alert',
        },
      },
      required: ['owner', 'repo', 'alertNumber'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_tag',
    description: 'Get details about a specific git tag in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        tag: {
          type: 'string',
          description: 'Tag name',
          minLength: 1,
        },
      },
      required: ['owner', 'repo', 'tag'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_workflow_run',
    description: 'Get details of a specific workflow run',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        run_id: {
          type: 'number',
          description: 'The unique identifier of the workflow run',
        },
      },
      required: ['owner', 'repo', 'run_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_workflow_run_logs',
    description: 'Download logs for a specific workflow run',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        run_id: {
          type: 'number',
          description: 'The unique identifier of the workflow run',
        },
      },
      required: ['owner', 'repo', 'run_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_workflow_run_usage',
    description: 'Get usage metrics for a workflow run',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        run_id: {
          type: 'number',
          description: 'The unique identifier of the workflow run',
        },
      },
      required: ['owner', 'repo', 'run_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_branches',
    description: 'List branches in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (min 1)',
          minimum: 1,
        },
        perPage: {
          type: 'number',
          description: 'Results per page for pagination (min 1, max 100)',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['owner', 'repo'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_code_scanning_alerts',
    description: 'List code scanning alerts in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        ref: {
          type: 'string',
          description: 'The Git reference for the results you want to list',
        },
        severity: {
          type: 'string',
          description: 'Filter code scanning alerts by severity',
          enum: ['critical', 'high', 'medium', 'low', 'warning', 'note', 'error'],
        },
        state: {
          type: 'string',
          description: 'Filter code scanning alerts by state. Defaults to open',
          enum: ['open', 'closed', 'dismissed', 'fixed'],
          default: 'open',
        },
        tool_name: {
          type: 'string',
          description: 'The name of the tool used for code scanning',
        },
      },
      required: ['owner', 'repo'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_commits',
    description: 'Get list of commits of a branch in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        sha: {
          type: 'string',
          description: 'Commit SHA, branch or tag name to list commits of',
        },
        author: {
          type: 'string',
          description: 'Author username or email address to filter commits by',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (min 1)',
          minimum: 1,
        },
        perPage: {
          type: 'number',
          description: 'Results per page for pagination (min 1, max 100)',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['owner', 'repo'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_issues',
    description: 'List issues in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        state: {
          type: 'string',
          description: 'Filter by state',
          enum: ['OPEN', 'CLOSED'],
        },
        labels: {
          type: 'array',
          description: 'Filter by labels',
          items: {
            type: 'string',
          },
        },
        since: {
          type: 'string',
          description: 'Filter by date (ISO 8601 timestamp)',
        },
        after: {
          type: 'string',
          description: 'Cursor for pagination',
        },
        orderBy: {
          type: 'string',
          description: 'Order issues by field',
          enum: ['CREATED_AT', 'UPDATED_AT'],
        },
        direction: {
          type: 'string',
          description: 'Order direction',
          enum: ['ASC', 'DESC'],
        },
        perPage: {
          type: 'number',
          description: 'Results per page for pagination (min 1, max 100)',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['owner', 'repo'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_pull_requests',
    description: 'List pull requests in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        state: {
          type: 'string',
          description: 'Filter by state',
          enum: ['open', 'closed', 'all'],
        },
        head: {
          type: 'string',
          description: 'Filter by head user/org and branch',
        },
        base: {
          type: 'string',
          description: 'Filter by base branch',
        },
        sort: {
          type: 'string',
          description: 'Sort by',
          enum: ['created', 'updated', 'popularity', 'long-running'],
        },
        direction: {
          type: 'string',
          description: 'Sort direction',
          enum: ['asc', 'desc'],
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (min 1)',
          minimum: 1,
        },
        perPage: {
          type: 'number',
          description: 'Results per page for pagination (min 1, max 100)',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['owner', 'repo'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_secret_scanning_alerts',
    description: 'List secret scanning alerts in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        state: {
          type: 'string',
          description: 'Filter by state',
          enum: ['open', 'resolved'],
        },
        secret_type: {
          type: 'string',
          description: 'A comma-separated list of secret types to return',
        },
        resolution: {
          type: 'string',
          description: 'Filter by resolution',
          enum: ['false_positive', 'wont_fix', 'revoked', 'pattern_edited', 'pattern_deleted', 'used_in_tests'],
        },
      },
      required: ['owner', 'repo'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_sub_issues',
    description: 'List sub-issues for a specific issue in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        issue_number: {
          type: 'number',
          description: 'Issue number',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
        },
        per_page: {
          type: 'number',
          description: 'Number of results per page (max 100, default: 30)',
        },
      },
      required: ['owner', 'repo', 'issue_number'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_tags',
    description: 'List git tags in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (min 1)',
          minimum: 1,
        },
        perPage: {
          type: 'number',
          description: 'Results per page for pagination (min 1, max 100)',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['owner', 'repo'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_workflow_jobs',
    description: 'List jobs for a specific workflow run',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        run_id: {
          type: 'number',
          description: 'The unique identifier of the workflow run',
        },
        filter: {
          type: 'string',
          description: 'Filters jobs by their completed_at timestamp',
          enum: ['latest', 'all'],
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (min 1)',
          minimum: 1,
        },
        perPage: {
          type: 'number',
          description: 'Results per page for pagination (min 1, max 100)',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['owner', 'repo', 'run_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_workflow_run_artifacts',
    description: 'List artifacts for a workflow run',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        run_id: {
          type: 'number',
          description: 'The unique identifier of the workflow run',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (min 1)',
          minimum: 1,
        },
        perPage: {
          type: 'number',
          description: 'Results per page for pagination (min 1, max 100)',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['owner', 'repo', 'run_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_workflow_runs',
    description: 'List workflow runs for a specific workflow',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        workflow_id: {
          type: 'string',
          description: 'The workflow ID or workflow file name',
          minLength: 1,
        },
        actor: {
          type: 'string',
          description: 'Returns someone\'s workflow runs',
        },
        branch: {
          type: 'string',
          description: 'Returns workflow runs associated with a branch',
        },
        event: {
          type: 'string',
          description: 'Returns workflow runs for a specific event type',
          enum: ['branch_protection_rule', 'check_run', 'check_suite', 'create', 'delete', 'deployment', 'deployment_status', 'discussion', 'discussion_comment', 'fork', 'gollum', 'issue_comment', 'issues', 'label', 'merge_group', 'milestone', 'page_build', 'public', 'pull_request', 'pull_request_review', 'pull_request_review_comment', 'pull_request_target', 'push', 'registry_package', 'release', 'repository_dispatch', 'schedule', 'status', 'watch', 'workflow_call', 'workflow_dispatch', 'workflow_run'],
        },
        status: {
          type: 'string',
          description: 'Returns workflow runs with the check run status',
          enum: ['queued', 'in_progress', 'completed', 'requested', 'waiting'],
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (min 1)',
          minimum: 1,
        },
        perPage: {
          type: 'number',
          description: 'Results per page for pagination (min 1, max 100)',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['owner', 'repo', 'workflow_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_workflows',
    description: 'List workflows in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
          minLength: 1,
        },
        repo: {
          type: 'string',
          description: 'Repository name',
          minLength: 1,
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (min 1)',
          minimum: 1,
        },
        perPage: {
          type: 'number',
          description: 'Results per page for pagination (min 1, max 100)',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['owner', 'repo'],
      additionalProperties: false,
    },
  },
  {
    name: 'search_code',
    description: 'Fast and precise code search across ALL GitHub repositories',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query using GitHub\'s powerful code search syntax',
          minLength: 1,
        },
        sort: {
          type: 'string',
          description: 'Sort field (\'indexed\' only)',
        },
        order: {
          type: 'string',
          description: 'Sort order for results',
          enum: ['asc', 'desc'],
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (min 1)',
          minimum: 1,
        },
        perPage: {
          type: 'number',
          description: 'Results per page for pagination (min 1, max 100)',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'search_issues',
    description: 'Search for issues in GitHub repositories',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query using GitHub issues search syntax',
          minLength: 1,
        },
        owner: {
          type: 'string',
          description: 'Optional repository owner',
        },
        repo: {
          type: 'string',
          description: 'Optional repository name',
        },
        sort: {
          type: 'string',
          description: 'Sort field by number of matches of categories',
          enum: ['comments', 'reactions', 'reactions-+1', 'reactions--1', 'reactions-smile', 'reactions-thinking_face', 'reactions-heart', 'reactions-tada', 'interactions', 'created', 'updated'],
        },
        order: {
          type: 'string',
          description: 'Sort order',
          enum: ['asc', 'desc'],
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (min 1)',
          minimum: 1,
        },
        perPage: {
          type: 'number',
          description: 'Results per page for pagination (min 1, max 100)',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'search_pull_requests',
    description: 'Search for pull requests in GitHub repositories',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query using GitHub pull request search syntax',
          minLength: 1,
        },
        owner: {
          type: 'string',
          description: 'Optional repository owner',
        },
        repo: {
          type: 'string',
          description: 'Optional repository name',
        },
        sort: {
          type: 'string',
          description: 'Sort field by number of matches of categories',
          enum: ['comments', 'reactions', 'reactions-+1', 'reactions--1', 'reactions-smile', 'reactions-thinking_face', 'reactions-heart', 'reactions-tada', 'interactions', 'created', 'updated'],
        },
        order: {
          type: 'string',
          description: 'Sort order',
          enum: ['asc', 'desc'],
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (min 1)',
          minimum: 1,
        },
        perPage: {
          type: 'number',
          description: 'Results per page for pagination (min 1, max 100)',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'search_repositories',
    description: 'Find GitHub repositories by name, description, readme, topics, or other metadata',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Repository search query',
          minLength: 1,
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (min 1)',
          minimum: 1,
        },
        perPage: {
          type: 'number',
          description: 'Results per page for pagination (min 1, max 100)',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'search_users',
    description: 'Find GitHub users by username, real name, or other profile information',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'User search query',
          minLength: 1,
        },
        sort: {
          type: 'string',
          description: 'Sort users by number of followers or repositories, or when the person joined GitHub',
          enum: ['followers', 'repositories', 'joined'],
        },
        order: {
          type: 'string',
          description: 'Sort order',
          enum: ['asc', 'desc'],
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (min 1)',
          minimum: 1,
        },
        perPage: {
          type: 'number',
          description: 'Results per page for pagination (min 1, max 100)',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  // Browser Automation Tools
  {
    name: 'browser_close',
    description: 'Close the browser page',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'browser_resize',
    description: 'Resize the browser window',
    inputSchema: {
      type: 'object',
      properties: {
        width: {
          type: 'number',
          description: 'Width of the browser window',
        },
        height: {
          type: 'number',
          description: 'Height of the browser window',
        },
      },
      required: ['width', 'height'],
      additionalProperties: false,
    },
  },
  {
    name: 'browser_console_messages',
    description: 'Returns all console messages',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'browser_handle_dialog',
    description: 'Handle a dialog',
    inputSchema: {
      type: 'object',
      properties: {
        accept: {
          type: 'boolean',
          description: 'Whether to accept the dialog',
        },
        promptText: {
          type: 'string',
          description: 'The text of the prompt in case of a prompt dialog',
        },
      },
      required: ['accept'],
      additionalProperties: false,
    },
  },
  {
    name: 'browser_evaluate',
    description: 'Evaluate JavaScript expression on page or element',
    inputSchema: {
      type: 'object',
      properties: {
        function: {
          type: 'string',
          description: '() => { /* code */ } or (element) => { /* code */ } when element is provided',
          minLength: 1,
        },
        element: {
          type: 'string',
          description: 'Human-readable element description used to obtain permission to interact with the element',
        },
        ref: {
          type: 'string',
          description: 'Exact target element reference from the page snapshot',
        },
      },
      required: ['function'],
      additionalProperties: false,
    },
  },
  {
    name: 'browser_file_upload',
    description: 'Upload one or multiple files',
    inputSchema: {
      type: 'object',
      properties: {
        paths: {
          type: 'array',
          description: 'The absolute paths to the files to upload',
          items: {
            type: 'string',
          },
        },
      },
      required: ['paths'],
      additionalProperties: false,
    },
  },
  {
    name: 'browser_install',
    description: 'Install the browser specified in the config',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'browser_press_key',
    description: 'Press a key on the keyboard',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Name of the key to press or a character to generate, such as `ArrowLeft` or `a`',
          minLength: 1,
        },
      },
      required: ['key'],
      additionalProperties: false,
    },
  },
  {
    name: 'browser_type',
    description: 'Type text into editable element',
    inputSchema: {
      type: 'object',
      properties: {
        element: {
          type: 'string',
          description: 'Human-readable element description used to obtain permission to interact with the element',
          minLength: 1,
        },
        ref: {
          type: 'string',
          description: 'Exact target element reference from the page snapshot',
          minLength: 1,
        },
        text: {
          type: 'string',
          description: 'Text to type into the element',
          minLength: 1,
        },
        slowly: {
          type: 'boolean',
          description: 'Whether to type one character at a time',
        },
        submit: {
          type: 'boolean',
          description: 'Whether to submit entered text (press Enter after)',
        },
      },
      required: ['element', 'ref', 'text'],
      additionalProperties: false,
    },
  },
  {
    name: 'browser_navigate',
    description: 'Navigate to a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to navigate to',
          minLength: 1,
        },
      },
      required: ['url'],
      additionalProperties: false,
    },
  },
  {
    name: 'browser_navigate_back',
    description: 'Go back to the previous page',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'browser_navigate_forward',
    description: 'Go forward to the next page',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'browser_network_requests',
    description: 'Returns all network requests since loading the page',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'browser_take_screenshot',
    description: 'Take a screenshot of the current page',
    inputSchema: {
      type: 'object',
      properties: {
        element: {
          type: 'string',
          description: 'Human-readable element description used to obtain permission to screenshot the element',
        },
        ref: {
          type: 'string',
          description: 'Exact target element reference from the page snapshot',
        },
        filename: {
          type: 'string',
          description: 'File name to save the screenshot to',
        },
        fullPage: {
          type: 'boolean',
          description: 'When true, takes a screenshot of the full scrollable page',
        },
        type: {
          type: 'string',
          description: 'Image format for the screenshot',
          enum: ['png', 'jpeg'],
          default: 'png',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'browser_snapshot',
    description: 'Capture accessibility snapshot of the current page',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'browser_click',
    description: 'Perform click on a web page',
    inputSchema: {
      type: 'object',
      properties: {
        element: {
          type: 'string',
          description: 'Human-readable element description used to obtain permission to interact with the element',
          minLength: 1,
        },
        ref: {
          type: 'string',
          description: 'Exact target element reference from the page snapshot',
          minLength: 1,
        },
        button: {
          type: 'string',
          description: 'Button to click, defaults to left',
          enum: ['left', 'right', 'middle'],
        },
        doubleClick: {
          type: 'boolean',
          description: 'Whether to perform a double click instead of a single click',
        },
      },
      required: ['element', 'ref'],
      additionalProperties: false,
    },
  },
  {
    name: 'browser_drag',
    description: 'Perform drag and drop between two elements',
    inputSchema: {
      type: 'object',
      properties: {
        startElement: {
          type: 'string',
          description: 'Human-readable source element description',
          minLength: 1,
        },
        startRef: {
          type: 'string',
          description: 'Exact source element reference from the page snapshot',
          minLength: 1,
        },
        endElement: {
          type: 'string',
          description: 'Human-readable target element description',
          minLength: 1,
        },
        endRef: {
          type: 'string',
          description: 'Exact target element reference from the page snapshot',
          minLength: 1,
        },
      },
      required: ['startElement', 'startRef', 'endElement', 'endRef'],
      additionalProperties: false,
    },
  },
  {
    name: 'browser_hover',
    description: 'Hover over element on page',
    inputSchema: {
      type: 'object',
      properties: {
        element: {
          type: 'string',
          description: 'Human-readable element description used to obtain permission to interact with the element',
          minLength: 1,
        },
        ref: {
          type: 'string',
          description: 'Exact target element reference from the page snapshot',
          minLength: 1,
        },
      },
      required: ['element', 'ref'],
      additionalProperties: false,
    },
  },
  {
    name: 'browser_select_option',
    description: 'Select an option in a dropdown',
    inputSchema: {
      type: 'object',
      properties: {
        element: {
          type: 'string',
          description: 'Human-readable element description used to obtain permission to interact with the element',
          minLength: 1,
        },
        ref: {
          type: 'string',
          description: 'Exact target element reference from the page snapshot',
          minLength: 1,
        },
        values: {
          type: 'array',
          description: 'Array of values to select in the dropdown',
          items: {
            type: 'string',
          },
        },
      },
      required: ['element', 'ref', 'values'],
      additionalProperties: false,
    },
  },
  {
    name: 'browser_tab_list',
    description: 'List browser tabs',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'browser_tab_new',
    description: 'Open a new tab',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to navigate to in the new tab',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'browser_tab_select',
    description: 'Select a tab by index',
    inputSchema: {
      type: 'object',
      properties: {
        index: {
          type: 'number',
          description: 'The index of the tab to select',
        },
      },
      required: ['index'],
      additionalProperties: false,
    },
  },
  {
    name: 'browser_tab_close',
    description: 'Close a tab',
    inputSchema: {
      type: 'object',
      properties: {
        index: {
          type: 'number',
          description: 'The index of the tab to close',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'browser_wait_for',
    description: 'Wait for text to appear or disappear or a specified time to pass',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to wait for',
        },
        textGone: {
          type: 'string',
          description: 'The text to wait for to disappear',
        },
        time: {
          type: 'number',
          description: 'The time to wait in seconds',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'ai_code_feedback',
    description: 'Get AI-powered code feedback using various model providers (ollama, github, claude, chatgpt)',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The code to analyze and get feedback on',
          minLength: 1,
        },
        language: {
          type: 'string',
          description: 'Programming language of the code (e.g., javascript, python, java)',
          minLength: 1,
        },
        provider: {
          type: 'string',
          description: 'AI model provider to use for feedback',
          enum: ['ollama', 'github', 'claude', 'chatgpt'],
          default: 'ollama',
        },
        model: {
          type: 'string',
          description: 'Specific model name (required for ollama provider)',
        },
        feedbackType: {
          type: 'string',
          description: 'Type of feedback to focus on',
          enum: ['general', 'performance', 'security', 'style', 'bugs'],
          default: 'general',
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
            maxTokens: {
              type: 'integer',
              description: 'Maximum number of tokens in response',
              minimum: 1,
              maximum: 4000,
            },
          },
          additionalProperties: false,
        },
      },
      required: ['code', 'language', 'provider'],
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
