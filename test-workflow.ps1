# Test script to validate workflow components before pushing
Write-Host "Testing GitHub Actions workflow components..." -ForegroundColor Green

# Test 1: Check if required files exist
Write-Host "`n1. Checking required files..." -ForegroundColor Blue
$requiredFiles = @(
    ".github/workflows/build-release.yml",
    "src-tauri/tauri.conf.json",
    "package.json"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
    }
}

# Test 2: Validate YAML syntax (basic check)
Write-Host "`n2. Validating YAML syntax..." -ForegroundColor Blue
try {
    $yamlContent = Get-Content ".github/workflows/build-release.yml" -Raw
    if ($yamlContent -match "name:" -and $yamlContent -match "jobs:" -and $yamlContent -match "steps:") {
        Write-Host "✅ YAML structure looks valid" -ForegroundColor Green
    } else {
        Write-Host "❌ YAML structure invalid" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error reading YAML file" -ForegroundColor Red
}

# Test 3: Check Tauri config
Write-Host "`n3. Checking Tauri configuration..." -ForegroundColor Blue
$tauriConfig = Get-Content "src-tauri/tauri.conf.json" | ConvertFrom-Json
if ($tauriConfig.bundle.targets -contains "msi" -and $tauriConfig.bundle.targets -contains "nsis") {
    Write-Host "✅ Windows targets configured" -ForegroundColor Green
} else {
    Write-Host "❌ Windows targets missing" -ForegroundColor Red
}

if ($tauriConfig.bundle.targets -contains "dmg" -and $tauriConfig.bundle.targets -contains "app") {
    Write-Host "✅ Mac targets configured" -ForegroundColor Green
} else {
    Write-Host "❌ Mac targets missing" -ForegroundColor Red
}

if ($tauriConfig.bundle.targets -contains "deb" -and $tauriConfig.bundle.targets -contains "appimage") {
    Write-Host "✅ Linux targets configured" -ForegroundColor Green
} else {
    Write-Host "❌ Linux targets missing" -ForegroundColor Red
}

# Test 4: Check if build works locally
Write-Host "`n4. Testing local build..." -ForegroundColor Blue
if (Test-Path "src-tauri/target/release/bundle/msi/GlChemDraw_0.1.0_x64_en-US.msi") {
    Write-Host "✅ Windows MSI build exists" -ForegroundColor Green
} else {
    Write-Host "❌ Windows MSI build missing" -ForegroundColor Red
}

if (Test-Path "src-tauri/target/release/bundle/nsis/GlChemDraw_0.1.0_x64-setup.exe") {
    Write-Host "✅ Windows NSIS build exists" -ForegroundColor Green
} else {
    Write-Host "❌ Windows NSIS build missing" -ForegroundColor Red
}

# Test 5: Check workflow file paths
Write-Host "`n5. Validating workflow file paths..." -ForegroundColor Blue
$workflowContent = Get-Content ".github/workflows/build-release.yml" -Raw

# Check if all required steps exist
$requiredSteps = @(
    "Checkout repository",
    "Setup Node.js",
    "Install Rust",
    "Install Tauri CLI",
    "Install dependencies",
    "Build frontend",
    "Build Tauri app",
    "Upload MSI",
    "Upload NSIS"
)

foreach ($step in $requiredSteps) {
    if ($workflowContent -match $step) {
        Write-Host "✅ Step '$step' found" -ForegroundColor Green
    } else {
        Write-Host "❌ Step '$step' missing" -ForegroundColor Red
    }
}

Write-Host "`n🎯 Workflow validation complete!" -ForegroundColor Cyan
Write-Host "If all tests pass, the workflow should work correctly." -ForegroundColor Yellow
