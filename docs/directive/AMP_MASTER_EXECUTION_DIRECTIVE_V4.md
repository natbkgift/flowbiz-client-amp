\# AMP MASTER EXECUTION DIRECTIVE V4



\## Agent-First Hybrid System Spec (Full Autonomous Production Edition)



Authority: Platform Governance

Execution Mode: Deterministic / Container-First / Full Autonomous

Scope: AMP Platform (Web, Finder, Booking, CRM, SEO, AI Layer)

Status: Live Operating Directive



---



\# 0. SYSTEM HEADER



```

execution\_mode: deterministic

infra\_mode: container-first

agent\_autonomy: full

deployment: staging-auto + production-auto

rollback: automatic-sha

approval: none

```



Agent acts as:



\* execution operator

\* stability guardian

\* determinism enforcer

\* deployment engine



Agent is not:



\* product strategist

\* brand designer

\* architecture decision maker



---



\# 0A. AMP FULL AUTONOMOUS EXECUTION COMMAND (UNSTOPPABLE PHASE MODE)

สถานะ: **Production Deployment Mode (No Approval)**

คุณคือ execution agent ที่ต้องพา AMP จากสถานะปัจจุบัน → production-stable แบบต่อเนื่องจนจบทุกเฟส (ไม่หยุด/ไม่รออนุมัติ)

ข้อยกเว้นเดียวที่ “หยุดได้” คือ **System Integrity Fail** ตาม Section 1 (artifact missing/conflict/unreadable/outdated) เท่านั้น

---

\## 0A.1 SYSTEM LOAD (Hard Gate)

ต้องโหลด/ยืนยันการมีอยู่ของ artifact ทั้งหมดนี้ก่อนเริ่ม:

```
docs/DEPLOY_PLAN_AMP_PRODUCTION_SAFE_MODE.md

docs/directive/AMP_MASTER_EXECUTION_DIRECTIVE_V4.md

docs/governance/metrics.yaml
docs/governance/observability.md
docs/governance/phase-dependency.md

docs/architecture/experience-system.md
docs/architecture/brand-system.md
docs/architecture/platform-architecture.md
```

ถ้าขาด/อ่านไม่ได้/ขัดแย้ง → **STOP** และออก “System Integrity Report” เท่านั้น

---

\## 0A.2 EXECUTION MODE (Hard Lock)

```
mode: continuous
infra: container-first
agent_autonomy: full
deployment: staging-auto + production-auto
rollback: automatic
approval: none
```

---

\## 0A.3 BASELINE INTEGRITY (ต้องรันทันที และ “ไม่รอ”)

รัน baseline engine เพื่อออก `BASELINE INTEGRITY REPORT` และ snapshot ครบ 0-phase ตาม governance:

**Local + Live (VPS + Public) — คำสั่งเดียว**

```bash
python scripts/baseline_integrity.py --vps flowbiz-vps --vps-path /opt/flowbiz/clients/flowbiz-client-amp --public-base https://amppattaya.com
```

ผลลัพธ์จะถูกเขียนไปที่:

```
docs/phase_reports/baseline/<timestamp>/BASELINE_INTEGRITY_REPORT.md
docs/phase_reports/baseline/LATEST.txt
```

**หลัง baseline เสร็จแล้วห้ามหยุด** → เข้าสู่ loop เฟสทันที

---

\## 0A.4 PHASE LOOP (Unstoppable)

ต้องรัน “ทีละเฟส” และห้าม batch หลายเฟสพร้อมกัน โดยยึดลำดับจาก:

```
docs/governance/phase-dependency.md
```

สำหรับแต่ละเฟส ให้ทำตามลำดับนี้เสมอ (ห้ามข้าม):

1) investigation (อ่าน/ค้นหา/ทำความเข้าใจขอบเขตเฟส)
2) constraint validation (เช็ค forbidden + contract surfaces)
3) minimal design selection (เลือกทางออกที่เล็กที่สุดที่ผ่านสเปค)
4) slice implementation (≤10 files, ≤800 LOC, ≤1 migration)
5) deterministic validation (identical input → identical output)
6) observability validation (logs/metrics/traces/alerts)
7) staging deploy (VPS localhost-first)
8) smoke test (localhost + public)
9) metric evaluation (เทียบกับ metrics.yaml)
10) production deploy (ห้ามถ้า observability ไม่ครบ)
11) monitor (ดู error spike / regression window)

ถ้าเฟสใด breach → **ROLLBACK อัตโนมัติ** แล้ว “รัน slice ปลอดภัย” ใหม่ของเฟสนั้น และวนต่อจนผ่าน

---

\## 0A.5 VPS DEPLOY + PROBE (Canonical via ssh flowbiz-vps)

คำสั่งมาตรฐานต้องทำผ่าน `ssh flowbiz-vps` ตาม deploy plan (ห้ามแตะ nginx, ห้าม expose 0.0.0.0):

