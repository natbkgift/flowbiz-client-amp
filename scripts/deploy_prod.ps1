param(
  [string]$VpsHost = "flowbiz-vps",
  [string]$VpsPath = "/opt/flowbiz/clients/flowbiz-client-amp",
  [string]$PublicBase = "https://www.amppattaya.com",
  [int]$VpsApiPort = 8001
)

$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Guard = Join-Path $RepoRoot 'scripts\continuous_production_guard.ps1'
if (-not (Test-Path $Guard)) {
  throw "Missing guard script: $Guard"
}

& pwsh -NoProfile -ExecutionPolicy Bypass -File $Guard `
  -VpsHost $VpsHost `
  -VpsPath $VpsPath `
  -PublicBase $PublicBase `
  -VpsApiPort $VpsApiPort
