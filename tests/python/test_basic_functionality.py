"""
Basic tests for MCP DevOps Server Python implementation

These tests validate the core functionality and ensure the migration
from Node.js is working correctly.
"""

import pytest
import asyncio
from unittest.mock import Mock, patch
from pathlib import Path

from mcp_devops_server.config import DevOpsConfig, get_config
from mcp_devops_server.tools.registry import ToolRegistry, get_tool_registry
from mcp_devops_server.tools.base_tool import BaseTool, ToolResult
from mcp_devops_server.tools.ollama import OllamaListModels, OllamaChat
from mcp_devops_server.server.mcp_server import MCPDevOpsServer


class TestDevOpsConfig:
    """Test configuration management"""
    
    def test_default_config(self):
        """Test default configuration values"""
        config = DevOpsConfig()
        
        assert config.server_name == "mcp-devops-server"
        assert config.server_version == "2.0.0"
        assert config.environment == "development"
        assert config.transport_type == "stdio"
        assert config.ollama.api_url == "http://localhost:11434"
        assert config.tools.execution_timeout == 300
        assert config.security.audit_logging is True
    
    def test_environment_validation(self):
        """Test environment validation"""
        with pytest.raises(ValueError):
            DevOpsConfig(environment="invalid")
    
    def test_transport_validation(self):
        """Test transport type validation"""
        with pytest.raises(ValueError):
            DevOpsConfig(transport_type="invalid")
    
    def test_log_level_validation(self):
        """Test log level validation"""
        with pytest.raises(ValueError):
            DevOpsConfig(log_level="INVALID")
    
    def test_production_check(self):
        """Test production environment check"""
        config = DevOpsConfig(environment="production")
        assert config.is_production() is True
        assert config.is_development() is False
    
    def test_development_check(self):
        """Test development environment check"""
        config = DevOpsConfig(environment="development")
        assert config.is_production() is False
        assert config.is_development() is True


class MockTool(BaseTool):
    """Mock tool for testing"""
    
    @property
    def name(self) -> str:
        return "mock_tool"
    
    @property
    def description(self) -> str:
        return "A mock tool for testing"
    
    @property
    def input_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "test_param": {
                    "type": "string",
                    "description": "Test parameter",
                }
            },
            "required": ["test_param"],
        }
    
    async def _execute(self, arguments: dict) -> dict:
        return {"result": f"Mock executed with {arguments.get('test_param')}"}


class TestToolRegistry:
    """Test tool registry functionality"""
    
    def test_tool_registration(self):
        """Test tool registration"""
        registry = ToolRegistry()
        
        registry.register_tool(MockTool, "test")
        
        assert registry.is_tool_registered("mock_tool")
        assert "test" in registry.list_categories()
        assert "mock_tool" in registry.get_tools_by_category("test")
    
    def test_tool_unregistration(self):
        """Test tool unregistration"""
        registry = ToolRegistry()
        
        registry.register_tool(MockTool, "test")
        assert registry.is_tool_registered("mock_tool")
        
        success = registry.unregister_tool("mock_tool")
        assert success is True
        assert not registry.is_tool_registered("mock_tool")
    
    def test_tool_listing(self):
        """Test tool listing"""
        registry = ToolRegistry()
        
        registry.register_tool(MockTool, "test")
        
        tools = registry.list_tools()
        assert len(tools) == 1
        assert tools[0].name == "mock_tool"
        
        test_tools = registry.list_tools("test")
        assert len(test_tools) == 1
        
        empty_tools = registry.list_tools("nonexistent")
        assert len(empty_tools) == 0
    
    def test_tool_validation(self):
        """Test tool validation"""
        registry = ToolRegistry()
        
        with pytest.raises(ValueError, match="Tool 'nonexistent' not found"):
            registry.validate_tool_exists("nonexistent")
        
        registry.register_tool(MockTool, "test")
        registry.validate_tool_exists("mock_tool")  # Should not raise
    
    @pytest.mark.asyncio
    async def test_tool_execution(self):
        """Test tool execution through registry"""
        registry = ToolRegistry()
        registry.register_tool(MockTool, "test")
        
        result = await registry.execute_tool(
            "mock_tool",
            {"test_param": "hello"}
        )
        
        assert result.success is True
        assert result.data["result"] == "Mock executed with hello"
        assert result.execution_time is not None
    
    @pytest.mark.asyncio
    async def test_tool_execution_invalid_tool(self):
        """Test tool execution with invalid tool"""
        registry = ToolRegistry()
        
        with pytest.raises(ValueError, match="Tool not found"):
            await registry.execute_tool("nonexistent", {})