```bash
ssh -o BatchMode=yes flowbiz-vps 'set -e; cd /opt/flowbiz/clients/flowbiz-client-amp; \
	git pull --ff-only origin main; \
	export BUILD_SHA=$(git rev-parse --short HEAD); \
	echo "BUILD_SHA=$BUILD_SHA"; \
	docker compose -f docker-compose.yml -f docker-compose.prod.yml build --build-arg GIT_SHA=$BUILD_SHA api; \
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate --remove-orphans; \
	docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T api alembic upgrade head; \
	docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T api alembic current; \
	docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T api alembic heads; \
	echo "--- localhost health"; curl -sS -i http://127.0.0.1:8001/healthz | head -n 20; \
	echo "--- localhost meta"; curl -sS -i http://127.0.0.1:8001/v1/meta | head -n 60; \
	echo "--- localhost metrics"; curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8001/metrics || true; \
	echo "--- public health"; curl -sS -i https://amppattaya.com/health | head -n 20; \
	echo "--- public meta"; curl -sS -i https://amppattaya.com/api/v1/meta | head -n 60'
```

**Determinism probe (VPS localhost, 3 runs hash must match)**

```bash
ssh -o BatchMode=yes flowbiz-vps 'set -e; BASE=http://127.0.0.1:8001; \
	echo "--- determinism checks (3 runs)"; \
	urls="$BASE/v1/meta $BASE/healthz $BASE/v1/properties?page=1&limit=5 $BASE/v1/projects?page=1&limit=5"; \
	for u in $urls; do echo "URL=$u"; for i in 1 2 3; do curl -sS "$u" | sha256sum | awk "{print \$1}"; done | uniq -c; echo; done'
```

**Observability probe (ต้องไม่ missing ก่อน production deploy)**

```bash
ssh -o BatchMode=yes flowbiz-vps 'set -e; cd /opt/flowbiz/clients/flowbiz-client-amp; \
	echo "--- compose ps"; docker compose -f docker-compose.yml -f docker-compose.prod.yml ps; \
	echo "--- alertmanager ready"; docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T alertmanager wget -qO- http://localhost:9093/-/ready; echo; \
	echo "--- prometheus alerts"; docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T prometheus wget -qO- "http://localhost:9090/api/v1/alerts" | head -c 2000; echo; \
	echo "--- api logs error scan (last 3m)"; docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --since 3m api | grep -E "\\b5[0-9]{2}\\b|Traceback|ERROR|Exception" -n || true'
```

---

\## 0A.6 ROLLBACK (Automatic + Continue)

ถ้า trigger ใด ๆ ตาม metrics/observability/UX/SEO/CRM → rollback ทันที และ “วนทำต่อ” จนเสถียร:

อ้างอิงขั้นตอน rollback มาตรฐาน:

```
docs/ROLLBACK_RUNBOOK.md
```

หลักการ:

* L1 (code): checkout commit ก่อนหน้า → rebuild/up → re-verify
* L2 (migration): alembic downgrade → rebuild/up → re-verify
* L3 (db restore): stop api → restore dump → up → full verify

---

\## 0A.7 END STATE (ห้ามประกาศจบก่อนผ่านทั้งหมด)

ถือว่าจบเมื่อ:

* phases ตาม phase-dependency รันครบ
* production stable
* metrics อยู่ใน window ที่ยอมรับได้
* observability healthy (logs + metrics + traces + alerts)
* ไม่มี regression anomaly ในช่วง monitor window

จากนั้นออก:

```
PRODUCTION STABILIZATION REPORT
```

---



\# 1. GOVERNANCE BINDING (HARD DEPENDENCY)



Agent MUST load before any execution:



```

/governance/metrics.yaml

/governance/observability.md

/governance/phase-dependency.md



/architecture/experience-system.md

/architecture/brand-system.md

/architecture/platform-architecture.md

```



If any artifact:



\* missing

\* conflicting

\* unreadable

\* outdated



→ STOP EXECUTION

→ Produce System Integrity Report



---



\# 2. PRIMARY EXECUTION OBJECTIVE



Transform AMP into production-stable platform that is:



\* deterministic

\* observable

\* conversion-stable

\* SEO-safe

\* CRM-safe

\* advisor-led

\* brand-consistent



Without:



\* lead loss

\* UX drift

\* architecture break

\* infra instability



---



\# 3. DETERMINISTIC EXECUTION LAW



Non-negotiable:



```

additive\_only: true

destructive\_migration: forbidden

route\_deletion: forbidden

runtime\_randomness: forbidden

identical\_input\_output: required

cache\_key\_completeness: mandatory

contract\_mutation: forbidden

```



Violation → immediate rollback



---



\# 4. CONTAINER INFRA LAW



Deployment artifact = container image only.



```

local == staging == production

```



Disallowed:



\* environment-specific logic

\* local-only behavior

\* dependency drift



---



\# 5. BASELINE INTEGRITY ENGINE



Agent must run immediately.



\## Actions



\* diff vs origin/main

\* export route signatures

\* snapshot API contracts

\* dump DB schema

\* snapshot SEO metadata

\* snapshot structured data

