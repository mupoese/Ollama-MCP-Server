# CI Docker Hub Push Setup

## Overview

The CI workflow has been updated to automatically push Docker images to Docker Hub using the specified secrets.

## Changes Made

### 1. Docker Hub Authentication
- Added `Login to Docker Hub` step using `docker/login-action@v3`
- Uses GitHub secrets: `DOCKER_USERNAME` and `DOCKER_PASSWORD`
- Only executes on pushes to `main` branch (not on PRs or other branches)

### 2. Enhanced Docker Build
- Updated build command to create two tags:
  - `ollama-mcp-server:test` (for local testing)
  - `docker.io/mup1987/ollama-mcp-server:latest` (for Docker Hub)

### 3. Automatic Push
- Added `Push to Docker Hub` step
- Pushes `docker.io/mup1987/ollama-mcp-server:latest` to Docker Hub
- Only executes on pushes to `main` branch

## Workflow Behavior

| Event Type | Branch | Build Image | Test Image | Push to Docker Hub |
|------------|--------|-------------|------------|--------------------|
| Pull Request | main | ✅ | ✅ | ❌ |
| Push | develop | ✅ | ✅ | ❌ |
| Push | main | ✅ | ✅ | ✅ |

## Security Features

- Secrets are only used when pushing to `main` branch
- PRs cannot trigger Docker Hub pushes
- All builds are tested before pushing

## Required GitHub Secrets

Make sure these secrets are configured in your GitHub repository:

- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub password or access token

## Usage

After merging to `main` branch, the workflow will:

1. Run lint and tests
2. Build Docker image with proper tags
3. Test the Docker image
4. Login to Docker Hub (using secrets)
5. Push image to `docker.io/mup1987/ollama-mcp-server:latest`

Users can then pull the image with:
```bash
docker pull docker.io/mup1987/ollama-mcp-server:latest
```