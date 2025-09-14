"""
Ollama integration tools for MCP DevOps Server

This module provides tools for interacting with Ollama AI models,
maintaining compatibility with the original Node.js implementation.
"""

import aiohttp
import asyncio
from typing import Any, Dict, List, Optional
import structlog

from .base_tool import BaseTool
from ..config import get_config


class OllamaBaseTool(BaseTool):
    """Base class for Ollama tools with common functionality"""

    def __init__(self):
        super().__init__()
        self.ollama_config = self.config.ollama
        self.sessions: Dict[str, Optional[aiohttp.ClientSession]] = {}

    async def get_session(self, agent_name: str = "primary") -> aiohttp.ClientSession:
        """Get or create HTTP session for specific Ollama agent"""
        if (
            agent_name not in self.sessions
            or self.sessions[agent_name] is None
            or self.sessions[agent_name].closed
        ):
            agent_config = self.ollama_config.agents.get(agent_name)
            if not agent_config:
                # Fallback to primary if agent not found
                agent_config = self.ollama_config.agents.get("primary")
                if not agent_config:
                    raise Exception(
                        f"No Ollama agent configuration found for '{agent_name}' or primary"
                    )

            timeout = aiohttp.ClientTimeout(total=agent_config.timeout)
            headers = {}
            if agent_config.api_key:
                headers["Authorization"] = f"Bearer {agent_config.api_key}"

            self.sessions[agent_name] = aiohttp.ClientSession(
                timeout=timeout, headers=headers
            )
        return self.sessions[agent_name]

    async def make_ollama_request(
        self,
        endpoint: str,
        method: str = "GET",
        data: Optional[Dict[str, Any]] = None,
        agent_name: str = "primary",
    ) -> Dict[str, Any]:
        """
        Make a request to the Ollama API using specified agent

        Args:
            endpoint: API endpoint (e.g., "/api/tags")
            method: HTTP method
            data: Request data for POST requests
            agent_name: Name of the agent/endpoint to use

        Returns:
            API response data

        Raises:
            Exception: If request fails
        """
        agent_config = self.ollama_config.agents.get(agent_name)
        if not agent_config:
            # Fallback to primary
            agent_config = self.ollama_config.agents.get("primary")
            if not agent_config:
                raise Exception(
                    f"No Ollama agent configuration found for '{agent_name}' or primary"
                )

        session = await self.get_session(agent_name)
        url = f"{agent_config.api_url.rstrip('/')}{endpoint}"

        for attempt in range(agent_config.max_retries + 1):
            try:
                async with session.request(method, url, json=data) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        error_text = await response.text()
                        raise Exception(
                            f"Ollama API error {response.status} for agent '{agent_name}': {error_text}"
                        )
            except asyncio.TimeoutError:
                if attempt == agent_config.max_retries:
                    raise Exception(
                        f"Ollama API request timed out for agent '{agent_name}'"
                    )
                await asyncio.sleep(2**attempt)  # Exponential backoff
            except Exception as e:
                if attempt == agent_config.max_retries:
                    raise
                await asyncio.sleep(2**attempt)

    async def health_check(self, agent_name: str = "primary") -> bool:
        """Check if Ollama service is available for specific agent"""
        try:
            await self.make_ollama_request("/api/version", agent_name=agent_name)
            return True
        except Exception:
            return False

    async def cleanup(self):
        """Clean up all HTTP sessions"""
        for session in self.sessions.values():
            if session and not session.closed:
                await session.close()
        self.sessions.clear()


