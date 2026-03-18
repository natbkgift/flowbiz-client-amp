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

function ConvertTo-BashArgument([string]$Value) {
  return "'" + $Value.Replace("'", "'""'""'") + "'"
}

$sshOptions = @(
  '-o', 'BatchMode=yes',
  '-o', 'ServerAliveInterval=15',
  '-o', 'ServerAliveCountMax=10',
  '-o', 'TCPKeepAlive=yes'
)

$scpOptions = @(
  '-q',
  '-o', 'BatchMode=yes',
  '-o', 'ServerAliveInterval=15',
  '-o', 'ServerAliveCountMax=10',
  '-o', 'TCPKeepAlive=yes'
)

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
export ACTIVE_REPO_SYNC_STATUS="unknown"
export ACTIVE_REPO_SYNC_DETAIL=""
export ACTIVE_REPO_SHA=""
export ACTIVE_REPO_BRANCH=""
export ACTIVE_REPO_UPSTREAM=""
export ACTIVE_REPO_ALIGNED="false"

if [[ -d "$VPS_ACTIVE_PATH/.git" ]]; then
  ACTIVE_REPO_BRANCH="$(git -C "$VPS_ACTIVE_PATH" branch --show-current 2>/dev/null || true)"
  ACTIVE_REPO_SHA="$(git -C "$VPS_ACTIVE_PATH" rev-parse HEAD 2>/dev/null || true)"

  tracked_dirty="$(git -C "$VPS_ACTIVE_PATH" status --porcelain --untracked-files=no 2>/dev/null || true)"
  if [[ -n "$tracked_dirty" ]]; then
    ACTIVE_REPO_SYNC_STATUS="skipped"
    ACTIVE_REPO_SYNC_DETAIL="Active repo has tracked local changes; skipped fast-forward sync."
  elif [[ -z "$ACTIVE_REPO_BRANCH" ]]; then
    ACTIVE_REPO_SYNC_STATUS="skipped"
    ACTIVE_REPO_SYNC_DETAIL="Active repo is not on a named branch; skipped fast-forward sync."
  else
    if git -C "$VPS_ACTIVE_PATH" fetch origin main --quiet; then
      if git -C "$VPS_ACTIVE_PATH" checkout main >/dev/null 2>&1; then
        if git -C "$VPS_ACTIVE_PATH" merge --ff-only "$TARGET_SHA" >/dev/null 2>&1; then
          ACTIVE_REPO_SYNC_STATUS="ok"
          ACTIVE_REPO_SYNC_DETAIL="Active repo fast-forwarded to deployed target SHA."
          if ! git -C "$VPS_ACTIVE_PATH" rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
            git -C "$VPS_ACTIVE_PATH" branch --set-upstream-to=origin/main main >/dev/null 2>&1 || true
          fi
        else
          ACTIVE_REPO_SYNC_STATUS="error"
          ACTIVE_REPO_SYNC_DETAIL="Active repo could not fast-forward to deployed target SHA."
        fi
      else
        ACTIVE_REPO_SYNC_STATUS="error"
        ACTIVE_REPO_SYNC_DETAIL="Active repo could not switch to branch main."
      fi
    else
      ACTIVE_REPO_SYNC_STATUS="error"
      ACTIVE_REPO_SYNC_DETAIL="Active repo could not fetch origin/main."
    fi
  fi

  ACTIVE_REPO_SHA="$(git -C "$VPS_ACTIVE_PATH" rev-parse HEAD 2>/dev/null || true)"
  ACTIVE_REPO_BRANCH="$(git -C "$VPS_ACTIVE_PATH" branch --show-current 2>/dev/null || true)"
  ACTIVE_REPO_UPSTREAM="$(git -C "$VPS_ACTIVE_PATH" rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true)"
  if [[ "$ACTIVE_REPO_SHA" == "$TARGET_SHA" ]]; then
    ACTIVE_REPO_ALIGNED="true"
  fi
else
  ACTIVE_REPO_SYNC_STATUS="missing"
  ACTIVE_REPO_SYNC_DETAIL="Active repo path is not a git repository."
fi

export ACTIVE_REPO_SYNC_STATUS
export ACTIVE_REPO_SYNC_DETAIL
export ACTIVE_REPO_SHA
export ACTIVE_REPO_BRANCH
export ACTIVE_REPO_UPSTREAM
export ACTIVE_REPO_ALIGNED

python - <<'PY'
import json
import os
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

checks = [
  {
    "owner": "admin-app",
    "public_path": "/en/shortlist",
    "internal_path": "/en/shortlist",
    "base_url": f"http://127.0.0.1:{os.environ['VPS_ADMIN_PORT']}",
    "expected": 200,
  },
  {
    "owner": "admin-app",
    "public_path": "/en/buying-cost-estimator",
    "internal_path": "/en/buying-cost-estimator",
    "base_url": f"http://127.0.0.1:{os.environ['VPS_ADMIN_PORT']}",
    "expected": 200,
  },
  {
    "owner": "api",
    "public_path": "/api/health",
    "internal_path": "/health",
    "base_url": f"http://127.0.0.1:{os.environ['VPS_API_PORT']}",
    "expected": 200,
  },
  {
    "owner": "api",
    "public_path": "/api/ping",
    "internal_path": "/ping",
    "base_url": f"http://127.0.0.1:{os.environ['VPS_API_PORT']}",
    "expected": 200,
  },
  {
    "owner": "api",
    "public_path": "/api/platform/version",
    "internal_path": "/platform/version",
    "base_url": f"http://127.0.0.1:{os.environ['VPS_API_PORT']}",
    "expected": 200,
  },
  {
    "owner": "api",
    "public_path": "/api/v1/shortlists/current?owner_type=session&owner_key=preview-smoke-owner&locale=en",
    "internal_path": "/v1/shortlists/current?owner_type=session&owner_key=preview-smoke-owner&locale=en",
    "base_url": f"http://127.0.0.1:{os.environ['VPS_API_PORT']}",
    "expected": 200,
  },
]


