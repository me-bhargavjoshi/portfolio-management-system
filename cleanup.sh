#!/bin/bash

# Portfolio Management - Cleanup Script
# Removes Docker containers and temporary files

echo "🧹 Cleaning up Portfolio Management..."

# Stop Docker containers
echo "Stopping Docker containers..."
docker-compose down -v

# Remove node_modules
echo "Removing node_modules..."
rm -rf backend/node_modules
rm -rf frontend/node_modules
rm -rf node_modules

# Remove build artifacts
echo "Removing build artifacts..."
rm -rf backend/dist
rm -rf frontend/dist
rm -rf frontend/build

# Remove logs
echo "Removing log files..."
rm -rf *.log

echo "✅ Cleanup complete"
