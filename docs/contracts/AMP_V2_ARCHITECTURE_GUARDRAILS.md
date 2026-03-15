# AMP V2 Architecture Guardrails

Date: 2026-03-15

Governance lock:
`027ef62f` on `origin/main`

## Purpose

This document defines the architectural rules for all V2 work.

Its purpose is to ensure that V2 expands the platform without destabilizing the closed V1 production baseline.

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
