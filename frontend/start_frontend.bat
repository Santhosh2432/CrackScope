@echo off
echo ================================
echo   CrackScope Frontend
echo ================================
cd /d "%~dp0"
echo Installing npm packages...
npm install
echo.
echo Starting frontend on http://localhost:5173
echo.
npm run dev
pause
