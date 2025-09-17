"""
Structured logging utilities for MCP DevOps Server

This module provides structured logging using structlog with rich formatting
for development and JSON formatting for production.
"""

import sys
import logging
from typing import Any, Dict, Optional
import structlog
from rich.console import Console
from rich.logging import RichHandler

from ..config import get_config


def setup_logging() -> None:
    """Configure structured logging for the application"""
    config = get_config()

    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, config.log_level),
    )

    # Configure processors based on environment
    processors = [
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if config.is_development():
        # Rich formatting for development
        processors.extend(
            [
                structlog.processors.UnicodeDecoder(),
                structlog.dev.ConsoleRenderer(colors=True),
            ]
        )

        # Use Rich handler for beautiful development logs
        handler = RichHandler(
            console=Console(stderr=True),
            show_time=True,
            show_level=True,
            show_path=True,
            markup=True,
            rich_tracebacks=True,
        )

    else:
        # JSON formatting for production
        processors.extend(
            [
                structlog.processors.dict_tracebacks,
                structlog.processors.JSONRenderer(),
            ]
        )

        handler = logging.StreamHandler()

    # Configure structlog
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Set up the root logger
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)


def get_logger(name: Optional[str] = None) -> structlog.BoundLogger:
    """Get a structured logger instance"""
    return structlog.get_logger(name)


class AuditLogger:
    """Audit logger for security-sensitive operations"""

    def __init__(self):
        self.logger = get_logger("audit")

    def log_tool_execution(
        self,
        tool_name: str,
        user_id: Optional[str] = None,
        arguments: Optional[Dict[str, Any]] = None,
        success: bool = True,
        error: Optional[str] = None,
    ) -> None:
        """Log tool execution for audit purposes"""
        self.logger.info(
            "Tool execution",
            tool_name=tool_name,
            user_id=user_id,
            arguments=arguments,
            success=success,
            error=error,
            event_type="tool_execution",
        )

    def log_security_event(
        self,
        event_type: str,
        description: str,
        severity: str = "INFO",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log security events"""
        self.logger.bind(
            event_type="security_event",
            security_event_type=event_type,
            severity=severity,
            metadata=metadata or {},
        ).info(description)

    def log_authentication(
        self,
        user_id: Optional[str],
        success: bool,
        method: str = "api_key",
        ip_address: Optional[str] = None,
    ) -> None:
        """Log authentication attempts"""
        self.logger.info(
            "Authentication attempt",
            user_id=user_id,
            success=success,
            method=method,
            ip_address=ip_address,
            event_type="authentication",
        )

    def log_authorization(
        self,
        user_id: Optional[str],
        resource: str,
        action: str,
        success: bool,
        reason: Optional[str] = None,
    ) -> None:
        """Log authorization decisions"""
        self.logger.info(
            "Authorization check",
            user_id=user_id,
            resource=resource,
            action=action,
            success=success,
            reason=reason,
            event_type="authorization",
        )


# Global audit logger instance
audit_logger = AuditLogger()


class PerformanceLogger:
    """Performance logging for tool execution metrics"""

    def __init__(self):
        self.logger = get_logger("performance")

    def log_tool_performance(
        self,
        tool_name: str,
        execution_time: float,
        success: bool,
        input_size: Optional[int] = None,
        output_size: Optional[int] = None,
    ) -> None:
        """Log tool performance metrics"""
        self.logger.info(
            "Tool performance",
            tool_name=tool_name,
            execution_time=execution_time,
            success=success,
            input_size=input_size,
            output_size=output_size,
            event_type="performance",
        )

    def log_cache_metrics(
        self,
        cache_key: str,
        hit: bool,
        fetch_time: Optional[float] = None,
    ) -> None:
        """Log cache performance metrics"""
        self.logger.info(
            "Cache access",
            cache_key=cache_key,
            hit=hit,
            fetch_time=fetch_time,
            event_type="cache",
        )


# Global performance logger instance
performance_logger = PerformanceLogger()


# Convenience function for getting the main application logger
def get_app_logger() -> structlog.BoundLogger:
    """Get the main application logger"""
    return get_logger("mcp_devops_server")
