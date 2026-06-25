#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "Starting infrastructure services..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start the services
docker compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
done
echo "PostgreSQL is ready!"

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
until docker compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    sleep 1
done
echo "Redis is ready!"

POSTGRES_ADDRESS="$(docker compose port postgres 5432)"
REDIS_ADDRESS="$(docker compose port redis 6379)"

echo ""
echo "Infrastructure is up and running!"
echo ""
echo "Services:"
echo "  - PostgreSQL: $POSTGRES_ADDRESS (user: postgres, password: postgres, db: finance)"
echo "  - Redis:      $REDIS_ADDRESS"
echo ""
echo "Connection strings:"
echo "  DATABASE_URL=postgresql://postgres:postgres@$POSTGRES_ADDRESS/finance"
echo "  REDIS_URL=redis://$REDIS_ADDRESS"
echo ""
echo "Run 'pnpm infra:down' to stop all services"
echo "Run 'pnpm infra:debug' to start with pgAdmin and Redis Commander"
