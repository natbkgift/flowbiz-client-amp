param([int]$Runs = 10, [string]$Url = "https://amppattaya.com/en/")

$ErrorActionPreference = "SilentlyContinue"
$results = @()

Write-Host "=== TTFB / Cache Header Probe ($Runs runs) ===" -ForegroundColor Cyan
Write-Host "URL: $Url" 
Write-Host ""

for ($i = 1; $i -le $Runs; $i++) {
    $bust = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $testUrl = "${Url}?ttfb=${bust}"

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $req = [System.Net.HttpWebRequest]::Create($testUrl)
        $req.Method = "GET"
        $req.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131"
        $req.Accept = "text/html"
        $req.Headers.Add("Accept-Encoding", "identity")
        $req.AllowAutoRedirect = $true
        $req.Timeout = 15000

        $resp = $req.GetResponse()
        $sw.Stop()
        $ttfb = $sw.ElapsedMilliseconds

        $cfCache      = $resp.Headers["cf-cache-status"] ?? "—"
        $age          = $resp.Headers["age"]              ?? "—"
        $serverTiming = $resp.Headers["server-timing"]    ?? "—"
        $setCookie    = if ($resp.Headers["set-cookie"]) { "YES" } else { "—" }
        $xNextCache   = $resp.Headers["x-nextjs-cache"]   ?? $resp.Headers["x-vercel-cache"] ?? "—"
        $cacheControl = $resp.Headers["cache-control"]    ?? "—"
        $contentLen   = $resp.ContentLength
        $statusCode   = [int]$resp.StatusCode

        $resp.Close()

        $row = [pscustomobject]@{
            Run           = $i
            TTFB_ms       = $ttfb
            Status        = $statusCode
            CF_Cache      = $cfCache
            Age           = $age
            SetCookie     = $setCookie
            ContentLen    = $contentLen
            ServerTiming  = ($serverTiming -replace ";dur=\d+\.\d+","").Substring(0, [math]::Min(60,$serverTiming.Length))
        }
        $results += $row
        Write-Host ("[run{0:D2}] TTFB={1,4}ms  CF={2,-8} age={3,-5} cookie={4}" -f $i, $ttfb, $cfCache, $age, $setCookie)
    } catch {
        $sw.Stop()
        Write-Host ("[run{0:D2}] ERROR: {1}" -f $i, $_.Exception.Message)
        $results += [pscustomobject]@{
            Run=($i); TTFB_ms=(-1); Status="ERR"; CF_Cache="—"; Age="—"; SetCookie="—"; ContentLen=(-1); ServerTiming=$_.Exception.Message.Substring(0,[math]::Min(40,$_.Exception.Message.Length))
        }
    }

    if ($i -lt $Runs) { Start-Sleep -Milliseconds 800 }
}

Write-Host ""
Write-Host "=== SUMMARY TABLE ===" -ForegroundColor Cyan
$results | Format-Table Run, TTFB_ms, CF_Cache, Age, SetCookie, Status -AutoSize

$validTtfb = $results | Where-Object { $_.TTFB_ms -gt 0 } | ForEach-Object { $_.TTFB_ms }
if ($validTtfb.Count -gt 0) {
    $sortedTtfb = $validTtfb | Sort-Object
    $p50 = $sortedTtfb[[int]($sortedTtfb.Count * 0.5)]
    $p90 = $sortedTtfb[[int]($sortedTtfb.Count * 0.9)]
    $min = ($sortedTtfb | Measure-Object -Minimum).Minimum
    $max = ($sortedTtfb | Measure-Object -Maximum).Maximum
    $avg = [math]::Round(($sortedTtfb | Measure-Object -Average).Average, 0)
    Write-Host ""
    Write-Host "=== TTFB STATS ===" -ForegroundColor Cyan
    Write-Host ("min={0}ms  p50={1}ms  p90={2}ms  max={3}ms  avg={4}ms" -f $min, $p50, $p90, $max, $avg)
    
    $missed = ($results | Where-Object { $_.CF_Cache -ne "HIT" -and $_.TTFB_ms -gt 0 }).Count
    $hit    = ($results | Where-Object { $_.CF_Cache -eq "HIT"  -and $_.TTFB_ms -gt 0 }).Count
    Write-Host ("CF HIT={0}  MISS/DYNAMIC={1}" -f $hit, $missed)
}

Write-Host ""
Write-Host "=== SERVER-TIMING DETAIL ===" -ForegroundColor Cyan
$results | Where-Object { $_.ServerTiming -ne "—" } | ForEach-Object { Write-Host ("[run{0:D2}] {1}" -f $_.Run, $_.ServerTiming) }
if (-not ($results | Where-Object { $_.ServerTiming -ne "—" })) { Write-Host "  (no server-timing header)" }
