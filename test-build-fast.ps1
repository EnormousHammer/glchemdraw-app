# Fast Build Test - Skip heavy dependencies
Write-Host "=== FAST BUILD TEST ===" -ForegroundColor Green

# Check dependencies
Write-Host "Checking dependencies..." -ForegroundColor Yellow
node --version
npm --version
rustc --version
cargo --version

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
npm ci

# Build frontend with reduced memory usage
Write-Host "`nBuilding frontend (optimized)..." -ForegroundColor Yellow
$env:NODE_OPTIONS = "--max-old-space-size=4096"
npm run build

# Check if build succeeded
if (Test-Path "dist") {
    Write-Host "✅ Frontend build successful!" -ForegroundColor Green
    Write-Host "`nFrontend files:" -ForegroundColor Cyan
    Get-ChildItem -Path "dist" -Recurse | ForEach-Object {
        Write-Host "  $($_.Name) - $($_.Length) bytes" -ForegroundColor White
    }
} else {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}

# Try Tauri build with reduced memory
Write-Host "`nBuilding Tauri app (optimized)..." -ForegroundColor Yellow
$env:NODE_OPTIONS = "--max-old-space-size=4096"
npm run tauri build

# Check results
Write-Host "`nChecking build results..." -ForegroundColor Yellow
if (Test-Path "src-tauri/target/release/bundle") {
    Write-Host "✅ Tauri build successful!" -ForegroundColor Green
    Write-Host "`nFiles created:" -ForegroundColor Cyan
    Get-ChildItem -Path "src-tauri/target/release/bundle" -Recurse | ForEach-Object {
        Write-Host "  $($_.Name) - $($_.Length) bytes" -ForegroundColor White
    }
} else {
    Write-Host "❌ Tauri build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== FAST BUILD TEST SUCCESS ===" -ForegroundColor Green
