/**
 * MCP tool handlers for Ollama operations
 * Each handler implements a specific Ollama functionality
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { ollamaClient } from '../utils/http-client.js';
import { logger } from '../utils/logger.js';
import {
  validateChatArgs,
  validateGenerateArgs,
  validatePullModelArgs,
  validateCodeFeedbackArgs,
  ValidationError,
} from '../utils/validation.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const execAsync = promisify(exec);

/**
 * List all available Ollama models
 * @returns {Promise<Object>} MCP response with models list
 */
export async function handleListModels() {
  try {
    logger.debug('Listing available models');

    const response = await ollamaClient.get('/api/tags');
    const models = response.models || [];

    logger.info('Models retrieved successfully', {
      modelCount: models.length,
    });

    const modelsList = models.length > 0
      ? models.map(model => `• ${model.name} (${model.size})`).join('\n')
      : 'No models found';

    return {
      content: [
        {
          type: 'text',
          text: `Available Ollama models:\n\n${modelsList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Failed to list models', error);

    throw new McpError(
      ErrorCode.InternalError,
      `Failed to list models: ${error.message}`,
    );
  }
}

/**
 * Chat with an Ollama model
 * @param {Object} args - Chat arguments
 * @returns {Promise<Object>} MCP response with chat result
 */
export async function handleChat(args) {
  try {
    logger.debug('Starting chat request');

    const validatedArgs = validateChatArgs(args);
    const { model, messages, options } = validatedArgs;

    logger.info('Processing chat request', {
      model,
      messageCount: messages.length,
      hasOptions: Object.keys(options).length > 0,
    });

    const requestData = {
      model,
      messages,
      stream: false,
      options,
    };

    const response = await ollamaClient.post('/api/chat', requestData);

    const responseText = response.message?.content || response.response || '';

    if (!responseText) {
      logger.warn('Empty response from chat API', { model });
    }

    logger.info('Chat completed successfully', {
      model,
      responseLength: responseText.length,
    });

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn('Chat validation failed', { error: error.message, field: error.field });
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid chat parameters: ${error.message}`,
      );
    }

    logger.error('Chat request failed', error);

    throw new McpError(
      ErrorCode.InternalError,
      `Chat failed: ${error.message}`,
    );
  }
}

/**
 * Generate text with an Ollama model
 * @param {Object} args - Generation arguments
 * @returns {Promise<Object>} MCP response with generated text
 */
export async function handleGenerate(args) {
  try {
    logger.debug('Starting text generation request');

    const validatedArgs = validateGenerateArgs(args);
    const { model, prompt, options } = validatedArgs;

    logger.info('Processing generate request', {
      model,
      promptLength: prompt.length,
      hasOptions: Object.keys(options).length > 0,
    });

    const requestData = {
      model,
      prompt,
      stream: false,
      options,
    };

    const response = await ollamaClient.post('/api/generate', requestData);

    const responseText = response.response || '';

    if (!responseText) {
      logger.warn('Empty response from generate API', { model });
    }

    logger.info('Text generation completed successfully', {
      model,
      responseLength: responseText.length,
    });

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn('Generate validation failed', { error: error.message, field: error.field });
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid generate parameters: ${error.message}`,
      );
    }

    logger.error('Generate request failed', error);

    throw new McpError(
      ErrorCode.InternalError,
      `Generation failed: ${error.message}`,
    );
  }
}

/**
 * Pull/download a model from Ollama registry
 * @param {Object} args - Pull model arguments
 * @returns {Promise<Object>} MCP response with pull status
 */
export async function handlePullModel(args) {
  try {
    logger.debug('Starting model pull request');

    const validatedArgs = validatePullModelArgs(args);
    const { name } = validatedArgs;

    logger.info('Processing pull model request', { modelName: name });

    const requestData = {
      name,
      stream: false,
    };

    // Note: Model pulling can take a long time, so we start the process
    // and return immediately with a status message
    const response = await ollamaClient.post('/api/pull', requestData);

    const status = response.status || 'Started';

    logger.info('Model pull initiated successfully', {
      modelName: name,
      status,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Model pull initiated for: ${name}\nStatus: ${status}`,
        },
      ],
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn('Pull model validation failed', { error: error.message, field: error.field });
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid pull model parameters: ${error.message}`,
      );
    }

    logger.error('Pull model request failed', error);

    throw new McpError(
      ErrorCode.InternalError,
      `Model pull failed: ${error.message}`,
    );
  }
}

/**
 * Generate basic static code analysis for placeholder providers
 * @param {string} code - Code to analyze
 * @param {string} language - Programming language
 * @param {string} feedbackType - Type of feedback requested
 * @returns {Object} Basic analysis results
 */
function generateBasicCodeAnalysis(code, language, feedbackType) {
  const lines = code.split('\n');

  // Basic complexity assessment
  const complexityIndicators = {
    javascript: ['function', 'class', 'if', 'for', 'while', 'try', 'catch', 'async', 'await'],
    python: ['def', 'class', 'if', 'for', 'while', 'try', 'except', 'async', 'await'],
    java: ['public', 'private', 'protected', 'class', 'interface', 'if', 'for', 'while', 'try', 'catch'],
    default: ['function', 'class', 'if', 'for', 'while', 'try', 'catch'],
  };

  const indicators = complexityIndicators[language] || complexityIndicators.default;
  const complexityCount = indicators.reduce((count, keyword) => {
    return count + (code.toLowerCase().match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
  }, 0);

  const complexity = complexityCount < 5 ? 'Low' : complexityCount < 15 ? 'Medium' : 'High';

  // Generate feedback-specific observations
  const observations = generateFeedbackSpecificObservations(code, language, feedbackType, lines);
  const suggestions = generateBasicSuggestions(code, language, feedbackType);

  return {
    complexity,
    observations,
    suggestions,
  };
}

/**
 * Generate feedback-specific observations
 */
function generateFeedbackSpecificObservations(code, language, feedbackType, lines) {
  const observations = [];

  if (feedbackType === 'security') {
    if (code.includes('eval(') || code.includes('innerHTML') || code.includes('document.write')) {
      observations.push('⚠️ Potential security concerns detected (eval, innerHTML, document.write)');
    }
    if (code.includes('SELECT') && code.includes('+')) {
      observations.push('⚠️ Possible SQL injection pattern detected');
    }
    if (!observations.length) {
      observations.push('✅ No obvious security anti-patterns detected in basic scan');
    }
  } else if (feedbackType === 'performance') {
    if (code.includes('for') && code.includes('.length')) {
      observations.push('🔍 Loop detected - consider caching length property');
    }
    if (code.includes('querySelector') || code.includes('getElementById')) {
      observations.push('🔍 DOM queries detected - consider caching elements');
    }
    if (!observations.length) {
      observations.push('📊 Basic performance scan completed');
    }
  } else if (feedbackType === 'style') {
    const hasConsistentIndentation = lines.every(line => line.startsWith('  ') || line.startsWith('\t') || line.trim() === '');
    if (!hasConsistentIndentation) {
      observations.push('📏 Inconsistent indentation detected');
    }
    const hasComments = code.includes('//') || code.includes('/*') || code.includes('#');
    if (!hasComments && lines.length > 10) {
      observations.push('📝 Consider adding comments for better readability');
    }
    if (!observations.length) {
      observations.push('✅ Basic style conventions appear consistent');
    }
  } else {
    observations.push(`🔍 General code structure analysis for ${language} code`);
    observations.push(`📏 Code contains ${lines.length} lines with ${lines.filter(l => l.trim()).length} non-empty lines`);
  }

  return observations.map(obs => `- ${obs}`).join('\n');
}

/**
 * Generate basic suggestions based on feedback type
 */
function generateBasicSuggestions(code, language, feedbackType) {
  const suggestions = [];

  switch (feedbackType) {
  case 'security':
    suggestions.push('🔒 Validate all user inputs');
    suggestions.push('🛡️ Use parameterized queries for database operations');
    suggestions.push('🔐 Implement proper authentication and authorization');
    break;
  case 'performance':
    suggestions.push('⚡ Profile code execution to identify bottlenecks');
    suggestions.push('💾 Consider caching frequently accessed data');
    suggestions.push('🔄 Optimize loops and data structures for efficiency');
    break;
  case 'style':
    suggestions.push('📏 Ensure consistent indentation and formatting');
    suggestions.push('📝 Add meaningful comments and documentation');
    suggestions.push('🏷️ Use descriptive variable and function names');
    break;
  case 'bugs':
    suggestions.push('🐛 Add proper error handling and edge case validation');
    suggestions.push('✅ Implement comprehensive unit tests');
    suggestions.push('🔍 Review logic flow and variable scoping');
    break;
  default:
    suggestions.push('📖 Review code for clarity and maintainability');
    suggestions.push('🧪 Add appropriate tests for all functionality');
    suggestions.push('📚 Follow language-specific best practices');
  }

  return suggestions.map(sug => `- ${sug}`).join('\n');
}

/**
 * Get AI-powered code feedback from various providers
 * @param {Object} args - Code feedback arguments
 * @returns {Promise<Object>} MCP response with code feedback
 */
export async function handleCodeFeedback(args) {
  try {
    logger.debug('Starting code feedback request');

    const validatedArgs = validateCodeFeedbackArgs(args);
    const { code, language, provider, model, feedbackType, options } = validatedArgs;

    logger.info('Processing code feedback request', {
      provider,
      language,
      feedbackType,
      codeLength: code.length,
      hasModel: !!model,
    });

    let feedback = '';

    // Create enhanced feedback prompts based on feedback type
    const feedbackPrompts = {
      general: {
        intro: `You are an expert ${language} code reviewer. Analyze the following code comprehensively for overall quality, maintainability, and adherence to best practices.`,
        focus: 'Focus on: code structure, readability, maintainability, naming conventions, and overall design patterns.',
      },
      performance: {
        intro: `You are a performance optimization specialist for ${language}. Analyze the following code for performance bottlenecks and optimization opportunities.`,
        focus: 'Focus on: algorithm efficiency, memory usage, I/O operations, data structures, and scalability concerns.',
      },
      security: {
        intro: `You are a cybersecurity expert specializing in ${language} application security. Analyze the following code for security vulnerabilities and potential threats.`,
        focus: 'Focus on: input validation, injection attacks, authentication/authorization, data exposure, and secure coding practices.',
      },
      style: {
        intro: `You are a ${language} code style and formatting expert. Analyze the following code for adherence to coding standards and style guidelines.`,
        focus: 'Focus on: formatting consistency, naming conventions, code organization, documentation, and language-specific style guides.',
      },
      bugs: {
        intro: `You are a senior ${language} developer specializing in bug detection and debugging. Analyze the following code for potential bugs, errors, and logical issues.`,
        focus: 'Focus on: logic errors, edge cases, error handling, null/undefined references, and runtime exceptions.',
      },
    };

    const prompt = feedbackPrompts[feedbackType];
    const promptText = `${prompt.intro}

${prompt.focus}

## Code to Review:
\`\`\`${language}
${code}
\`\`\`

## Required Response Format:

### 🔍 Analysis Summary
Provide a brief overview of the code's current state and main findings.

### ⚠️ Issues Identified
List specific issues found (if any):
- **Priority Level**: High/Medium/Low
- **Issue**: Description of the problem
- **Line/Section**: Where the issue occurs
- **Impact**: Potential consequences

### ✅ Positive Aspects
Highlight what's working well in the code.

### 🔧 Recommendations
Provide specific, actionable recommendations:
1. **Immediate fixes** (critical issues)
2. **Improvements** (optimization opportunities)
3. **Best practices** (long-term maintainability)

### 📚 Code Examples
If applicable, provide improved code snippets or alternatives.

### 🏷️ Overall Rating
Rate the code quality: Excellent/Good/Fair/Needs Improvement

Be specific, constructive, and provide actionable feedback that helps improve code quality.`;

    // Route to appropriate provider
    switch (provider) {
    case 'ollama':
      if (!model) {
        throw new ValidationError('model is required for ollama provider', 'model');
      }

      // Use existing ollama chat functionality
      {
        const chatArgs = {
          model,
          messages: [
            {
              role: 'system',
              content: `You are an expert code reviewer and software engineer with deep expertise in ${language} development. Your role is to provide comprehensive, constructive, and actionable code feedback.

Key principles:
- Be specific and cite exact code locations when identifying issues
- Provide clear explanations of WHY something is problematic
- Suggest concrete, implementable solutions
- Balance criticism with recognition of good practices
- Consider security, performance, maintainability, and readability
- Use the requested structured format for consistent, professional feedback
- Adapt your analysis depth to the complexity of the code provided

Your analysis should be thorough but concise, focusing on the most impactful improvements.`,
            },
            {
              role: 'user',
              content: promptText,
            },
          ],
          options,
        };

        const chatResponse = await handleChat(chatArgs);
        feedback = chatResponse.content[0].text;
        break;
      }

    case 'github':
    case 'claude':
    case 'chatgpt':
    {
      // Enhanced placeholder implementation with structured basic analysis
      const basicAnalysis = generateBasicCodeAnalysis(code, language, feedbackType);

      feedback = `## 🔄 ${provider.toUpperCase()} Provider Status

**Status**: Integration in development - using basic static analysis

### 🔍 Analysis Summary
This is a preliminary analysis of your ${language} code. For comprehensive AI-powered feedback, please use the 'ollama' provider with local models.

### 📊 Code Metrics
- **Language**: ${language}
- **Size**: ${code.length} characters (${code.split('\n').length} lines)
- **Analysis Type**: ${feedbackType}
- **Complexity**: ${basicAnalysis.complexity}

### 🔍 Basic Observations
${basicAnalysis.observations}

### ⚠️ Potential Areas for Review
${basicAnalysis.suggestions}

### 🚀 Get Enhanced Feedback
For detailed AI-powered analysis, use:
\`\`\`json
{
  "provider": "ollama",
  "model": "codellama:7b",
  "feedbackType": "${feedbackType}"
}
\`\`\`

### 🔧 Implementation Notes
- ${provider} API integration: **Planned for future release**
- Current analysis: **Basic pattern matching**
- Enhanced features: **Available with ollama provider**

*This analysis provides general guidance. For production code reviews, consider using the ollama provider or professional code review tools.*`;
      break;
    }

    default:
      throw new ValidationError(`Unsupported provider: ${provider}`, 'provider');
    }

    logger.info('Code feedback completed successfully', {
      provider,
      feedbackLength: feedback.length,
    });

    return {
      content: [
        {
          type: 'text',
          text: feedback,
        },
      ],
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn('Code feedback validation failed', { error: error.message, field: error.field });
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid code feedback parameters: ${error.message}`,
      );
    }

    logger.error('Code feedback request failed', error);

    throw new McpError(
      ErrorCode.InternalError,
      `Code feedback failed: ${error.message}`,
    );
  }
}

/**
 * Execute shell command in controlled environment
 * @param {Object} args - Terminal execution arguments
 * @returns {Promise<Object>} MCP response with command output
 */
export async function handleTerminalExecute(args) {
  try {
    logger.debug('Executing terminal command', { command: args.command });

    const { command, workingDirectory = process.cwd(), environment = {}, timeout = 30 } = args;

    // Security validation
    const dangerousCommands = ['rm -rf', 'sudo', 'su ', 'mkfs', 'fdisk', 'format'];
    if (dangerousCommands.some(cmd => command.toLowerCase().includes(cmd))) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Command contains potentially dangerous operations',
      );
    }

    const execOptions = {
      cwd: workingDirectory,
      env: { ...process.env, ...environment },
      timeout: timeout * 1000,
      maxBuffer: 1024 * 1024, // 1MB buffer
    };

    const { stdout, stderr } = await execAsync(command, execOptions);

    logger.info('Command executed successfully', {
      command: command.substring(0, 50) + (command.length > 50 ? '...' : ''),
      exitCode: 0,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Command: ${command}\nWorking Directory: ${workingDirectory}\n\nOutput:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Terminal command failed', error);

    if (error.code === 'ETIMEDOUT') {
      throw new McpError(
        ErrorCode.InternalError,
        `Command timeout after ${args.timeout || 30} seconds`,
      );
    }

    throw new McpError(
      ErrorCode.InternalError,
      `Command execution failed: ${error.message}`,
    );
  }
}

/**
 * Read file contents
 * @param {Object} args - File read arguments
 * @returns {Promise<Object>} MCP response with file contents
 */
export async function handleFileRead(args) {
  try {
    logger.debug('Reading file', { path: args.path });

    const { path: filePath, encoding = 'utf8', maxSize = 1048576 } = args;

    // Security validation
    const resolvedPath = path.resolve(filePath);
    if (resolvedPath.includes('..') || resolvedPath.startsWith('/etc/') || resolvedPath.startsWith('/sys/')) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Access to this path is not allowed',
      );
    }

    const stats = await fs.stat(resolvedPath);
    if (stats.size > maxSize) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `File size (${stats.size}) exceeds maximum allowed size (${maxSize})`,
      );
    }

    const content = await fs.readFile(resolvedPath, encoding);

    logger.info('File read successfully', {
      path: filePath,
      size: stats.size,
      encoding,
    });

    return {
      content: [
        {
          type: 'text',
          text: `File: ${filePath}\nSize: ${stats.size} bytes\nEncoding: ${encoding}\n\nContent:\n${content}`,
        },
      ],
    };
  } catch (error) {
    logger.error('File read failed', error);

    if (error.code === 'ENOENT') {
      throw new McpError(
        ErrorCode.InvalidParams,
        `File not found: ${args.path}`,
      );
    }

    throw new McpError(
      ErrorCode.InternalError,
      `File read failed: ${error.message}`,
    );
  }
}

/**
 * Write content to file
 * @param {Object} args - File write arguments
 * @returns {Promise<Object>} MCP response with write status
 */
export async function handleFileWrite(args) {
  try {
    logger.debug('Writing file', { path: args.path });

    const { path: filePath, content, encoding = 'utf8', createDirectories = false, backup = false } = args;

    // Security validation
    const resolvedPath = path.resolve(filePath);
    if (resolvedPath.includes('..') || resolvedPath.startsWith('/etc/') || resolvedPath.startsWith('/sys/')) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Access to this path is not allowed',
      );
    }

    // Create backup if requested and file exists
    if (backup) {
      try {
        await fs.access(resolvedPath);
        const backupPath = `${resolvedPath}.backup.${Date.now()}`;
        await fs.copyFile(resolvedPath, backupPath);
        logger.info('Backup created', { originalPath: filePath, backupPath });
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    // Create directories if requested
    if (createDirectories) {
      await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
    }

    await fs.writeFile(resolvedPath, content, encoding);

    logger.info('File written successfully', {
      path: filePath,
      size: content.length,
      encoding,
    });

    return {
      content: [
        {
          type: 'text',
          text: `File written successfully: ${filePath}\nSize: ${content.length} characters\nEncoding: ${encoding}`,
        },
      ],
    };
  } catch (error) {
    logger.error('File write failed', error);

    throw new McpError(
      ErrorCode.InternalError,
      `File write failed: ${error.message}`,
    );
  }
}

/**
 * List files and directories
 * @param {Object} args - File list arguments
 * @returns {Promise<Object>} MCP response with file listing
 */
export async function handleFileList(args) {
  try {
    logger.debug('Listing files', { path: args.path });

    const {
      path: dirPath = '.',
      pattern = '*',
      recursive = false,
      includeHidden = false,
      details = false,
    } = args;

    const resolvedPath = path.resolve(dirPath);

    // Security validation
    if (resolvedPath.includes('..') || resolvedPath.startsWith('/etc/') || resolvedPath.startsWith('/sys/')) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Access to this path is not allowed',
      );
    }

    const globPattern = recursive ? `${resolvedPath}/**/${pattern}` : `${resolvedPath}/${pattern}`;
    const globOptions = {
      dot: includeHidden,
      nodir: false,
    };

    const files = await glob(globPattern, globOptions);

    let result = `Directory listing: ${dirPath}\nPattern: ${pattern}\nRecursive: ${recursive}\n\n`;

    if (details) {
      const fileDetails = await Promise.all(
        files.map(async(file) => {
          try {
            const stats = await fs.stat(file);
            const relativePath = path.relative(resolvedPath, file);
            return {
              path: relativePath || path.basename(file),
              size: stats.size,
              modified: stats.mtime.toISOString(),
              isDirectory: stats.isDirectory(),
              permissions: (stats.mode & parseInt('777', 8)).toString(8),
            };
          } catch (error) {
            return {
              path: path.relative(resolvedPath, file),
              error: error.message,
            };
          }
        }),
      );

      result += fileDetails
        .map(item => {
          if (item.error) {
            return `${item.path} - ERROR: ${item.error}`;
          }
          const type = item.isDirectory ? 'DIR' : 'FILE';
          return `${type.padEnd(4)} ${item.size.toString().padStart(10)} ${item.modified} ${item.permissions} ${item.path}`;
        })
        .join('\n');
    } else {
      result += files
        .map(file => path.relative(resolvedPath, file) || path.basename(file))
        .join('\n');
    }

    logger.info('File listing completed', {
      path: dirPath,
      fileCount: files.length,
    });

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  } catch (error) {
    logger.error('File listing failed', error);

    throw new McpError(
      ErrorCode.InternalError,
      `File listing failed: ${error.message}`,
    );
  }
}

/**
 * Run tests with configurable options
 * @param {Object} args - Test run arguments
 * @returns {Promise<Object>} MCP response with test results
 */
export async function handleTestRun(args) {
  try {
    logger.debug('Running tests', args);

    const { testPath, pattern, watch = false, coverage = false, verbose = false } = args;

    let command = 'NODE_OPTIONS="--experimental-vm-modules" npx jest';

    if (testPath) {
      command += ` --testPathPatterns="${testPath}"`;
    }

    if (pattern) {
      command += ` --testNamePattern="${pattern}"`;
    }

    if (watch) {
      command += ' --watch';
    }

    if (coverage) {
      command += ' --coverage';
    }

    if (verbose) {
      command += ' --verbose';
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 300000, // 5 minutes
      maxBuffer: 2 * 1024 * 1024, // 2MB buffer
    });

    logger.info('Tests completed', { hasOutput: !!stdout });

    return {
      content: [
        {
          type: 'text',
          text: `Test Command: ${command}\n\nOutput:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Test execution failed', error);

    // Jest may exit with non-zero code even for successful runs with failing tests
    if (error.stdout || error.stderr) {
      return {
        content: [
          {
            type: 'text',
            text: `Test Command Failed:\n\nOutput:\n${error.stdout || ''}${error.stderr ? `\nErrors:\n${error.stderr}` : ''}`,
          },
        ],
      };
    }

    throw new McpError(
      ErrorCode.InternalError,
      `Test execution failed: ${error.message}`,
    );
  }
}

