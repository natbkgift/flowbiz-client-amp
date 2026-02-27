Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$python = Join-Path $repoRoot '.venv\Scripts\python.exe'

Write-Host '[dev-all] Starting backend (FastAPI) on http://127.0.0.1:8000 ...'
Start-Process -FilePath $python -ArgumentList @('apps/api/main.py') -WorkingDirectory $repoRoot

Write-Host '[dev-all] Starting frontend (Next.js) on http://localhost:3000 ...'
Start-Process -FilePath 'powershell.exe' -ArgumentList @(
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-Command',
  "cd '$repoRoot\admin-app'; `$env:NEXT_PUBLIC_API_PROXY_TARGET='http://127.0.0.1:8000'; npm run dev"
) -WorkingDirectory (Join-Path $repoRoot 'admin-app')

Write-Host ''
Write-Host 'URLs:'
Write-Host '  Frontend: http://localhost:3000/'
Write-Host '  Backend:  http://127.0.0.1:8000/v1/meta'
Write-Host ''
Write-Host 'Stop:'
Write-Host '  Close the spawned terminals/windows, or stop processes from Task Manager.'
