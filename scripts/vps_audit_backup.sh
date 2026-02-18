#!/usr/bin/env bash
set -euo pipefail

# Deterministic audit+backup routine intended to run ON the VPS.
# - Exports /v1/properties + /v1/projects to JSON (paginated)
# - Takes a compressed Postgres snapshot via pg_dump (custom format)
# - Emits a JSON summary to stdout for evidence capture

VPS_PATH="${VPS_PATH:-/opt/flowbiz/clients/flowbiz-client-amp}"
API_PORT="${VPS_API_PORT:-8001}"

BACKUP_ROOT="${BACKUP_ROOT:-/opt/flowbiz/backups/amp}"
TS_UTC="${TS_UTC:-$(date -u +%Y%m%dT%H%M%SZ)}"

cd "$VPS_PATH"

compose() {
  docker compose -f docker-compose.yml -f docker-compose.prod.yml "$@"
}

BACKUP_DIR="$BACKUP_ROOT/$TS_UTC"
mkdir -p "$BACKUP_DIR"

export API_PORT BACKUP_DIR TS_UTC VPS_PATH

python3 - <<'PY'
import hashlib
import json
import os
import urllib.request

api_port = int(os.environ.get("API_PORT", "8001"))
backup_dir = os.environ["BACKUP_DIR"]
base = f"http://127.0.0.1:{api_port}"


def fetch_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "amp-vps-audit-backup/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def paged_list(path: str, limit: int = 200, max_pages: int = 200):
    out = []
    for page in range(1, max_pages + 1):
        url = f"{base}{path}?page={page}&limit={limit}"
        try:
            data = fetch_json(url)
        except Exception:
            break
        if not isinstance(data, list) or not data:
            break
        out.extend(data)
        if len(data) < limit:
            break
    return out


properties = paged_list("/v1/properties", limit=200)
projects = paged_list("/v1/projects", limit=200)

paths = {
    "properties": os.path.join(backup_dir, "properties.json"),
    "projects": os.path.join(backup_dir, "projects.json"),
}

with open(paths["properties"], "w", encoding="utf-8") as f:
    json.dump(properties, f, ensure_ascii=False, indent=2)
with open(paths["projects"], "w", encoding="utf-8") as f:
    json.dump(projects, f, ensure_ascii=False, indent=2)


def sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


print(
    json.dumps(
        {
            "properties_count": len(properties),
            "projects_count": len(projects),
            "properties_sha256": sha256(paths["properties"]),
            "projects_sha256": sha256(paths["projects"]),
        }
    )
)
PY

# Snapshot DB (compressed custom format)
DB_DUMP="$BACKUP_DIR/postgres.dump"
DB_DUMP_ERR="$BACKUP_DIR/postgres.dump.stderr.txt"
DB_DUMP_OK=true
if ! compose exec -T postgres sh -lc 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$DB_DUMP" 2>"$DB_DUMP_ERR"; then
    DB_DUMP_OK=false
fi

export DB_DUMP_OK DB_DUMP_ERR

# Emit summary JSON
python3 - <<'PY'
import base64
import hashlib
import json
import os
import subprocess
import urllib.request

backup_dir = os.environ["BACKUP_DIR"]
api_port = int(os.environ.get("API_PORT", "8001"))
base = f"http://127.0.0.1:{api_port}"


def sh(cmd: str) -> str:
    return subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.STDOUT).strip()


def sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def b64(s: str) -> str:
    return base64.b64encode(s.encode()).decode()


compose = "docker compose -f docker-compose.yml -f docker-compose.prod.yml"

build_sha = ""
try:
    with urllib.request.urlopen(f"{base}/v1/meta", timeout=10) as resp:
        meta = json.load(resp)
        build_sha = str(meta.get("build_sha") or "")
except Exception:
    build_sha = ""

healthz_code = ""
try:
    req = urllib.request.Request(f"{base}/healthz", headers={"User-Agent": "amp-vps-audit-backup/1.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        healthz_code = str(resp.getcode())
except Exception:
    healthz_code = ""

props_path = os.path.join(backup_dir, "properties.json")
projects_path = os.path.join(backup_dir, "projects.json")
db_dump_path = os.path.join(backup_dir, "postgres.dump")
db_dump_err_path = os.environ.get("DB_DUMP_ERR") or os.path.join(backup_dir, "postgres.dump.stderr.txt")
db_dump_ok = (os.environ.get("DB_DUMP_OK", "true").lower() == "true")

out = {
    "timestamp_utc": os.environ.get("TS_UTC", ""),
    "vps_path": os.environ.get("VPS_PATH", ""),
    "backup_dir": backup_dir,
    "git": {
        "sha": sh("git rev-parse HEAD"),
        "branch": sh("git rev-parse --abbrev-ref HEAD"),
        "dirty": sh("git status --porcelain=v1"),
    },
    "api": {
        "meta_build_sha": build_sha,
        "healthz_code": healthz_code,
    },
    "alembic": {
        "current": sh(f"{compose} exec -T api alembic current 2>/dev/null || true"),
        "heads": sh(f"{compose} exec -T api alembic heads 2>/dev/null || true"),
    },
    "backups": {
        "properties": {
            "path": props_path,
            "bytes": os.path.getsize(props_path),
            "sha256": sha256(props_path),
        },
        "projects": {
            "path": projects_path,
            "bytes": os.path.getsize(projects_path),
            "sha256": sha256(projects_path),
        },
        "postgres_dump": {
            "path": db_dump_path,
            "ok": db_dump_ok,
            "stderr_path": db_dump_err_path,
            "stderr_bytes": os.path.getsize(db_dump_err_path) if os.path.exists(db_dump_err_path) else 0,
            "bytes": os.path.getsize(db_dump_path) if os.path.exists(db_dump_path) else 0,
            "sha256": sha256(db_dump_path) if os.path.exists(db_dump_path) else "",
        },
    },
}

audit_path = os.path.join(backup_dir, "audit.json")
with open(audit_path, "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2)

print(json.dumps(out))
PY
