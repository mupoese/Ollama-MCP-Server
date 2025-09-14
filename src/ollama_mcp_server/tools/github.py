"""
GitHub API tools for MCP DevOps Server

This module provides comprehensive GitHub integration tools for repository
management, workflow automation, and development operations.
"""

import aiohttp
import base64
import json
from typing import Any, Dict, Optional
from urllib.parse import urlencode

from .base_tool import BaseTool


class GitHubBaseTool(BaseTool):
    """Base class for GitHub tools with common functionality"""

    def __init__(self):
        super().__init__()
        self.github_token = self._get_github_token()
        self.base_url = "https://api.github.com"
        self.session: Optional[aiohttp.ClientSession] = None

    def _get_github_token(self) -> Optional[str]:
        """Get GitHub token from environment or config"""
        import os

        return os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")

    async def get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session for GitHub API calls"""
        if self.session is None or self.session.closed:
            headers = {
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "MCP-Ollama-Server/2.0.0",
            }
            if self.github_token:
                headers["Authorization"] = f"token {self.github_token}"

            timeout = aiohttp.ClientTimeout(total=30)
            self.session = aiohttp.ClientSession(timeout=timeout, headers=headers)
        return self.session

    async def make_github_request(
        self,
        endpoint: str,
        method: str = "GET",
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Make a request to the GitHub API

        Args:
            endpoint: API endpoint (e.g., "/repos/owner/repo")
            method: HTTP method
            data: Request data for POST/PUT requests
            params: Query parameters

        Returns:
            API response data
        """
        session = await self.get_session()
        url = f"{self.base_url}{endpoint}"

        if params:
            url += "?" + urlencode(params)

        try:
            async with session.request(method, url, json=data) as response:
                if response.status in [200, 201, 202]:
                    return await response.json()
                elif response.status == 204:
                    return {"status": "success", "message": "No content"}
                else:
                    error_text = await response.text()
                    error_data = {}
                    try:
                        error_data = json.loads(error_text)
                    except:
                        pass

                    error_msg = error_data.get('message', error_text)
                    raise Exception(
                        f"GitHub API error {response.status}: {error_msg}"
                    )
        except aiohttp.ClientError as e:
            raise Exception(f"GitHub API request failed: {str(e)}")

    async def cleanup(self):
        """Clean up HTTP session"""
        if self.session and not self.session.closed:
            await self.session.close()


