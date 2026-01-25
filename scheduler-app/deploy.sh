#!/usr/bin/env bash
set -euo pipefail

echo "Building and starting services via docker-compose..."
docker compose up --build -d

echo "Run migrations (none currently)." 
echo "App should be available at http://localhost:4000"
