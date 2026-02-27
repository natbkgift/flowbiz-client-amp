param(
  [string]$VpsHost = "flowbiz-vps",
  [string]$VpsPath = "/opt/flowbiz/clients/flowbiz-client-amp",
  [string]$PublicBase = "https://www.amppattaya.com",
  [int]$VpsApiPort = 8001,
  [switch]$AllowDirty
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if ($AllowDirty) {
  Write-Warning "AllowDirty is ignored by this guard. A clean working directory is always enforced to prevent accidental deployments of uncommitted changes."
}

function Invoke-Cmd {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [switch]$NoThrow
  )

  $out = & pwsh -NoProfile -Command $Command 2>&1
  $code = $LASTEXITCODE
  if (-not $NoThrow -and $code -ne 0) {
    throw "Command failed ($code): $Command`n$out"
  }

  return [pscustomobject]@{
    ExitCode = $code
    Output   = ($out | Out-String).TrimEnd()
  }
}

function Invoke-SshBash {
  param(
    [Parameter(Mandatory = $true)][string]$BashScript,
    [switch]$NoThrow
  )

  $ssh = "ssh -o BatchMode=yes $VpsHost bash -s"
  $res = $null
  $tmp = New-TemporaryFile
  try {
    $normalized = $BashScript.Replace("`r`n", "`n").Replace("`r", "")
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($tmp.FullName, $normalized, $utf8NoBom)
    $cmd = "cmd /c type `"$($tmp.FullName)`" | $ssh"
    $res = Invoke-Cmd -Command $cmd -NoThrow:$NoThrow
  } finally {
    Remove-Item -Force -ErrorAction SilentlyContinue $tmp.FullName
  }

  return $res
}

function New-GuardReport {
  return [ordered]@{
    Source = [ordered]@{
      SourceSha       = $null
      CommitTimestamp = $null
      Dirty           = $false
      DirtyDetail     = $null
    }
    VpsBefore = [ordered]@{
      DeployedSha      = $null
      ImageTag         = $null
      ImageId          = $null
      ImageDigest      = $null
      ContainerStatus  = $null
      ContainerRunning = $null
      RestartCount     = $null
      AlembicCurrent   = $null
      AlembicHeads     = $null
      ApiMetaBuildSha  = $null
      ApiHealthzCode   = $null
      PublicHealthCode = $null
    }
    Drift = [ordered]@{
      Detected = $null
      Type = $null
      Details = @()
    }
    Actions = [ordered]@{
      GitReset          = "NO"
      ImageRebuild      = "NO"
      ContainerRestart  = "NO"
      MigrationApplied  = "NO"
      Aborted           = $false
      AbortReason       = $null
    }
    Validation = [ordered]@{
      Health = $null
      Api    = $null
      Auth   = $null
      Assets = $null
      ErrorsFound = @()
    }
    Final = [ordered]@{
      DeployedSha     = $null
      ImageTag        = $null
      AlembicHead     = $null
      ContainerStable = $null
    }
    Verdict = [ordered]@{
      ProductionHealthy = $null
    }
  }
}

function Write-GuardReportText {
  param(
    [Parameter(Mandatory = $true)]$Report
  )

  $driftYesNo = if ($Report.Drift.Detected) { 'YES' } else { 'NO' }
  $healthyYesNo = if ($Report.Verdict.ProductionHealthy) { 'YES' } else { 'NO' }

  "# CONTINUOUS PRODUCTION GUARD REPORT"; ""

  "## Source State";
  "- SOURCE_SHA: $($Report.Source.SourceSha)";
  "- Commit timestamp: $($Report.Source.CommitTimestamp)";

  ""; "## VPS State Before";
  "- DEPLOYED_SHA: $($Report.VpsBefore.DeployedSha)";
  "- Image tag: $($Report.VpsBefore.ImageTag)";
  "- Container status: $($Report.VpsBefore.ContainerStatus) running=$($Report.VpsBefore.ContainerRunning) restarts=$($Report.VpsBefore.RestartCount)";
  "- Alembic version: current=$($Report.VpsBefore.AlembicCurrent) heads=$($Report.VpsBefore.AlembicHeads)";

  ""; "## Drift Detected";
  "- $driftYesNo";
  "- Type: $($Report.Drift.Type)";

  ""; "## Actions Executed";
  "- Git reset: $($Report.Actions.GitReset)";
  "- Image rebuild: $($Report.Actions.ImageRebuild)";
  "- Container restart: $($Report.Actions.ContainerRestart)";
  "- Migration applied: $($Report.Actions.MigrationApplied)";

  ""; "## Runtime Validation";
  "- Health: $($Report.Validation.Health)";
  "- API: $($Report.Validation.Api)";
  "- Auth: $($Report.Validation.Auth)";
  "- Assets: $($Report.Validation.Assets)";
  "- Errors found: $([string]::Join('; ', @($Report.Validation.ErrorsFound)))";

  ""; "## Final State";
  "- DEPLOYED_SHA: $($Report.Final.DeployedSha)";
  "- Image tag: $($Report.Final.ImageTag)";
  "- Alembic head: $($Report.Final.AlembicHead)";
  "- Container stable: $($Report.Final.ContainerStable)";

  ""; "## FINAL VERDICT";
  "PRODUCTION HEALTHY: $healthyYesNo";
}

$report = New-GuardReport

try {
  # --- PHASE 1: SOURCE TRUTH DETECTION (ON VPS) ---
  $sourceDetect = @'
set -eu
VPS_PATH="__VPS_PATH__"
cd "$VPS_PATH"

set -o pipefail

python3 - <<'PY'
import json, subprocess

def run(cmd: str) -> tuple[int, str]:
    p = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    return p.returncode, p.stdout.strip()

out = {
  "branch": None,
  "dirty": None,
  "source_sha": None,
  "commit_timestamp": None,
}

rc, branch = run("git rev-parse --abbrev-ref HEAD")
out["branch"] = branch if rc == 0 else None

rc, dirty = run("git status --porcelain=v1")
out["dirty"] = dirty if rc == 0 else None

# Always refresh remote tracking for accurate SOURCE_SHA
run("git fetch origin --prune")
rc, sha = run("git rev-parse origin/main")
out["source_sha"] = sha if rc == 0 else None

if out["source_sha"]:
  rc, ts = run(f"git show -s --format=%cI {out['source_sha']}")
  out["commit_timestamp"] = ts if rc == 0 else None

print(json.dumps(out))
PY
'@

  $sourceDetect = $sourceDetect.Replace('__VPS_PATH__', $VpsPath)

  $srcRes = Invoke-SshBash -BashScript $sourceDetect -NoThrow
  if ($srcRes.ExitCode -ne 0) {
    throw "SOURCE detection failed on VPS: $($srcRes.Output)"
  }
  $src = $srcRes.Output | ConvertFrom-Json

  if (-not $src.source_sha) {
    throw 'VPS source SHA not available (repo inaccessible?)'
  }
  if ($src.branch -eq 'HEAD') {
    throw 'Detached HEAD detected on VPS source repo. Aborting.'
  }
  if (-not [string]::IsNullOrWhiteSpace($src.dirty)) {
    $report.Source.Dirty = $true
    $report.Source.DirtyDetail = $src.dirty
    $report.Actions.Aborted = $true
    $report.Actions.AbortReason = 'Uncommitted changes present on VPS source repo (guard stop condition).'
    $report.Validation.ErrorsFound += "ABORT: $($report.Actions.AbortReason)"
    $report.Validation.ErrorsFound += "VPS git status: $($report.Source.DirtyDetail)"

    $report.Source.SourceSha = [string]$src.source_sha
    if ($src.commit_timestamp -is [datetime]) {
      $report.Source.CommitTimestamp = $src.commit_timestamp.ToString('o')
    } else {
      $report.Source.CommitTimestamp = [string]$src.commit_timestamp
    }

    # Best-effort: gather read-only VPS runtime evidence for the report.
    $discoverAbort = @'
set -eu
cd "__VPS_PATH__"
set -o pipefail

compose="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
cid=$(${compose} ps -q api || true)

echo "DEPLOYED_SHA=$(git rev-parse HEAD || true)"
echo "API_CONTAINER_ID=$cid"

if [ -n "$cid" ]; then
  echo "API_IMAGE_TAG=$(docker inspect -f '{{.Config.Image}}' $cid || true)"
  echo "API_IMAGE_ID=$(docker inspect -f '{{.Image}}' $cid || true)"
  echo "API_STATUS=$(docker inspect -f '{{.State.Status}}' $cid || true)"
  echo "API_RUNNING=$(docker inspect -f '{{.State.Running}}' $cid || true)"
  echo "API_RESTARTS=$(docker inspect -f '{{.RestartCount}}' $cid || true)"

  cur=$(${compose} exec -T api alembic current 2>/dev/null || true)
  heads=$(${compose} exec -T api alembic heads 2>/dev/null || true)
  echo "ALEMBIC_CURRENT=$cur"
  echo "ALEMBIC_HEADS=$heads"

  base="http://127.0.0.1:__VPS_API_PORT__"
  echo "API_HEALTHZ_CODE=$(curl -sS -o /dev/null -w '%{http_code}' $base/healthz || true)"
  meta=$(curl -sS $base/v1/meta 2>/dev/null || true)
  build=$(printf '%s' "$meta" | grep -oE '"build_sha"\s*:\s*"[^"]+"' | head -n 1 | cut -d'"' -f4 || true)
  echo "API_META_BUILD_SHA=$build"
fi

pub="__PUBLIC_BASE__"
echo "PUBLIC_HEALTH_CODE=$(curl -sS -o /dev/null -w '%{http_code}' $pub/health || true)"
'@

    $discoverAbort = $discoverAbort.Replace('__VPS_PATH__', $VpsPath)
    $discoverAbort = $discoverAbort.Replace('__VPS_API_PORT__', "$VpsApiPort")
    $discoverAbort = $discoverAbort.Replace('__PUBLIC_BASE__', $PublicBase.TrimEnd('/'))

    $discAbortRes = Invoke-SshBash -BashScript $discoverAbort -NoThrow
    if ($discAbortRes.ExitCode -eq 0) {
      $kvAbort = @{}
      foreach ($line in ($discAbortRes.Output -split "`n")) {
        if ($line -match '^(?<k>[A-Z0-9_]+)=(?<v>.*)$') {
          $kvAbort[$Matches.k] = $Matches.v
        }
      }

      $report.VpsBefore.DeployedSha = $kvAbort['DEPLOYED_SHA']
      $report.VpsBefore.ImageTag = $kvAbort['API_IMAGE_TAG']
      $report.VpsBefore.ImageId = $kvAbort['API_IMAGE_ID']
      $report.VpsBefore.ContainerStatus = $kvAbort['API_STATUS']
      $report.VpsBefore.ContainerRunning = $kvAbort['API_RUNNING']
      $report.VpsBefore.RestartCount = $kvAbort['API_RESTARTS']
      $report.VpsBefore.ApiMetaBuildSha = $kvAbort['API_META_BUILD_SHA']
      $report.VpsBefore.ApiHealthzCode = $kvAbort['API_HEALTHZ_CODE']
      $report.VpsBefore.PublicHealthCode = $kvAbort['PUBLIC_HEALTH_CODE']

      if ($kvAbort.ContainsKey('ALEMBIC_CURRENT')) {
        $report.VpsBefore.AlembicCurrent = $kvAbort['ALEMBIC_CURRENT']
      }
      if ($kvAbort.ContainsKey('ALEMBIC_HEADS')) {
        $report.VpsBefore.AlembicHeads = $kvAbort['ALEMBIC_HEADS']
      }
    }

    $report.Verdict.ProductionHealthy = $false
    Write-GuardReportText -Report $report
    exit 2
  }

  $report.Source.SourceSha = [string]$src.source_sha
  if ($src.commit_timestamp -is [datetime]) {
    $report.Source.CommitTimestamp = $src.commit_timestamp.ToString('o')
  } else {
    $report.Source.CommitTimestamp = [string]$src.commit_timestamp
  }

  # --- PHASE 2: VPS STATE DISCOVERY ---
  $discover = @'
