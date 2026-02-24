param(
  [Parameter(Mandatory = $false)][string]$ZoneId = $env:CF_ZONE_ID,
  [Parameter(Mandatory = $false)][string]$Domain = $env:DOMAIN,
  [switch]$EnsureDns,
  [switch]$ApplyStaticOnly,
  [switch]$DisableHtmlCacheRules,
  [switch]$Purge,
  [switch]$VerifyFreeze,
  [Parameter(Mandatory = $false)][string]$LogPath = 'ops/logs/phase1/cf-headers.txt'
)

$ErrorActionPreference = 'Stop'

function Assert-Env($name) {
  $v = [Environment]::GetEnvironmentVariable([string]$name)
  if ([string]::IsNullOrWhiteSpace($v)) {
    throw "Missing env var: $name"
  }
}

function CF-Req([string]$method, [string]$path, $body = $null) {
  Assert-Env 'CF_API_TOKEN'
  $uri = "https://api.cloudflare.com/client/v4$path"
  $headers = @{
    Authorization = "Bearer $env:CF_API_TOKEN"
    'Content-Type' = 'application/json'
  }

  if ($null -ne $body) {
    return Invoke-RestMethod -Method $method -Uri $uri -Headers $headers -Body ($body | ConvertTo-Json -Depth 50)
  }

  return Invoke-RestMethod -Method $method -Uri $uri -Headers $headers
}

function Write-Evidence([string]$line) {
  $ts = (Get-Date).ToString('s')
  $msg = "[$ts] $line"
  $dir = Split-Path -Parent $LogPath
  if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
  Add-Content -Path $LogPath -Value $msg
  Write-Host $msg
}

function Get-CFZone([string]$z) {
  if ([string]::IsNullOrWhiteSpace($z)) { throw 'ZoneId is required (pass -ZoneId or set CF_ZONE_ID)' }
  $zone = CF-Req GET "/zones/$z"
  if (-not $zone.success) { throw 'Zone read failed' }
  return $zone.result
}

function List-Rulesets([string]$z) {
  $rulesets = CF-Req GET "/zones/$z/rulesets"
  $rulesets.result | Select-Object id, name, kind, phase | Format-Table
}

function List-PageRules([string]$z) {
  $pageRules = CF-Req GET "/zones/$z/pagerules"
  $pageRules.result | Select-Object id, status, priority, targets, actions | Out-String | Write-Host
}

function Find-PotentialHtmlCacheRulesets([string]$z) {
  $rulesets = (CF-Req GET "/zones/$z/rulesets").result
  foreach ($rs in $rulesets) {
    $full = CF-Req GET "/zones/$z/rulesets/$($rs.id)"
    $json = $full.result | ConvertTo-Json -Depth 60
    if (
      $json -match "\^/\(en\|th\)" -or
      $json -match "\(/en/" -or
      $json -match "\(/th/" -or
      $json -match "\(en\|th\)" -or
      $json -match "http\.request\.uri\.path" -and ($json -match "en" -or $json -match "th")
    ) {
      Write-Host "POTENTIAL HTML CACHE RULESET: $($rs.id) $($rs.name) phase=$($rs.phase)" -ForegroundColor Yellow
    }
  }
}

function Get-DesiredStaticOnlyRulesetBody([string]$domain) {
  # Strict spec: expressions must match exactly these path regexes (no host constraint)
  return @{
    name  = 'amppattaya-static-only-cache'
    kind  = 'zone'
    phase = 'http_request_cache_settings'
    rules = @(
      @{
        action      = 'set_cache_settings'
        expression  = 'http.request.uri.path matches "^/(api|admin|_next/data|leads|inquiries)(/.*)?$"'
        description = 'BYPASS sensitive paths'
        enabled     = $true
        action_parameters = @{
          cache       = $false
          edge_ttl    = @{ mode = 'bypass' }
          browser_ttl = @{ mode = 'bypass' }
        }
      }
      @{
        action      = 'set_cache_settings'
        expression  = 'http.request.uri.path matches "^/_next/static/.*" or http.request.uri.path matches "^/_next/image.*" or http.request.uri.path matches "^/(images|media)/.*"'
        description = 'CACHE static only'
        enabled     = $true
        action_parameters = @{
          cache       = $true
          edge_ttl    = @{ mode = 'override_origin'; default = 86400 }
          browser_ttl = @{ mode = 'respect_origin' }
        }
      }
    )
  }
}

