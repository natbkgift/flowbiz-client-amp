param(
  [string]$Base = "main",
  [string]$Branch = "",
  [string]$CommitMessage = "auto: evolution loop",
  [string]$PrTitle = "auto: evolution loop",
  [string]$PrBody = "",
  [string]$OutDir = "output",
  # Compatibility with agent prompts that specify explicit instruction sources
  [string]$EnginePath = ".\docs\SOVEREIGN_EVOLUTION_ENGINE.md",
  [string]$PromptPath = "",
  [string]$BlueprintDir = ".\docs\blueprint",
  [string]$ArtifactsDir = "",
  [string]$EvidenceOut = "",
  [string]$StopCondition = "queue_empty",
  [switch]$RequirePromptPath,
  [int]$MaxMinutes = 45,
  [switch]$ResetQueueIfAllDone,
  [switch]$SkipCommit,
  [switch]$SkipPr,
  [switch]$SkipMerge,
  [switch]$SkipDeploy,
  # --- New parameters for iterative self-healing loop ---
  [switch]$ValidateOnly,       # Only score + audit + gap report (no git/PR/deploy)
  [switch]$AutoCommitWip,      # Commit dirty tree as WIP before validation
  [switch]$RawScoring          # Use raw scoring (reset, no growth constraints)
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $RepoRoot

$Python = Join-Path $RepoRoot '.venv\Scripts\python.exe'
if (-not (Test-Path $Python)) { $Python = 'python' }

$ts = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$EffectiveArtifactsDir = $OutDir
if ($ArtifactsDir) { $EffectiveArtifactsDir = $ArtifactsDir }
$OutDirAbs = Join-Path $RepoRoot $EffectiveArtifactsDir
$LogsDir = Join-Path $OutDirAbs 'logs'
$GovDir = Join-Path $OutDirAbs 'governance'
$EvoDir = Join-Path $OutDirAbs 'evolution'
$InputsDir = Join-Path $OutDirAbs 'inputs'
$QueuePath = Join-Path $OutDirAbs 'queue.json'
New-Item -ItemType Directory -Force -Path $LogsDir,$GovDir,$EvoDir,$InputsDir | Out-Null

$Transcript = Join-Path $LogsDir "run.$ts.log"
Start-Transcript -Path $Transcript -Append | Out-Null

function Write-JsonNoBom([string]$Path, $Object) {
  $json = ($Object | ConvertTo-Json -Depth 12)
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $json + "`n", $utf8NoBom)
}

# Safety: ValidateOnly implies SkipCommit and all downstream skips.
if ($ValidateOnly) {
  $SkipCommit = $true
  $SkipPr = $true
  $SkipMerge = $true
  $SkipDeploy = $true
}

# Safety: SkipCommit is intended for artifact-only prompt test runs.
# It must not create PRs, merge, or deploy.
if ($SkipCommit) {
  $SkipPr = $true
  $SkipMerge = $true
  $SkipDeploy = $true
}

# PromptPath behavior:
# - Default: optional. If missing, record artifact and continue using blueprint.
# - Strict: when -RequirePromptPath is set, missing PromptPath stops the run.
if ($PromptPath -and (-not (Test-Path -LiteralPath $PromptPath))) {
  $missing = [ordered]@{
    timestamp_utc = (Get-Date).ToUniversalTime().ToString('o')
    error = 'PROMPT_PATH_MISSING'
    prompt_path = $PromptPath
    engine_path = $EnginePath
    artifacts_dir = (Resolve-Path $OutDirAbs).Path
    stop_condition = $StopCondition
    require_prompt_path = [bool]$RequirePromptPath
    continued = $true
  }
  if ($RequirePromptPath) {
    $missing.continued = $false
  }
  $missing | ConvertTo-Json -Depth 6 | Out-File -FilePath (Join-Path $OutDirAbs 'PROMPT_PATH_MISSING.json') -Encoding utf8
  if ($RequirePromptPath) {
    Stop-Transcript | Out-Null
    throw "PromptPath not found (strict): $PromptPath"
  }
}

