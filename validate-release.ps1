# Release Validation Script
# Validates that all files are ready for release

Write-Host "=== RELEASE VALIDATION ===" -ForegroundColor Green

# Check version consistency
Write-Host "`n=== CHECKING VERSION CONSISTENCY ===" -ForegroundColor Yellow

$packageVersion = (Get-Content "package.json" | ConvertFrom-Json).version
$tauriVersion = (Get-Content "src-tauri/tauri.conf.json" | ConvertFrom-Json).version
$cargoVersion = (Get-Content "src-tauri/Cargo.toml" | ConvertFrom-Json).version

Write-Host "Package.json version: $packageVersion" -ForegroundColor Cyan
Write-Host "Tauri config version: $tauriVersion" -ForegroundColor Cyan
Write-Host "Cargo.toml version: $cargoVersion" -ForegroundColor Cyan

if ($packageVersion -eq $tauriVersion -and $tauriVersion -eq $cargoVersion) {
    Write-Host "✅ All versions match" -ForegroundColor Green
} else {
    Write-Host "❌ Version mismatch detected" -ForegroundColor Red
    exit 1
}

# Check if build files exist
Write-Host "`n=== CHECKING BUILD FILES ===" -ForegroundColor Yellow

if (Test-Path "src-tauri/target/release/bundle") {
    Write-Host "✅ Bundle directory exists" -ForegroundColor Green
    
    # List all files in bundle directory
    Write-Host "`nFiles in bundle directory:" -ForegroundColor Cyan
    Get-ChildItem -Path "src-tauri/target/release/bundle" -Recurse | ForEach-Object {
        Write-Host "  $($_.FullName)" -ForegroundColor White
    }
    
    # Check for MSI
    $msiFiles = Get-ChildItem -Path "src-tauri/target/release/bundle" -Recurse -Name "*.msi"
    if ($msiFiles) {
        Write-Host "✅ MSI files found: $($msiFiles -join ', ')" -ForegroundColor Green
    } else {
        Write-Host "❌ No MSI files found" -ForegroundColor Red
    }
    
    # Check for EXE
    $exeFiles = Get-ChildItem -Path "src-tauri/target/release/bundle" -Recurse -Name "*.exe"
    if ($exeFiles) {
        Write-Host "✅ EXE files found: $($exeFiles -join ', ')" -ForegroundColor Green
    } else {
        Write-Host "❌ No EXE files found" -ForegroundColor Red
    }
    
    # Check for DMG (if macOS build)
    $dmgFiles = Get-ChildItem -Path "src-tauri/target/release/bundle" -Recurse -Name "*.dmg"
    if ($dmgFiles) {
        Write-Host "✅ DMG files found: $($dmgFiles -join ', ')" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  No DMG files found (expected on Windows)" -ForegroundColor Yellow
    }
    
    # Check for APP (if macOS build)
    $appDirs = Get-ChildItem -Path "src-tauri/target/release/bundle" -Recurse -Name "*.app"
    if ($appDirs) {
        Write-Host "✅ APP directories found: $($appDirs -join ', ')" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  No APP directories found (expected on Windows)" -ForegroundColor Yellow
    }
    
    # Check for DEB (if Linux build)
    $debFiles = Get-ChildItem -Path "src-tauri/target/release/bundle" -Recurse -Name "*.deb"
    if ($debFiles) {
        Write-Host "✅ DEB files found: $($debFiles -join ', ')" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  No DEB files found (expected on Windows)" -ForegroundColor Yellow
    }
    
    # Check for AppImage (if Linux build)
    $appImageFiles = Get-ChildItem -Path "src-tauri/target/release/bundle" -Recurse -Name "*.AppImage"
    if ($appImageFiles) {
        Write-Host "✅ AppImage files found: $($appImageFiles -join ', ')" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  No AppImage files found (expected on Windows)" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "❌ Bundle directory not found. Run build first." -ForegroundColor Red
    exit 1
}

# Check GitHub CLI
Write-Host "`n=== CHECKING GITHUB CLI ===" -ForegroundColor Yellow
try {
    $ghVersion = gh --version
    Write-Host "✅ GitHub CLI version: $ghVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ GitHub CLI not found" -ForegroundColor Red
    Write-Host "Install from: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Check if logged into GitHub
try {
    $ghUser = gh auth status
    Write-Host "✅ GitHub CLI authenticated" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged into GitHub CLI" -ForegroundColor Red
    Write-Host "Run: gh auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n=== RELEASE VALIDATION COMPLETE ===" -ForegroundColor Green
Write-Host "Ready for release! Run: git tag v$packageVersion && git push origin v$packageVersion" -ForegroundColor Green