function Ensure-ProxiedRootAndWww([string]$z, [string]$domain) {
  if ([string]::IsNullOrWhiteSpace($domain)) { throw 'Domain is required (pass -Domain or set DOMAIN)' }

  $dns = CF-Req GET "/zones/$z/dns_records?per_page=100"
  $targets = @($domain, "www.$domain")

  $rows = $dns.result | Where-Object { $_.name -in $targets }
  if (-not $rows) {
    Write-Host "No DNS records found for: $($targets -join ', ')" -ForegroundColor Red
    return
  }

  $rows | Select-Object id, type, name, content, proxied, ttl | Format-Table

  foreach ($rec in $rows) {
    if ($rec.proxied -eq $true -and $rec.ttl -eq 1) { continue }
    $body = @{ type = $rec.type; name = $rec.name; content = $rec.content; ttl = 1; proxied = $true }
    $res = CF-Req PUT "/zones/$z/dns_records/$($rec.id)" $body
    if (-not $res.success) {
      Write-Host "Failed to update DNS record: $($rec.name)" -ForegroundColor Red
    }
  }
}

function Upsert-StaticOnlyCacheRuleset([string]$z, [string]$domain) {
  if ([string]::IsNullOrWhiteSpace($domain)) { throw 'Domain is required (pass -Domain or set DOMAIN)' }

  $desired = Get-DesiredStaticOnlyRulesetBody $domain
  $all = (CF-Req GET "/zones/$z/rulesets").result
  $existing = $all | Where-Object { $_.phase -eq 'http_request_cache_settings' -and $_.kind -eq 'zone' -and $_.name -eq $desired.name }

  if ($existing.Count -gt 1) {
    Write-Evidence "WARN multiple rulesets named '$($desired.name)' found; will update the first one only"
  }

  if ($existing) {
    $id = $existing[0].id
    Write-Evidence "UPSERT ruleset exists -> UPDATE id=$id name=$($desired.name) phase=http_request_cache_settings"
    $res = CF-Req PUT "/zones/$z/rulesets/$id" $desired
    if (-not $res.success) { throw 'Ruleset update failed' }
    return $id
  }

  Write-Evidence "UPSERT ruleset missing -> CREATE name=$($desired.name) phase=http_request_cache_settings"
  $res = CF-Req POST "/zones/$z/rulesets" $desired
  if (-not $res.success) { throw 'Ruleset create failed' }
  return $res.result.id
}

function Normalize-Expr([string]$expr) {
  if ($null -eq $expr) { return '' }
  return ($expr -replace '\s+', '' ).ToLowerInvariant()
}

function Find-DeterministicHtmlCacheRules([string]$z) {
  $hits = @()
  $rulesets = (CF-Req GET "/zones/$z/rulesets").result
  foreach ($rs in $rulesets) {
    # Only phases that can affect cache settings
    if ($rs.phase -ne 'http_request_cache_settings') { continue }
    $full = (CF-Req GET "/zones/$z/rulesets/$($rs.id)").result
    if (-not $full.rules) { continue }

    for ($i = 0; $i -lt $full.rules.Count; $i += 1) {
      $r = $full.rules[$i]
      if ($r.action -ne 'set_cache_settings') { continue }

      $exprNorm = Normalize-Expr ($r.expression)
      # Deterministic match only: explicitly targets ^/(en|th)(/.*)?$ via matches
      $isLocaleHtmlPath = $exprNorm -match 'http\.request\.uri\.path' -and $exprNorm -match 'matches' -and $exprNorm -match '\^/\(en\|th\)\(/\.\*\)\?\$'
      if (-not $isLocaleHtmlPath) { continue }

      # Only treat as HTML-cache rule if it actually enables caching
      $cacheOn = $false
      if ($r.action_parameters -and $null -ne $r.action_parameters.cache) {
        $cacheOn = [bool]$r.action_parameters.cache
      } else {
        # If no explicit cache flag but it sets edge_ttl override, assume caching intent
        $cacheOn = ($r.action_parameters.edge_ttl.mode -ne 'bypass')
      }
      if (-not $cacheOn) { continue }

      $hits += [pscustomobject]@{
        RulesetId = $full.id
        RulesetName = $full.name
        Phase = $full.phase
        RuleIndex = $i
        RuleId = $r.id
        Enabled = $r.enabled
        Description = $r.description
        Expression = $r.expression
      }
    }
  }
  return $hits
}

