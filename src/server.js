#!/usr/bin/env node

/**
 * Ollama MCP Server
 * A Model Context Protocol server for integrating with Ollama
 *
 * @author mupoese
 * @version 1.0.0
 * @license GPL-2.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Internal modules
import { getConfig } from './config/index.js';
import { logger } from './utils/logger.js';
import { TOOL_DEFINITIONS, isValidToolName } from './handlers/schemas.js';
import {
  handleListModels,
  handleChat,
  handleGenerate,
  handlePullModel,
} from './handlers/tools.js';

/**
 * Ollama MCP Server class
 * Manages the MCP server instance and tool handlers
 */
class OllamaMCPServer {
  /**
   * Initialize the MCP server
   */
  constructor() {
    this.config = getConfig();

    logger.debug('Initializing Ollama MCP Server', {
      version: this.config.SERVER_VERSION,
      ollamaApi: this.config.OLLAMA_API,
      silenceStartup: this.config.SILENCE_STARTUP,
    });

    this.server = new Server(
      {
        name: this.config.SERVER_NAME,
        version: this.config.SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupRequestHandlers();
    this.setupErrorHandling();
  }

  /**
   * Set up error handling for the server
   */
  setupErrorHandling() {
    this.server.onerror = (error) => {
      logger.error('MCP Server error', error);
    };

    // Graceful shutdown on SIGINT
    process.on('SIGINT', async() => {
      logger.info('Received SIGINT, shutting down gracefully');
      await this.shutdown();
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', error);
      this.shutdown().then(() => process.exit(1));
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', { reason, promise });
    });
  }

  /**
   * Set up MCP request handlers
   */
  setupRequestHandlers() {
    // Handle tool listing requests
    this.server.setRequestHandler(ListToolsRequestSchema, async() => {
      logger.debug('Handling list tools request');

      return {
        tools: TOOL_DEFINITIONS,
      };
    });

    // Handle tool execution requests
    this.server.setRequestHandler(CallToolRequestSchema, async(request) => {
      const { name: toolName, arguments: args } = request.params;

      logger.debug('Handling tool call request', {
        toolName,
        hasArgs: !!args,
      });

      try {
        // Validate tool name
        if (!isValidToolName(toolName)) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${toolName}`,
          );
        }

        // Route to appropriate handler
        switch (toolName) {
        case 'ollama_list_models':
          return await handleListModels();

        case 'ollama_chat':
          return await handleChat(args);

        case 'ollama_generate':
          return await handleGenerate(args);

        case 'ollama_pull_model':
          return await handlePullModel(args);

        default:
          // This should never happen due to validation above
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unimplemented tool: ${toolName}`,
          );
        }
      } catch (error) {
        // Re-throw MCP errors as-is
        if (error instanceof McpError) {
          throw error;
        }

        // Wrap other errors as internal errors
        logger.error('Tool execution failed', {
          toolName,
          error: error.message,
          stack: error.stack,
        });

        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`,
        );
      }
    });
  }

  /**
   * Start the MCP server
   */
  async run() {
    try {
      logger.debug('Starting MCP server transport');

      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      logger.info('Ollama MCP Server started successfully', {
        version: this.config.SERVER_VERSION,
        toolCount: TOOL_DEFINITIONS.length,
      });

    } catch (error) {
      logger.error('Failed to start MCP server', error);
      throw error;
    }
  }

  /**
   * Shutdown the server gracefully
   */
  async shutdown() {
    try {
      logger.info('Shutting down MCP server');
      await this.server.close();
      logger.info('MCP server shutdown complete');
    } catch (error) {
      logger.error('Error during server shutdown', error);
    }
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    const server = new OllamaMCPServer();
    await server.run();
  } catch (error) {
    logger.error('Failed to start Ollama MCP Server', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
