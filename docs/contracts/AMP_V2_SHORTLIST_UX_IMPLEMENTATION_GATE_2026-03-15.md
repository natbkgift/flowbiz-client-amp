# AMP V2 Shortlist UX Implementation Gate

Date: 2026-03-15

Governance lock:
`7d3f0971` on `main`

## Purpose

This document opens the Sprint 2 implementation gate for Shortlist UX Integration after completion of the planning artifact.

This gate activates Shortlist UX implementation only.

It does not reopen V1, CRM, lead forms, core layout, homepage ownership, or advisory funnel ownership.

## Gate Status

`Sprint 2 Shortlist UX implementation gate: partially open`

Meaning:

- the planning input is complete in `docs/contracts/AMP_V2_SHORTLIST_UX_INTEGRATION_PLAN_2026-03-15.md`
- Shortlist UX Integration is now the active Sprint 2 implementation track
- implementation must proceed slice-by-slice in the order defined below
- no later slice may begin before the prior slice is merged and validated

Top-line reporting remains:

- `V1 closed / production-ready`
- `V2 roadmap only`

## Approved Planning Inputs

The authoritative planning inputs for this gate are:

1. `docs/contracts/AMP_V2_SHORTLIST_UX_INTEGRATION_PLAN_2026-03-15.md`
2. `docs/contracts/AMP_V2_SHORTLIST_DATA_MODEL_DRAFT.md`
3. `docs/contracts/AMP_V2_MARKET_INTELLIGENCE_GATE_CLOSURE_2026-03-15.md`
4. `docs/contracts/AMP_V2_ARCHITECTURE_GUARDRAILS.md`
5. `docs/contracts/AMP_V2_BACKLOG_4_SPRINTS_2026-03-15.md`

## 1. Approved UX Objective

Implement an additive shortlist UX layer that makes the completed shortlist persistence and API foundation usable on approved public surfaces.

Approved gate outcome for this stage:

1. introduce shortlist entry points on approved shortlist-adjacent public surfaces
2. make shortlist intent visible without reopening auth, CRM, or workspace behavior
3. preserve current advisory flows while separating shortlist actions from contact handoff
4. keep shortlist sharing, panel/list view, and deeper workflow layers behind later ordered slices

## 2. Allowed Shortlist Surfaces

The following public surfaces are allowed during this gate:

1. shortlist-ready property listing cards on browse surfaces such as `/buy` and `/rent`
2. property detail continuation actions where a concrete `property_id` exists
3. project inventory and project detail surfaces as shortlist-oriented entry surfaces only
4. compare surface as a shortlist-oriented entry surface only
5. smart-finder results as a shortlist-oriented entry surface only

Rules:

1. surfaces with a concrete `property_id` may expose direct save entry behavior
2. project-oriented surfaces without a concrete `property_id` may only expose shortlist-oriented routing or CTA placement in Slice 1
3. the dedicated shortlist panel or list surface is reserved for Slice 2
4. share controls are reserved for Slice 4

Blocked surfaces:

1. homepage
2. Foreign Buyer Hub
3. Market Intelligence
4. admin surfaces
5. contact form flow ownership

## 3. Owning Routes And Entry Points

Current shortlist state owner remains the existing shortlist API foundation:

1. `GET /v1/shortlists/current`
2. `POST /v1/shortlists/current/items`
3. `DELETE /v1/shortlists/current/items/{property_id}`
4. `POST /v1/shortlists/current/share`
5. `GET /v1/shortlists/shared/{share_token}`

Public UX owner for this gate:

- shortlist state remains API-owned while Slice 1 adds approved entry points only

Approved entry points for Slice 1 execution:

1. property listing cards on shortlist-ready browse surfaces
2. property detail CTA region
3. project inventory cards as shortlist-oriented routing into shortlist-ready inventory or detail surfaces
4. project detail next-step regions as shortlist-oriented routing only
5. compare empty-state and compare decision regions as shortlist-oriented routing only
6. smart-finder result cards as shortlist-oriented routing only unless a concrete property owner is present

Ownership rule:

- this gate must not invent a second shortlist state owner outside the existing shortlist API contract

## 4. Session Vs User Boundary

The shortlist foundation supports both `session` and `user` ownership modes.

Approved gate boundary:

