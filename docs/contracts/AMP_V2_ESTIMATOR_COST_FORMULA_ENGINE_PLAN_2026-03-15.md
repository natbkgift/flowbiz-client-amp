# AMP V2 Estimator Cost Formula Engine Plan

Date: 2026-03-15

Governance lock:
`edd5c6ae` on `origin/main`

Status:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this document is a `Sprint 1 implementation contract` for issue `#414`, not a release approval for the estimator backend itself

## Objective

Define the calculation logic shape, result contract, and execution boundary for the Buying Cost Estimator formula engine.

## Decision Summary

The approved Sprint 1 formula-engine model is:

1. one authoritative server-side calculation engine
2. client-side validation and rendering only, not a second source of formula truth
3. approved deterministic line items separated from unresolved items
4. versioned assumption-set inputs attached to every result

## Why Server-Authoritative Is Approved

The scope brief required the execution-boundary decision to be made from assumption governance, not convenience.

Server-authoritative calculation is approved because it:

- keeps one formula implementation for auditability
- avoids duplicated arithmetic drifting between TypeScript and Python
- makes assumption-set versioning explicit
- fits the repository rule that shared backend logic belongs in `packages/core`

This still satisfies the UX requirement for instant or near-instant calculation because the estimator UI can call the engine asynchronously without a full-page reload.

## Approved Execution Boundary

### Client responsibilities

- collect and validate UI input
- normalize request payload shape
- call the estimator calculation endpoint asynchronously
- render result summaries, disclaimers, and unresolved items
- serialize applied state for share and advisor handoff flows

### Server responsibilities

- own the formula logic
- resolve the approved assumption set
- compute approved deterministic line items
- return unresolved items separately
- stamp the result with assumption-set metadata

### Disallowed model

Sprint 1 does not approve:

- a browser-only formula engine as the primary source of truth
- hidden fallback formulas embedded in UI code
- independent client and server arithmetic implementations with no parity source

## Placement Contract

The approved implementation shape for later build work is:

1. formula logic in `packages/core`
2. API boundary exposed through backend/Next proxy path
3. browser calls routed through `/api/*`, not direct backend admin routes

Approved public entry direction:

```text
POST /api/tools/buying-cost
```

This route is the approved public contract owner for estimator calculation requests.

## Input Contract

The formula engine must accept a normalized request model aligned with the UI and fee-source contracts.

### Required input fields

| Field | Meaning |
| --- | --- |
| `purchase_context` | normalized calculation mode |
| `property_price` | base property price |
| `ownership_type` | ownership structure used by the estimate |
| `transfer_split` | payer split selection |
| `financing_mode` | cash or approved financing mode |
| `assumption_set_id` | approved assumption-set identifier |
| `assumption_set_version` | assumption-set version stamp |

### Optional editable assumption fields

| Field | Meaning |
| --- | --- |
| `agent_fee` | editable commercial assumption |
| `lawyer_fee` | editable legal-fee assumption |
| `bank_transfer_cost` | editable transfer-cost assumption |
| `fx_estimate` | editable currency-exchange estimate |

The engine must ignore unknown fields rather than silently calculating from them.

## Calculation Pipeline

The approved deterministic pipeline is:

```text
normalize request
-> resolve approved assumption set
-> determine eligible fixed line items by purchase context
-> apply editable assumptions
-> compute approved government fees subtotal
-> compute approved closing-cost subtotal
-> compute total cash needed
-> attach unresolved-item list
-> return assumption metadata and disclosure keys
```

## Line-Item Classes

The engine must classify every potential fee into one of three buckets.

### Deterministic fixed items

These may be calculated directly once the assumption set is approved.

- transfer fee baseline
- stamp duty baseline where applicable

### Deterministic editable items

These may be included only when present as approved editable assumptions.

- agent fee
- lawyer fee
- bank transfer cost
- currency exchange estimate

### Unresolved items

These must not be included in the deterministic totals.

- withholding tax
- any buyer-profile rule not covered by the normalized purchase-context model
- any legal/commercial rule lacking approval in the fee-source contract

## Response Contract

The formula engine must return a structured response that separates totals from advisory uncertainty.

### Required response fields

| Field | Meaning |
| --- | --- |
| `assumption_set_id` | assumption source used for the result |
| `assumption_set_version` | exact version used |
| `purchase_context` | normalized context applied |
| `line_items` | approved deterministic line items only |
| `government_fees` | approved government-fee subtotal |
| `closing_cost` | approved closing-cost subtotal |
| `total_cash_needed` | final deterministic total shown as the decision number |
| `unresolved_items` | excluded items requiring advisory/legal review |
| `disclaimer_key` | approved disclosure reference |

### Line-item fields

Each deterministic line item must expose:

```text
key
label_key
amount
source_type (fixed | editable)
included_in_total
```

## Performance and UX Contract

The formula engine must support near-instant UI behavior.

Approved UX rules:

1. async request/response with no page reload
2. deterministic results returned quickly enough for live scenario work
3. last good result may remain visible while a new request is pending
4. engine errors degrade to clear advisory messaging, not broken page state

Sprint 1 does not require offline calculation parity in the browser.

## Error and Safety Rules

The engine must reject or degrade safely when:

- property price is missing or invalid
- purchase context is unsupported
- assumption set is missing or unapproved
- editable assumptions contain invalid numeric values

Safety requirements:

- do not infer blocked fees from hidden defaults
- do not convert unresolved items into zero-valued deterministic line items
- do not expose internal error codes directly to end users

## Integration Rules

### For `#413` Estimator UI

- UI submits only the approved normalized input set
- UI must not reimplement formula arithmetic locally as the source of truth

### For `#415` Estimator Page

- page render uses this response contract for result display
- page copy must keep unresolved items visibly outside deterministic totals

### For `#416` Share Result Link

- share state must preserve the applied input set and assumption version that produced the result
- reopened share results should resolve against the same assumption version when available

### For `#418` Advisor Handoff Contract

- contact handoff serializes only approved response summary fields
- unresolved items flow through separately and remain advisory

## Acceptance Criteria

This issue is complete only if the contract makes all of the following explicit:

1. the authoritative execution boundary
2. the normalized input and structured response contracts
3. how deterministic vs unresolved items are separated
4. where the formula logic belongs in the repo
5. how instant UX is preserved without duplicating formula truth in the browser

## Out Of Scope

This issue does not:

- implement the endpoint or Python code yet
- approve mortgage modeling beyond the financing mode input
- add CRM or admin workflows
- define analytics event payloads
- authorize browser-only formula logic as production truth