/**
 * Discover available tests
 * @param {Object} args - Test discovery arguments
 * @returns {Promise<Object>} MCP response with discovered tests
 */
export async function handleTestDiscover(args) {
  try {
    logger.debug('Discovering tests', args);

    const { path: testPath = 'tests/', pattern = '*.test.js' } = args;

    const globPattern = `${testPath}/**/${pattern}`;
    const testFiles = await glob(globPattern);

    let result = `Test Discovery\nPath: ${testPath}\nPattern: ${pattern}\n\n`;

    if (testFiles.length === 0) {
      result += 'No test files found.';
    } else {
      result += `Found ${testFiles.length} test files:\n\n`;
      result += testFiles.map(file => `• ${file}`).join('\n');
    }

    logger.info('Test discovery completed', { testCount: testFiles.length });

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  } catch (error) {
    logger.error('Test discovery failed', error);

    throw new McpError(
      ErrorCode.InternalError,
      `Test discovery failed: ${error.message}`,
    );
  }
}

/**
 * Run ESLint on specified files
 * @param {Object} args - Lint check arguments
 * @returns {Promise<Object>} MCP response with lint results
 */
export async function handleLintCheck(args) {
  try {
    logger.debug('Running lint check', args);

    const { path: lintPath = '.', fix = false, format = 'stylish' } = args;

    let command = `npx eslint "${lintPath}"`;

    if (fix) {
      command += ' --fix';
    }

    if (format) {
      command += ` --format ${format}`;
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 60000, // 1 minute
    });

    logger.info('Lint check completed', { hasIssues: !!stdout });

    return {
      content: [
        {
          type: 'text',
          text: `ESLint Command: ${command}\n\nResults:\n${stdout || 'No linting issues found!'}${stderr ? `\nErrors:\n${stderr}` : ''}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Lint check failed', error);

    // ESLint exits with non-zero code when there are linting issues
    if (error.stdout || error.stderr) {
      return {
        content: [
          {
            type: 'text',
            text: `ESLint Results:\n\n${error.stdout || ''}${error.stderr ? `\nErrors:\n${error.stderr}` : ''}`,
          },
        ],
      };
    }

    throw new McpError(
      ErrorCode.InternalError,
      `Lint check failed: ${error.message}`,
    );
  }
}

/**
 * Run security audit on dependencies
 * @param {Object} args - Security audit arguments
 * @returns {Promise<Object>} MCP response with audit results
 */
export async function handleAuditSecurity(args) {
  try {
    logger.debug('Running security audit', args);

    const { fix = false, level = 'moderate', production = false } = args;

    let command = 'npm audit';

    if (fix) {
      command += ' --fix';
    }

    if (level !== 'moderate') {
      command += ` --audit-level=${level}`;
    }

    if (production) {
      command += ' --production';
    }

    command += ' --json';

    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 120000, // 2 minutes
    });

    let result = `Security Audit Command: ${command.replace(' --json', '')}\n\n`;

    try {
      const auditData = JSON.parse(stdout);
      if (auditData.vulnerabilities) {
        const vulnCount = Object.keys(auditData.vulnerabilities).length;
        result += `Found ${vulnCount} vulnerabilities\n\n`;

        Object.entries(auditData.vulnerabilities).forEach(([pkg, vuln]) => {
          result += `Package: ${pkg}\n`;
          result += `Severity: ${vuln.severity}\n`;
          result += `Title: ${vuln.title}\n`;
          result += `Via: ${Array.isArray(vuln.via) ? vuln.via.join(', ') : vuln.via}\n\n`;
        });
      } else {
        result += 'No vulnerabilities found!';
      }
    } catch {
      result += stdout || 'No vulnerabilities found!';
    }

    if (stderr) {
      result += `\nWarnings:\n${stderr}`;
    }

    logger.info('Security audit completed');

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  } catch (error) {
    logger.error('Security audit failed', error);

    // npm audit may exit with non-zero code when vulnerabilities are found
    if (error.stdout) {
      try {
        const auditData = JSON.parse(error.stdout);
        let result = 'Security Audit Results:\n\n';

        if (auditData.vulnerabilities) {
          const vulnCount = Object.keys(auditData.vulnerabilities).length;
          result += `Found ${vulnCount} vulnerabilities\n\n`;

          Object.entries(auditData.vulnerabilities).forEach(([pkg, vuln]) => {
            result += `Package: ${pkg}\n`;
            result += `Severity: ${vuln.severity}\n`;
            result += `Title: ${vuln.title}\n`;
            result += `Via: ${Array.isArray(vuln.via) ? vuln.via.join(', ') : vuln.via}\n\n`;
          });
        }

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Security Audit Output:\n${error.stdout}`,
            },
          ],
        };
      }
    }

    throw new McpError(
      ErrorCode.InternalError,
      `Security audit failed: ${error.message}`,
    );
  }
}

