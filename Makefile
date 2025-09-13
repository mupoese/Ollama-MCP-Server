# MCP Ollama Server Makefile
# Easy development and deployment commands

.PHONY: help setup dev test docker clean format lint health tools gateway-demo

# Default target
help:
	@echo "🚀 MCP Ollama Server - Development Commands"
	@echo ""
	@echo "📖 Setup & Development:"
	@echo "  make setup          Setup development environment"
	@echo "  make dev            Start development server"
	@echo "  make test           Run tests"
	@echo "  make format         Format code with black and isort"
	@echo "  make lint           Run linting checks"
	@echo ""
	@echo "🐳 Docker Commands:"
	@echo "  make docker-build   Build Docker images"
	@echo "  make docker-start   Start with Docker Compose"
	@echo "  make docker-stop    Stop Docker containers"
	@echo "  make docker-logs    View container logs"
	@echo ""
	@echo "🧪 Testing & Health:"
	@echo "  make health         Run health check"
	@echo "  make tools          List available tools"
	@echo "  make validate       Validate configuration"
	@echo ""
	@echo "🌐 MCP Gateway:"
	@echo "  make gateway-demo   Run MCP Gateway demonstration"
	@echo "  make gateway-tools  List gateway tools"
	@echo ""
	@echo "🧹 Maintenance:"
	@echo "  make clean          Clean temporary files"
	@echo "  make clean-all      Clean everything including venv"

# Setup development environment
setup:
	@echo "🔧 Setting up development environment..."
	@./scripts/setup-dev.sh

# Start development server
dev:
	@echo "🚀 Starting development server..."
	@source venv/bin/activate && python -m mcp_devops_server.main serve --debug

# Run tests
test:
	@echo "🧪 Running tests..."
	@source venv/bin/activate && pytest tests/ -v --tb=short

# Run tests with coverage
test-coverage:
	@echo "🧪 Running tests with coverage..."
	@source venv/bin/activate && pytest tests/ -v --cov=mcp_devops_server --cov-report=html --cov-report=term

# Format code
format:
	@echo "🎨 Formatting code..."
	@source venv/bin/activate && black mcp_devops_server/ tests/ scripts/
	@source venv/bin/activate && isort mcp_devops_server/ tests/ scripts/

# Run linting
lint:
	@echo "🔍 Running linting checks..."
	@source venv/bin/activate && pylint mcp_devops_server/
	@source venv/bin/activate && mypy mcp_devops_server/
	@source venv/bin/activate && black --check mcp_devops_server/ tests/
	@source venv/bin/activate && isort --check-only mcp_devops_server/ tests/

# Docker commands
docker-build:
	@./scripts/docker-build.sh

docker-start:
	@./scripts/docker-start.sh

docker-stop:
	@echo "🛑 Stopping Docker containers..."
	@docker-compose down

docker-logs:
	@echo "📋 Showing container logs..."
	@docker-compose logs -f

# Health and validation
health:
	@echo "🏥 Running health check..."
	@source venv/bin/activate && python -m mcp_devops_server.main health

tools:
	@echo "🛠️ Listing available tools..."
	@source venv/bin/activate && python -m mcp_devops_server.main list-tools

validate:
	@echo "✅ Validating configuration..."
	@source venv/bin/activate && python -m mcp_devops_server.main validate-config

# MCP Gateway demonstrations
gateway-demo:
	@echo "🌐 Running MCP Gateway demo..."
	@./scripts/mcp-gateway-demo.sh

gateway-tools:
	@echo "🌐 Listing MCP Gateway tools..."
	@source venv/bin/activate && python -m mcp_devops_server.main list-tools | grep gateway

# Maintenance
clean:
	@echo "🧹 Cleaning temporary files..."
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@rm -rf .pytest_cache/ .mypy_cache/ .coverage htmlcov/ 2>/dev/null || true
	@rm -rf *.egg-info/ build/ dist/ 2>/dev/null || true

clean-all: clean
	@echo "🧹 Cleaning everything including virtual environment..."
	@rm -rf venv/ 2>/dev/null || true
	@docker-compose down --volumes --remove-orphans 2>/dev/null || true
	@docker image prune -f 2>/dev/null || true

# Install pre-commit hooks
install-hooks:
	@echo "🪝 Installing pre-commit hooks..."
	@source venv/bin/activate && pip install pre-commit
	@source venv/bin/activate && pre-commit install

# Run security checks
security:
	@echo "🔒 Running security checks..."
	@source venv/bin/activate && safety check
	@source venv/bin/activate && bandit -r mcp_devops_server/

# Performance testing
perf-test:
	@echo "⚡ Running performance tests..."
	@source venv/bin/activate && python -m pytest tests/ -k "performance" -v

# Generate documentation
docs:
	@echo "📚 Generating documentation..."
	@source venv/bin/activate && python -m pdoc mcp_devops_server/ --html --output-dir docs/api/

# Check for outdated dependencies
deps-check:
	@echo "📦 Checking for outdated dependencies..."
	@source venv/bin/activate && pip list --outdated

# Update dependencies
deps-update:
	@echo "📦 Updating dependencies..."
	@source venv/bin/activate && pip-compile requirements.in --upgrade
	@source venv/bin/activate && pip install -r requirements.txt

# Quick start for new developers
quickstart: setup health tools
	@echo ""
	@echo "🎉 Quick start complete!"
	@echo ""
	@echo "💡 Next steps:"
	@echo "   1. Start server: make dev"
	@echo "   2. Run tests: make test"
	@echo "   3. Try Docker: make docker-start"
	@echo "   4. Explore gateway: make gateway-demo"
	@echo ""
	@echo "📖 Open VS Code: code .vscode/mcp-server.code-workspace"