param(
  [Parameter(Mandatory = $false)][string]$ZoneId = $env:CF_ZONE_ID,
  [Parameter(Mandatory = $false)][string]$Domain = $env:DOMAIN,
  [switch]$EnsureDns,
  [switch]$ApplyStaticOnly,
  [switch]$Purge,
  [switch]$VerifyFreeze
)

$ErrorActionPreference = 'Stop'

function Assert-Env($name) {
  if ([string]::IsNullOrWhiteSpace($env:$name)) {
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

function Create-StaticOnlyCacheRuleset([string]$z, [string]$domain) {
  if ([string]::IsNullOrWhiteSpace($domain)) { throw 'Domain is required (pass -Domain or set DOMAIN)' }

  $body = @{
    name  = 'amppattaya-static-only-cache'
    kind  = 'zone'
    phase = 'http_request_cache_settings'
    rules = @(
      @{
        action      = 'set_cache_settings'
        expression  = "http.host eq \"$domain\" and http.request.uri.path matches \"^/(api|admin|_next/data|leads|inquiries)(/.*)?$\""
        description = 'BYPASS sensitive paths'
        action_parameters = @{
          cache       = $false
          edge_ttl    = @{ mode = 'bypass' }
          browser_ttl = @{ mode = 'bypass' }
        }
      }
      @{
        action      = 'set_cache_settings'
        expression  = "http.host eq \"$domain\" and (http.request.uri.path matches \"^/_next/static/.*\" or http.request.uri.path matches \"^/_next/image.*\" or http.request.uri.path matches \"^/(images|media)/.*\")"
        description = 'CACHE static only'
        action_parameters = @{
          cache       = $true
          edge_ttl    = @{ mode = 'override_origin'; default = 86400 }
          browser_ttl = @{ mode = 'respect_origin' }
        }
      }
    )
  }

  $res = CF-Req POST "/zones/$z/rulesets" $body
  if (-not $res.success) { throw 'Failed to create ruleset' }
  Write-Host "Created ruleset: $($res.result.id)" -ForegroundColor Green
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
  Write-Host 'Purge submitted' -ForegroundColor Green
}

function Verify-Freeze([string]$domain) {
  if ([string]::IsNullOrWhiteSpace($domain)) { throw 'Domain is required (pass -Domain or set DOMAIN)' }

  Write-Host '== HTML must NOT be HIT ==' -ForegroundColor Cyan
  1..2 | ForEach-Object {
    $h = (Invoke-WebRequest -Uri "https://$domain/en/" -Method Head -UseBasicParsing).Headers
    "EN_HTML cf=$($h['cf-cache-status']) age=$($h['age']) server=$($h['server']) cache-control=$($h['cache-control'])"
  }

  Write-Host '== Static should be HIT (2nd request) ==' -ForegroundColor Cyan
  $html = (Invoke-WebRequest -Uri "https://$domain/en/" -UseBasicParsing).Content
  $chunk = [regex]::Match($html, 'src="(?<u>/_next/static/chunks/[^\"]+\.js)"').Groups['u'].Value
  if ([string]::IsNullOrWhiteSpace($chunk)) {
    Write-Host 'Could not extract a static chunk URL from HTML' -ForegroundColor Yellow
    return
  }

  $static = "https://$domain$chunk"
  1..2 | ForEach-Object {
    $h = (Invoke-WebRequest -Uri $static -Method Head -UseBasicParsing).Headers
    "STATIC cf=$($h['cf-cache-status']) age=$($h['age']) server=$($h['server']) cache-control=$($h['cache-control'])"
  }
}

Write-Host '== Zone sanity check ==' -ForegroundColor Cyan
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
  Create-StaticOnlyCacheRuleset $ZoneId $Domain
}

if ($Purge) {
  Write-Host '== APPLY: Purge / /en/ /th/ ==' -ForegroundColor Cyan
  Purge-PhaseA $ZoneId $Domain
}

if ($VerifyFreeze) {
  Write-Host '== VERIFY: Cloudflare Freeze invariants ==' -ForegroundColor Cyan
  Verify-Freeze $Domain
}

if (-not ($EnsureDns -or $ApplyStaticOnly -or $Purge -or $VerifyFreeze)) {
  Write-Host 'DONE (no changes applied). To apply, run e.g.:' -ForegroundColor Cyan
  Write-Host '  pwsh -File ops/cf/cf.ps1 -ZoneId $env:CF_ZONE_ID -Domain $env:DOMAIN -EnsureDns -ApplyStaticOnly -Purge -VerifyFreeze' -ForegroundColor Cyan
}
