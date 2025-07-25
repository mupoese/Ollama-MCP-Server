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
