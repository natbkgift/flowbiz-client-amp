# AMP V2 Estimator UI Plan

Date: 2026-03-15

Governance lock:
`02871d9a` on `origin/main`

Status:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this document is a `Sprint 1 implementation contract` for issue `#413`, not a release approval for the estimator page itself

## Objective

Lock the form inputs, interaction model, and result-summary behavior for the Buying Cost Estimator UI.

The UI must help buyers understand total cash needed without overstating legal or tax certainty.

## Decision Summary

The approved Sprint 1 UI model is:

1. one live estimator form with immediate recalculation behavior
2. a normalized purchase-context switch instead of a raw nationality field
3. a two-zone layout: inputs first, result summary second
4. unresolved fee items shown as advisory notes, not as deterministic totals
5. advisor handoff routed into the existing `/contact` flow using the `#418` contract

## Relationship To Existing Surfaces

Current related surfaces in the repo remain the baseline reference, not the implementation target:

- `admin-app/app/(site)/[locale]/calculator/page.tsx`
- `admin-app/app/(site)/[locale]/calculator/_components/YieldCalculator.tsx`
- `admin-app/app/(site)/[locale]/investment/page.tsx`
- `admin-app/components/knowledge/TransferFeesBreakdown.tsx`
- `admin-app/components/knowledge/ForeignQuotaExplainer.tsx`
- `admin-app/components/knowledge/OwnershipComparison.tsx`

Implication:

- the estimator UI should reuse the repo's conservative guidance tone
- the estimator UI must not duplicate the yield calculator mental model
- the estimator UI must not rewrite existing V1 pages during Sprint 1

## Input Model

The estimator UI has two input layers.

### Primary inputs

These inputs must always be visible on first load.

| Input | Control type | Reason |
| --- | --- | --- |
| property price | numeric text input | core decision input |
| purchase context | segmented control or radio group | normalizes the current nationality-rule ambiguity into governed calculation modes |
| ownership type | select or radio group | required by fee assumptions and disclosure logic |
| transfer split | segmented control or select | required editable assumption from the scope brief |
| financing mode | segmented control or radio group | required core scenario input |

### Advanced assumptions

These inputs must sit in a secondary section and may be collapsed by default on mobile.

| Input | Control type | Rule |
| --- | --- | --- |
| agent fee | numeric text input | editable assumption |
| lawyer fee | numeric text input | shown only for relevant purchase contexts |
| bank transfer cost | numeric text input | shown only for relevant purchase contexts |
| currency exchange estimate | numeric text input | shown only for relevant purchase contexts |

Advanced assumptions must never be visually confused with fixed government-fee items.

## Purchase Context Decision

The approved Sprint 1 UI must not ask the user to model fee rules from raw nationality alone.

Approved UI choice:

```text
purchase context switch
- Thai/local purchase context
- Foreign purchase context
```

Rationale:

- the scope brief leaves direct nationality modeling open
- the fee-source contract blocks over-specific nationality-to-rule mapping without further approval
- a purchase-context switch is easier to explain, localize, and govern

If later business review needs a more detailed buyer-profile model, that belongs to a later contract, not this issue.

## Interaction Model

### Calculation behavior

The approved behavior is real-time calculation with no full-page reload.

Rules:

1. valid input changes update the result summary immediately or near-immediately
2. no dedicated full-page `Calculate` submission is required
3. invalid or incomplete fields must degrade gracefully and keep the form editable
4. result totals may only update from approved deterministic assumptions

### State model

The UI uses one active form state rather than search-style draft/apply state.

Reason:

- the estimator is a scenario tool, not a filtering workflow
- immediate feedback is part of the approved scope brief

### Error handling

The UI must prefer inline correction over blocking modals.

Examples:

- non-numeric price input shows field-level correction
- missing optional advanced assumptions fall back to approved defaults or omission
- unresolved fee items remain advisory notes instead of validation blockers

## Layout Contract

### Desktop

Desktop should use a split layout:

- left/main column: form inputs and assumption controls
- right rail: sticky or persistent result summary

### Mobile

Mobile should use a stacked flow:

- primary inputs first
- result summary immediately after core inputs
- advanced assumptions below or in a disclosure section
- advisor handoff CTA pinned near the result summary, not buried after long explanatory copy

The first mobile viewport must expose the form start and the total-cash-needed outcome path clearly.

## Result Summary Contract

The result region must display these items in this order:

1. purchase price
2. government fees
3. estimated closing cost
4. total cash needed

The summary must also show:

- editable assumptions that materially changed the estimate
- unresolved items excluded from deterministic totals
- the approved assumption-led disclosure copy

The summary must not:

- merge property price and fees into one unexplained number
- hide whether editable assumptions changed the result
- represent placeholder items as approved line items

## Content and Disclosure Rules

The estimator UI must use a conservative tone.

Required meaning:

```text
This estimate is based on current assumptions and is not legal or tax advice.
```

The disclosure must remain visible near the result summary, not hidden only in deep help text.

## CTA Behavior

The primary next-step CTA is advisor handoff into the existing contact flow.

Approved CTA direction:

- review with advisor
- continue to contact with this estimate

CTA rules:

- CTA must serialize only applied result state
- CTA must use the `bc_` handoff contract from `#418`
- CTA must preserve unresolved-item context and disclaimer state

## Accessibility and Localization Rules

The estimator UI must preserve the repo's current public-form accessibility baseline.

Required rules:

- every input must have a clear label
- grouped choices must use accessible radio/segmented semantics
- numeric inputs must remain keyboard-friendly on mobile
- EN and TH meaning must stay aligned even if labels differ naturally

## Explicit Non-Goals

This UI contract does not approve:

- mortgage workflows beyond the simple financing mode switch
- legal-certainty messaging
- CRM-side estimate persistence
- compare-flow expansion
- any V1 calculator rewrite

## Dependencies For Later Issues

### For `#414` Cost Formula Engine

- the engine must support the primary and advanced input set defined here
- unresolved items must remain excluded from deterministic totals

### For `#415` Estimator Page

- the page must render this live form and summary model
- page layout may style the surface, but must not alter the interaction contract

### For `#416` Share Result Link

- share state must serialize the same applied input/result model defined here
- shared results must preserve advanced assumptions that affect the displayed estimate

## Acceptance Criteria

This issue is complete only if the contract makes all of the following explicit:

1. which inputs are primary vs advanced
2. how purchase context is modeled
3. how real-time calculation behavior works
4. what the result summary must and must not show
5. how the advisor CTA plugs into the approved handoff contract

## Out Of Scope

This issue does not:

- build the estimator page route
- implement formulas or APIs
- define share-link encoding details
- add analytics events
- change CRM, lead forms, or V1 pages