/**
 * Get current MCP server status
 * @param {Object} args - Server status arguments
 * @returns {Promise<Object>} MCP response with server status
 */
export async function handleServerStatus(args) {
  try {
    logger.debug('Getting server status', args);

    const { detailed = false } = args;

    const startTime = process.uptime();
    const memoryUsage = process.memoryUsage();

    let result = 'MCP Server Status\n\n';
    result += 'Status: Running\n';
    result += `Uptime: ${Math.floor(startTime / 60)} minutes, ${Math.floor(startTime % 60)} seconds\n`;
    result += `Memory Usage: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB\n`;
    result += `Node.js Version: ${process.version}\n`;
    result += `Process ID: ${process.pid}\n`;

    if (detailed) {
      result += '\nDetailed Memory Usage:\n';
      result += `- RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB\n`;
      result += `- Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB\n`;
      result += `- Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB\n`;
      result += `- External: ${Math.round(memoryUsage.external / 1024 / 1024)} MB\n`;

      result += '\nEnvironment:\n';
      result += `- Platform: ${process.platform}\n`;
      result += `- Architecture: ${process.arch}\n`;
      result += `- Working Directory: ${process.cwd()}\n`;

      // Check Ollama connection
      try {
        await ollamaClient.get('/api/tags');
        result += '\nOllama Connection: Connected\n';
      } catch (error) {
        result += `\nOllama Connection: Failed (${error.message})\n`;
      }
    }

    logger.info('Server status retrieved', { detailed });

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  } catch (error) {
    logger.error('Server status check failed', error);

    throw new McpError(
      ErrorCode.InternalError,
      `Server status check failed: ${error.message}`,
    );
  }
}