def fetch_status(url: str) -> int:
  request = Request(url, method="GET")
  try:
    with urlopen(request, timeout=5) as response:
      return int(getattr(response, "status", 0) or 0)
  except HTTPError as exc:
    return int(exc.code)
  except (URLError, TimeoutError, OSError):
    return 0


results: dict[str, dict[str, int | bool | str]] = {}
for _ in range(30):
  current_results = {}
  for check in checks:
    public_path = check["public_path"]
    internal_path = check["internal_path"]
    owner = check["owner"]
    expected = int(check["expected"])
    internal_url = f"{check['base_url']}{internal_path}"
    status = fetch_status(internal_url)
    current_results[public_path] = {
      "owner": owner,
      "internal_path": internal_path,
      "internal_url": internal_url,
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
  print(
    f"owner_check[{item['owner']} {path} -> {item['internal_path']}]={item['status']}"
  )

payload = {
  "generated_at": os.environ["TELEMETRY_DEPLOYED_AT"],
  "deployed_at": os.environ["TELEMETRY_DEPLOYED_AT"],
  "deploy_status": deploy_status,
  "smoke_passed": deploy_status == "ok",
  "build_sha": os.environ.get("BUILD_SHA"),
  "target_sha": os.environ.get("TARGET_SHA"),
  "release_path": os.environ.get("release_path"),
  "source": os.environ.get("TELEMETRY_SOURCE"),
  "validation_mode": "owner-aligned",
  "active_repo": {
    "sync_status": os.environ.get("ACTIVE_REPO_SYNC_STATUS"),
    "sync_detail": os.environ.get("ACTIVE_REPO_SYNC_DETAIL"),
    "sha": os.environ.get("ACTIVE_REPO_SHA") or None,
    "branch": os.environ.get("ACTIVE_REPO_BRANCH") or None,
    "upstream": os.environ.get("ACTIVE_REPO_UPSTREAM") or None,
    "aligned": os.environ.get("ACTIVE_REPO_ALIGNED") == "true",
  },
  "smoke": {
    "validation_mode": "owner-aligned",
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
  & scp @scpOptions $tmp.FullName "${VpsHost}:$remoteTmp"
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

    & ssh @sshOptions $VpsHost "mkdir -p $(ConvertTo-BashArgument $remoteOverlayRoot)"
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to create remote overlay directory."
    }

    $remoteOverlayArchive = "$remoteOverlayRoot/overlay.tar"
    & scp @scpOptions $overlayArchive "${VpsHost}:$remoteOverlayArchive"
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to upload overlay archive to VPS."
    }

    & ssh @sshOptions $VpsHost "tar -xf $(ConvertTo-BashArgument $remoteOverlayArchive) -C $(ConvertTo-BashArgument $remoteOverlayRoot) && rm -f $(ConvertTo-BashArgument $remoteOverlayArchive)"
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to extract overlay archive on VPS."
    }
  }

  $qRemoteTmp = ConvertTo-BashArgument $remoteTmp
  $qRemoteArg = ConvertTo-BashArgument $remoteArg
  $qTargetSha = ConvertTo-BashArgument $TargetSha
  $qVpsActivePath = ConvertTo-BashArgument $VpsActivePath
  $qVpsReleaseRoot = ConvertTo-BashArgument $VpsReleaseRoot
  $qVpsApiPort = ConvertTo-BashArgument ([string]$VpsApiPort)
  $qVpsAdminPort = ConvertTo-BashArgument ([string]$VpsAdminPort)
  $qComposeProjectName = ConvertTo-BashArgument $ComposeProjectName
  $qAlembicTarget = ConvertTo-BashArgument $AlembicTarget
  $qRemoteOverlayRoot = ConvertTo-BashArgument $(if ($remoteOverlayRoot) { $remoteOverlayRoot } else { "" })
  $overlayArgs = ($OverlayFiles | ForEach-Object { ConvertTo-BashArgument ($_.Replace("\", "/")) }) -join " "
  $remoteCommand = "chmod 700 $qRemoteTmp && bash $qRemoteTmp $qRemoteArg $qTargetSha $qVpsActivePath $qVpsReleaseRoot $qVpsApiPort $qVpsAdminPort $qComposeProjectName $qAlembicTarget $qRemoteOverlayRoot $overlayArgs; status=`$?; rm -f $qRemoteTmp; if [ -n $qRemoteOverlayRoot ]; then rm -rf $qRemoteOverlayRoot; fi; exit `$status"

  & ssh @sshOptions $VpsHost $remoteCommand
  if ($LASTEXITCODE -ne 0) {
    throw "Production deploy failed."
  }
} finally {
  if ($remoteOverlayRoot) {
    & ssh @sshOptions $VpsHost "rm -rf $(ConvertTo-BashArgument $remoteOverlayRoot)" | Out-Null
  }
  if ($remoteTmp) {
    & ssh @sshOptions $VpsHost "rm -f $(ConvertTo-BashArgument $remoteTmp)" | Out-Null
  }
  if ($overlayArchive) {
    Remove-Item -Force -ErrorAction SilentlyContinue $overlayArchive
  }
  Remove-Item -Force -ErrorAction SilentlyContinue $tmp.FullName
}
