# Test GitHub CLI commands that will be used in the workflow
Write-Host "Testing GitHub CLI commands..." -ForegroundColor Green

# Test 1: Check if gh command exists
Write-Host "`n1. Testing gh command availability..." -ForegroundColor Blue
try {
    $ghVersion = gh --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ GitHub CLI is available" -ForegroundColor Green
    } else {
        Write-Host "❌ GitHub CLI not available" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ GitHub CLI not found" -ForegroundColor Red
}

# Test 2: Check workflow YAML syntax
Write-Host "`n2. Testing workflow YAML syntax..." -ForegroundColor Blue
$workflowContent = Get-Content ".github/workflows/build-release.yml" -Raw

# Check for required elements
$requiredElements = @(
    "name:",
    "on:",
    "jobs:",
    "gh release create",
    "gh release upload"
)

foreach ($element in $requiredElements) {
    if ($workflowContent -match $element) {
        Write-Host "✅ Found: $element" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing: $element" -ForegroundColor Red
    }
}

# Test 3: Check if all platforms are configured
Write-Host "`n3. Testing platform configuration..." -ForegroundColor Blue
$platforms = @("build-windows", "build-macos", "build-linux")
foreach ($platform in $platforms) {
    if ($workflowContent -match $platform) {
        Write-Host "✅ Platform configured: $platform" -ForegroundColor Green
    } else {
        Write-Host "❌ Platform missing: $platform" -ForegroundColor Red
    }
}

# Test 4: Check file paths exist
Write-Host "`n4. Testing file paths..." -ForegroundColor Blue
$testFiles = @(
    "src-tauri/target/release/bundle/msi/GlChemDraw_0.1.0_x64_en-US.msi",
    "src-tauri/target/release/bundle/nsis/GlChemDraw_0.1.0_x64-setup.exe"
)

foreach ($file in $testFiles) {
    if (Test-Path $file) {
        Write-Host "✅ File exists: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ File missing: $file" -ForegroundColor Red
    }
}

Write-Host "`n🎯 GitHub CLI command testing complete!" -ForegroundColor Cyan
Write-Host "If all tests pass, the workflow should work in GitHub Actions." -ForegroundColor Yellow