# Stage inputs into output/** so downstream agents can operate artifact-only.
$StagedPromptPath = ""
$StagedEnginePath = ""
$StagedBlueprintDir = ""
if ($PromptPath) {
  if (Test-Path -LiteralPath $PromptPath) {
    $promptName = Split-Path -Leaf $PromptPath
    $StagedPromptPath = (Join-Path $InputsDir $promptName)
    Copy-Item -LiteralPath $PromptPath -Destination $StagedPromptPath -Force
  }
}
if ($EnginePath) {
  if (Test-Path -LiteralPath $EnginePath) {
    $engineName = Split-Path -Leaf $EnginePath
    $StagedEnginePath = (Join-Path $InputsDir $engineName)
    Copy-Item -LiteralPath $EnginePath -Destination $StagedEnginePath -Force
  } elseif (-not $ValidateOnly) {
    # Engine path is optional in non-ValidateOnly mode, but if specified and missing, stop.
    $missing = [ordered]@{
      timestamp_utc = (Get-Date).ToUniversalTime().ToString('o')
      error = 'ENGINE_PATH_MISSING'
      engine_path = $EnginePath
      prompt_path = $PromptPath
      artifacts_dir = (Resolve-Path $OutDirAbs).Path
      stop_condition = $StopCondition
    }
    $missing | ConvertTo-Json -Depth 6 | Out-File -FilePath (Join-Path $OutDirAbs 'ENGINE_PATH_MISSING.json') -Encoding utf8
    Stop-Transcript | Out-Null
    throw "EnginePath not found: $EnginePath"
  }
}

if ($BlueprintDir) {
  if (Test-Path -LiteralPath $BlueprintDir) {
    $StagedBlueprintDir = (Join-Path $InputsDir 'blueprint')
    Copy-Item -Recurse -Force -LiteralPath $BlueprintDir -Destination $StagedBlueprintDir

    # Seed an ordered queue only if one does not already exist.
    if (-not (Test-Path -LiteralPath $QueuePath)) {
      $queue = [ordered]@{
        created_at_utc = (Get-Date).ToUniversalTime().ToString('o')
        stop_condition = $StopCondition
        items = @(
          @{ id = 'BP-00'; path = 'blueprint/00_strategy/00_MASTER_BLUEPRINT.md'; status = 'pending' },
          @{ id = 'BP-01'; path = 'blueprint/01_architecture/01_MASTER_SITEMAP.md'; status = 'pending' },
          @{ id = 'BP-02'; path = 'blueprint/01_architecture/02_URL_STRUCTURE_GUIDELINE.md'; status = 'pending' },
          @{ id = 'BP-03'; path = 'blueprint/01_architecture/03_INDEX_MATRIX.md'; status = 'pending' },
          @{ id = 'BP-04'; path = 'blueprint/01_architecture/04_XML_SITEMAP_STRATEGY.md'; status = 'pending' },
          @{ id = 'BP-05'; path = 'blueprint/02_data/05_DATABASE_SCHEMA.md'; status = 'pending' },
          @{ id = 'BP-06'; path = 'blueprint/02_data/06_PROPERTY_TYPE_STANDARD.md'; status = 'pending' },
          @{ id = 'BP-07'; path = 'blueprint/02_data/07_PRODUCT_TEMPLATE_SPEC.md'; status = 'pending' },
          @{ id = 'BP-08'; path = 'blueprint/03_seo/08_CONTENT_PILLAR_MAP.md'; status = 'pending' },
          @{ id = 'BP-09'; path = 'blueprint/03_seo/09_INTERNAL_LINKING_BLUEPRINT.md'; status = 'pending' },
          @{ id = 'BP-10'; path = 'blueprint/03_seo/10_SCHEMA_MARKUP_PLAN.md'; status = 'pending' },
          @{ id = 'BP-11'; path = 'blueprint/03_seo/11_CRAWL_OPTIMIZATION_PLAN.md'; status = 'pending' },
          @{ id = 'BP-12'; path = 'blueprint/04_conversion/12_FUNNEL_DESIGN.md'; status = 'pending' },
          @{ id = 'BP-13'; path = 'blueprint/04_conversion/13_CTA_STANDARD.md'; status = 'pending' },
          @{ id = 'BP-14'; path = 'blueprint/05_data_population/14_DATA_IMPORT_SEQUENCE.md'; status = 'pending' },
          @{ id = 'BP-15'; path = 'blueprint/05_data_population/15_CONTENT_STANDARD.md'; status = 'pending' },
          @{ id = 'BP-16'; path = 'blueprint/06_release/16_QA_CHECKLIST.md'; status = 'pending' },
          @{ id = 'BP-17'; path = 'blueprint/06_release/17_RELEASE_PROTOCOL.md'; status = 'pending' }
        )
      }
      Write-JsonNoBom -Path $QueuePath -Object $queue
    }
  } elseif (-not $ValidateOnly) {
    $missing = [ordered]@{
      timestamp_utc = (Get-Date).ToUniversalTime().ToString('o')
      error = 'BLUEPRINT_DIR_MISSING'
      blueprint_dir = $BlueprintDir
      artifacts_dir = (Resolve-Path $OutDirAbs).Path
      stop_condition = $StopCondition
    }
    $missing | ConvertTo-Json -Depth 6 | Out-File -FilePath (Join-Path $OutDirAbs 'BLUEPRINT_DIR_MISSING.json') -Encoding utf8
    Stop-Transcript | Out-Null
    throw "BlueprintDir not found: $BlueprintDir"
  }
}