/**
 * Validate MCP server configuration
 * @param {Object} args - Config validation arguments
 * @returns {Promise<Object>} MCP response with validation results
 */
export async function handleValidateConfig(args) {
  try {
    logger.debug('Validating configuration', args);

    const { configPath, showDetails = true } = args;

    let result = 'Configuration Validation\n\n';

    // Validate current configuration
    const config = process.env;
    const requiredVars = ['OLLAMA_API'];
    const optionalVars = ['SILENCE_STARTUP', 'DEBUG', 'REQUEST_TIMEOUT', 'MAX_RETRIES'];

    result += 'Environment Variables:\n';

    // Check required variables
    requiredVars.forEach(varName => {
      const value = config[varName];
      if (value) {
        result += `✓ ${varName}: ${showDetails ? value : '[SET]'}\n`;
      } else {
        result += `✗ ${varName}: Missing (using default)\n`;
      }
    });

    // Check optional variables
    optionalVars.forEach(varName => {
      const value = config[varName];
      if (value) {
        result += `• ${varName}: ${showDetails ? value : '[SET]'}\n`;
      }
    });

    // Test Ollama connection
    result += '\nOllama Connection Test:\n';
    try {
      const response = await ollamaClient.get('/api/tags');
      result += '✓ Successfully connected to Ollama\n';
      result += `✓ Found ${response.models?.length || 0} models\n`;
    } catch (error) {
      result += `✗ Failed to connect to Ollama: ${error.message}\n`;
    }

    // Check package.json if configPath is provided
    if (configPath) {
      try {
        const configContent = await fs.readFile(configPath, 'utf8');
        const configData = JSON.parse(configContent);
        result += `\nConfiguration File (${configPath}):\n`;
        result += '✓ Valid JSON format\n';
        if (showDetails) {
          result += `✓ Content preview: ${JSON.stringify(configData, null, 2).substring(0, 200)}...\n`;
        }
      } catch (error) {
        result += `\nConfiguration File (${configPath}):\n`;
        result += `✗ Error reading file: ${error.message}\n`;
      }
    }

    logger.info('Configuration validation completed');

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  } catch (error) {
    logger.error('Configuration validation failed', error);

    throw new McpError(
      ErrorCode.InternalError,
      `Configuration validation failed: ${error.message}`,
    );
  }
}