1. first implementation must operate in `session` mode as the primary public mode
2. `user` ownership remains forward-compatible only
3. no auth or account continuity work is approved in this gate

Boundary rule:

- shortlist UX must not force user authentication or reopen account-state decisions during this slice chain

## 5. CRM Boundary Confirmation

CRM remains out of scope for this gate.

Confirmed implementation boundary:

1. shortlist save/remove/share does not create CRM records by default
2. shortlist state does not create advisor assignment, routing, or follow-up automation
3. advisory CTA paths may continue to exist beside shortlist CTAs, but must remain distinct
4. lead forms stay unchanged

Boundary conclusion:

- Shortlist UX is a public shortlist workflow layer, not a CRM workflow surface

## 6. Guardrail Verification

The following guardrails remain non-negotiable during this gate:

1. V1 pages untouched
2. CRM untouched
3. lead forms untouched
4. core layout untouched
5. homepage/advisory funnel untouched
6. no redesign outside approved shortlist surfaces
7. additive-only implementation strategy
8. one issue, one branch, one PR per slice
9. merge only after required CI checks pass

## 7. Implementation Slices

Allowed execution order:

1. Shortlist entry points and CTA placement
2. Shortlist panel / list view surface
3. Save/remove interaction UX
4. Share shortlist UX flow

No later slice may begin until the prior slice is merged and validated.

### Slice 1: Shortlist entry points and CTA placement

Allowed scope:

1. place shortlist entry controls on approved shortlist-ready surfaces
2. add shortlist-oriented CTA placement on project, compare, and smart-finder surfaces without forcing a project-level save model
3. define saved-state feedback and shortlist count behavior where the current shortlist owner can be read safely
4. keep work additive and light-touch

Blocked within Slice 1:

1. no dedicated shortlist panel or list view
2. no remove flow completion beyond minimal saved-state awareness needed for entry CTAs
3. no share UX
4. no auth work
5. no CRM handoff redesign

### Slice 2: Shortlist panel / list view surface

Allowed scope:

1. introduce shortlist review surface as panel and/or page-level list view
2. show ordered shortlist items with concise facts and approved next steps

### Slice 3: Save/remove interaction UX

Allowed scope:

1. complete save/remove interaction state transitions on approved shortlist surfaces
2. handle idempotent state and empty-state behavior cleanly

### Slice 4: Share shortlist UX flow

Allowed scope:

1. add controlled share UX from the shortlist surface only
2. expose the existing `public_read` share capability without opening editing behavior

## 8. PR And Validation Requirements

Every implementation PR under this gate must:

1. reference exactly one active Shortlist UX issue as primary scope
2. state `V1 impact = none` unless an additive shared-surface touch is explicitly justified
3. confirm no changes to CRM, lead forms, core layout, homepage structure, or advisory funnel
4. confirm session-first shortlist ownership remains unchanged
5. stop after CI and merge before moving to the next slice

Required validation before PR:

1. `npm --prefix admin-app run build`
2. `npm --prefix admin-app run test -- <affected_test_files>`
3. if auth, routing, or admin shell changes are included, `npm --prefix admin-app run test:smoke:admin`
4. `git diff --check`
5. required GitHub checks must pass before merge, including `CI Governance Gates` and `Admin Smoke E2E`

## 9. Status Language Allowed During Implementation

Allowed top-line status language:

1. `V1 closed / production-ready`
2. `V2 roadmap only`
3. `Sprint 2 Shortlist UX implementation gate: partially open`

Allowed slice-execution language:

1. `Slice 1 active`
2. `Slice 1 merged and validated`
3. `Slice 2 active`
4. `Slice 2 merged and validated`
5. `Slice 3 active`
6. `Slice 3 merged and validated`
7. `Slice 4 active`
8. `Slice 4 merged and validated`
9. `Blocked pending governance review`

Not allowed during this gate:

1. language implying CRM integration is live
2. language implying authenticated shortlist continuity is complete
3. language implying a full workspace or deal-room exists
4. language implying homepage or advisory funnel redesign has shipped

## Exit Rule For This Stage

This gate remains valid only while the approved shortlist slices execute in order.

If scope expands beyond the ordered slice boundaries, the property-based shortlist owner model, or the public-surface limits above, implementation must stop and return to governance review.