class GitHubGetFileContents(GitHubBaseTool):
    """Get the contents of a file or directory from a GitHub repository"""

    @property
    def name(self) -> str:
        return "github_get_file_contents"

    @property
    def description(self) -> str:
        return "Get the contents of a file or directory from a GitHub repository"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "owner": {
                    "type": "string",
                    "description": "Repository owner (username or organization)",
                },
                "repo": {
                    "type": "string",
                    "description": "Repository name",
                },
                "path": {
                    "type": "string",
                    "description": "Path to file/directory (default: root)",
                    "default": "",
                },
                "ref": {
                    "type": "string",
                    "description": "Git reference (branch, tag, or commit SHA)",
                },
            },
            "required": ["owner", "repo"],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the get file contents command"""
        owner = arguments["owner"]
        repo = arguments["repo"]
        path = arguments.get("path", "")
        ref = arguments.get("ref")

        self.logger.info(
            "Getting GitHub file contents",
            owner=owner,
            repo=repo,
            path=path,
            ref=ref,
        )

        endpoint = f"/repos/{owner}/{repo}/contents/{path}"
        params = {}
        if ref:
            params["ref"] = ref

        response = await self.make_github_request(endpoint, params=params)

        # Handle directory vs file response
        if isinstance(response, list):
            # Directory listing
            return {
                "type": "directory",
                "contents": [
                    {
                        "name": item["name"],
                        "path": item["path"],
                        "type": item["type"],
                        "size": item.get("size", 0),
                        "download_url": item.get("download_url"),
                    }
                    for item in response
                ],
                "count": len(response),
            }
        else:
            # Single file
            content = ""
            if response.get("content"):
                try:
                    content = base64.b64decode(response["content"]).decode("utf-8")
                except:
                    content = "[Binary file content not displayed]"

            return {
                "type": "file",
                "name": response["name"],
                "path": response["path"],
                "size": response.get("size", 0),
                "encoding": response.get("encoding", ""),
                "content": content,
                "sha": response.get("sha", ""),
                "download_url": response.get("download_url"),
            }


class GitHubGetCommit(GitHubBaseTool):
    """Get details for a commit from a GitHub repository"""

    @property
    def name(self) -> str:
        return "github_get_commit"

    @property
    def description(self) -> str:
        return "Get details for a commit from a GitHub repository"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "owner": {
                    "type": "string",
                    "description": "Repository owner",
                },
                "repo": {
                    "type": "string",
                    "description": "Repository name",
                },
                "sha": {
                    "type": "string",
                    "description": "Commit SHA, branch name, or tag name",
                },
                "include_diff": {
                    "type": "boolean",
                    "description": "Whether to include file diffs",
                    "default": True,
                },
            },
            "required": ["owner", "repo", "sha"],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the get commit command"""
        owner = arguments["owner"]
        repo = arguments["repo"]
        sha = arguments["sha"]
        include_diff = arguments.get("include_diff", True)

        self.logger.info(
            "Getting GitHub commit details",
            owner=owner,
            repo=repo,
            sha=sha,
        )

        endpoint = f"/repos/{owner}/{repo}/commits/{sha}"
        response = await self.make_github_request(endpoint)

        commit_data = {
            "sha": response["sha"],
            "message": response["commit"]["message"],
            "author": {
                "name": response["commit"]["author"]["name"],
                "email": response["commit"]["author"]["email"],
                "date": response["commit"]["author"]["date"],
            },
            "committer": {
                "name": response["commit"]["committer"]["name"],
                "email": response["commit"]["committer"]["email"],
                "date": response["commit"]["committer"]["date"],
            },
            "url": response["html_url"],
            "stats": response.get("stats", {}),
        }

        if include_diff and "files" in response:
            commit_data["files"] = [
                {
                    "filename": file_data["filename"],
                    "status": file_data["status"],
                    "additions": file_data["additions"],
                    "deletions": file_data["deletions"],
                    "changes": file_data["changes"],
                    "patch": file_data.get("patch", ""),
                }
                for file_data in response["files"]
            ]

        return commit_data


