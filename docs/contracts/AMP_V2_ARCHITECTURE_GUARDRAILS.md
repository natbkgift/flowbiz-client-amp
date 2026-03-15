# AMP V2 Architecture Guardrails

Date: 2026-03-15

Governance lock:
`027ef62f` on `origin/main`

Active Sprint 1 planning sources:

- `docs/contracts/AMP_V2_SEARCH_SCOPE_BRIEF.md`
- `docs/contracts/AMP_V2_BUYING_COST_ESTIMATOR_SCOPE.md`
- `docs/contracts/AMP_V2_EPIC_TO_ISSUE_BREAKDOWN.md`
- `docs/contracts/AMP_V2_ARCHITECTURE_GUARDRAILS.md`

## Purpose

This document defines the architectural rules for all V2 work.

Its purpose is to ensure that V2 expands the platform without destabilizing the closed V1 production baseline.

These rules are non-negotiable scope boundaries for Sprint 1 planning and any later V2 implementation approval.

## Core Guardrails

### 1. V2 must not break V1

V2 work is invalid if it:

- degrades V1 public route stability
- changes V1 conversion flows without explicit approval
- introduces regressions into current CRM/admin production behavior

### 2. V2 must be additive

Preferred V2 change pattern:

- new routes
- additive API endpoints
- additive reusable components
- isolated feature modules

Avoid:

- rewriting V1 page ownership
- replacing existing V1 flows during early V2 work

### 3. No redesign of home

The V1 home experience is closed.

V2 may link from current V1 surfaces, but it must not use Sprint 1-4 roadmap work as a reason to redesign:

- home hero
- home IA
- core V1 CTA structure

### 4. No CRM changes in Sprint 1 planning

CRM is not part of Sprint 1 implementation scope.

Planning may reference CRM dependencies, but must not alter:

- inquiry lifecycle
- admin CRM routes
- lead forms
- assignment/follow-up behavior

### 5. Search must integrate through clear boundaries

Advanced search must decide explicitly:

- whether it is listing-led, project-led, or hybrid
- whether it reuses current inventory endpoints or adds a dedicated search endpoint
- how it preserves SEO/shareable state without mutating V1 browse behavior by accident

### 6. Tooling must use explicit assumption governance

Buying-cost estimation and any future investor tools must:

- disclose assumptions
- avoid pretending uncertain commercial/legal values are guaranteed facts
- use conservative copy and approved formulas

### 7. V2 cannot be reported as shipped scope prematurely

Until implementation and validation are complete, V2 status remains:

`roadmap only`

Do not compress planning, scope definition, or architecture spikes into:

- shipped
- complete
- production-ready

## Allowed Change Types In Sprint 1

- scope briefs
- backlog docs
- architecture docs
- API/design decisions
- issue creation

## Disallowed Change Types In Sprint 1

- V1 page redesign
- CRM workflow changes
- lead-form redesign
- global layout rewrites
- unfinished feature flags leaking into production UX

## Approval Gate For Moving Beyond Sprint 1

No V2 implementation work should start until:

1. scope brief approved
2. issue breakdown approved
3. owner assigned
4. V1 impact reviewed
5. implementation path confirmed as additive

## Standard Approval Message

Use the following message without broadening scope:

```text
Sprint 1 is currently locked in planning-only status.

Please review and approve these three scope documents before any implementation begins:
1. AMP_V2_SEARCH_SCOPE_BRIEF.md
2. AMP_V2_BUYING_COST_ESTIMATOR_SCOPE.md
3. AMP_V2_EPIC_TO_ISSUE_BREAKDOWN.md

Non-negotiable guardrails remain in effect:
- V1 stays closed / production-ready
- V2 remains roadmap only
- No changes to V1 pages, CRM, core layout, or lead forms
- No implementation may start before approval
```

## Owner Approval Checklist

Owners should approve against the following checklist, not against a broad impression.

### Search Scope

- filter set is complete enough for Sprint 1 planning
- sorting coverage is complete enough for Sprint 1 planning
- URL-driven search is the correct state model
- API contract is sufficient for implementation planning
- non-goals are explicit enough to prevent scope creep

### Buying Cost Estimator

- input set is complete enough for planning
- calculation scope is sufficient for business use
- output model matches the buyer/advisor use case
- assumptions that need explicit disclosure are identified

### Epic Breakdown

- issue coverage is complete enough for Sprint 1 planning
- owner allocation is correct
- dependencies are correct
- priorities are correct

## Approval Enforcement

The team must treat approval as invalid unless all of the following are true:

- there is explicit written approval
- there are no open scope objections
- there is no request to add features outside Sprint 1
- the approver confirms implementation may begin later under these guardrails

Until all four conditions are true, Sprint 1 stays `planning only`.

## Known Failure Modes To Prevent

### 1. Approval followed by immediate scope creep

Blocked examples:

- save search
- recommendations
- compare sync expansion
- any net-new V2 module outside the approved Sprint 1 contract

### 2. Issues exist and someone starts building early

Opening issues does not unlock implementation.

No branch or implementation task should start until the approval gate is satisfied.

### 3. Owner approval is broad but not document-bound

Statements such as "ok" or "go ahead" do not count unless they explicitly approve the three required Sprint 1 scope documents.

### 4. Sprint 2 starts before Sprint 1 approval

This is not allowed.

Sprint 2 remains roadmap placeholder work until Sprint 1 approval is complete.
