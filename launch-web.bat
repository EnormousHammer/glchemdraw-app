@echo off
echo Closing all existing instances...
echo.

REM Kill all Node.js processes
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM vite.exe >nul 2>&1

REM Wait a moment for processes to close
timeout /t 2 /nobreak >nul

echo Starting GlChemDraw Web Application...
echo.
echo This will open the application in your default web browser.
echo The web version should have full NMRium functionality.
echo.
echo Starting development server...
npm run dev