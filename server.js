#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

// Configuration
const OLLAMA_API = process.env.OLLAMA_API || "http://localhost:11434";

class OllamaMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "ollama-mcp-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "ollama_list_models",
            description: "List all available Ollama models",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "ollama_chat",
            description: "Chat with an Ollama model",
            inputSchema: {
              type: "object",
              properties: {
                model: {
                  type: "string",
                  description: "The model name to use for chat",
                },
                messages: {
                  type: "array",
                  description: "Array of message objects with role and content",
                  items: {
                    type: "object",
                    properties: {
                      role: {
                        type: "string",
                        enum: ["system", "user", "assistant"],
                      },
                      content: {
                        type: "string",
                      },
                    },
                    required: ["role", "content"],
                  },
                },
                options: {
                  type: "object",
                  description: "Optional parameters for the model",
                  properties: {
                    temperature: { type: "number" },
                    top_p: { type: "number" },
                    top_k: { type: "number" },
                  },
                },
              },
              required: ["model", "messages"],
            },
          },
          {
            name: "ollama_generate",
            description: "Generate text with an Ollama model",
            inputSchema: {
              type: "object",
              properties: {
                model: {
                  type: "string",
                  description: "The model name to use for generation",
                },
                prompt: {
                  type: "string",
                  description: "The prompt to generate from",
                },
                options: {
                  type: "object",
                  description: "Optional parameters for the model",
                  properties: {
                    temperature: { type: "number" },
                    top_p: { type: "number" },
                    top_k: { type: "number" },
                  },
                },
              },
              required: ["model", "prompt"],
            },
          },
          {
            name: "ollama_pull_model",
            description: "Pull/download a model from Ollama registry",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "The model name to pull (e.g., 'llama2', 'codellama')",
                },
              },
              required: ["name"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case "ollama_list_models":
            return await this.listModels();
          
          case "ollama_chat":
            return await this.chat(request.params.arguments);
          
          case "ollama_generate":
            return await this.generate(request.params.arguments);
          
          case "ollama_pull_model":
            return await this.pullModel(request.params.arguments);
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  async listModels() {
    try {
      const response = await axios.get(`${OLLAMA_API}/api/tags`);
      const models = response.data.models || [];
      
      return {
        content: [
          {
            type: "text",
            text: `Available Ollama models:\n\n${models.map(model => 
              `• ${model.name} (${model.size})`
            ).join('\n') || 'No models found'}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to list models: ${error.message}`
      );
    }
  }

  async chat(args) {
    const { model, messages, options = {} } = args;
    
    try {
      const response = await axios.post(`${OLLAMA_API}/api/chat`, {
        model,
        messages,
        stream: false,
        options,
      });

      const responseText = response.data.message?.content || response.data.response || '';
      
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Chat failed: ${error.response?.data?.error || error.message}`
      );
    }
  }

  async generate(args) {
    const { model, prompt, options = {} } = args;
    
    try {
      const response = await axios.post(`${OLLAMA_API}/api/generate`, {
        model,
        prompt,
        stream: false,
        options,
      });

      return {
        content: [
          {
            type: "text",
            text: response.data.response || '',
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Generation failed: ${error.response?.data?.error || error.message}`
      );
    }
  }

  async pullModel(args) {
    const { name } = args;
    
    try {
      // Start the pull request
      const response = await axios.post(`${OLLAMA_API}/api/pull`, {
        name,
        stream: false,
      });

      return {
        content: [
          {
            type: "text",
            text: `Model pull initiated for: ${name}\nStatus: ${response.data.status || 'Started'}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Model pull failed: ${error.response?.data?.error || error.message}`
      );
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Don't log to stdout - it interferes with MCP protocol
    console.error("Ollama MCP Server running...");
  }
}

// Start the server
if (require.main === module) {
  const server = new OllamaMCPServer();
  server.run().catch(console.error);
}

module.exports = OllamaMCPServer;
