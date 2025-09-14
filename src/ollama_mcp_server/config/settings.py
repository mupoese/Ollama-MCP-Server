"""
Configuration management for MCP DevOps Server

This module provides comprehensive configuration management with environment
variable support, validation, and type safety using Pydantic.
"""

import os
from pathlib import Path
from typing import Dict, List, Optional, Any

try:
    from pydantic import BaseModel, Field, field_validator
except ImportError:
    from pydantic import BaseModel, Field

    # For older Pydantic versions
    def field_validator(*args, **kwargs):
        def decorator(func):
            return func

        return decorator


try:
    from pydantic_settings import BaseSettings
except ImportError:
    # Fallback to older import
    from pydantic import BaseSettings

import yaml


class OllamaAgentConfig(BaseModel):
    """Configuration for individual Ollama agent/role"""

    api_url: str = Field(description="Ollama API endpoint URL for this agent")
    api_key: Optional[str] = Field(
        default=None, description="API key for this endpoint"
    )
    model: str = Field(description="Model to use for this agent")
    role: str = Field(description="Role/purpose of this agent")
    timeout: int = Field(default=30, description="Request timeout in seconds")
    max_retries: int = Field(default=3, description="Maximum retry attempts")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        valid_roles = [
            "primary",
            "secondary",
            "tertiary",
            "quaternary",
            "quinary",
            "senary",
            "septenary",
            "octonary",
            "analyst",
            "reviewer",
            "validator",
            "executor",
            "monitor",
            "coordinator",
            "specialist",
            "assistant",
        ]
        if v.lower() not in valid_roles:
            raise ValueError(f'role must be one of: {", ".join(valid_roles)}')
        return v.lower()