function Disable-DeterministicHtmlCacheRules([string]$z) {
  $hits = Find-DeterministicHtmlCacheRules $z
  Write-Evidence "DRY-RUN DisableHtmlCacheRules: found $($hits.Count) rule(s) that deterministically match cache ^/(en|th)(/.*)?$"
  foreach ($h in $hits) {
    Write-Evidence "DRY-RUN would disable: ruleset=$($h.RulesetId) '$($h.RulesetName)' ruleIndex=$($h.RuleIndex) enabled=$($h.Enabled) expr=$($h.Expression)"
  }

  if ($hits.Count -eq 0) { return }

  # Apply: disable only those rules (do not delete rulesets)
  $grouped = $hits | Group-Object -Property RulesetId
  foreach ($g in $grouped) {
    $rid = $g.Name
    $full = (CF-Req GET "/zones/$z/rulesets/$rid").result
    $changed = $false
    foreach ($item in $g.Group) {
      $idx = [int]$item.RuleIndex
      if ($idx -ge 0 -and $idx -lt $full.rules.Count) {
        if ($full.rules[$idx].enabled -ne $false) {
          $full.rules[$idx].enabled = $false
          $changed = $true
          Write-Evidence "APPLY disabled: ruleset=$rid ruleIndex=$idx"
        }
      }
    }
    if (-not $changed) { continue }

    $body = @{ name = $full.name; kind = $full.kind; phase = $full.phase; rules = $full.rules }
    $res = CF-Req PUT "/zones/$z/rulesets/$rid" $body
    if (-not $res.success) { throw "Failed to update ruleset $rid" }
  }
}

function Purge-PhaseA([string]$z, [string]$domain) {
  if ([string]::IsNullOrWhiteSpace($domain)) { throw 'Domain is required (pass -Domain or set DOMAIN)' }
  $purgeBody = @{ files = @(
      "https://$domain/",
      "https://$domain/en/",
      "https://$domain/th/"
    )
  }
  $res = CF-Req POST "/zones/$z/purge_cache" $purgeBody
  if (-not $res.success) { throw 'Purge failed' }
  Write-Evidence 'Purge submitted for / /en/ /th/'
}

