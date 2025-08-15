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
  // GitHub MCP Tools
  handleDownloadWorkflowRunArtifact,
  handleGetCodeScanningAlert,
  handleGetCommit,
  handleGetFileContents,
  handleGetIssue,
  handleGetIssueComments,
  handleGetJobLogs,
  handleGetPullRequest,
  handleGetPullRequestComments,
  handleGetPullRequestDiff,
  handleGetPullRequestFiles,
  handleGetPullRequestReviews,
  handleGetPullRequestStatus,
  handleGetSecretScanningAlert,
  handleGetTag,
  handleGetWorkflowRun,
  handleGetWorkflowRunLogs,
  handleGetWorkflowRunUsage,
  handleListBranches,
  handleListCodeScanningAlerts,
  handleListCommits,
  handleListIssues,
  handleListPullRequests,
  handleListSecretScanningAlerts,
  handleListSubIssues,
  handleListTags,
  handleListWorkflowJobs,
  handleListWorkflowRunArtifacts,
  handleListWorkflowRuns,
  handleListWorkflows,
  handleSearchCode,
  handleSearchIssues,
  handleSearchPullRequests,
  handleSearchRepositories,
  handleSearchUsers,
  // Browser Automation Tools
  handleBrowserClose,
  handleBrowserResize,
  handleBrowserConsoleMessages,
  handleBrowserHandleDialog,
  handleBrowserEvaluate,
  handleBrowserFileUpload,
  handleBrowserInstall,
  handleBrowserPressKey,
  handleBrowserType,
  handleBrowserNavigate,
  handleBrowserNavigateBack,
  handleBrowserNavigateForward,
  handleBrowserNetworkRequests,
  handleBrowserTakeScreenshot,
  handleBrowserSnapshot,
  handleBrowserClick,
  handleBrowserDrag,
  handleBrowserHover,
  handleBrowserSelectOption,
  handleBrowserTabList,
  handleBrowserTabNew,
  handleBrowserTabSelect,
  handleBrowserTabClose,
  handleBrowserWaitFor,
} from './handlers/tools.js';