# Optional: if a previous session completed the queue, reset it so the loop can run again.
if ($ResetQueueIfAllDone) {
  $debug = [ordered]@{
    timestamp_utc = (Get-Date).ToUniversalTime().ToString('o')
    queue_path = $QueuePath
    stop_condition = $StopCondition
    queue_exists = (Test-Path -LiteralPath $QueuePath)
    entered = $true
  }
  $debug | ConvertTo-Json -Depth 6 | Out-File -FilePath (Join-Path $OutDirAbs 'reset_queue.debug.json') -Encoding utf8

  if (Test-Path -LiteralPath $QueuePath) {
    try {
      $existing = Get-Content -LiteralPath $QueuePath -Raw | ConvertFrom-Json
      $items = @($existing.items)

      $debug.item_count = $items.Count
      $debug.first_status = $null
      if ($items.Count -gt 0) {
        $debug.first_status = $items[0].status
      }
      if ($items.Count -gt 0) {
        $allDone = $true
        foreach ($it in $items) {
          if (-not $it.status -or $it.status -ne 'done') { $allDone = $false; break }
        }
        $debug.all_done = $allDone
        if ($allDone) {
          foreach ($it in $items) {
            $it.status = 'pending'
            if ($it.PSObject.Properties.Name -contains 'result') { $it.PSObject.Properties.Remove('result') }
            if ($it.PSObject.Properties.Name -contains 'notes') { $it.PSObject.Properties.Remove('notes') }
            if ($it.PSObject.Properties.Name -contains 'recommendation') { $it.PSObject.Properties.Remove('recommendation') }
          }
          if ($existing.PSObject.Properties.Name -contains 'completed_at_utc') { $existing.PSObject.Properties.Remove('completed_at_utc') }
          Add-Member -InputObject $existing -NotePropertyName 'reset_at_utc' -NotePropertyValue ((Get-Date).ToUniversalTime().ToString('o')) -Force
          $existing.created_at_utc = (Get-Date).ToUniversalTime().ToString('o')
          $existing.stop_condition = $StopCondition
          $existing.items = $items
          Write-JsonNoBom -Path $QueuePath -Object $existing

          $applied = [ordered]@{
            timestamp_utc = (Get-Date).ToUniversalTime().ToString('o')
            queue_path = $QueuePath
            applied = $true
          }
          $applied | ConvertTo-Json -Depth 6 | Out-File -FilePath (Join-Path $OutDirAbs 'reset_queue.applied.json') -Encoding utf8
        }
      }

      $debug | ConvertTo-Json -Depth 6 | Out-File -FilePath (Join-Path $OutDirAbs 'reset_queue.debug.json') -Encoding utf8
    } catch {
      $debug.error = $_.Exception.Message
      $debug | ConvertTo-Json -Depth 6 | Out-File -FilePath (Join-Path $OutDirAbs 'reset_queue.debug.json') -Encoding utf8
      # If queue.json is malformed, ignore reset and proceed (other steps may regenerate it).
    }
  }
}

