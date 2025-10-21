@echo off
echo Fixing React multiple instances error...
echo.

echo Removing node_modules...
rmdir /s /q node_modules 2>nul

echo Removing .vite cache...
rmdir /s /q .vite 2>nul

echo Removing package-lock.json...
del package-lock.json 2>nul

echo.
echo Reinstalling dependencies...
npm install

echo.
echo Done! Now run: npm run dev
pause
