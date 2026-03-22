param(
  [string]$RepoRoot = ".",
  [string]$PromptFile = "tools/prompts/refactor_loop_v3.txt",
  [int]$Rounds = 8,
  [int]$RetryLimit = 2,
  [int]$RetryBackoffSec = 10,
  [int]$MaxStaleRounds = 2,
  [int]$CommandTimeoutSec = 0,
  [string]$CommandTemplate = "",
  [string]$SmokeCommand = "",
  [string]$StatusFile = ".ai/refactor-live-status.md",
  [int]$StatusPollSec = 2,
  [switch]$DryRun,
  [switch]$NoWatchStatus
)

function Get-FullPath {
  param(
    [string]$BasePath,
    [string]$CandidatePath
  )

  if ([System.IO.Path]::IsPathRooted($CandidatePath)) {
    return [System.IO.Path]::GetFullPath($CandidatePath)
  }

  return [System.IO.Path]::GetFullPath((Join-Path $BasePath $CandidatePath))
}

function Show-Block {
  param(
    [string]$Title,
    [string]$Content
  )

  if ([string]::IsNullOrWhiteSpace($Content)) {
    return
  }

  Write-Host ""
  Write-Host "===== $Title ====="
  Write-Host $Content.TrimEnd()
  Write-Host "===== END $Title ====="
}

function Show-AppendedFileContent {
  param(
    [System.IO.StreamReader]$Reader,
    [string]$OutputPath,
    [string]$Title
  )

  if ($null -eq $Reader) {
    return
  }

  $content = $Reader.ReadToEnd()
  if ([string]::IsNullOrWhiteSpace($content)) {
    return
  }

  Add-Content -Path $OutputPath -Value $content
  Show-Block -Title $Title -Content $content
}

$resolvedRepoRoot = [System.IO.Path]::GetFullPath((Resolve-Path $RepoRoot).Path)
$resolvedStatusFile = Get-FullPath -BasePath $resolvedRepoRoot -CandidatePath $StatusFile

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
)

if ($CommandTemplate) {
  $arguments += @("--command-template", $CommandTemplate)
}

if ($SmokeCommand) {
  $arguments += @("--smoke-command", $SmokeCommand)
}

if ($DryRun) {
  $arguments += "--dry-run"
}

if ($NoWatchStatus) {
  python @arguments
  exit $LASTEXITCODE
}

$launcherLogDir = Join-Path $resolvedRepoRoot "logs\refactor_runner"
New-Item -ItemType Directory -Path $launcherLogDir -Force | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$stdoutPath = Join-Path $launcherLogDir "launcher-$stamp.stdout.log"
$stderrPath = Join-Path $launcherLogDir "launcher-$stamp.stderr.log"
New-Item -ItemType File -Path $stdoutPath -Force | Out-Null
New-Item -ItemType File -Path $stderrPath -Force | Out-Null

$startInfo = [System.Diagnostics.ProcessStartInfo]::new()
$startInfo.FileName = "python"
$startInfo.WorkingDirectory = $resolvedRepoRoot
$startInfo.UseShellExecute = $false
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError = $true

foreach ($item in $arguments) {
  $null = $startInfo.ArgumentList.Add([string]$item)
}

$process = [System.Diagnostics.Process]::Start($startInfo)

Write-Host "Watching $resolvedStatusFile while refactor_runner.py is active..."

$lastStatusContent = ""
if (Test-Path $resolvedStatusFile) {
  $lastStatusContent = Get-Content -Path $resolvedStatusFile -Raw
}

do {
  $process.Refresh()

  if (Test-Path $resolvedStatusFile) {
    $statusContent = Get-Content -Path $resolvedStatusFile -Raw
    if ($statusContent -ne $lastStatusContent) {
      $lastStatusContent = $statusContent
      Show-Block -Title "LIVE STATUS" -Content $statusContent
    }
  }

  if (-not $process.HasExited) {
    Start-Sleep -Seconds $StatusPollSec
  }
} while (-not $process.HasExited)

$process.Refresh()

if (Test-Path $resolvedStatusFile) {
  $statusContent = Get-Content -Path $resolvedStatusFile -Raw
  if ($statusContent -ne $lastStatusContent) {
    Show-Block -Title "LIVE STATUS" -Content $statusContent
  }
}

$process.WaitForExit()

Show-AppendedFileContent -Reader $process.StandardOutput -OutputPath $stdoutPath -Title "RUNNER STDOUT"
Show-AppendedFileContent -Reader $process.StandardError -OutputPath $stderrPath -Title "RUNNER STDERR"

exit $process.ExitCode
