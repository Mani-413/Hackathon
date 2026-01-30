@echo off
echo ========================================
echo Starting Hackathon System (Direct Node)
echo ========================================

echo.
echo Step 1: Starting Backend (Direct Mode)...
cd backend
start "Backend Server" cmd /k "node server.js"
cd ..

timeout /t 3 /nobreak >nul

echo.
echo Step 2: Starting Frontend (Direct Mode)...
cd frontend
start "Frontend Server" cmd /k "node serve.js"
cd ..

echo.
echo ========================================
echo System Started!
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:8000
echo ========================================
echo.
pause