class OllamaConfig(BaseSettings):
    """MCP Ollama Server configuration with multi-agent support"""

    # Primary endpoint (backward compatibility)
    api_url: str = Field(
        default="http://localhost:11434", description="Primary Ollama API endpoint URL"
    )
    api_key: Optional[str] = Field(default=None, description="Primary API key")
    timeout: int = Field(default=30, description="Request timeout in seconds")
    max_retries: int = Field(default=3, description="Maximum number of retry attempts")
    default_model: str = Field(
        default="llama2", description="Default model for Ollama operations"
    )

    # Multi-agent configuration
    agents: Dict[str, OllamaAgentConfig] = Field(
        default_factory=dict,
        description="Configuration for multiple Ollama agents/endpoints",
    )

    # Auto-configure standard agents from environment
    agent_2_url: Optional[str] = Field(default=None, description="Second agent API URL")
    agent_2_key: Optional[str] = Field(default=None, description="Second agent API key")
    agent_2_model: str = Field(default="llama2", description="Second agent model")
    agent_2_role: str = Field(default="secondary", description="Second agent role")

    agent_3_url: Optional[str] = Field(default=None, description="Third agent API URL")
    agent_3_key: Optional[str] = Field(default=None, description="Third agent API key")
    agent_3_model: str = Field(default="llama2", description="Third agent model")
    agent_3_role: str = Field(default="tertiary", description="Third agent role")

    agent_4_url: Optional[str] = Field(default=None, description="Fourth agent API URL")
    agent_4_key: Optional[str] = Field(default=None, description="Fourth agent API key")
    agent_4_model: str = Field(default="llama2", description="Fourth agent model")
    agent_4_role: str = Field(default="quaternary", description="Fourth agent role")

    agent_5_url: Optional[str] = Field(default=None, description="Fifth agent API URL")
    agent_5_key: Optional[str] = Field(default=None, description="Fifth agent API key")
    agent_5_model: str = Field(default="llama2", description="Fifth agent model")
    agent_5_role: str = Field(default="quinary", description="Fifth agent role")

    agent_6_url: Optional[str] = Field(default=None, description="Sixth agent API URL")
    agent_6_key: Optional[str] = Field(default=None, description="Sixth agent API key")
    agent_6_model: str = Field(default="llama2", description="Sixth agent model")
    agent_6_role: str = Field(default="senary", description="Sixth agent role")

    agent_7_url: Optional[str] = Field(
        default=None, description="Seventh agent API URL"
    )
    agent_7_key: Optional[str] = Field(
        default=None, description="Seventh agent API key"
    )
    agent_7_model: str = Field(default="llama2", description="Seventh agent model")
    agent_7_role: str = Field(default="septenary", description="Seventh agent role")

    agent_8_url: Optional[str] = Field(default=None, description="Eighth agent API URL")
    agent_8_key: Optional[str] = Field(default=None, description="Eighth agent API key")
    agent_8_model: str = Field(default="llama2", description="Eighth agent model")
    agent_8_role: str = Field(default="octonary", description="Eighth agent role")

    def model_post_init(self, __context) -> None:
        """Auto-configure agents from environment variables"""
        # Add primary agent
        if not self.agents.get("primary"):
            self.agents["primary"] = OllamaAgentConfig(
                api_url=self.api_url,
                api_key=self.api_key,
                model=self.default_model,
                role="primary",
                timeout=self.timeout,
                max_retries=self.max_retries,
            )

        # Auto-configure additional agents from environment
        agent_configs = [
            (
                2,
                self.agent_2_url,
                self.agent_2_key,
                self.agent_2_model,
                self.agent_2_role,
            ),
            (
                3,
                self.agent_3_url,
                self.agent_3_key,
                self.agent_3_model,
                self.agent_3_role,
            ),
            (
                4,
                self.agent_4_url,
                self.agent_4_key,
                self.agent_4_model,
                self.agent_4_role,
            ),
            (
                5,
                self.agent_5_url,
                self.agent_5_key,
                self.agent_5_model,
                self.agent_5_role,
            ),
            (
                6,
                self.agent_6_url,
                self.agent_6_key,
                self.agent_6_model,
                self.agent_6_role,
            ),
            (
                7,
                self.agent_7_url,
                self.agent_7_key,
                self.agent_7_model,
                self.agent_7_role,
            ),
            (
                8,
                self.agent_8_url,
                self.agent_8_key,
                self.agent_8_model,
                self.agent_8_role,
            ),
        ]

        for num, url, key, model, role in agent_configs:
            if url and not self.agents.get(f"agent_{num}"):
                self.agents[f"agent_{num}"] = OllamaAgentConfig(
                    api_url=url,
                    api_key=key,
                    model=model,
                    role=role,
                    timeout=self.timeout,
                    max_retries=self.max_retries,
                )

    def get_agent_by_role(self, role: str) -> Optional[OllamaAgentConfig]:
        """Get agent configuration by role"""
        for agent in self.agents.values():
            if agent.role == role.lower():
                return agent
        return None

    def get_available_agents(self) -> List[str]:
        """Get list of available agent names"""
        return list(self.agents.keys())

    def get_agents_by_role(self) -> Dict[str, OllamaAgentConfig]:
        """Get agents organized by role"""
        return {agent.role: agent for agent in self.agents.values()}

    class Config:
        env_prefix = "OLLAMA_"
        case_sensitive = False


class SecurityConfig(BaseSettings):
    """Security and authentication configuration"""

    api_key_management: bool = Field(
        default=True, description="Enable API key management"
    )
    role_based_access: bool = Field(
        default=True, description="Enable role-based access control"
    )
    audit_logging: bool = Field(
        default=True, description="Enable audit logging for tool executions"
    )
    input_sanitization: bool = Field(
        default=True, description="Enable input sanitization"
    )
    max_input_size: int = Field(
        default=1048576, description="Maximum input size in bytes"  # 1MB
    )

    class Config:
        env_prefix = "SECURITY_"
        case_sensitive = False


class ToolConfig(BaseSettings):
    """Tool execution configuration"""

    execution_timeout: int = Field(
        default=300,  # 5 minutes
        description="Default tool execution timeout in seconds",
    )
    max_concurrent_tools: int = Field(
        default=10, description="Maximum number of concurrent tool executions"
    )
    enable_caching: bool = Field(
        default=True, description="Enable result caching for expensive operations"
    )
    cache_ttl: int = Field(default=3600, description="Cache TTL in seconds")  # 1 hour

    class Config:
        env_prefix = "TOOL_"
        case_sensitive = False


