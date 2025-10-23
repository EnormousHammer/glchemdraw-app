@echo off
echo Creating GitHub release with Windows installers...

REM Create release using curl (if available)
curl -X POST ^
  -H "Accept: application/vnd.github.v3+json" ^
  -H "Authorization: token YOUR_TOKEN_HERE" ^
  -H "Content-Type: application/json" ^
  https://api.github.com/repos/EnormousHammer/glchemdraw-app/releases ^
  -d "{\"tag_name\":\"v0.1.1\",\"name\":\"React Hooks Fix & Ketcher Loading Improvements\",\"body\":\"Fixed React hooks errors and Ketcher infinite loading. Added Windows installers.\",\"draft\":false,\"prerelease\":false}"

echo.
echo Release created! Now uploading files...
echo Go to: https://github.com/EnormousHammer/glchemdraw-app/releases
echo Upload these files manually:
echo - release/GlChemDraw_0.1.0_x64_en-US.msi
echo - release/GlChemDraw_0.1.0_x64-setup.exe

pause
