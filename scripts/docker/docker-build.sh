#!/bin/bash
set -e

echo "🐳 Building MCP Ollama Server Docker image..."

# Set image name and tag
IMAGE_NAME="mcp-ollama-server"
TAG="${1:-latest}"
FULL_IMAGE_NAME="$IMAGE_NAME:$TAG"

# Build multi-stage Docker image
echo "🔨 Building Docker image: $FULL_IMAGE_NAME"
docker build \
    --file docker/Dockerfile.python \
    --tag "$FULL_IMAGE_NAME" \
    --target production \
    .

# Also build development image
DEV_IMAGE_NAME="$IMAGE_NAME:dev"
echo "🔨 Building development image: $DEV_IMAGE_NAME"
docker build \
    --file docker/Dockerfile.python \
    --tag "$DEV_IMAGE_NAME" \
    --target development \
    .

# Show image info
echo ""
echo "✅ Docker images built successfully:"
docker images | grep "$IMAGE_NAME" | head -2

echo ""
echo "🚀 Usage:"
echo "   Production: docker run -it --rm -p 8000:8000 $FULL_IMAGE_NAME"
echo "   Development: docker run -it --rm -v \$(pwd):/app $DEV_IMAGE_NAME bash"
echo "   Compose: ./scripts/docker-start.sh"

# Test the image
echo ""
echo "🧪 Testing image..."
if docker run --rm "$FULL_IMAGE_NAME" python -m src.ollama_mcp_server.main health > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "⚠️ Health check failed - image may need debugging"
fi