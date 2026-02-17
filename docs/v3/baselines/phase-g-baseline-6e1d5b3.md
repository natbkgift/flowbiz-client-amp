# Phase G Baseline

- Timestamp (UTC): 2026-02-17T02:49:29.349367+00:00
- Git SHA: 6e1d5b3
- Alembic head: (failed: CalledProcessError)
- Base URL: https://amppattaya.com

## API latency (ms)

| Endpoint | Status | p50 | p95 | min | max | Errors |
|---|---:|---:|---:|---:|---:|---|
| /api/v1/meta | 200 | 1092.62 | 7635.87 | 627.37 | 8615.37 |  |
| /api/v1/inquiries | 405 | 1085.9 | 2125.24 | 620.54 | 2283.88 | HTTPError 405, HTTPError 405, HTTPError 405, HTTPError 405, HTTPError 405, HTTPError 405, HTTPError 405, HTTPError 405, HTTPError 405, HTTPError 405, HTTPError 405, HTTPError 405, HTTPError 405, HTTPError 405, HTTPError 405, HTTPError 405, HTTPError 405, HTTPError 405, HTTPError 405, HTTPError 405 |
| /api/v1/projects | 404 | 1654.12 | 8133.74 | 634.6 | 8231.98 | HTTPError 404, HTTPError 404, HTTPError 404, HTTPError 404, HTTPError 404, HTTPError 404, HTTPError 404, HTTPError 404, HTTPError 404, HTTPError 404, HTTPError 404, HTTPError 404, HTTPError 404, HTTPError 404, HTTPError 404, HTTPError 404, HTTPError 404, HTTPError 404, HTTPError 404, HTTPError 404 |

## Docker image sizes

- Capture not run in this environment. Run: `docker images` or execute this script on the VPS runner.

## Lighthouse

- Capture not run in this environment. If available, run: `npx lighthouse https://... --preset=desktop|mobile`.

Baseline JSON: `v3/baselines/phase-g-baseline-6e1d5b3.json`