class TestBaseTool:
    """Test base tool functionality"""
    
    @pytest.mark.asyncio
    async def test_tool_execution_success(self):
        """Test successful tool execution"""
        tool = MockTool()
        
        result = await tool.execute({"test_param": "test"})
        
        assert result.success is True
        assert result.data["result"] == "Mock executed with test"
        assert result.error is None
        assert result.execution_time > 0
    
    @pytest.mark.asyncio
    async def test_tool_execution_validation_error(self):
        """Test tool execution with validation error"""
        tool = MockTool()
        
        # Test with invalid arguments type
        result = await tool.execute("invalid")
        
        assert result.success is False
        assert result.error is not None
        assert "must be a dictionary" in result.error
    
    @pytest.mark.asyncio
    async def test_tool_caching(self):
        """Test tool result caching"""
        tool = MockTool()
        
        # Enable caching
        tool.config.tools.enable_caching = True
        
        # First execution
        result1 = await tool.execute({"test_param": "cached"})
        assert result1.success is True
        
        # Second execution (should be cached)
        result2 = await tool.execute({"test_param": "cached"})
        assert result2.success is True
        assert result2.metadata.get("cached") is True
    
    def test_cache_key_generation(self):
        """Test cache key generation"""
        tool = MockTool()
        
        key1 = tool.get_cache_key({"param": "value"})
        key2 = tool.get_cache_key({"param": "value"})
        key3 = tool.get_cache_key({"param": "different"})
        
        assert key1 == key2  # Same arguments should generate same key
        assert key1 != key3  # Different arguments should generate different keys
    
    @pytest.mark.asyncio
    async def test_health_check(self):
        """Test tool health check"""
        tool = MockTool()
        
        health = await tool.health_check()
        assert health is True  # Default implementation returns True


class TestOllamaTools:
    """Test Ollama tool implementations"""
    
    def test_ollama_list_models_schema(self):
        """Test Ollama list models tool schema"""
        tool = OllamaListModels()
        
        assert tool.name == "ollama_list_models"
        assert "List all available Ollama models" in tool.description
        assert tool.input_schema["type"] == "object"
        assert tool.input_schema["properties"] == {}
    
    def test_ollama_chat_schema(self):
        """Test Ollama chat tool schema"""
        tool = OllamaChat()
        
        assert tool.name == "ollama_chat"
        assert "Chat with an Ollama model" in tool.description
        
        schema = tool.input_schema
        assert "model" in schema["required"]
        assert "messages" in schema["required"]
        assert schema["properties"]["model"]["type"] == "string"
        assert schema["properties"]["messages"]["type"] == "array"
    
    @pytest.mark.asyncio
    async def test_ollama_health_check_no_server(self):
        """Test Ollama health check when server is not available"""
        tool = OllamaListModels()
        
        # This should return False since no Ollama server is running
        health = await tool.health_check()
        assert health is False


class TestMCPDevOpsServer:
    """Test MCP DevOps Server"""
    
    @pytest.mark.asyncio
    async def test_server_initialization(self):
        """Test server initialization"""
        config = DevOpsConfig(environment="development")
        server = MCPDevOpsServer(config)
        
        # Test initialization
        await server.initialize()
        
        # Check that tools were registered
        stats = server.tool_registry.get_tool_statistics()
        assert stats["total_tools"] > 0
        
        # Cleanup
        await server.shutdown()
    
    def test_server_creation(self):
        """Test MCP server creation"""
        config = DevOpsConfig()
        server = MCPDevOpsServer(config)
        
        mcp_server = server.create_server()
        assert mcp_server is not None
    
    @pytest.mark.asyncio
    async def test_health_check(self):
        """Test server health check"""
        config = DevOpsConfig(environment="development")
        server = MCPDevOpsServer(config)
        
        await server.initialize()
        
        health_data = await server.health_check()
        
        assert "status" in health_data
        assert "server" in health_data
        assert "tools" in health_data
        
        server_info = health_data["server"]
        assert server_info["name"] == config.server_name
        assert server_info["version"] == config.server_version
        
        await server.shutdown()


class TestIntegration:
    """Integration tests"""
    
    @pytest.mark.asyncio
    async def test_end_to_end_tool_execution(self):
        """Test end-to-end tool execution"""
        config = DevOpsConfig(environment="development")
        server = MCPDevOpsServer(config)
        
        await server.initialize()
        
        # Register our mock tool
        server.tool_registry.register_tool(MockTool, "test")
        
        # Execute tool through the registry
        result = await server.tool_registry.execute_tool(
            "mock_tool",
            {"test_param": "integration_test"}
        )
        
        assert result.success is True
        assert "integration_test" in result.data["result"]
        
        await server.shutdown()
    
    def test_configuration_loading(self):
        """Test configuration loading and environment variables"""
        import os
        
        # Set environment variables
        os.environ["MCP_DEVOPS_SERVER_NAME"] = "test-server"
        os.environ["MCP_DEVOPS_DEBUG"] = "true"
        os.environ["MCP_DEVOPS_OLLAMA__API_URL"] = "http://test:11434"
        
        try:
            config = DevOpsConfig.from_env()
            
            assert config.server_name == "test-server"
            assert config.debug is True
            assert config.ollama.api_url == "http://test:11434"
        finally:
            # Clean up environment variables
            for key in ["MCP_DEVOPS_SERVER_NAME", "MCP_DEVOPS_DEBUG", "MCP_DEVOPS_OLLAMA__API_URL"]:
                os.environ.pop(key, None)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])