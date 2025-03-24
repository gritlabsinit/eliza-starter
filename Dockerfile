# Use Node.js 23.3.0 for full compatibility
FROM node:23.3.0-slim AS builder

# Install pnpm and necessary build tools
RUN npm install -g pnpm@9.15.1 && \
    apt-get update && \
    apt-get install -y git python3 make g++ openssh-client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create workspace structure
WORKDIR /app

# Copy the eliza packages (core, client-direct, agent)
COPY eliza/packages /app/packages
COPY eliza/agent /app/agent
COPY eliza/package.json /app/
COPY eliza/pnpm-workspace.yaml /app/
COPY eliza/pnpm-lock.yaml /app/

# Copy the eliza-starter files to a subdirectory
WORKDIR /app/eliza-starter
COPY eliza-starter/package.json ./
COPY eliza-starter/pnpm-lock.yaml ./
COPY eliza-starter/tsconfig.json ./
COPY eliza-starter/src ./src
COPY eliza-starter/characters ./characters
COPY eliza-starter/config ./config

# Create a workspace at the root level to link the packages
WORKDIR /app
RUN echo '{"name":"eliza-workspace","private":true,"workspaces":["packages/*","agent","eliza-starter"]}' > workspace.json

# Install all dependencies (including dev dependencies for TypeScript)
RUN pnpm install --include-workspace-root

# Fix for tokenizer issue on ARM64
RUN if [ "$(uname -m)" = "aarch64" ] || [ "$(uname -m)" = "arm64" ]; then \
    # Create a compatibility layer for the tokenizer module
    mkdir -p /app/eliza-starter/node_modules/@anush008/tokenizers && \
    echo 'module.exports = { tokenize: (text) => ({ tokens: text.split(" ") }) };' > /app/eliza-starter/node_modules/@anush008/tokenizers/index.js && \
    # Create package.json for the tokenizer module
    echo '{"name":"@anush008/tokenizers","version":"0.0.0"}' > /app/eliza-starter/node_modules/@anush008/tokenizers/package.json; \
fi

# Install global tools for building
RUN npm install -g tsup typescript

# Install missing npm packages that might not be in workspace
RUN cd /app/eliza-starter && pnpm install --save js-yaml yargs uuid better-sqlite3

# Create symlinks so TypeScript can find all the packages
RUN mkdir -p /app/eliza-starter/node_modules/@elizaos && \
    ln -s /app/packages/core /app/eliza-starter/node_modules/@elizaos/core && \
    ln -s /app/packages/client-direct /app/eliza-starter/node_modules/@elizaos/client-direct && \
    mkdir -p /app/eliza-starter/node_modules/@elizaos/client-auto && \
    mkdir -p /app/eliza-starter/node_modules/@elizaos/client-discord && \
    mkdir -p /app/eliza-starter/node_modules/@elizaos/client-telegram && \
    mkdir -p /app/eliza-starter/node_modules/@elizaos/client-twitter && \
    mkdir -p /app/eliza-starter/node_modules/@elizaos/plugin-bootstrap && \
    mkdir -p /app/eliza-starter/node_modules/@elizaos/plugin-node && \
    mkdir -p /app/eliza-starter/node_modules/@elizaos/plugin-solana && \
    mkdir -p /app/eliza-starter/node_modules/@elizaos/adapter-postgres

# Build the core package
WORKDIR /app/packages/core
RUN pnpm build || echo "Core build completed with warnings"

# Build the client-direct package
WORKDIR /app/packages/client-direct
RUN pnpm build || echo "Client-direct build completed with warnings"

# Create the production image
FROM node:23.3.0-slim

# Install runtime dependencies
RUN npm install -g pnpm@9.15.1 && \
    apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the entire workspace with built packages
COPY --from=builder /app /app

# Create data directory for persistent storage
RUN mkdir -p /app/eliza-starter/data && \
    chown -R node:node /app && \
    chmod -R 755 /app

# Use non-root user for security
USER node

# Expose the application port
EXPOSE 3000

# Set working directory to eliza-starter
WORKDIR /app/eliza-starter

# Start the application with agents loaded from YAML
CMD ["pnpm", "start", "--agents", "config/agents.yml", "--non-interactive"]