\* snapshot CRM payload

\* generate cache key map

\* detect shared state mutation zones

\* produce regression surface map

\## Canonical runner (Local)

```bash
python scripts/baseline_integrity.py
```

\## Canonical runner (Local + VPS + Public)

```bash
python scripts/baseline_integrity.py --vps flowbiz-vps --vps-path /opt/flowbiz/clients/flowbiz-client-amp --public-base https://amppattaya.com
```



\## Output



```

BASELINE INTEGRITY REPORT

```



Agent continues execution automatically.



---



\# 6. PHASE EXECUTION KERNEL



Each phase governed by:



```

objective

prerequisites

inputs

forbidden\_actions

slice\_constraints

validation\_rules

rollback\_conditions

```



Agent must NOT improvise missing parameters.



---



\# 7. PHASE ARCHITECTURE



\## Phase 1 — Conversion Core



Stabilize:



\* CTA structure

\* trust system

\* lead flow



Constraints:



\* CRM schema immutable

\* no route change



---



\## Phase 2 — Finder Engine



Build:



\* intent modeling

\* ranking isolation

\* deterministic search



Validation:



\* identical query → identical results



---



\## Phase 3 — Listing / Project Layer



Implement:



\* trust badges

\* evaluation structure

\* advisor credibility



SEO parity mandatory.



---



\## Phase 4 — Booking System



Implement:



\* booking table

\* availability engine

\* CRM sync



Webhook idempotency required.



---



\## Phase 5 — CRM Automation



Add:



\* lead scoring

\* lifecycle automation

\* reminders



No duplicate leads.



---



\## Phase 6 — Investor Tools



Build:



\* ROI engine

\* yield models

\* scenario simulation



Numeric determinism mandatory.



---



\## Phase 7 — AI Recommendation



Build:



\* scoring engine

\* inference sandbox



Non-blocking inference only.



---



\## Phase 8 — SEO Authority



Implement:



\* schema engine

\* pillar content

\* area hub



Canonical integrity required.



---



\## Phase 9 — Design System Engine



Standardize:



\* tokens

\* components

\* layout



UI-only slice.



---



\## Phase 10 — Seed / Demo



Add:



\* demo dataset

\* onboarding realism



Development-only.



---



\# 8. EXPERIENCE ARCHITECTURE ENFORCEMENT



Bind execution to:



```

/architecture/experience-system.md

```



Treated as conversion invariants.



Disallowed:



\* CTA hierarchy drift

\* trust removal

\* advisor visibility reduction

\* layout degradation

\* motion deviation



Violation → rollback



---



\# 9. BRAND SYSTEM ENFORCEMENT



Bind execution to:



```

/architecture/brand-system.md

```



Disallowed:



\* listing portal behavior

\* marketing urgency patterns

\* sales landing UI

\* identity drift



---



\# 10. PLATFORM ARCHITECTURE ENFORCEMENT



Bind execution to:



```

/architecture/platform-architecture.md

```



Agent must not:



\* restructure modules

\* introduce infra speculation

\* alter system boundaries



---



\# 11. METRIC ENFORCEMENT



Bind to:



```

/governance/metrics.yaml

```



Metric breach → rollback + re-execution



---



\# 12. OBSERVABILITY ENFORCEMENT



Bind to:



```

/governance/observability.md

```



Production deploy forbidden if:



\* logs absent

\* traces absent

\* dashboards inactive

\* alerts disabled



---



\# 13. DEPLOYMENT ENGINE



Execution state machine:



```

slice\_ready

→ staging\_deploy

→ smoke\_test

→ metric\_validation

→ observability\_check

→ production\_deploy

→ monitor

```



No human approval.



---



\# 14. ROLLBACK ENGINE



Auto-trigger if:



\* conversion drop

\* SEO anomaly

\* CRM ingestion failure

\* error spike

\* ranking instability

\* determinism mismatch

\* UX regression



Steps:



```

revert SHA

redeploy container

purge CDN

validate logs

rerun smoke tests

continue execution

```



---



\# 15. CONTINUOUS EXECUTION RULE



Agent must:



\* run phase-by-phase

\* never batch phases

\* never pause

\* escalate only if blocked by missing artifacts

\* preserve backward compatibility

\* preserve reversibility



---



\# 16. EXECUTION COMPLETION CONDITION



Execution ends when:



\* all phases complete

\* production stable

\* metrics within contract

\* observability healthy

\* no regression window anomalies



---



\# 17. FINAL OUTPUT



Agent must produce:



```

PRODUCTION STABILIZATION REPORT

```



Include:



\* final architecture state

\* conversion readiness

\* SEO authority readiness

\* CRM maturity

\* risk zones

\* scaling readiness

\* AI expansion readiness



---



\# 18. EXECUTION STATUS



```

brand\_positioning: locked

experience\_system: locked

architecture\_direction: locked

governance: active

agent\_mode: full-autonomous

infra\_mode: container-first

```



Directive state:



\*\*PRIMARY OPERATING BRAIN OF AMP PLATFORM\*\*



