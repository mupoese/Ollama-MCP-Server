"""
Infrastructure management tools for MCP DevOps Server

This module provides tools for managing Docker, Kubernetes, and other
infrastructure components.
"""

import asyncio
from typing import Any, Dict

try:
    import docker
    import docker.errors

    DOCKER_AVAILABLE = True
except ImportError:
    DOCKER_AVAILABLE = False

try:
    from kubernetes import client, config

    KUBERNETES_AVAILABLE = True
except ImportError:
    KUBERNETES_AVAILABLE = False

from .base_tool import BaseTool


class DockerListContainers(BaseTool):
    """List Docker containers"""

    def __init__(self):
        super().__init__()
        self.docker_client = None

        if not DOCKER_AVAILABLE:
            self.logger.warning("Docker library not available, tool will be disabled")

    @property
    def name(self) -> str:
        return "docker_list_containers"

    @property
    def description(self) -> str:
        return "List Docker containers with their status and basic information"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "all": {
                    "type": "boolean",
                    "description": "Show all containers (default shows only running)",
                    "default": False,
                },
                "filters": {
                    "type": "object",
                    "description": "Filters to apply to container list",
                    "properties": {
                        "status": {
                            "type": "string",
                            "enum": [
                                "created",
                                "restarting",
                                "running",
                                "removing",
                                "paused",
                                "exited",
                                "dead",
                            ],
                            "description": "Filter by container status",
                        },
                        "label": {
                            "type": "string",
                            "description": "Filter by label (format: key=value)",
                        },
                        "name": {
                            "type": "string",
                            "description": "Filter by container name",
                        },
                    },
                    "additionalProperties": False,
                },
            },
            "additionalProperties": False,
        }

    def get_docker_client(self):
        """Get Docker client instance"""
        if not DOCKER_AVAILABLE:
            raise RuntimeError("Docker library not available")

        if self.docker_client is None:
            self.docker_client = docker.from_env()

        return self.docker_client

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the Docker list containers command"""
        show_all = arguments.get("all", False)
        filters = arguments.get("filters", {})

        self.logger.info(
            "Listing Docker containers",
            show_all=show_all,
            filters=filters,
        )

        # Run Docker operations in thread pool to avoid blocking
        def list_containers():
            client = self.get_docker_client()

            # Convert filters to Docker API format
            docker_filters = {}
            if "status" in filters:
                docker_filters["status"] = [filters["status"]]
            if "label" in filters:
                docker_filters["label"] = [filters["label"]]
            if "name" in filters:
                docker_filters["name"] = [filters["name"]]

            containers = client.containers.list(all=show_all, filters=docker_filters)

            container_info = []
            for container in containers:
                info = {
                    "id": container.short_id,
                    "name": container.name,
                    "image": (
                        str(container.image.tags[0])
                        if container.image.tags
                        else container.image.id
                    ),
                    "status": container.status,
                    "created": container.attrs.get("Created", ""),
                    "ports": container.attrs.get("NetworkSettings", {}).get(
                        "Ports", {}
                    ),
                    "labels": container.labels,
                }
                container_info.append(info)

            return container_info

        # Execute in thread pool
        loop = asyncio.get_event_loop()
        containers = await loop.run_in_executor(None, list_containers)

        return {
            "containers": containers,
            "count": len(containers),
            "show_all": show_all,
            "filters_applied": filters,
        }

    async def health_check(self) -> bool:
        """Check if Docker daemon is accessible"""
        if not DOCKER_AVAILABLE:
            return False

        try:

            def check_docker():
                client = self.get_docker_client()
                client.ping()
                return True

            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, check_docker)
            return True
        except Exception:
            return False


class DockerRunContainer(BaseTool):
    """Run a Docker container"""

    def __init__(self):
        super().__init__()
        self.docker_client = None

        if not DOCKER_AVAILABLE:
            self.logger.warning("Docker library not available, tool will be disabled")

    @property
    def name(self) -> str:
        return "docker_run_container"

    @property
    def description(self) -> str:
        return "Run a Docker container with specified image and options"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "image": {
                    "type": "string",
                    "description": "Docker image to run",
                    "minLength": 1,
                },
                "command": {
                    "type": "string",
                    "description": "Command to run in the container",
                },
                "name": {
                    "type": "string",
                    "description": "Name for the container",
                },
                "detach": {
                    "type": "boolean",
                    "description": "Run container in detached mode",
                    "default": True,
                },
                "ports": {
                    "type": "object",
                    "description": "Port mapping (container_port: host_port)",
                    "additionalProperties": {
                        "type": ["string", "integer"],
                    },
                },
                "environment": {
                    "type": "object",
                    "description": "Environment variables",
                    "additionalProperties": {
                        "type": "string",
                    },
                },
                "volumes": {
                    "type": "object",
                    "description": "Volume mounting (host_path: container_path)",
                    "additionalProperties": {
                        "type": "string",
                    },
                },
                "remove": {
                    "type": "boolean",
                    "description": "Automatically remove container when it exits",
                    "default": False,
                },
            },
            "required": ["image"],
            "additionalProperties": False,
        }

    def get_docker_client(self):
        """Get Docker client instance"""
        if not DOCKER_AVAILABLE:
            raise RuntimeError("Docker library not available")

        if self.docker_client is None:
            self.docker_client = docker.from_env()

        return self.docker_client

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the Docker run container command"""
        image = arguments["image"]
        command = arguments.get("command")
        name = arguments.get("name")
        detach = arguments.get("detach", True)
        ports = arguments.get("ports", {})
        environment = arguments.get("environment", {})
        volumes = arguments.get("volumes", {})
        remove = arguments.get("remove", False)

        self.logger.info(
            "Running Docker container",
            image=image,
            name=name,
            detach=detach,
        )

        def run_container():
            client = self.get_docker_client()

            # Convert volumes to Docker format
            volume_binds = {}
            for host_path, container_path in volumes.items():
                volume_binds[host_path] = {"bind": container_path, "mode": "rw"}

            container = client.containers.run(
                image=image,
                command=command,
                name=name,
                detach=detach,
                ports=ports,
                environment=environment,
                volumes=volume_binds,
                remove=remove,
            )

            if detach:
                return {
                    "container_id": container.short_id,
                    "name": container.name,
                    "status": container.status,
                }
            else:
                # If not detached, return the output
                output = (
                    container.decode("utf-8")
                    if isinstance(container, bytes)
                    else str(container)
                )
                return {
                    "output": output,
                    "detached": False,
                }

        # Execute in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, run_container)

        return result

    async def health_check(self) -> bool:
        """Check if Docker daemon is accessible"""
        if not DOCKER_AVAILABLE:
            return False

        try:

            def check_docker():
                client = self.get_docker_client()
                client.ping()
                return True

            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, check_docker)
            return True
        except Exception:
            return False


