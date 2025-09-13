"""
Git and repository management tools for MCP DevOps Server

This module provides tools for Git operations and repository management.
"""

import asyncio
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import structlog

try:
    import git
    from git import Repo, GitCommandError
    GIT_AVAILABLE = True
except ImportError:
    GIT_AVAILABLE = False

from .base_tool import BaseTool


class GitStatus(BaseTool):
    """Get Git repository status"""
    
    def __init__(self):
        super().__init__()
        
        if not GIT_AVAILABLE:
            self.logger.warning("GitPython library not available, tool will be disabled")
    
    @property
    def name(self) -> str:
        return "git_status"
    
    @property
    def description(self) -> str:
        return "Get the status of a Git repository including staged, unstaged, and untracked files"
    
    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "repository_path": {
                    "type": "string",
                    "description": "Path to the Git repository (defaults to current directory)",
                    "default": ".",
                },
                "include_ignored": {
                    "type": "boolean",
                    "description": "Include ignored files in the status",
                    "default": False,
                },
            },
            "additionalProperties": False,
        }
    
    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the Git status command"""
        repo_path = arguments.get("repository_path", ".")
        include_ignored = arguments.get("include_ignored", False)
        
        self.logger.info(
            "Getting Git repository status",
            repository_path=repo_path,
            include_ignored=include_ignored,
        )
        
        def get_git_status():
            if not GIT_AVAILABLE:
                raise RuntimeError("GitPython library not available")
            
            # Convert to absolute path
            repo_path_abs = Path(repo_path).resolve()
            
            # Find Git repository
            try:
                repo = Repo(repo_path_abs, search_parent_directories=True)
            except git.InvalidGitRepositoryError:
                raise ValueError(f"No Git repository found at {repo_path_abs}")
            
            # Get current branch
            try:
                current_branch = repo.active_branch.name
            except TypeError:
                current_branch = "HEAD (detached)"
            
            # Get status information
            status_info = {
                "repository_path": str(repo.working_dir),
                "current_branch": current_branch,
                "is_dirty": repo.is_dirty(),
                "staged_files": [],
                "unstaged_files": [],
                "untracked_files": list(repo.untracked_files),
            }
            
            # Get staged files
            staged_files = repo.index.diff("HEAD")
            for item in staged_files:
                status_info["staged_files"].append({
                    "path": item.a_path,
                    "change_type": item.change_type,
                })
            
            # Get unstaged files
            unstaged_files = repo.index.diff(None)
            for item in unstaged_files:
                status_info["unstaged_files"].append({
                    "path": item.a_path,
                    "change_type": item.change_type,
                })
            
            # Get commit information
            try:
                latest_commit = repo.head.commit
                status_info["latest_commit"] = {
                    "hash": latest_commit.hexsha[:8],
                    "message": latest_commit.message.strip(),
                    "author": str(latest_commit.author),
                    "date": latest_commit.committed_datetime.isoformat(),
                }
            except Exception:
                status_info["latest_commit"] = None
            
            # Get remote information
            remotes = []
            for remote in repo.remotes:
                remotes.append({
                    "name": remote.name,
                    "url": list(remote.urls)[0] if remote.urls else None,
                })
            status_info["remotes"] = remotes
            
            return status_info
        
        # Execute in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, get_git_status)
        
        return result
    
    async def health_check(self) -> bool:
        """Check if Git is available"""
        return GIT_AVAILABLE


class GitClone(BaseTool):
    """Clone a Git repository"""
    
    def __init__(self):
        super().__init__()
        
        if not GIT_AVAILABLE:
            self.logger.warning("GitPython library not available, tool will be disabled")
    
    @property
    def name(self) -> str:
        return "git_clone"
    
    @property
    def description(self) -> str:
        return "Clone a Git repository to a local directory"
    
    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "Git repository URL to clone",
                    "minLength": 1,
                },
                "destination": {
                    "type": "string",
                    "description": "Destination directory for the clone",
                },
                "branch": {
                    "type": "string",
                    "description": "Specific branch to clone",
                },
                "depth": {
                    "type": "integer",
                    "description": "Create a shallow clone with specified depth",
                    "minimum": 1,
                },
                "recursive": {
                    "type": "boolean",
                    "description": "Clone submodules recursively",
                    "default": False,
                },
            },
            "required": ["url"],
            "additionalProperties": False,
        }
    
    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the Git clone command"""
        url = arguments["url"]
        destination = arguments.get("destination")
        branch = arguments.get("branch")
        depth = arguments.get("depth")
        recursive = arguments.get("recursive", False)
        
        self.logger.info(
            "Cloning Git repository",
            url=url,
            destination=destination,
            branch=branch,
            depth=depth,
            recursive=recursive,
        )
        
        def clone_repository():
            if not GIT_AVAILABLE:
                raise RuntimeError("GitPython library not available")
            
            # Prepare clone options
            clone_kwargs = {}
            
            if branch:
                clone_kwargs["branch"] = branch
            
            if depth:
                clone_kwargs["depth"] = depth
            
            if recursive:
                clone_kwargs["recursive"] = True
            
            # Perform clone
            repo = Repo.clone_from(url, destination, **clone_kwargs)
            
            # Get information about the cloned repository
            result = {
                "repository_path": str(repo.working_dir),
                "url": url,
                "branch": repo.active_branch.name if repo.active_branch else "HEAD",
                "latest_commit": {
                    "hash": repo.head.commit.hexsha[:8],
                    "message": repo.head.commit.message.strip(),
                    "author": str(repo.head.commit.author),
                    "date": repo.head.commit.committed_datetime.isoformat(),
                },
                "remotes": [
                    {
                        "name": remote.name,
                        "url": list(remote.urls)[0] if remote.urls else None,
                    }
                    for remote in repo.remotes
                ],
            }
            
            return result
        
        # Execute in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, clone_repository)
        
        return result
    
    async def health_check(self) -> bool:
        """Check if Git is available"""
        return GIT_AVAILABLE


