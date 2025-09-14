"""
MCP DevOps Server implementation

This module provides the main MCP server class that handles protocol
communication, tool registration, and request routing.
"""

import asyncio
import signal
import sys
from typing import Any, Dict, List, Optional
import structlog

from mcp import types
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.server.session import ServerSession

from ..config import get_config, DevOpsConfig
from ..tools.registry import get_tool_registry, auto_discover_tools
from ..tools.base_tool import ToolExecutionContext
from ..utils.logging import setup_logging, get_app_logger, audit_logger


class MCPDevOpsServer:
    """
    Main MCP DevOps Server class

    Handles MCP protocol communication, tool management, and request routing.
    """

    def __init__(self, config: Optional[DevOpsConfig] = None):
        """
        Initialize the MCP DevOps Server

        Args:
            config: Optional configuration override
        """
        self.config = config or get_config()
        self.logger = get_app_logger()
        self.tool_registry = get_tool_registry()
        self.server: Optional[Server] = None
        self.running = False

        # Setup logging
        setup_logging()

        self.logger.info(
            "Initializing MCP DevOps Server",
            version=self.config.server_version,
            environment=self.config.environment,
            transport=self.config.transport_type,
        )

    async def initialize(self) -> None:
        """Initialize the server and discover tools"""
        self.logger.info("Starting server initialization")

        # Auto-discover and register tools
        auto_discover_tools()

        # Log tool statistics
        stats = self.tool_registry.get_tool_statistics()
        self.logger.info(
            "Tool discovery completed",
            total_tools=stats["total_tools"],
            categories=stats["categories"],
        )

        # Perform initial health check
        if self.config.environment != "development":
            health_results = await self.tool_registry.health_check_all()
            unhealthy_tools = [
                tool for tool, healthy in health_results.items() if not healthy
            ]
            if unhealthy_tools:
                self.logger.warning(
                    "Some tools failed health check",
                    unhealthy_tools=unhealthy_tools,
                )

        self.logger.info("Server initialization completed")

    def create_server(self) -> Server:
        """Create and configure the MCP server"""
        server = Server(self.config.server_name)

        @server.list_tools()
        async def list_tools() -> List[types.Tool]:
            """Handle list tools requests"""
            self.logger.debug("Handling list_tools request")

            tool_schemas = self.tool_registry.list_tools()

            mcp_tools = []
            for schema in tool_schemas:
                mcp_tool = types.Tool(
                    name=schema.name,
                    description=schema.description,
                    inputSchema=schema.inputSchema,
                )
                mcp_tools.append(mcp_tool)

            self.logger.debug(
                "Returning tool list",
                tool_count=len(mcp_tools),
            )

            return mcp_tools

        @server.call_tool()
        async def call_tool(
            name: str,
            arguments: Optional[Dict[str, Any]] = None,
        ) -> List[types.TextContent]:
            """Handle tool execution requests"""
            self.logger.info(
                "Handling call_tool request",
                tool_name=name,
                has_arguments=arguments is not None,
            )

            # Validate tool exists
            try:
                self.tool_registry.validate_tool_exists(name)
            except ValueError as e:
                error_msg = str(e)
                self.logger.error("Tool not found", tool_name=name, error=error_msg)
                return [types.TextContent(type="text", text=f"Error: {error_msg}")]

            # Create execution context
            context = ToolExecutionContext()

            # Execute the tool
            try:
                result = await self.tool_registry.execute_tool(
                    tool_name=name,
                    arguments=arguments or {},
                    context=context,
                )

                if result.success:
                    # Format successful result
                    response_text = self._format_tool_result(result)
                    self.logger.info(
                        "Tool execution successful",
                        tool_name=name,
                        execution_time=result.execution_time,
                    )
                else:
                    # Format error result
                    response_text = f"Tool execution failed: {result.error}"
                    self.logger.error(
                        "Tool execution failed",
                        tool_name=name,
                        error=result.error,
                        execution_time=result.execution_time,
                    )

                return [types.TextContent(type="text", text=response_text)]

            except Exception as e:
                error_msg = f"Tool execution exception: {str(e)}"
                self.logger.error(
                    "Tool execution exception",
                    tool_name=name,
                    error=str(e),
                    exc_info=True,
                )
                return [types.TextContent(type="text", text=error_msg)]

        return server

    def _format_tool_result(self, result) -> str:
        """Format tool result for response"""
        import json

        if result.data is None:
            return "Tool executed successfully (no data returned)"

        # Try to format as JSON if it's a dict/list
        if isinstance(result.data, (dict, list)):
            try:
                return json.dumps(result.data, indent=2, ensure_ascii=False)
            except (TypeError, ValueError):
                return str(result.data)

        return str(result.data)

    async def run_stdio(self) -> None:
        """Run the server with stdio transport"""
        self.logger.info("Starting MCP server with stdio transport")

        server = self.create_server()

        # Set up signal handlers for graceful shutdown
        def signal_handler(signum, frame):
            self.logger.info(f"Received signal {signum}, shutting down...")
            self.running = False

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

        try:
            self.running = True

            # Run the stdio server
            async with stdio_server() as (read_stream, write_stream):
                await server.run(
                    read_stream,
                    write_stream,
                    self.config.server_name,
                )

        except Exception as e:
            self.logger.error("Server error", error=str(e), exc_info=True)
            raise
        finally:
            await self.shutdown()

    async def run_http(self) -> None:
        """Run the server with HTTP transport"""
        # Note: HTTP transport implementation would go here
        # For now, we focus on stdio transport as it's more common for MCP
        raise NotImplementedError("HTTP transport not yet implemented")

    async def run(self) -> None:
        """Run the server with the configured transport"""
        await self.initialize()

        if self.config.transport_type == "stdio":
            await self.run_stdio()
        elif self.config.transport_type == "http":
            await self.run_http()
        else:
            raise ValueError(
                f"Unsupported transport type: {self.config.transport_type}"
            )

    async def shutdown(self) -> None:
        """Shutdown the server gracefully"""
        self.logger.info("Shutting down MCP DevOps Server")

        self.running = False

        # Close any open connections in tools
        for tool_name in self.tool_registry.list_tools():
            tool = self.tool_registry.get_tool(tool_name.name)
            if tool and hasattr(tool, "cleanup"):
                try:
                    await tool.cleanup()
                except Exception as e:
                    self.logger.error(
                        "Error during tool cleanup",
                        tool_name=tool_name.name,
                        error=str(e),
                    )

        # Clear tool caches
        self.tool_registry.clear_all_caches()

        self.logger.info("Server shutdown completed")

    async def health_check(self) -> Dict[str, Any]:
        """
        Perform a comprehensive health check

        Returns:
            Health check results
        """
        self.logger.info("Performing server health check")

        # Check tool health
        tool_health = await self.tool_registry.health_check_all()

        # Calculate overall health
        healthy_tools = sum(1 for healthy in tool_health.values() if healthy)
        total_tools = len(tool_health)
        overall_health = healthy_tools == total_tools

        health_data = {
            "status": "healthy" if overall_health else "degraded",
            "server": {
                "name": self.config.server_name,
                "version": self.config.server_version,
                "environment": self.config.environment,
                "running": self.running,
            },
            "tools": {
                "total": total_tools,
                "healthy": healthy_tools,
                "unhealthy": total_tools - healthy_tools,
                "details": tool_health,
            },
        }

        self.logger.info(
            "Health check completed",
            overall_health=overall_health,
            healthy_tools=healthy_tools,
            total_tools=total_tools,
        )

        return health_data


async def main() -> None:
    """Main entry point for the MCP DevOps Server"""
    try:
        server = MCPDevOpsServer()
        await server.run()
    except KeyboardInterrupt:
        print("\nReceived interrupt signal, shutting down...")
    except Exception as e:
        logger = get_app_logger()
        logger.error("Server startup failed", error=str(e), exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
