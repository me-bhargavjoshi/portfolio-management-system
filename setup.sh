#!/bin/bash

# Portfolio Management - Setup Script
# This script initializes the development environment

set -e

echo "🚀 Portfolio Management - Development Setup"
echo "============================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker"
    exit 1
fi

echo "✅ Prerequisites OK"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d
echo "✅ Docker services started"
echo ""

# Wait for database
echo "⏳ Waiting for database to be ready..."
sleep 5
for i in {1..30}; do
    if docker exec portfolio-db pg_isready -U portfolio_user &> /dev/null; then
        echo "✅ Database is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Database failed to start"
        exit 1
    fi
    sleep 1
done

echo ""
echo "✨ Setup Complete!"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3001/api"
echo "   Database:  postgresql://portfolio_user@localhost:5432/portfolio_management"
echo ""
echo "📝 Next steps:"
echo "   1. Start backend: npm run dev --workspace=backend"
echo "   2. Start frontend: npm run dev --workspace=frontend"
echo "   3. Open http://localhost:3000 in your browser"
echo ""
echo "🛑 To stop services:"
echo "   npm run docker:down"
echo ""
