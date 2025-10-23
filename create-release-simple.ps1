# Simple GitHub release creation
$repo = "EnormousHammer/glchemdraw-app"
$tag = "v0.1.1"
$title = "React Hooks Fix and Ketcher Loading Improvements"
$body = "Fixed React hooks errors and Ketcher infinite loading. Added Windows installers."

Write-Host "Creating GitHub release..." -ForegroundColor Green

if ($env:GH_TOKEN) {
    Write-Host "Token found! Creating release..." -ForegroundColor Green
    
    $releaseData = @{
        tag_name = $tag
        name = $title
        body = $body
        draft = $false
        prerelease = $false
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases" -Method POST -Headers @{
            "Authorization" = "token $env:GH_TOKEN"
            "Accept" = "application/vnd.github.v3+json"
            "Content-Type" = "application/json"
        } -Body $releaseData
        
        Write-Host "Release created! URL: $($response.html_url)" -ForegroundColor Green
        Write-Host "Now upload the files manually at the URL above" -ForegroundColor Yellow
        
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "No token found. Please:" -ForegroundColor Red
    Write-Host "1. Go to: https://github.com/settings/tokens" -ForegroundColor Cyan
    Write-Host "2. Generate new token with 'repo' scope" -ForegroundColor Cyan
    Write-Host "3. Run: `$env:GH_TOKEN='your_token_here'" -ForegroundColor Cyan
    Write-Host "4. Run this script again" -ForegroundColor Cyan
}
