@echo off
echo Installing Git for Windows...
echo.

REM Download Git for Windows
echo Downloading Git for Windows...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe' -OutFile 'git-installer.exe'"

echo.
echo Installing Git...
git-installer.exe /VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /RESTARTAPPLICATIONS /COMPONENTS="icons,ext\reg\shellhere,assoc,assoc_sh"

echo.
echo Waiting for installation to complete...
timeout /t 10 /nobreak > nul

echo.
echo Git installation complete! Now setting up repository...
echo.

REM Initialize Git repository
git init
git remote add origin https://github.com/EnormousHammer/glchemdraw-app.git
git add .
git commit -m "GlChemDraw v0.1.0 - Complete Chemistry Software with MSI Installer"
git branch -M main
git push -u origin main

echo.
echo SUCCESS! Your code has been pushed to GitHub!
echo Repository: https://github.com/EnormousHammer/glchemdraw-app
echo.
pause
