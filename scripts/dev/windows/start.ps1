param(
    [switch]$Install
)

$ErrorActionPreference = "Stop"

. "$PSScriptRoot\common.ps1"

$RootDir = Get-DevRoot
$ApiDir = Join-Path $RootDir "api"
$AppDir = Join-Path $RootDir "app"
$ApiPort = if ($env:API_PORT) { $env:API_PORT } else { "8001" }
$AppPort = if ($env:APP_PORT) { $env:APP_PORT } else { "3001" }
$ApiUrl = "http://localhost:$ApiPort"

$Processes = @()

function Cleanup {
    Stop-DevProcesses -Processes $Processes
}

Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Cleanup } | Out-Null
trap { Cleanup; break }

function Test-ApiDeps {
    python -c "import uvicorn, celery, prometheus_fastapi_instrumentator" 2>$null | Out-Null
    return ($LASTEXITCODE -eq 0)
}

if ($Install) {
    & "$PSScriptRoot\setup.ps1"
} elseif (-not (Test-Path (Join-Path $AppDir "node_modules")) -or -not (Test-ApiDeps)) {
    Write-DevFail "missing dependencies - run: scripts\dev\windows\setup.ps1"
}

$EnvLocal = Join-Path $AppDir ".env.local"
$ApiUrlLine = "API_URL=$ApiUrl"
if (Test-Path $EnvLocal) {
    $content = Get-Content $EnvLocal -Raw
    if ($content -match "(?m)^API_URL=") {
        ($content -replace "(?m)^API_URL=.*", $ApiUrlLine) | Set-Content $EnvLocal -NoNewline
    } else {
        Add-Content $EnvLocal $ApiUrlLine
    }
} else {
    Set-Content $EnvLocal $ApiUrlLine
}

$ApiStartScript = Join-Path $PSScriptRoot "api-start.ps1"
$ApiProc = Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $ApiStartScript
) -PassThru -WindowStyle Normal
$Processes += $ApiProc

Wait-ForHttpWhileAlive -Url "$ApiUrl/health" -Supervisor $ApiProc -MaxSeconds 180

$AppProc = Start-Process -FilePath "cmd.exe" -ArgumentList @(
    "/c", "npm", "run", "dev", "--", "--port", $AppPort
) -WorkingDirectory $AppDir -PassThru -NoNewWindow
$Processes += $AppProc

Wait-ForHttp -Url "http://127.0.0.1:$AppPort" -MaxSeconds 120

Write-Host "API: $ApiUrl  App: http://localhost:$AppPort"
Watch-Processes -Processes $Processes