/**
 * GitHub MCP Tool Handlers
 * Placeholder implementations for GitHub operations
 */

export async function handleDownloadWorkflowRunArtifact(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'download_workflow_run_artifact tool is not yet implemented',
  );
}

export async function handleGetCodeScanningAlert(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'get_code_scanning_alert tool is not yet implemented',
  );
}

export async function handleGetCommit(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'get_commit tool is not yet implemented',
  );
}

export async function handleGetFileContents(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'get_file_contents tool is not yet implemented',
  );
}

export async function handleGetIssue(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'get_issue tool is not yet implemented',
  );
}

export async function handleGetIssueComments(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'get_issue_comments tool is not yet implemented',
  );
}

export async function handleGetJobLogs(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'get_job_logs tool is not yet implemented',
  );
}

export async function handleGetPullRequest(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'get_pull_request tool is not yet implemented',
  );
}

export async function handleGetPullRequestComments(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'get_pull_request_comments tool is not yet implemented',
  );
}

export async function handleGetPullRequestDiff(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'get_pull_request_diff tool is not yet implemented',
  );
}

export async function handleGetPullRequestFiles(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'get_pull_request_files tool is not yet implemented',
  );
}

export async function handleGetPullRequestReviews(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'get_pull_request_reviews tool is not yet implemented',
  );
}

