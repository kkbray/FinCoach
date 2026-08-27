@echo off
setlocal
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found. Open index.html in Microsoft Edge or Chrome instead.
  pause
  exit /b 1
)

powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 1; Start-Process 'http://127.0.0.1:4173/'"

echo FinCoach prototype is running at http://127.0.0.1:4173/
echo Keep this window open. Close it only when you are done.
echo.
python -m http.server 4173 -b 127.0.0.1
