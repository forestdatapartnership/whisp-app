$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Get-DevRoot {
    $ScriptDir = Split-Path -Parent $MyInvocation.PSCommandPath
    return (Resolve-Path (Join-Path $ScriptDir "..\..\..")).Path
}

function Write-DevFail {
    param([string]$Message)
    Write-Error $Message
    exit 1
}

function Resolve-DevHttpUrl {
    param([string]$Url)
    return $Url -replace '://localhost(?=[:/])', '://127.0.0.1'
}

function Test-DevHttp {
    param([string]$Url)
    $Url = Resolve-DevHttpUrl $Url
    if (Get-Command curl.exe -ErrorAction SilentlyContinue) {
        & curl.exe -sf --connect-timeout 2 --max-time 2 $Url 2>$null | Out-Null
        return ($LASTEXITCODE -eq 0)
    }
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
        return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400)
    } catch {
        return $false
    }
}

function Wait-ForHttp {
    param(
        [string]$Url,
        [int]$MaxSeconds = 60
    )
    for ($i = 0; $i -lt $MaxSeconds; $i++) {
        if (Test-DevHttp $Url) { return }
        Start-Sleep -Seconds 1
    }
    Write-DevFail "timed out waiting for $Url"
}

function Wait-ForHttpWhileAlive {
    param(
        [string]$Url,
        [System.Diagnostics.Process]$Supervisor,
        [int]$MaxSeconds = 90
    )
    for ($i = 0; $i -lt $MaxSeconds; $i++) {
        if ($Supervisor.HasExited) {
            Write-DevFail "API stack exited during startup"
        }
        if (Test-DevHttp $Url) { return }
        Start-Sleep -Seconds 1
    }
    Write-DevFail "timed out waiting for $Url"
}

function Assert-ProcessesAlive {
    param(
        [int]$DelaySeconds = 5,
        [System.Diagnostics.Process[]]$Processes
    )
    Start-Sleep -Seconds $DelaySeconds
    foreach ($proc in $Processes) {
        if ($proc.HasExited) {
            Write-DevFail "process exited during startup (pid $($proc.Id))"
        }
    }
}

function Watch-Processes {
    param([System.Diagnostics.Process[]]$Processes)
    while ($true) {
        Start-Sleep -Seconds 1
        foreach ($proc in $Processes) {
            if ($proc.HasExited) {
                Write-DevFail "process exited (pid $($proc.Id))"
            }
        }
    }
}

function Stop-DevProcesses {
    param([System.Diagnostics.Process[]]$Processes)
    foreach ($proc in $Processes) {
        if ($proc -and -not $proc.HasExited) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
}