export async function handleGetPullRequestStatus(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'get_pull_request_status tool is not yet implemented',
  );
}

export async function handleGetSecretScanningAlert(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'get_secret_scanning_alert tool is not yet implemented',
  );
}

export async function handleGetTag(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'get_tag tool is not yet implemented',
  );
}

export async function handleGetWorkflowRun(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'get_workflow_run tool is not yet implemented',
  );
}

export async function handleGetWorkflowRunLogs(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'get_workflow_run_logs tool is not yet implemented',
  );
}

export async function handleGetWorkflowRunUsage(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'get_workflow_run_usage tool is not yet implemented',
  );
}

export async function handleListBranches(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'list_branches tool is not yet implemented',
  );
}

export async function handleListCodeScanningAlerts(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'list_code_scanning_alerts tool is not yet implemented',
  );
}

export async function handleListCommits(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'list_commits tool is not yet implemented',
  );
}

export async function handleListIssues(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'list_issues tool is not yet implemented',
  );
}

export async function handleListPullRequests(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'list_pull_requests tool is not yet implemented',
  );
}

export async function handleListSecretScanningAlerts(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'list_secret_scanning_alerts tool is not yet implemented',
  );
}

export async function handleListSubIssues(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'list_sub_issues tool is not yet implemented',
  );
}

