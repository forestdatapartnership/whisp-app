param(
    [Parameter(Mandatory = $true)]
    [string]$Namespace,

    [Parameter(Mandatory = $true)]
    [string]$IngressHost,

    [Parameter(Mandatory = $false)]
    [string]$SecretName = "whisp-ingress-tls",

    [Parameter(Mandatory = $false)]
    [int]$DaysValid = 3650,

    [Parameter(Mandatory = $false)]
    [switch]$Force
)

$ErrorActionPreference = "Stop"

if (-not $Force) {
    kubectl get secret $SecretName -n $Namespace 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "TLS secret $SecretName already exists in $Namespace, skipping generation"
        exit 0
    }
}

$tmpDir = New-Item -ItemType Directory -Path ([System.IO.Path]::GetTempPath() + [Guid]::NewGuid()) -Force
try {
    $keyPath = Join-Path $tmpDir "tls.key"
    $crtPath = Join-Path $tmpDir "tls.crt"

    openssl req -x509 -nodes -days $DaysValid -newkey rsa:2048 `
        -keyout $keyPath -out $crtPath `
        -subj "/CN=$IngressHost" `
        -addext "subjectAltName=DNS:$IngressHost"

    kubectl create secret tls $SecretName `
        --cert=$crtPath `
        --key=$keyPath `
        -n $Namespace `
        --dry-run=client -o yaml | kubectl apply -f -

    kubectl delete managedcertificate whisp-managed-cert -n $Namespace --ignore-not-found
}
finally {
    Remove-Item -Recurse -Force $tmpDir
}
