param(
  [string]$TargetSha = "",
  [string]$PreviewRoot = "D:\FlowBiz\flowbiz-client-amp-preview",
  [string]$PreviewReleaseRoot = "D:\FlowBiz\preview-releases",
  [string]$DockerExe = "C:\Program Files\Docker\Docker\resources\bin\docker.exe",
  [string]$ComposeProjectName = "flowbiz-client-amp-preview",
  [int]$PreviewApiPort = 8101,
  [int]$PreviewAdminPort = 8102
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Remove-PathIfExists([string]$PathValue) {
  if (Test-Path $PathValue) {
    Remove-Item -Recurse -Force $PathValue
  }
}

function Get-RepoRoot() {
  $root = (& git rev-parse --show-toplevel 2>&1 | Out-String).Trim()
  if ($LASTEXITCODE -ne 0 -or -not $root) {
    throw "Unable to determine repository root."
  }
  return $root
}

if (-not (Test-Path $DockerExe)) {
  throw "Docker executable not found at $DockerExe"
}

$dockerBin = Split-Path -Parent $DockerExe
if ($env:PATH -notlike "*$dockerBin*") {
  $env:PATH = "$dockerBin;$env:PATH"
}

$repoRoot = Get-RepoRoot

if (-not $TargetSha) {
  $TargetSha = (& git rev-parse HEAD 2>&1 | Out-String).Trim()
  if ($LASTEXITCODE -ne 0 -or -not $TargetSha) {
    throw "Unable to resolve target SHA."
  }
}

$shortSha = $TargetSha.Substring(0, [Math]::Min(8, $TargetSha.Length))
$releasePath = Join-Path $PreviewReleaseRoot "flowbiz-client-amp-preview-$shortSha"
$logsPath = Join-Path $PreviewRoot "ops\logs"
$postgresPath = "D:\FlowBiz\data\postgres\flowbiz-client-amp-preview"

New-Item -ItemType Directory -Force -Path $PreviewReleaseRoot | Out-Null
New-Item -ItemType Directory -Force -Path $PreviewRoot | Out-Null
New-Item -ItemType Directory -Force -Path $logsPath | Out-Null
New-Item -ItemType Directory -Force -Path $postgresPath | Out-Null

Remove-PathIfExists $releasePath

& git clone --no-checkout $repoRoot $releasePath
if ($LASTEXITCODE -ne 0) {
  throw "Unable to create preview release clone."
}

Push-Location $releasePath
try {
  & git checkout $TargetSha
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to checkout target SHA in preview release clone."
  }

  $env:PREVIEW_API_PORT = [string]$PreviewApiPort
  $env:PREVIEW_ADMIN_PORT = [string]$PreviewAdminPort
  $env:FLOWBIZ_PREVIEW_LOGS_PATH = $logsPath
  $env:FLOWBIZ_PREVIEW_POSTGRES_PATH = $postgresPath
  $env:FLOWBIZ_DEPLOY_TELEMETRY_PATH = "/app/ops/logs/deploy_telemetry.json"
  $env:LOCAL_API_ORIGIN = "http://api:8000"
  $env:LOCAL_MEDIA_ORIGIN = "http://api:8000"
  $env:NEXT_PUBLIC_SITE_URL = "http://127.0.0.1:$PreviewAdminPort"
  $env:BUILD_SHA = $shortSha
  $env:TARGET_SHA = $TargetSha

  & $DockerExe compose -p $ComposeProjectName -f docker-compose.yml -f docker-compose.preview.yml down --remove-orphans
  & $DockerExe compose -p $ComposeProjectName -f docker-compose.yml -f docker-compose.preview.yml up -d --build
  if ($LASTEXITCODE -ne 0) {
    throw "Preview compose up failed."
  }

  & $DockerExe compose -p $ComposeProjectName -f docker-compose.yml -f docker-compose.preview.yml exec -T api sh -lc "AMP_ALLOW_IMPORT=1 AMP_SKIP_PROJECT_COVER_MIRROR=1 AMP_PURGE_PREVIEW_DEMO=1 python scripts/import_seed_data.py --input data/import"
  if ($LASTEXITCODE -ne 0) {
    throw "Preview data import failed."
  }

  $smokeScript = Join-Path $releasePath "scripts\smoke_preview.ps1"
  & powershell -NoProfile -ExecutionPolicy Bypass -File $smokeScript -BaseUrl "http://127.0.0.1:$PreviewAdminPort"
  if ($LASTEXITCODE -ne 0) {
    throw "Preview smoke failed."
  }

  $generatedAt = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
  $telemetry = @{
    generated_at = $generatedAt
    deployed_at = $generatedAt
    deploy_status = "ok"
    smoke_passed = $true
    build_sha = $shortSha
    target_sha = $TargetSha
    source = "scripts/deploy_preview.ps1"
    preview = @{
      api_port = $PreviewApiPort
      admin_port = $PreviewAdminPort
      base_url = "http://127.0.0.1:$PreviewAdminPort"
    }
  } | ConvertTo-Json -Depth 5

  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText((Join-Path $logsPath "deploy_telemetry.json"), $telemetry, $utf8NoBom)
} finally {
  Pop-Location
}
