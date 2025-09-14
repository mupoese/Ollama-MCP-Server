"""
MCP Gateway Tools

This module provides tools for connecting to and managing external MCP servers,
making this server act as a gateway/proxy that can route requests to multiple
MCP servers and aggregate their tools and resources.
"""

import asyncio
import json
from typing import Any, Dict, List, Optional, Union
import structlog

from mcp.client.session_group import ClientSessionGroup
from mcp.client.stdio import StdioServerParameters, stdio_client
from mcp.client.sse import sse_client
from mcp import types

from .base_tool import BaseTool, ToolResult, ToolExecutionContext


logger = structlog.get_logger()


class MCPGatewayManager:
    """Shared state manager for MCP Gateway tools"""

    def __init__(self):
        self.session_group = ClientSessionGroup()
        self.connected_servers = {}

    def get_session_group(self):
        return self.session_group

    def get_connected_servers(self):
        return self.connected_servers


# Global gateway manager instance
_gateway_manager = MCPGatewayManager()


class MCPGatewayConnect(BaseTool):
    """Connect to an external MCP server"""

    name = "mcp_gateway_connect"
    description = "Connect to an external MCP server via stdio or SSE transport"

    input_schema = {
        "type": "object",
        "properties": {
            "server_name": {
                "type": "string",
                "description": "Unique name for the server connection",
            },
            "transport_type": {
                "type": "string",
                "enum": ["stdio", "sse"],
                "description": "Transport type for connecting to the server",
            },
            "stdio_command": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Command and arguments for stdio transport (e.g., ['node', 'server.js'])",
            },
            "sse_url": {
                "type": "string",
                "description": "URL for SSE transport connection",
            },
            "environment": {
                "type": "object",
                "description": "Environment variables to set for stdio transport",
            },
        },
        "required": ["server_name", "transport_type"],
        "allOf": [
            {
                "if": {"properties": {"transport_type": {"const": "stdio"}}},
                "then": {"required": ["stdio_command"]},
            },
            {
                "if": {"properties": {"transport_type": {"const": "sse"}}},
                "then": {"required": ["sse_url"]},
            },
        ],
    }

    def __init__(self):
        super().__init__()
        self.gateway_manager = _gateway_manager

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute MCP gateway connection"""
        server_name = arguments["server_name"]
        transport_type = arguments["transport_type"]

        # Check if server is already connected
        if server_name in self.gateway_manager.connected_servers:
            raise ValueError(f"Server '{server_name}' is already connected")

        logger.info(
            "Connecting to MCP server",
            server_name=server_name,
            transport=transport_type,
        )

        if transport_type == "stdio":
            command = arguments["stdio_command"]
            env = arguments.get("environment", {})

            server_params = StdioServerParameters(
                command=command[0],
                args=command[1:] if len(command) > 1 else [],
                env=env,
            )

            # Connect via stdio
            session = await self.gateway_manager.session_group.connect_to_server(
                stdio_client(server_params), name=server_name
            )

        elif transport_type == "sse":
            sse_url = arguments["sse_url"]

            # Connect via SSE
            session = await self.gateway_manager.session_group.connect_to_server(
                sse_client(sse_url), name=server_name
            )

        # Store connection info
        self.gateway_manager.connected_servers[server_name] = {
            "session": session,
            "transport_type": transport_type,
            "connection_info": arguments,
        }

        # Initialize connection and get server info
        await session.initialize()

        # List available tools from the connected server
        tools = await session.list_tools()

        logger.info(
            "Successfully connected to MCP server",
            server_name=server_name,
            tool_count=len(tools.tools) if tools else 0,
        )

        return {
            "server_name": server_name,
            "transport_type": transport_type,
            "status": "connected",
            "available_tools": len(tools.tools) if tools else 0,
            "tools": (
                [
                    {"name": tool.name, "description": tool.description}
                    for tool in tools.tools
                ]
                if tools
                else []
            ),
        }


class MCPGatewayDisconnect(BaseTool):
    """Disconnect from an external MCP server"""

    name = "mcp_gateway_disconnect"
    description = "Disconnect from an external MCP server"

    input_schema = {
        "type": "object",
        "properties": {
            "server_name": {
                "type": "string",
                "description": "Name of the server to disconnect from",
            }
        },
        "required": ["server_name"],
    }

    def __init__(self):
        super().__init__()
        self.gateway_manager = _gateway_manager

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute MCP gateway disconnection"""
        server_name = arguments["server_name"]

        if server_name not in self.gateway_manager.connected_servers:
            raise ValueError(f"Server '{server_name}' is not connected")

        logger.info("Disconnecting from MCP server", server_name=server_name)

        # Disconnect from server
        await self.gateway_manager.session_group.disconnect_from_server(server_name)

        # Remove from connected servers
        del self.gateway_manager.connected_servers[server_name]

        logger.info(
            "Successfully disconnected from MCP server", server_name=server_name
        )

        return {"server_name": server_name, "status": "disconnected"}


