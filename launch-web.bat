@echo off
REM GlChemDraw Web Launch Script
REM Launches web version only (no Tauri desktop)

echo ========================================
echo    GlChemDraw - Web Version
echo    Starting Development Server...
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found! Please install Node.js from https://nodejs.org/
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo [2/2] Starting Vite dev server...
echo.
echo Opening browser at: http://localhost:1420
echo.
echo Press Ctrl+C to stop the server
echo.

start http://localhost:1420

npm run dev

echo.
echo ========================================
echo    Server Stopped
echo ========================================
echo Press any key to exit...
pause >nul

