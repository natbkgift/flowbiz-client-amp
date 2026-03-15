# AMP V2 Sprint 2 Implementation Gate

Date: 2026-03-15

Governance lock:
`732cdba3` on `origin/main`

## Purpose

This document opens the Sprint 2 implementation gate for:

1. the completed Saved Shortlist foundation
2. the first two approved Foreign Buyer Hub implementation slices

It does not activate Market Intelligence implementation.

## Gate Status

`Sprint 2 implementation gate: partially open`

Meaning:

- Saved Shortlist foundation is completed and merged on `main`
- Foreign Buyer Hub is partially unlocked for the approved ownership-basics and buying-process slices only
- Market Intelligence Public Module remains planning only

Top-line reporting remains:

- `V1 closed / production-ready`
- `V2 roadmap only`

## Approved Planning Set

The authoritative Sprint 2 planning inputs for this gate are:

1. `docs/contracts/AMP_V2_FOREIGN_BUYER_HUB_SCOPE_BRIEF.md`
2. `docs/contracts/AMP_V2_MARKET_INTELLIGENCE_PUBLIC_MODULE_PLAN.md`
3. `docs/contracts/AMP_V2_SHORTLIST_DATA_MODEL_DRAFT.md`

Non-negotiable guardrails remain in force:

- `docs/contracts/AMP_V2_ARCHITECTURE_GUARDRAILS.md`

Sprint 1 completion reference:

- `docs/contracts/AMP_V2_SPRINT_1_EXECUTION_REPORT_2026-03-15.md`

## Allowed Implementation Scope

Only these Sprint 2 scopes are unlocked by this gate:

Allowed execution order:

1. `#443` Shortlist Persistence Layer
2. Shortlist API
3. Shortlist save/remove behavior
4. Shortlist share capability
5. `#453` Foreign Buyer Hub Ownership Basics Slice
6. `#455` Foreign Buyer Hub Buying Process Module

No later step may begin until the prior step is merged and validated.

Foreign Buyer Hub slice `#453` is constrained to:

- a new additive public runtime route family for the hub
- ownership and eligibility guidance only
- conservative advisory language only
- an existing contact/advisor CTA path only

Foreign Buyer Hub slice `#455` is constrained to:

- process steps only
- foreign buyer journey explanation only
- conservative advisory-safe wording only
- the existing contact/advisor CTA path only

The following Foreign Buyer Hub layers remain blocked after `#455` until separately approved and merged:

- document guidance module
- FAQ and advisory decision module beyond the approved first slice
- any calculator, shortlist-integration, or funnel-behavior expansion

## Explicitly Blocked Scope

The following remain blocked during this gate stage:

- Market Intelligence Public Module implementation
- CRM changes
- lead-form changes
- core-layout changes
- homepage changes
- advisory funnel changes
- V1 page rewrites

## PR Gate Requirements

Every Sprint 2 implementation PR under this gate must:

1. reference exactly one active Sprint 2 issue as primary scope
2. state `V1 impact = none` unless an additive shared-surface touch is explicitly justified
3. confirm no changes to CRM, lead forms, core layout, homepage structure, or advisory funnel
4. stay within the currently unlocked Sprint 2 slice only
5. stop after CI and merge before moving to the next issue

## Exit Rule For This Stage

This partial Sprint 2 gate remains valid only while unlocked Sprint 2 slices are executed in order.

If scope expands beyond the unlocked shortlist and Foreign Buyer Hub slice boundaries, implementation must stop and return to planning/governance review.
