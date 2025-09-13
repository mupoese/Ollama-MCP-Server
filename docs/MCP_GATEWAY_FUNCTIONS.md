# MCP Gateway Functions

The MCP Ollama Server now includes comprehensive **MCP Gateway functionality** that allows the server to act as a gateway/proxy by connecting to and managing multiple external MCP servers. This enables powerful multi-server orchestration and tool aggregation capabilities.

## Overview

The MCP Gateway functionality turns your server into a centralized hub that can:

- **Connect to multiple external MCP servers** via stdio or SSE transport
- **Aggregate tools and resources** from all connected servers
- **Route tool calls** to specific external servers
- **Manage server connections** with health monitoring
- **Provide unified access** to distributed MCP ecosystem

## Available Tools

### 🔗 Connection Management

#### `mcp_gateway_connect`
Connect to an external MCP server via stdio or SSE transport.

**Parameters:**
- `server_name` (string, required): Unique name for the server connection
- `transport_type` (string, required): Either "stdio" or "sse"
- `stdio_command` (array): Command and arguments for stdio transport (e.g., `["node", "server.js"]`)
- `sse_url` (string): URL for SSE transport connection
- `environment` (object): Environment variables for stdio transport

**Example - Connect to Node.js MCP Server:**
```json
{
  "server_name": "ollama_node_server",
  "transport_type": "stdio", 
  "stdio_command": ["node", "/path/to/ollama-mcp-server.js"],
  "environment": {
    "OLLAMA_API": "http://localhost:11434"
  }
}
```

**Example - Connect to SSE MCP Server:**
```json
{
  "server_name": "remote_mcp_server",
  "transport_type": "sse",
  "sse_url": "https://example.com/mcp"
}
```

#### `mcp_gateway_disconnect`
Disconnect from an external MCP server.

**Parameters:**
- `server_name` (string, required): Name of the server to disconnect from

**Example:**
```json
{
  "server_name": "ollama_node_server"
}
```

### 📊 Server Management

#### `mcp_gateway_list_servers`
List all connected external MCP servers and their status.

**Parameters:** None

**Returns:**
```json
{
  "connected_servers": [
    {
      "name": "ollama_node_server",
      "transport_type": "stdio",
      "status": "connected",
      "tools_count": 15,
      "resources_count": 3,
      "prompts_count": 2
    }
  ],
  "total_servers": 1
}
```

#### `mcp_gateway_list_tools`
List all tools available from connected external MCP servers.

**Parameters:**
- `server_name` (string, optional): List tools from specific server only

**Example - List all tools:**
```json
{}
```

**Example - List tools from specific server:**
```json
{
  "server_name": "ollama_node_server"
}
```

#### `mcp_gateway_list_resources`
List all resources available from connected external MCP servers.

**Parameters:**
- `server_name` (string, optional): List resources from specific server only

### 🛠️ Tool Execution

#### `mcp_gateway_call_tool`
Execute a tool on a connected external MCP server.

**Parameters:**
- `server_name` (string, required): Name of the connected server
- `tool_name` (string, required): Name of the tool to execute
- `arguments` (object, optional): Arguments to pass to the tool

**Example:**
```json
{
  "server_name": "ollama_node_server",
  "tool_name": "ollama_chat",
  "arguments": {
    "model": "llama2",
    "messages": [
      {"role": "user", "content": "Hello from gateway!"}
    ]
  }
}
```

## Usage Scenarios

### 🌐 Multi-Server Orchestration

**Scenario:** Connect to multiple specialized MCP servers and orchestrate operations across them.

```python
# 1. Connect to specialized servers
await mcp_gateway_connect({
    "server_name": "ollama_server",
    "transport_type": "stdio",
    "stdio_command": ["node", "ollama-mcp-server.js"]
})

await mcp_gateway_connect({
    "server_name": "file_server", 
    "transport_type": "stdio",
    "stdio_command": ["python", "file-mcp-server.py"]
})

# 2. List all available tools
tools_result = await mcp_gateway_list_tools({})

# 3. Execute tools on different servers
chat_result = await mcp_gateway_call_tool({
    "server_name": "ollama_server",
    "tool_name": "ollama_chat",
    "arguments": {"model": "llama2", "messages": [...]}
})

file_result = await mcp_gateway_call_tool({
    "server_name": "file_server", 
    "tool_name": "read_file",
    "arguments": {"path": "/path/to/file.txt"}
})
```

### 🔄 Load Balancing & Failover

**Scenario:** Connect to multiple instances of the same server type for load balancing.

```python
# Connect to multiple Ollama servers
for i in range(3):
    await mcp_gateway_connect({
        "server_name": f"ollama_server_{i}",
        "transport_type": "stdio",
        "stdio_command": ["node", "ollama-mcp-server.js"],
        "environment": {
            "OLLAMA_API": f"http://ollama-{i}:11434"
        }
    })

# Route requests to different servers based on load
await mcp_gateway_call_tool({
    "server_name": "ollama_server_0",  # Route to least loaded server
    "tool_name": "ollama_chat",
    "arguments": {...}
})
```