class GitHubListCommits(GitHubBaseTool):
    """Get list of commits for a branch in a GitHub repository"""

    @property
    def name(self) -> str:
        return "github_list_commits"

    @property
    def description(self) -> str:
        return "Get list of commits for a branch in a GitHub repository"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "owner": {
                    "type": "string",
                    "description": "Repository owner",
                },
                "repo": {
                    "type": "string",
                    "description": "Repository name",
                },
                "sha": {
                    "type": "string",
                    "description": "Branch name, tag, or commit SHA",
                },
                "author": {
                    "type": "string",
                    "description": "Author username or email to filter by",
                },
                "per_page": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 100,
                    "description": "Results per page (default: 30)",
                    "default": 30,
                },
                "page": {
                    "type": "integer",
                    "minimum": 1,
                    "description": "Page number (default: 1)",
                    "default": 1,
                },
            },
            "required": ["owner", "repo"],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the list commits command"""
        owner = arguments["owner"]
        repo = arguments["repo"]
        sha = arguments.get("sha")
        author = arguments.get("author")
        per_page = arguments.get("per_page", 30)
        page = arguments.get("page", 1)

        self.logger.info(
            "Listing GitHub commits",
            owner=owner,
            repo=repo,
            sha=sha,
            author=author,
        )

        endpoint = f"/repos/{owner}/{repo}/commits"
        params = {
            "per_page": per_page,
            "page": page,
        }
        if sha:
            params["sha"] = sha
        if author:
            params["author"] = author

        response = await self.make_github_request(endpoint, params=params)

        commits = [
            {
                "sha": commit["sha"],
                "message": commit["commit"]["message"],
                "author": {
                    "name": commit["commit"]["author"]["name"],
                    "email": commit["commit"]["author"]["email"],
                    "date": commit["commit"]["author"]["date"],
                },
                "committer": {
                    "name": commit["commit"]["committer"]["name"],
                    "email": commit["commit"]["committer"]["email"],
                    "date": commit["commit"]["committer"]["date"],
                },
                "url": commit["html_url"],
            }
            for commit in response
        ]

        return {
            "commits": commits,
            "count": len(commits),
            "page": page,
            "per_page": per_page,
        }


class GitHubListBranches(GitHubBaseTool):
    """List branches in a GitHub repository"""

    @property
    def name(self) -> str:
        return "github_list_branches"

    @property
    def description(self) -> str:
        return "List branches in a GitHub repository"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "owner": {
                    "type": "string",
                    "description": "Repository owner",
                },
                "repo": {
                    "type": "string",
                    "description": "Repository name",
                },
                "per_page": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 100,
                    "description": "Results per page (default: 30)",
                    "default": 30,
                },
                "page": {
                    "type": "integer",
                    "minimum": 1,
                    "description": "Page number (default: 1)",
                    "default": 1,
                },
            },
            "required": ["owner", "repo"],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the list branches command"""
        owner = arguments["owner"]
        repo = arguments["repo"]
        per_page = arguments.get("per_page", 30)
        page = arguments.get("page", 1)

        self.logger.info(
            "Listing GitHub branches",
            owner=owner,
            repo=repo,
        )

        endpoint = f"/repos/{owner}/{repo}/branches"
        params = {
            "per_page": per_page,
            "page": page,
        }

        response = await self.make_github_request(endpoint, params=params)

        branches = [
            {
                "name": branch["name"],
                "commit_sha": branch["commit"]["sha"],
                "commit_url": branch["commit"]["url"],
                "protected": branch.get("protected", False),
            }
            for branch in response
        ]

        return {
            "branches": branches,
            "count": len(branches),
            "page": page,
            "per_page": per_page,
        }


class GitHubSearchRepositories(GitHubBaseTool):
    """Search for GitHub repositories"""

    @property
    def name(self) -> str:
        return "github_search_repositories"

    @property
    def description(self) -> str:
        return "Search for GitHub repositories by name, description, topics, or other criteria"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": (
                        "Search query (e.g., 'machine learning language:python stars:>1000')"
                    ),
                },
                "per_page": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 100,
                    "description": "Results per page (default: 30)",
                    "default": 30,
                },
                "page": {
                    "type": "integer",
                    "minimum": 1,
                    "description": "Page number (default: 1)",
                    "default": 1,
                },
                "sort": {
                    "type": "string",
                    "enum": ["stars", "forks", "help-wanted-issues", "updated"],
                    "description": "Sort field",
                },
                "order": {
                    "type": "string",
                    "enum": ["asc", "desc"],
                    "description": "Sort order",
                },
            },
            "required": ["query"],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the search repositories command"""
        query = arguments["query"]
        per_page = arguments.get("per_page", 30)
        page = arguments.get("page", 1)
        sort = arguments.get("sort")
        order = arguments.get("order")

        self.logger.info(
            "Searching GitHub repositories",
            query=query,
        )

        endpoint = "/search/repositories"
        params = {
            "q": query,
            "per_page": per_page,
            "page": page,
        }
        if sort:
            params["sort"] = sort
        if order:
            params["order"] = order

        response = await self.make_github_request(endpoint, params=params)

        repositories = [
            {
                "name": repo["name"],
                "full_name": repo["full_name"],
                "description": repo.get("description", ""),
                "stars": repo["stargazers_count"],
                "forks": repo["forks_count"],
                "language": repo.get("language"),
                "updated_at": repo["updated_at"],
                "url": repo["html_url"],
                "topics": repo.get("topics", []),
            }
            for repo in response["items"]
        ]

        return {
            "repositories": repositories,
            "total_count": response["total_count"],
            "page": page,
            "per_page": per_page,
        }


class GitHubGetIssue(GitHubBaseTool):
    """Get details of a specific issue in a GitHub repository"""

    @property
    def name(self) -> str:
        return "github_get_issue"

    @property
    def description(self) -> str:
        return "Get details of a specific issue in a GitHub repository"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "owner": {
                    "type": "string",
                    "description": "Repository owner",
                },
                "repo": {
                    "type": "string",
                    "description": "Repository name",
                },
                "issue_number": {
                    "type": "integer",
                    "description": "Issue number",
                },
            },
            "required": ["owner", "repo", "issue_number"],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the get issue command"""
        owner = arguments["owner"]
        repo = arguments["repo"]
        issue_number = arguments["issue_number"]

        self.logger.info(
            "Getting GitHub issue",
            owner=owner,
            repo=repo,
            issue_number=issue_number,
        )

        endpoint = f"/repos/{owner}/{repo}/issues/{issue_number}"
        response = await self.make_github_request(endpoint)

        return {
            "number": response["number"],
            "title": response["title"],
            "body": response.get("body", ""),
            "state": response["state"],
            "author": response["user"]["login"],
            "assignees": [user["login"] for user in response.get("assignees", [])],
            "labels": [label["name"] for label in response.get("labels", [])],
            "created_at": response["created_at"],
            "updated_at": response["updated_at"],
            "closed_at": response.get("closed_at"),
            "url": response["html_url"],
            "comments": response["comments"],
        }


