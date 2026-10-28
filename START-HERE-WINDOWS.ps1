$ErrorActionPreference = 'Stop'
Write-Host 'SignalRoot quick start' -ForegroundColor Cyan
Write-Host 'This script opens separate terminal windows for the API, SignalRoot frontend, and ShopSphere demo.'
Write-Host 'If ShopSphere port 5174 is busy, Vite automatically selects the next available port; use the URL printed in its terminal.'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'
$shopsphere = Join-Path $root 'shopsphere'
if (-not (Get-Command py -ErrorAction SilentlyContinue)) { throw 'Python launcher (py) was not found. Install Python 3.11+ first.' }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'npm was not found. Install Node.js 20+ first.' }
if (-not (Test-Path (Join-Path $backend '.venv'))) { py -m venv (Join-Path $backend '.venv') }
Start-Process powershell -ArgumentList @('-NoExit','-Command', "Set-Location '$backend'; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt; uvicorn app.main:app --reload --port 8000")
Start-Process powershell -ArgumentList @('-NoExit','-Command', "Set-Location '$frontend'; npm install; npm run dev")
Start-Process powershell -ArgumentList @('-NoExit','-Command', "Set-Location '$shopsphere'; npm install; npm run dev")
Write-Host 'Terminals launched. Wait for all three to finish starting.' -ForegroundColor Green
Write-Host 'SignalRoot: http://127.0.0.1:5173'
Write-Host 'ShopSphere: normally http://127.0.0.1:5174 (check the ShopSphere terminal if the port is busy)' 
Write-Host 'API docs: http://127.0.0.1:8000/docs'
