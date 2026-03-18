param(
  [string]$VpsHost = "flowbiz-vps",
  [string]$VpsActivePath = "/opt/flowbiz/clients/flowbiz-client-amp",
  [string]$VpsReleaseRoot = "/opt/flowbiz/clients",
  [int]$VpsApiPort = 8001,
  [int]$VpsAdminPort = 8002,
  [string]$ComposeProjectName = "flowbiz-client-amp",
  [string]$RemoteUrl = "",
  [string]$TargetSha = "",
  [string]$AlembicTarget = "head",
  [int]$DeployPollSeconds = 5,
  [int]$DeployTimeoutSeconds = 2700,
  [string[]]$OverlayFiles = @()
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (& git rev-parse --show-toplevel 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or -not $repoRoot) {
  throw "Unable to determine repository root."
}

$dirty = (& git status --short 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0) {
  throw "Unable to read local git status."
}
if ($dirty -and $OverlayFiles.Count -eq 0) {
  throw "Local worktree must be clean before deploy."
}

if (-not $TargetSha) {
  $TargetSha = (& git rev-parse HEAD 2>&1 | Out-String).Trim()
  if ($LASTEXITCODE -ne 0 -or -not $TargetSha) {
    throw "Unable to resolve local HEAD SHA."
  }
}

$AlembicTarget = $AlembicTarget.Replace("`r", "").Replace("`n", "")

function ConvertTo-BashArgument([string]$Value) {
  return "'" + $Value.Replace("'", "'""'""'") + "'"
}

$sshOptions = @(
  '-o', 'BatchMode=yes',
  '-o', 'ServerAliveInterval=15',
  '-o', 'ServerAliveCountMax=10',
  '-o', 'TCPKeepAlive=yes'
)

$scpOptions = @(
  '-q',
  '-o', 'BatchMode=yes',
  '-o', 'ServerAliveInterval=15',
  '-o', 'ServerAliveCountMax=10',
  '-o', 'TCPKeepAlive=yes'
)

$remoteScriptPath = Join-Path $repoRoot "scripts/deploy_prod_remote.sh"
if (-not (Test-Path $remoteScriptPath)) {
  throw "Missing shared remote deploy script: $remoteScriptPath"
}
$remoteScript = [System.IO.File]::ReadAllText($remoteScriptPath)
if (-not $remoteScript.Trim()) {
  throw "Shared remote deploy script is empty: $remoteScriptPath"
}

$remoteTmp = $null
$remoteRunner = $null
$remoteStateDir = $null
$telemetryPath = "$VpsActivePath/ops/logs/deploy_telemetry.json"
$remoteOverlayRoot = $null
$overlayArchive = $null
$tmp = New-TemporaryFile
try {
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($tmp.FullName, $remoteScript.Replace("`r`n", "`n").Replace("`r", ""), $utf8NoBom)
  $remoteArg = if ($RemoteUrl) { $RemoteUrl } else { "__AUTO__" }
  $remoteTmp = "/tmp/flowbiz-deploy-$([guid]::NewGuid().ToString('N')).sh"
  $remoteRunner = "/tmp/flowbiz-deploy-runner-$([guid]::NewGuid().ToString('N')).sh"
  $remoteStateDir = "/tmp/flowbiz-deploy-state-$($TargetSha.Substring(0, [Math]::Min(8, $TargetSha.Length)))-$([guid]::NewGuid().ToString('N'))"
  & scp @scpOptions $tmp.FullName "${VpsHost}:$remoteTmp"
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to upload deploy script to VPS."
  }

  & scp @scpOptions (Join-Path $repoRoot "scripts/deploy_remote_job.sh") "${VpsHost}:$remoteRunner"
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to upload deploy runner to VPS."
  }

  if ($OverlayFiles.Count -gt 0) {
    $remoteOverlayRoot = "/tmp/flowbiz-overlay-$([guid]::NewGuid().ToString('N'))"
    $overlayArchive = Join-Path ([System.IO.Path]::GetTempPath()) ("flowbiz-overlay-" + [guid]::NewGuid().ToString('N') + ".tar")
    $overlayArgs = @('-cf', $overlayArchive, '-C', $repoRoot)
    $overlayArgs += $OverlayFiles
    & tar.exe @overlayArgs
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to create local overlay archive."
    }

    & ssh @sshOptions $VpsHost "mkdir -p $(ConvertTo-BashArgument $remoteOverlayRoot)"
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to create remote overlay directory."
    }

    $remoteOverlayArchive = "$remoteOverlayRoot/overlay.tar"
    & scp @scpOptions $overlayArchive "${VpsHost}:$remoteOverlayArchive"
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to upload overlay archive to VPS."
    }

    & ssh @sshOptions $VpsHost "tar -xf $(ConvertTo-BashArgument $remoteOverlayArchive) -C $(ConvertTo-BashArgument $remoteOverlayRoot) && rm -f $(ConvertTo-BashArgument $remoteOverlayArchive)"
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to extract overlay archive on VPS."
    }
  }

  $qRemoteTmp = ConvertTo-BashArgument $remoteTmp
  $qRemoteArg = ConvertTo-BashArgument $remoteArg
  $qTargetSha = ConvertTo-BashArgument $TargetSha
  $qVpsActivePath = ConvertTo-BashArgument $VpsActivePath
  $qVpsReleaseRoot = ConvertTo-BashArgument $VpsReleaseRoot
  $qVpsApiPort = ConvertTo-BashArgument ([string]$VpsApiPort)
  $qVpsAdminPort = ConvertTo-BashArgument ([string]$VpsAdminPort)
  $qComposeProjectName = ConvertTo-BashArgument $ComposeProjectName
  $qAlembicTarget = ConvertTo-BashArgument $AlembicTarget
  $qRemoteOverlayRoot = ConvertTo-BashArgument $(if ($remoteOverlayRoot) { $remoteOverlayRoot } else { "" })
  $qRemoteRunner = ConvertTo-BashArgument $remoteRunner
  $qRemoteStateDir = ConvertTo-BashArgument $remoteStateDir
  $qTelemetryPath = ConvertTo-BashArgument $telemetryPath
  $qRemotePid = ConvertTo-BashArgument "$remoteStateDir/pid"
  $qRemoteExitCode = ConvertTo-BashArgument "$remoteStateDir/exit_code"
  $qRemoteLog = ConvertTo-BashArgument "$remoteStateDir/deploy.log"
  $overlayArgs = ($OverlayFiles | ForEach-Object { ConvertTo-BashArgument ($_.Replace("\", "/")) }) -join " "
  $remoteCommand = "mkdir -p $qRemoteStateDir && chmod 700 $qRemoteTmp $qRemoteRunner && { nohup env FLOWBIZ_DEPLOY_SOURCE=scripts/deploy_prod.ps1 bash $qRemoteRunner $qRemoteStateDir $qRemoteTmp $qRemoteOverlayRoot $qRemoteArg $qTargetSha $qVpsActivePath $qVpsReleaseRoot $qVpsApiPort $qVpsAdminPort $qComposeProjectName $qAlembicTarget $qRemoteOverlayRoot $overlayArgs > /dev/null 2>&1 < /dev/null & printf '%s\n' `$! > $qRemotePid; }"

  & ssh @sshOptions $VpsHost $remoteCommand
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to launch remote production deploy."
  }

  $deadline = [DateTimeOffset]::UtcNow.AddSeconds($DeployTimeoutSeconds)
  $lastLog = ""
  $completed = $false

  while ([DateTimeOffset]::UtcNow -lt $deadline) {
    $pollCommand = @"
if [ -f $qRemoteExitCode ]; then
  printf 'status=completed\n'
  printf 'exit_code=%s\n' `$(cat $qRemoteExitCode)
elif [ -f $qRemotePid ] && kill -0 `$(cat $qRemotePid) 2>/dev/null; then
  printf 'status=running\n'
else
  printf 'status=unknown\n'
fi
if [ -f $qRemoteLog ]; then
  printf -- '---log---\n'
  tail -n 20 $qRemoteLog
fi
"@
    $pollOutput = (& ssh @sshOptions $VpsHost $pollCommand 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to poll production deploy state."
    }

    $statusMatch = [regex]::Match($pollOutput, '^status=(.+)$', [System.Text.RegularExpressions.RegexOptions]::Multiline)
    $exitMatch = [regex]::Match($pollOutput, '^exit_code=(.+)$', [System.Text.RegularExpressions.RegexOptions]::Multiline)
    $status = if ($statusMatch.Success) { $statusMatch.Groups[1].Value.Trim() } else { "" }
    $exitCode = if ($exitMatch.Success) { $exitMatch.Groups[1].Value.Trim() } else { "" }
    $logTail = if ($pollOutput -match '(?s)---log---\r?\n(.*)$') { $Matches[1].TrimEnd() } else { "" }

    if ($logTail -and $logTail -ne $lastLog) {
      Write-Host $logTail
      $lastLog = $logTail
    }

    if ($status -eq "completed") {
      if ($exitCode -ne "0") {
        throw "Production deploy failed."
      }
      & ssh @sshOptions $VpsHost "cat $qTelemetryPath"
      if ($LASTEXITCODE -ne 0) {
        throw "Production deploy completed but telemetry could not be read."
      }
      $completed = $true
      break
    }

    Start-Sleep -Seconds $DeployPollSeconds
  }

  if (-not $completed) {
    throw "Production deploy timed out after $DeployTimeoutSeconds seconds."
  }
} finally {
  if ($remoteOverlayRoot) {
    & ssh @sshOptions $VpsHost "rm -rf $(ConvertTo-BashArgument $remoteOverlayRoot)" | Out-Null
  }
  if ($remoteRunner) {
    & ssh @sshOptions $VpsHost "rm -f $(ConvertTo-BashArgument $remoteRunner)" | Out-Null
  }
  if ($remoteTmp) {
    & ssh @sshOptions $VpsHost "rm -f $(ConvertTo-BashArgument $remoteTmp)" | Out-Null
  }
  if ($overlayArchive) {
    Remove-Item -Force -ErrorAction SilentlyContinue $overlayArchive
  }
  Remove-Item -Force -ErrorAction SilentlyContinue $tmp.FullName
}
