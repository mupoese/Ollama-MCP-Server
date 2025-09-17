"""
Base tool class for MCP DevOps Server

This module provides the abstract base class for all tools and defines
the common interface and functionality.
"""

import asyncio
import time
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
import structlog

from ..config import get_config
from ..utils.logging import audit_logger, performance_logger


class ToolSchema(BaseModel):
    """Schema definition for a tool"""

    name: str = Field(description="Tool name")
    description: str = Field(description="Tool description")
    inputSchema: Dict[str, Any] = Field(description="JSON schema for tool input")

    class Config:
        extra = "forbid"


class ToolResult(BaseModel):
    """Result of tool execution"""

    success: bool = Field(description="Whether the tool execution was successful")
    data: Optional[Any] = Field(default=None, description="Tool output data")
    error: Optional[str] = Field(default=None, description="Error message if failed")
    metadata: Optional[Dict[str, Any]] = Field(
        default=None, description="Additional metadata"
    )
    execution_time: Optional[float] = Field(
        default=None, description="Execution time in seconds"
    )

    class Config:
        extra = "forbid"


class ToolExecutionContext(BaseModel):
    """Context for tool execution"""

    user_id: Optional[str] = Field(
        default=None, description="User ID for audit logging"
    )
    session_id: Optional[str] = Field(default=None, description="Session ID")
    trace_id: Optional[str] = Field(
        default=None, description="Trace ID for distributed tracing"
    )
    timeout: Optional[int] = Field(
        default=None, description="Execution timeout in seconds"
    )

    class Config:
        extra = "forbid"


