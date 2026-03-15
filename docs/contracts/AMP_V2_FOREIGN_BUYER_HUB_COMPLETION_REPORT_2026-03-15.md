# AMP V2 Foreign Buyer Hub Completion Report

Date: 2026-03-15

Report scope:

- completed Sprint 2 Foreign Buyer Hub implementation slices
- route ownership confirmation
- guardrail verification
- validation summary
- remaining out-of-scope features
- advisory funnel impact
- recommendation for the next Sprint 2 governance gate

Execution status:

- Foreign Buyer Hub implementation completed for the currently unlocked Sprint 2 slice chain
- no new implementation started after the final FAQ / clarification slice merged
- this report is created as a governance handoff artifact only

## Executive Summary

Sprint 2 Foreign Buyer Hub execution completed the four approved implementation slices under the active partial gate and kept all protected surfaces unchanged.

Execution outcome:

1. the hub was delivered as an additive extension on the existing public runtime route owner
2. ownership, process, document guidance, and FAQ clarification modules were merged one slice at a time
3. every slice kept the existing contact/advisor path and did not create a new funnel or form
4. every PR merged only after local validation and green required CI checks
5. execution is now intentionally paused pending governance selection of the next Sprint 2 scope

## 1. Implemented Modules

The completed Foreign Buyer Hub slice chain is:

| Slice | Issue | PR | Outcome |
| --- | --- | --- | --- |
| Ownership / eligibility basics | `#453` | `#454` | launched additive `/foreign-buyer-hub` route family with conservative ownership and eligibility guidance |
| Buying process module | `#455` | `#456` | added advisory-safe process roadmap and stage explanations |
| Document guidance module | `#457` | `#458` | added document-category guidance, case-specific reminders, and non-legal framing |
| FAQ / clarification module | `#459` | `#460` | added short Q/A clarification blocks for common foreign-buyer concerns |

Implemented runtime surface:

- `/en/foreign-buyer-hub`
- `/th/foreign-buyer-hub`

Delivered module set now includes:

1. ownership and eligibility basics
2. buying process module
3. document guidance module
4. FAQ / clarification module
5. legal review trigger guidance
6. existing advisor/contact CTA and published-projects CTA

## 2. Route Ownership Confirmation

Route ownership remains unchanged from the approved implementation direction.

Confirmed owner:

- `apps/api/routes/v1/home_runtime.py`

Confirmed route pattern:

- the hub remains owned by the existing public runtime HTML route family
- no ownership was moved into admin, CRM, frontend app shell, or a new API/controller surface
- the localized route handlers remain the same additive owner:
  - `/en/foreign-buyer-hub`
  - `/th/foreign-buyer-hub`

Ownership conclusion:

- the completed Sprint 2 hub work extended one existing route owner in place and did not fragment ownership across multiple systems

## 3. Guardrail Verification

Execution was checked against the active Sprint 2 gate and architecture guardrails.

Verified guardrails:

1. additive-only implementation strategy maintained throughout
2. one issue, one branch, and one PR used per slice
3. merge occurred only after required CI checks passed
4. V1 pages remained untouched
5. CRM remained untouched
6. lead forms remained untouched
7. core layout remained untouched
8. homepage and advisory funnel ownership remained untouched
9. Market Intelligence remained blocked and unimplemented
10. no calculator or investor-tool expansion was bundled into hub work
11. no shortlist UI integration was bundled into hub work

Guardrail conclusion:

- the full hub slice chain completed without reopening any protected V1 or ops-owned surface

## 4. Validation Summary

Validation pattern used for each runtime slice:

1. targeted hub runtime test
2. focused regression tests for nearby public information routes
3. `ruff` on touched Python files
4. `git diff --check`
5. required GitHub CI checks before merge

Local validation commands used in the implementation chain:

- `d:/FlowBiz/flowbiz-client-amp/.venv/Scripts/python.exe -m pytest -q tests/test_a12_foreign_buyer_hub_runtime.py`
- `d:/FlowBiz/flowbiz-client-amp/.venv/Scripts/python.exe -m pytest -q tests/test_a10_contact_about_sell_runtime.py tests/test_a11_smart_finder_compare_runtime.py`
- `d:/FlowBiz/flowbiz-client-amp/.venv/Scripts/python.exe -m ruff check apps/api/routes/v1/home_runtime.py tests/test_a12_foreign_buyer_hub_runtime.py`
- `git diff --check`

Per-PR required checks:

