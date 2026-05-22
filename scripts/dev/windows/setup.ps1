$ErrorActionPreference = "Stop"

. "$PSScriptRoot\common.ps1"

$RootDir = Get-DevRoot
$ApiDir = Join-Path $RootDir "api"
$AppDir = Join-Path $RootDir "app"

Write-Host ""
Write-Host "=== Installing dev dependencies ==="

Write-Host "App (npm)..."
Push-Location $AppDir
try {
    npm install
} finally {
    Pop-Location
}

Write-Host "API (pip editable)..."
Push-Location $ApiDir
try {
    python -m pip install -e .
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Done. Run scripts\dev\windows\start.ps1 to start the dev stack."