export async function handleListTags(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'list_tags tool is not yet implemented',
  );
}

export async function handleListWorkflowJobs(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'list_workflow_jobs tool is not yet implemented',
  );
}

export async function handleListWorkflowRunArtifacts(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'list_workflow_run_artifacts tool is not yet implemented',
  );
}

export async function handleListWorkflowRuns(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'list_workflow_runs tool is not yet implemented',
  );
}

export async function handleListWorkflows(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'list_workflows tool is not yet implemented',
  );
}

export async function handleSearchCode(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'search_code tool is not yet implemented',
  );
}

export async function handleSearchIssues(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'search_issues tool is not yet implemented',
  );
}

export async function handleSearchPullRequests(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'search_pull_requests tool is not yet implemented',
  );
}

export async function handleSearchRepositories(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'search_repositories tool is not yet implemented',
  );
}

export async function handleSearchUsers(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'search_users tool is not yet implemented',
  );
}

/**
 * Browser Automation Tool Handlers
 * Placeholder implementations for browser operations
 */

export async function handleBrowserClose(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_close tool is not yet implemented',
  );
}

export async function handleBrowserResize(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_resize tool is not yet implemented',
  );
}

export async function handleBrowserConsoleMessages(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_console_messages tool is not yet implemented',
  );
}

