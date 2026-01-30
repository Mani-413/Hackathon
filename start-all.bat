@echo off
echo ========================================
echo Starting Hackathon Registration System
echo ========================================
echo.
echo This will start both backend and frontend servers
echo.
echo Step 1: Starting Backend Server...
cd backend
if not exist node_modules (
    echo Installing dependencies first...
    call npm install
)
cd ..
start "Backend Server" cmd /k "cd /d %~dp0backend && npm start"
timeout /t 5 /nobreak >nul
echo.
echo Step 2: Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %~dp0frontend && python -m http.server 8000"
timeout /t 3 /nobreak >nul
echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo Backend: http://localhost:3000
echo Frontend: http://localhost:8000
echo.
echo Open your browser and go to: http://localhost:8000
echo.
pause