class OllamaListModels(OllamaBaseTool):
    """List all available Ollama models"""

    @property
    def name(self) -> str:
        return "ollama_list_models"

    @property
    def description(self) -> str:
        return "List all available Ollama models on the server"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {},
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the list models command"""
        self.logger.info("Listing available Ollama models")

        response = await self.make_ollama_request("/api/tags")

        models = response.get("models", [])

        # Format the response
        formatted_models = []
        for model in models:
            formatted_models.append(
                {
                    "name": model.get("name", ""),
                    "size": model.get("size", 0),
                    "digest": model.get("digest", ""),
                    "modified_at": model.get("modified_at", ""),
                    "details": model.get("details", {}),
                }
            )

        return {
            "models": formatted_models,
            "count": len(formatted_models),
        }


class OllamaChat(OllamaBaseTool):
    """Chat with an Ollama model using the chat API"""

    @property
    def name(self) -> str:
        return "ollama_chat"

    @property
    def description(self) -> str:
        return "Chat with an Ollama model using the chat API"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "model": {
                    "type": "string",
                    "description": "The model name to use for chat (e.g., 'llama2', 'codellama')",
                    "minLength": 1,
                },
                "messages": {
                    "type": "array",
                    "description": "Array of message objects with role and content",
                    "minItems": 1,
                    "items": {
                        "type": "object",
                        "properties": {
                            "role": {
                                "type": "string",
                                "enum": ["system", "user", "assistant"],
                                "description": "The role of the message sender",
                            },
                            "content": {
                                "type": "string",
                                "description": "The content of the message",
                                "minLength": 1,
                            },
                        },
                        "required": ["role", "content"],
                        "additionalProperties": False,
                    },
                },
                "agent": {
                    "type": "string",
                    "description": "Agent/endpoint to use (primary, secondary, tertiary, etc.)",
                    "default": "primary",
                },
                "stream": {
                    "type": "boolean",
                    "description": "Whether to stream the response",
                    "default": False,
                },
                "options": {
                    "type": "object",
                    "description": "Additional options for the model",
                    "properties": {
                        "temperature": {
                            "type": "number",
                            "minimum": 0,
                            "maximum": 2,
                            "description": "Controls randomness in responses",
                        },
                        "top_p": {
                            "type": "number",
                            "minimum": 0,
                            "maximum": 1,
                            "description": "Controls diversity of responses",
                        },
                        "max_tokens": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Maximum number of tokens to generate",
                        },
                    },
                    "additionalProperties": True,
                },
            },
            "required": ["model", "messages"],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the chat command"""
        model = arguments["model"]
        messages = arguments["messages"]
        agent = arguments.get("agent", "primary")
        stream = arguments.get("stream", False)
        options = arguments.get("options", {})

        self.logger.info(
            "Starting Ollama chat",
            model=model,
            agent=agent,
            message_count=len(messages),
            stream=stream,
        )

        request_data = {
            "model": model,
            "messages": messages,
            "stream": stream,
            "options": options,
        }

        response = await self.make_ollama_request(
            "/api/chat",
            method="POST",
            data=request_data,
            agent_name=agent,
        )

        return {
            "message": response.get("message", {}),
            "model": response.get("model", model),
            "agent": agent,
            "created_at": response.get("created_at", ""),
            "done": response.get("done", True),
            "total_duration": response.get("total_duration", 0),
            "load_duration": response.get("load_duration", 0),
            "prompt_eval_count": response.get("prompt_eval_count", 0),
            "prompt_eval_duration": response.get("prompt_eval_duration", 0),
            "eval_count": response.get("eval_count", 0),
            "eval_duration": response.get("eval_duration", 0),
        }


class OllamaGenerate(OllamaBaseTool):
    """Generate text using an Ollama model"""

    @property
    def name(self) -> str:
        return "ollama_generate"

    @property
    def description(self) -> str:
        return "Generate text using an Ollama model with a single prompt"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "model": {
                    "type": "string",
                    "description": "The model name to use for generation",
                    "minLength": 1,
                },
                "prompt": {
                    "type": "string",
                    "description": "The prompt to generate from",
                    "minLength": 1,
                },
                "stream": {
                    "type": "boolean",
                    "description": "Whether to stream the response",
                    "default": False,
                },
                "options": {
                    "type": "object",
                    "description": "Additional options for the model",
                    "properties": {
                        "temperature": {
                            "type": "number",
                            "minimum": 0,
                            "maximum": 2,
                            "description": "Controls randomness in responses",
                        },
                        "top_p": {
                            "type": "number",
                            "minimum": 0,
                            "maximum": 1,
                            "description": "Controls diversity of responses",
                        },
                        "max_tokens": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Maximum number of tokens to generate",
                        },
                    },
                    "additionalProperties": True,
                },
            },
            "required": ["model", "prompt"],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the generate command"""
        model = arguments["model"]
        prompt = arguments["prompt"]
        stream = arguments.get("stream", False)
        options = arguments.get("options", {})

        self.logger.info(
            "Starting Ollama generation",
            model=model,
            prompt_length=len(prompt),
            stream=stream,
        )

        request_data = {
            "model": model,
            "prompt": prompt,
            "stream": stream,
            "options": options,
        }

        response = await self.make_ollama_request(
            "/api/generate",
            method="POST",
            data=request_data,
        )

        return {
            "response": response.get("response", ""),
            "model": response.get("model", model),
            "created_at": response.get("created_at", ""),
            "done": response.get("done", True),
            "context": response.get("context", []),
            "total_duration": response.get("total_duration", 0),
            "load_duration": response.get("load_duration", 0),
            "prompt_eval_count": response.get("prompt_eval_count", 0),
            "prompt_eval_duration": response.get("prompt_eval_duration", 0),
            "eval_count": response.get("eval_count", 0),
            "eval_duration": response.get("eval_duration", 0),
        }


class OllamaPullModel(OllamaBaseTool):
    """Pull/download an Ollama model"""

    @property
    def name(self) -> str:
        return "ollama_pull_model"

    @property
    def description(self) -> str:
        return "Pull/download an Ollama model to the local server"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "The name of the model to pull (e.g., 'llama2', 'codellama:7b')",
                    "minLength": 1,
                },
                "stream": {
                    "type": "boolean",
                    "description": "Whether to stream the download progress",
                    "default": False,
                },
            },
            "required": ["name"],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the pull model command"""
        model_name = arguments["name"]
        stream = arguments.get("stream", False)

        self.logger.info(
            "Starting Ollama model pull",
            model_name=model_name,
            stream=stream,
        )

        request_data = {
            "name": model_name,
            "stream": stream,
        }

        response = await self.make_ollama_request(
            "/api/pull",
            method="POST",
            data=request_data,
        )

        return {
            "status": response.get("status", ""),
            "digest": response.get("digest", ""),
            "total": response.get("total", 0),
            "completed": response.get("completed", 0),
        }


