@echo off
echo ========================================
echo Starting Hackathon Registration Frontend
echo ========================================
cd /d %~dp0frontend
echo.
echo Starting local server...
echo Frontend will open at http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8000
if errorlevel 1 (
    echo.
    echo Python not found. Trying Node.js http-server...
    npx http-server -p 8000
)
pause