- `CI Governance Gates`
- `Admin Smoke E2E`

Validation outcome:

- all four Foreign Buyer Hub PRs merged with green required checks
- targeted route coverage now includes ownership, process, document guidance, and FAQ clarification content

## 5. Remaining Out-Of-Scope Features

The completed hub does not implement the following features and does not reopen them implicitly:

1. calculators or dynamic investor tooling inside the hub
2. legal instructions or case-specific legal conclusions
3. document upload, vault, or workspace behavior
4. CRM integration or CRM workflow branching
5. shortlist interaction inside the hub surface
6. Market Intelligence public implementation
7. homepage or advisory funnel redesign
8. new lead forms or follow-up automation
9. advisor-only pricing, negotiation, or transaction strategy guidance

Scope conclusion:

- the current hub is an advisory-safe information surface, not a transaction workspace or investor decision engine

## 6. Impact On Advisory Funnel

The completed work did not change advisory funnel ownership.

Observed funnel impact:

1. the hub reuses the existing contact/advisor path only
2. the CTA remains a conservative escalation path rather than a new conversion flow
3. no new form was introduced
4. no CRM-side lifecycle or assignment behavior was added
5. no funnel branching, routing logic, or automation was introduced

Practical effect:

- the hub increases pre-contact clarity for foreign buyers while leaving the current advisory funnel intact

## 7. Recommendation For Next Sprint 2 Scope

Execution should now stop until governance selects the next gate candidate.

### Option A: Market Intelligence Public Module

Assessment:

- strongest fit for the next Sprint 2 gate
- already has a dedicated planning artifact in `docs/contracts/AMP_V2_MARKET_INTELLIGENCE_PUBLIC_MODULE_PLAN.md`
- remains additive and can be shaped as a public authority surface without changing the advisory funnel owner
- benefits from the same conservative public-information pattern used successfully in the Foreign Buyer Hub

Advantages:

1. aligns cleanly with remaining Sprint 2 roadmap intent
2. can strengthen authority SEO and public trust without reopening CRM or V1 pages
3. has clearer public-safe boundaries than shortlist UX or investor-tool expansion

Risks:

1. freshness and confidence governance must be explicit before implementation
2. public-safe vs advisor-only data boundaries must be locked first

Recommendation status:

- recommended as the next Sprint 2 governance candidate

### Option B: Shortlist UX Integration Surface

Assessment:

- viable, but not the best next gate candidate
- persistence and core shortlist foundation already exist, but UX integration would touch more user-interaction surfaces and reuse decisions than the completed hub work
- compare/listing-card reuse, auth/session direction, and advisor handoff boundaries would need tighter governance before public rollout

Advantages:

1. builds directly on already completed shortlist backend foundation
2. could create a stronger bridge from discovery to later workspace capability

Risks:

1. higher chance of scope creep into compare, auth, share governance, and advisor handoff behavior
2. more interaction-heavy than the just-completed content-led hub slice chain
3. easier to accidentally blur public UX scope with CRM or workspace expectations

Recommendation status:

- keep as a candidate after the next governance step, but not first

### Option C: Investor Decision-Support Tools Expansion

Assessment:

- lowest priority for the next immediate gate
- this option is strategically useful, but it is broader and more expansion-prone than either Market Intelligence or shortlist UX
- it would likely reopen estimator/tooling questions, disclosure language, and cross-surface placement decisions together

Advantages:

1. supports buyer and investor decision quality
2. can eventually complement search, hub, and estimator foundations

Risks:

1. broadest scope of the three options
2. higher risk of touching multiple public surfaces at once
3. easier to mix calculator behavior, methodology, and advisory escalation into one oversized gate

Recommendation status:

- defer until after a narrower next gate completes

### Recommended Order

1. Option A: Market Intelligence Public Module
2. Option B: Shortlist UX integration surface
3. Option C: Investor decision-support tools expansion

Rationale for recommended order:

- Option A has the cleanest additive execution boundary for Sprint 2, the strongest planning artifact, and the lowest pressure on protected interaction surfaces
- Option B should follow once governance is ready to approve public shortlist interaction boundaries
- Option C should wait until narrower public information and shortlist surfaces are locked first

## Hold State

Execution is intentionally paused after this report.

Repository state at report authoring start:

- branch: `main`
- working tree: clean
- HEAD before report commit: `a05d6dea`

Next required action:

- wait for governance decision before implementing any new Sprint 2 module