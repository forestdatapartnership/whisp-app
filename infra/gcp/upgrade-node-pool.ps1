param(
    [Parameter(Mandatory)] [string] $Project,
    [Parameter(Mandatory)] [string] $Location,
    [Parameter(Mandatory)] [string] $Cluster,
    [Parameter(Mandatory)] [string] $NodePool
)

function Update-NodePool([string[]] $Change) {
    gcloud container node-pools update $NodePool "--project=$Project" "--location=$Location" "--cluster=$Cluster" @Change
    if ($LASTEXITCODE -ne 0) { throw "gcloud exited with code $LASTEXITCODE" }
}

# gcloud takes one kind of change per update, and the last two each recreate the node: surge brings the new
# node up before the old one is removed
Update-NodePool "--max-surge-upgrade=1", "--max-unavailable-upgrade=0"
Update-NodePool "--machine-type=e2-standard-8"
Update-NodePool "--system-config-from-file=$PSScriptRoot\node-system-config.yaml"
