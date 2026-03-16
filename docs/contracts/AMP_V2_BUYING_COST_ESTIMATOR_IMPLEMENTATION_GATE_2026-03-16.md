# AMP V2 Buying Cost Estimator Implementation Gate

Date: 2026-03-16

Governance lock:
`main`

## Purpose

This document opens the next implementation gate after completion of Investor Decision Tools Expansion.

This gate activates Buying Cost Estimator implementation only.

It does not reopen V1, CRM, lead forms, core layout, homepage ownership, `/buy` ownership, or advisory funnel ownership.

## Gate Status

`Buying Cost Estimator implementation gate: partially open`

Meaning:

- Investor Decision Tools Expansion is complete and no longer the active implementation track
- Buying Cost Estimator is now the active implementation track
- implementation must proceed slice-by-slice in the order defined below
- no later slice may begin before the prior slice is merged and validated

Top-line reporting remains:

- `V1 closed / production-ready`
- `V2 roadmap only`

## 1. Hard-Stop Assessment

Hard-stop review was completed before opening this gate.

Assessment result:

1. no hard stop is triggered by opening the estimator track
2. the approved route owner is `admin-app/app/(site)/[locale]/buying-cost-estimator/page.tsx`
3. the route owner is additive and separate from the protected `/buy` owner surface
4. the approved contracts explicitly reject homepage, global-nav, calculator-replacement, contact-owner, and `/buy`-owner rewrites
5. the current gate does not approve schema changes, CRM changes, lead-form changes, or advisory funnel redesign

Selection conclusion:

- Search remains deferred because the first approved search-results owner route lives inside `/[locale]/buy`, which is currently too close to the protected advisory-funnel boundary under the active hard-stop policy
- Buying Cost Estimator is the smallest approved high-value module that can proceed additively without that route-ownership conflict

## 2. Module Objective

Implement an additive public buyer tool that estimates governed deterministic purchase costs and clarifies unresolved items before advisor escalation.

Approved gate outcome for this stage:

1. launch a dedicated estimator route separate from the current yield calculator
2. keep estimator behavior conservative, assumption-led, and advisory-safe
3. separate deterministic totals from unresolved or case-specific items
4. preserve the existing advisor escalation path without changing contact or CRM ownership

## 3. Advisory-Safe Estimator Boundaries

This module is permitted to estimate governed deterministic cost components.

This module is not permitted to claim legal certainty or hide unresolved items.

Approved boundaries:

1. all copy must remain conservative, assumption-led, and advisory-safe
2. deterministic totals may include only approved fixed or editable assumptions
3. unresolved items must remain visible outside deterministic totals
4. the module may guide users toward advisor review as the escalation path only

Not allowed in this gate:

1. legal certainty claims
2. recommendation or guarantee language
3. hidden fee assumptions
4. CRM workflow branching or conversion ownership changes
5. global navigation, homepage, calculator replacement, or `/buy` route ownership changes
6. schema changes without separate governance approval

Boundary conclusion:

- Buying Cost Estimator is a public estimation surface, not a legal engine, CRM workflow owner, or advisory funnel rewrite

## 4. Allowed Sources And Dependencies

This gate may use only already approved public-safe sources and contracts.

Allowed source families:

1. estimator route and page ownership contract from `AMP_V2_ESTIMATOR_PAGE_PLAN_2026-03-15.md`
2. estimator UI contract from `AMP_V2_ESTIMATOR_UI_PLAN_2026-03-15.md`
3. formula authority and API boundary from `AMP_V2_ESTIMATOR_COST_FORMULA_ENGINE_PLAN_2026-03-15.md`
4. share-result route-state contract from `AMP_V2_ESTIMATOR_SHARE_RESULT_LINK_PLAN_2026-03-15.md`
5. existing public advisor/contact handoff conventions already used by calculator and compare

Source rules:

1. no advisor-only source class may be exposed publicly
2. no CRM, lead-routing, or assignment data may be introduced
3. no schema change is approved by this gate
4. if a slice cannot proceed without schema change or unresolved fee-policy authority, implementation must stop and return to governance review

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
2. schema change required
3. CRM or lead-form surface affected
4. unresolved fee-policy authority blocks deterministic output
5. route ownership expands into homepage, `/buy`, calculator replacement, or advisory funnel surfaces

## 6. Implementation Slices

Allowed execution order:

1. Route Owner And Page Shell
2. Estimator UI Contract Surface
3. Server-Authoritative Formula Engine
4. Share Result Reopen Flow
5. Advisor Handoff Context

No later slice may begin until the prior slice is merged and validated.

### Slice 1: Route Owner And Page Shell

Allowed scope:

1. implement the dedicated localized estimator route at `/[locale]/buying-cost-estimator`
2. deliver server-rendered page shell with localized title, subtitle, expectation-setting copy, and advisory-safe section structure
3. mount a focused client module placeholder without implementing deterministic calculation yet
4. keep route ownership, metadata, sitemap coverage, and page composition aligned to the approved page contract

Blocked within Slice 1:

1. no formula engine or hidden arithmetic in the UI
2. no share encoding or reopened result handling
3. no contact-flow payload changes
4. no navigation or homepage changes

### Slice 2: Estimator UI Contract Surface

Allowed scope:

1. implement the approved input and result layout contract as a focused client module
2. allow client-side validation and state handling only
3. keep deterministic result rendering placeholder-safe until the server formula boundary is active

### Slice 3: Server-Authoritative Formula Engine

Allowed scope:

1. implement the approved server-authoritative API boundary at `/api/tools/buying-cost`
2. place formula logic in shared backend code according to the contract
3. return deterministic totals, unresolved items, and assumption metadata separately

### Slice 4: Share Result Reopen Flow

Allowed scope:

1. serialize approved estimator state into the estimator route itself
2. reopen share state on the same route owner without contact-owner drift
3. preserve assumption-set identity and version where available

### Slice 5: Advisor Handoff Context

Allowed scope:

1. expose additive handoff into the existing contact flow
2. serialize only approved summary fields and unresolved items separately
3. preserve existing contact route ownership and lead form behavior

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
5. required GitHub checks must pass before merge, including `CI Governance Gates` and `Admin Smoke E2E`

## Exit Rule For This Stage

This gate remains valid only while the approved slices execute in order and remain inside the estimator route, formula, share, and handoff contracts already approved.

If scope expands beyond the ordered slices, requires schema change, touches CRM or lead-form ownership, or expands into `/buy`, homepage, calculator replacement, or advisory-funnel ownership, implementation must stop and return to governance review.