# Syahmi Projects Bosan2 - Auto Sync to GitHub PowerShell Script
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Syahmi Projects Bosan2 - Auto Sync to GitHub" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

Write-Host "`n[1/3] Staging project changes..." -ForegroundColor Yellow
git add .

Write-Host "[2/3] Creating commit..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Auto-update: sync projects to GitHub [$timestamp]"

Write-Host "[3/3] Pushing to https://github.com/Mie02/Syahmi-Projects-Bosan2..." -ForegroundColor Yellow
git push origin main

Write-Host "`n===================================================" -ForegroundColor Cyan
Write-Host "  Synchronization complete!" -ForegroundColor Green
Write-Host "  Live site: https://mie02.github.io/Syahmi-Projects-Bosan2/" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