function Verify-Freeze([string]$domain) {
  if ([string]::IsNullOrWhiteSpace($domain)) { throw 'Domain is required (pass -Domain or set DOMAIN)' }

  Write-Evidence 'VERIFY start'

  foreach ($p in @('/en/', '/th/')) {
    1..2 | ForEach-Object {
      $h = (Invoke-WebRequest -Uri "https://$domain$p" -Method Head -UseBasicParsing).Headers
      $cf = $h['cf-cache-status']
      $age = $h['age']
      $srv = $h['server']
      $cc = $h['cache-control']
      Write-Evidence "HTML $p cf=$cf age=$age server=$srv cache-control=$cc"

      if ($cf -eq 'HIT') {
        Write-Evidence "FAIL HTML $p is HIT (must be DYNAMIC/MISS/BYPASS)"
      }
    }
  }

  # Static evidence: pick one real chunk from /en/
  $html = (Invoke-WebRequest -Uri "https://$domain/en/" -UseBasicParsing).Content
  $chunk = [regex]::Match($html, 'src="(?<u>/_next/static/chunks/[^\"]+\.js)"').Groups['u'].Value
  if ([string]::IsNullOrWhiteSpace($chunk)) {
    Write-Evidence 'WARN could not extract a static chunk URL from HTML'
    return
  }

  $static = "https://$domain$chunk"

  $h1 = (Invoke-WebRequest -Uri $static -Method Head -UseBasicParsing).Headers
  Start-Sleep -Seconds 2
  $h2 = (Invoke-WebRequest -Uri $static -Method Head -UseBasicParsing).Headers

  $cf1 = @($h1['cf-cache-status']) -join ','; $age1 = @($h1['age']) -join ','
  $cf2 = @($h2['cf-cache-status']) -join ','; $age2 = @($h2['age']) -join ','
  $sc1 = @($h1['set-cookie']) -join ','; $sc2 = @($h2['set-cookie']) -join ','

  Write-Evidence "STATIC round1 url=$static cf=$cf1 age=$age1 server=$($h1['server']) set-cookie=$sc1"
  Write-Evidence "STATIC round2 url=$static cf=$cf2 age=$age2 server=$($h2['server']) set-cookie=$sc2"

  if ($sc2) {
    Write-Evidence 'FAIL cached static asset has Set-Cookie'
  }
  if ($cf2 -ne 'HIT') {
    Write-Evidence 'FAIL static asset is not HIT on round2'
  }
  if ($age1 -and $age2) {
    try {
      $m1 = [regex]::Match("$age1", '\d+')
      $m2 = [regex]::Match("$age2", '\d+')
      if (-not ($m1.Success -and $m2.Success)) {
        Write-Evidence 'WARN could not parse age headers'
      } else {
      $a1 = [int]$m1.Value
      $a2 = [int]$m2.Value
      if ($a2 -gt $a1) {
        Write-Evidence 'PASS static age increased on round2'
      } else {
        Write-Evidence 'INFO static age did not increase on round2 (soft signal; may be different edge)'
      }
      }
    } catch {
      Write-Evidence 'WARN could not compare age headers'
    }
  }

  Write-Evidence 'VERIFY end'
}

Write-Host '== Zone sanity check ==' -ForegroundColor Cyan
if ($VerifyFreeze -and -not ($EnsureDns -or $ApplyStaticOnly -or $DisableHtmlCacheRules -or $Purge)) {
  Write-Host 'VERIFY-ONLY mode: skipping Cloudflare API calls' -ForegroundColor Cyan
  Verify-Freeze $Domain
  return
}

$zone = Get-CFZone $ZoneId
Write-Host "Zone: $($zone.name)" -ForegroundColor Green

Write-Host '== List existing cache rulesets (phase rules) ==' -ForegroundColor Cyan
List-Rulesets $ZoneId

Write-Host '== List Page Rules (quota check) ==' -ForegroundColor Cyan
List-PageRules $ZoneId

Write-Host '== Find potential en/th HTML caching rulesets (manual review) ==' -ForegroundColor Cyan
Find-PotentialHtmlCacheRulesets $ZoneId

if ($EnsureDns) {
  Write-Host '== APPLY: Ensure proxied root + www ==' -ForegroundColor Cyan
  Ensure-ProxiedRootAndWww $ZoneId $Domain
}

if ($ApplyStaticOnly) {
  Write-Host '== APPLY: Create static-only cache ruleset ==' -ForegroundColor Cyan
  Upsert-StaticOnlyCacheRuleset $ZoneId $Domain | Out-Null
}

if ($DisableHtmlCacheRules) {
  Write-Host '== APPLY: Disable deterministic HTML cache rules for ^/(en|th)(/.*)?$ ==' -ForegroundColor Cyan
  Disable-DeterministicHtmlCacheRules $ZoneId
}

if ($Purge) {
  Write-Host '== APPLY: Purge / /en/ /th/ ==' -ForegroundColor Cyan
  Purge-PhaseA $ZoneId $Domain
}

if ($VerifyFreeze) {
  Write-Host '== VERIFY: Cloudflare Freeze invariants ==' -ForegroundColor Cyan
  Verify-Freeze $Domain
}

if (-not ($EnsureDns -or $ApplyStaticOnly -or $DisableHtmlCacheRules -or $Purge -or $VerifyFreeze)) {
  Write-Host 'DONE (no changes applied). To apply, run e.g.:' -ForegroundColor Cyan
  Write-Host '  pwsh -File ops/cf/cf.ps1 -ZoneId $env:CF_ZONE_ID -Domain $env:DOMAIN -EnsureDns -DisableHtmlCacheRules -ApplyStaticOnly -Purge -VerifyFreeze' -ForegroundColor Cyan
}
