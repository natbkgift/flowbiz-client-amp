# AMP V2 Shortlist Data Model Draft

Date: 2026-03-15

Status guardrail:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- Sprint 2 remains `planning only`
- this draft is additive and architectural only

## Objective

Define the early data-model direction for a persistent shortlist layer that can connect public discovery, compare, and future workspace capabilities without reopening CRM or current V1 conversion flows.

## Scope Summary

The draft covers:

1. shortlist entity shape
2. shortlist-to-property relationship
3. shortlist-to-user or session relationship
4. CRM interaction boundaries
5. save/share behavior at the model level

This draft does not authorize runtime persistence, auth changes, or shortlist UI implementation.

## Proposed Core Entity

The central planned entity is:

```text
shortlist
```

Purpose:

- represent a saved set of properties or projects tied to one user/session context
- support later compare, advisor handoff, and workspace-style flows

Recommended conceptual fields:

```text
id
owner_type
owner_key
status
title
intent
created_at
updated_at
last_viewed_at
share_mode
share_token_ref
source_context
```

## Shortlist Item Relationship

The shortlist should not store all property detail inline.

Approved draft direction:

- shortlist stores a relation to property identity
- shortlist items may later support project-level and property-level entries, but the first draft should anchor to property identity cleanly

Recommended conceptual child entity:

```text
shortlist_item
```

Recommended fields:

```text
id
shortlist_id
property_id
position
added_at
source_surface
notes_ref
```

Rules:

1. item order should be explicit rather than inferred
2. duplicate property entries in the same shortlist should be blocked
3. the entity should be able to support future compare handoff without mutating property records themselves

## Relation To Property

Planned relationship:

- one shortlist has many shortlist items
- one shortlist item references one property
- one property may appear in many shortlists

This preserves separation between discovery inventory and user-specific saved state.

## Relation To User or Session

The shortlist model must support more than one ownership mode.

Approved planning direction:

### Session-owned shortlist

Use case:

- anonymous visitor starts saving before authentication exists

Characteristics:

- lightweight
- browser/session-linked
- suitable for early save/share behavior

### User-owned shortlist

Use case:

- future authenticated or identified workspace experience

Characteristics:

- portable across devices
- supports longer-lived advisory continuity

### Ownership model decision

The data model should not hardcode only one path.

Recommended abstraction:

```text
owner_type = session | user
owner_key = opaque owner identifier
```

This keeps Sprint 2 planning compatible with later auth decisions.

## Save and Share Behavior

Planned behavior layers:

1. save to a session-linked shortlist
2. share shortlist state externally in a constrained way
3. later migrate to user-bound persistence when auth/workspace direction is approved

Share behavior rules:

- sharing should reference shortlist state, not mutate property records
- a public share artifact should be read-oriented, not a backdoor editing channel
- shortlist sharing must remain distinct from contact/advisor handoff payloads

The draft supports future `save` and `share` features without approving implementation details yet.

## CRM Interaction Boundaries

CRM remains out of scope for Sprint 2 planning implementation.

Approved boundary:

- shortlist may later inform advisor context
- shortlist does not become a CRM record by default
- shortlist save/remove/share events should not imply CRM lifecycle changes
- CRM-side ownership, assignment, and follow-up behavior remain untouched

If shortlist context is passed to advisor flows later, it should happen through additive handoff contracts rather than direct CRM coupling.

## Data Model Implications

This draft implies the likely need for these conceptual entities:

- `shortlist`
- `shortlist_item`
- `shortlist_share`
- `shortlist_owner_reference`

Recommended future metadata fields:

```text
owner_type
owner_key
visibility_scope
share_status
expires_at
origin_surface
```

Optional future extensions, not approved yet:

- shortlist notes
- shortlist tags
- advisor-visible shortlist summaries
- compare snapshot references

## Dependencies

- decision on auth/session direction
- compare and listing-card reuse strategy
- future share-link governance
- advisor handoff boundary decisions for shortlist context

## Non-Goals

- no shortlist API implementation
- no auth implementation
- no CRM object creation or sync logic
- no UI for save/remove/share
- no homepage, layout, lead-form, or advisory funnel changes

## Risks

- the ownership model is locked too early before auth direction is mature
- shortlist and compare scopes blur into one another
- sharing creates privacy or access ambiguity
- CRM coupling creeps in before governance approval
- entity design becomes too rigid for future workspace evolution

## Planning Outcome Required

Sprint 2 planning for this draft is acceptable only if later reviewers can answer:

1. what the shortlist entity is and is not
2. how shortlist items relate to property identity
3. how session and user ownership can coexist in one model
4. where CRM boundaries remain closed
5. how save/share behavior can evolve without premature implementation lock-in
