# Run API + React for Week 2
$root = Split-Path -Parent $PSScriptRoot
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "Starting IT Help Desk API..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\src\ITHelpDesk.API'; dotnet run"

Start-Sleep -Seconds 4

Write-Host "Starting React app..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\client\it-helpdesk-web'; if (-not (Test-Path node_modules)) { npm install }; npm run dev"

Write-Host ""
Write-Host "  API:    http://localhost:5000/swagger" -ForegroundColor Green
Write-Host "  React:  http://localhost:5173" -ForegroundColor Green
Write-Host "  Login:  admin@ithelpdesk.local / Admin@123" -ForegroundColor Yellow
