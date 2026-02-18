param(
  [string]$VpsHost = "flowbiz-vps",
  [string]$VpsPath = "/opt/flowbiz/clients/flowbiz-client-amp",
  [string]$StagingVpsPath = "/opt/flowbiz/clients/flowbiz-client-amp-staging",
  [switch]$Staging,
  [switch]$Once
)

$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$StateFile = Join-Path $RepoRoot 'runtime\system_state.json'
$LockFile = Join-Path $RepoRoot 'runtime\system_state.lock'
$Python = Join-Path $RepoRoot '.venv\Scripts\python.exe'
if (-not (Test-Path $Python)) {
  $Python = 'python'
}
$StagingPython = if ($Staging) { 'True' } else { 'False' }

if (-not (Test-Path $StateFile)) {
  throw "Missing state file: $StateFile"
}

# Delete stale lock (best-effort)
Remove-Item -Force -ErrorAction SilentlyContinue $LockFile

& $Python -c @"
import json
from pathlib import Path

state_path = Path(r'''$StateFile''')
state = json.loads(state_path.read_text(encoding='utf-8'))

mission = state.setdefault('mission', {})
execution = state.setdefault('execution', {})
verification = state.setdefault('verification', {})
failures = state.setdefault('failures', {})
runtime = state.setdefault('runtime', {})
planner = state.setdefault('planner', {})

mission['mode'] = 'finite'
mission['status'] = 'running'
mission['target_final_phase'] = 10
mission['stop_when_complete'] = True
mission['completed_at'] = None

# Run from Phase 0
execution['current_phase'] = 0
execution['phase_status'] = 'idle'
execution['last_successful_phase'] = None
execution['phase_work'] = {}
execution['phase_work_retry'] = {}

# Enable self-fix + remote deploy (agent runs locally, deploys via SSH)
mission['self_fix_enabled'] = True
try:
  existing = int(mission.get('self_fix_max_attempts') or 0)
except Exception:
  existing = 0
mission['self_fix_max_attempts'] = max(existing, 2)
mission['self_fix_auto_commit'] = False
mission['self_fix_auto_deploy'] = True
mission['self_fix_vps_host'] = r'''$VpsHost'''
mission['self_fix_vps_path'] = r'''$VpsPath'''
mission['self_fix_staging_vps_path'] = r'''$StagingVpsPath'''

# Staging gates are opt-in
if ${StagingPython}:
    mission['staging_deploy_enabled'] = True
    mission['staging_required'] = True
else:
    mission.setdefault('staging_deploy_enabled', False)
    mission.setdefault('staging_required', False)

# Reset verification for a clean run
verification['phase'] = None
verification['status'] = 'unknown'
verification['checks'] = {}
verification['last_checked_at'] = None
verification['retry_count'] = 0

# Reset failures bookkeeping (best-effort)
failures['consecutive_failures'] = 0
failures['error_count'] = 0
failures['last_error'] = None
failures['last_failure_at'] = None
failures['last_rollback'] = None
failures['rollback_reason'] = None
failures['self_fix_attempts'] = {}
failures['self_fix_last'] = None

# Clear any mission_complete planner block
planner['blocked'] = False
planner['block_reason'] = None

# Reasonable loop interval when running locally
runtime.setdefault('loop_interval_seconds', 20)

state_path.write_text(json.dumps(state, indent=2, sort_keys=True) + '\n', encoding='utf-8')
print('state_updated_ok')
"@

Push-Location $RepoRoot
try {
  if ($Once) {
    & $Python runtime\runtime_loop.py --once
  } else {
    & $Python runtime\runtime_loop.py
  }
} finally {
  Pop-Location
}
