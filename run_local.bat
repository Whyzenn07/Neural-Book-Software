@echo off
title SKIPS - PDF Chapter Extractor
echo ===================================================
echo   Starting SKIPS PDF Chapter Extractor Locally...
echo ===================================================
echo.

cd /d "%~dp0backend"

:: Check if virtual environment exists
if exist "venv\Scripts\python.exe" (
    set "PY_CMD=venv\Scripts\python.exe"
) else (
    set "PY_CMD=python"
)

echo [1/2] Launching Python FastAPI Server on port 8000...
start "SKIPS Backend Server" cmd /k "%PY_CMD% -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Opening browser at http://127.0.0.1:8000 ...
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:8000"

echo.
echo ===================================================
echo   App is running at: http://127.0.0.1:8000
echo   Close the backend terminal window to stop.
echo ===================================================
pause


