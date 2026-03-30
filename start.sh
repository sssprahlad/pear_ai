#!/bin/bash

echo "🚀 Starting AI Creative Studio..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Start backend server
echo "📡 Starting backend server..."
cd server
node src/server.js &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend development server
echo "🎨 Starting frontend development server..."
cd ../client
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ AI Creative Studio is starting up!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up trap to catch Ctrl+C
trap cleanup INT

# Wait for both processes
wait
