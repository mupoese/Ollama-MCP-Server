# Gebruik officiële Node.js 18 LTS als basis
FROM node:18-alpine

# Maak een app directory in de container
WORKDIR /app

# Kopieer package.json en package-lock.json eerst (voor betere caching)
COPY package.json ./
COPY package-lock.json ./

# Installeer alle dependencies
RUN npm install --production

# Kopieer de rest van de projectbestanden naar de container
COPY . .

# Zet standaard-omgevingsvariabelen (kun je overschrijven via .env)
ENV PORT=3456
ENV OLLAMA_API=http://host.docker.internal:11434

# Open poort 3456
EXPOSE 3456

# Start het Node.js MCP-serverproces
CMD ["node", "src/server.js"]
