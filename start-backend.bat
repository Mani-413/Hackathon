@echo off
echo ========================================
echo Starting Hackathon Registration Backend
echo ========================================
cd /d %~dp0backend
echo.
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo.
) else (
    echo Dependencies already installed.
    echo.
)
echo Starting server...
echo Server will run on http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
if exist node_modules\express ( call npm start ) else ( echo Using standalone server (no npm dependencies required)... && node server-standalone.js )
pause
