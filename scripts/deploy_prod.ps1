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
  [int]$RetryAttempts = 3,
  [int]$RetryBackoffSeconds = 3,
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

function Invoke-ExternalCommandWithRetry {
  param(
    [string]$Label,
    [int]$Attempts,
    [int]$InitialBackoffSeconds,
    [scriptblock]$Operation,
    [switch]$CaptureOutput
  )

  $resolvedAttempts = [Math]::Max(1, $Attempts)
  $backoffSeconds = [Math]::Max(1, $InitialBackoffSeconds)
  $attempt = 1
  $lastOutput = ""

  while ($true) {
    if ($CaptureOutput) {
      $lastOutput = (& $Operation 2>&1 | Out-String)
    } else {
      & $Operation
      $lastOutput = ""
    }

    $exitCode = $LASTEXITCODE
    if ($exitCode -eq 0) {
      return $lastOutput
    }

    if ($attempt -ge $resolvedAttempts) {
      if ($CaptureOutput -and $lastOutput.Trim()) {
        throw "Command '$Label' failed after $attempt attempt(s) with exit code $exitCode.`n$($lastOutput.TrimEnd())"
      }
      throw "Command '$Label' failed after $attempt attempt(s) with exit code $exitCode."
    }

    Write-Warning "retry[$Label] attempt=$attempt/$resolvedAttempts status=$exitCode backoff=$backoffSeconds s"
    Start-Sleep -Seconds $backoffSeconds
    $attempt += 1
    $backoffSeconds *= 2
  }
}

function ConvertFrom-JsonOutput {
  param([string]$RawOutput)

  $trimmed = ""
  if (-not [string]::IsNullOrWhiteSpace($RawOutput)) {
    $trimmed = $RawOutput.Trim()
  }
  if (-not $trimmed) {
    return $null
  }

  $jsonStart = $trimmed.IndexOf('{')
  if ($jsonStart -lt 0) {
    return $null
  }

  try {
    return $trimmed.Substring($jsonStart) | ConvertFrom-Json -ErrorAction Stop
  } catch {
    return $null
  }
}

function Get-RemoteDeployTelemetryRecord {
  param(
    [string]$VpsHost,
    [string[]]$SshOptions,
    [string]$QuotedTelemetryPath,
    [int]$Attempts,
    [int]$InitialBackoffSeconds
  )

  $rawOutput = Invoke-ExternalCommandWithRetry -Label 'read-deploy-telemetry' -Attempts $Attempts -InitialBackoffSeconds $InitialBackoffSeconds -CaptureOutput -Operation {
    & ssh @SshOptions $VpsHost "cat $QuotedTelemetryPath"
  }
  $payload = ConvertFrom-JsonOutput -RawOutput $rawOutput
  if ($null -eq $payload) {
    throw "Production deploy telemetry could not be parsed."
  }

  return [pscustomobject]@{
    RawOutput = $rawOutput.TrimEnd()
    Payload = $payload
  }
}

