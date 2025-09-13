# MCP Ollama Server

[![CI/CD Pipeline](https://github.com/mupoese/Ollama-MCP-Server/actions/workflows/ci.yml/badge.svg)](https://github.com/mupoese/Ollama-MCP-Server/actions/workflows/ci.yml)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://hub.docker.com/)
[![License: GPL v2](https://img.shields.io/badge/License-GPL_v2-blue.svg)](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html)

> **Python-based MCP DevOps Tools Server with Multi-Agent Ollama Integration**

A comprehensive Model Context Protocol (MCP) server that provides AI models with access to essential DevOps tools through a unified interface. Features multi-agent Ollama support, GitHub API integration, browser automation, and MCP Gateway functionality.

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/mupoese/Ollama-MCP-Server.git
cd Ollama-MCP-Server

# One-command setup
make quickstart

# Or Docker start
make docker-start
```

## 📋 Features

- **28 DevOps Tools** across 6 categories (ollama, infrastructure, git, github, browser, mcp_gateway)
- **Multi-Agent Ollama** support with up to 8 specialized endpoints
- **GitHub API Integration** with 7 core repository management tools
- **Playwright Browser Automation** with 9 web interaction tools
- **MCP Gateway Functionality** for multi-server orchestration
- **Production-Ready Docker** containers with multi-stage builds
- **Comprehensive Testing** framework with verified tool execution

## 📁 Repository Structure

```
/
├── src/                        # Python source code
│   └── ollama_mcp_server/     # Main application
├── tests/                     # Test files (python/ and legacy/)
├── docs/                      # All documentation
├── scripts/                   # Automation scripts
├── docker/                    # Docker files and compose
├── config/                    # Configuration files
└── .vscode/                   # VS Code workspace
```

## 📖 Documentation

- **[Main Documentation](docs/README.md)** - Complete setup and usage guide
- **[Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)** - Technical details
- **[MCP Gateway Functions](docs/MCP_GATEWAY_FUNCTIONS.md)** - Gateway documentation
- **[CI/CD Setup](docs/CI_DOCKER_SETUP.md)** - Build and deployment

## 🛠️ Development Commands

```bash
make help              # Show all available commands
make setup             # Setup development environment
make dev               # Start development server
make test              # Run tests
make docker-build      # Build Docker images
make gateway-demo      # Try MCP Gateway
```

## 🐳 Docker Usage

```bash
# Quick Docker start
make docker-start

# Or manual Docker
docker-compose -f docker/docker-compose.yml up -d
```

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/mupoese/Ollama-MCP-Server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mupoese/Ollama-MCP-Server/discussions)

---

**Note**: This repository was recently reorganized for better structure. Legacy Node.js files are preserved in the `legacy/` directory.