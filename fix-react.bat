@echo off
echo Fixing React hooks error by clearing cache and reinstalling dependencies...

echo.
echo Clearing Vite cache...
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"

echo.
echo Clearing npm cache...
npm cache clean --force

echo.
echo Reinstalling dependencies...
npm install

echo.
echo Starting development server...
npm run dev

pause