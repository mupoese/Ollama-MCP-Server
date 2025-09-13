#!/bin/bash
set -e

echo "🔧 Setting up MCP Ollama Server development environment..."

# Check if Python 3.13 is available, fallback to Python 3.12+
if command -v python3.13 &> /dev/null; then
    PYTHON_CMD="python3.13"
elif command -v python3.12 &> /dev/null; then
    PYTHON_CMD="python3.12"
elif command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    if [ "$(echo "$PYTHON_VERSION >= 3.12" | bc -l)" -eq 1 ]; then
        PYTHON_CMD="python3"
    else
        echo "❌ Python 3.12+ required. Found: Python $PYTHON_VERSION"
        exit 1
    fi
else
    echo "❌ Python 3.12+ not found. Please install Python 3.12 or higher."
    exit 1
fi

echo "✅ Using Python: $PYTHON_CMD"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Install development dependencies
echo "🛠️ Installing development dependencies..."
pip install pytest pytest-asyncio pytest-cov black isort mypy pylint

# Install in development mode
echo "🔧 Installing package in development mode..."
pip install -e .

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# MCP Ollama Server Configuration
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# Ollama Configuration
OLLAMA_API=http://localhost:11434
# OLLAMA_AGENT_2_URL=http://localhost:11435
# OLLAMA_AGENT_3_URL=http://localhost:11436

# GitHub Integration (optional)
# GITHUB_TOKEN=your_github_token_here

# Security
AUDIT_LOGGING=true
INPUT_VALIDATION=true

# Performance
REQUEST_TIMEOUT=30
MAX_RETRIES=3
CACHE_TTL=300
EOF
    echo "📝 Created .env file with default configuration"
    echo "   Edit .env to customize your settings"
fi

# Run health check
echo "🏥 Running health check..."
python -m mcp_devops_server.main health

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "📖 Quick Start:"
echo "   1. Activate virtual environment: source venv/bin/activate"
echo "   2. Start server: python -m mcp_devops_server.main serve"
echo "   3. List tools: python -m mcp_devops_server.main list-tools"
echo "   4. Run tests: pytest tests/ -v"
echo ""
echo "🐳 Docker:"
echo "   1. Build: ./scripts/docker-build.sh"
echo "   2. Start: ./scripts/docker-start.sh"
echo ""
echo "🌐 MCP Gateway:"
echo "   1. Quick start: ./scripts/mcp-gateway-demo.sh"
echo "   2. Connect servers: ./scripts/mcp-gateway-connect.py"
echo ""
echo "💡 Open VS Code workspace: code .vscode/mcp-server.code-workspace"