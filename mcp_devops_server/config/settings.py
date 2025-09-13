"""
Configuration management for MCP DevOps Server

This module provides comprehensive configuration management with environment
variable support, validation, and type safety using Pydantic.
"""

import os
from pathlib import Path
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings
import yaml


class OllamaConfig(BaseSettings):
    """Ollama-specific configuration settings"""
    
    api_url: str = Field(
        default="http://localhost:11434",
        description="Ollama API endpoint URL"
    )
    timeout: int = Field(
        default=30,
        description="Request timeout in seconds"
    )
    max_retries: int = Field(
        default=3,
        description="Maximum number of retry attempts"
    )
    default_model: str = Field(
        default="llama2",
        description="Default model for Ollama operations"
    )
    
    class Config:
        env_prefix = "OLLAMA_"
        case_sensitive = False


class SecurityConfig(BaseSettings):
    """Security and authentication configuration"""
    
    api_key_management: bool = Field(
        default=True,
        description="Enable API key management"
    )
    role_based_access: bool = Field(
        default=True,
        description="Enable role-based access control"
    )
    audit_logging: bool = Field(
        default=True,
        description="Enable audit logging for tool executions"
    )
    input_sanitization: bool = Field(
        default=True,
        description="Enable input sanitization"
    )
    max_input_size: int = Field(
        default=1048576,  # 1MB
        description="Maximum input size in bytes"
    )
    
    class Config:
        env_prefix = "SECURITY_"
        case_sensitive = False


class ToolConfig(BaseSettings):
    """Tool execution configuration"""
    
    execution_timeout: int = Field(
        default=300,  # 5 minutes
        description="Default tool execution timeout in seconds"
    )
    max_concurrent_tools: int = Field(
        default=10,
        description="Maximum number of concurrent tool executions"
    )
    enable_caching: bool = Field(
        default=True,
        description="Enable result caching for expensive operations"
    )
    cache_ttl: int = Field(
        default=3600,  # 1 hour
        description="Cache TTL in seconds"
    )
    
    class Config:
        env_prefix = "TOOL_"
        case_sensitive = False


class InfrastructureConfig(BaseSettings):
    """Infrastructure tool configuration"""
    
    docker_enabled: bool = Field(default=True, description="Enable Docker tools")
    kubernetes_enabled: bool = Field(default=True, description="Enable Kubernetes tools")
    terraform_enabled: bool = Field(default=True, description="Enable Terraform tools")
    
    # Docker configuration
    docker_socket: str = Field(
        default="unix:///var/run/docker.sock",
        description="Docker socket path"
    )
    
    # Kubernetes configuration
    kubeconfig_path: Optional[str] = Field(
        default=None,
        description="Path to kubeconfig file"
    )
    kubernetes_namespace: str = Field(
        default="default",
        description="Default Kubernetes namespace"
    )
    
    class Config:
        env_prefix = "INFRA_"
        case_sensitive = False


class MonitoringConfig(BaseSettings):
    """Monitoring and observability configuration"""
    
    prometheus_enabled: bool = Field(default=True, description="Enable Prometheus tools")
    elasticsearch_enabled: bool = Field(default=True, description="Enable Elasticsearch tools")
    
    # Prometheus configuration
    prometheus_url: str = Field(
        default="http://localhost:9090",
        description="Prometheus server URL"
    )
    
    # Elasticsearch configuration
    elasticsearch_url: str = Field(
        default="http://localhost:9200",
        description="Elasticsearch server URL"
    )
    
    # Health check configuration
    health_check_interval: int = Field(
        default=60,
        description="Health check interval in seconds"
    )
    
    class Config:
        env_prefix = "MONITORING_"
        case_sensitive = False


class DevOpsConfig(BaseSettings):
    """Main configuration class for MCP DevOps Server"""
    
    # Server configuration
    server_name: str = Field(
        default="mcp-devops-server",
        description="Server name"
    )
    server_version: str = Field(
        default="2.0.0",
        description="Server version"
    )
    debug: bool = Field(
        default=False,
        description="Enable debug logging"
    )
    log_level: str = Field(
        default="INFO",
        description="Logging level"
    )
    
    # Transport configuration
    transport_type: str = Field(
        default="stdio",
        description="Transport type: stdio or http"
    )
    http_host: str = Field(
        default="0.0.0.0",
        description="HTTP server host"
    )
    http_port: int = Field(
        default=8000,
        description="HTTP server port"
    )
    
    # Environment
    environment: str = Field(
        default="development",
        description="Environment: development, staging, production"
    )
    
    # Sub-configurations
    ollama: OllamaConfig = Field(default_factory=OllamaConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)
    tools: ToolConfig = Field(default_factory=ToolConfig)
    infrastructure: InfrastructureConfig = Field(default_factory=InfrastructureConfig)
    monitoring: MonitoringConfig = Field(default_factory=MonitoringConfig)
    
    @field_validator('log_level')
    @classmethod
    def validate_log_level(cls, v):
        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if v.upper() not in valid_levels:
            raise ValueError(f'log_level must be one of: {", ".join(valid_levels)}')
        return v.upper()
    
    @field_validator('transport_type')
    @classmethod
    def validate_transport_type(cls, v):
        valid_types = ['stdio', 'http']
        if v.lower() not in valid_types:
            raise ValueError(f'transport_type must be one of: {", ".join(valid_types)}')
        return v.lower()
    
    @field_validator('environment')
    @classmethod
    def validate_environment(cls, v):
        valid_envs = ['development', 'staging', 'production']
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
        
        with open(config_path, 'r') as f:
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