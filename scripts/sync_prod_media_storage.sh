#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT="${1:-/var/www/amppattaya/media}"
DEST_ROOT="${2:-/opt/flowbiz/storage/media}"

if [[ ! -d "$SOURCE_ROOT" ]]; then
  echo "Missing source media root: $SOURCE_ROOT" >&2
  exit 1
fi

mkdir -p "$DEST_ROOT"

copied_count=0

while IFS= read -r -d '' source_path; do
  relative_path="${source_path#"$SOURCE_ROOT"/}"
  destination_path="${DEST_ROOT}/${relative_path}"
  if [[ -e "$destination_path" ]]; then
    continue
  fi

  mkdir -p "$(dirname "$destination_path")"
  cp -p "$source_path" "$destination_path"
  printf 'copied_missing_media=%s\n' "$relative_path"
  copied_count=$((copied_count + 1))
done < <(find "$SOURCE_ROOT" -type f -print0 | sort -z)

printf 'media_sync source=%s destination=%s copied=%s\n' "$SOURCE_ROOT" "$DEST_ROOT" "$copied_count"
