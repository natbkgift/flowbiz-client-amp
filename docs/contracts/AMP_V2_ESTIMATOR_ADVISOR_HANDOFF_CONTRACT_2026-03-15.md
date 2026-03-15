# AMP V2 Estimator Advisor Handoff Contract

Date: 2026-03-15

Governance lock:
`1bbdfd43` on `origin/main`

Status:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this document is a `Sprint 1 implementation contract` for issue `#418`, not a release approval for the estimator itself

## Objective

Define how Buying Cost Estimator output moves into the existing advisor/contact handoff without changing CRM, lead forms, or V1 information architecture.

## Decision Summary

The estimator handoff must:

1. reuse the existing public contact route, not create a new advisor intake surface
2. carry context through locale-aware query state first
3. show a concise estimator summary above the existing lead form
4. preserve assumption and unresolved-item context so advisors do not read the result as legal certainty

## Existing Baseline To Reuse

Current public advisory flow already proves the allowed pattern:

- calculator builds query state in `admin-app/app/_lib/public-advisory.ts`
- compare passes the same context into `/contact`
- contact renders an advisory summary above the existing form in `admin-app/app/(site)/[locale]/contact/page.tsx`
- regression coverage already protects the query-driven handoff pattern in `admin-app/__tests__/investor_handoff_regression.test.ts`

Implication:

- estimator handoff must extend this pattern additively
- estimator handoff must not introduce direct CRM fields, hidden workflow state, or a separate intake system

## Handoff Target

The only approved Sprint 1 advisor handoff target is:

```text
/[locale]/contact
```

No new route is approved for estimator handoff in Sprint 1.

## Transport Model

The approved transport is query-state handoff into the existing localized contact page.

Why this model is approved:

- it matches the current calculator and compare pattern
- it keeps the flow shareable and debuggable
- it avoids CRM and lead-form schema changes

The estimator must not rely on:

- authenticated sessions
- server-side draft storage as a requirement
- custom CRM payload fields in Sprint 1

## Query Namespace Decision

Estimator handoff state must use a dedicated namespace so it does not collide with the current calculator contract.

Approved estimator prefix:

```text
bc_
```

Rationale:

- the current calculator already uses generic keys such as `purchasePrice`, `annualCosts`, and `source`
- estimator data has different semantics from yield-calculator metrics
- namespacing prevents accidental parsing overlap inside shared advisory helpers

## Required Handoff Fields

### Envelope fields

These fields identify the handoff and remain outside the `bc_` namespace because they match the current public advisory routing pattern.

| Key | Type | Rule |
| --- | --- | --- |
| `intent` | string | must be `buying_cost_review` |
| `source` | string | must identify the originating estimator surface, default `buying_cost_estimator` |
| `tool` | string | must be `buying_cost_estimator` |

### Required estimator context fields

| Key | Type | Meaning |
| --- | --- | --- |
| `bc_price` | number string | target property price |
| `bc_purchase_context` | enum string | normalized purchase mode for calculation rules |
| `bc_ownership_type` | enum string | ownership structure used in the estimate |
| `bc_transfer_split` | enum string | selected payer split model |
| `bc_financing_mode` | enum string | `cash` or approved financing mode |
| `bc_assumption_set` | string | assumption set identifier |
| `bc_assumption_version` | string | version stamp used for the result |

### Required result summary fields

Only approved deterministic outputs may be transported as result values.

| Key | Type | Meaning |
| --- | --- | --- |
| `bc_government_fees` | number string | sum of approved government-fee line items |
| `bc_closing_cost` | number string | approved closing-cost subtotal |
| `bc_total_cash_needed` | number string | final approved decision number shown to the user |

### Optional editable-assumption fields

These fields may be included when the later estimator UI exposes them and when they materially affect advisor follow-up.

| Key | Type | Meaning |
| --- | --- | --- |
| `bc_agent_fee` | number string | selected editable agent-fee assumption |
| `bc_lawyer_fee` | number string | selected editable lawyer-fee assumption |
| `bc_bank_transfer_cost` | number string | selected bank-transfer-cost assumption |
| `bc_fx_estimate` | number string | selected exchange-cost estimate |

### Required unresolved-state fields

These fields prevent the advisor handoff from overstating certainty.

| Key | Type | Meaning |
| --- | --- | --- |
| `bc_unresolved_items` | comma-separated string | blocked or placeholder items not included in deterministic totals |
| `bc_disclaimer_key` | string | lookup key for the approved disclosure copy shown with the result |

## Serialization Rules

The estimator handoff must follow these rules:

1. include only applied result state, never draft form state
2. serialize numbers as plain decimal strings without locale formatting
3. omit empty optional values rather than sending empty strings
4. preserve only advisor-useful context, not internal UI state
5. keep localized labels out of the query and derive them from EN/TH dictionaries at render time

## Contact Page Rendering Contract

When estimator handoff data is present, the contact page must render:

1. a visible estimator handoff summary above the existing lead form
2. the core result values: property price, approved fees, total cash needed
3. a disclosure line indicating the result is assumption-led
4. any unresolved items as advisory notes, not as confirmed costs

The contact page must not:

- change the lead-form schema
- create estimator-specific CRM fields
- imply that unresolved fees are already priced into the deterministic total unless they actually are

## Default Message Contract

The existing contact default-message pattern should be reused.

Required meaning:

```text
I want to continue the buying-cost estimate with an advisor using the assumptions below.
```

Required summary content:

- purchase price
- purchase context
- ownership type
- selected transfer split
- government fees
- closing cost
- total cash needed
- unresolved items, if any

The default message must remain conservative and must not claim tax/legal certainty.

## Source Value Rules

Approved `source` values for Sprint 1:

| Source | Meaning |
| --- | --- |
| `buying_cost_estimator` | direct estimator-to-contact handoff |
| `buying_cost_share` | contact opened from a shared estimator result |

No other source values are approved yet for the estimator path.

## Compatibility Rules

This contract must coexist with the existing investor-tool handoff contract.

Required compatibility constraints:

- calculator fields such as `purchasePrice`, `grossYield`, and `netYield` remain unchanged
- estimator parsing must be isolated from calculator parsing by namespace
- the contact page may render multiple summary modes, but each mode must remain contract-driven and additive

## Dependencies For Later Issues

### For `#413` Estimator UI

- UI must collect inputs that can be serialized into the approved `bc_` handoff contract
- draft-only fields must not leak into the contact handoff

### For `#414` Cost Formula Engine

- result output must clearly distinguish approved deterministic totals from unresolved items
- only approved values may populate the result summary fields defined here

### For `#415` Estimator Page

- the page must expose a contact CTA that links into `/[locale]/contact` using this contract
- result cards must present the same numbers that later appear in the handoff summary

### For `#416` Share Result Link

- shared estimator URLs must preserve the same applied-state model used by the advisor handoff
- share links must not drop disclaimer or unresolved-item context

## Acceptance Criteria

This issue is complete only if the contract makes all of the following explicit:

1. the exact advisor handoff target route
2. the approved query namespace and required payload keys
3. the difference between deterministic results and unresolved items
4. how contact-page rendering stays additive to the current public form flow
5. how estimator handoff avoids colliding with the existing calculator contract

## Out Of Scope

This issue does not:

- build the estimator UI or page
- implement the query helpers yet
- add CRM fields or change lead-form submission payloads
- define analytics events for the estimator path
- approve any new route outside the existing contact flow