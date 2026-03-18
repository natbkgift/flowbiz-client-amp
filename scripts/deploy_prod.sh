#!/usr/bin/env bash
set -euo pipefail

# Public production deploy gate: build/recreate, then validate each public
# contract endpoint against its intended internal owner before the deploy is
# considered successful.

# API-only production deploy via fresh VPS checkout.
# The current branch does not contain the legacy Next.js frontend source, so
# this script rebuilds and replaces only the API container and leaves the
# existing admin-app container untouched.

VPS_HOST="${VPS_HOST_ALIAS:-flowbiz-vps}"
VPS_ACTIVE_PATH="${VPS_ACTIVE_PATH:-/opt/flowbiz/clients/flowbiz-client-amp}"
VPS_RELEASE_ROOT="${VPS_RELEASE_ROOT:-/opt/flowbiz/clients}"
VPS_API_PORT="${VPS_API_PORT:-8001}"
VPS_ADMIN_PORT="${VPS_ADMIN_PORT:-8002}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-flowbiz-client-amp}"
REMOTE_URL="${REMOTE_URL_OVERRIDE:-}"
TARGET_SHA="${TARGET_SHA_OVERRIDE:-$(git rev-parse HEAD)}"
ALEMBIC_UPGRADE_TARGET="${ALEMBIC_UPGRADE_TARGET:-head}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --vps-host) VPS_HOST="$2"; shift 2 ;;
    --vps-active-path) VPS_ACTIVE_PATH="$2"; shift 2 ;;
    --vps-release-root) VPS_RELEASE_ROOT="$2"; shift 2 ;;
    --vps-api-port) VPS_API_PORT="$2"; shift 2 ;;
    --vps-admin-port) VPS_ADMIN_PORT="$2"; shift 2 ;;
    --compose-project-name) COMPOSE_PROJECT_NAME="$2"; shift 2 ;;
    --remote-url) REMOTE_URL="$2"; shift 2 ;;
    --target-sha) TARGET_SHA="$2"; shift 2 ;;
    --alembic-target) ALEMBIC_UPGRADE_TARGET="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

ALEMBIC_UPGRADE_TARGET="${ALEMBIC_UPGRADE_TARGET//$'\r'/}"

SSH_OPTS=(
  -o BatchMode=yes
  -o ServerAliveInterval=15
  -o ServerAliveCountMax=10
  -o TCPKeepAlive=yes
)

if [[ -n "$(git status --short)" ]]; then
  echo "Local worktree must be clean before deploy." >&2
  exit 2
fi

ssh "${SSH_OPTS[@]}" "$VPS_HOST" bash -s -- \
  "$REMOTE_URL" \
  "$TARGET_SHA" \
  "$VPS_ACTIVE_PATH" \
  "$VPS_RELEASE_ROOT" \
  "$VPS_API_PORT" \
  "$VPS_ADMIN_PORT" \
  "$COMPOSE_PROJECT_NAME" \
  "$ALEMBIC_UPGRADE_TARGET" <<'BASH'
set -euo pipefail

REMOTE_URL="$1"
TARGET_SHA="$2"
VPS_ACTIVE_PATH="$3"
VPS_RELEASE_ROOT="$4"
VPS_API_PORT="$5"
VPS_ADMIN_PORT="$6"
COMPOSE_PROJECT_NAME="$7"
ALEMBIC_UPGRADE_TARGET="$8"
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
export TELEMETRY_SOURCE="scripts/deploy_prod.sh"
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

path = Path(os.environ["TELEMETRY_FILE"])
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
      "validation_mode": "owner-aligned",
    "results": results,
    "failed_paths": failed_paths,
    },
}
path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
sys.exit(0 if deploy_status == "ok" else 1)
PY
echo "deploy_telemetry=$telemetry_file"
BASH
