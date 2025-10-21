@echo off
REM GlChemDraw Desktop Launch Script
REM Launches Tauri Desktop Application with NMR support

echo ========================================
echo    GlChemDraw - Desktop Version
echo    Starting Tauri Desktop App...
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found! Please install Node.js from https://nodejs.org/
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo [2/3] Checking Rust...
rustc --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Rust not found! Please install Rust from https://rustup.rs/
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo [3/3] Launching Desktop App...
echo.
echo NOTE: First launch may take 2-5 minutes while Rust compiles...
echo This enables full desktop features like:
echo   - Native file dialogs
echo   - Folder selection for Bruker NMR data
echo   - Full file system access
echo.

npm run tauri dev

if errorlevel 1 (
    echo.
    echo ========================================
    echo    Launch Failed!
    echo ========================================
    echo.
    echo Common fixes:
    echo 1. Run: npm install
    echo 2. Make sure Rust is installed: https://rustup.rs/
    echo 3. Check logs above for errors
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo ========================================
echo    Desktop App Closed
echo ========================================
echo Press any key to exit...
pause >nul