set -eu
VPS_PATH="__VPS_PATH__"
export VPS_API_PORT="__VPS_API_PORT__"
export PUBLIC_BASE="__PUBLIC_BASE__"
cd "$VPS_PATH"

set -o pipefail

python3 - <<'PY'
import json, os, subprocess

def run(cmd: str) -> str:
    p = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    return p.stdout.strip()

def run_ok(cmd: str) -> tuple[int, str]:
    p = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    return p.returncode, p.stdout.strip()

compose = "docker compose -f docker-compose.yml -f docker-compose.prod.yml"

out = {
    "deployed_sha": run("git rev-parse HEAD"),
    "api_container_id": None,
    "api_image_tag": None,
    "api_image_id": None,
    "api_image_digest": None,
    "api_status": None,
    "api_running": None,
    "api_restart_count": None,
    "api_env_build_sha": None,
    "api_env_otel_enabled": None,
    "alembic_current": None,
    "alembic_heads": None,
    "api_healthz_code": None,
    "api_meta_build_sha": None,
    "public_health_code": None,
}

cid = run(f"{compose} ps -q api || true")
out["api_container_id"] = cid or None

if cid:
    out["api_image_tag"] = run(f"docker inspect -f '{{{{.Config.Image}}}}' {cid} || true") or None
    out["api_image_id"] = run(f"docker inspect -f '{{{{.Image}}}}' {cid} || true") or None
    out["api_status"] = run(f"docker inspect -f '{{{{.State.Status}}}}' {cid} || true") or None
    out["api_running"] = run(f"docker inspect -f '{{{{.State.Running}}}}' {cid} || true") or None
    out["api_restart_count"] = run(f"docker inspect -f '{{{{.RestartCount}}}}' {cid} || true") or None

    env_lines = run(f"docker inspect -f '{{{{range .Config.Env}}}}{{{{println .}}}}{{{{end}}}}' {cid} || true").splitlines()
    for line in env_lines:
        if line.startswith('FLOWBIZ_BUILD_SHA='):
            out["api_env_build_sha"] = line.split('=', 1)[1]
        if line.startswith('OTEL_ENABLED='):
            out["api_env_otel_enabled"] = line.split('=', 1)[1]

    if out.get("api_image_tag"):
        code, digest_out = run_ok(f"docker image inspect --format '{{{{index .RepoDigests 0}}}}' {out['api_image_tag']} 2>/dev/null")
        if code == 0 and digest_out:
            out["api_image_digest"] = digest_out

    # Alembic info (best-effort)
    code, cur = run_ok(f"{compose} exec -T api alembic current")
    out["alembic_current"] = cur if code == 0 else None
    code, heads = run_ok(f"{compose} exec -T api alembic heads")
    out["alembic_heads"] = heads if code == 0 else None

