# AMP V2 Buying Cost Estimator Scope

Date: 2026-03-15

Governance lock:
`027ef62f` on `origin/main`

Status:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this document is a `Sprint 1 planning artifact`, not an implementation approval by itself

## Objective

Help buyers estimate the real cost of purchasing a Pattaya condo before they commit, with the explicit goals of:

- increasing trust
- improving advisory conversion

This is a V2 additive tool. It must not reopen the V1 website baseline.

## Current Baseline

Current related surfaces already in the repo:

- investment calculator route: `admin-app/app/(site)/[locale]/calculator/page.tsx`
- investment/ownership guidance: `admin-app/app/(site)/[locale]/investment/page.tsx`
- foreign buyer guidance: `admin-app/app/(site)/[locale]/buy/page.tsx`
- compare/contact handoff flow: `admin-app/app/(site)/[locale]/compare/page.tsx`, `admin-app/app/(site)/[locale]/contact/page.tsx`

Sprint 1 planning must decide how this new tool complements the current calculator instead of duplicating it.

## Non-Goals

The following are out of scope for Sprint 1:

- mortgage approval workflows
- legal document generation
- deal-room integration
- CRM redesign
- V1 page redesign
- tax/legal certainty claims without approved source rules

## Inputs

Required user inputs:

```text
property price
ownership type
buyer nationality
transfer split
agent fee
mortgage or cash
```

Open planning question:

- whether `buyer nationality` is modeled directly or normalized into a simpler purchase-context switch

## Calculation Scope

### Thai Transfer Baseline

Core planning model:

```text
transfer fee = 2%
stamp duty = 0.5%
withholding tax
```

### Foreign Purchase Baseline

Core planning model:

```text
transfer fee
lawyer fee
bank transfer cost
currency exchange estimate
```

Sprint 1 must document:

- which values are fixed assumptions
- which values are editable assumptions
- which values are placeholders requiring legal/commercial sign-off before build

## Example Output

Illustrative output:

```text
Property Price: 6,000,000 THB

Transfer Fee: 120,000
Stamp Duty: 30,000
Legal Fee: 20,000
Total Cost: 6,170,000
```

## UI Output

The tool must display:

```text
purchase price
government fees
estimated closing cost
total cash needed
```

Preferred UX interpretation:

- show line items clearly
- separate property price from fees
- present total cash needed as the final decision number

## UX Rules

The target tool behavior is:

```text
real-time calculation
mobile friendly
shareable link
```

Additional planning rules:

- no full-page reload on calculate
- copy must be conservative and assumption-led
- result sharing must not require user accounts in Sprint 1
- advisor handoff must carry context into the existing contact flow

## API

Optional planning direction:

```text
POST /api/tools/buying-cost
```

Planning decision required:

- client-side formula engine only
- server-side formula engine
- or hybrid

The decision must be made based on assumption governance, not convenience alone.

## Acceptance Criteria

Planning is only acceptable if the tool contract guarantees:

- instant or near-instant calculation behavior
- no reload requirement
- mobile-friendly input/output flow
- shareable result state
- explicit assumption/disclaimer strategy
- additive handoff into current advisor/contact flow

## Dependencies

- approved fee-policy source of truth
- ownership and foreign-buyer guidance copy
- current contact handoff conventions already used by calculator and compare
- decision on client vs server formula execution

## Risk Level

`Medium`

## Key Risks

- inaccurate fee assumptions damaging trust
- tool duplicating current calculator instead of complementing it
- legal/commercial ambiguity being presented as fact
- V2 tool implementation spilling into V1 information architecture

## Sprint 1 Deliverable From This Brief

This brief is considered approved only when the team can answer:

1. where the estimator lives
2. what the authoritative formula source is
3. how assumptions are disclosed
4. how results are shared
5. how the result enters the current advisor handoff flow
