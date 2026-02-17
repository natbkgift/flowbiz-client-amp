# PRODUCTION STABILIZATION REPORT

- generated_utc: `20260217T161818Z`
- baseline_run_dir: `docs/phase_reports/baseline/20260217T161436Z`
- vps: `flowbiz-vps` (`/opt/flowbiz/clients/flowbiz-client-amp`)
- public_base: `https://amppattaya.com`

## Final System State (Infra / Architecture)
- Deployment model: container-first on VPS, localhost-bound edge via existing Nginx (no Nginx changes).
- Running services (prod compose): `api`, `postgres`, `admin-app`, `otel-collector`, `prometheus`, `alertmanager`, `grafana`.
- Build:
  - git HEAD (VPS): `5e593d15`
  - API `build_sha`: `5e593d15`
  - OTEL: enabled (`OTEL_ENABLED=true`, exporter endpoint `http://otel-collector:4318/v1/traces`).
- DB migrations:
  - Alembic current: `0020_v3_media_image_urls (head)`
  - Alembic heads: `0020_v3_media_image_urls (head)`

## Determinism Validation (Hard Law)
- VPS localhost determinism probe passed (3/3 identical hashes for each endpoint):
  - `/v1/meta`
  - `/healthz`
  - `/v1/properties?page=1&limit=5`
  - `/v1/projects?page=1&limit=5`

## Observability Validation (Hard Gate)
- Metrics endpoint: `http://127.0.0.1:8001/metrics` returns `200` and is scraped by Prometheus target `amp-api` (health `up`).
- Alerting:
  - Alertmanager ready: `OK`
  - Prometheus ready: `Prometheus Server is Ready.`
  - Active alerts: none at time of probe.
- Dashboards:
  - Grafana health API reports `database: ok`.
- Tracing:
  - OTEL exporter env present in API container.
  - No `tracing_init_failed` marker detected in recent API logs.

## Smoke Tests (Localhost + Public)
- Localhost:
  - `GET /healthz` → `200`
  - `GET /v1/meta` → `200`
- Public:
  - `GET /health` → `200`
  - `GET /api/v1/meta` → `200`

## SEO Safety
- `robots.txt` reachable and references `https://amppattaya.com/sitemap.xml`.
- `sitemap.xml` reachable (`200`, `content-type: application/xml`).
- Root redirect observed (`/` → `307` to `/en`) — treated as expected locale routing.
- Public HTML/metadata snapshots captured in baseline run_dir for regression comparison.

## Conversion / CRM Safety
- No code changes were introduced as part of this stabilization cycle; only deployment + verification was performed.
- CRM/schema immutability was preserved (no migrations beyond existing head; no destructive operations).

## Incident During Cycle
- A transient production compose recreation resulted in an empty `docker compose ps` for the prod project (platform effectively down).
- Recovery action: reran `docker compose up -d --force-recreate --remove-orphans`, then revalidated migrations, determinism, smoke tests, and observability gates.

## Risk Zones / Follow-ups
- Telemetry-dependent metrics in `docs/governance/metrics.yaml` (conversion deltas, LCP/CLS/TTFB, CRM webhook success %, organic sessions) require a 24h production monitor window and external data sources; they were not directly measurable from this execution context.
- Recommended monitor window: 24h per metrics contract, with rollback triggers enforced on any breach.

## Readiness Assessment
- Conversion readiness: **pass (no UX/CTA/brand surfaces altered; endpoints healthy)**
- SEO authority readiness: **pass for integrity surfaces (robots/sitemap/meta snapshots); ongoing index/coverage requires external telemetry**
- AI layer readiness: **unknown/not exercised in this stabilization cycle**
- Scaling readiness: **pass for baseline observability + deterministic behavior; capacity limits not load-tested in this cycle**