class MCPGatewayListServers(BaseTool):
    """List connected MCP servers"""

    name = "mcp_gateway_list_servers"
    description = "List all connected external MCP servers and their status"

    input_schema = {"type": "object", "properties": {}, "additionalProperties": False}

    def __init__(self):
        super().__init__()
        self.gateway_manager = _gateway_manager

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute MCP gateway server listing"""
        logger.info("Listing connected MCP servers")

        servers_info = []

        for server_name, server_data in self.gateway_manager.connected_servers.items():
            session = server_data["session"]

            try:
                # Get tools from each server
                tools_result = await session.list_tools()
                tools_count = len(tools_result.tools) if tools_result else 0

                # Get resources if available
                try:
                    resources_result = await session.list_resources()
                    resources_count = (
                        len(resources_result.resources) if resources_result else 0
                    )
                except:
                    resources_count = 0

                # Get prompts if available
                try:
                    prompts_result = await session.list_prompts()
                    prompts_count = len(prompts_result.prompts) if prompts_result else 0
                except:
                    prompts_count = 0

                servers_info.append(
                    {
                        "name": server_name,
                        "transport_type": server_data["transport_type"],
                        "status": "connected",
                        "tools_count": tools_count,
                        "resources_count": resources_count,
                        "prompts_count": prompts_count,
                    }
                )

            except Exception as e:
                servers_info.append(
                    {
                        "name": server_name,
                        "transport_type": server_data["transport_type"],
                        "status": "error",
                        "error": str(e),
                    }
                )

        logger.info("Listed connected MCP servers", server_count=len(servers_info))

        return {"connected_servers": servers_info, "total_servers": len(servers_info)}


class MCPGatewayListTools(BaseTool):
    """List tools from connected MCP servers"""

    name = "mcp_gateway_list_tools"
    description = "List all tools available from connected external MCP servers"

    input_schema = {
        "type": "object",
        "properties": {
            "server_name": {
                "type": "string",
                "description": "Optional: List tools from specific server only",
            }
        },
        "additionalProperties": False,
    }

    def __init__(self):
        super().__init__()
        self.gateway_manager = _gateway_manager

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute MCP gateway tools listing"""
        server_filter = arguments.get("server_name")

        logger.info("Listing tools from MCP servers", server_filter=server_filter)

        all_tools = {}

        servers_to_check = (
            {server_filter: self.gateway_manager.connected_servers[server_filter]}
            if server_filter and server_filter in self.gateway_manager.connected_servers
            else self.gateway_manager.connected_servers
        )

        for server_name, server_data in servers_to_check.items():
            session = server_data["session"]

            try:
                tools_result = await session.list_tools()

                server_tools = []
                if tools_result and tools_result.tools:
                    for tool in tools_result.tools:
                        server_tools.append(
                            {
                                "name": tool.name,
                                "description": tool.description,
                                "input_schema": (
                                    tool.inputSchema.model_dump()
                                    if tool.inputSchema
                                    else None
                                ),
                            }
                        )

                all_tools[server_name] = {
                    "status": "success",
                    "tools": server_tools,
                    "count": len(server_tools),
                }

            except Exception as e:
                all_tools[server_name] = {
                    "status": "error",
                    "error": str(e),
                    "count": 0,
                }

        total_tools = sum(
            server_data["count"]
            for server_data in all_tools.values()
            if server_data["status"] == "success"
        )

        logger.info("Listed tools from MCP servers", total_tools=total_tools)

        return {"servers": all_tools, "total_tools": total_tools}


