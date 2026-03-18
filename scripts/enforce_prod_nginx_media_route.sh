#!/usr/bin/env bash
set -euo pipefail

CONFIG_PATH="/etc/nginx/conf.d/amppattaya.com.conf"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SNIPPET_PATH="${REPO_ROOT}/ops/nginx/amppattaya-media-location.conf"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --config) CONFIG_PATH="$2"; shift 2 ;;
    --snippet) SNIPPET_PATH="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ ! -f "$CONFIG_PATH" ]]; then
  echo "Missing nginx config: $CONFIG_PATH" >&2
  exit 1
fi

if [[ ! -f "$SNIPPET_PATH" ]]; then
  echo "Missing nginx media snippet: $SNIPPET_PATH" >&2
  exit 1
fi

export FLOWBIZ_NGINX_CONFIG_PATH="$CONFIG_PATH"
export FLOWBIZ_NGINX_SNIPPET_PATH="$SNIPPET_PATH"

python3 - <<'PY'
from __future__ import annotations

import os
from pathlib import Path


def replace_location_block(content: str, target: str, replacement: str) -> str:
    marker = f"location {target}"
    start = content.find(marker)
    if start < 0:
        raise SystemExit(f"Missing nginx block for {target}")

    brace_start = content.find("{", start)
    if brace_start < 0:
        raise SystemExit(f"Malformed nginx block for {target}")

    depth = 0
    end = -1
    for index in range(brace_start, len(content)):
      char = content[index]
      if char == "{":
        depth += 1
      elif char == "}":
        depth -= 1
        if depth == 0:
          end = index + 1
          break

    if end < 0:
        raise SystemExit(f"Unclosed nginx block for {target}")

    block_start = start
    while block_start > 0 and content[block_start - 1] in " \t":
        block_start -= 1

    before = content[:block_start]
    after = content[end:]
    if before and not before.endswith("\n"):
        before += "\n"
    if after and not after.startswith("\n"):
        replacement = replacement.rstrip("\n") + "\n"
    return before + replacement.rstrip("\n") + "\n" + after.lstrip("\n")


config_path = Path(os.environ["FLOWBIZ_NGINX_CONFIG_PATH"])
snippet_path = Path(os.environ["FLOWBIZ_NGINX_SNIPPET_PATH"])

original = config_path.read_text(encoding="utf-8")
replacement = snippet_path.read_text(encoding="utf-8").strip() + "\n"
updated = replace_location_block(original, "/media/", replacement)

if updated == original:
    print("nginx_media_route=unchanged")
    raise SystemExit(0)

backup_path = config_path.with_suffix(config_path.suffix + ".bak-flowbiz")
backup_path.write_text(original, encoding="utf-8")
config_path.write_text(updated, encoding="utf-8")
print(f"nginx_media_route=updated backup={backup_path}")
PY

nginx -t
nginx -s reload
