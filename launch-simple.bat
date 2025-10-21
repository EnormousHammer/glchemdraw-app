@echo off
REM Simple GlChemDraw Launcher - Web Version Only
REM Bypasses port conflicts

echo ========================================
echo    GlChemDraw - Simple Launcher
echo    Starting Web Version...
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Killing any existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :1420') do taskkill /f /pid %%a >nul 2>&1

echo [2/2] Starting Vite dev server...
echo.
echo Opening browser at: http://localhost:1420
echo Press Ctrl+C to stop
echo.

start http://localhost:1420
npm run dev

echo.
echo ========================================
echo    Server Stopped
echo ========================================
pause