class MCPGatewayCallTool(BaseTool):
    """Call a tool on a connected MCP server"""

    name = "mcp_gateway_call_tool"
    description = "Execute a tool on a connected external MCP server"

    input_schema = {
        "type": "object",
        "properties": {
            "server_name": {
                "type": "string",
                "description": "Name of the connected server to call the tool on",
            },
            "tool_name": {
                "type": "string",
                "description": "Name of the tool to execute",
            },
            "arguments": {
                "type": "object",
                "description": "Arguments to pass to the tool",
            },
        },
        "required": ["server_name", "tool_name"],
    }

    def __init__(self):
        super().__init__()
        self.gateway_manager = _gateway_manager

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute MCP gateway tool call"""
        server_name = arguments["server_name"]
        tool_name = arguments["tool_name"]
        tool_arguments = arguments.get("arguments", {})

        if server_name not in self.gateway_manager.connected_servers:
            raise ValueError(f"Server '{server_name}' is not connected")

        logger.info(
            "Calling tool on external MCP server",
            server_name=server_name,
            tool_name=tool_name,
        )

        session = self.gateway_manager.connected_servers[server_name]["session"]

        # Call the tool on the external server
        result = await session.call_tool(tool_name, tool_arguments)

        # Extract content from the result
        content_data = []
        if result and result.content:
            for content in result.content:
                if content.type == "text":
                    content_data.append({"type": "text", "text": content.text})
                # Add support for other content types as needed

        logger.info(
            "Successfully called tool on external MCP server",
            server_name=server_name,
            tool_name=tool_name,
            content_items=len(content_data),
        )

        return {
            "server_name": server_name,
            "tool_name": tool_name,
            "result": content_data,
        }


class MCPGatewayListResources(BaseTool):
    """List resources from connected MCP servers"""

    name = "mcp_gateway_list_resources"
    description = "List all resources available from connected external MCP servers"

    input_schema = {
        "type": "object",
        "properties": {
            "server_name": {
                "type": "string",
                "description": "Optional: List resources from specific server only",
            }
        },
        "additionalProperties": False,
    }

    def __init__(self):
        super().__init__()
        self.gateway_manager = _gateway_manager

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute MCP gateway resources listing"""
        server_filter = arguments.get("server_name")

        logger.info("Listing resources from MCP servers", server_filter=server_filter)

        all_resources = {}

        servers_to_check = (
            {server_filter: self.gateway_manager.connected_servers[server_filter]}
            if server_filter and server_filter in self.gateway_manager.connected_servers
            else self.gateway_manager.connected_servers
        )

        for server_name, server_data in servers_to_check.items():
            session = server_data["session"]

            try:
                resources_result = await session.list_resources()

                server_resources = []
                if resources_result and resources_result.resources:
                    for resource in resources_result.resources:
                        server_resources.append(
                            {
                                "uri": resource.uri,
                                "name": resource.name,
                                "description": resource.description,
                                "mimeType": resource.mimeType,
                            }
                        )

                all_resources[server_name] = {
                    "status": "success",
                    "resources": server_resources,
                    "count": len(server_resources),
                }

            except Exception as e:
                all_resources[server_name] = {
                    "status": "error",
                    "error": str(e),
                    "count": 0,
                }

        total_resources = sum(
            server_data["count"]
            for server_data in all_resources.values()
            if server_data["status"] == "success"
        )

        logger.info(
            "Listed resources from MCP servers", total_resources=total_resources
        )

        return {"servers": all_resources, "total_resources": total_resources}


def get_gateway_tools() -> List[type]:
    """Get all MCP gateway tool classes"""
    return [
        MCPGatewayConnect,
        MCPGatewayDisconnect,
        MCPGatewayListServers,
        MCPGatewayListTools,
        MCPGatewayCallTool,
        MCPGatewayListResources,
    ]
