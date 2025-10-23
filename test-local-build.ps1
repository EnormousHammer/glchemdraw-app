# Local Build Test Script for GlChemDraw
# Run this to test builds locally before releasing

Write-Host "=== GLCHEMDRAW LOCAL BUILD TEST ===" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Not in project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "✅ In project root directory" -ForegroundColor Green

# Check Node.js
Write-Host "`n=== CHECKING NODE.JS ===" -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    exit 1
}

# Check NPM
try {
    $npmVersion = npm --version
    Write-Host "✅ NPM version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ NPM not found" -ForegroundColor Red
    exit 1
}

# Check Rust
Write-Host "`n=== CHECKING RUST ===" -ForegroundColor Yellow
try {
    $rustVersion = rustc --version
    Write-Host "✅ Rust version: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Rust not found" -ForegroundColor Red
    exit 1
}

# Check Cargo
try {
    $cargoVersion = cargo --version
    Write-Host "✅ Cargo version: $cargoVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Cargo not found" -ForegroundColor Red
    exit 1
}

# Check Tauri CLI
Write-Host "`n=== CHECKING TAURI CLI ===" -ForegroundColor Yellow
try {
    $tauriVersion = tauri --version
    Write-Host "✅ Tauri CLI version: $tauriVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Tauri CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @tauri-apps/cli@2.7.1
    $tauriVersion = tauri --version
    Write-Host "✅ Tauri CLI installed: $tauriVersion" -ForegroundColor Green
}

# Install dependencies
Write-Host "`n=== INSTALLING DEPENDENCIES ===" -ForegroundColor Yellow
Write-Host "Running: npm ci" -ForegroundColor Cyan
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ NPM install failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Build frontend
Write-Host "`n=== BUILDING FRONTEND ===" -ForegroundColor Yellow
Write-Host "Running: npm run build" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend built successfully" -ForegroundColor Green

# Check if dist directory exists
if (Test-Path "dist") {
    Write-Host "✅ Dist directory created" -ForegroundColor Green
} else {
    Write-Host "❌ Dist directory not found" -ForegroundColor Red
    exit 1
}

# Build Tauri app
Write-Host "`n=== BUILDING TAURI APP ===" -ForegroundColor Yellow
Write-Host "Running: npm run tauri build" -ForegroundColor Cyan
npm run tauri build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tauri build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Tauri app built successfully" -ForegroundColor Green

# Validate Windows files
Write-Host "`n=== VALIDATING WINDOWS FILES ===" -ForegroundColor Yellow

# Check if bundle directory exists
if (Test-Path "src-tauri/target/release/bundle") {
    Write-Host "✅ Bundle directory exists" -ForegroundColor Green
} else {
    Write-Host "❌ Bundle directory missing" -ForegroundColor Red
    exit 1
}

# Find MSI file
$msiFile = Get-ChildItem -Path "src-tauri/target/release/bundle" -Recurse -Name "*.msi" | Select-Object -First 1
if ($msiFile) {
    Write-Host "✅ MSI file found: $msiFile" -ForegroundColor Green
    $msiPath = "src-tauri/target/release/bundle/$msiFile"
    if (Test-Path $msiPath) {
        $msiSize = (Get-Item $msiPath).Length
        Write-Host "✅ MSI file exists at: $msiPath" -ForegroundColor Green
        Write-Host "✅ MSI file size: $msiSize bytes" -ForegroundColor Green
    } else {
        Write-Host "❌ MSI file not found at expected path" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ MSI file not found" -ForegroundColor Red
    Get-ChildItem -Path "src-tauri/target/release/bundle" -Recurse
    exit 1
}

# Find EXE file
$exeFile = Get-ChildItem -Path "src-tauri/target/release/bundle" -Recurse -Name "*.exe" | Select-Object -First 1
if ($exeFile) {
    Write-Host "✅ EXE file found: $exeFile" -ForegroundColor Green
    $exePath = "src-tauri/target/release/bundle/$exeFile"
    if (Test-Path $exePath) {
        $exeSize = (Get-Item $exePath).Length
        Write-Host "✅ EXE file exists at: $exePath" -ForegroundColor Green
        Write-Host "✅ EXE file size: $exeSize bytes" -ForegroundColor Green
    } else {
        Write-Host "❌ EXE file not found at expected path" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ EXE file not found" -ForegroundColor Red
    Get-ChildItem -Path "src-tauri/target/release/bundle" -Recurse
    exit 1
}

Write-Host "`n=== LOCAL BUILD TEST SUCCESS ===" -ForegroundColor Green
Write-Host "All files generated correctly. Ready for release!" -ForegroundColor Green
