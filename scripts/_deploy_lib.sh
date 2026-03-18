#!/usr/bin/env bash

flowbiz_detect_env() {
  if [[ -n "${WSL_DISTRO_NAME:-}" || -n "${WSL_INTEROP:-}" ]]; then
    printf '%s\n' 'wsl'
    return
  fi

  if [[ -n "${MSYSTEM:-}" || "${OSTYPE:-}" == msys* ]]; then
    printf '%s\n' 'git-bash'
    return
  fi

  if [[ "${OS:-}" == 'Windows_NT' || "${OSTYPE:-}" == cygwin* ]]; then
    printf '%s\n' 'windows-native'
    return
  fi

  printf '%s\n' 'posix'
}

flowbiz_log() {
  printf '%s\n' "$*" >&2
}

flowbiz_log_cmd() {
  if [[ "${FLOWBIZ_VERBOSE:-0}" != '1' ]]; then
    return
  fi

  local parts=()
  local arg
  for arg in "$@"; do
    parts+=("$(printf '%q' "$arg")")
  done

  flowbiz_log "+ ${parts[*]}"
}

flowbiz_retry_command() {
  local attempts="$1"
  local backoff_seconds="$2"
  local label="$3"
  shift 3

  local attempt=1
  local status=0

  while true; do
    flowbiz_log_cmd "$@"
    "$@"
    status=$?
    if (( status == 0 )); then
      return 0
    fi

    if (( attempt >= attempts )); then
      return "$status"
    fi

    flowbiz_log "retry[$label] attempt=${attempt}/${attempts} status=${status} backoff=${backoff_seconds}s"
    sleep "$backoff_seconds"
    attempt=$((attempt + 1))
    backoff_seconds=$((backoff_seconds * 2))
  done
}

flowbiz_pick_ssh_tools() {
  local runtime_env="$1"
  local ssh_override="${FLOWBIZ_SSH_BIN:-}"
  local scp_override="${FLOWBIZ_SCP_BIN:-}"

  if [[ -n "$ssh_override" || -n "$scp_override" ]]; then
    if [[ -z "$ssh_override" || -z "$scp_override" ]]; then
      flowbiz_log 'FLOWBIZ_SSH_BIN and FLOWBIZ_SCP_BIN must be provided together.'
      return 1
    fi
    FLOWBIZ_SELECTED_SSH_BIN="$ssh_override"
    FLOWBIZ_SELECTED_SCP_BIN="$scp_override"
    return 0
  fi

  local has_ssh_exe=0
  local has_scp_exe=0
  command -v ssh.exe >/dev/null 2>&1 && has_ssh_exe=1
  command -v scp.exe >/dev/null 2>&1 && has_scp_exe=1

  case "$runtime_env" in
    windows-native|git-bash|wsl)
      if (( has_ssh_exe != has_scp_exe )); then
        flowbiz_log 'Mixed Windows SSH toolchain detected; require both ssh.exe and scp.exe or neither.'
        return 1
      fi
      if (( has_ssh_exe == 1 )); then
        FLOWBIZ_SELECTED_SSH_BIN='ssh.exe'
        FLOWBIZ_SELECTED_SCP_BIN='scp.exe'
        return 0
      fi
      ;;
  esac

  if ! command -v ssh >/dev/null 2>&1 || ! command -v scp >/dev/null 2>&1; then
    flowbiz_log 'Unable to locate compatible ssh/scp binaries.'
    return 1
  fi

  FLOWBIZ_SELECTED_SSH_BIN='ssh'
  FLOWBIZ_SELECTED_SCP_BIN='scp'
}

flowbiz_local_copy_path() {
  local scp_bin="$1"
  local source_path="$2"

  if [[ "$scp_bin" == *.exe ]] && command -v wslpath >/dev/null 2>&1; then
    wslpath -w "$source_path"
  else
    printf '%s' "$source_path"
  fi
}

flowbiz_quote_bash() {
  printf "'%s'" "${1//\'/\'\"\'\"\'}"
}

flowbiz_read_clean_worktree_status() {
  local status_output=''

  status_output="$(git status --short 2>/dev/null || true)"
  if [[ -z "$status_output" ]]; then
    return 0
  fi

  if command -v powershell.exe >/dev/null 2>&1 && command -v wslpath >/dev/null 2>&1; then
    local repo_root=''
    local windows_repo_root=''
    repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
    windows_repo_root="$(wslpath -w "$repo_root" 2>/dev/null || true)"
    if [[ -n "$windows_repo_root" ]]; then
      status_output="$({
        powershell.exe -NoProfile -Command "\$ErrorActionPreference = 'Stop'; Set-Location -LiteralPath '$windows_repo_root'; \$status = (git status --short 2>&1 | Out-String).Trim(); if (\$status) { Write-Output \$status }"
      } | tr -d '\r')"
      if [[ -z "$status_output" ]]; then
        return 0
      fi
    fi
  fi

  printf '%s' "$status_output"
  return 1
}

flowbiz_resolve_ssh_target() {
  local ssh_bin="$1"
  local host_alias="$2"
  "$ssh_bin" -G "$host_alias" 2>/dev/null | tr -d '\r'
}

flowbiz_extract_ssh_field() {
  local ssh_config="$1"
  local field_name="$2"
  awk -v target="$field_name" '$1 == target { print $2; exit }' <<<"$ssh_config"
}

flowbiz_test_tcp() {
  local host="$1"
  local port="$2"

  if command -v powershell.exe >/dev/null 2>&1; then
    local result=''
    result="$({
      powershell.exe -NoProfile -Command "\$result = Test-NetConnection -ComputerName '$host' -Port $port -InformationLevel Quiet; if (\$result) { 'True' } else { 'False' }"
    } | tr -d '\r')"
    [[ "$result" == *True* ]]
    return
  fi

  timeout 8 bash -lc "</dev/tcp/${host}/${port}" >/dev/null 2>&1
}