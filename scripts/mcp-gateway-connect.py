#!/usr/bin/env python3
"""
MCP Gateway Connection Helper

This script provides an easy way to connect to external MCP servers
through the MCP Gateway functionality.
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import Dict, List, Optional

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from mcp_devops_server.config import get_config
from mcp_devops_server.tools.registry import ToolRegistry
from mcp_devops_server.utils.logging import setup_logging, get_app_logger


class MCPGatewayManager:
    """Helper class for managing MCP Gateway connections"""
    
    def __init__(self):
        self.config = get_config()
        setup_logging(self.config)
        self.logger = get_app_logger(__name__)
        self.tool_registry = ToolRegistry()
    
    async def connect_server(
        self,
        server_name: str,
        transport_type: str,
        stdio_command: Optional[List[str]] = None,
        sse_url: Optional[str] = None,
        environment: Optional[Dict[str, str]] = None
    ) -> bool:
        """Connect to an external MCP server"""
        try:
            # Get the MCP Gateway connect tool
            tools = await self.tool_registry.get_tools()
            connect_tool = None
            
            for tool in tools:
                if tool.name == "mcp_gateway_connect":
                    connect_tool = tool
                    break
            
            if not connect_tool:
                self.logger.error("MCP Gateway connect tool not found")
                return False
            
            # Prepare arguments
            args = {
                "server_name": server_name,
                "transport_type": transport_type
            }
            
            if transport_type == "stdio" and stdio_command:
                args["stdio_command"] = stdio_command
                if environment:
                    args["environment"] = environment
            elif transport_type == "sse" and sse_url:
                args["sse_url"] = sse_url
            
            # Execute the connection
            result = await connect_tool.execute(args)
            
            if result.get("success"):
                self.logger.info(f"Successfully connected to server: {server_name}")
                return True
            else:
                self.logger.error(f"Failed to connect to server: {result.get('error', 'Unknown error')}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error connecting to server {server_name}: {e}")
            return False
    
    async def list_servers(self) -> Dict:
        """List all connected servers"""
        try:
            tools = await self.tool_registry.get_tools()
            list_tool = None
            
            for tool in tools:
                if tool.name == "mcp_gateway_list_servers":
                    list_tool = tool
                    break
            
            if not list_tool:
                return {"error": "MCP Gateway list servers tool not found"}
            
            result = await list_tool.execute({})
            return result
            
        except Exception as e:
            return {"error": f"Error listing servers: {e}"}
    
    async def list_tools(self, server_name: Optional[str] = None) -> Dict:
        """List tools from connected servers"""
        try:
            tools = await self.tool_registry.get_tools()
            list_tools_tool = None
            
            for tool in tools:
                if tool.name == "mcp_gateway_list_tools":
                    list_tools_tool = tool
                    break
            
            if not list_tools_tool:
                return {"error": "MCP Gateway list tools tool not found"}
            
            args = {}
            if server_name:
                args["server_name"] = server_name
            
            result = await list_tools_tool.execute(args)
            return result
            
        except Exception as e:
            return {"error": f"Error listing tools: {e}"}


async def main():
    """Main CLI interface"""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python scripts/mcp-gateway-connect.py connect <server_name> <transport_type> [options]")
        print("  python scripts/mcp-gateway-connect.py list-servers")
        print("  python scripts/mcp-gateway-connect.py list-tools [server_name]")
        print("")
        print("Examples:")
        print("  # Connect to Node.js MCP server via stdio")
        print("  python scripts/mcp-gateway-connect.py connect ollama_node stdio --command 'node,server.js'")
        print("")
        print("  # Connect to remote MCP server via SSE")
        print("  python scripts/mcp-gateway-connect.py connect remote_server sse --url 'https://example.com/mcp'")
        print("")
        print("  # List connected servers")
        print("  python scripts/mcp-gateway-connect.py list-servers")
        print("")
        print("  # List all tools")
        print("  python scripts/mcp-gateway-connect.py list-tools")
        return
    
    command = sys.argv[1]
    gateway = MCPGatewayManager()
    
    if command == "connect":
        if len(sys.argv) < 4:
            print("Error: connect requires server_name and transport_type")
            return
        
        server_name = sys.argv[2]
        transport_type = sys.argv[3]
        
        # Parse additional options
        stdio_command = None
        sse_url = None
        environment = {}
        
        i = 4
        while i < len(sys.argv):
            if sys.argv[i] == "--command" and i + 1 < len(sys.argv):
                stdio_command = sys.argv[i + 1].split(",")
                i += 2
            elif sys.argv[i] == "--url" and i + 1 < len(sys.argv):
                sse_url = sys.argv[i + 1]
                i += 2
            elif sys.argv[i] == "--env" and i + 1 < len(sys.argv):
                env_pairs = sys.argv[i + 1].split(",")
                for pair in env_pairs:
                    key, value = pair.split("=", 1)
                    environment[key] = value
                i += 2
            else:
                i += 1
        
        success = await gateway.connect_server(
            server_name=server_name,
            transport_type=transport_type,
            stdio_command=stdio_command,
            sse_url=sse_url,
            environment=environment
        )
        
        if success:
            print(f"✅ Successfully connected to {server_name}")
        else:
            print(f"❌ Failed to connect to {server_name}")
    
    elif command == "list-servers":
        result = await gateway.list_servers()
        print(json.dumps(result, indent=2))
    
    elif command == "list-tools":
        server_name = sys.argv[2] if len(sys.argv) > 2 else None
        result = await gateway.list_tools(server_name)
        print(json.dumps(result, indent=2))
    
    else:
        print(f"Unknown command: {command}")


if __name__ == "__main__":
    asyncio.run(main())