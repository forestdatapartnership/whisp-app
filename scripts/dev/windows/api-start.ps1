$ErrorActionPreference = "Stop"

. "$PSScriptRoot\common.ps1"

$RootDir = Get-DevRoot
$ApiDir = Join-Path $RootDir "api"
$ApiPort = if ($env:API_PORT) { $env:API_PORT } else { "8001" }
$RedisPort = if ($env:REDIS_PORT) { $env:REDIS_PORT } else { "6379" }

$Processes = @()

function Cleanup {
    Stop-DevProcesses -Processes $Processes
}

Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Cleanup } | Out-Null
trap { Cleanup; break }

function Get-RedisExe {
    $RedisDir = Join-Path $ApiDir ".redis"
    $RedisExe = Join-Path $RedisDir "redis-server.exe"
    if (-not (Test-Path $RedisExe)) {
        New-Item -ItemType Directory -Force -Path $RedisDir | Out-Null
        $ZipPath = Join-Path $RedisDir "redis.zip"
        Invoke-WebRequest -Uri "https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip" -OutFile $ZipPath
        Expand-Archive -Path $ZipPath -DestinationPath $RedisDir -Force
        Remove-Item $ZipPath -Force
    }
    if (-not (Test-Path $RedisExe)) {
        Write-DevFail "redis-server.exe not found in $RedisDir"
    }
    return $RedisExe
}

function Test-RedisPing {
    param([string]$Port)
    $Cli = Join-Path (Split-Path (Get-RedisExe)) "redis-cli.exe"
    if (-not (Test-Path $Cli)) { return $false }
    try {
        $result = & $Cli -p $Port ping 2>$null
        return $result -eq "PONG"
    } catch {
        return $false
    }
}

if (-not (Test-RedisPing -Port $RedisPort)) {
    $RedisExe = Get-RedisExe
    $RedisProc = Start-Process -FilePath $RedisExe -ArgumentList @(
        "--port", $RedisPort, "--save", '""', "--appendonly", "no"
    ) -PassThru -WindowStyle Hidden
    $Processes += $RedisProc

    for ($i = 0; $i -lt 40; $i++) {
        if (Test-RedisPing -Port $RedisPort) { break }
        if ($RedisProc.HasExited) { Write-DevFail "redis-server exited during startup" }
        Start-Sleep -Milliseconds 250
    }
    if (-not (Test-RedisPing -Port $RedisPort)) {
        Write-DevFail "redis-server failed to start on port $RedisPort"
    }
}

python -c "import uvicorn, celery, prometheus_fastapi_instrumentator" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-DevFail "missing API dependencies - run: scripts\dev\windows\setup.ps1"
}

$UvicornProc = Start-Process -FilePath "python" -ArgumentList @(
    "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", $ApiPort, "--reload"
) -WorkingDirectory $ApiDir -PassThru -NoNewWindow
$Processes += $UvicornProc

Wait-ForHttp -Url "http://127.0.0.1:$ApiPort/health" -MaxSeconds 120

$env:EE_HIGH_VOL = "0"
$SyncProc = Start-Process -FilePath "python" -ArgumentList @(
    "-m", "celery", "-A", "src.worker.celery_app", "worker",
    "-Q", "sync", "--concurrency=1", "--pool=threads", "--loglevel=info", "--hostname", "sync@%h"
) -WorkingDirectory $ApiDir -PassThru -NoNewWindow
$Processes += $SyncProc

$env:EE_HIGH_VOL = "1"
$AsyncProc = Start-Process -FilePath "python" -ArgumentList @(
    "-m", "celery", "-A", "src.worker.celery_app", "worker",
    "-Q", "async", "--concurrency=1", "--pool=threads", "--loglevel=info", "--hostname", "async@%h"
) -WorkingDirectory $ApiDir -PassThru -NoNewWindow
$Processes += $AsyncProc

Assert-ProcessesAlive -DelaySeconds 8 -Processes @($SyncProc, $AsyncProc)

Write-Host "API ready: http://localhost:$ApiPort"
Watch-Processes -Processes $Processes
