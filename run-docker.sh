#!/bin/bash

# Run Eliza Starter with Docker and required environment variables
# Usage: ./run-docker.sh

# Load variables from .env file if it exists
if [ -f .env ]; then
  echo "Loading environment variables from .env file"
  source .env
fi

# Check for required environment variables
if [ -z "$PORTKEY_API_KEY" ]; then
  echo "Error: PORTKEY_API_KEY is not set"
  echo "Please set it in your .env file or provide it as an environment variable"
  exit 1
fi

# Run docker-compose with the required environment variables
PORTKEY_API_KEY=$PORTKEY_API_KEY \
EMBEDDING_PORTKEY_MODEL=openai/text-embedding-3-small \
POSTGRES_URL=${POSTGRES_URL:-} \
docker-compose up "$@"

# Note: You can add more options by passing them as arguments:
# For example: ./run-docker.sh --build -d
# - Use --build to rebuild the container
# - Use -d to run in detached mode
