#!/bin/bash
set -e

echo "🌐 MCP Gateway Demo - Multi-Server Orchestration"
echo ""

# Function to check if server is running
check_server() {
    if python -m mcp_devops_server.main health > /dev/null 2>&1; then
        echo "✅ MCP Ollama Server is running"
        return 0
    else
        echo "❌ MCP Ollama Server is not running"
        echo "   Start it with: python -m mcp_devops_server.main serve"
        return 1
    fi
}

# Function to demonstrate gateway functionality
demo_gateway() {
    echo "🔍 Step 1: List current tools..."
    python -m mcp_devops_server.main list-tools | head -10
    echo ""
    
    echo "🔍 Step 2: Check gateway servers (should be empty initially)..."
    python scripts/mcp-gateway-connect.py list-servers
    echo ""
    
    echo "📝 Step 3: Demo connection examples..."
    echo ""
    echo "To connect to a Node.js MCP server via stdio:"
    echo "  python scripts/mcp-gateway-connect.py connect ollama_node stdio --command 'node,server.js' --env 'OLLAMA_API=http://localhost:11434'"
    echo ""
    echo "To connect to a remote MCP server via SSE:"
    echo "  python scripts/mcp-gateway-connect.py connect remote_server sse --url 'https://api.example.com/mcp'"
    echo ""
    echo "To connect to another instance of this server:"
    echo "  python scripts/mcp-gateway-connect.py connect secondary_ollama stdio --command 'python,-m,mcp_devops_server.main,serve' --env 'OLLAMA_API=http://localhost:11435'"
    echo ""
    
    echo "🧪 Step 4: Test with a mock connection (this will fail, but shows the process)..."
    echo "Attempting to connect to a non-existent server..."
    python scripts/mcp-gateway-connect.py connect demo_server stdio --command 'echo,hello' || true
    echo ""
    
    echo "🔍 Step 5: List servers again (check for any changes)..."
    python scripts/mcp-gateway-connect.py list-servers
    echo ""
    
    echo "🎯 Gateway Tools Available:"
    echo "  mcp_gateway_connect      - Connect to external MCP servers"
    echo "  mcp_gateway_disconnect   - Disconnect from servers"
    echo "  mcp_gateway_list_servers - List connected servers with status"
    echo "  mcp_gateway_list_tools   - Aggregate tools from all servers"
    echo "  mcp_gateway_call_tool    - Execute tools on specific servers"
    echo "  mcp_gateway_list_resources - Access resources across servers"
    echo ""
}

# Function to show real-world use cases
show_use_cases() {
    echo "🌟 Real-World MCP Gateway Use Cases:"
    echo ""
    echo "1. 🤖 Multi-Agent Ollama Setup:"
    echo "   - Connect to multiple Ollama instances with different models"
    echo "   - Route requests based on task type (coding, analysis, creative)"
    echo "   - Load balance across multiple GPU servers"
    echo ""
    echo "2. 🏢 Enterprise Integration:"
    echo "   - Connect to specialized MCP servers for different systems"
    echo "   - Aggregate tools from DevOps, Security, and Business systems"
    echo "   - Centralized access point for AI assistants"
    echo ""
    echo "3. 🔧 Development Workflow:"
    echo "   - Connect local development server"
    echo "   - Connect staging environment server"
    echo "   - Route tools based on environment"
    echo ""
    echo "4. 🌐 Distributed Systems:"
    echo "   - Connect to MCP servers in different data centers"
    echo "   - Failover and redundancy for critical operations"
    echo "   - Geographic distribution of AI workloads"
}

# Function to show configuration examples
show_config_examples() {
    echo "⚙️ Configuration Examples:"
    echo ""
    echo "Environment variables for multi-agent setup:"
    cat << 'EOF'
# Primary Ollama instance
OLLAMA_API=http://localhost:11434

# Secondary agents for specialized tasks
OLLAMA_AGENT_2_URL=http://localhost:11435  # Code analysis
OLLAMA_AGENT_3_URL=http://localhost:11436  # Security reviews
OLLAMA_AGENT_4_URL=http://gpu-server:11434 # Heavy computation

# Gateway configuration
MCP_GATEWAY_ENABLED=true
MCP_GATEWAY_MAX_CONNECTIONS=10
MCP_GATEWAY_HEALTH_CHECK_INTERVAL=30
EOF
    echo ""
}

# Main execution
echo "Prerequisites check:"
if ! check_server; then
    exit 1
fi

echo ""
echo "🎯 This demo shows MCP Gateway functionality that allows:"
echo "   ✅ Connecting to multiple external MCP servers"
echo "   ✅ Aggregating tools and resources across servers"
echo "   ✅ Routing tool calls to specific servers"
echo "   ✅ Health monitoring and connection management"
echo ""

# Run the demo
demo_gateway

echo ""
show_use_cases

echo ""
show_config_examples

echo ""
echo "🚀 Next Steps:"
echo "   1. Set up multiple Ollama instances on different ports"
echo "   2. Use the MCP Gateway to connect them all"
echo "   3. Route different types of requests to specialized agents"
echo "   4. Scale your AI infrastructure with centralized management"
echo ""
echo "📖 Full documentation: docs/MCP_GATEWAY_FUNCTIONS.md"