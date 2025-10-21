# GlChemDraw - Quick Git Setup and Push to GitHub
Write-Host "🚀 Setting up Git and pushing GlChemDraw to GitHub..." -ForegroundColor Green
Write-Host ""

# Check if Git is already installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git is already installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "📥 Git not found. Downloading and installing Git for Windows..." -ForegroundColor Yellow
    
    # Download Git installer
    $gitInstallerUrl = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
    $gitInstallerPath = "$env:TEMP\Git-installer.exe"
    
    Write-Host "Downloading Git installer..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $gitInstallerUrl -OutFile $gitInstallerPath
    
    Write-Host "Installing Git (this may take a few minutes)..." -ForegroundColor Yellow
    Start-Process -FilePath $gitInstallerPath -ArgumentList "/VERYSILENT", "/NORESTART", "/NOCANCEL", "/SP-", "/CLOSEAPPLICATIONS", "/RESTARTAPPLICATIONS" -Wait
    
    # Add Git to PATH for current session
    $env:PATH += ";C:\Program Files\Git\bin"
    
    Write-Host "✅ Git installation complete!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔧 Setting up Git repository..." -ForegroundColor Cyan

# Initialize Git repository
git init
git config user.name "GlChemDraw Developer"
git config user.email "developer@glchemtec.com"

# Add remote repository
git remote add origin https://github.com/EnormousHammer/glchemdraw-app.git

# Add all files
Write-Host "📁 Adding all files to Git..." -ForegroundColor Yellow
git add .

# Commit with message
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "GlChemDraw v0.1.0 - Complete Chemistry Software with MSI Installer

- Professional chemistry structure drawing with Ketcher
- NMR spectroscopy analysis with Nmrium  
- PubChem integration for compound lookup
- 3D molecular visualization
- Batch import/export functionality
- Reaction editor component
- Comprehensive testing suite
- MSI and NSIS installers included
- Complete documentation and user guides
- MIT License - Open source"

# Set main branch and push
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git branch -M main
git push -u origin main

Write-Host ""
Write-Host "🎉 SUCCESS! Your GlChemDraw v0.1.0 has been pushed to GitHub!" -ForegroundColor Green
Write-Host "📍 Repository: https://github.com/EnormousHammer/glchemdraw-app" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to your repository on GitHub" -ForegroundColor White
Write-Host "2. Click 'Releases' → 'Create a new release'" -ForegroundColor White
Write-Host "3. Upload the MSI installer from the 'release' folder" -ForegroundColor White
Write-Host "4. Add release notes from RELEASE_NOTES.md" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
