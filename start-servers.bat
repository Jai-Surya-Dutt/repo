@echo off
echo 🌱 Starting Civil Sathi Servers...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python first.
    pause
    exit /b 1
)

echo ✅ Node.js and Python are installed
echo.

REM Kill any existing processes on ports 5000 and 8080
echo 🔧 Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do taskkill /PID %%a /F >nul 2>&1

echo.
echo 🚀 Starting servers...
echo.

REM Start backend server in new window
echo Starting Backend Server (Port 5000)...
start "Civil Sathi Backend" cmd /k "npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server in new window
echo Starting Frontend Server (Port 8080)...
start "Civil Sathi Frontend" cmd /k "python -m http.server 8080"

echo.
echo ✅ Servers are starting up!
echo.
echo 📱 Frontend: http://localhost:8080
echo 🔧 Backend API: http://localhost:5000
echo.
echo Press any key to open the application in your browser...
pause >nul

REM Open browser
start http://localhost:8080

echo.
echo 🎉 Civil Sathi is now running!
echo.
echo To stop the servers:
echo 1. Close the terminal windows that opened
echo 2. Or press Ctrl+C in each terminal
echo.
pause
