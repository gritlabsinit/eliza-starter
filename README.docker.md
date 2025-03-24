# Docker Setup for Eliza Starter with Agents

This guide explains how to use the Docker setup to run the Eliza Starter application with agents loaded from a YAML file.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git repository set up for your project

## Overview

The Docker setup allows you to:

1. Build and run the Eliza Starter application in a containerized environment
2. Load agents from the `config/agents.yml` file
3. Link with the local Eliza package and reference the GitHub repository

## Configuration

### Environment Variables

Add your API keys and other environment variables in the `docker-compose.yml` file:

```yaml
environment:
  - NODE_ENV=production
  - API_KEY=your_api_key
  - OPENAI_API_KEY=your_openai_api_key
  - PORTKEY_API_KEY=your_portkey_api_key
```

### Agent Configuration

Edit the `config/agents.yml` file to configure your agents. The file should have this structure:

```yaml
agents:
  - name: "AgentName"
    personality: "Agent personality description"
    strategy: "Agent strategy description"
    background: "Agent background information"
    goals:
      - "Goal 1"
      - "Goal 2"
    llm_gateway: "portkey"  # or other provider
    config: "your-config-id"
    llm_model: "model-name"
    llm_provider: "provider-name"
    temperature: 0.7
    tone: "Description of the agent's tone and communication style"
```

## Building and Running

### Using Docker Compose (Recommended)

1. From the `eliza-starter` directory, run:
   ```bash
   docker-compose up --build
   ```

2. To run in detached mode:
   ```bash
   docker-compose up --build -d
   ```

3. To stop the container:
   ```bash
   docker-compose down
   ```

### Using Docker Directly

1. Build the Docker image:
   ```bash
   docker build -t eliza-starter -f Dockerfile ..
   ```
   Note: The build context is set to the parent directory to include both the eliza and eliza-starter directories.

2. Run the container:
   ```bash
   docker run -p 3000:3000 -v ./data:/app/data -v ./config:/app/config eliza-starter
   ```

## Data Persistence

The application data is stored in the `data` directory, which is mounted as a volume in the Docker container. This ensures that your data persists across container restarts.

## Logs and Debugging

- View container logs:
  ```bash
  docker-compose logs -f
  ```

- Access a running container:
  ```bash
  docker-compose exec eliza-starter sh
  ```

## Modifications

### Custom Ports

To use a different port, update both the `docker-compose.yml` file and the `Dockerfile`:

```yaml
# In docker-compose.yml
ports:
  - "8080:3000"  # Maps host port 8080 to container port 3000
```

### Custom Agent File

To use a different agents file, update the CMD instruction in the Dockerfile:

```dockerfile
CMD ["pnpm", "start", "--agents", "path/to/your/agents.yml", "--non-interactive"]
```

## Troubleshooting

- If you encounter issues with permissions, make sure the data directory is writable.
- If the container fails to start, check the logs for error messages.
- If you have issues with package dependencies, you may need to rebuild the image with `--no-cache` option.
