"""
Tool registry for MCP DevOps Server

This module provides tool registration, discovery, and management capabilities.
"""

import asyncio
from typing import Dict, List, Optional, Type, Any
import structlog

from .base_tool import BaseTool, ToolSchema, ToolResult, ToolExecutionContext
from ..config import get_config


class ToolRegistry:
    """
    Central registry for all MCP DevOps tools
    
    Manages tool registration, discovery, validation, and execution routing.
    """
    
    def __init__(self):
        self.config = get_config()
        self.logger = structlog.get_logger("ToolRegistry")
        self._tools: Dict[str, BaseTool] = {}
        self._tool_classes: Dict[str, Type[BaseTool]] = {}
        self._categories: Dict[str, List[str]] = {}
    
    def register_tool(self, tool_class: Type[BaseTool], category: str = "general") -> None:
        """
        Register a tool class
        
        Args:
            tool_class: Tool class to register
            category: Tool category for organization
        """
        # Instantiate the tool
        tool_instance = tool_class()
        tool_name = tool_instance.name
        
        if tool_name in self._tools:
            self.logger.warning(
                "Tool already registered, overwriting",
                tool_name=tool_name,
                category=category,
            )
        
        self._tools[tool_name] = tool_instance
        self._tool_classes[tool_name] = tool_class
        
        # Add to category
        if category not in self._categories:
            self._categories[category] = []
        if tool_name not in self._categories[category]:
            self._categories[category].append(tool_name)
        
        self.logger.info(
            "Tool registered successfully",
            tool_name=tool_name,
            category=category,
            tool_class=tool_class.__name__,
        )
    
    def unregister_tool(self, tool_name: str) -> bool:
        """
        Unregister a tool
        
        Args:
            tool_name: Name of tool to unregister
            
        Returns:
            True if tool was unregistered
        """
        if tool_name not in self._tools:
            return False
        
        # Remove from tools
        del self._tools[tool_name]
        del self._tool_classes[tool_name]
        
        # Remove from categories
        for category, tools in self._categories.items():
            if tool_name in tools:
                tools.remove(tool_name)
        
        self.logger.info("Tool unregistered", tool_name=tool_name)
        return True
    
    def get_tool(self, tool_name: str) -> Optional[BaseTool]:
        """
        Get a tool instance by name
        
        Args:
            tool_name: Name of the tool
            
        Returns:
            Tool instance or None if not found
        """
        return self._tools.get(tool_name)
    
    def list_tools(self, category: Optional[str] = None) -> List[ToolSchema]:
        """
        List all registered tools or tools in a specific category
        
        Args:
            category: Optional category filter
            
        Returns:
            List of tool schemas
        """
        if category:
            tool_names = self._categories.get(category, [])
            tools = [self._tools[name] for name in tool_names if name in self._tools]
        else:
            tools = list(self._tools.values())
        
        return [tool.schema for tool in tools]
    
    def list_categories(self) -> List[str]:
        """
        List all tool categories
        
        Returns:
            List of category names
        """
        return list(self._categories.keys())
    
    def get_tools_by_category(self, category: str) -> List[str]:
        """
        Get tool names in a specific category
        
        Args:
            category: Category name
            
        Returns:
            List of tool names
        """
        return self._categories.get(category, []).copy()
    
    def is_tool_registered(self, tool_name: str) -> bool:
        """
        Check if a tool is registered
        
        Args:
            tool_name: Name of the tool
            
        Returns:
            True if tool is registered
        """
        return tool_name in self._tools
    
    async def execute_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        context: Optional[ToolExecutionContext] = None,
    ) -> ToolResult:
        """
        Execute a tool by name
        
        Args:
            tool_name: Name of the tool to execute
            arguments: Tool arguments
            context: Execution context
            
        Returns:
            Tool execution result
            
        Raises:
            ValueError: If tool is not found
        """
        tool = self.get_tool(tool_name)
        if tool is None:
            raise ValueError(f"Tool not found: {tool_name}")
        
        return await tool.execute(arguments, context)
    
    async def health_check_all(self) -> Dict[str, bool]:
        """
        Perform health checks on all registered tools
        
        Returns:
            Dictionary mapping tool names to health status
        """
        self.logger.info("Starting health check for all tools")
        
        health_results = {}
        
        # Run health checks concurrently for better performance
        async def check_tool(tool_name: str, tool: BaseTool) -> tuple[str, bool]:
            try:
                result = await tool.health_check()
                return tool_name, result
            except Exception as e:
                self.logger.error(
                    "Health check exception",
                    tool_name=tool_name,
                    error=str(e),
                )
                return tool_name, False
        
        # Create tasks for all tools
        tasks = [
            check_tool(tool_name, tool)
            for tool_name, tool in self._tools.items()
        ]
        
        # Execute health checks with a reasonable timeout
        try:
            results = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=30.0,  # 30 second timeout for all health checks
            )
            
            for result in results:
                if isinstance(result, tuple):
                    tool_name, health_status = result
                    health_results[tool_name] = health_status
                else:
                    # Exception occurred
                    self.logger.error("Health check task failed", error=str(result))
                    
        except asyncio.TimeoutError:
            self.logger.error("Health check timed out")
            # Mark remaining tools as unhealthy
            for tool_name in self._tools:
                if tool_name not in health_results:
                    health_results[tool_name] = False
        
        # Log summary
        healthy_count = sum(1 for status in health_results.values() if status)
        total_count = len(health_results)
        
        self.logger.info(
            "Health check completed",
            healthy_tools=healthy_count,
            total_tools=total_count,
            unhealthy_tools=[
                name for name, status in health_results.items() if not status
            ],
        )
        
        return health_results
    
    def clear_all_caches(self) -> None:
        """Clear caches for all tools"""
        for tool in self._tools.values():
            tool.clear_cache()
        
        self.logger.info("Cleared caches for all tools")
    
    def get_tool_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about registered tools
        
        Returns:
            Dictionary with tool statistics
        """
        total_tools = len(self._tools)
        categories_stats = {
            category: len(tools) for category, tools in self._categories.items()
        }
        
        return {
            "total_tools": total_tools,
            "categories": categories_stats,
            "tool_names": list(self._tools.keys()),
        }
    
    def validate_tool_exists(self, tool_name: str) -> None:
        """
        Validate that a tool exists
        
        Args:
            tool_name: Name of the tool
            
        Raises:
            ValueError: If tool doesn't exist
        """
        if not self.is_tool_registered(tool_name):
            available_tools = list(self._tools.keys())
            raise ValueError(
                f"Tool '{tool_name}' not found. "
                f"Available tools: {', '.join(available_tools)}"
            )


# Global tool registry instance
_registry: Optional[ToolRegistry] = None


def get_tool_registry() -> ToolRegistry:
    """Get the global tool registry instance"""
    global _registry
    if _registry is None:
        _registry = ToolRegistry()
    return _registry


def register_tool(tool_class: Type[BaseTool], category: str = "general") -> None:
    """Convenience function to register a tool"""
    registry = get_tool_registry()
    registry.register_tool(tool_class, category)


def auto_discover_tools() -> None:
    """
    Auto-discover and register all available tools
    
    This function will be called during server startup to automatically
    register all available tool implementations.
    """
    registry = get_tool_registry()
    logger = structlog.get_logger("auto_discover")
    
    logger.info("Starting auto-discovery of tools")
    
    # Import and register tool modules
    # This will be expanded as we add more tool categories
    
    try:
        # Ollama tools
        from .ollama import (
            OllamaListModels, OllamaChat, OllamaGenerate, OllamaPullModel,
            OllamaManageAgents
        )
        registry.register_tool(OllamaListModels, "ollama")
        registry.register_tool(OllamaChat, "ollama")
        registry.register_tool(OllamaGenerate, "ollama")
        registry.register_tool(OllamaPullModel, "ollama")
        registry.register_tool(OllamaManageAgents, "ollama")
        
    except ImportError as e:
        logger.warning("Could not import Ollama tools", error=str(e))
    
    try:
        # Infrastructure tools
        from .infrastructure import DockerListContainers, DockerRunContainer, KubernetesListPods
        registry.register_tool(DockerListContainers, "infrastructure")
        registry.register_tool(DockerRunContainer, "infrastructure")
        registry.register_tool(KubernetesListPods, "infrastructure")
        
    except ImportError as e:
        logger.warning("Could not import infrastructure tools", error=str(e))
    
    try:
        # Git tools
        from .git import GitStatus, GitClone, GitCommit, GitBranch
        registry.register_tool(GitStatus, "git")
        registry.register_tool(GitClone, "git")
        registry.register_tool(GitCommit, "git")
        registry.register_tool(GitBranch, "git")
        
    except ImportError as e:
        logger.warning("Could not import Git tools", error=str(e))
    
    try:
        # GitHub tools
        from .github import (
            GitHubGetFileContents, GitHubGetCommit, GitHubListCommits,
            GitHubListBranches, GitHubSearchRepositories, GitHubGetIssue,
            GitHubListPullRequests
        )
        registry.register_tool(GitHubGetFileContents, "github")
        registry.register_tool(GitHubGetCommit, "github")
        registry.register_tool(GitHubListCommits, "github")
        registry.register_tool(GitHubListBranches, "github")
        registry.register_tool(GitHubSearchRepositories, "github")
        registry.register_tool(GitHubGetIssue, "github")
        registry.register_tool(GitHubListPullRequests, "github")
        
    except ImportError as e:
        logger.warning("Could not import GitHub tools", error=str(e))
    
    try:
        # Playwright browser automation tools
        from .playwright import (
            PlaywrightNavigate, PlaywrightTakeScreenshot, PlaywrightClick,
            PlaywrightType, PlaywrightWaitFor, PlaywrightGetText,
            PlaywrightFillForm, PlaywrightEvaluate, PlaywrightGetPageInfo
        )
        registry.register_tool(PlaywrightNavigate, "browser")
        registry.register_tool(PlaywrightTakeScreenshot, "browser")
        registry.register_tool(PlaywrightClick, "browser")
        registry.register_tool(PlaywrightType, "browser")
        registry.register_tool(PlaywrightWaitFor, "browser")
        registry.register_tool(PlaywrightGetText, "browser")
        registry.register_tool(PlaywrightFillForm, "browser")
        registry.register_tool(PlaywrightEvaluate, "browser")
        registry.register_tool(PlaywrightGetPageInfo, "browser")
        
    except ImportError as e:
        logger.warning("Could not import Playwright tools", error=str(e))
    
    # Log final statistics
    stats = registry.get_tool_statistics()
    logger.info(
        "Tool auto-discovery completed",
        total_tools=stats["total_tools"],
        categories=list(stats["categories"].keys()),
    )