class InfrastructureConfig(BaseSettings):
    """Infrastructure tool configuration"""

    docker_enabled: bool = Field(default=True, description="Enable Docker tools")
    kubernetes_enabled: bool = Field(
        default=True, description="Enable Kubernetes tools"
    )
    terraform_enabled: bool = Field(default=True, description="Enable Terraform tools")

    # Docker configuration
    docker_socket: str = Field(
        default="unix:///var/run/docker.sock", description="Docker socket path"
    )

    # Kubernetes configuration
    kubeconfig_path: Optional[str] = Field(
        default=None, description="Path to kubeconfig file"
    )
    kubernetes_namespace: str = Field(
        default="default", description="Default Kubernetes namespace"
    )

    class Config:
        env_prefix = "INFRA_"
        case_sensitive = False


class MonitoringConfig(BaseSettings):
    """Monitoring and observability configuration"""

    prometheus_enabled: bool = Field(
        default=True, description="Enable Prometheus tools"
    )
    elasticsearch_enabled: bool = Field(
        default=True, description="Enable Elasticsearch tools"
    )

    # Prometheus configuration
    prometheus_url: str = Field(
        default="http://localhost:9090", description="Prometheus server URL"
    )

    # Elasticsearch configuration
    elasticsearch_url: str = Field(
        default="http://localhost:9200", description="Elasticsearch server URL"
    )

    # Health check configuration
    health_check_interval: int = Field(
        default=60, description="Health check interval in seconds"
    )

    class Config:
        env_prefix = "MONITORING_"
        case_sensitive = False


class DevOpsConfig(BaseSettings):
    """Main configuration class for MCP DevOps Server"""

    # Server configuration
    server_name: str = Field(default="mcp-devops-server", description="Server name")
    server_version: str = Field(default="2.0.0", description="Server version")
    debug: bool = Field(default=False, description="Enable debug logging")
    log_level: str = Field(default="INFO", description="Logging level")

    # Transport configuration
    transport_type: str = Field(
        default="stdio", description="Transport type: stdio or http"
    )
    http_host: str = Field(default="0.0.0.0", description="HTTP server host")
    http_port: int = Field(default=8000, description="HTTP server port")

    # Environment
    environment: str = Field(
        default="development",
        description="Environment: development, staging, production",
    )

    # Sub-configurations
    ollama: OllamaConfig = Field(default_factory=OllamaConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)
    tools: ToolConfig = Field(default_factory=ToolConfig)
    infrastructure: InfrastructureConfig = Field(default_factory=InfrastructureConfig)
    monitoring: MonitoringConfig = Field(default_factory=MonitoringConfig)

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v):
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f'log_level must be one of: {", ".join(valid_levels)}')
        return v.upper()

    @field_validator("transport_type")
    @classmethod
    def validate_transport_type(cls, v):
        valid_types = ["stdio", "http"]
        if v.lower() not in valid_types:
            raise ValueError(f'transport_type must be one of: {", ".join(valid_types)}')
        return v.lower()

    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v):
        valid_envs = ["development", "staging", "production"]
        if v.lower() not in valid_envs:
            raise ValueError(f'environment must be one of: {", ".join(valid_envs)}')
        return v.lower()

    class Config:
        env_prefix = "MCP_DEVOPS_"
        case_sensitive = False
        env_nested_delimiter = "__"

    @classmethod
    def from_yaml(cls, config_path: Path) -> "DevOpsConfig":
        """Load configuration from YAML file"""
        if not config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_path}")

        with open(config_path, "r") as f:
            config_data = yaml.safe_load(f)

        return cls(**config_data)

    @classmethod
    def from_env(cls) -> "DevOpsConfig":
        """Load configuration from environment variables"""
        return cls()

    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary"""
        return self.dict()

    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.environment == "production"

    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.environment == "development"


# Global configuration instance
_config: Optional[DevOpsConfig] = None


def get_config() -> DevOpsConfig:
    """Get the global configuration instance"""
    global _config
    if _config is None:
        _config = DevOpsConfig.from_env()
    return _config


def set_config(config: DevOpsConfig) -> None:
    """Set the global configuration instance"""
    global _config
    _config = config


def reload_config() -> DevOpsConfig:
    """Reload configuration from environment"""
    global _config
    _config = DevOpsConfig.from_env()
    return _config
