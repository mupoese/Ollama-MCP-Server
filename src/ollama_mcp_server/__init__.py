"""
MCP DevOps Server

A Python-based Model Context Protocol server that provides AI models with access
to essential DevOps tools through a unified interface. This server maintains
compatibility with Ollama while expanding to include comprehensive DevOps
tooling capabilities.

Features:
- Infrastructure Management (Docker, Kubernetes, Terraform, Cloud APIs)
- Code & Repository Management (Git, GitHub/GitLab, Code Analysis)
- Monitoring & Observability (Prometheus, logs, health checks, alerting)
- Security & Compliance (vulnerability scanning, secret management)
- Development & Debugging (API testing, database ops, file system, network)

Author: mupoese
License: GPL-2.0
Version: 2.0.0
"""

__version__ = "2.0.0"
__author__ = "mupoese"
__license__ = "GPL-2.0"

# Only import configuration by default to avoid dependency issues
from .config.settings import DevOpsConfig

def get_server():
    """Lazy import server to avoid dependency issues"""
    from .server.mcp_server import MCPDevOpsServer
    return MCPDevOpsServer

def get_tool_registry():
    """Lazy import tool registry to avoid dependency issues"""
    from .tools.registry import ToolRegistry
    return ToolRegistry

__all__ = [
    "DevOpsConfig",
    "get_server",
    "get_tool_registry", 
    "__version__",
    "__author__",
    "__license__",
]