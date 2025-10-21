@echo off
REM GlChemDraw Launch Script
REM Enterprise Chemistry Drawing Application

echo ========================================
echo    GlChemDraw - Launch Script
echo    Starting Development Server...
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found! Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [2/3] Checking Rust...
rustc --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Rust not found! Please install Rust from https://rustup.rs/
    pause
    exit /b 1
)

echo [3/3] Launching GlChemDraw...
echo.
echo NOTE: First launch may take 1-2 minutes while Rust compiles...
echo.

npm run dev 2>&1

if errorlevel 1 (
    echo.
    echo ========================================
    echo    Launch Failed!
    echo ========================================
    echo.
    echo Common fixes:
    echo 1. Run: npm install
    echo 2. Check Node.js version (need 20.19+ or 22.12+)
    echo 3. Check logs above for errors
    echo.
    echo Press any key to close...
    pause >nul
    exit /b 1
)

echo.
echo Press any key to close...
pause >nul

echo.
echo ========================================
echo    GlChemDraw Closed
echo ========================================
pause

