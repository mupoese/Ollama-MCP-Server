FROM node:18-alpine

# v1.0.0
LABEL maintainer="mupoese <info@mupoese.nl>" \
      author="mupoese" \
      version="1.0.0" \
      description="Custom MCP server for Ollama (by mupoese)" \
      license="GPL-2.0"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy server code
COPY server.js ./
COPY src/ ./src/

# Make server executable
RUN chmod +x server.js

# Use non-root user
USER node

# Start the MCP server
CMD ["node", "server.js"]