class GitCommit(BaseTool):
    """Create a Git commit"""
    
    def __init__(self):
        super().__init__()
        
        if not GIT_AVAILABLE:
            self.logger.warning("GitPython library not available, tool will be disabled")
    
    @property
    def name(self) -> str:
        return "git_commit"
    
    @property
    def description(self) -> str:
        return "Create a Git commit with staged changes"
    
    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "repository_path": {
                    "type": "string",
                    "description": "Path to the Git repository (defaults to current directory)",
                    "default": ".",
                },
                "message": {
                    "type": "string",
                    "description": "Commit message",
                    "minLength": 1,
                },
                "author_name": {
                    "type": "string",
                    "description": "Author name (overrides Git config)",
                },
                "author_email": {
                    "type": "string",
                    "description": "Author email (overrides Git config)",
                },
                "add_all": {
                    "type": "boolean",
                    "description": "Add all modified files before committing",
                    "default": False,
                },
                "files": {
                    "type": "array",
                    "description": "Specific files to add before committing",
                    "items": {
                        "type": "string",
                    },
                },
            },
            "required": ["message"],
            "additionalProperties": False,
        }
    
    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the Git commit command"""
        repo_path = arguments.get("repository_path", ".")
        message = arguments["message"]
        author_name = arguments.get("author_name")
        author_email = arguments.get("author_email")
        add_all = arguments.get("add_all", False)
        files = arguments.get("files", [])
        
        self.logger.info(
            "Creating Git commit",
            repository_path=repo_path,
            message=message[:50] + "..." if len(message) > 50 else message,
            add_all=add_all,
            files_count=len(files),
        )
        
        def create_commit():
            if not GIT_AVAILABLE:
                raise RuntimeError("GitPython library not available")
            
            # Convert to absolute path
            repo_path_abs = Path(repo_path).resolve()
            
            # Find Git repository
            try:
                repo = Repo(repo_path_abs, search_parent_directories=True)
            except git.InvalidGitRepositoryError:
                raise ValueError(f"No Git repository found at {repo_path_abs}")
            
            # Add files if specified
            if add_all:
                repo.git.add(A=True)
            elif files:
                repo.index.add(files)
            
            # Check if there are changes to commit
            if not repo.index.diff("HEAD"):
                raise ValueError("No changes staged for commit")
            
            # Create actor if name/email provided
            actor = None
            if author_name and author_email:
                actor = git.Actor(author_name, author_email)
            
            # Create commit
            commit = repo.index.commit(message, author=actor, committer=actor)
            
            result = {
                "commit_hash": commit.hexsha,
                "short_hash": commit.hexsha[:8],
                "message": commit.message.strip(),
                "author": str(commit.author),
                "date": commit.committed_datetime.isoformat(),
                "files_changed": len(commit.stats.files),
                "insertions": commit.stats.total["insertions"],
                "deletions": commit.stats.total["deletions"],
            }
            
            return result
        
        # Execute in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, create_commit)
        
        return result
    
    async def health_check(self) -> bool:
        """Check if Git is available"""
        return GIT_AVAILABLE


class GitBranch(BaseTool):
    """Git branch operations"""
    
    def __init__(self):
        super().__init__()
        
        if not GIT_AVAILABLE:
            self.logger.warning("GitPython library not available, tool will be disabled")
    
    @property
    def name(self) -> str:
        return "git_branch"
    
    @property
    def description(self) -> str:
        return "Perform Git branch operations: list, create, checkout, delete"
    
    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "repository_path": {
                    "type": "string",
                    "description": "Path to the Git repository (defaults to current directory)",
                    "default": ".",
                },
                "operation": {
                    "type": "string",
                    "enum": ["list", "create", "checkout", "delete"],
                    "description": "Branch operation to perform",
                },
                "branch_name": {
                    "type": "string",
                    "description": "Branch name (required for create, checkout, delete operations)",
                },
                "start_point": {
                    "type": "string",
                    "description": "Starting point for new branch (commit hash or branch name)",
                },
                "force": {
                    "type": "boolean",
                    "description": "Force operation (for delete and checkout)",
                    "default": False,
                },
            },
            "required": ["operation"],
            "additionalProperties": False,
        }
    
    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the Git branch operation"""
        repo_path = arguments.get("repository_path", ".")
        operation = arguments["operation"]
        branch_name = arguments.get("branch_name")
        start_point = arguments.get("start_point")
        force = arguments.get("force", False)
        
        self.logger.info(
            "Performing Git branch operation",
            repository_path=repo_path,
            operation=operation,
            branch_name=branch_name,
        )
        
        def perform_branch_operation():
            if not GIT_AVAILABLE:
                raise RuntimeError("GitPython library not available")
            
            # Convert to absolute path
            repo_path_abs = Path(repo_path).resolve()
            
            # Find Git repository
            try:
                repo = Repo(repo_path_abs, search_parent_directories=True)
            except git.InvalidGitRepositoryError:
                raise ValueError(f"No Git repository found at {repo_path_abs}")
            
            if operation == "list":
                # List all branches
                branches = []
                for branch in repo.branches:
                    is_active = branch == repo.active_branch
                    branches.append({
                        "name": branch.name,
                        "active": is_active,
                        "commit": {
                            "hash": branch.commit.hexsha[:8],
                            "message": branch.commit.message.strip(),
                            "date": branch.commit.committed_datetime.isoformat(),
                        },
                    })
                
                return {
                    "operation": "list",
                    "branches": branches,
                    "active_branch": repo.active_branch.name if repo.active_branch else None,
                }
            
            elif operation == "create":
                if not branch_name:
                    raise ValueError("branch_name is required for create operation")
                
                # Create new branch
                new_branch = repo.create_head(branch_name, start_point or "HEAD")
                
                return {
                    "operation": "create",
                    "branch_name": branch_name,
                    "start_point": start_point or "HEAD",
                    "commit": {
                        "hash": new_branch.commit.hexsha[:8],
                        "message": new_branch.commit.message.strip(),
                    },
                }
            
            elif operation == "checkout":
                if not branch_name:
                    raise ValueError("branch_name is required for checkout operation")
                
                # Checkout branch
                repo.git.checkout(branch_name, force=force)
                
                return {
                    "operation": "checkout",
                    "branch_name": branch_name,
                    "force": force,
                    "current_branch": repo.active_branch.name,
                }
            
            elif operation == "delete":
                if not branch_name:
                    raise ValueError("branch_name is required for delete operation")
                
                # Delete branch
                repo.delete_head(branch_name, force=force)
                
                return {
                    "operation": "delete",
                    "branch_name": branch_name,
                    "force": force,
                }
            
            else:
                raise ValueError(f"Unknown operation: {operation}")
        
        # Execute in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, perform_branch_operation)
        
        return result
    
    async def health_check(self) -> bool:
        """Check if Git is available"""
        return GIT_AVAILABLE