// AI Core modules for LAW-001 compliance
import { lawEnforcer } from '../ai_core/law_enforcer.js';
import { learningCycle } from '../ai_core/learning_cycle.js';
import { snapshotManager } from '../ai_core/snapshot_mem.js';
import { patternDetector } from '../logic/pattern_detector.js';

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
    this.aiCoreInitialized = false;

    logger.debug('Initializing Ollama MCP Server', {
      version: this.config.SERVER_VERSION,
      ollamaApi: this.config.OLLAMA_API,
      silenceStartup: this.config.SILENCE_STARTUP,
      lawEnforcement: 'LAW-001',
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

    // Initialize AI Core system for LAW-001 compliance
    this.initializeAICore().catch(error => {
      logger.error('Failed to initialize AI Core system:', error);
    });
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
   * Initialize AI Core System for LAW-001 compliance
   */
  async initializeAICore() {
    try {
      logger.info('Initializing AI Core System for LAW-001 compliance');

      // Initialize law enforcement system
      await lawEnforcer.initialize();

      // Initialize snapshot memory system
      await snapshotManager.initialize();

      // Initialize pattern detector
      await patternDetector.initialize();

      this.aiCoreInitialized = true;
      logger.info('AI Core System initialized successfully');

      // Trigger initial learning cycle to demonstrate system is working
      await this.triggerLearningCycle('system_initialization', {
        server_version: this.config.SERVER_VERSION,
        initialization_time: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('AI Core initialization failed:', error);
      throw error;
    }
  }

  /**
   * Trigger learning cycle as required by LAW-001
   * @param {string} cause - The detected cause
   * @param {Object} context - Context information
   */
  async triggerLearningCycle(cause, context = {}) {
    try {
      if (!this.aiCoreInitialized) {
        logger.warn('AI Core not initialized, skipping learning cycle');
        return;
      }

      logger.debug(`Triggering learning cycle for cause: ${cause}`);

      // Execute the 6-step learning cycle as required by LAW-001
      const cycleResult = await learningCycle.executeCycle(cause, context);

      logger.debug('Learning cycle completed', {
        cycleId: cycleResult.currentCycle?.steps?.step6_snapshot?.snapshot_id,
      });

      return cycleResult;

    } catch (error) {
      logger.error('Learning cycle execution failed:', error);
      // Don't throw to avoid breaking main server operations
    }
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

        // Trigger learning cycle for tool execution (LAW-001 compliance)
        await this.triggerLearningCycle(`tool_execution_${toolName}`, {
          tool_name: toolName,
          arguments: args,
          timestamp: new Date().toISOString(),
        });

        // Route to appropriate handler
        let result;
        switch (toolName) {
        case 'ollama_list_models':
          result = await handleListModels();
          break;

        case 'ollama_chat':
          result = await handleChat(args);
          break;

        case 'ollama_generate':
          result = await handleGenerate(args);
          break;

        case 'ollama_pull_model':
          result = await handlePullModel(args);
          break;

        case 'terminal_execute':
          result = await handleTerminalExecute(args);
          break;

        case 'file_read':
          result = await handleFileRead(args);
          break;

        case 'file_write':
          result = await handleFileWrite(args);
          break;

        case 'file_list':
          result = await handleFileList(args);
          break;

        case 'test_run':
          result = await handleTestRun(args);
          break;

        case 'test_discover':
          result = await handleTestDiscover(args);
          break;

        case 'lint_check':
          result = await handleLintCheck(args);
          break;

        case 'audit_security':
          result = await handleAuditSecurity(args);
          break;

        case 'server_status':
          result = await handleServerStatus(args);
          break;

        case 'validate_config':
          result = await handleValidateConfig(args);
          break;

        // GitHub MCP Tools
        case 'download_workflow_run_artifact':
          result = await handleDownloadWorkflowRunArtifact(args);
          break;

        case 'get_code_scanning_alert':
          result = await handleGetCodeScanningAlert(args);
          break;

        case 'get_commit':
          result = await handleGetCommit(args);
          break;

        case 'get_file_contents':
          result = await handleGetFileContents(args);
          break;

        case 'get_issue':
          result = await handleGetIssue(args);
          break;

        case 'get_issue_comments':
          result = await handleGetIssueComments(args);
          break;

        case 'get_job_logs':
          result = await handleGetJobLogs(args);
          break;

        case 'get_pull_request':
          result = await handleGetPullRequest(args);
          break;

        case 'get_pull_request_comments':
          result = await handleGetPullRequestComments(args);
          break;

        case 'get_pull_request_diff':
          result = await handleGetPullRequestDiff(args);
          break;

        case 'get_pull_request_files':
          result = await handleGetPullRequestFiles(args);
          break;

        case 'get_pull_request_reviews':
          result = await handleGetPullRequestReviews(args);
          break;

        case 'get_pull_request_status':
          result = await handleGetPullRequestStatus(args);
          break;

        case 'get_secret_scanning_alert':
          result = await handleGetSecretScanningAlert(args);
          break;

        case 'get_tag':
          result = await handleGetTag(args);
          break;

        case 'get_workflow_run':
          result = await handleGetWorkflowRun(args);
          break;

        case 'get_workflow_run_logs':
          result = await handleGetWorkflowRunLogs(args);
          break;

        case 'get_workflow_run_usage':
          result = await handleGetWorkflowRunUsage(args);
          break;

        case 'list_branches':
          result = await handleListBranches(args);
          break;

        case 'list_code_scanning_alerts':
          result = await handleListCodeScanningAlerts(args);
          break;

        case 'list_commits':
          result = await handleListCommits(args);
          break;

        case 'list_issues':
          result = await handleListIssues(args);
          break;

        case 'list_pull_requests':
          result = await handleListPullRequests(args);
          break;

        case 'list_secret_scanning_alerts':
          result = await handleListSecretScanningAlerts(args);
          break;

        case 'list_sub_issues':
          result = await handleListSubIssues(args);
          break;

        case 'list_tags':
          result = await handleListTags(args);
          break;

        case 'list_workflow_jobs':
          result = await handleListWorkflowJobs(args);
          break;

        case 'list_workflow_run_artifacts':
          result = await handleListWorkflowRunArtifacts(args);
          break;

        case 'list_workflow_runs':
          result = await handleListWorkflowRuns(args);
          break;

        case 'list_workflows':
          result = await handleListWorkflows(args);
          break;

        case 'search_code':
          result = await handleSearchCode(args);
          break;

        case 'search_issues':
          result = await handleSearchIssues(args);
          break;

        case 'search_pull_requests':
          result = await handleSearchPullRequests(args);
          break;

        case 'search_repositories':
          result = await handleSearchRepositories(args);
          break;

        case 'search_users':
          result = await handleSearchUsers(args);
          break;

        // Browser Automation Tools
        case 'browser_close':
          result = await handleBrowserClose(args);
          break;

        case 'browser_resize':
          result = await handleBrowserResize(args);
          break;

        case 'browser_console_messages':
          result = await handleBrowserConsoleMessages(args);
          break;

        case 'browser_handle_dialog':
          result = await handleBrowserHandleDialog(args);
          break;

        case 'browser_evaluate':
          result = await handleBrowserEvaluate(args);
          break;

        case 'browser_file_upload':
          result = await handleBrowserFileUpload(args);
          break;

        case 'browser_install':
          result = await handleBrowserInstall(args);
          break;

        case 'browser_press_key':
          result = await handleBrowserPressKey(args);
          break;

        case 'browser_type':
          result = await handleBrowserType(args);
          break;

        case 'browser_navigate':
          result = await handleBrowserNavigate(args);
          break;

        case 'browser_navigate_back':
          result = await handleBrowserNavigateBack(args);
          break;

        case 'browser_navigate_forward':
          result = await handleBrowserNavigateForward(args);
          break;

        case 'browser_network_requests':
          result = await handleBrowserNetworkRequests(args);
          break;

        case 'browser_take_screenshot':
          result = await handleBrowserTakeScreenshot(args);
          break;

        case 'browser_snapshot':
          result = await handleBrowserSnapshot(args);
          break;

        case 'browser_click':
          result = await handleBrowserClick(args);
          break;

        case 'browser_drag':
          result = await handleBrowserDrag(args);
          break;

        case 'browser_hover':
          result = await handleBrowserHover(args);
          break;

        case 'browser_select_option':
          result = await handleBrowserSelectOption(args);
          break;

        case 'browser_tab_list':
          result = await handleBrowserTabList(args);
          break;

        case 'browser_tab_new':
          result = await handleBrowserTabNew(args);
          break;

        case 'browser_tab_select':
          result = await handleBrowserTabSelect(args);
          break;

        case 'browser_tab_close':
          result = await handleBrowserTabClose(args);
          break;

        case 'browser_wait_for':
          result = await handleBrowserWaitFor(args);
          break;

        default:
          // This should never happen due to validation above
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unimplemented tool: ${toolName}`,
          );
        }

        // Trigger learning cycle for successful completion
        await this.triggerLearningCycle(`tool_completion_${toolName}`, {
          tool_name: toolName,
          success: true,
          result_type: typeof result,
          timestamp: new Date().toISOString(),
        });

        return result;
      } catch (error) {
        // Trigger learning cycle for error handling
        await this.triggerLearningCycle(`tool_error_${toolName}`, {
          tool_name: toolName,
          error_message: error.message,
          error_type: error.constructor.name,
          timestamp: new Date().toISOString(),
        });

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