# Record session settings under output/** (no prompt content is copied)
$settings = [ordered]@{
  timestamp_utc = (Get-Date).ToUniversalTime().ToString('o')
  prompt_path = $PromptPath
  engine_path = $EnginePath
  staged_prompt_path = $StagedPromptPath
  staged_engine_path = $StagedEnginePath
  blueprint_dir = $BlueprintDir
  staged_blueprint_dir = $StagedBlueprintDir
  artifacts_dir = (Resolve-Path $OutDirAbs).Path
  evidence_out = $EvidenceOut
  stop_condition = $StopCondition
  allow_auto_merge = $env:ALLOW_AUTO_MERGE
  allow_auto_deploy = $env:ALLOW_AUTO_DEPLOY
  validate_only = [bool]$ValidateOnly
  auto_commit_wip = [bool]$AutoCommitWip
  raw_scoring = [bool]$RawScoring
}
$settings | ConvertTo-Json -Depth 6 | Out-File -FilePath (Join-Path $OutDirAbs 'session_settings.json') -Encoding utf8

# Env flags are opt-in and must be provided by the caller.
# Default missing values to 'false' and never override an explicit setting.
if (-not $env:AUTOMATION_AUTHORIZED) { $env:AUTOMATION_AUTHORIZED = 'false' }
if (-not $env:ALLOW_AUTO_MERGE) { $env:ALLOW_AUTO_MERGE = 'false' }
if (-not $env:ALLOW_AUTO_DEPLOY) { $env:ALLOW_AUTO_DEPLOY = 'false' }

if ($SkipCommit) {
  $env:AUTOMATION_AUTHORIZED = 'false'
  $env:ALLOW_AUTO_MERGE = 'false'
  $env:ALLOW_AUTO_DEPLOY = 'false'
}
$env:GOVERNANCE_OUT_DIR = (Resolve-Path $GovDir).Path

if (-not $Branch) {
  $Branch = "auto/evolution-$ts"
}

# ---------------------------------------------------------------------------
# Auto-commit WIP: clean dirty tree before validation
# ---------------------------------------------------------------------------
if ($AutoCommitWip) {
  $porcelain = (git status --porcelain)
  if ($porcelain) {
    Write-Host "[wip] Auto-committing dirty working tree..." -ForegroundColor Yellow
    git add -A
    git commit -m "wip: auto-commit before evolution loop"
    if ($LASTEXITCODE -ne 0) {
      Write-Host "[wip] git commit failed, continuing anyway" -ForegroundColor DarkYellow
    } else {
      Write-Host "[wip] WIP committed successfully" -ForegroundColor Green
    }
  }
}

git status

# ---------------------------------------------------------------------------
# Dirty worktree check (skipped in ValidateOnly mode)
# ---------------------------------------------------------------------------
if (-not $ValidateOnly) {
  $porcelain = (git status --porcelain)
  if ($porcelain) {
    $dirtyPath = Join-Path $OutDirAbs 'DIRTY_WORKTREE.txt'
    $porcelain | Out-File -FilePath $dirtyPath -Encoding utf8
    Stop-Transcript | Out-Null
    throw "Working tree is dirty. Details saved to $dirtyPath"
  }
}

# ---------------------------------------------------------------------------
# CI Gates: lint, format, test — with graceful handling in ValidateOnly mode
# ---------------------------------------------------------------------------
$ciPass = $true
$ciFailures = @()

# Ruff format (auto-fix)
& $Python -m ruff format
if ($LASTEXITCODE -ne 0) {
  if (-not $ValidateOnly) { Stop-Transcript | Out-Null; throw "ruff format failed" }
  $ciPass = $false
  $ciFailures += "ruff_format"
  Write-Host "[ci] ruff format failed, recorded in gap report" -ForegroundColor DarkYellow
}

# Ruff check (try --fix first in ValidateOnly mode)
& $Python -m ruff check .
if ($LASTEXITCODE -ne 0) {
  if ($ValidateOnly) {
    Write-Host "[ci] ruff check failed, attempting --fix..." -ForegroundColor DarkYellow
    & $Python -m ruff check --fix .
    & $Python -m ruff check .
    if ($LASTEXITCODE -ne 0) {
      $ciPass = $false
      $ciFailures += "ruff_check"
      Write-Host "[ci] ruff check still failing after --fix" -ForegroundColor DarkYellow
    }
  } else {
    Stop-Transcript | Out-Null; throw "ruff check failed"
  }
}

# Pytest
& $Python -m pytest -q --tb=short
if ($LASTEXITCODE -ne 0) {
  if (-not $ValidateOnly) { Stop-Transcript | Out-Null; throw "pytest failed" }
  $ciPass = $false
  $ciFailures += "pytest"
  Write-Host "[ci] pytest failed, recorded in gap report" -ForegroundColor DarkYellow
}

