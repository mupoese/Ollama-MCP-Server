/**
 * Input validation utilities for the Ollama MCP Server
 * Provides schema validation for tool inputs
 */

import { logger } from './logger.js';

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Validate that a value is a non-empty string
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field being validated
 * @throws {ValidationError} If validation fails
 */
export function validateRequiredString(value, fieldName) {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName);
  }

  if (value.trim().length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`, fieldName);
  }
}

/**
 * Validate that a value is an array
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field being validated
 * @throws {ValidationError} If validation fails
 */
export function validateRequiredArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`, fieldName);
  }

  if (value.length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`, fieldName);
  }
}

/**
 * Validate chat messages array
 * @param {Array} messages - Messages array to validate
 * @throws {ValidationError} If validation fails
 */
export function validateChatMessages(messages) {
  validateRequiredArray(messages, 'messages');

  const validRoles = ['system', 'user', 'assistant'];

  messages.forEach((message, index) => {
    if (typeof message !== 'object' || message === null) {
      throw new ValidationError(`Message at index ${index} must be an object`, 'messages');
    }

    if (!message.role) {
      throw new ValidationError(`Message at index ${index} must have a role`, 'messages');
    }

    if (!validRoles.includes(message.role)) {
      throw new ValidationError(
        `Message at index ${index} has invalid role. Must be one of: ${validRoles.join(', ')}`,
        'messages',
      );
    }

    if (typeof message.content !== 'string') {
      throw new ValidationError(`Message at index ${index} content must be a string`, 'messages');
    }

    if (message.content.trim().length === 0) {
      throw new ValidationError(`Message at index ${index} content cannot be empty`, 'messages');
    }
  });
}

/**
 * Validate optional options object
 * @param {*} options - Options object to validate
 * @throws {ValidationError} If validation fails
 */
export function validateOptions(options) {
  if (options === null || options === undefined) {
    return; // Options are optional
  }

  if (typeof options !== 'object') {
    throw new ValidationError('options must be an object', 'options');
  }

  // Validate specific option fields if present
  if (options.temperature !== undefined) {
    if (typeof options.temperature !== 'number') {
      throw new ValidationError('temperature must be a number', 'options.temperature');
    }
    if (options.temperature < 0 || options.temperature > 2) {
      throw new ValidationError('temperature must be between 0 and 2', 'options.temperature');
    }
  }

  if (options.top_p !== undefined) {
    if (typeof options.top_p !== 'number') {
      throw new ValidationError('top_p must be a number', 'options.top_p');
    }
    if (options.top_p < 0 || options.top_p > 1) {
      throw new ValidationError('top_p must be between 0 and 1', 'options.top_p');
    }
  }

  if (options.top_k !== undefined) {
    if (typeof options.top_k !== 'number' || !Number.isInteger(options.top_k)) {
      throw new ValidationError('top_k must be an integer', 'options.top_k');
    }
    if (options.top_k < 1) {
      throw new ValidationError('top_k must be at least 1', 'options.top_k');
    }
  }
}

/**
 * Validate chat tool arguments
 * @param {Object} args - Arguments to validate
 * @returns {Object} Validated arguments
 * @throws {ValidationError} If validation fails
 */
export function validateChatArgs(args) {
  if (!args || typeof args !== 'object') {
    throw new ValidationError('Arguments must be an object');
  }

  validateRequiredString(args.model, 'model');
  validateChatMessages(args.messages);
  validateOptions(args.options);

  logger.debug('Chat arguments validated successfully', {
    model: args.model,
    messageCount: args.messages.length,
    hasOptions: !!args.options,
  });

  return {
    model: args.model.trim(),
    messages: args.messages,
    options: args.options || {},
  };
}

/**
 * Validate generate tool arguments
 * @param {Object} args - Arguments to validate
 * @returns {Object} Validated arguments
 * @throws {ValidationError} If validation fails
 */
export function validateGenerateArgs(args) {
  if (!args || typeof args !== 'object') {
    throw new ValidationError('Arguments must be an object');
  }

  validateRequiredString(args.model, 'model');
  validateRequiredString(args.prompt, 'prompt');
  validateOptions(args.options);

  logger.debug('Generate arguments validated successfully', {
    model: args.model,
    promptLength: args.prompt.length,
    hasOptions: !!args.options,
  });

  return {
    model: args.model.trim(),
    prompt: args.prompt.trim(),
    options: args.options || {},
  };
}

/**
 * Validate pull model tool arguments
 * @param {Object} args - Arguments to validate
 * @returns {Object} Validated arguments
 * @throws {ValidationError} If validation fails
 */
export function validatePullModelArgs(args) {
  if (!args || typeof args !== 'object') {
    throw new ValidationError('Arguments must be an object');
  }

  validateRequiredString(args.name, 'name');

  // Validate model name format (basic validation)
  const modelName = args.name.trim();
  if (!/^[a-zA-Z0-9._-]+(?::[a-zA-Z0-9._-]+)?$/.test(modelName)) {
    throw new ValidationError(
      'Model name must contain only alphanumeric characters, dots, hyphens, underscores, and optional colon for tags',
      'name',
    );
  }

  logger.debug('Pull model arguments validated successfully', {
    modelName,
  });

  return {
    name: modelName,
  };
}
