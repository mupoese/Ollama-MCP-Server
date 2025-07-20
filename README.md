# Ollama-MCP-Server

**Author/Maintainer:** [Mupoese](https://github.com/mupoese)  
**Version:** v1.0.0  
**License:** GNU General Public License v2.0

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
- Docker support for Windows, Mac, and Linux
- Integration instructions for Claude Desktop
- Complete error handling and logging
- Proper MCP SDK implementation

---

## Key Features

- **Proper MCP Protocol**: Implements JSON-RPC over stdin/stdout (not HTTP REST)
- **MCP Tools**: List models, chat, generate text, pull models
- **Docker Support**: Ready-to-deploy container
- **Environment Variables**: Configure via Docker `-e` or local `.env`
- **Claude Desktop Integration**: Works seamlessly with Claude Desktop
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
docker run -i --rm --network host \
  -e OLLAMA_API=http://localhost:11434 \
  ollama-mcp-server

# Test with Docker (Windows PowerShell - single line)
docker run -i --rm --network host -e OLLAMA_API=http://localhost:11434 ollama-mcp-server
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

**Using Pre-built Docker Image:**
```json
{
  "mcpServers": {
    "ollama": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--network", "host",
        "-e", "OLLAMA_API=http://localhost:11434",
        "docker.io/mup1987/ollama-mcp-server:latest"
      ]
    }
  }
}
```

**Using Local Docker Build:**
```json
{
  "mcpServers": {
    "ollama": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--network", "host",
        "-e", "OLLAMA_API=http://localhost:11434",
        "ollama-mcp-server"
      ]
    }
  }
}
```

**Windows PowerShell Users:** Use this single-line format:
```json
{
  "mcpServers": {
    "ollama": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "--network", "host", "-e", "OLLAMA_API=http://localhost:11434", "docker.io/mup1987/ollama-mcp-server:latest"]
    }
  }
}
```

### Platform-Specific OLLAMA_API Settings

| Platform        | OLLAMA_API Setting                       |
| --------------- | ---------------------------------------- |
| **All Platforms** | `http://localhost:11434`               |

> **Note**: Using localhost assumes Ollama is running on your host machine on port 11434.

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
├── server.js              # Main MCP server implementation
├── package.json            # Dependencies and project info
├── Dockerfile              # Docker build instructions
├── LICENSE                 # GPL v2.0 license
├── README.md              # This file
└── .env.example           # Environment variables example
```

---

## Troubleshooting

### Common Issues

**Q: MCP server times out during initialization**  
**A:** Ensure the server implements proper MCP protocol (JSON-RPC over stdin/stdout), not HTTP REST. Check that Ollama is running on the specified API endpoint.

**Q: "Unexpected token" JSON parsing error**  
**A:** The server is sending non-JSON output to stdout. All logging must go to stderr, not stdout.

**Q: Docker container can't connect to Ollama**  
**A:** Check your `OLLAMA_API` setting. Use `host.docker.internal` for Windows/Mac, or find your Docker bridge IP on Linux.

**Q: Claude Desktop doesn't show the MCP server**  
**A:** Verify your `claude_desktop_config.json` syntax and restart Claude Desktop. Check the MCP server logs for errors.

### Debug Steps

1. **Test Ollama directly:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Check Docker connectivity:**
   ```bash
   docker run --rm alpine ping host.docker.internal
   ```

3. **View MCP server logs:**
   Check Claude Desktop developer tools or console for MCP connection logs.

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
