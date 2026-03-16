param(
  [string]$VpsHost = "flowbiz-vps",
  [string]$VpsActivePath = "/opt/flowbiz/clients/flowbiz-client-amp",
  [string]$VpsReleaseRoot = "/opt/flowbiz/clients",
  [int]$VpsApiPort = 8001,
  [int]$VpsAdminPort = 8002,
  [string]$ComposeProjectName = "flowbiz-client-amp",
  [string]$RemoteUrl = "",
  [string]$TargetSha = "",
  [string]$AlembicTarget = "head",
  [string[]]$OverlayFiles = @()
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (& git rev-parse --show-toplevel 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or -not $repoRoot) {
  throw "Unable to determine repository root."
}

$dirty = (& git status --short 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0) {
  throw "Unable to read local git status."
}
if ($dirty -and $OverlayFiles.Count -eq 0) {
  throw "Local worktree must be clean before deploy."
}

if (-not $TargetSha) {
  $TargetSha = (& git rev-parse HEAD 2>&1 | Out-String).Trim()
  if ($LASTEXITCODE -ne 0 -or -not $TargetSha) {
    throw "Unable to resolve local HEAD SHA."
  }
}

$AlembicTarget = $AlembicTarget.Replace("`r", "").Replace("`n", "")

function Quote-BashArg([string]$Value) {
  return "'" + $Value.Replace("'", "'""'""'") + "'"
}

$remoteScript = @'
set -euo pipefail

REMOTE_URL="$1"
TARGET_SHA="$2"
VPS_ACTIVE_PATH="$3"
VPS_RELEASE_ROOT="$4"
VPS_API_PORT="$5"
VPS_ADMIN_PORT="$6"
COMPOSE_PROJECT_NAME="$7"
ALEMBIC_UPGRADE_TARGET="$8"
OVERLAY_ROOT="$9"
shift 9
overlay_files=("$@")
ALEMBIC_UPGRADE_TARGET="${ALEMBIC_UPGRADE_TARGET//$'\r'/}"

if [[ -z "$REMOTE_URL" || "$REMOTE_URL" == "__AUTO__" ]]; then
  REMOTE_URL="$(git -C "$VPS_ACTIVE_PATH" remote get-url origin)"
fi

release_path="${VPS_RELEASE_ROOT}/flowbiz-client-amp-release-${TARGET_SHA:0:8}-$(date +%Y%m%d%H%M%S)"

cleanup() {
  code=$?
  if [[ $code -ne 0 && -d "${release_path:-}" ]]; then
    rm -rf "$release_path"
  fi
  exit $code
}
trap cleanup EXIT

mkdir -p "$VPS_RELEASE_ROOT"
git clone --branch main --single-branch "$REMOTE_URL" "$release_path"
cd "$release_path"
git checkout "$TARGET_SHA"

if [[ -n "$OVERLAY_ROOT" && ${#overlay_files[@]} -gt 0 ]]; then
  for relative_path in "${overlay_files[@]}"; do
    mkdir -p "$release_path/$(dirname "$relative_path")"
    cp "$OVERLAY_ROOT/$relative_path" "$release_path/$relative_path"
  done
fi

if [[ ! -f "$VPS_ACTIVE_PATH/.env" ]]; then
  echo "Missing production env file: $VPS_ACTIVE_PATH/.env" >&2
  exit 1
fi

set -a
. "$VPS_ACTIVE_PATH/.env"
set +a

export BUILD_SHA
BUILD_SHA="$(git rev-parse --short HEAD)"
export FLOWBIZ_ENV_FILE="$VPS_ACTIVE_PATH/.env"
export VPS_API_PORT
export VPS_ADMIN_PORT

compose=(
  docker compose
  -p "$COMPOSE_PROJECT_NAME"
  -f "$release_path/docker-compose.yml"
  -f "$release_path/docker-compose.prod.yml"
)

echo "--- build api/admin-app BUILD_SHA=$BUILD_SHA"
"${compose[@]}" build api admin-app

echo "--- migrations"
"${compose[@]}" run --rm --no-deps \
  -e ALEMBIC_UPGRADE_TARGET="$ALEMBIC_UPGRADE_TARGET" \
  api sh -lc 'python -m alembic upgrade "$ALEMBIC_UPGRADE_TARGET"'

echo "--- recreate api/admin-app"
"${compose[@]}" up -d --no-deps --force-recreate api admin-app

echo "--- smoke"
telemetry_dir="${VPS_ACTIVE_PATH}/ops/logs"
telemetry_file="${telemetry_dir}/deploy_telemetry.json"
mkdir -p "$telemetry_dir"
export TELEMETRY_FILE="$telemetry_file"
export TARGET_SHA
export release_path
export TELEMETRY_DEPLOYED_AT
TELEMETRY_DEPLOYED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
export TELEMETRY_SOURCE="scripts/deploy_prod.ps1"
export VPS_ADMIN_PORT
python - <<'PY'
import json
import os
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

checks = [
  ("/en/shortlist", 200),
  ("/en/buying-cost-estimator", 200),
  ("/api/health", 200),
  ("/api/ping", 200),
  ("/api/platform/version", 200),
  ("/api/v1/shortlists/current?owner_type=session&owner_key=preview-smoke-owner&locale=en", 200),
]
base_url = f"http://127.0.0.1:{os.environ['VPS_ADMIN_PORT']}"


def fetch_status(url: str) -> int:
  request = Request(url, method="GET")
  try:
    with urlopen(request, timeout=5) as response:
      return int(getattr(response, "status", 0) or 0)
  except HTTPError as exc:
    return int(exc.code)
  except (URLError, TimeoutError, OSError):
    return 0


results: dict[str, dict[str, int | bool]] = {}
for _ in range(30):
  current_results = {}
  for path, expected in checks:
    status = fetch_status(f"{base_url}{path}")
    current_results[path] = {
      "status": status,
      "expected": expected,
      "ok": status == expected,
    }
  results = current_results
  if all(item["ok"] for item in results.values()):
    break
  time.sleep(2)

deploy_status = "ok" if all(item["ok"] for item in results.values()) else "error"
failed_paths = [path for path, item in results.items() if not item["ok"]]

print(f"release_path={os.environ.get('release_path')}")
print(f"build_sha={os.environ.get('BUILD_SHA')}")
for path, item in results.items():
  print(f"smoke[{path}]={item['status']}")

payload = {
  "generated_at": os.environ["TELEMETRY_DEPLOYED_AT"],
  "deployed_at": os.environ["TELEMETRY_DEPLOYED_AT"],
  "deploy_status": deploy_status,
  "smoke_passed": deploy_status == "ok",
  "build_sha": os.environ.get("BUILD_SHA"),
  "target_sha": os.environ.get("TARGET_SHA"),
  "release_path": os.environ.get("release_path"),
  "source": os.environ.get("TELEMETRY_SOURCE"),
  "smoke": {
    "base_url": base_url,
    "results": results,
    "failed_paths": failed_paths,
  },
}
Path(os.environ["TELEMETRY_FILE"]).write_text(
  json.dumps(payload, ensure_ascii=False, indent=2),
  encoding="utf-8",
)
sys.exit(0 if deploy_status == "ok" else 1)
PY
echo "deploy_telemetry=$telemetry_file"
'@

$remoteTmp = $null
$remoteOverlayRoot = $null
$overlayArchive = $null
$tmp = New-TemporaryFile
try {
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($tmp.FullName, $remoteScript.Replace("`r`n", "`n").Replace("`r", ""), $utf8NoBom)
  $remoteArg = if ($RemoteUrl) { $RemoteUrl } else { "__AUTO__" }
  $remoteTmp = "/tmp/flowbiz-deploy-$([guid]::NewGuid().ToString('N')).sh"
  & scp -q $tmp.FullName "${VpsHost}:$remoteTmp"
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to upload deploy script to VPS."
  }

  if ($OverlayFiles.Count -gt 0) {
    $remoteOverlayRoot = "/tmp/flowbiz-overlay-$([guid]::NewGuid().ToString('N'))"
    $overlayArchive = Join-Path ([System.IO.Path]::GetTempPath()) ("flowbiz-overlay-" + [guid]::NewGuid().ToString('N') + ".tar")
    $overlayArgs = @('-cf', $overlayArchive, '-C', $repoRoot)
    $overlayArgs += $OverlayFiles
    & tar.exe @overlayArgs
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to create local overlay archive."
    }

    & ssh -o BatchMode=yes $VpsHost "mkdir -p $(Quote-BashArg $remoteOverlayRoot)"
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to create remote overlay directory."
    }

    $remoteOverlayArchive = "$remoteOverlayRoot/overlay.tar"
    & scp -q $overlayArchive "${VpsHost}:$remoteOverlayArchive"
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to upload overlay archive to VPS."
    }

    & ssh -o BatchMode=yes $VpsHost "tar -xf $(Quote-BashArg $remoteOverlayArchive) -C $(Quote-BashArg $remoteOverlayRoot) && rm -f $(Quote-BashArg $remoteOverlayArchive)"
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to extract overlay archive on VPS."
    }
  }

  $qRemoteTmp = Quote-BashArg $remoteTmp
  $qRemoteArg = Quote-BashArg $remoteArg
  $qTargetSha = Quote-BashArg $TargetSha
  $qVpsActivePath = Quote-BashArg $VpsActivePath
  $qVpsReleaseRoot = Quote-BashArg $VpsReleaseRoot
  $qVpsApiPort = Quote-BashArg ([string]$VpsApiPort)
  $qVpsAdminPort = Quote-BashArg ([string]$VpsAdminPort)
  $qComposeProjectName = Quote-BashArg $ComposeProjectName
  $qAlembicTarget = Quote-BashArg $AlembicTarget
  $qRemoteOverlayRoot = Quote-BashArg $(if ($remoteOverlayRoot) { $remoteOverlayRoot } else { "" })
  $overlayArgs = ($OverlayFiles | ForEach-Object { Quote-BashArg ($_.Replace("\", "/")) }) -join " "
  $remoteCommand = "chmod 700 $qRemoteTmp && bash $qRemoteTmp $qRemoteArg $qTargetSha $qVpsActivePath $qVpsReleaseRoot $qVpsApiPort $qVpsAdminPort $qComposeProjectName $qAlembicTarget $qRemoteOverlayRoot $overlayArgs; status=`$?; rm -f $qRemoteTmp; if [ -n $qRemoteOverlayRoot ]; then rm -rf $qRemoteOverlayRoot; fi; exit `$status"

  & ssh -o BatchMode=yes $VpsHost $remoteCommand
  if ($LASTEXITCODE -ne 0) {
    throw "Production deploy failed."
  }
} finally {
  if ($remoteOverlayRoot) {
    & ssh -o BatchMode=yes $VpsHost "rm -rf $(Quote-BashArg $remoteOverlayRoot)" | Out-Null
  }
  if ($remoteTmp) {
    & ssh -o BatchMode=yes $VpsHost "rm -f $(Quote-BashArg $remoteTmp)" | Out-Null
  }
  if ($overlayArchive) {
    Remove-Item -Force -ErrorAction SilentlyContinue $overlayArchive
  }
  Remove-Item -Force -ErrorAction SilentlyContinue $tmp.FullName
}
