# AMP V2 Sprint 1 Implementation Gate

Date: 2026-03-15

Governance lock:
`027ef62f` on `origin/main`

Approval protocol:
`331773a7` on `origin/main`

## Purpose

This document converts the approved Sprint 1 planning set into an execution gate for Sprint 1 implementation.

It does not replace the approved planning documents.

It operationalizes them so the team can start implementation without reopening V1 or broadening V2 scope beyond the approved Sprint 1 contract.

## Gate Status

`Sprint 1 implementation gate: open`

This means implementation may begin for approved Sprint 1 issues only.

It does not mean:

- `V2` is shipped
- `V2` is production-ready
- Sprint 2 is active
- any V1 scope is reopened

Top-line reporting remains:

- `V1 closed / production-ready`
- `V2 roadmap only`

## Approved Planning Set

The following three documents are approved and remain the authoritative planning inputs for Sprint 1:

1. `docs/contracts/AMP_V2_SEARCH_SCOPE_BRIEF.md`
2. `docs/contracts/AMP_V2_BUYING_COST_ESTIMATOR_SCOPE.md`
3. `docs/contracts/AMP_V2_EPIC_TO_ISSUE_BREAKDOWN.md`

Non-negotiable guardrails remain in force:

- `docs/contracts/AMP_V2_ARCHITECTURE_GUARDRAILS.md`

Approval evidence:

- `#402`: `https://github.com/natbkgift/flowbiz-client-amp/issues/402#issuecomment-4061992788`
- `#403`: `https://github.com/natbkgift/flowbiz-client-amp/issues/403#issuecomment-4061992790`
- `#404`: `https://github.com/natbkgift/flowbiz-client-amp/issues/404#issuecomment-4061992800`

## Allowed Implementation Scope

Implementation may start only for Sprint 1 issues under these epics:

- `#402` Advanced Search Foundation
- `#403` Buying Cost Estimator
- `#404` V2 Architecture Preparation

Allowed child issues:

- `#405` Search API
- `#406` Search Filters UI
- `#407` Search Results Page
- `#408` Search Pagination
- `#409` Search Sorting
- `#410` Search URL State
- `#411` Search Analytics Contract
- `#412` Search SEO Rules
- `#413` Estimator UI
- `#414` Cost Formula Engine
- `#415` Estimator Page
- `#416` Share Result Link
- `#417` Fee Assumption Source
- `#418` Advisor Handoff Contract
- `#419` Data Model Review
- `#420` Search Index Strategy
- `#421` SEO Search Strategy
- `#422` Route Ownership Decision
- `#423` V2 Scope Boundary Check

No other V2 module is unlocked by this gate.

## Explicitly Blocked Scope

The following remain out of scope for Sprint 1 implementation:

- saved search
- AI recommendation or ML ranking
- compare-sync expansion beyond the approved advisor handoff contract
- CRM redesign or workflow changes
- V1 page redesign
- home IA changes
- core layout changes
- lead-form changes
- Sprint 2, Sprint 3, or Sprint 4 roadmap work

## Required Execution Order

Implementation should follow this gating order:

1. `#419` Data Model Review
2. `#420` Search Index Strategy
3. `#421` SEO Search Strategy
4. `#422` Route Ownership Decision
5. `#423` V2 Scope Boundary Check

After those are resolved, the next work may proceed:

- Search backend path: `#405`, `#408`, `#409`
- Search UI path: `#406`, `#407`, `#410`, `#411`, `#412`
- Estimator governance path: `#417`, `#418`

Only after the relevant dependencies above are resolved should implementation proceed for:

- `#413` Estimator UI
- `#414` Cost Formula Engine
- `#415` Estimator Page
- `#416` Share Result Link

## PR Gate Requirements

Every Sprint 1 implementation PR must:

1. reference exactly one active Sprint 1 issue as its primary scope
2. state that `V1 impact = none` or explain the additive shared-surface touch explicitly
3. confirm no changes to CRM, core layout, lead forms, or V1 pages
4. stay within the approved planning set and architecture guardrails
5. avoid bundling Sprint 2+ scope

If a PR touches shared code, the PR description must explain:

- why the change is additive
- how V1 behavior remains stable
- what regression checks were run

## Execution Ownership

Sprint 1 execution accountability remains anchored to the approved epic structure:

- `#402` search track owner
- `#403` buying-cost estimator track owner
- `#404` architecture preparation and scope-boundary owner

Owner-domain labels remain authoritative for work routing:

- `frontend`
- `backend`
- `seo`
- `product`

## Status Rules During Implementation

While Sprint 1 implementation is active:

- do not report `master blueprint complete`
- do not report `V2 shipped`
- do not report `V1 reopened`
- continue reporting `V1 closed / production-ready`
- continue reporting `V2 roadmap only`

Acceptable implementation status language:

- `Sprint 1 implementation gate open`
- `Sprint 1 execution in progress within approved V2 scope`

## Gate Exit Criteria

This gate remains valid until one of the following happens:

1. Sprint 1 issues are completed and validated
2. scope changes require a new owner approval cycle
3. a proposal conflicts with `docs/contracts/AMP_V2_ARCHITECTURE_GUARDRAILS.md`

If any scope expands beyond the approved Sprint 1 contract, implementation must stop and return to planning approval.
