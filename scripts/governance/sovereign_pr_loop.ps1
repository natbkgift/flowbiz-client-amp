param(
  [string]$Base = "main",
  [string]$Branch = "",
  [string]$CommitMessage = "auto: evolution loop",
  [string]$PrTitle = "auto: evolution loop",
  [string]$PrBody = "",
  [string]$OutDir = "output",
  # Compatibility with agent prompts that specify explicit instruction sources
  [string]$EnginePath = ".\\docs\\SOVEREIGN_EVOLUTION_ENGINE.md",
  [string]$PromptPath = "",
  [string]$BlueprintDir = ".\\docs\\blueprint",
  [string]$ArtifactsDir = "",
  [string]$EvidenceOut = "",
  [string]$StopCondition = "queue_empty",
  [switch]$RequirePromptPath,
  [int]$MaxMinutes = 45,
  [switch]$SkipCommit,
  [switch]$SkipPr,
  [switch]$SkipMerge,
  [switch]$SkipDeploy
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
New-Item -ItemType Directory -Force -Path $LogsDir,$GovDir,$EvoDir,$InputsDir | Out-Null

$Transcript = Join-Path $LogsDir "run.$ts.log"
Start-Transcript -Path $Transcript -Append | Out-Null

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
  if (-not (Test-Path -LiteralPath $EnginePath)) {
    # Engine path is optional, but if specified and missing, stop.
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
  $engineName = Split-Path -Leaf $EnginePath
  $StagedEnginePath = (Join-Path $InputsDir $engineName)
  Copy-Item -LiteralPath $EnginePath -Destination $StagedEnginePath -Force
}

if ($BlueprintDir) {
  if (-not (Test-Path -LiteralPath $BlueprintDir)) {
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

  $StagedBlueprintDir = (Join-Path $InputsDir 'blueprint')
  Copy-Item -Recurse -Force -LiteralPath $BlueprintDir -Destination $StagedBlueprintDir

  # Seed an ordered queue based on docs/blueprint/README.md index
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
  $queue | ConvertTo-Json -Depth 6 | Out-File -FilePath (Join-Path $OutDirAbs 'queue.json') -Encoding utf8
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
}
$settings | ConvertTo-Json -Depth 6 | Out-File -FilePath (Join-Path $OutDirAbs 'session_settings.json') -Encoding utf8

# Required env flags (consumed by higher-level agents / policies)
$env:AUTOMATION_AUTHORIZED = "true"
$env:ALLOW_AUTO_MERGE = "true"
$env:ALLOW_AUTO_DEPLOY = "true"
$env:GOVERNANCE_OUT_DIR = (Resolve-Path $GovDir).Path

if (-not $Branch) {
  $Branch = "auto/evolution-$ts"
}

git status

# Refuse dirty working tree to keep commits deterministic
$porcelain = (git status --porcelain)
if ($porcelain) {
  $dirtyPath = Join-Path $OutDirAbs 'DIRTY_WORKTREE.txt'
  $porcelain | Out-File -FilePath $dirtyPath -Encoding utf8
  Stop-Transcript | Out-Null
  throw "Working tree is dirty. Details saved to $dirtyPath"
}

& $Python -m ruff format
if ($LASTEXITCODE -ne 0) { Stop-Transcript | Out-Null; throw "ruff format failed" }

& $Python -m ruff check .
if ($LASTEXITCODE -ne 0) { Stop-Transcript | Out-Null; throw "ruff check failed" }

& $Python -m pytest -q --tb=short
if ($LASTEXITCODE -ne 0) { Stop-Transcript | Out-Null; throw "pytest failed" }

# Deterministic governance gates → artifacts under output/**
& $Python .\scripts\governance\run_ci_gates.py --base "origin/$Base" --head "HEAD" --out-dir $env:GOVERNANCE_OUT_DIR
if ($LASTEXITCODE -ne 0) { Stop-Transcript | Out-Null; throw "governance gates failed" }

# Evidence (scoring_engine writes to evolution/evidence.json)
& $Python .\scoring_engine.py
$LASTEXITCODE = 0
Copy-Item -Force -ErrorAction SilentlyContinue .\evolution\evidence.json (Join-Path $EvoDir 'evidence.json')

# Optional: copy evidence to an explicit path under artifacts.
if ($EvidenceOut) {
  $dest = Join-Path $RepoRoot $EvidenceOut
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
  Copy-Item -Force -ErrorAction SilentlyContinue .\evolution\evidence.json $dest
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
& $Python .\scoring_engine.py
$LASTEXITCODE = 0
Copy-Item -Force -ErrorAction SilentlyContinue .\evolution\evidence.json (Join-Path $EvoDir 'evidence.json')

if ($EvidenceOut) {
  $dest = Join-Path $RepoRoot $EvidenceOut
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
  Copy-Item -Force -ErrorAction SilentlyContinue .\evolution\evidence.json $dest
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