# Runtime endpoints (best-effort)
base = f"http://127.0.0.1:{os.environ.get('VPS_API_PORT', '8001')}"
rc, code = run_ok(f"curl -sS -o /dev/null -w '%{{http_code}}' {base}/healthz")
out["api_healthz_code"] = code if rc == 0 else None

code, meta = run_ok(f"curl -sS {base}/v1/meta")
if code == 0 and meta:
    # meta is JSON; extract build_sha without jq
    import re
    m = re.search(r'"build_sha"\s*:\s*"([^"]+)"', meta)
    if m:
        out["api_meta_build_sha"] = m.group(1)

pub = os.environ.get('PUBLIC_BASE', 'https://www.amppattaya.com').rstrip('/')
rc, code = run_ok(f"curl -sS -o /dev/null -w '%{{http_code}}' {pub}/health")
out["public_health_code"] = code if rc == 0 else None

print(json.dumps(out))
PY
'@

  $discover = $discover.Replace('__VPS_PATH__', $VpsPath)
  $discover = $discover.Replace('__VPS_API_PORT__', "$VpsApiPort")
  $discover = $discover.Replace('__PUBLIC_BASE__', $PublicBase)

  $discRes = Invoke-SshBash -BashScript $discover
  if ($discRes.ExitCode -ne 0) {
    throw "VPS discovery failed: $($discRes.Output)"
  }

  $vps = $discRes.Output | ConvertFrom-Json

  $report.VpsBefore.DeployedSha = $vps.deployed_sha
  $report.VpsBefore.ImageTag = $vps.api_image_tag
  $report.VpsBefore.ImageId = $vps.api_image_id
  $report.VpsBefore.ImageDigest = $vps.api_image_digest
  $report.VpsBefore.ContainerStatus = $vps.api_status
  $report.VpsBefore.ContainerRunning = $vps.api_running
  $report.VpsBefore.RestartCount = $vps.api_restart_count
  $report.VpsBefore.AlembicCurrent = $vps.alembic_current
  $report.VpsBefore.AlembicHeads = $vps.alembic_heads
  $report.VpsBefore.ApiMetaBuildSha = $vps.api_meta_build_sha
  $report.VpsBefore.ApiHealthzCode = $vps.api_healthz_code
  $report.VpsBefore.PublicHealthCode = $vps.public_health_code

  # --- PHASE 3: DRIFT DETECTION ---
  $driftDetails = @()

  $sourceShort = $null
  if ($report.Source.SourceSha -and $report.Source.SourceSha.Length -ge 8) {
    $sourceShort = $report.Source.SourceSha.Substring(0, 8)
  }

  $codeDrift = ($report.Source.SourceSha -ne $report.VpsBefore.DeployedSha)
  if ($codeDrift) {
    $driftDetails += "SOURCE_SHA != DEPLOYED_SHA"
  }

  $buildDrift = $false
  if ($sourceShort) {
    if ($report.VpsBefore.ApiMetaBuildSha -and ($report.VpsBefore.ApiMetaBuildSha -ne $sourceShort)) {
      $buildDrift = $true
      $driftDetails += "API build_sha ($($report.VpsBefore.ApiMetaBuildSha)) != source_short ($sourceShort)"
    } elseif ($report.VpsBefore.ImageTag -and ($report.VpsBefore.ImageTag -notmatch ":$([regex]::Escape($sourceShort))$")) {
      $buildDrift = $true
      $driftDetails += "API image tag ($($report.VpsBefore.ImageTag)) does not match source_short ($sourceShort)"
    }
  }

  $containerBad = ($report.VpsBefore.ContainerRunning -ne 'true')
  if ($containerBad) {
    $driftDetails += "api container not running"
  }

  $migrationDrift = $false
  if ($report.VpsBefore.AlembicCurrent -and $report.VpsBefore.AlembicHeads) {
    # Simple drift heuristic: current output must contain one of the heads revisions
    $heads = ($report.VpsBefore.AlembicHeads -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    $migrationDrift = -not ($heads | Where-Object { $report.VpsBefore.AlembicCurrent -match [regex]::Escape($_.Split(' ')[0]) })
    if ($migrationDrift) {
      $driftDetails += "alembic current not at head"
    }
  }

  $driftDetected = ($codeDrift -or $buildDrift -or $containerBad -or $migrationDrift)
  $report.Drift.Detected = $driftDetected
  $report.Drift.Details = $driftDetails

  if (-not $driftDetected) {
    $report.Drift.Type = 'None'
  } else {
    $types = @()
    if ($codeDrift) { $types += 'Code' }
    if ($buildDrift) { $types += 'Container' }
    if ($migrationDrift) { $types += 'Migration' }
    if ($containerBad) { $types += 'Container' }
    $report.Drift.Type = ($types -join ' / ')
  }

  # --- AUTO-DEPLOY (MINIMAL BLAST RADIUS) ---
  if ($driftDetected) {
    $otelEnabled = $vps.api_env_otel_enabled
    if ([string]::IsNullOrWhiteSpace($otelEnabled)) {
      $otelEnabled = 'false'
    }

    $deploy = @'
  set -eu
  VPS_PATH="__VPS_PATH__"
  cd "$VPS_PATH"

  set -o pipefail

echo "--- safe git update"
git fetch origin --prune
git checkout main
git checkout -- runtime/system_state.json 2>/dev/null || true
git reset --hard origin/main

BUILD_SHA=$(git rev-parse --short HEAD)
export BUILD_SHA
export VPS_API_PORT="__VPS_API_PORT__"
export OTEL_ENABLED="__OTEL_ENABLED__"

compose="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

echo "--- deterministic build BUILD_SHA=$BUILD_SHA"
${compose} build --build-arg GIT_SHA=$BUILD_SHA api admin-app

echo "--- controlled restart (services only)"
${compose} up -d --force-recreate --remove-orphans api admin-app

# Database migration guard

echo "--- alembic upgrade"
${compose} exec -T api alembic upgrade head

echo "--- alembic current"
${compose} exec -T api alembic current

echo "--- alembic heads"
${compose} exec -T api alembic heads
'@

  $deploy = $deploy.Replace('__VPS_PATH__', $VpsPath)
  $deploy = $deploy.Replace('__VPS_API_PORT__', "$VpsApiPort")
  $deploy = $deploy.Replace('__OTEL_ENABLED__', $otelEnabled)

    $deployRes = Invoke-SshBash -BashScript $deploy -NoThrow
    if ($deployRes.ExitCode -ne 0) {
      $report.Actions.Aborted = $true
      $report.Actions.AbortReason = "Deploy failed on VPS"
      $report.Validation.ErrorsFound += "DEPLOY_FAILED: $($deployRes.Output)"
      throw "Deploy failed: $($deployRes.Output)"
    }

    $report.Actions.GitReset = 'YES'
    $report.Actions.ImageRebuild = 'YES'
    $report.Actions.ContainerRestart = 'YES'
    $report.Actions.MigrationApplied = 'YES'

    # Re-discover after deploy for final state
    $discRes2 = Invoke-SshBash -BashScript $discover
    if ($discRes2.ExitCode -ne 0) {
      throw "VPS rediscovery failed: $($discRes2.Output)"
    }
    $vps2 = $discRes2.Output | ConvertFrom-Json

    $report.Final.DeployedSha = $vps2.deployed_sha
    $report.Final.ImageTag = $vps2.api_image_tag
    $report.Final.AlembicHead = $vps2.alembic_heads
    $report.Final.ContainerStable = ($vps2.api_running -eq 'true')
  } else {
    $report.Final.DeployedSha = $report.VpsBefore.DeployedSha
    $report.Final.ImageTag = $report.VpsBefore.ImageTag
    $report.Final.AlembicHead = $report.VpsBefore.AlembicHeads
    $report.Final.ContainerStable = ($report.VpsBefore.ContainerRunning -eq 'true')
  }

  # --- POST-DEPLOY RUNTIME VALIDATION ---
  $validate = @'
set -eu
cd "__VPS_PATH__"
BASE="http://127.0.0.1:__VPS_API_PORT__"

set -o pipefail

echo "HEALTHZ_CODE=$(curl -sS -o /dev/null -w '%{http_code}' $BASE/healthz || true)"
echo "META_CODE=$(curl -sS -o /dev/null -w '%{http_code}' $BASE/v1/meta || true)"

# Auth smoke: expect 401 when missing token
code=$(curl -sS -o /dev/null -w '%{http_code}' $BASE/auth/me || true)
echo "AUTH_ME_CODE=$code"

# Auth smoke: invalid login should 401 (non-mutating)
code=$(curl -sS -o /dev/null -w '%{http_code}' -H 'Content-Type: application/json' -d '{"email":"invalid@example.com","password":"invalid"}' $BASE/v1/auth/login || true)
echo "AUTH_LOGIN_INVALID_CODE=$code"

# Core endpoints (GET-only)
echo "PROPERTIES_CODE=$(curl -sS -o /dev/null -w '%{http_code}' $BASE/v1/properties?limit=1 || true)"
echo "PROJECTS_CODE=$(curl -sS -o /dev/null -w '%{http_code}' $BASE/v1/projects?limit=1 || true)"
echo "RECOMMENDATIONS_CODE=$(curl -sS -o /dev/null -w '%{http_code}' $BASE/v1/recommendations?limit=1 || true)"

echo "PUBLIC_ROOT_CODE=$(curl -sS -o /dev/null -w '%{http_code}' __PUBLIC_BASE__/ || true)"
echo "PUBLIC_HEALTH_CODE=$(curl -sS -o /dev/null -w '%{http_code}' __PUBLIC_BASE__/health || true)"

echo "LOG_ERROR_MATCHES=$(docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --since 5m api | grep -E 'Traceback|ERROR|Exception|\\b5[0-9]{2}\\b|alembic' -n || true | wc -l)"
'@

  $validate = $validate.Replace('__VPS_PATH__', $VpsPath)
  $validate = $validate.Replace('__VPS_API_PORT__', "$VpsApiPort")
  $validate = $validate.Replace('__PUBLIC_BASE__', $PublicBase.TrimEnd('/'))

  $valRes = Invoke-SshBash -BashScript $validate -NoThrow
  if ($valRes.ExitCode -ne 0) {
    $report.Validation.ErrorsFound += "VALIDATION_SCRIPT_FAILED: $($valRes.Output)"
  }

  $kv = @{}
  foreach ($line in ($valRes.Output -split "`n")) {
    if ($line -match '^(?<k>[A-Z0-9_]+)=(?<v>.*)$') {
      $kv[$Matches.k] = $Matches.v.Trim().Replace("`r", "")
    }
  }

  $healthOk = ($kv['HEALTHZ_CODE'] -eq '200' -and $kv['META_CODE'] -eq '200' -and $kv['PUBLIC_HEALTH_CODE'] -eq '200')
  $apiOk = ($kv['PROPERTIES_CODE'] -eq '200' -and $kv['PROJECTS_CODE'] -eq '200' -and $kv['RECOMMENDATIONS_CODE'] -eq '200')
  $authOk = ($kv['AUTH_ME_CODE'] -eq '401' -and $kv['AUTH_LOGIN_INVALID_CODE'] -eq '401')
  $assetsOk = ($kv['PUBLIC_ROOT_CODE'] -match '^(2|3)\d\d$')

  $report.Validation.Health = ("internal_healthz=$($kv['HEALTHZ_CODE']) public_health=$($kv['PUBLIC_HEALTH_CODE'])").Replace("`r", "")
  $report.Validation.Api = ("properties=$($kv['PROPERTIES_CODE']) projects=$($kv['PROJECTS_CODE']) recommendations=$($kv['RECOMMENDATIONS_CODE'])").Replace("`r", "")
  $report.Validation.Auth = ("auth_me=$($kv['AUTH_ME_CODE']) login_invalid=$($kv['AUTH_LOGIN_INVALID_CODE'])").Replace("`r", "")
  $report.Validation.Assets = ("public_root=$($kv['PUBLIC_ROOT_CODE'])").Replace("`r", "")

  if ($kv.ContainsKey('LOG_ERROR_MATCHES') -and [int]$kv['LOG_ERROR_MATCHES'] -gt 0) {
    $report.Validation.ErrorsFound += "api_logs_error_matches=$($kv['LOG_ERROR_MATCHES'])"
  }

  # Final verdict
  $finalShaOk = ($report.Final.DeployedSha -eq $report.Source.SourceSha)
  $finalContainerOk = ($report.Final.ContainerStable -eq $true)

  $report.Verdict.ProductionHealthy = ($healthOk -and $apiOk -and $authOk -and $assetsOk -and $finalShaOk -and $finalContainerOk)

  if (-not $report.Verdict.ProductionHealthy) {
    $report.Validation.ErrorsFound += "VERDICT_COMPONENTS: health=$healthOk api=$apiOk auth=$authOk assets=$assetsOk sha=$finalShaOk container=$finalContainerOk"
  }

  Write-GuardReportText -Report $report
  if ($report.Verdict.ProductionHealthy) { exit 0 } else { exit 1 }
} catch {
  $report.Actions.Aborted = $true
  if (-not $report.Actions.AbortReason) {
    $report.Actions.AbortReason = $_.Exception.Message
  }

  $report.Validation.ErrorsFound += "EXCEPTION: $($_.Exception.Message)"
  $report.Verdict.ProductionHealthy = $false

  Write-GuardReportText -Report $report
  exit 1
}
