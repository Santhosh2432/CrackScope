@echo off
echo ============================================
echo   CrackScope - Full Stack Launcher
echo ============================================
echo.
echo Starting Backend (port 8000)...
start "CrackScope Backend" cmd /k "cd /d "%~dp0backend" && pip install -r requirements.txt --quiet && python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 4 /nobreak >nul

echo Starting Frontend (port 5173)...
start "CrackScope Frontend" cmd /k "cd /d "%~dp0frontend" && npm install && npm run dev"

timeout /t 4 /nobreak >nul

echo.
echo Opening browser...
start http://localhost:5173

echo.
echo Both servers are running.
echo Backend  : http://localhost:8000
echo Frontend : http://localhost:5173
echo.
echo Close the two terminal windows to stop.
pause
