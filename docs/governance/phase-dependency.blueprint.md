# PHASE DEPENDENCY MATRIX — BLUEPRINT (DOCS)

Version: 1.0

Authority: docs/blueprint/README.md

Scope: Blueprint execution phases defined in `docs/governance/phases.yaml` (id: `blueprint_v1`).

Rule: Complete each phase before starting the next. Never skip Phase 0.

---

## Global Rules

- Do not start a phase if prerequisites are incomplete.
- Do not execute phases in parallel.
- If any deterministic/CI/QA gate fails → halt slice, fix or rollback.

---

## Phase 0 — Strategic Foundation

Prerequisites: None.

Required outputs:
- Phase 0 lock decision recorded (at minimum: approved target segments, language priorities, KPIs).

Blocks: All other phases.

---

## Phase 1 — Information Architecture

Prerequisites:
- Phase 0 locked.

Required outputs:
- Sitemap + URL structure aligned to blueprint.
- Index matrix + sitemap strategy aligned to blueprint.

Blocks: Phases 2–6.

---

## Phase 2 — Data Architecture

Prerequisites:
- Phase 1 completed.

Required outputs:
- Database schema + property type standard + product template spec consistent.

Blocks: Phases 3–6.

---

## Phase 3 — SEO & Linking Layer

Prerequisites:
- Phase 1 completed.
- Phase 2 completed where schema/template references are required.

Required outputs:
- Internal linking rules + schema markup plan + crawl optimization plan aligned to blueprint.

Blocks: Phases 4–6.

---

## Phase 4 — Conversion & Funnel Layer

Prerequisites:
- Phase 2 completed (templates exist).
- Phase 3 completed (internal linking + structure stable).

Required outputs:
- Funnel design + CTA standard implemented and verified.

Blocks: Phases 5–6.

---

## Phase 5 — Data Population Plan

Prerequisites:
- Phase 2 completed.
- Phase 4 completed where forms/tracking depend on content structure.

Required outputs:
- Data import sequence + content standard ready for execution.

Blocks: Phase 6.

---

## Phase 6 — QA & Release Control

Prerequisites:
- Phases 0–5 completed.

Required outputs:
- QA checklist passed for applicable scope.
- Release protocol followed (branch/PR workflow + deterministic governance gates).