class KubernetesListPods(BaseTool):
    """List Kubernetes pods"""

    def __init__(self):
        super().__init__()
        self.k8s_client = None

        if not KUBERNETES_AVAILABLE:
            self.logger.warning(
                "Kubernetes library not available, tool will be disabled"
            )

    @property
    def name(self) -> str:
        return "k8s_list_pods"

    @property
    def description(self) -> str:
        return "List Kubernetes pods in a namespace"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "namespace": {
                    "type": "string",
                    "description": "Kubernetes namespace",
                    "default": "default",
                },
                "label_selector": {
                    "type": "string",
                    "description": "Label selector to filter pods",
                },
                "field_selector": {
                    "type": "string",
                    "description": "Field selector to filter pods",
                },
            },
            "additionalProperties": False,
        }

    def get_k8s_client(self):
        """Get Kubernetes client"""
        if not KUBERNETES_AVAILABLE:
            raise RuntimeError("Kubernetes library not available")

        if self.k8s_client is None:
            # Try to load config from default locations
            try:
                config.load_incluster_config()  # For running inside cluster
            except config.ConfigException:
                config.load_kube_config()  # For running outside cluster

            self.k8s_client = client.CoreV1Api()

        return self.k8s_client

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the Kubernetes list pods command"""
        namespace = arguments.get("namespace", "default")
        label_selector = arguments.get("label_selector")
        field_selector = arguments.get("field_selector")

        self.logger.info(
            "Listing Kubernetes pods",
            namespace=namespace,
            label_selector=label_selector,
            field_selector=field_selector,
        )

        def list_pods():
            api = self.get_k8s_client()

            pod_list = api.list_namespaced_pod(
                namespace=namespace,
                label_selector=label_selector,
                field_selector=field_selector,
            )

            pods = []
            for pod in pod_list.items:
                pod_info = {
                    "name": pod.metadata.name,
                    "namespace": pod.metadata.namespace,
                    "phase": pod.status.phase,
                    "node": pod.spec.node_name,
                    "created": (
                        pod.metadata.creation_timestamp.isoformat()
                        if pod.metadata.creation_timestamp
                        else None
                    ),
                    "labels": pod.metadata.labels or {},
                    "ready": sum(
                        1 for c in (pod.status.container_statuses or []) if c.ready
                    ),
                    "total_containers": len(pod.spec.containers),
                    "restarts": sum(
                        c.restart_count for c in (pod.status.container_statuses or [])
                    ),
                }
                pods.append(pod_info)

            return pods

        # Execute in thread pool
        loop = asyncio.get_event_loop()
        pods = await loop.run_in_executor(None, list_pods)

        return {
            "pods": pods,
            "count": len(pods),
            "namespace": namespace,
        }

    async def health_check(self) -> bool:
        """Check if Kubernetes API is accessible"""
        if not KUBERNETES_AVAILABLE:
            return False

        try:

            def check_k8s():
                api = self.get_k8s_client()
                # Try to list namespaces as a simple health check
                api.list_namespace(limit=1)
                return True

            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, check_k8s)
            return True
        except Exception:
            return False
