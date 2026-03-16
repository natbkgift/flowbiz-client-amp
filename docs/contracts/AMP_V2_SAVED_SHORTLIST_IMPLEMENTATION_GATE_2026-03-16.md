# AMP V2 Saved Shortlist Implementation Gate

Date: 2026-03-16

Governance lock:
`73426012` on `main`

## Purpose

This document opens the next implementation gate after completion of the Buying Cost Estimator.

This gate activates Saved Shortlist continuity work only.

It does not reopen search, CRM, lead forms, homepage ownership, core layout, `/buy` ownership, or advisory funnel ownership.

## Gate Status

`Saved Shortlist implementation gate: partially open`

Meaning:

- Buying Cost Estimator is complete and no longer the active implementation track
- Saved Shortlist is now the active implementation track
- implementation must proceed slice-by-slice in the order defined below
- no later slice may begin before the prior slice is merged and validated

Top-line reporting remains:

- `V1 closed / production-ready`
- `V2 roadmap only`

## 1. Hard-Stop Assessment

Hard-stop review was completed before opening this gate.

Assessment result:

1. search remains blocked because its first approved owner route still sits too close to the protected `/buy` advisory-funnel boundary
2. lead automation maturity remains blocked because CRM direction is not approved for implementation
3. Saved Shortlist continuity can proceed additively because shortlist persistence, API, and public UX foundations are already merged on `main`
4. the next safe step is to formalize shortlist ownership continuity without activating auth, CRM, or workspace behavior

Selection conclusion:

- Saved Shortlist is the strongest remaining additive module that can proceed now under the current hard-stop policy
- the smallest safe first step is owner-reference abstraction, because the backend already supports `session | user` ownership while the public client remains session-first

## 2. Module Objective

Extend the current shortlist foundation into a more explicit continuity layer that can bridge today's session-first public UX into future saved-shortlist capability without reopening auth, CRM, or advisory-owned surfaces.

Approved gate outcome for this stage:

1. lock shortlist owner reference behavior explicitly
2. preserve current session-first behavior while preparing future user-bound continuity safely
3. keep shortlist metadata and continuity logic additive and public-safe
4. avoid any premature workspace, CRM, or collaboration behavior

## 3. Saved Shortlist Boundaries

This module is permitted to strengthen shortlist continuity and ownership contracts.

This module is not permitted to introduce auth, CRM, or collaboration scope.

Approved boundaries:

1. session-first public shortlist behavior must continue to work throughout the gate
2. owner reference may support `session | user` as a contract, but user-bound activation must remain blocked until auth approval exists
3. shortlist continuity may not become a CRM lifecycle or advisor-assignment channel
4. save/share continuity must remain distinct from contact/advisor handoff payloads

Not allowed in this gate:

1. auth implementation
2. cross-device user shortlist activation
3. CRM creation, assignment, or follow-up automation
4. collaboration, deal-room, or document-vault behavior
5. homepage, core layout, `/buy`, or advisory funnel changes
6. search route ownership work

Boundary conclusion:

- Saved Shortlist is a governed continuity layer, not an auth feature, CRM workflow, or workspace product

## 4. Allowed Sources And Dependencies

This gate may use only already approved public-safe sources and contracts.

Allowed source families:

1. `docs/contracts/AMP_V2_SHORTLIST_DATA_MODEL_DRAFT.md`
2. `docs/contracts/AMP_V2_BACKLOG_4_SPRINTS_2026-03-15.md`
3. `docs/contracts/AMP_V2_SHORTLIST_UX_COMPLETION_REPORT_2026-03-15.md`
4. existing shortlist API foundation in `apps/api/routes/v1/shortlists.py`
5. existing shortlist client and public UX surfaces already merged on `main`

Source rules:

1. no auth-only or CRM-only source class may be surfaced publicly
2. no new schema-backed CRM coupling is approved by this gate
3. if a slice cannot proceed without auth, CRM, or advisory-funnel ownership change, implementation must stop and return to governance review

## 5. Guardrail Verification

The following guardrails remain non-negotiable during this gate:

1. V1 pages untouched
2. CRM untouched
3. lead forms untouched
4. core layout untouched
5. homepage untouched
6. advisory funnel untouched
7. `/buy` owner surface untouched
8. additive-only implementation strategy
9. one issue, one branch, one PR per slice
10. merge only after required CI checks pass
11. each PR must include Scope, Why now, Files touched, Guardrail check, Validation, Risk, and Rollback

Stop conditions:

1. guardrail violation detected
2. auth implementation becomes required
3. CRM or lead-form surface becomes affected
4. workspace or collaboration scope is required to complete the slice
5. route ownership expands into homepage, `/buy`, search, or advisory funnel surfaces

## 6. Implementation Slices

Allowed execution order:

1. Owner Reference Abstraction
2. Cache And Metadata Continuity Contract
3. Session Continuity Hardening
4. User-Promotion Preparation Layer

No later slice may begin until the prior slice is merged and validated.

### Slice 1: Owner Reference Abstraction

Allowed scope:

1. formalize shortlist owner reference as an explicit frontend contract
2. preserve current session-first runtime behavior
3. normalize legacy owner-key storage into the new owner reference shape
4. add targeted regression coverage for owner reference migration and reuse

Blocked within Slice 1:

1. no auth implementation
2. no user-bound shortlist activation
3. no CRM, compare, or contact-flow expansion
4. no shortlist metadata expansion beyond owner-reference needs

### Slice 2: Cache And Metadata Continuity Contract

Allowed scope:

1. tighten shortlist cache and metadata continuity around title, intent, and source context
2. keep public shortlist UX state synchronized without changing route ownership

### Slice 3: Session Continuity Hardening

Allowed scope:

1. strengthen shortlist continuity under session refresh and rehydration conditions
2. add targeted regression coverage for continuity edge cases

### Slice 4: User-Promotion Preparation Layer

Allowed scope:

1. add non-auth runtime hooks or contract helpers needed for future user-bound shortlist promotion
2. keep user activation blocked while making the promotion boundary explicit and testable

## PR Format Requirement

Every PR under this gate must include these sections:

1. Scope
2. Why now
3. Files touched
4. Guardrail check
5. Validation
6. Risk
7. Rollback

## Validation Requirement

Every implementation PR under this gate must run:

1. `npm --prefix admin-app run build`
2. `npm --prefix admin-app run test -- <affected_test_files>`
3. if auth, routing, or admin shell changes are included, `npm --prefix admin-app run test:smoke:admin`
4. `git diff --check`
5. required GitHub checks must pass before merge, including `CI Governance Gates` and `Admin Smoke E2E` when applicable

## Exit Rule For This Stage

This gate remains valid only while the approved slices execute in order and remain inside shortlist continuity, owner-reference, cache, and promotion-preparation boundaries.

If scope expands into auth, CRM, search, `/buy`, homepage, or advisory-funnel ownership, implementation must stop and return to governance review.