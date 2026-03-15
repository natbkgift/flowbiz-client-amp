# AMP V2 Estimator Share Result Link Plan

Date: 2026-03-15

Governance lock:
`973352d2` on `origin/main`

Status:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this document is a `Sprint 1 implementation contract` for issue `#416`, not a release approval for estimator sharing itself

## Objective

Lock the shareable result-state model for the Buying Cost Estimator.

## Decision Summary

The approved Sprint 1 share model is:

1. shareable estimator state lives on the estimator route itself
2. applied state is serialized into transparent query parameters
3. no account, draft save, or server-side shortlink token is required in Sprint 1
4. shared links must preserve assumption-version and unresolved-item context

## Why Transparent Query State Is Approved

Transparent query state is approved over opaque encoded tokens because it:

- matches the repo's current public advisory link pattern
- keeps links debuggable and portable
- avoids introducing state storage infrastructure for a planning-only Sprint 1 scope
- works with the approved advisor handoff model from `#418`

Sprint 1 explicitly does not require a compressed or encrypted share token.

## Owning Route

Shared results must reopen on the estimator page route approved in `#415`:

```text
/[locale]/buying-cost-estimator
```

Share links must not open directly into contact as the primary route owner.

## Share-State Model

Only applied state may be serialized into the share link.

Applied state means:

- the normalized input set currently producing the visible estimate
- editable assumptions that materially affect the current result
- assumption metadata needed to reproduce or safely qualify the result

Draft or partially edited values must not enter the share URL.

## Query Namespace Decision

Estimator share state must reuse the estimator namespace approved for handoff:

```text
bc_
```

This keeps:

- share links
- advisor handoff
- future query helpers

on one consistent estimator contract.

## Required Share Fields

### Core applied inputs

| Key | Meaning |
| --- | --- |
| `bc_price` | property price |
| `bc_purchase_context` | normalized purchase mode |
| `bc_ownership_type` | ownership structure |
| `bc_transfer_split` | selected payer split |
| `bc_financing_mode` | cash or approved financing mode |

### Applied editable assumptions

Include only when present and materially relevant:

| Key | Meaning |
| --- | --- |
| `bc_agent_fee` | applied agent-fee assumption |
| `bc_lawyer_fee` | applied lawyer-fee assumption |
| `bc_bank_transfer_cost` | applied bank-transfer-cost assumption |
| `bc_fx_estimate` | applied exchange-cost estimate |

### Assumption metadata

| Key | Meaning |
| --- | --- |
| `bc_assumption_set` | assumption-set identifier |
| `bc_assumption_version` | exact assumption version used |
| `bc_disclaimer_key` | disclosure reference for the rendered result |

### Unresolved-state context

| Key | Meaning |
| --- | --- |
| `bc_unresolved_items` | blocked or advisory items excluded from deterministic totals |

## Deliberately Excluded Fields

The share URL must not carry:

- localized labels or rendered copy
- formatted currency strings
- internal loading state
- CRM identifiers
- hidden server state references required to understand the link

The page should recompute the visible totals from the applied inputs and assumption version rather than trust stale formatted output embedded in the URL.

## Reopen Behavior Contract

When a shared link opens, the estimator page must:

1. parse the applied estimator query state
2. restore the UI to the shared scenario
3. resolve the referenced assumption version when available
4. recompute deterministic results through the approved formula boundary
5. display unresolved items and disclosure state alongside the result

## Version-Mismatch Behavior

If the exact assumption version is unavailable when the link reopens:

1. the page must not silently recompute under a different assumption version without disclosure
2. the page may prompt the user to refresh the estimate under the current approved version
3. the UI must explain that assumptions changed and the shared result should be reviewed again

This prevents stale links from being misread as current legal/commercial truth.

## URL Hygiene Rules

The share-state serializer must:

1. omit empty values
2. use plain decimal strings for numbers
3. keep field names stable and predictable
4. serialize only the minimum state needed to reproduce the visible scenario

Sprint 1 does not approve a secondary encoded blob format unless the transparent format proves insufficient later.

## Share CTA Contract

Approved share behaviors for later implementation:

- copy link
- open the current shareable URL
- continue to advisor using the same applied estimator state

The estimator page may expose a distinct `share result` CTA, but it must remain on the estimator route and use the same applied-state contract.

## Integration Rules

### For `#413` Estimator UI

- share state may only derive from the live applied input model defined there
- draft edits must not overwrite the last shareable applied state until they become active

### For `#414` Cost Formula Engine

- reopened share URLs must recompute through the same authoritative formula boundary
- share links must not embed detached totals as the primary source of truth

### For `#415` Estimator Page

- share URLs reopen on the dedicated estimator route
- route ownership remains with the estimator page, not contact or calculator

### For `#418` Advisor Handoff Contract

- advisor CTA may reuse the applied estimator state already present in the share URL
- handoff remains a separate contact transition, not the primary share destination

## Acceptance Criteria

This issue is complete only if the contract makes all of the following explicit:

1. where shared estimator links reopen
2. which applied fields are serialized
3. why transparent query state is approved for Sprint 1
4. how assumption-version mismatch is handled safely
5. how share state stays aligned with the page, formula, and advisor handoff contracts

## Out Of Scope

This issue does not:

- implement copy-to-clipboard UI yet
- add shortlink infrastructure
- add account-based saved scenarios
- define analytics events for sharing
- change CRM, lead forms, or V1 pages