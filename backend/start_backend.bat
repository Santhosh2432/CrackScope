@echo off
echo ================================
echo   CrackScope Backend
echo ================================
cd /d "%~dp0"
echo Installing dependencies...
pip install -r requirements.txt --quiet
echo.
echo Starting backend on http://localhost:8000
echo.
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
pause
