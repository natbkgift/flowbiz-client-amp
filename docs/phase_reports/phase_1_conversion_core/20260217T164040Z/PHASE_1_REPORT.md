# PHASE 1 — CONVERSION CORE (REPORT)

- generated_utc: `20260217T164040Z`
- objective: Stabilize conversion infrastructure (CTA + trust + normalized lead flow)
- baseline_reference: `docs/phase_reports/baseline/20260217T161436Z`
- deployed_sha: `4dbfbe68`

## 1) Investigation
- Conversion ingress path identified: `POST /v1/inquiries` (CRM inquiry creation).
- Existing behavior: any email/phone duplicate created a new inquiry with `status="lost"`, and auto-assignment was skipped → risk of lead loss on legitimate re-submits and network retries.
- Experience/brand surfaces checked via public `/en` HTML keyword probe: `Speak`, `Advisor`, `Contact`, `trust` present.

## 2) Constraint Validation
- Additive-only honored (code-only change).
- CRM schema immutable honored (no migrations, no DB schema modifications).
- No route deletion; no breaking API signature changes.
- Slice limits: 2 files changed, <800 LOC, 0 migrations.

## 3) Minimal Design Selection
- Smallest safe normalization: treat rapid identical re-submits as idempotent retries (return existing inquiry), and avoid auto-marking repeats as `lost`.
- Additive observability: header `X-Inquiry-Deduped: true|false`.

## 4) Slice Implementation
- Updated inquiry handler: [apps/api/routes/v1/crm.py](apps/api/routes/v1/crm.py)
  - Adds retry dedupe window (10 minutes) when `property_id` and `message` match.
  - On dedupe: enriches missing attribution fields, writes audit log action `retry_deduped`, returns existing inquiry.
  - On non-retry duplicate: keeps `duplicate_of_inquiry_id` linkage but sets status `new` (prevents lead loss).
  - Preserves advisor continuity when prior inquiry has `advisor_user_id`.
- Added regression test: [tests/test_phaseB_crm.py](tests/test_phaseB_crm.py)

## 5) Deterministic Validation
- Production determinism probe passed (3/3 identical hashes): `/v1/meta`, `/healthz`, `/v1/properties`, `/v1/projects`.

## 6) Observability Validation
- Staging and production gates passed:
  - `/metrics` 200, Prometheus target `amp-api` health `up`.
  - Alertmanager ready `OK`, Prometheus ready.
  - Grafana health `database: ok`.
  - No `tracing_init_failed` marker detected.

## 7) Staging Deploy (VPS localhost-first)
- Staging updated to pull from GitHub origin (was incorrectly set to local path) and redeployed.
- Note: staging Grafana needed a non-conflicting host port (`VPS_GRAFANA_PORT=9101`) because production uses 9001 on the same VPS.
- Staging functional probe:
  - identical inquiry posted twice → `X-Inquiry-Deduped=true`, same `id`, status remains `new`.

## 8) Smoke Test
- Production:
  - localhost `/healthz` 200
  - localhost `/v1/meta` 200 (build_sha `4dbfbe68`)
  - localhost `/metrics` 200
  - public `/health` 200
  - public `/api/v1/meta` 200

## 9) Metric Evaluation (Contract)
- Runtime telemetry-dependent KPIs (conversion deltas, CRM webhook success %, SEO sessions, LCP/CLS/TTFB) require the 24h monitor window per metrics contract.
- Runtime-safe checks performed in this phase: error scan window (no 5xx/tracebacks) + determinism + observability pipeline health.

## 10) Production Deploy
- Deployed and verified on VPS production compose with OTEL enabled.
- Alembic state unchanged and consistent (`0020_v3_media_image_urls (head)`).

## 11) Monitor
- 180s post-deploy log observation window completed; no error spikes detected.

## Decision
- Phase 1 marked **PASS → Auto-Continue Eligible** (proceed to Phase 2 per phase-dependency).