class BaseTool(ABC):
    """
    Abstract base class for all MCP DevOps tools

    This class provides common functionality like validation, error handling,
    logging, and execution timing for all tools.
    """

    def __init__(self):
        self.config = get_config()
        self.logger = structlog.get_logger(self.__class__.__name__)
        self._cache: Dict[str, Any] = {}

    @property
    @abstractmethod
    def name(self) -> str:
        """Tool name identifier"""

    @property
    @abstractmethod
    def description(self) -> str:
        """Tool description"""

    @property
    @abstractmethod
    def input_schema(self) -> Dict[str, Any]:
        """JSON schema for tool input validation"""

    @property
    def schema(self) -> ToolSchema:
        """Get the complete tool schema"""
        return ToolSchema(
            name=self.name,
            description=self.description,
            inputSchema=self.input_schema,
        )

    @abstractmethod
    async def _execute(self, arguments: Dict[str, Any]) -> Any:
        """
        Internal execution method - implement this in subclasses

        Args:
            arguments: Validated tool arguments

        Returns:
            Tool execution result

        Raises:
            Exception: Any exception during execution
        """

    def validate_arguments(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate tool arguments against the input schema

        Args:
            arguments: Raw tool arguments

        Returns:
            Validated arguments

        Raises:
            ValueError: If validation fails
        """
        # Basic validation - can be enhanced with jsonschema
        if not isinstance(arguments, dict):
            raise ValueError("Arguments must be a dictionary")

        return arguments

    def should_cache_result(self, arguments: Dict[str, Any]) -> bool:
        """
        Determine if the result should be cached

        Args:
            arguments: Tool arguments

        Returns:
            True if result should be cached
        """
        return self.config.tools.enable_caching

    def get_cache_key(self, arguments: Dict[str, Any]) -> str:
        """
        Generate cache key for the given arguments

        Args:
            arguments: Tool arguments

        Returns:
            Cache key string
        """
        import hashlib
        import json

        # Create deterministic hash of arguments
        args_str = json.dumps(arguments, sort_keys=True)
        return f"{self.name}:{hashlib.md5(args_str.encode()).hexdigest()}"

    def get_cached_result(self, cache_key: str) -> Optional[Any]:
        """
        Get cached result if available and valid

        Args:
            cache_key: Cache key

        Returns:
            Cached result or None
        """
        if not self.config.tools.enable_caching:
            return None

        cached_entry = self._cache.get(cache_key)
        if cached_entry is None:
            return None

        # Check if cache entry is still valid
        if time.time() - cached_entry["timestamp"] > self.config.tools.cache_ttl:
            del self._cache[cache_key]
            return None

        return cached_entry["result"]

    def cache_result(self, cache_key: str, result: Any) -> None:
        """
        Cache the execution result

        Args:
            cache_key: Cache key
            result: Result to cache
        """
        if not self.config.tools.enable_caching:
            return

        self._cache[cache_key] = {
            "result": result,
            "timestamp": time.time(),
        }

    async def execute(
        self,
        arguments: Dict[str, Any],
        context: Optional[ToolExecutionContext] = None,
    ) -> ToolResult:
        """
        Execute the tool with the given arguments

        Args:
            arguments: Tool arguments
            context: Execution context

        Returns:
            Tool execution result
        """
        start_time = time.time()
        context = context or ToolExecutionContext()

        try:
            # Log tool execution start
            self.logger.info(
                "Starting tool execution",
                tool_name=self.name,
                user_id=context.user_id,
                session_id=context.session_id,
                trace_id=context.trace_id,
            )

            # Validate arguments
            validated_args = self.validate_arguments(arguments)

            # Check cache if enabled
            cache_key = None
            if self.should_cache_result(validated_args):
                cache_key = self.get_cache_key(validated_args)
                cached_result = self.get_cached_result(cache_key)
                if cached_result is not None:
                    performance_logger.log_cache_metrics(cache_key, hit=True)
                    return ToolResult(
                        success=True,
                        data=cached_result,
                        execution_time=time.time() - start_time,
                        metadata={"cached": True},
                    )
                performance_logger.log_cache_metrics(cache_key, hit=False)

            # Execute tool with timeout
            timeout = context.timeout or self.config.tools.execution_timeout
            try:
                result = await asyncio.wait_for(
                    self._execute(validated_args),
                    timeout=timeout,
                )
            except asyncio.TimeoutError:
                raise TimeoutError(f"Tool execution timed out after {timeout} seconds")

            # Cache result if appropriate
            if cache_key is not None:
                self.cache_result(cache_key, result)

            execution_time = time.time() - start_time

            # Log successful execution
            audit_logger.log_tool_execution(
                tool_name=self.name,
                user_id=context.user_id,
                arguments=validated_args,
                success=True,
            )

            performance_logger.log_tool_performance(
                tool_name=self.name,
                execution_time=execution_time,
                success=True,
            )

            self.logger.info(
                "Tool execution completed successfully",
                tool_name=self.name,
                execution_time=execution_time,
            )

            return ToolResult(
                success=True,
                data=result,
                execution_time=execution_time,
            )

        except Exception as e:
            execution_time = time.time() - start_time
            error_message = str(e)

            # Log failed execution
            audit_logger.log_tool_execution(
                tool_name=self.name,
                user_id=context.user_id if context else None,
                arguments=arguments,
                success=False,
                error=error_message,
            )

            performance_logger.log_tool_performance(
                tool_name=self.name,
                execution_time=execution_time,
                success=False,
            )

            self.logger.error(
                "Tool execution failed",
                tool_name=self.name,
                error=error_message,
                execution_time=execution_time,
                exc_info=True,
            )

            return ToolResult(
                success=False,
                error=error_message,
                execution_time=execution_time,
            )

    def clear_cache(self) -> None:
        """Clear the tool's cache"""
        self._cache.clear()
        self.logger.debug("Tool cache cleared", tool_name=self.name)

    async def health_check(self) -> bool:
        """
        Perform a health check for the tool

        Returns:
            True if the tool is healthy
        """
        try:
            # Default implementation - can be overridden by subclasses
            return True
        except Exception as e:
            self.logger.error(
                "Tool health check failed",
                tool_name=self.name,
                error=str(e),
            )
            return False