### 🏢 Enterprise Integration

**Scenario:** Create a centralized MCP hub for enterprise tooling.

```python
# Connect to various enterprise systems
servers = [
    {
        "name": "jira_server",
        "transport": "sse", 
        "url": "https://company.atlassian.net/mcp"
    },
    {
        "name": "github_server",
        "transport": "stdio",
        "command": ["python", "github-mcp-server.py"]
    },
    {
        "name": "monitoring_server", 
        "transport": "stdio",
        "command": ["node", "monitoring-mcp-server.js"]
    }
]

# Connect to all enterprise servers
for server in servers:
    await mcp_gateway_connect(server)

# Unified access to all enterprise tools
await mcp_gateway_call_tool({
    "server_name": "jira_server",
    "tool_name": "create_ticket", 
    "arguments": {"title": "Bug Report", "description": "..."}
})
```

## Configuration

### Environment Variables

The gateway functionality uses the same configuration as the main server:

```bash
# Basic MCP server configuration
MCP_DEVOPS_SERVER_NAME="MCP Ollama Gateway"
MCP_DEVOPS_ENVIRONMENT=production
MCP_DEVOPS_TRANSPORT_TYPE=stdio

# Logging configuration for gateway operations
MCP_DEVOPS_LOGGING__LEVEL=INFO
MCP_DEVOPS_LOGGING__AUDIT=true
```

### Security Considerations

- **Trusted Servers Only**: Only connect to trusted MCP servers
- **Network Security**: Use appropriate network controls for SSE connections
- **Authentication**: Ensure connected servers have proper authentication
- **Resource Limits**: Monitor resource usage of connected servers

## Advanced Features

### 🔄 Health Monitoring

The gateway automatically monitors the health of connected servers:

```python
# Check server health
servers_status = await mcp_gateway_list_servers({})

for server in servers_status["connected_servers"]:
    if server["status"] != "connected":
        print(f"Server {server['name']} is unhealthy: {server.get('error')}")
```

### 🎯 Tool Discovery

Dynamically discover tools from connected servers:

```python
# Discover all available tools across servers
all_tools = await mcp_gateway_list_tools({})

# Build a unified tool registry
unified_tools = {}
for server_name, server_tools in all_tools["servers"].items():
    if server_tools["status"] == "success":
        for tool in server_tools["tools"]:
            tool_key = f"{server_name}.{tool['name']}"
            unified_tools[tool_key] = {
                "server": server_name,
                "tool": tool["name"],
                "description": tool["description"]
            }
```

### 📡 Resource Aggregation

Access resources from multiple servers:

```python
# List all resources across servers
all_resources = await mcp_gateway_list_resources({})

# Access specific resources
for server_name, server_resources in all_resources["servers"].items():
    if server_resources["status"] == "success":
        for resource in server_resources["resources"]:
            print(f"Resource: {resource['name']} from {server_name}")
```

## Error Handling

The gateway provides comprehensive error handling:

```python
try:
    result = await mcp_gateway_call_tool({
        "server_name": "nonexistent_server",
        "tool_name": "some_tool"
    })
except Exception as e:
    if "not connected" in str(e):
        print("Server is not connected, attempting reconnection...")
    else:
        print(f"Tool execution failed: {e}")
```

## Integration with Ollama Multi-Agent Support

The MCP Gateway works seamlessly with the existing multi-agent Ollama support:

```python
# Use gateway to route to different Ollama instances
await mcp_gateway_call_tool({
    "server_name": "ollama_primary",
    "tool_name": "ollama_chat",
    "arguments": {
        "model": "llama2",
        "agent": "analyst",  # Route to analyst agent
        "messages": [{"role": "user", "content": "Analyze this data"}]
    }
})

await mcp_gateway_call_tool({
    "server_name": "ollama_secondary", 
    "tool_name": "ollama_chat",
    "arguments": {
        "model": "codellama",
        "agent": "reviewer",  # Route to reviewer agent
        "messages": [{"role": "user", "content": "Review this code"}]
    }
})
```

## Benefits

- **🔧 Unified Interface**: Single point of access to multiple MCP servers
- **📈 Scalability**: Distribute load across multiple server instances
- **🔄 Flexibility**: Dynamic server connection and disconnection
- **👀 Observability**: Centralized monitoring and health checking
- **🛡️ Resilience**: Failover capabilities and error isolation
- **🎯 Specialization**: Route requests to specialized servers
- **💼 Enterprise Ready**: Integration with existing enterprise systems

The MCP Gateway functionality transforms the MCP Ollama Server into a powerful orchestration platform capable of managing complex multi-server deployments and providing unified access to distributed tooling ecosystems.