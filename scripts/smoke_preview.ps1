param(
  [string]$BaseUrl = "http://127.0.0.1:8102"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$checks = @(
  @{ Path = "/en/shortlist"; Expected = 200 },
  @{ Path = "/en/buying-cost-estimator"; Expected = 200 },
  @{ Path = "/api/health"; Expected = 200 },
  @{ Path = "/api/ping"; Expected = 200 },
  @{ Path = "/api/platform/version"; Expected = 200 },
  @{ Path = "/api/v1/shortlists/current?owner_type=session&owner_key=preview-smoke-owner&locale=en"; Expected = 200 }
)

$results = @()
foreach ($check in $checks) {
  $url = "$BaseUrl$($check.Path)"
  $code = & curl.exe -sS -o NUL -w "%{http_code}" $url
  $results += [pscustomobject]@{
    path = $check.Path
    status = [int]$code
    expected = $check.Expected
    ok = ([int]$code -eq [int]$check.Expected)
  }
}

$results | Format-Table -AutoSize | Out-String | Write-Output

if ($results.Where({ -not $_.ok }).Count -gt 0) {
  throw "Preview smoke failed."
}