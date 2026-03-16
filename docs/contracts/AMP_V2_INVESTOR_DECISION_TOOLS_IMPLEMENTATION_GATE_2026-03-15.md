# AMP V2 Investor Decision Tools Implementation Gate

Date: 2026-03-15

Governance lock:
`93537fcc` on `main`

## Purpose

This document opens the Sprint 2 implementation gate for Investor Decision Tools Expansion after completion of the Shortlist UX Integration track.

This gate activates Investor Decision Tools implementation only.

It does not reopen V1, CRM, lead forms, core layout, homepage ownership, or advisory funnel ownership.

## Gate Status

`Sprint 2 Investor Decision Tools implementation gate: partially open`

Meaning:

- Shortlist UX Integration is complete and no longer the active implementation track
- Investor Decision Tools Expansion is now the active Sprint 2 implementation track
- implementation must proceed slice-by-slice in the order defined below
- no later slice may begin before the prior slice is merged and validated

Top-line reporting remains:

- `V1 closed / production-ready`
- `V2 roadmap only`

## 1. Module Objective

Implement an additive investor decision-support layer that helps users compare governed public signals drawn from existing Search, Shortlist, Estimator, and Market Intelligence foundations.

Approved gate outcome for this stage:

1. improve decision framing across shortlist, compare, area, and snapshot surfaces without introducing recommendation behavior
2. expose comparative and explanatory decision-support signals only where the current public-safe contracts already exist
3. preserve the current advisory path while making pre-contact decision context clearer
4. keep all decision-support output descriptive, comparative, and advisory-safe

## 2. Advisory-Safe Decision-Support Boundaries

This module is permitted to help users interpret public-safe trade-offs.

This module is not permitted to recommend an investment action.

Approved boundaries:

1. all copy must remain descriptive, comparative, and advisory-safe
2. the module may compare signals, explain assumptions, and summarize visible trade-offs
3. the module may reuse already approved public-safe estimator context and market or project snapshot signals
4. the module may guide users toward advisor review as the escalation path only

Not allowed in this gate:

1. investment recommendation language
2. forecast language
3. guarantee language
4. advisor-only data exposure
5. hidden ranking logic presented as certainty
6. CRM workflow branching or conversion ownership changes

Boundary conclusion:

- Investor Decision Tools is a public decision-support layer, not an advisor-only intelligence surface or recommendation engine

## 3. Allowed Data Sources

This gate may use only already approved public-safe data and interaction surfaces.

Allowed source families:

1. public shortlist session state and approved shortlist review/share surfaces
2. compare surface inputs and project evaluation output already exposed on the public compare route
3. public-safe area and readiness signals from Market Intelligence surfaces
4. published investment snapshot fields already rendered on approved project/detail surfaces
5. public estimator context and query-state summaries already approved in Sprint 1 contracts

Source rules:

1. no new advisor-only source class may be introduced
2. no internal CRM, lead-routing, or assignment data may be surfaced
3. no schema change is approved by this gate
4. if a slice cannot proceed without a schema change, implementation must stop and return to governance review

## 4. Guardrail Verification

The following guardrails remain non-negotiable during this gate:

1. V1 pages untouched
2. CRM untouched
3. lead forms untouched
4. core layout untouched
5. homepage untouched
6. advisory funnel untouched
7. additive-only implementation strategy
8. one issue, one branch, one PR per slice
9. merge only after required CI checks pass
10. each PR must include Scope, Why now, Files touched, Guardrail check, Validation, Risk, and Rollback

Stop conditions:

1. guardrail violation detected
2. schema change required
3. CRM surface affected

## 5. Implementation Slices

Allowed execution order:

1. Shortlist → Compare Surface
2. Area Comparison Surface
3. Investment Snapshot Explanation Blocks
4. Decision Support Summary Layer

No later slice may begin until the prior slice is merged and validated.

### Slice 1: Shortlist → Compare Surface

Allowed scope:

1. connect approved shortlist review behavior into the existing compare surface using current public-safe route ownership only
2. help users move from shortlist review into governed compare context without inventing a new compare owner
3. keep the flow descriptive and comparative only

Blocked within Slice 1:

1. no schema changes to shortlist or compare contracts
2. no recommendation scoring language
3. no CRM or advisor workflow redesign

### Slice 2: Area Comparison Surface

Allowed scope:

1. expose additive area comparison surfaces using public-safe Market Intelligence evidence only
2. compare areas descriptively without projecting future performance or certainty

### Slice 3: Investment Snapshot Explanation Blocks

Allowed scope:

1. add explanatory interpretation blocks around published investment snapshot signals
2. make source and limitation framing easier to read without changing the underlying snapshot owner

### Slice 4: Decision Support Summary Layer

Allowed scope:

1. add a final summary layer that restates visible trade-offs across the approved decision-support surfaces
2. keep the summary comparative, descriptive, and advisory-safe
3. preserve advisor escalation as a distinct next step rather than a recommendation outcome

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

This gate remains valid only while the approved slices execute in order and remain inside the public-safe decision-support boundary.

If scope expands beyond the ordered slices, requires schema change, touches CRM ownership, or introduces recommendation/forecast/guarantee behavior, implementation must stop and return to governance review.