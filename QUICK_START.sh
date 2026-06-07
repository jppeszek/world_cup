#!/bin/bash
set -e

echo "🚀 World Cup Prediction App - Quick Setup"
echo "=========================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version)"
echo "✅ npm $(npm --version)"
echo ""

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found locally"
    echo "Install from https://www.postgresql.org/download/"
    echo "Or use a cloud database (see DEPLOYMENT_GUIDE.md)"
fi

echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "⚙️  Creating environment files..."

# Backend .env
if [ ! -f backend/.env ]; then
    cp .env.example backend/.env
    echo "✅ Created backend/.env"
    echo "   ⚠️  Update with your database URL and API keys"
else
    echo "✅ backend/.env already exists"
fi

# Frontend .env.local
if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.local.example frontend/.env.local
    echo "✅ Created frontend/.env.local"
else
    echo "✅ frontend/.env.local already exists"
fi

echo ""
echo "🎯 Next steps:"
echo ""
echo "1. Set up PostgreSQL database:"
echo "   createdb world_cup"
echo ""
echo "2. Update backend/.env with your database connection"
echo ""
echo "3. Run migrations:"
echo "   cd backend && npm run migrate && npm run seed"
echo ""
echo "4. Start backend (Terminal 1):"
echo "   cd backend && npm run dev"
echo ""
echo "5. Start frontend (Terminal 2):"
echo "   cd frontend && npm run dev"
echo ""
echo "6. Open browser: http://localhost:5173"
echo ""
echo "7. Run tests:"
echo "   cd backend && npm test"
echo ""
