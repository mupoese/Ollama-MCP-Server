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
  ValidationError,
} from '../utils/validation.js';

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
