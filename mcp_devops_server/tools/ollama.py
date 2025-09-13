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
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session for Ollama API calls"""
        if self.session is None or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=self.ollama_config.timeout)
            self.session = aiohttp.ClientSession(timeout=timeout)
        return self.session
    
    async def make_ollama_request(
        self,
        endpoint: str,
        method: str = "GET",
        data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Make a request to the Ollama API
        
        Args:
            endpoint: API endpoint (e.g., "/api/tags")
            method: HTTP method
            data: Request data for POST requests
            
        Returns:
            API response data
            
        Raises:
            Exception: If request fails
        """
        session = await self.get_session()
        url = f"{self.ollama_config.api_url.rstrip('/')}{endpoint}"
        
        for attempt in range(self.ollama_config.max_retries + 1):
            try:
                async with session.request(method, url, json=data) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        error_text = await response.text()
                        raise Exception(
                            f"Ollama API error {response.status}: {error_text}"
                        )
            except asyncio.TimeoutError:
                if attempt == self.ollama_config.max_retries:
                    raise Exception("Ollama API request timed out")
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
            except Exception as e:
                if attempt == self.ollama_config.max_retries:
                    raise
                await asyncio.sleep(2 ** attempt)
    
    async def health_check(self) -> bool:
        """Check if Ollama service is available"""
        try:
            await self.make_ollama_request("/api/version")
            return True
        except Exception:
            return False
    
    async def cleanup(self):
        """Clean up HTTP session"""
        if self.session and not self.session.closed:
            await self.session.close()


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
            formatted_models.append({
                "name": model.get("name", ""),
                "size": model.get("size", 0),
                "digest": model.get("digest", ""),
                "modified_at": model.get("modified_at", ""),
                "details": model.get("details", {}),
            })
        
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
        stream = arguments.get("stream", False)
        options = arguments.get("options", {})
        
        self.logger.info(
            "Starting Ollama chat",
            model=model,
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
        )
        
        return {
            "message": response.get("message", {}),
            "model": response.get("model", model),
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