#!/bin/bash

echo "🌱 Starting Civil Sathi Servers..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python first."
    exit 1
fi

echo "✅ Node.js and Python are installed"
echo

# Kill any existing processes on ports 5000 and 8080
echo "🔧 Cleaning up existing processes..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

echo
echo "🚀 Starting servers..."
echo

# Start backend server in background
echo "Starting Backend Server (Port 5000)..."
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server in background
echo "Starting Frontend Server (Port 8080)..."
if command -v python3 &> /dev/null; then
    python3 -m http.server 8080 &
else
    python -m http.server 8080 &
fi
FRONTEND_PID=$!

echo
echo "✅ Servers are starting up!"
echo
echo "📱 Frontend: http://localhost:8080"
echo "🔧 Backend API: http://localhost:5000"
echo
echo "Press Ctrl+C to stop all servers"
echo

# Function to cleanup on exit
cleanup() {
    echo
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Open browser (Linux/Mac)
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8080
elif command -v open &> /dev/null; then
    open http://localhost:8080
fi

echo "🎉 Civil Sathi is now running!"
echo "Press Ctrl+C to stop all servers"

# Wait for user to stop
wait
