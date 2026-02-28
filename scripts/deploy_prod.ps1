param(
  [string]$VpsHost = "flowbiz-vps",
  [string]$VpsActivePath = "/opt/flowbiz/clients/flowbiz-client-amp",
  [string]$VpsReleaseRoot = "/opt/flowbiz/clients",
  [int]$VpsApiPort = 8001,
  [string]$ComposeProjectName = "flowbiz-client-amp",
  [string]$RemoteUrl = "",
  [string]$TargetSha = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$dirty = (& git status --short 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0) {
  throw "Unable to read local git status."
}
if ($dirty) {
  throw "Local worktree must be clean before deploy."
}

if (-not $TargetSha) {
  $TargetSha = (& git rev-parse HEAD 2>&1 | Out-String).Trim()
  if ($LASTEXITCODE -ne 0 -or -not $TargetSha) {
    throw "Unable to resolve local HEAD SHA."
  }
}

$remoteScript = @'
set -euo pipefail

REMOTE_URL="$1"
TARGET_SHA="$2"
VPS_ACTIVE_PATH="$3"
VPS_RELEASE_ROOT="$4"
VPS_API_PORT="$5"
COMPOSE_PROJECT_NAME="$6"

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

compose=(
  docker compose
  -p "$COMPOSE_PROJECT_NAME"
  -f "$release_path/docker-compose.yml"
  -f "$release_path/docker-compose.prod.yml"
)

echo "--- build api BUILD_SHA=$BUILD_SHA"
"${compose[@]}" build api

echo "--- migrations"
"${compose[@]}" run --rm --no-deps api alembic upgrade head

echo "--- recreate api"
"${compose[@]}" up -d --no-deps --force-recreate api

echo "--- smoke"
healthz=000
properties=000
projects=000
for _ in $(seq 1 30); do
  healthz="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${VPS_API_PORT}/healthz" || echo 000)"
  properties="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${VPS_API_PORT}/v1/properties?limit=1" || echo 000)"
  projects="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:${VPS_API_PORT}/v1/projects?limit=1" || echo 000)"
  [[ "$healthz" == "200" && "$properties" == "200" && "$projects" == "200" ]] && break
  sleep 2
done

echo "release_path=$release_path"
echo "build_sha=$BUILD_SHA"
echo "healthz=$healthz"
echo "properties=$properties"
echo "projects=$projects"
[[ "$healthz" == "200" && "$properties" == "200" && "$projects" == "200" ]]
'@

$tmp = New-TemporaryFile
try {
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($tmp.FullName, $remoteScript.Replace("`r`n", "`n").Replace("`r", ""), $utf8NoBom)
  $remoteArg = if ($RemoteUrl) { $RemoteUrl } else { "__AUTO__" }
  $cmd = "cmd /c type `"$($tmp.FullName)`" | ssh -o BatchMode=yes $VpsHost bash -s -- `"$remoteArg`" `"$TargetSha`" `"$VpsActivePath`" `"$VpsReleaseRoot`" `"$VpsApiPort`" `"$ComposeProjectName`""
  & pwsh -NoProfile -Command $cmd
  if ($LASTEXITCODE -ne 0) {
    throw "Production deploy failed."
  }
} finally {
  Remove-Item -Force -ErrorAction SilentlyContinue $tmp.FullName
}
