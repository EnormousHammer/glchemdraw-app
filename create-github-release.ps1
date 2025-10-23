# PowerShell script to create GitHub release
# This script will help you create the release with the installer files

Write-Host "🚀 Creating GitHub Release for GlChemDraw v0.1.1" -ForegroundColor Green

# Check if GitHub CLI is authenticated
$authStatus = gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ GitHub CLI not authenticated. Please run: gh auth login" -ForegroundColor Red
    Write-Host "Or set GH_TOKEN environment variable" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ GitHub CLI authenticated" -ForegroundColor Green

# Create the release
Write-Host "📦 Creating release..." -ForegroundColor Blue
gh release create v0.1.1 `
    --title "🔧 React Hooks Fix & Ketcher Loading Improvements" `
    --notes-file "release/RELEASE_NOTES_v0.1.1.md" `
    "release/GlChemDraw_0.1.0_x64_en-US.msi" `
    "release/GlChemDraw_0.1.0_x64-setup.exe"

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 Release created successfully!" -ForegroundColor Green
    Write-Host "🔗 View at: https://github.com/EnormousHammer/glchemdraw-app/releases" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to create release" -ForegroundColor Red
    Write-Host "💡 Try creating manually at: https://github.com/EnormousHammer/glchemdraw-app/releases" -ForegroundColor Yellow
}