# ---------------------------------------------------------------------------
# Governance gates (skip in ValidateOnly if CI already failed — partial run OK)
# ---------------------------------------------------------------------------
$govPass = $true
if ($ciPass) {
  & $Python .\scripts\governance\run_ci_gates.py --base "origin/$Base" --head "HEAD" --out-dir $env:GOVERNANCE_OUT_DIR
  if ($LASTEXITCODE -ne 0) {
    if (-not $ValidateOnly) { Stop-Transcript | Out-Null; throw "governance gates failed" }
    $govPass = $false
    $ciFailures += "governance_gates"
    Write-Host "[ci] governance gates failed, recorded in gap report" -ForegroundColor DarkYellow
  }
}

# ---------------------------------------------------------------------------
# Scoring engine — with gradual scoring + constraints
# ---------------------------------------------------------------------------
$scoringArgs = @()
if ($RawScoring) { $scoringArgs += "--raw" }
$scoringArgs += "--output-dir"
$scoringArgs += $EffectiveArtifactsDir

& $Python .\scoring_engine.py @scoringArgs
$scoringExitCode = $LASTEXITCODE

# Copy evidence
Copy-Item -Force -ErrorAction SilentlyContinue .\evolution\evidence.json (Join-Path $EvoDir 'evidence.json')

# Optional: copy evidence to an explicit path under artifacts.
if ($EvidenceOut) {
  $dest = Join-Path $RepoRoot $EvidenceOut
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
  Copy-Item -Force -ErrorAction SilentlyContinue .\evolution\evidence.json $dest
}

$scoringPass = ($scoringExitCode -eq 0)

# Read scoring evidence for gap report
$scoringGaps = @()
$totalScore = 0
$evidencePath = Join-Path $EvoDir 'evidence.json'
if (Test-Path -LiteralPath $evidencePath) {
  try {
    $evidence = Get-Content -LiteralPath $evidencePath -Raw | ConvertFrom-Json
    $totalScore = $evidence.total_score
    if ($evidence.gap_recommendations) {
      $scoringGaps = @($evidence.gap_recommendations)
    }
  } catch {
    Write-Host "[scoring] Failed to parse evidence.json" -ForegroundColor DarkYellow
  }
}

# ---------------------------------------------------------------------------
# Blueprint audit — with repair plan
# ---------------------------------------------------------------------------
$blueprintPass = $true
$blueprintGaps = @()

if ($StopCondition -eq 'queue_empty') {
  Write-Host "[governance] Blueprint gate: auditing BP-00..BP-17" -ForegroundColor Cyan
  & $Python .\scripts\governance\finalize_blueprint_queue.py --out-dir $EffectiveArtifactsDir
  if ($LASTEXITCODE -ne 0) {
    $blueprintPass = $false

    # Read repair plan for gap report
    $repairPlanPath = Join-Path $OutDirAbs 'repair_plan.json'
    if (Test-Path -LiteralPath $repairPlanPath) {
      try {
        $repairPlan = Get-Content -LiteralPath $repairPlanPath -Raw | ConvertFrom-Json
        $blueprintGaps = @($repairPlan.repairs)
      } catch {
        Write-Host "[blueprint] Failed to parse repair_plan.json" -ForegroundColor DarkYellow
      }
    }

    if (-not $ValidateOnly) {
      Stop-Transcript | Out-Null
      throw "Blueprint gate failed (gaps remain). See output/blueprint_audit.summary.json and output/repair_plan.json"
    }
    Write-Host "[blueprint] Blueprint gaps found, see output/repair_plan.json" -ForegroundColor DarkYellow
  }
}

# ---------------------------------------------------------------------------
# Consolidated gap report + iteration status (for agent consumption)
# ---------------------------------------------------------------------------
$allPass = ($ciPass -and $govPass -and $scoringPass -and $blueprintPass)
$gapsRemaining = $scoringGaps.Count + $blueprintGaps.Count + $ciFailures.Count

# Determine action required
$actionRequired = "ready_for_deploy"
if (-not $allPass) {
  if (-not $ciPass) {
    $actionRequired = "fix_ci_failures"
  } elseif (-not $blueprintPass) {
    $actionRequired = "implement_blueprint_fixes"
  } elseif (-not $scoringPass) {
    $actionRequired = "improve_scoring_metrics"
  } else {
    $actionRequired = "fix_governance_gates"
  }
}

