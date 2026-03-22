param(
  [string]$RepoRoot = ".",
  [string]$PromptFile = "tools/prompts/refactor_loop_v3.txt",
  [int]$Rounds = 8,
  [int]$RetryLimit = 2,
  [int]$RetryBackoffSec = 10,
  [int]$MaxStaleRounds = 2,
  [int]$CommandTimeoutSec = 0,
  [string]$CommandTemplate = "claude code --print --input-file {prompt_file}",
  [string]$SmokeCommand = "",
  [switch]$DryRun
)

$arguments = @(
  "tools/refactor_runner.py"
  "--repo-root"
  $RepoRoot
  "--prompt-file"
  $PromptFile
  "--rounds"
  $Rounds
  "--retry-limit"
  $RetryLimit
  "--retry-backoff-sec"
  $RetryBackoffSec
  "--max-stale-rounds"
  $MaxStaleRounds
  "--command-timeout-sec"
  $CommandTimeoutSec
  "--command-template"
  $CommandTemplate
)

if ($SmokeCommand) {
  $arguments += @("--smoke-command", $SmokeCommand)
}

if ($DryRun) {
  $arguments += "--dry-run"
}

python @arguments
