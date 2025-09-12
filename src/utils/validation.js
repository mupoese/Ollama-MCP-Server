/**
 * Input validation utilities for the Ollama MCP Server
 * Provides schema validation for tool inputs
 */

import { logger } from './logger.js';

/**
 * Base validation error class
 */
export class ValidationError extends Error {
  constructor(message, field = null, value = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    Error.captureStackTrace(this, ValidationError);
  }
}

/**
 * Required field validation error
 */
export class RequiredFieldError extends ValidationError {
  constructor(fieldName) {
    super(`${fieldName} is required and cannot be empty`, fieldName);
    this.name = 'RequiredFieldError';
  }
}

/**
 * Invalid type validation error
 */
export class InvalidTypeError extends ValidationError {
  constructor(fieldName, expectedType, actualType) {
    super(`${fieldName} must be a ${expectedType}, received ${actualType}`, fieldName);
    this.name = 'InvalidTypeError';
    this.expectedType = expectedType;
    this.actualType = actualType;
  }
}

/**
 * Invalid value validation error
 */
export class InvalidValueError extends ValidationError {
  constructor(fieldName, value, allowedValues = null) {
    const message = allowedValues
      ? `${fieldName} has invalid value "${value}". Allowed values: ${allowedValues.join(', ')}`
      : `${fieldName} has invalid value "${value}"`;
    super(message, fieldName, value);
    this.name = 'InvalidValueError';
    this.allowedValues = allowedValues;
  }
}

/**
 * Validate that a value is a non-empty string
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field being validated
 * @throws {ValidationError} If validation fails
 */
export function validateRequiredString(value, fieldName) {
  if (value === null || value === undefined) {
    throw new RequiredFieldError(fieldName);
  }

  if (typeof value !== 'string') {
    throw new InvalidTypeError(fieldName, 'string', typeof value);
  }

  if (value.trim().length === 0) {
    throw new RequiredFieldError(fieldName);
  }
}

/**
 * Validate that a value is an array
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field being validated
 * @throws {ValidationError} If validation fails
 */
export function validateRequiredArray(value, fieldName) {
  if (value === null || value === undefined) {
    throw new RequiredFieldError(fieldName);
  }

  if (!Array.isArray(value)) {
    throw new InvalidTypeError(fieldName, 'array', typeof value);
  }

  if (value.length === 0) {
    throw new RequiredFieldError(fieldName);
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
    const messageField = `messages[${index}]`;

    if (typeof message !== 'object' || message === null) {
      throw new InvalidTypeError(messageField, 'object', typeof message);
    }

    if (!message.role) {
      throw new RequiredFieldError(`${messageField}.role`);
    }

    if (!validRoles.includes(message.role)) {
      throw new InvalidValueError(`${messageField}.role`, message.role, validRoles);
    }

    if (typeof message.content !== 'string') {
      throw new InvalidTypeError(`${messageField}.content`, 'string', typeof message.content);
    }

    if (message.content.trim().length === 0) {
      throw new RequiredFieldError(`${messageField}.content`);
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
    throw new InvalidTypeError('options', 'object', typeof options);
  }

  // Validate specific option fields if present
  if (options.temperature !== undefined) {
    if (typeof options.temperature !== 'number') {
      throw new InvalidTypeError('options.temperature', 'number', typeof options.temperature);
    }
    if (options.temperature < 0 || options.temperature > 2) {
      throw new InvalidValueError('options.temperature', options.temperature, ['0-2 range']);
    }
  }

  if (options.top_p !== undefined) {
    if (typeof options.top_p !== 'number') {
      throw new InvalidTypeError('options.top_p', 'number', typeof options.top_p);
    }
    if (options.top_p < 0 || options.top_p > 1) {
      throw new InvalidValueError('options.top_p', options.top_p, ['0-1 range']);
    }
  }

  if (options.top_k !== undefined) {
    if (typeof options.top_k !== 'number' || !Number.isInteger(options.top_k)) {
      throw new InvalidTypeError('options.top_k', 'integer', typeof options.top_k);
    }
    if (options.top_k < 1) {
      throw new InvalidValueError('options.top_k', options.top_k, ['minimum value: 1']);
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

/**
 * Validate code feedback tool arguments
 * @param {Object} args - Arguments to validate
 * @returns {Object} Validated arguments
 * @throws {ValidationError} If validation fails
 */
export function validateCodeFeedbackArgs(args) {
  if (!args || typeof args !== 'object') {
    throw new InvalidTypeError('arguments', 'object', typeof args);
  }

  validateRequiredString(args.code, 'code');
  validateRequiredString(args.language, 'language');
  validateRequiredString(args.provider, 'provider');

  // Validate provider
  const validProviders = ['ollama', 'github', 'claude', 'chatgpt'];
  if (!validProviders.includes(args.provider)) {
    throw new InvalidValueError('provider', args.provider, validProviders);
  }

  // For ollama provider, model is required
  if (args.provider === 'ollama') {
    validateRequiredString(args.model, 'model');
  }

  // Validate feedback type if provided
  if (args.feedbackType) {
    const validTypes = ['general', 'performance', 'security', 'style', 'bugs'];
    if (!validTypes.includes(args.feedbackType)) {
      throw new InvalidValueError('feedbackType', args.feedbackType, validTypes);
    }
  }

  // Validate options if provided
  if (args.options) {
    validateOptions(args.options);
  }

  // Additional validation for code length (prevent extremely large inputs)
  if (args.code.length > 50000) { // 50KB limit
    throw new InvalidValueError('code', 'length', ['maximum 50,000 characters']);
  }

  // Validate language format (basic check)
  if (!/^[a-zA-Z0-9+_-]+$/.test(args.language)) {
    throw new InvalidValueError('language', args.language, ['alphanumeric characters, +, _, - only']);
  }

  logger.debug('Code feedback arguments validated successfully', {
    provider: args.provider,
    language: args.language,
    codeLength: args.code.length,
    hasOptions: !!args.options,
  });

  return {
    code: args.code.trim(),
    language: args.language.trim(),
    provider: args.provider.trim(),
    model: args.model ? args.model.trim() : undefined,
    feedbackType: args.feedbackType || 'general',
    options: args.options || {},
  };
}