# Write consolidated gap report
$gapReport = [ordered]@{
  timestamp_utc = (Get-Date).ToUniversalTime().ToString('o')
  all_pass = $allPass
  ci_pass = $ciPass
  ci_failures = $ciFailures
  governance_pass = $govPass
  scoring_pass = $scoringPass
  total_score = $totalScore
  blueprint_pass = $blueprintPass
  gaps_remaining = $gapsRemaining
  action_required = $actionRequired
  scoring_gaps = $scoringGaps
  blueprint_gaps = $blueprintGaps
}
Write-JsonNoBom -Path (Join-Path $OutDirAbs 'gap_report.json') -Object $gapReport

# Write iteration status
$iterationStatus = [ordered]@{
  timestamp_utc = (Get-Date).ToUniversalTime().ToString('o')
  validate_only = [bool]$ValidateOnly
  ci_pass = $ciPass
  governance_pass = $govPass
  scoring_pass = $scoringPass
  blueprint_pass = $blueprintPass
  total_score = $totalScore
  gaps_remaining = $gapsRemaining
  action_required = $actionRequired
  all_pass = $allPass
}
Write-JsonNoBom -Path (Join-Path $OutDirAbs 'iteration_status.json') -Object $iterationStatus

# Print summary
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ITERATION STATUS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  CI:          $(if ($ciPass) { 'PASS' } else { 'FAIL' })" -ForegroundColor $(if ($ciPass) { 'Green' } else { 'Red' })
Write-Host "  Governance:  $(if ($govPass) { 'PASS' } else { 'FAIL' })" -ForegroundColor $(if ($govPass) { 'Green' } else { 'Red' })
Write-Host "  Scoring:     $totalScore / 100 $(if ($scoringPass) { 'PASS' } else { 'BELOW THRESHOLD' })" -ForegroundColor $(if ($scoringPass) { 'Green' } else { 'Yellow' })
Write-Host "  Blueprint:   $(if ($blueprintPass) { 'ALL PASS' } else { 'GAPS REMAIN' })" -ForegroundColor $(if ($blueprintPass) { 'Green' } else { 'Yellow' })
Write-Host "  Gaps:        $gapsRemaining remaining" -ForegroundColor $(if ($gapsRemaining -eq 0) { 'Green' } else { 'Yellow' })
Write-Host "  Action:      $actionRequired" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ---------------------------------------------------------------------------
# ValidateOnly mode: exit here with appropriate code
# ---------------------------------------------------------------------------
if ($ValidateOnly) {
  # Restore evidence files so working tree stays clean for agent
  if ($SkipCommit) {
    git restore --source=HEAD --worktree --staged evolution/evidence.json evolution/memory.json 2>$null
  }

  Stop-Transcript | Out-Null

  # Exit codes: 0 = all pass, 1 = scoring gaps, 2 = blueprint gaps, 3 = CI failure
  if ($allPass) { exit 0 }
  if (-not $ciPass) { exit 3 }
  if (-not $blueprintPass) { exit 2 }
  exit 1
}

# ---------------------------------------------------------------------------
# Full mode: commit + PR + merge + deploy
# ---------------------------------------------------------------------------

# Artifact-only prompt tests should not leave the working tree dirty.
if ($SkipCommit) {
  git restore --source=HEAD --worktree --staged evolution/evidence.json evolution/memory.json 2>$null
}

if (-not $SkipCommit) {
  # Commit + push (single commit)
  git show-ref --verify --quiet "refs/heads/$Branch"
  if ($LASTEXITCODE -eq 0) {
    git checkout $Branch
  } else {
    git checkout -b $Branch
  }
  if ($LASTEXITCODE -ne 0) { Stop-Transcript | Out-Null; throw "git checkout failed" }
  git add -A
  if ($LASTEXITCODE -ne 0) { Stop-Transcript | Out-Null; throw "git add failed" }
  git diff --cached --quiet
  if ($LASTEXITCODE -eq 0) {
    # Nothing to commit (prompt-test / no changes). Continue without failing.
  } else {
    git commit -m $CommitMessage
    if ($LASTEXITCODE -ne 0) { Stop-Transcript | Out-Null; throw "git commit failed" }
    git push -u origin $Branch
    if ($LASTEXITCODE -ne 0) { Stop-Transcript | Out-Null; throw "git push failed" }
  }
}

