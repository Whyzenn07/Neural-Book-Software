@echo off
title SKIPS - PDF Chapter Extractor
echo ===================================================
echo   Starting SKIPS PDF Chapter Extractor Locally...
echo ===================================================
echo.

cd /d "%~dp0backend"
echo [1/2] Launching Python FastAPI Server on port 8000...
start "SKIPS Backend & Web App" python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

echo [2/2] Opening browser at http://localhost:8000 ...
timeout /t 2 /nobreak >nul
start http://localhost:8000

echo.
echo ===================================================
echo   App is running at: http://localhost:8000
echo   Close the backend terminal window to stop.
echo ===================================================
pause
