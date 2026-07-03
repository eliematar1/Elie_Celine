# Start IT Help Desk — API + React
$root = Split-Path -Parent $PSScriptRoot
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$hasSdk = (dotnet --list-sdks 2>$null) -match "8\."

if ($hasSdk) {
  Write-Host "Starting ASP.NET Core API..." -ForegroundColor Cyan
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\src\ITHelpDesk.API'; dotnet run"
} else {
  Write-Host "Starting Node dev API (.NET SDK not found)..." -ForegroundColor Yellow
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\api-dev-server'; if (-not (Test-Path node_modules)) { npm install }; node server.js"
}

Start-Sleep -Seconds 3

Write-Host "Starting React (Vite)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\client\it-helpdesk-web'; if (-not (Test-Path node_modules)) { npm install }; npm run dev"

Write-Host ""
Write-Host "  React:  http://localhost:5173" -ForegroundColor Green
Write-Host "  API:    http://localhost:5000/api/health" -ForegroundColor Green
Write-Host "  Login:  admin@ithelpdesk.local / Admin@123" -ForegroundColor Yellow