$prNumber = $null
$prUrl = $null

if ((-not $SkipCommit) -and (-not $SkipPr)) {
  if ($PrBody) {
    gh pr create --base $Base --head $Branch --title $PrTitle --body $PrBody
  } else {
    gh pr create --base $Base --head $Branch --title $PrTitle --fill
  }
  if ($LASTEXITCODE -ne 0) { Stop-Transcript | Out-Null; throw "gh pr create failed" }

  $prNumber = (gh pr view --head $Branch --json number --jq .number).Trim()
  $prUrl = (gh pr view --head $Branch --json url --jq .url).Trim()
  if (-not $prNumber) { throw "Unable to resolve PR number via gh." }

  # Snapshot PR review/comments into artifacts (for resolve loop)
  $prSnapshotPath = Join-Path $OutDirAbs 'pr_snapshot.json'
  gh pr view $prNumber --json number,url,state,mergeable,reviewDecision,reviews,comments,labels,assignees,headRefName,baseRefName > $prSnapshotPath

  # Post deterministic local gate results as a PR comment
  & $Python .\scripts\governance\autopilot.py review $prNumber --base "origin/$Base" --head "HEAD" --out-dir $env:GOVERNANCE_OUT_DIR
  if ($LASTEXITCODE -ne 0) { Stop-Transcript | Out-Null; throw "autopilot review failed" }

  if (-not $SkipMerge -and $env:ALLOW_AUTO_MERGE -eq 'true') {
    & $Python .\scripts\governance\autopilot.py merge $prNumber
    if ($LASTEXITCODE -ne 0) { Stop-Transcript | Out-Null; throw "enable automerge failed" }

    gh pr checks $prNumber --watch
    if ($LASTEXITCODE -ne 0) { Stop-Transcript | Out-Null; throw "gh pr checks watch failed" }

    $deadline = (Get-Date).AddMinutes($MaxMinutes)
    while ((Get-Date) -lt $deadline) {
      $mergedAt = (gh pr view $prNumber --json mergedAt --jq .mergedAt).Trim()
      if ($mergedAt -and $mergedAt -ne 'null') { break }
      Start-Sleep -Seconds 10
    }
  }
}

if (-not $SkipDeploy -and $env:ALLOW_AUTO_DEPLOY -eq 'true') {
  pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy_prod.ps1 -VpsHost flowbiz-vps
  if ($LASTEXITCODE -ne 0) { Stop-Transcript | Out-Null; throw "deploy failed" }
}

# Post-deploy validation (minimal): run tests again
& $Python -m pytest -q --tb=short
if ($LASTEXITCODE -ne 0) { Stop-Transcript | Out-Null; throw "post-deploy pytest failed" }

# Refresh evidence output under output/**
& $Python .\scoring_engine.py @scoringArgs
$LASTEXITCODE = 0
Copy-Item -Force -ErrorAction SilentlyContinue .\evolution\evidence.json (Join-Path $EvoDir 'evidence.json')

if ($EvidenceOut) {
  $dest = Join-Path $RepoRoot $EvidenceOut
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
  Copy-Item -Force -ErrorAction SilentlyContinue .\evolution\evidence.json $dest
}

if ($SkipCommit) {
  git restore --source=HEAD --worktree --staged evolution/evidence.json evolution/memory.json 2>$null
}



$summary = [ordered]@{
  timestamp_utc = (Get-Date).ToUniversalTime().ToString('o')
  branch = $Branch
  pr_number = $prNumber
  pr_url = $prUrl
  allow_auto_merge = $env:ALLOW_AUTO_MERGE
  allow_auto_deploy = $env:ALLOW_AUTO_DEPLOY
  artifacts = (Resolve-Path $OutDirAbs).Path
  evidence_path = (Join-Path $EvoDir 'evidence.json')
  evidence_out = $EvidenceOut
  stop_condition = $StopCondition
  engine_path = $EnginePath
  prompt_path = $PromptPath
  governance_artifacts = (Resolve-Path $GovDir).Path
}
$summary | ConvertTo-Json -Depth 6 | Out-File -FilePath (Join-Path $OutDirAbs 'summary.json') -Encoding utf8

Stop-Transcript | Out-Null