function Test-DeployTelemetrySuccess {
  param(
    [pscustomobject]$TelemetryPayload,
    [string]$ExpectedStateDir,
    [string]$ExpectedTargetSha
  )

  if ($null -eq $TelemetryPayload) {
    return $false
  }

  return (
    $TelemetryPayload.state_dir -eq $ExpectedStateDir -and
    $TelemetryPayload.target_sha -eq $ExpectedTargetSha -and
    $TelemetryPayload.deploy_status -eq 'ok' -and
    $TelemetryPayload.smoke_passed
  )
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
  Invoke-ExternalCommandWithRetry -Label 'upload-deploy-script' -Attempts $RetryAttempts -InitialBackoffSeconds $RetryBackoffSeconds -Operation {
    & scp @scpOptions $tmp.FullName "${VpsHost}:$remoteTmp"
  } | Out-Null

  Invoke-ExternalCommandWithRetry -Label 'upload-deploy-runner' -Attempts $RetryAttempts -InitialBackoffSeconds $RetryBackoffSeconds -Operation {
    & scp @scpOptions (Join-Path $repoRoot "scripts/deploy_remote_job.sh") "${VpsHost}:$remoteRunner"
  } | Out-Null

  if ($OverlayFiles.Count -gt 0) {
    $remoteOverlayRoot = "/tmp/flowbiz-overlay-$([guid]::NewGuid().ToString('N'))"
    $overlayArchive = Join-Path ([System.IO.Path]::GetTempPath()) ("flowbiz-overlay-" + [guid]::NewGuid().ToString('N') + ".tar")
    $overlayArgs = @('-cf', $overlayArchive, '-C', $repoRoot)
    $overlayArgs += $OverlayFiles
    & tar.exe @overlayArgs
    if ($LASTEXITCODE -ne 0) {
      throw "Unable to create local overlay archive."
    }

    Invoke-ExternalCommandWithRetry -Label 'prepare-overlay-dir' -Attempts $RetryAttempts -InitialBackoffSeconds $RetryBackoffSeconds -Operation {
      & ssh @sshOptions $VpsHost "mkdir -p $(ConvertTo-BashArgument $remoteOverlayRoot)"
    } | Out-Null

    $remoteOverlayArchive = "$remoteOverlayRoot/overlay.tar"
    Invoke-ExternalCommandWithRetry -Label 'upload-overlay-archive' -Attempts $RetryAttempts -InitialBackoffSeconds $RetryBackoffSeconds -Operation {
      & scp @scpOptions $overlayArchive "${VpsHost}:$remoteOverlayArchive"
    } | Out-Null

    Invoke-ExternalCommandWithRetry -Label 'extract-overlay-archive' -Attempts $RetryAttempts -InitialBackoffSeconds $RetryBackoffSeconds -Operation {
      & ssh @sshOptions $VpsHost "tar -xf $(ConvertTo-BashArgument $remoteOverlayArchive) -C $(ConvertTo-BashArgument $remoteOverlayRoot) && rm -f $(ConvertTo-BashArgument $remoteOverlayArchive)"
    } | Out-Null
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

  Invoke-ExternalCommandWithRetry -Label 'launch-remote-deploy' -Attempts $RetryAttempts -InitialBackoffSeconds $RetryBackoffSeconds -Operation {
    & ssh @sshOptions $VpsHost $remoteCommand
  } | Out-Null

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
    $pollOutput = Invoke-ExternalCommandWithRetry -Label 'poll-deploy-state' -Attempts $RetryAttempts -InitialBackoffSeconds $RetryBackoffSeconds -CaptureOutput -Operation {
      & ssh @sshOptions $VpsHost $pollCommand
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
        try {
          $telemetryRecord = Get-RemoteDeployTelemetryRecord -VpsHost $VpsHost -SshOptions $sshOptions -QuotedTelemetryPath $qTelemetryPath -Attempts $RetryAttempts -InitialBackoffSeconds $RetryBackoffSeconds
          if (Test-DeployTelemetrySuccess -TelemetryPayload $telemetryRecord.Payload -ExpectedStateDir $remoteStateDir -ExpectedTargetSha $TargetSha) {
            Write-Warning "deploy runner exited with code $exitCode, but remote telemetry confirms success for state dir $remoteStateDir"
            if ($telemetryRecord.RawOutput) {
              Write-Host $telemetryRecord.RawOutput
            }
            $completed = $true
            break
          }

          $phase = 'unknown'
          if ($null -ne $telemetryRecord.Payload -and $null -ne $telemetryRecord.Payload.current_phase) {
            $phase = [string]$telemetryRecord.Payload.current_phase
          }
          throw "Production deploy failed with remote exit code $exitCode during phase '$phase'."
        } catch {
          throw "Production deploy failed with remote exit code $exitCode. $($_.Exception.Message)"
        }
      }
      $telemetryRecord = Get-RemoteDeployTelemetryRecord -VpsHost $VpsHost -SshOptions $sshOptions -QuotedTelemetryPath $qTelemetryPath -Attempts $RetryAttempts -InitialBackoffSeconds $RetryBackoffSeconds
      if ($telemetryRecord.RawOutput) {
        Write-Host $telemetryRecord.RawOutput
      }
      $completed = $true
      break
    }

    Start-Sleep -Seconds $DeployPollSeconds
  }

  if (-not $completed) {
    try {
      $telemetryRecord = Get-RemoteDeployTelemetryRecord -VpsHost $VpsHost -SshOptions $sshOptions -QuotedTelemetryPath $qTelemetryPath -Attempts $RetryAttempts -InitialBackoffSeconds $RetryBackoffSeconds
      if (Test-DeployTelemetrySuccess -TelemetryPayload $telemetryRecord.Payload -ExpectedStateDir $remoteStateDir -ExpectedTargetSha $TargetSha) {
        Write-Host "deploy poll timed out, but remote telemetry confirms success for state dir $remoteStateDir"
        if ($telemetryRecord.RawOutput) {
          Write-Host $telemetryRecord.RawOutput
        }
        $completed = $true
      }
    } catch {
      Write-Warning $_.Exception.Message
    }
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
