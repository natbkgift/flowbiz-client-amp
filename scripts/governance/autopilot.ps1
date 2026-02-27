param(
  [Parameter(Mandatory = $true, Position = 0)][string]$Command,
  [Parameter(ValueFromRemainingArguments = $true)][string[]]$Args
)

$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Python = Join-Path $RepoRoot '.venv\Scripts\python.exe'
if (-not (Test-Path $Python)) {
  $Python = 'python'
}

$Script = Join-Path $RepoRoot 'scripts\governance\autopilot.py'

& $Python $Script $Command @Args
