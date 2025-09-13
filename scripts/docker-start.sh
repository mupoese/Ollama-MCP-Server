#!/bin/bash
set -e

echo "🐳 Starting MCP Ollama Server with Docker Compose..."

# Check if docker-compose or docker compose is available
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo "❌ Neither docker-compose nor 'docker compose' found"
    echo "   Please install Docker Compose"
    exit 1
fi

# Create docker-compose.override.yml for development if it doesn't exist
if [ ! -f "docker-compose.override.yml" ]; then
    echo "📝 Creating docker-compose.override.yml for development..."
    cat > docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  mcp-ollama-server:
    build:
      context: .
      dockerfile: Dockerfile.python
      target: development
    volumes:
      - .:/app
      - /app/venv
    environment:
      - DEBUG=true
      - ENVIRONMENT=development
      - LOG_LEVEL=DEBUG
    ports:
      - "8000:8000"
    command: ["python", "-m", "mcp_devops_server.main", "serve", "--debug"]
EOF
fi

# Stop any running containers
echo "🛑 Stopping any running containers..."
$DOCKER_COMPOSE_CMD down

# Build and start
echo "🔨 Building and starting containers..."
$DOCKER_COMPOSE_CMD up --build -d

# Show status
echo ""
echo "📊 Container status:"
$DOCKER_COMPOSE_CMD ps

# Show logs
echo ""
echo "📋 Recent logs:"
$DOCKER_COMPOSE_CMD logs --tail=20

echo ""
echo "✅ MCP Ollama Server started successfully!"
echo ""
echo "🔧 Management commands:"
echo "   View logs: $DOCKER_COMPOSE_CMD logs -f"
echo "   Stop: $DOCKER_COMPOSE_CMD down"
echo "   Restart: $DOCKER_COMPOSE_CMD restart"
echo "   Shell: $DOCKER_COMPOSE_CMD exec mcp-ollama-server bash"
echo ""
echo "🧪 Test commands:"
echo "   Health check: $DOCKER_COMPOSE_CMD exec mcp-ollama-server python -m mcp_devops_server.main health"
echo "   List tools: $DOCKER_COMPOSE_CMD exec mcp-ollama-server python -m mcp_devops_server.main list-tools"