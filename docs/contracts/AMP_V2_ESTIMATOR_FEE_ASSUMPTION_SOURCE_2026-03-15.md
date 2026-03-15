# AMP V2 Estimator Fee Assumption Source

Date: 2026-03-15

Governance lock:
`34e8457c` on `origin/main`

Status:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- this document is a `Sprint 1 implementation contract` for issue `#417`, not a release approval for the estimator itself

## Objective

Define the approved assumption source, editable-vs-fixed fee boundaries, and disclosure-copy ownership for the Buying Cost Estimator.

This contract exists to prevent the estimator from presenting legal, tax, or commercial uncertainty as fact.

## Decision Summary

The Sprint 1 source-of-truth model is:

1. one approved estimator assumption set owned in product/legal contract form first
2. frontend and backend may only implement values and labels that appear in that approved assumption set
3. any fee or tax rule without explicit approval must be treated as a placeholder, not as a calculated fact

Sprint 1 does not authorize ad hoc fee values embedded in UI copy, client code, or API responses.

## Authoritative Assumption Layers

The estimator must separate assumptions into three layers.

### 1. Approved fixed assumptions

These values may be shipped once the estimator is built because they are already named in the approved scope brief.

| Assumption | Purchase context | Sprint 1 rule | Ownership |
| --- | --- | --- | --- |
| transfer fee baseline | Thai and foreign purchase flows | fixed baseline exists, but payer split remains user-selected input | product/legal |
| stamp duty baseline | Thai transfer flow only | fixed baseline exists in estimator scope brief | product/legal |

Fixed means the estimator may use the approved baseline percentage once implementation begins, but the UI must still label it as an estimate and reflect any user-selected split.

### 2. Editable assumptions

These values may appear as user-editable inputs or advanced assumptions because they are scenario-driven rather than universally fixed.

| Assumption | Purchase context | Sprint 1 rule | Ownership |
| --- | --- | --- | --- |
| transfer split | all supported flows | user-selectable input | frontend/product |
| agent fee | all supported flows | user-editable assumption | product/commercial |
| lawyer fee | foreign purchase flow | user-editable assumption with conservative default only after approval | product/legal |
| bank transfer cost | foreign purchase flow | user-editable assumption with conservative default only after approval | product/legal |
| currency exchange estimate | foreign purchase flow | user-editable assumption, never framed as guaranteed realized rate | product/legal |

Editable assumptions must always display the governing disclaimer copy near the result summary.

### 3. Placeholder assumptions

These values are explicitly not approved as deterministic calculator outputs in Sprint 1.

| Assumption | Why blocked from deterministic output | Required next step |
| --- | --- | --- |
| withholding tax | depends on case-specific seller/tax conditions not locked in the current planning set | legal/commercial sign-off before formula build |
| nationality-to-rule mapping details | scope brief leaves direct nationality modeling vs purchase-context normalization open | resolve in estimator UI contract before implementation |
| any legal-certainty claim | would overstate advisory certainty | keep copy assumption-led only |

Placeholder assumptions may be described in copy as items that can affect closing cost, but they must not be auto-calculated or represented as approved rules in Sprint 1.

## Required Assumption Set Shape

Any future implementation source, whether client-side, server-side, or hybrid, must be able to represent the following fields:

```text
assumption_set_id
assumption_set_version
purchase_context
ownership_type
buyer_profile_mode
line_item_key
line_item_label
calculation_mode (fixed | editable | placeholder)
default_value
default_unit
disclaimer_key
owner_domain
approved_at
```

Sprint 1 does not require this to exist as a runtime table yet.

Sprint 1 does require all later formula-engine work to preserve this conceptual schema so that legal/commercial review remains auditable.

## Disclosure Copy Ownership

The estimator must use a two-layer disclosure model.

### Result-level disclosure

Required meaning:

```text
This output is an estimate based on current assumptions, not legal or tax advice.
```

Ownership:

- product/legal writes and approves the canonical EN/TH copy
- frontend may place the copy, but may not rewrite the meaning during implementation

### Line-item disclosure

Required meaning:

```text
Some fees vary by deal structure, buyer profile, seller situation, and legal review.
```

Ownership:

- product/legal owns the canonical disclaimer text
- frontend may attach the disclosure to editable and placeholder items

## Baseline Reuse From Existing Public Guidance

The estimator should reuse the repo's current conservative guidance pattern rather than inventing a new tone.

Relevant current surfaces:

- `admin-app/components/knowledge/TransferFeesBreakdown.tsx`
- `admin-app/components/knowledge/ForeignQuotaExplainer.tsx`
- `admin-app/components/knowledge/OwnershipComparison.tsx`
- `admin-app/app/_lib/i18n/th.ts`

Implication:

- estimator copy should remain assumption-led
- estimator copy must avoid certainty claims
- estimator outputs should align with the current public guidance tone before any deeper legal source registry exists

## Implementation Guardrails For Later Issues

This contract unlocks later implementation only under the following constraints.

### For `#413` Estimator UI

- UI must visually distinguish fixed, editable, and unresolved items
- unresolved items may appear as advisory notes, not as approved numeric outputs
- buyer nationality handling must not outrun the approved purchase-context model

### For `#414` Cost Formula Engine

- the engine may only compute approved fixed and editable assumptions
- placeholder items must remain excluded from deterministic totals until separately approved
- no hidden fallback percentages may be embedded in client or server code

### For `#415` Estimator Page

- result summary must keep property price separate from fees
- total cash needed may only aggregate approved numeric items
- unresolved items must remain disclosed outside the deterministic total

### For `#416` Share Result Link

- share state may include selected inputs and editable assumptions
- share state must not imply that omitted placeholder items were already fully priced in

### For `#418` Advisor Handoff Contract

- handoff payload must carry the assumption context and disclaimer state
- advisor handoff must not flatten placeholder items into confirmed costs

## Acceptance Criteria

This issue is complete only if the contract makes all of the following explicit:

1. which fee items are fixed, editable, and placeholder
2. who owns the canonical disclosure copy
3. what later implementation layers may and may not calculate
4. how the estimator avoids presenting legal or tax ambiguity as fact
5. how future UI, formula, page, and share-link work stay aligned to one assumption source

## Out Of Scope

This issue does not:

- build the estimator UI
- implement a formula engine
- add new APIs or tables
- rewrite contact, compare, or calculator flows
- approve any legal or tax claim beyond the scope brief baseline