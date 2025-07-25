# Ollama-MCP-Server

**Author/Maintainer:** [Mupoese](https://github.com/mupoese)  
**Version:** v1.0.0  
**License:** GNU General Public License v2.0  
**AI Compliance:** LAW-001 (Comprehensive AI Learning Cycle)

## 🚀 AI-Enhanced MCP Server

This Ollama MCP Server has been enhanced with comprehensive AI law enforcement and learning cycle capabilities, implementing LAW-001 requirements for:

- **6-Step Learning Cycle**: Automatic execution on cause detection
- **Snapshot Generation**: JSON schema-based memory system
- **Pattern Detection**: Systematic deviation analysis
- **Governance Framework**: Automated approval system for AI core updates
- **Law Enforcement**: Real-time compliance validation

### 🤖 AI Core Features

- **Automatic Learning Cycles**: Every tool execution triggers a complete 6-step learning cycle
- **Memory Persistence**: Snapshots automatically saved and loaded on startup
- **Pattern Recognition**: Detects systematic deviations and triggers escalation
- **Governance Control**: All core AI logic changes require explicit approval
- **Law Compliance**: Full adherence to LAW-001 requirements

## Docker Usage Options

### Option 1: Use Pre-built Image (Recommended)

```bash
# Pull and run from Docker Hub
docker run -i --rm --network host \
  -e OLLAMA_API=http://localhost:11434 \
  docker.io/mup1987/ollama-mcp-server:latest
```

### Option 2: Build Your Own Image

```bash
# Clone, build, and run locally
git clone https://github.com/mupoese/Ollama-MCP-Server.git
cd Ollama-MCP-Server
docker build -t my-ollama-mcp-server .
docker run -i --rm --network host \
  -e OLLAMA_API=http://localhost:11434 \
  my-ollama-mcp-server
```

### Option 3: Docker Compose (Production)

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  ollama-mcp-server:
    image: docker.io/mup1987/ollama-mcp-server:latest
    environment:
      - OLLAMA_API=http://host.docker.internal:11434
    stdin_open: true
    restart: unless-stopped
    depends_on:
      - ollama
  
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped

volumes:
  ollama_data:
```

Run with: `docker-compose up -d`

---

## Overview

**Ollama-MCP-Server** is a custom, extensible MCP (Model Context Protocol) server that bridges local or remote Ollama LLM models with any MCP-compatible application, such as Claude Desktop.  
This project offers maximum flexibility, privacy, open source usage, and professional integration.

---

## Changelog

### v1.0.0

- First stable release
- Full MCP protocol support with JSON-RPC over stdin/stdout
- **ES Modules**: Converted from CommonJS to ES modules for MCP SDK compatibility
- Docker support for Windows, Mac, and Linux
- Integration instructions for Claude Desktop
- Complete error handling and logging
- **SILENCE_STARTUP support**: Prevents stdout pollution that breaks MCP protocol
- Proper MCP SDK implementation with `@modelcontextprotocol/sdk`

---

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

| Tool Name           | Description                              |
| ------------------- | ---------------------------------------- |
| `ollama_list_models`| List all available Ollama models        |
| `ollama_chat`       | Chat with an Ollama model               |
| `ollama_generate`   | Generate text with an Ollama model      |
| `ollama_pull_model` | Pull/download a model from registry     |

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
