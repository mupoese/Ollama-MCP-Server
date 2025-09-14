"""
Main entry point for MCP DevOps Server

This module provides the CLI interface and main execution entry point.
"""

import asyncio
import sys
from pathlib import Path
from typing import Optional
import click
import structlog

from .config import DevOpsConfig, get_config, set_config
from .server.mcp_server import MCPDevOpsServer
from .utils.logging import setup_logging, get_app_logger


@click.group()
@click.option(
    "--config",
    "-c",
    type=click.Path(exists=True, path_type=Path),
    help="Path to configuration file (YAML)",
)
@click.option(
    "--debug",
    is_flag=True,
    help="Enable debug logging",
)
@click.option(
    "--environment",
    type=click.Choice(["development", "staging", "production"]),
    help="Environment to run in",
)
@click.pass_context
def cli(ctx, config: Optional[Path], debug: bool, environment: Optional[str]):
    """MCP DevOps Server - Python-based Model Context Protocol server for DevOps tools"""

    # Load configuration
    if config:
        try:
            devops_config = DevOpsConfig.from_yaml(config)
        except Exception as e:
            click.echo(f"Error loading configuration: {e}", err=True)
            sys.exit(1)
    else:
        devops_config = DevOpsConfig.from_env()

    # Apply CLI overrides
    if debug:
        devops_config.debug = True
        devops_config.log_level = "DEBUG"

    if environment:
        devops_config.environment = environment

    # Set global configuration
    set_config(devops_config)

    # Setup logging
    setup_logging()

    # Store config in context
    ctx.ensure_object(dict)
    ctx.obj["config"] = devops_config


@cli.command()
@click.option(
    "--transport",
    type=click.Choice(["stdio", "http"]),
    help="Transport type to use",
)
@click.option(
    "--host",
    default="0.0.0.0",
    help="Host to bind to (HTTP transport only)",
)
@click.option(
    "--port",
    default=8000,
    type=int,
    help="Port to bind to (HTTP transport only)",
)
@click.pass_context
def serve(ctx, transport: Optional[str], host: str, port: int):
    """Start the MCP DevOps Server"""

    config: DevOpsConfig = ctx.obj["config"]
    logger = get_app_logger()

    # Apply CLI overrides
    if transport:
        config.transport_type = transport
    if transport == "http":
        config.http_host = host
        config.http_port = port

    logger.info(
        "Starting MCP DevOps Server",
        version=config.server_version,
        environment=config.environment,
        transport=config.transport_type,
        debug=config.debug,
    )

    try:
        server = MCPDevOpsServer(config)
        asyncio.run(server.run())
    except KeyboardInterrupt:
        logger.info("Received interrupt signal, shutting down...")
    except Exception as e:
        logger.error("Server failed to start", error=str(e), exc_info=True)
        sys.exit(1)


@cli.command()
@click.pass_context
def health(ctx):
    """Check server health"""

    config: DevOpsConfig = ctx.obj["config"]

    async def check_health():
        server = MCPDevOpsServer(config)
        await server.initialize()
        health_data = await server.health_check()
        await server.shutdown()
        return health_data

    try:
        health_data = asyncio.run(check_health())

        # Format output
        status = health_data["status"]
        server_info = health_data["server"]
        tools_info = health_data["tools"]

        click.echo(f"Server Status: {status}")
        click.echo(f"Server Name: {server_info['name']}")
        click.echo(f"Version: {server_info['version']}")
        click.echo(f"Environment: {server_info['environment']}")
        click.echo(f"Tools: {tools_info['healthy']}/{tools_info['total']} healthy")

        if tools_info["unhealthy"] > 0:
            click.echo("\nUnhealthy tools:")
            for tool_name, healthy in tools_info["details"].items():
                if not healthy:
                    click.echo(f"  - {tool_name}")

        if status != "healthy":
            sys.exit(1)

    except Exception as e:
        click.echo(f"Health check failed: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.option(
    "--category",
    help="Filter tools by category",
)
@click.pass_context
def list_tools(ctx, category: Optional[str]):
    """List available tools"""

    config: DevOpsConfig = ctx.obj["config"]

    async def get_tools():
        server = MCPDevOpsServer(config)
        await server.initialize()

        if category:
            tools = server.tool_registry.list_tools(category)
            categories = [category]
        else:
            tools = server.tool_registry.list_tools()
            categories = server.tool_registry.list_categories()

        await server.shutdown()
        return tools, categories

    try:
        tools, categories = asyncio.run(get_tools())

        if category:
            click.echo(f"Tools in category '{category}':")
        else:
            click.echo("Available tools:")
            click.echo(f"Categories: {', '.join(categories)}")
            click.echo()

        for tool in tools:
            click.echo(f"  {tool.name}")
            click.echo(f"    Description: {tool.description}")
            click.echo()

    except Exception as e:
        click.echo(f"Failed to list tools: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.pass_context
def validate_config(ctx):
    """Validate configuration"""

    config: DevOpsConfig = ctx.obj["config"]

    click.echo("Configuration validation:")
    click.echo(f"✓ Server name: {config.server_name}")
    click.echo(f"✓ Version: {config.server_version}")
    click.echo(f"✓ Environment: {config.environment}")
    click.echo(f"✓ Transport: {config.transport_type}")
    click.echo(f"✓ Log level: {config.log_level}")
    click.echo(f"✓ Debug mode: {config.debug}")

    # Validate Ollama configuration
    click.echo(f"✓ Ollama API: {config.ollama.api_url}")
    click.echo(f"✓ Ollama timeout: {config.ollama.timeout}s")

    # Validate tool configuration
    click.echo(f"✓ Tool timeout: {config.tools.execution_timeout}s")
    click.echo(f"✓ Max concurrent tools: {config.tools.max_concurrent_tools}")
    click.echo(f"✓ Caching enabled: {config.tools.enable_caching}")

    click.echo("\nConfiguration is valid ✓")


@cli.command()
@click.argument("output", type=click.Path(path_type=Path))
@click.pass_context
def export_config(ctx, output: Path):
    """Export current configuration to YAML file"""

    config: DevOpsConfig = ctx.obj["config"]

    try:
        import yaml

        config_dict = config.to_dict()

        with open(output, "w") as f:
            yaml.dump(config_dict, f, default_flow_style=False, indent=2)

        click.echo(f"Configuration exported to {output}")

    except Exception as e:
        click.echo(f"Failed to export configuration: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.pass_context
def version(ctx):
    """Show version information"""

    config: DevOpsConfig = ctx.obj["config"]

    click.echo(f"MCP DevOps Server {config.server_version}")
    click.echo(f"Python {sys.version}")
    click.echo(f"Environment: {config.environment}")


def main():
    """Main entry point for the CLI"""
    cli()


if __name__ == "__main__":
    main()