class GitHubListPullRequests(GitHubBaseTool):
    """List pull requests in a GitHub repository"""

    @property
    def name(self) -> str:
        return "github_list_pull_requests"

    @property
    def description(self) -> str:
        return "List pull requests in a GitHub repository"

    @property
    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "owner": {
                    "type": "string",
                    "description": "Repository owner",
                },
                "repo": {
                    "type": "string",
                    "description": "Repository name",
                },
                "state": {
                    "type": "string",
                    "enum": ["open", "closed", "all"],
                    "description": "Filter by state",
                    "default": "open",
                },
                "sort": {
                    "type": "string",
                    "enum": ["created", "updated", "popularity", "long-running"],
                    "description": "Sort by",
                    "default": "created",
                },
                "direction": {
                    "type": "string",
                    "enum": ["asc", "desc"],
                    "description": "Sort direction",
                    "default": "desc",
                },
                "per_page": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 100,
                    "description": "Results per page (default: 30)",
                    "default": 30,
                },
                "page": {
                    "type": "integer",
                    "minimum": 1,
                    "description": "Page number (default: 1)",
                    "default": 1,
                },
            },
            "required": ["owner", "repo"],
            "additionalProperties": False,
        }

    async def _execute(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the list pull requests command"""
        owner = arguments["owner"]
        repo = arguments["repo"]
        state = arguments.get("state", "open")
        sort = arguments.get("sort", "created")
        direction = arguments.get("direction", "desc")
        per_page = arguments.get("per_page", 30)
        page = arguments.get("page", 1)

        self.logger.info(
            "Listing GitHub pull requests",
            owner=owner,
            repo=repo,
            state=state,
        )

        endpoint = f"/repos/{owner}/{repo}/pulls"
        params = {
            "state": state,
            "sort": sort,
            "direction": direction,
            "per_page": per_page,
            "page": page,
        }

        response = await self.make_github_request(endpoint, params=params)

        pull_requests = [
            {
                "number": pr["number"],
                "title": pr["title"],
                "state": pr["state"],
                "author": pr["user"]["login"],
                "head": {
                    "ref": pr["head"]["ref"],
                    "sha": pr["head"]["sha"],
                },
                "base": {
                    "ref": pr["base"]["ref"],
                    "sha": pr["base"]["sha"],
                },
                "created_at": pr["created_at"],
                "updated_at": pr["updated_at"],
                "merged_at": pr.get("merged_at"),
                "url": pr["html_url"],
                "draft": pr.get("draft", False),
            }
            for pr in response
        ]

        return {
            "pull_requests": pull_requests,
            "count": len(pull_requests),
            "page": page,
            "per_page": per_page,
        }
