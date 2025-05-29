@echo off
echo.
echo 🚀 Starting RocketryBox Development Environment with ngrok
echo ========================================================
echo.

REM Check if ngrok is installed
ngrok version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ngrok is not installed or not in PATH
    echo.
    echo Please install ngrok first:
    echo   npm install -g ngrok
    echo   OR download from https://ngrok.com/download
    echo.
    pause
    exit /b 1
)

echo ✅ ngrok is installed
echo.

REM Check if we're in the backend directory
if not exist "package.json" (
    echo ❌ Please run this script from the backend directory
    echo   Current directory: %cd%
    echo   Expected: D:\RocketryBox\backend
    echo.
    pause
    exit /b 1
)

echo ✅ In correct directory: %cd%
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    echo.
)

echo 🏗️ Starting development servers...
echo.

REM Start the backend server in background
echo 🟢 Starting Node.js server on http://localhost:8000...
start "RocketryBox Backend" cmd /k "npm run dev"

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Start ngrok tunnel
echo 🌐 Starting ngrok tunnel...
echo.
echo 📝 IMPORTANT: 
echo   1. Copy the HTTPS URL from ngrok (e.g., https://abc123.ngrok.io)
echo   2. Use this URL in Razorpay Dashboard for webhook configuration
echo   3. Webhook endpoint: https://your-ngrok-url.ngrok.io/api/webhooks/razorpay
echo.
echo 🎯 ngrok Dashboard will be available at: http://127.0.0.1:4040
echo.

REM Start ngrok (this will run in foreground)
ngrok http 8000

echo.
echo 👋 ngrok stopped. Backend server may still be running.
echo   Check the other terminal window to stop it.
pause 