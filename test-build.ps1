# Simple Build Test
Write-Host "=== TESTING BUILD ===" -ForegroundColor Green

# Check dependencies
Write-Host "Checking dependencies..." -ForegroundColor Yellow
node --version
npm --version
rustc --version
cargo --version

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
npm ci

# Build frontend
Write-Host "`nBuilding frontend..." -ForegroundColor Yellow
npm run build

# Build Tauri app
Write-Host "`nBuilding Tauri app..." -ForegroundColor Yellow
npm run tauri build

# Check results
Write-Host "`nChecking build results..." -ForegroundColor Yellow
if (Test-Path "src-tauri/target/release/bundle") {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host "`nFiles created:" -ForegroundColor Cyan
    Get-ChildItem -Path "src-tauri/target/release/bundle" -Recurse | ForEach-Object {
        Write-Host "  $($_.Name) - $($_.Length) bytes" -ForegroundColor White
    }
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
