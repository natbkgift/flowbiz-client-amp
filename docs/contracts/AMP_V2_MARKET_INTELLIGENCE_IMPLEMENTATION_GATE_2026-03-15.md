# AMP V2 Market Intelligence Implementation Gate

Date: 2026-03-15

Governance lock:
`2c0c6e5d` on `origin/main`

## Purpose

This document opens the Sprint 2 implementation gate for the Market Intelligence Public Module after completion of the approved Foreign Buyer Hub slice chain.

This gate activates Market Intelligence implementation only.

It does not reopen V1, CRM, lead forms, core layout, homepage ownership, or advisory funnel ownership.

## Gate Status

`Sprint 2 Market Intelligence implementation gate: partially open`

Meaning:

- Foreign Buyer Hub implementation is complete and reported in `docs/contracts/AMP_V2_FOREIGN_BUYER_HUB_COMPLETION_REPORT_2026-03-15.md`
- Market Intelligence Public Module is now the active Sprint 2 implementation track
- implementation must proceed slice-by-slice in the order defined below
- no advisor-only data may be exposed publicly during this gate

Top-line reporting remains:

- `V1 closed / production-ready`
- `V2 roadmap only`

## Approved Planning Inputs

The authoritative planning inputs for this gate are:

1. `docs/contracts/AMP_V2_MARKET_INTELLIGENCE_PUBLIC_MODULE_PLAN.md`
2. `docs/contracts/AMP_V2_FOREIGN_BUYER_HUB_COMPLETION_REPORT_2026-03-15.md`
3. `docs/contracts/AMP_V2_ARCHITECTURE_GUARDRAILS.md`
4. `docs/contracts/AMP_V2_BACKLOG_4_SPRINTS_2026-03-15.md`

## 1. Module Objective

Implement a public-facing Market Intelligence module that presents governed, public-safe market context for Pattaya buyers and investors without exposing advisor-only data or altering the current advisory funnel owner.

Approved module outcome for this gate stage:

- establish a dedicated public route owner
- classify what data is public-safe before charting or interpretation expands
- present only confidence-qualified public market context
- preserve the existing advisor CTA path for deeper interpretation

## 2. Public-Safe Data Boundaries

Public-safe data may include:

1. directional market summaries
2. governed area comparisons
3. confidence-qualified investment and demand signals
4. freshness and methodology disclosure
5. approved contextual CTA into the existing advisory path

The following must remain outside the public module unless separately approved:

1. advisor-only negotiation guidance
2. deal-specific pricing strategy
3. private shortlist recommendations
4. unpublished transaction-sensitive commentary
5. internal sales notes or follow-up intelligence
6. weak-confidence observations framed as numeric public claims

Boundary rule:

- if a signal cannot be reproduced, governed, dated, and source-classified, it must not appear as a public market-intelligence claim

## 3. Source Classification

Every public block, metric, chart, or interpretation block must resolve to one of these source classes:

### `public`

Definition:

- information already approved for public presentation and reproducible from governed public-facing sources

Examples:

- approved public inventory counts
- published area or project statistics already allowed on public surfaces
- approved methodology and disclosure copy

### `curated`

Definition:

- manually reviewed and governance-approved synthesis that is safe for public presentation but not raw self-serve data

Examples:

- editorial market commentary
- governed directional summaries
- approved narrative interpretation tied to dated source inputs

### `advisor-only`

Definition:

- information that may inform advisory work internally but cannot be exposed on the public module during this gate

Examples:

- unpublished operator observations
- deal-specific negotiation context
- private shortlist-specific recommendations
- internal follow-up or sales intelligence

Rule:

- `advisor-only` data may inform internal review but must not cross into public runtime output

## 4. Freshness Cadence

Approved cadence tiers:

| Tier | Scope | Gate rule |
| --- | --- | --- |
| `fast` | inventory-linked snapshots and directional counts | may refresh weekly or on governed automated cadence |
| `editorial` | narrative interpretation and commentary | monthly review target |
| `governed` | methodology, disclosure, and boundary language | update only on approved revision |

Freshness rules:

1. every published market block must expose a clear freshness label or supporting disclosure
2. old commentary must not appear current without a visible date or freshness note
3. stale or weak-confidence data must degrade to conservative wording rather than stronger claims

## 5. Chart / Report Structure

The approved public structure for this gate is:

1. headline market snapshot region
2. area-comparison region
3. investment-signal region
4. methodology and disclaimer region

Structure rules:

1. each chart must answer one clear decision question
2. narrative interpretation must sit adjacent to the related evidence
3. advisor CTA must follow interpretation rather than replace evidence
4. the page shell may launch before later chart layers are fully implemented

## 6. SEO Indexability Rules

SEO intent:

- the module should behave as an authority-support surface, not as a thin data dump

Approved rules:

1. the primary owning route may be indexable once the page shell and core disclosure framework are in place
2. thin parameterized views or fragmented low-signal subpages are not approved in this gate
3. methodology and freshness context must remain visible to support trust
4. internal linking may point from related public surfaces later, but this gate does not reopen homepage or existing navigation ownership
5. localized route ownership must not create duplicate thin pages with weak differentiation

## 7. Guardrail Verification

The following guardrails remain non-negotiable during this gate:

1. V1 pages untouched
2. CRM untouched
3. lead forms untouched
4. core layout untouched
5. homepage/advisory funnel untouched
6. no advisor-only data exposed publicly
7. additive-only implementation strategy
8. one issue, one branch, one PR per slice
9. merge only after required CI checks pass

## 8. Implementation Slices

Allowed execution order:

1. Market Intelligence route owner and page shell
2. Data source classification layer
3. Basic market overview charts
4. Advisory interpretation blocks

No later slice may begin until the prior slice is merged and validated.

### Slice 1: Market Intelligence route owner and page shell

Allowed scope:

- dedicated localized route owner for the Market Intelligence module
- additive page shell on the existing public runtime owner surface
- conservative intro, disclosure, and existing advisor CTA only
- no charts beyond placeholder-safe structure

Blocked within Slice 1:

- no source classification runtime output beyond shell-level framing
- no chart series
- no new data endpoints
- no advisory-only interpretation

### Slice 2: Data source classification layer

Allowed scope:

- visible source-class framing for public-safe and curated content
- dated methodology and freshness cues
- no advisor-only data exposure

### Slice 3: Basic market overview charts

Allowed scope:

- limited, high-signal public-safe overview charts only
- evidence-first presentation with clear freshness and disclaimer context

### Slice 4: Advisory interpretation blocks

Allowed scope:

- conservative narrative interpretation adjacent to public-safe evidence
- existing advisor/contact CTA path only

## PR Gate Requirements

Every implementation PR under this gate must:

1. reference exactly one active Market Intelligence issue as primary scope
2. state `V1 impact = none` unless an additive shared-surface touch is explicitly justified
3. confirm no changes to CRM, lead forms, core layout, homepage structure, or advisory funnel
4. confirm no advisor-only data is exposed publicly
5. stop after CI and merge before moving to the next slice

## Exit Rule For This Stage

This gate remains valid only while the approved Market Intelligence slices execute in order.

If scope expands beyond the ordered slice boundaries or public-safe data rules above, implementation must stop and return to governance review.