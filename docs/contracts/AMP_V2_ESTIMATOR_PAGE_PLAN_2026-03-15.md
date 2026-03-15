# AMP V2 Estimator Page Plan

Date: 2026-03-15

Governance lock:
`682cff7c` on `origin/main`

Status:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this document is a `Sprint 1 implementation contract` for issue `#415`, not a release approval for the estimator route itself

## Objective

Lock the route owner, module placement, and page composition model for the Buying Cost Estimator.

## Decision Summary

The approved Sprint 1 page model is:

1. one dedicated additive public route for the estimator
2. estimator page remains separate from the existing yield calculator route
3. page shell stays server-rendered while the estimator tool runs as a focused client module
4. no core-navigation or V1 page restructuring is required to ship the page later

## Route Ownership Decision

The approved route owner is:

```text
/[locale]/buying-cost-estimator
```

Why this route is approved:

- it gives the estimator a clear buyer-focused identity
- it avoids overloading the existing `/calculator` route, which already means yield/investment calculator in the repo
- it keeps the feature additive instead of rewriting a locked V1 surface

## Explicitly Rejected Placement Options

The following placements are not approved for Sprint 1:

- replacing `admin-app/app/(site)/[locale]/calculator/page.tsx`
- embedding the estimator as a new tab inside the current calculator page
- nesting the estimator inside contact, compare, or buy as the primary route owner
- introducing a new global navigation requirement as part of this issue

These options create unnecessary V1 churn or blur the tool's scope.

## Route Structure Contract

Approved app-router placement for later implementation:

```text
admin-app/app/(site)/[locale]/buying-cost-estimator/page.tsx
```

Optional route-local modules:

```text
admin-app/app/(site)/[locale]/buying-cost-estimator/_components/*
```

Page composition should follow the repo's current public-page pattern:

- localized metadata from existing i18n helpers
- server page shell for title, subtitle, and supporting context
- client estimator module for live inputs and result state

## Module Boundary Decision

The estimator page should split responsibilities across three layers.

### 1. Server page shell

Responsibilities:

- load locale and dictionary
- define metadata
- assemble the advisory hero and page sections
- pass stable configuration into the client estimator module

### 2. Client estimator module

Responsibilities:

- render the UI contract from `#413`
- call the formula boundary from `#414`
- produce share and contact CTA state from `#416` and `#418`

### 3. Shared helper layer

Responsibilities:

- serialize estimator query state
- build locale-aware contact/share links
- isolate estimator-specific payload logic from the current calculator helpers

Approved implication:

- estimator-specific query logic should live in a dedicated helper surface, not be mixed directly into the current calculator handoff helpers unless there is a clear shared abstraction

## Page Composition Contract

The approved page sections are:

1. page hero and expectation-setting copy
2. estimator tool section
3. supporting guidance/disclaimer section
4. advisor next-step CTA region

The page must keep the estimator tool above the fold more strongly than long-form educational copy.

## Relationship To Existing Calculator

The current calculator remains in place as the investment/yield tool.

Required coexistence rules:

- no rename of `/calculator` in Sprint 1
- no estimator logic inserted into the existing calculator page as the primary experience
- cross-links between the two tools are allowed later, but route ownership remains separate

This preserves user clarity:

- `/calculator` = investment/yield scenario
- `/buying-cost-estimator` = purchase cost and cash-needed scenario

## CTA and Entry Rules

The estimator page may later be entered from contextual surfaces such as:

- buy-related educational content
- investment/advisory pages
- calculator cross-link modules

But this issue does not require:

- a new header nav item
- a footer IA rewrite
- homepage hero changes

## Metadata and SEO Direction

The estimator page is a public utility page, not a hidden admin/tool surface.

Approved direction for later implementation:

- page receives normal localized metadata
- share-result query variants are handled separately in `#416`
- route-level SEO behavior should not require reopening search-page rules or V1 route ownership

## Mobile and Performance Rules

The page must be optimized for mobile-first tool use.

Required rules:

- tool loads as the primary content block, not below long introductory copy
- heavy scenario logic stays behind the async formula boundary from `#414`
- first interaction path to total cash needed should be short and clear

## Integration Rules

### For `#413` Estimator UI

- page must host the exact UI contract approved there
- page layout may not dilute the primary vs advanced input structure

### For `#414` Cost Formula Engine

- page owns the client integration to `/api/tools/buying-cost`
- page must not bypass the approved execution boundary

### For `#416` Share Result Link

- page must expose a share entry and reopen path without changing route ownership
- share state belongs to this page's route, not to contact or calculator

### For `#418` Advisor Handoff Contract

- page must expose the contact CTA into `/[locale]/contact`
- handoff remains additive to the existing public contact flow

## Acceptance Criteria

This issue is complete only if the contract makes all of the following explicit:

1. the owning public route for the estimator
2. why the estimator does not live inside the current calculator page
3. how server shell, client module, and helper boundaries are split
4. what page sections are required
5. which navigation/layout changes remain out of scope

## Out Of Scope

This issue does not:

- implement the route yet
- add the estimator to global navigation
- rewrite the calculator page
- define share encoding details beyond route ownership
- change CRM, core layout, lead forms, or V1 pages