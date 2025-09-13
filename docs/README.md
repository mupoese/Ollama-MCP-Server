# MCP Ollama Server

**Author/Maintainer:** [Mupoese](https://github.com/mupoese)  
**Version:** v2.0.0  
**License:** GNU General Public License v2.0  
**Language:** Python 3.13+ (Migrated from Node.js)

## 🚀 Production-Ready Python MCP DevOps Server

A comprehensive Python-based Model Context Protocol (MCP) server that provides AI models with access to essential DevOps tools, multi-agent Ollama support, GitHub integration, browser automation, and revolutionary **MCP Gateway functionality** for multi-server orchestration.

### ✨ Key Features

- **🤖 Multi-Agent Ollama Support**: Up to 8 specialized AI endpoints for agentic responses
- **🛠️ 28 DevOps Tools**: Docker, Kubernetes, Git, GitHub API, Playwright browser automation
- **🌐 MCP Gateway**: Connect and orchestrate multiple external MCP servers
- **🔒 Enterprise Security**: Audit logging, input validation, role-based access
- **🐳 Production Docker**: Multi-stage builds with development and production targets
- **📊 Comprehensive Testing**: Verified tool execution and integration tests

## 🏃‍♂️ Quick Start

### 🎯 One-Command Setup

```bash
# Clone and setup everything automatically
git clone https://github.com/mupoese/Ollama-MCP-Server.git
cd Ollama-MCP-Server
make quickstart
```

### 🐳 Docker Quick Start

```bash
# Option 1: Use pre-built image
docker run -it --rm -p 8000:8000 \
  -e OLLAMA_API=http://host.docker.internal:11434 \
  ghcr.io/mupoese/ollama-mcp-server:latest

# Option 2: Build and run locally
make docker-build
make docker-start
```

### 💻 Development Setup

```bash
# Setup development environment
make setup

# Start development server
make dev

# Run tests
make test

# Open VS Code workspace
code .vscode/mcp-server.code-workspace
```

## 🛠️ Available Tools (28 Total)

### 🤖 Ollama Integration (5 tools)
- **Multi-Agent Support**: `ollama_chat` with agent routing
- **Model Management**: `ollama_list_models`, `ollama_pull_model`
- **Agent Management**: `ollama_list_agents`, `ollama_test_agent`

### 🏗️ Infrastructure (3 tools)
- **Docker**: `docker_status`, `docker_list_containers`, `docker_inspect_container`
- **Kubernetes**: Pod and deployment management (when available)

### 📂 Git Operations (4 tools)
- **Repository Management**: `git_status`, `git_clone`, `git_branch`, `git_commit`

### 🐙 GitHub API (7 tools)
- **File Operations**: `github_get_file_contents`, `github_get_commit`
- **Repository Info**: `github_list_commits`, `github_list_branches`, `github_search_repositories`
- **Issues & PRs**: `github_get_issue`, `github_list_pull_requests`

### 🌐 Browser Automation (9 tools)
- **Navigation**: `playwright_navigate`, `playwright_take_screenshot`
- **Interaction**: `playwright_click`, `playwright_type`, `playwright_wait_for`
- **Advanced**: `playwright_get_text`, `playwright_fill_form`, `playwright_evaluate`, `playwright_get_page_info`

### 🌐 MCP Gateway (6 tools) ✨ **NEW**
- **Connection Management**: `mcp_gateway_connect`, `mcp_gateway_disconnect`
- **Server Orchestration**: `mcp_gateway_list_servers`, `mcp_gateway_list_tools`
- **Tool Routing**: `mcp_gateway_call_tool`, `mcp_gateway_list_resources`

All development commands are available through the `Makefile`:

```bash
# 📖 Setup & Development
make setup          # Setup development environment
make dev            # Start development server
make test           # Run tests
make format         # Format code
make lint           # Run linting

# 🐳 Docker Commands
make docker-build   # Build Docker images
make docker-start   # Start with Docker Compose
make docker-stop    # Stop containers
make docker-logs    # View logs

# 🧪 Testing & Health
make health         # Health check
make tools          # List available tools
make validate       # Validate configuration

# 🌐 MCP Gateway
make gateway-demo   # Gateway demonstration
make gateway-tools  # List gateway tools

# 🧹 Maintenance
make clean          # Clean temporary files
make clean-all      # Clean everything
```

## 🌐 MCP Gateway - Multi-Server Orchestration

The **MCP Gateway functionality** is a revolutionary feature that allows this server to act as a centralized hub for connecting to and managing multiple external MCP servers.

### Gateway Capabilities

```bash
# Connect to external MCP servers
python scripts/mcp-gateway-connect.py connect ollama_node stdio --command 'node,server.js'
python scripts/mcp-gateway-connect.py connect remote_server sse --url 'https://api.example.com/mcp'

# List connected servers
python scripts/mcp-gateway-connect.py list-servers

# Aggregate tools from all servers
python scripts/mcp-gateway-connect.py list-tools

# Run gateway demonstration
make gateway-demo
```

### Use Cases

- **Multi-Agent Ollama**: Connect multiple Ollama instances with different models
- **Enterprise Integration**: Centralized access to distributed enterprise tooling
- **Load Balancing**: Distribute workload across multiple servers
- **Failover Support**: Resilient operations with backup connections

## 🤖 Multi-Agent Configuration

Configure up to 8 specialized Ollama agents:

```bash
# Environment configuration
OLLAMA_API=http://localhost:11434              # Primary agent
OLLAMA_AGENT_2_URL=http://localhost:11435      # Code analysis
OLLAMA_AGENT_3_URL=http://localhost:11436      # Security reviews
OLLAMA_AGENT_4_URL=http://gpu-server:11434     # Heavy computation
# ... up to OLLAMA_AGENT_8_URL
```

Route requests to specific agents:
```python
# Chat with specific agent
{
  "tool": "ollama_chat",
  "arguments": {
    "message": "Analyze this code for security issues",
    "agent": "secondary"  # Routes to OLLAMA_AGENT_2_URL
  }
}
```

## 🔧 IDE Support

### VS Code Integration

Open the pre-configured workspace:
```bash
code .vscode/mcp-server.code-workspace
```

**Features included:**
- Python debugging configurations for MCP server
- Integrated terminal with proper PYTHONPATH
- Task runners for common development commands
- Extension recommendations for Python development
- Code formatting and linting on save

### Debug Configurations

- **Debug MCP Server**: Run server with debugger attached
- **Debug with Ollama**: Run with multi-agent Ollama configuration
- **Test Tools**: Debug tool execution
- **Run Tests**: Debug test suite

## 🐳 Docker Development

### Development Container

```bash
# Build development image
make docker-build

# Start development environment
make docker-start

# Get shell in container
docker-compose exec mcp-ollama-server bash

# Run commands in container
docker-compose exec mcp-ollama-server python -m mcp_devops_server.main health
```

### Production Deployment

```bash
# Production docker-compose.yml includes:
# - Health checks
# - Restart policies  
# - Volume mounts
# - Environment configuration
# - Network isolation
# - Multi-agent support

docker-compose up -d
```

## 📊 Testing & Quality

### Comprehensive Testing

```bash
# Run all tests
make test

# Run with coverage
make test-coverage

# Run specific test categories
pytest tests/test_config.py -v
pytest tests/test_tools.py -v
pytest tests/test_mcp_gateway.py -v
```

### Code Quality

```bash
# Format code
make format

# Lint code
make lint

# Security checks
make security

# Type checking included in lint
```

## ⚙️ Configuration

### Environment Variables

```bash
# Core Configuration
ENVIRONMENT=development|staging|production
DEBUG=true|false
LOG_LEVEL=DEBUG|INFO|WARNING|ERROR

# Ollama Configuration
OLLAMA_API=http://localhost:11434
OLLAMA_AGENT_2_URL=http://localhost:11435
# ... additional agents

# GitHub Integration
GITHUB_TOKEN=your_github_token_here

# Security & Performance
AUDIT_LOGGING=true
INPUT_VALIDATION=true
REQUEST_TIMEOUT=30
MAX_RETRIES=3
CACHE_TTL=300
```

### Configuration File

Create `config.yaml` for advanced configuration:
```yaml
server:
  environment: development
  debug: true
  log_level: INFO

ollama:
  api_url: http://localhost:11434
  agents:
    secondary: http://localhost:11435
    analyst: http://localhost:11436

security:
  audit_logging: true
  input_validation: true
  max_request_size: 10485760

tools:
  enabled_categories:
    - ollama
    - infrastructure  
    - git
    - github
    - browser
    - mcp_gateway
```

## 🚀 Production Deployment

### System Requirements

- **Python**: 3.12+ (3.13 recommended)
- **Memory**: 512MB minimum, 2GB recommended
- **Docker**: 20.10+ (optional)
- **Ollama**: Local or remote instance

### Production Checklist

- [ ] Set `ENVIRONMENT=production`
- [ ] Configure proper logging level
- [ ] Set up health monitoring
- [ ] Configure reverse proxy (nginx/traefik)
- [ ] Set resource limits
- [ ] Enable audit logging
- [ ] Configure backup strategy

## 📚 Documentation

- **[MCP Gateway Functions](docs/MCP_GATEWAY_FUNCTIONS.md)**: Complete gateway documentation
- **[API Reference](docs/api/)**: Generated API documentation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test: `make test`
4. Format code: `make format`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Create Pull Request

## 📄 License

GNU General Public License v2.0 - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) for the protocol specification
- [Ollama](https://ollama.ai/) for local LLM serving
- [Playwright](https://playwright.dev/) for browser automation
- [FastAPI](https://fastapi.tiangolo.com/) for the HTTP server framework

---

**🌟 Star this repository if you find it useful!**

## Key Features

- **Proper MCP Protocol**: Implements JSON-RPC over stdin/stdout (not HTTP REST)
- **ES Modules**: Uses modern ES module syntax for MCP SDK compatibility
- **MCP Tools**: List models, chat, generate text, pull models
- **Docker Support**: Ready-to-deploy container
- **Environment Variables**: Configure via Docker `-e` or local `.env`
- **Claude Desktop Integration**: Works seamlessly with Claude Desktop
- **SILENCE_STARTUP**: Prevents console output that interferes with MCP protocol
- **Extensible**: Add custom authentication, logging, dashboards, etc.
- **Fast Deployment**: Quick to build and deploy

---

## System Requirements

- Node.js v18+ (for local testing)
- npm (for local testing)
- Ollama installed and running locally, or remote Ollama API
- Docker (recommended for production/desktop integration)
- Git

---

## Important: MCP vs HTTP

This server implements the **Model Context Protocol (MCP)**, which uses JSON-RPC over stdin/stdout, **not HTTP REST API**. 

- ✅ **Correct**: MCP server for Claude Desktop integration
- ❌ **Incorrect**: HTTP REST API server

---

## 🔌 MCP Protocol Communication Architecture

### Communication Flow Overview

The Ollama MCP Server acts as a bridge between MCP clients (like Claude Desktop) and Ollama API, implementing a dual-protocol architecture:

```
┌─────────────────┐    JSON-RPC     ┌─────────────────┐    HTTP REST    ┌─────────────────┐
│   MCP Client    │◄─stdin/stdout──►│  Ollama-MCP     │◄──port 11434───►│   Ollama API    │
│ (Claude Desktop)│                 │     Server      │                 │   (LLM Models)  │
└─────────────────┘                 └─────────────────┘                 └─────────────────┘
```

### Port Usage and Communication Protocols

| Component | Protocol | Port/Interface | Purpose |
|-----------|----------|---------------|----------|
| **MCP Client ↔ MCP Server** | JSON-RPC | stdin/stdout | Model Context Protocol communication |
| **MCP Server ↔ Ollama** | HTTP REST | 11434 | Ollama API calls for model operations |

### JSON-RPC Functions Documentation

The server implements the Model Context Protocol (MCP) specification with the following JSON-RPC methods:

#### Core MCP Methods

**1. `listTools`**
- **Purpose**: Returns all available MCP tools
- **Request**: No parameters required
- **Response**: Array of tool definitions with schemas
- **Example**:
  ```json
  {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }
  ```

**2. `callTool`**
- **Purpose**: Executes a specific tool with provided arguments
- **Request**: Tool name and arguments object
- **Response**: Tool execution result
- **Example**:
  ```json
  {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "ollama_chat",
      "arguments": {
        "model": "llama2",
        "messages": [{"role": "user", "content": "Hello!"}]
      }
    }
  }
  ```

### Available MCP Tools

#### Ollama Core Tools

| Tool Name | Purpose | Ollama API Endpoint |
|-----------|---------|-------------------|
| `ollama_list_models` | List available models | `GET /api/tags` |
| `ollama_chat` | Chat with model | `POST /api/chat` |
| `ollama_generate` | Generate text | `POST /api/generate` |
| `ollama_pull_model` | Download model | `POST /api/pull` |

#### Development Tools

| Tool Name | Purpose | Description |
|-----------|---------|-------------|
| `code_feedback` | Code analysis | AI-powered code review and feedback |
| `terminal_execute` | Command execution | Execute shell commands with safety checks |
| `file_read` | File operations | Read file contents |
| `file_write` | File operations | Write file contents |
| `file_list` | File operations | List directory contents |

#### Testing & Quality Tools

| Tool Name | Purpose | Description |
|-----------|---------|-------------|
| `test_run` | Test execution | Run project tests |
| `test_discover` | Test discovery | Find test files |
| `lint_check` | Code linting | Run code quality checks |
| `audit_security` | Security audit | Security vulnerability scanning |

#### Server Management Tools

| Tool Name | Purpose | Description |
|-----------|---------|-------------|
| `server_status` | Status check | Get server health status |
| `validate_config` | Config validation | Validate server configuration |

### Communication Protocol Details

#### MCP Protocol (Client ↔ Server)

**Transport**: stdio (stdin/stdout)  
**Protocol**: JSON-RPC 2.0  
**Message Format**:
```json
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "method": "method-name",
  "params": { /* method parameters */ }
}
```

**Key Features**:
- Bidirectional communication over stdio
- No HTTP headers or REST endpoints
- All logging must go to stderr (not stdout) to avoid protocol interference
- `SILENCE_STARTUP=true` prevents stdout pollution

#### HTTP Protocol (Server ↔ Ollama)

**Transport**: HTTP/HTTPS  
**Default Endpoint**: `http://host.docker.internal:11434`  
**Protocol**: REST API  
**Authentication**: None (local API)  

**Request Configuration**:
- Content-Type: `application/json`
- Timeout: 30 seconds (configurable)
- Retry Logic: 3 attempts with exponential backoff
- Error Handling: Automatic retry for 5xx errors, timeouts, and connection issues

### Environment Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_API` | `http://host.docker.internal:11434` | Ollama API endpoint |
| `SILENCE_STARTUP` | `false` | Suppress startup logs for MCP compatibility |
| `REQUEST_TIMEOUT` | `30000` | HTTP request timeout (ms) |
| `MAX_RETRIES` | `3` | HTTP request retry attempts |
| `CODE_FEEDBACK_TIMEOUT` | `60000` | AI code feedback analysis timeout (ms) |
| `CODE_FEEDBACK_MAX_LENGTH` | `50000` | Maximum code length for analysis (characters) |
| `ENABLE_SECURITY_LOGGING` | `true` | Enable security pattern detection logging |

#### Code Feedback Configuration

The enhanced AI code feedback tool supports additional configuration for security and performance:

- **Timeout Control**: `CODE_FEEDBACK_TIMEOUT` allows longer analysis for complex code
- **Size Limits**: `CODE_FEEDBACK_MAX_LENGTH` prevents resource exhaustion from large files
- **Security Monitoring**: `ENABLE_SECURITY_LOGGING` logs suspicious patterns (eval, exec, etc.)

Example `.env` configuration:
```bash
# Basic configuration
OLLAMA_API=http://localhost:11434
SILENCE_STARTUP=true

# Code feedback enhancements
CODE_FEEDBACK_TIMEOUT=90000
CODE_FEEDBACK_MAX_LENGTH=75000
ENABLE_SECURITY_LOGGING=true
```

### Error Handling

**MCP Protocol Errors**:
- Invalid tool names return `MethodNotFound` error
- Validation failures return `InvalidParams` error
- Internal errors return `InternalError` with details

**HTTP Protocol Errors**:
- Connection failures trigger automatic retry
- 4xx errors (client errors) are not retried
- 5xx errors (server errors) trigger retry with backoff

---

## Installation & Usage

### 1. Clone the Repository

```bash
git clone https://github.com/mupoese/Ollama-MCP-Server.git
cd Ollama-MCP-Server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build Docker Image

```bash
docker build -t ollama-mcp-server .
```

### 4. Test the Server

```bash
# Test with Docker (Linux/Mac)
docker run -i --rm \
  -e OLLAMA_API=http://host.docker.internal:11434 \
  -e SILENCE_STARTUP=true \
  ollama-mcp-server

# Test with Docker (Windows PowerShell - single line)
docker run -i --rm -e OLLAMA_API=http://host.docker.internal:11434 -e SILENCE_STARTUP=true ollama-mcp-server
```

### 5. Publish to Docker Hub (Optional)

```bash
# Tag your image
docker tag ollama-mcp-server docker.io/mup1987/ollama-mcp-server:latest

# Push to Docker Hub
docker push docker.io/mup1987/ollama-mcp-server:latest
```

---

## Claude Desktop Integration

### Configuration File Location

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`

### MCP Configuration

Add this to your Claude Desktop MCP configuration:

**Complete Configuration (with GitHub MCP Server):**
```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_token_here"
      }
    },
    "ollama-mcp": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "OLLAMA_API=http://host.docker.internal:11434",
        "-e",
        "SILENCE_STARTUP=true",
        "docker.io/mup1987/ollama-mcp-server:latest"
      ],
      "env": {
        "OLLAMA_API": "http://host.docker.internal:11434",
        "SILENCE_STARTUP": "true"
      }
    }
  }
}
```

**Ollama-Only Configuration:**
```json
{
  "mcpServers": {
    "ollama-mcp": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "OLLAMA_API=http://host.docker.internal:11434",
        "-e",
        "SILENCE_STARTUP=true",
        "docker.io/mup1987/ollama-mcp-server:latest"
      ],
      "env": {
        "OLLAMA_API": "http://host.docker.internal:11434",
        "SILENCE_STARTUP": "true"
      }
    }
  }
}
```

**Using Local Docker Build:**
```json
{
  "mcpServers": {
    "ollama-mcp": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "OLLAMA_API=http://host.docker.internal:11434",
        "-e",
        "SILENCE_STARTUP=true",
        "ollama-mcp-server"
      ],
      "env": {
        "OLLAMA_API": "http://host.docker.internal:11434",
        "SILENCE_STARTUP": "true"
      }
    }
  }
}
```

### Platform-Specific OLLAMA_API Settings

| Platform        | OLLAMA_API Setting                       |
| --------------- | ---------------------------------------- |
| **Windows/Mac** | `http://host.docker.internal:11434`     |
| **Linux**       | `http://localhost:11434` or `http://172.17.0.1:11434` |

> **Note**: Your configuration uses `host.docker.internal` which works well for Windows/Mac. Linux users may need to adjust to their Docker bridge IP.

---

## Available MCP Tools

Once connected to Claude Desktop, these tools become available:

### Core Ollama Tools
| Tool Name           | Description                              |
| ------------------- | ---------------------------------------- |
| `ollama_list_models`| List all available Ollama models        |
| `ollama_chat`       | Chat with an Ollama model               |
| `ollama_generate`   | Generate text with an Ollama model      |
| `ollama_pull_model` | Pull/download a model from registry     |

### 🛠️ Development & Testing Tools
| Tool Name           | Description                              |
| ------------------- | ---------------------------------------- |
| `terminal_execute`  | Execute shell commands in controlled environment |
| `test_run`         | Run Jest tests with configurable options |
| `test_discover`    | Discover and list available test files   |

### 📁 File Management Tools
| Tool Name           | Description                              |
| ------------------- | ---------------------------------------- |
| `file_read`        | Read file contents with encoding support |
| `file_write`       | Write content to files with backup options |
| `file_list`        | List files and directories with filtering |

### 🔍 Code Quality Tools
| Tool Name           | Description                              |
| ------------------- | ---------------------------------------- |
| `lint_check`       | Run ESLint with auto-fix capabilities   |
| `audit_security`   | Run npm security audit on dependencies  |

### ⚙️ Server Management Tools
| Tool Name           | Description                              |
| ------------------- | ---------------------------------------- |
| `server_status`    | Get MCP server status and diagnostics   |
| `validate_config`  | Validate MCP server configuration       |

### Tool Usage Examples

#### AI Code Feedback (Enhanced) 🚀

The AI code feedback tool provides comprehensive code analysis with structured, professional output.

```javascript
// Security analysis with Ollama (full AI-powered feedback)
ai_code_feedback({
  code: `
    function authenticateUser(username, password) {
      const query = "SELECT * FROM users WHERE username = '" + username + 
                    "' AND password = '" + password + "'";
      return database.query(query);
    }
  `,
  language: "javascript",
  provider: "ollama",
  model: "codellama:7b",
  feedbackType: "security"
})

// Performance analysis with enhanced placeholder providers
ai_code_feedback({
  code: `
    def process_data(items):
        results = []
        for i in range(len(items)):
            for j in range(len(items)):
                if items[i] > items[j]:
                    results.append(items[i])
        return results
  `,
  language: "python",
  provider: "github",
  feedbackType: "performance"
})

// Style analysis with structured output
ai_code_feedback({
  code: `
    public class UserManager{
    private List<User>users;
    public void addUser(String n,int a){
    users.add(new User(n,a));
    }
    }
  `,
  language: "java",
  provider: "claude",
  feedbackType: "style"
})
```

**Enhanced Output Format:**
```markdown
## 🔍 Analysis Summary
Brief overview of findings and code quality assessment.

## ⚠️ Issues Identified
- **Priority Level**: High/Medium/Low
- **Issue**: Specific problem description
- **Line/Section**: Location in code
- **Impact**: Potential consequences

## ✅ Positive Aspects
Recognition of good practices and well-implemented features.

## 🔧 Recommendations
1. **Immediate fixes** (critical issues)
2. **Improvements** (optimization opportunities)
3. **Best practices** (long-term maintainability)

## 📚 Code Examples
Improved code snippets and alternatives.

## 🏷️ Overall Rating
Quality assessment: Excellent/Good/Fair/Needs Improvement
```

#### Terminal Operations
```javascript
// Execute a safe command
terminal_execute({
  command: "npm test",
  workingDirectory: "/path/to/project",
  timeout: 60
})

// List project files
file_list({
  path: ".",
  pattern: "*.js",
  recursive: true,
  details: true
})
```

#### Testing & Quality
```javascript
// Run specific tests
test_run({
  testPath: "tests/config.test.js",
  coverage: true,
  verbose: true
})

// Check code quality
lint_check({
  path: "src/",
  fix: true,
  format: "stylish"
})

// Security audit
audit_security({
  level: "high",
  fix: false
})
```

#### File Operations
```javascript
// Read configuration file
file_read({
  path: "package.json",
  encoding: "utf8"
})

// Write with backup
file_write({
  path: "config.json",
  content: JSON.stringify(config, null, 2),
  backup: true,
  createDirectories: true
})
```

#### Server Management
```javascript
// Check server status
server_status({
  detailed: true
})

// Validate configuration
validate_config({
  showDetails: true
})
```

### Security Features

- **Path Security**: File operations prevent access to system directories (`/etc/`, `/sys/`)
- **Command Filtering**: Terminal execution blocks dangerous commands (`rm -rf`, `sudo`, etc.)
- **File Size Limits**: File reads limited to prevent memory exhaustion
- **Timeout Protection**: All operations have configurable timeouts

---

## Local Development (No Docker)

For local development without Docker:

```bash
# Install dependencies
npm install

# Start the MCP server
node server.js
```

**Claude Desktop config for local usage:**

```json
{
  "mcpServers": {
    "ollama": {
      "command": "node",
      "args": ["/path/to/your/ollama-mcp-server/server.js"],
      "env": {
        "OLLAMA_API": "http://localhost:11434"
      }
    }
  }
}
```

---

## Project Structure

```
Ollama-MCP-Server/
├── server.js              # Main MCP server implementation (ES modules)
├── package.json            # Dependencies and project info (with "type": "module")
├── Dockerfile              # Docker build instructions
├── docker-compose.yml      # Docker Compose configuration
├── .env.example           # Environment variables example
├── LICENSE                 # GPL v2.0 license
└── README.md              # This file
```

---

## Development

### Project Structure

```
Ollama-MCP-Server/
├── src/                    # Source code
│   ├── config/            # Configuration management
│   │   └── index.js       # Environment and config validation
│   ├── handlers/          # MCP tool handlers
│   │   ├── schemas.js     # Tool definitions and schemas
│   │   └── tools.js       # Tool implementation handlers
│   ├── utils/             # Utility modules
│   │   ├── http-client.js # HTTP client with retry logic
│   │   ├── logger.js      # Structured logging utility
│   │   └── validation.js  # Input validation utilities
│   └── server.js          # Main server implementation
├── tests/                 # Test files
│   ├── config.test.js     # Configuration tests
│   ├── schemas.test.js    # Schema tests
│   ├── validation.test.js # Validation tests
│   └── setup.js           # Test setup and mocks
├── .github/workflows/     # CI/CD workflows
│   └── ci.yml             # GitHub Actions workflow
├── server.js              # Entry point (backwards compatible)
├── package.json           # Dependencies and scripts
├── jest.config.json       # Jest test configuration
├── eslint.config.js       # ESLint configuration
├── Dockerfile             # Docker build instructions
├── docker-compose.yml     # Docker Compose configuration
├── .env                   # Environment variables example
├── .gitignore             # Git ignore patterns
├── LICENSE                # GPL v2.0 license
└── README.md              # This file
```

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mupoese/Ollama-MCP-Server.git
   cd Ollama-MCP-Server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run linting**:
   ```bash
   npm run lint          # Check for issues
   npm run lint:fix      # Auto-fix issues
   ```

4. **Run tests**:
   ```bash
   npm test              # Run all tests
   npm run test:watch    # Run tests in watch mode
   npm run test:coverage # Run tests with coverage
   ```

5. **Run validation** (lint + test):
   ```bash
   npm run validate
   ```

### Code Quality

- **ESLint**: Enforces consistent code style and catches potential issues
- **Jest**: Comprehensive test suite with >80% coverage
- **Structured Logging**: Proper error handling and debugging capabilities
- **Input Validation**: Robust validation for all tool inputs
- **Retry Logic**: HTTP requests include exponential backoff retry logic
- **Modular Architecture**: Clean separation of concerns
- **AI Law Compliance**: Full LAW-001 implementation with learning cycles

### 🔍 AI Core Architecture

The server implements a comprehensive AI governance and learning system:

#### Directory Structure
```
ai_core/
├── law_enforcer.js      # LAW-001 compliance validation
├── learning_cycle.js    # 6-step learning cycle implementation
└── snapshot_mem.js      # Memory and snapshot management

logic/
├── pattern_detector.js  # Pattern detection and deviation analysis
└── proposed_logic_update.ai

governance/
├── law_control.governance  # Governance framework
└── governance.vote        # Voting system

memory/
└── snapshots/            # Automatic snapshot storage

config/
├── ai_status.json       # AI system status and dependencies
└── memory_config.json   # Memory system configuration
```

#### Learning Cycle Process

Every tool execution triggers a 6-step learning cycle:

1. **Input Collection**: Structures input as JSON schema
2. **Action Determination**: Analyzes input and determines action per current logic
3. **Action Execution**: Executes action and registers direct reaction
4. **Reaction Registration**: Records system response and reaction data
5. **Output Evaluation**: Evaluates output vs expected outcomes, detects deviations
6. **Snapshot Generation**: Creates and stores snapshot with all cycle data

#### Memory & Pattern Detection

- **Automatic Loading**: Snapshots loaded on startup (`memory.load_snapshots=True`)
- **Pattern Analysis**: Detects recurring patterns and systematic deviations
- **Escalation System**: Automatically escalates patterns above threshold (default: 3)
- **Cleanup**: Removes unused/deviated files as specified in law.ai

#### Governance System

- **Law Control**: All core AI logic updates require explicit governance approval
- **Voting Mechanism**: Implements democratic voting for logic changes
- **Admin Override**: Emergency overrides logged and require retroactive approval
- **Audit Trail**: All governance actions automatically logged and snapshot-generated

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_API` | `http://host.docker.internal:11434` | Ollama API endpoint |
| `SILENCE_STARTUP` | `false` | Suppress startup logs for MCP compatibility |
| `DEBUG` | `false` | Enable debug logging |
| `REQUEST_TIMEOUT` | `30000` | HTTP request timeout in milliseconds |
| `MAX_RETRIES` | `3` | Maximum number of retry attempts |
| `AI_CORE_ENABLED` | `true` | Enable AI core learning cycle system |
| `LEARNING_CYCLE_AUTO` | `true` | Automatically trigger learning cycles |
| `PATTERN_THRESHOLD` | `3` | Pattern detection threshold |
| `MEMORY_LOAD_SNAPSHOTS` | `true` | Load snapshots on startup |

### CI/CD

The project includes a GitHub Actions workflow that:
- Runs linting and tests on Node.js 18.x and 20.x
- Builds and tests Docker image
- Runs security audits
- Reports test coverage

---

## Troubleshooting

### Common Issues

**Q: MCP server times out during initialization**  
**A:** Ensure the server implements proper MCP protocol (JSON-RPC over stdin/stdout), not HTTP REST. Check that Ollama is running on the specified API endpoint.

**Q: "Unexpected token" JSON parsing error**  
**A:** The server is sending non-JSON output to stdout. All logging must go to stderr, not stdout. Set `SILENCE_STARTUP=true` to prevent this issue.

**Q: "ERR_REQUIRE_ESM" error**  
**A:** The MCP SDK requires ES modules. Make sure your package.json includes `"type": "module"` and uses `import` statements instead of `require()`.

**Q: Docker container can't connect to Ollama**  
**A:** Check your `OLLAMA_API` setting. Use `host.docker.internal` for Windows/Mac, or find your Docker bridge IP on Linux.

**Q: Claude Desktop doesn't show the MCP server**  
**A:** Verify your `claude_desktop_config.json` syntax and restart Claude Desktop. Check the MCP server logs for errors.

**Q: Server works locally but fails in Docker**  
**A:** Ensure you're using the correct Docker image (rebuilt after ES module changes) and proper environment variables.

### Debug Steps

1. **Test Ollama directly:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Check Docker connectivity:**
   ```bash
   docker run --rm alpine ping host.docker.internal
   ```

3. **Test MCP server locally:**
   ```bash
   # Clone and test locally first
   git clone https://github.com/mupoese/Ollama-MCP-Server.git
   cd Ollama-MCP-Server
   npm install
   node server.js
   ```

4. **View MCP server logs:**
   Check Claude Desktop developer tools or console for MCP connection logs.

5. **Rebuild Docker image after changes:**
   ```bash
   docker build -t docker.io/mup1987/ollama-mcp-server:latest .
   ```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the GNU General Public License v2.0.  
See `LICENSE` file for the complete license text.

---

## Support & Maintenance

- **Author/Maintainer:** Mupoese
- **Issues/Bugs:** via GitHub Issues
- **Feature Requests:** via Pull Request or GitHub Issue
- **Email:** info@mupoese.nl

---

## Buy Me a Coffee ☕

Find this project useful? Want to support development?  
Don't forget to buy me a coffee!

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-%23FFDD00.svg?style=flat-square&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/mup1987)

➡️ **[https://buymeacoffee.com/mup1987](https://buymeacoffee.com/mup1987)**

---

## Additional Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Ollama Documentation](https://ollama.ai/docs)
- [Claude Desktop MCP Setup Guide](https://claude.ai/docs/mcp)

---

> **Note:**  
> This README is a living document and will be expanded with each major update.