export async function handleBrowserHandleDialog(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_handle_dialog tool is not yet implemented',
  );
}

export async function handleBrowserEvaluate(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_evaluate tool is not yet implemented',
  );
}

export async function handleBrowserFileUpload(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_file_upload tool is not yet implemented',
  );
}

export async function handleBrowserInstall(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_install tool is not yet implemented',
  );
}

export async function handleBrowserPressKey(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_press_key tool is not yet implemented',
  );
}

export async function handleBrowserType(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_type tool is not yet implemented',
  );
}

export async function handleBrowserNavigate(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_navigate tool is not yet implemented',
  );
}

export async function handleBrowserNavigateBack(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_navigate_back tool is not yet implemented',
  );
}

export async function handleBrowserNavigateForward(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_navigate_forward tool is not yet implemented',
  );
}

export async function handleBrowserNetworkRequests(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_network_requests tool is not yet implemented',
  );
}

export async function handleBrowserTakeScreenshot(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_take_screenshot tool is not yet implemented',
  );
}

export async function handleBrowserSnapshot(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_snapshot tool is not yet implemented',
  );
}

export async function handleBrowserClick(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_click tool is not yet implemented',
  );
}

export async function handleBrowserDrag(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_drag tool is not yet implemented',
  );
}

export async function handleBrowserHover(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_hover tool is not yet implemented',
  );
}

export async function handleBrowserSelectOption(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_select_option tool is not yet implemented',
  );
}

export async function handleBrowserTabList(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_tab_list tool is not yet implemented',
  );
}

export async function handleBrowserTabNew(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_tab_new tool is not yet implemented',
  );
}

export async function handleBrowserTabSelect(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_tab_select tool is not yet implemented',
  );
}

export async function handleBrowserTabClose(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_tab_close tool is not yet implemented',
  );
}

export async function handleBrowserWaitFor(_args) {
  throw new McpError(
    ErrorCode.MethodNotFound,
    'browser_wait_for tool is not yet implemented',
  );
}
