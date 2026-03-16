# AMP V2 Shortlist UX Integration Plan

Date: 2026-03-15

Status guardrail:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- execution is paused in governance handoff state
- this document is a planning artifact only and does not open an implementation gate

## Purpose

Define the public UX layer that will turn the already completed shortlist persistence and API foundation into a usable shortlist workflow without reopening CRM, lead forms, core layout, homepage ownership, or advisory funnel ownership.

This document does not authorize implementation yet.

It defines the approved planning shape for a later Sprint 2 implementation gate if governance decides to proceed.

## 1. UX Objective

The shortlist UX objective is:

- let users save, review, remove, and share a focused set of properties through approved public surfaces
- keep shortlist behavior additive to existing browse, smart-finder, compare, and advisory flows
- bridge current discovery and compare behavior into a clearer shortlist workflow without becoming a CRM workflow or a full authenticated workspace

The target outcome is a shortlist experience that feels like a practical workflow layer, not just a hidden persistence mechanism.

## 2. Owning Routes And Entry Points

### Primary owner surface

The UX owner should be the shortlist surface itself, backed by the existing shortlist API foundation.

Planned public owner shape:

- a dedicated shortlist panel and/or route-level shortlist surface tied to the existing shortlist state

Existing API owner already available:

- `GET /v1/shortlists/current`
- `POST /v1/shortlists/current/items`
- `DELETE /v1/shortlists/current/items/{property_id}`
- `POST /v1/shortlists/current/share`
- `GET /v1/shortlists/shared/{share_token}`

### Approved public entry points for later UX wiring

These are the strongest candidate entry points because they already carry shortlist-adjacent intent in the current platform:

1. compare surface
2. smart-finder result summary
3. property listing cards on browse surfaces such as `/buy`, `/rent`, and `/investment`
4. property detail and project detail continuation actions where shortlist or compare is already implied
5. later dedicated shortlist view/panel entry from approved shortlist surfaces only

### Non-owner surfaces

These surfaces may send users into shortlist UX later, but should not become independent shortlist-state owners:

1. homepage
2. contact page
3. Foreign Buyer Hub
4. Market Intelligence
5. admin surfaces

Ownership rule:

- shortlist UX should aggregate state in one approved shortlist surface instead of fragmenting save/remove/share behavior across unrelated routes

## 3. Shortlist Interaction Model

The shortlist UX should use a lightweight, additive interaction model.

Planned interaction principles:

1. save is a low-friction action from discovery and compare surfaces
2. remove is available from the shortlist surface and from any approved save entry that already shows saved state
3. view is a read-first shortlist review surface with explicit item order
4. share creates a read-only shared shortlist artifact rather than an editing workspace
5. shortlist interactions must remain distinct from contact/advisor handoff actions

Planned UI states:

1. empty shortlist state
2. one-item shortlist state
3. multi-item shortlist state
4. already-saved state
5. shared-read state
6. missing or expired share state if later governance allows expiry behavior

Interaction rule:

- shortlist UX should make current state visible enough that save/remove/share actions feel predictable and reversible

## 4. Save / Remove / View / Share User Flow

### Save flow

Planning direction:

1. user encounters an approved save entry point on listing, compare, smart-finder, or another approved shortlist-adjacent surface
2. save action writes the property into the current shortlist owner using the existing shortlist API
3. UI confirms whether the action was `saved` or `already_saved`
4. shortlist count and entry affordance update without changing CRM or form state

### Remove flow

Planning direction:

1. user removes an item from the shortlist surface or an approved saved-state control
2. remove action calls the existing delete endpoint for the current shortlist owner
3. remaining items reindex visibly and predictably
4. empty state appears when the shortlist reaches zero items

### View flow

Planning direction:

1. user opens a shortlist panel or dedicated shortlist surface
2. shortlist displays item order, property identity, key summary facts, and source surface metadata where useful
3. shortlist offers controlled next steps such as compare, detail view, or advisory contact without changing route ownership elsewhere

### Share flow

Planning direction:

1. user initiates share from the shortlist surface only
2. share action calls the current share endpoint with `public_read`
3. UI returns a read-only share link using the reusable share token already supported by the API
4. shared recipients can read the shortlist through the shared route but cannot mutate the owner shortlist state

Flow rule:

- save, remove, view, and share must stay within shortlist-specific UX and must not silently transform into contact/CRM actions

## 5. Session Vs User Ownership Boundary

The shortlist foundation already supports both `session` and `user` ownership modes.

Planning decision for the first UX layer:

- first UX implementation should default to `session` ownership as the primary public mode
- `user` ownership remains a forward-compatible boundary, not a required first gate dependency

Reasoning:

1. session mode matches the already completed shortlist persistence and API foundation
2. it allows shortlist UX to launch without reopening auth or workspace direction prematurely
3. user-bound continuity can be added later once governance is ready for authenticated workflow decisions

Boundary rule:

- shortlist UX should not force an auth/user-account decision in its first implementation gate

## 6. CRM Boundary Confirmation

CRM remains out of scope for shortlist UX integration.

Confirmed planning boundary:

1. shortlist save/remove/share does not create CRM records by default
2. shortlist UX does not imply assignment, routing, or follow-up automation in CRM
3. shortlist state may later inform advisor context only through a separately approved handoff contract
4. CRM-side ownership, assignment, and follow-up behavior remain untouched

Boundary conclusion:

- shortlist UX is a public workflow layer, not a CRM workflow surface

## 7. Guardrail Verification

The following guardrails remain non-negotiable for any later shortlist UX implementation gate:

1. V1 pages untouched
2. CRM untouched
3. lead forms untouched
4. core layout untouched
5. homepage/advisory funnel untouched
6. no redesign outside approved shortlist surfaces
7. additive-only implementation strategy
8. one issue, one branch, one PR per slice
9. merge only after required CI checks pass

Planning conclusion:

- shortlist UX is acceptable only if it stays within these additive surface limits and avoids expanding into auth, CRM, or homepage redesign work prematurely

## 8. Phased Implementation Slices

Suggested slice order for a later implementation gate:

### Slice 1: Shortlist entry points and CTA placement

Planned scope:

- place shortlist entry controls on approved shortlist-adjacent surfaces
- define saved-state feedback and shortlist count behavior
- do not yet introduce the full shortlist panel or share flow

### Slice 2: Shortlist panel / list view surface

Planned scope:

- introduce the shortlist review surface as panel and/or page-level list view
- show ordered shortlist items with concise facts and approved next actions
- keep view read-first and do not expand into workspace behavior

### Slice 3: Save / remove interaction UX

Planned scope:

- complete interactive save/remove state transitions on approved shortlist surfaces
- ensure idempotent saved state, predictable removal, and empty-state handling

### Slice 4: Share shortlist UX flow

Planned scope:

- add controlled share UX from the shortlist surface only
- expose read-only share behavior around the existing `public_read` share mode
- keep share distinct from CRM handoff and contact flows

## Planning Dependencies

This planning track depends on:

1. the completed shortlist persistence and API foundation
2. route decisions for compare, listing-card, and shortlist review entry points
3. continued session-first ownership acceptance for the first UX gate
4. continued CRM boundary enforcement

## Non-Goals

This planning document does not authorize:

1. shortlist API redesign
2. auth implementation
3. CRM object creation or sync logic
4. homepage redesign
5. advisory funnel redesign
6. new lead forms
7. deal-room or workspace implementation

## Planning Outcome Required

Sprint 2 planning for shortlist UX integration is acceptable only if later reviewers can answer:

1. which public routes own shortlist save entry versus shortlist review
2. how save/remove/view/share flows remain distinct from CRM and advisory funnel behavior
3. how session-first ownership launches without forcing auth decisions too early
4. where shortlist sharing stays read-only and owner-safe
5. how shortlist UX stays additive to the current advisory platform rather than redesigning it

## Hold State

Execution must stop after this planning document.

Next required action:

- wait for governance approval before opening any shortlist UX implementation gate