class OllamaManageAgents(OllamaBaseTool):
    """Manage Ollama agents and endpoints for agentic responses"""

    @property
    def name(self) -> str:
        return "ollama_manage_agents"

    @property
    def description(self) -> str:
        return "Manage Ollama agents, endpoints, and API keys for multi-agent agentic responses"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["list", "add", "remove", "test", "configure"],
                    "description": "Action to perform on agents",
                },
                "agent_name": {
                    "type": "string",
                    "description": "Name of the agent (e.g., 'secondary', 'analyst', 'reviewer')",
                },
                "api_url": {
                    "type": "string",
                    "description": "Ollama API endpoint URL for the agent",
                },
                "api_key": {
                    "type": "string",
                    "description": "API key for the endpoint (optional)",
                },
                "model": {
                    "type": "string",
                    "description": "Default model for this agent",
                },
                "role": {
                    "type": "string",
                    "description": "Role/purpose of this agent",
                },
            },
            "required": ["action"],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent management command"""
        action = arguments["action"]

        if action == "list":
            return await self._list_agents()
        elif action == "add":
            return await self._add_agent(arguments)
        elif action == "remove":
            return await self._remove_agent(arguments)
        elif action == "test":
            return await self._test_agent(arguments)
        elif action == "configure":
            return await self._configure_agent(arguments)
        else:
            raise ValueError(f"Unknown action: {action}")

    async def _list_agents(self) -> Dict[str, Any]:
        """List all configured agents"""
        agents = []
        for name, agent_config in self.ollama_config.agents.items():
            # Test health of each agent
            try:
                health_status = await self.health_check(name)
            except Exception:
                health_status = False

            agents.append(
                {
                    "name": name,
                    "api_url": agent_config.api_url,
                    "model": agent_config.model,
                    "role": agent_config.role,
                    "timeout": agent_config.timeout,
                    "max_retries": agent_config.max_retries,
                    "has_api_key": bool(agent_config.api_key),
                    "healthy": health_status,
                }
            )

        return {
            "agents": agents,
            "total_agents": len(agents),
            "available_roles": [
                "primary",
                "secondary",
                "tertiary",
                "quaternary",
                "quinary",
                "senary",
                "septenary",
                "octonary",
                "analyst",
                "reviewer",
                "validator",
                "executor",
                "monitor",
                "coordinator",
                "specialist",
                "assistant",
            ],
        }

    async def _add_agent(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Add or update an agent configuration"""
        agent_name = arguments.get("agent_name")
        if not agent_name:
            raise ValueError("agent_name is required for add action")

        api_url = arguments.get("api_url")
        if not api_url:
            raise ValueError("api_url is required for add action")

        # This would typically update persistent configuration
        # For now, we'll just validate the configuration
        from ..config.settings import OllamaAgentConfig

        try:
            agent_config = OllamaAgentConfig(
                api_url=api_url,
                api_key=arguments.get("api_key"),
                model=arguments.get("model", "llama2"),
                role=arguments.get("role", "assistant"),
                timeout=self.ollama_config.timeout,
                max_retries=self.ollama_config.max_retries,
            )

            # Test the configuration
            test_result = await self._test_agent_config(agent_config)

            return {
                "status": "success",
                "message": f"Agent '{agent_name}' configuration validated",
                "agent_config": {
                    "api_url": agent_config.api_url,
                    "model": agent_config.model,
                    "role": agent_config.role,
                    "has_api_key": bool(agent_config.api_key),
                },
                "test_result": test_result,
                "note": "To persist this configuration, set environment variables or update config file",
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to configure agent '{agent_name}': {str(e)}",
            }

    async def _remove_agent(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Remove an agent configuration"""
        agent_name = arguments.get("agent_name")
        if not agent_name:
            raise ValueError("agent_name is required for remove action")

        if agent_name == "primary":
            return {
                "status": "error",
                "message": "Cannot remove primary agent",
            }

        if agent_name in self.ollama_config.agents:
            return {
                "status": "info",
                "message": f"Agent '{agent_name}' found in configuration",
                "note": "To remove this agent, unset the corresponding environment variables or update config file",
                "env_vars_to_unset": [
                    f"OLLAMA_AGENT_{agent_name.upper()}_URL",
                    f"OLLAMA_AGENT_{agent_name.upper()}_KEY",
                    f"OLLAMA_AGENT_{agent_name.upper()}_MODEL",
                    f"OLLAMA_AGENT_{agent_name.upper()}_ROLE",
                ],
            }
        else:
            return {
                "status": "info",
                "message": f"Agent '{agent_name}' not found in current configuration",
            }

    async def _test_agent(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Test an agent's connectivity"""
        agent_name = arguments.get("agent_name", "primary")

        try:
            health_status = await self.health_check(agent_name)
            if health_status:
                # Try to get version info
                response = await self.make_ollama_request(
                    "/api/version", agent_name=agent_name
                )
                return {
                    "status": "success",
                    "agent": agent_name,
                    "healthy": True,
                    "version_info": response,
                }
            else:
                return {
                    "status": "error",
                    "agent": agent_name,
                    "healthy": False,
                    "message": "Agent health check failed",
                }
        except Exception as e:
            return {
                "status": "error",
                "agent": agent_name,
                "healthy": False,
                "message": f"Test failed: {str(e)}",
            }

    async def _configure_agent(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Get configuration instructions for setting up agents"""
        return {
            "configuration_guide": {
                "environment_variables": {
                    "description": "Set these environment variables to configure additional agents",
                    "examples": {
                        "secondary_agent": {
                            "OLLAMA_AGENT_2_URL": "http://second-ollama:11434",
                            "OLLAMA_AGENT_2_KEY": "optional-api-key",
                            "OLLAMA_AGENT_2_MODEL": "llama2",
                            "OLLAMA_AGENT_2_ROLE": "secondary",
                        },
                        "specialist_agent": {
                            "OLLAMA_AGENT_3_URL": "http://specialist-ollama:11434",
                            "OLLAMA_AGENT_3_MODEL": "codellama",
                            "OLLAMA_AGENT_3_ROLE": "analyst",
                        },
                    },
                },
                "docker_compose": {
                    "description": "Example docker-compose.yml snippet for multi-agent setup",
                    "example": """
services:
  mcp-ollama-server:
    image: mcp-ollama-server:latest
    environment:
      - OLLAMA_API_URL=http://primary-ollama:11434
      - OLLAMA_AGENT_2_URL=http://secondary-ollama:11434
      - OLLAMA_AGENT_2_ROLE=secondary
      - OLLAMA_AGENT_3_URL=http://specialist-ollama:11434
      - OLLAMA_AGENT_3_ROLE=analyst
                    """,
                },
                "supported_roles": [
                    "primary",
                    "secondary",
                    "tertiary",
                    "quaternary",
                    "quinary",
                    "senary",
                    "septenary",
                    "octonary",
                    "analyst",
                    "reviewer",
                    "validator",
                    "executor",
                    "monitor",
                    "coordinator",
                    "specialist",
                    "assistant",
                ],
            }
        }

    async def _test_agent_config(self, agent_config) -> Dict[str, Any]:
        """Test a specific agent configuration"""
        try:
            timeout = aiohttp.ClientTimeout(total=agent_config.timeout)
            headers = {}
            if agent_config.api_key:
                headers["Authorization"] = f"Bearer {agent_config.api_key}"

            async with aiohttp.ClientSession(
                timeout=timeout, headers=headers
            ) as session:
                url = f"{agent_config.api_url.rstrip('/')}/api/version"
                async with session.get(url) as response:
                    if response.status == 200:
                        version_data = await response.json()
                        return {
                            "healthy": True,
                            "version": version_data.get("version", "unknown"),
                        }
                    else:
                        return {
                            "healthy": False,
                            "error": f"HTTP {response.status}",
                        }
        except Exception as e:
            return {
                "healthy": False,
                "error": str(e),
            }
