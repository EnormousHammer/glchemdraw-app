# Create GitHub release using API directly
$repo = "EnormousHammer/glchemdraw-app"
$tag = "v0.1.1"
$title = "🔧 React Hooks Fix & Ketcher Loading Improvements"
$body = "Fixed React hooks errors and Ketcher infinite loading. Added Windows installers."

Write-Host "Creating GitHub release for $repo..." -ForegroundColor Green

# Create the release
$releaseData = @{
    tag_name = $tag
    name = $title
    body = $body
    draft = $false
    prerelease = $false
} | ConvertTo-Json

Write-Host "Release data prepared. You need to:" -ForegroundColor Yellow
Write-Host "1. Go to: https://github.com/settings/tokens" -ForegroundColor Cyan
Write-Host "2. Generate a new token with 'repo' scope" -ForegroundColor Cyan
Write-Host "3. Copy the token and run: `$env:GH_TOKEN='your_token_here'" -ForegroundColor Cyan
Write-Host "4. Then run this script again" -ForegroundColor Cyan

if ($env:GH_TOKEN) {
    Write-Host "Token found! Creating release..." -ForegroundColor Green
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases" `
            -Method POST `
            -Headers @{
                "Authorization" = "token $env:GH_TOKEN"
                "Accept" = "application/vnd.github.v3+json"
                "Content-Type" = "application/json"
            } `
            -Body $releaseData
        
        Write-Host "✅ Release created successfully!" -ForegroundColor Green
        Write-Host "🔗 URL: $($response.html_url)" -ForegroundColor Cyan
        
        # Upload files
        $msiFile = "release/GlChemDraw_0.1.0_x64_en-US.msi"
        $exeFile = "release/GlChemDraw_0.1.0_x64-setup.exe"
        
        if (Test-Path $msiFile) {
            Write-Host "Uploading MSI file..." -ForegroundColor Blue
            # Upload MSI
            $uploadUrl = $response.upload_url -replace '\{.*\}', "?name=GlChemDraw_0.1.0_x64_en-US.msi"
            $msiContent = [System.IO.File]::ReadAllBytes($msiFile)
            Invoke-RestMethod -Uri $uploadUrl -Method POST -Headers @{
                "Authorization" = "token $env:GH_TOKEN"
                "Content-Type" = "application/octet-stream"
            } -Body $msiContent
            Write-Host "✅ MSI uploaded!" -ForegroundColor Green
        }
        
        if (Test-Path $exeFile) {
            Write-Host "Uploading EXE file..." -ForegroundColor Blue
            # Upload EXE
            $uploadUrl = $response.upload_url -replace '\{.*\}', "?name=GlChemDraw_0.1.0_x64-setup.exe"
            $exeContent = [System.IO.File]::ReadAllBytes($exeFile)
            Invoke-RestMethod -Uri $uploadUrl -Method POST -Headers @{
                "Authorization" = "token $env:GH_TOKEN"
                "Content-Type" = "application/octet-stream"
            } -Body $exeContent
            Write-Host "✅ EXE uploaded!" -ForegroundColor Green
        }
        
        Write-Host "🎉 Release complete! View at: $($response.html_url)" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "No token found. Please set GH_TOKEN environment variable." -ForegroundColor Red
}
