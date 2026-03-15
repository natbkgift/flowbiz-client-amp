# AMP V2 Market Intelligence Public Module Plan

Date: 2026-03-15

Status guardrail:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- Sprint 2 remains `planning only`
- this plan is additive and architectural only

## Objective

Define a public-facing market intelligence module that turns approved market signals into a governed, updateable authority surface without leaking advisor-only or weak-confidence data into public presentation.

## Scope Summary

The module should present market information across four layers:

1. market overview
2. area comparison
3. investment and demand signals
4. advisor CTA for deeper interpretation

The module is a planning artifact only. No charts, APIs, routes, or publishing workflow are implemented by this plan.

## Proposed Public Module Structure

### 1. Market overview layer

Purpose:

- summarize directional market context for Pattaya buyers and investors

Planned content blocks:

- overall market snapshot
- buyer-demand direction
- pricing trend summary
- caveat/disclaimer block

### 2. Area comparison layer

Purpose:

- compare market signals across major areas without overstating precision

Planned content blocks:

- area-level pricing ranges
- inventory availability or velocity indicators
- area positioning summary
- contextual advisor CTA

### 3. Investment signals layer

Purpose:

- present public-safe investment context that complements, but does not replace, advisor review

Planned content blocks:

- rental-demand indicators
- ROI/yield framing where confidence is sufficient
- supply/competition commentary
- risk and uncertainty notes

### 4. Reporting and methodology layer

Purpose:

- explain source freshness, methodology level, and what is public-safe versus advisor-only

Planned content blocks:

- last updated stamp
- source categories
- methodology summary
- public/advisor-only boundary note

## Data Sources

The planning model assumes a mixed-source intelligence surface.

Candidate source groups:

- internal property and project inventory signals
- area and project statistics already used in public comparison or evaluation surfaces
- approved editorial market commentary
- manually curated operator/advisor insights with governance review

Source rules:

1. every public metric must identify its source class
2. weak-confidence or non-repeatable advisor observations must not become public numeric claims
3. public-safe signals should be reproducible enough for later editorial review

## Update Cadence

The module should support three freshness tiers.

| Tier | Example content | Planning cadence |
| --- | --- | --- |
| `fast` | inventory-linked market counts or directional snapshots | weekly or automated refresh target |
| `editorial` | market commentary or interpretation | monthly review target |
| `governed` | methodology and disclosure language | only on approved revision |

The module must show freshness clearly enough that users do not mistake old market commentary for live signals.

## Chart and Report Structure

Approved chart/report planning shape:

1. one headline snapshot region
2. one area-comparison region
3. one investment-signal region
4. one methodology/disclaimer region

Chart rules for later implementation:

- prefer a small number of high-signal charts over dashboard sprawl
- every chart should answer one decision question
- narrative interpretation should sit next to charts, not far away from them
- advisor CTA should appear after interpretation, not before evidence

## SEO Positioning

The public module should be positioned as an authority/support surface, not as a raw data dump.

Approved SEO direction:

- target buyer and investor informational intent
- create internal-link opportunities from area, project, and advisory content later
- avoid indexable thin pages made from low-signal data fragments
- keep methodology and freshness visible to support trust

The module should favor a smaller number of durable, high-authority pages over many shallow parameterized views.

## Public vs Advisor-Only Boundary

Public-safe content may include:

- directional trend summaries
- governed area comparisons
- confidence-qualified investment context
- methodology and freshness disclosure

Advisor-only content should remain outside the public module unless later approved:

- negotiation guidance
- deal-specific pricing strategy
- private shortlist-specific recommendations
- internal sales or follow-up intelligence
- unpublished transaction-sensitive commentary

## Data Model Implications

This plan implies a future public-intelligence content model with at least these concepts:

- `market_report`
- `market_snapshot_metric`
- `area_comparison_block`
- `chart_series`
- `methodology_note`
- `freshness_record`
- `visibility_scope`

Recommended future metadata fields:

```text
report_slug
coverage_area
source_class
confidence_level
published_at
refreshed_at
visibility_scope
methodology_version
```

This is a planning implication only. No schema or storage change is approved yet.

## Dependencies

- area and project statistics sources with enough repeatability for public use
- editorial sign-off for market framing language
- governance rules for freshness and confidence labeling
- future route and publishing ownership decision

## Non-Goals

- no public implementation of charts or dashboards
- no new API endpoints
- no advisor-only analytics exposure
- no dynamic recommendation engine
- no changes to homepage, core layout, or advisory funnel ownership
- no CRM workflow changes

## Risks

- weak-confidence data is presented too strongly in public
- update cadence is promised beyond what operations can maintain
- charts become decorative rather than decision-useful
- public and advisor-only boundaries blur over time
- SEO strategy creates thin or stale indexable content

## Planning Outcome Required

Sprint 2 planning for this module is acceptable only if later reviewers can answer:

1. what source classes can safely feed a public module
2. how freshness is displayed and governed
3. what chart/report structure best supports trust and comprehension
4. where the public/advisor-only boundary sits
5. how the module contributes to authority SEO without creating thin content
