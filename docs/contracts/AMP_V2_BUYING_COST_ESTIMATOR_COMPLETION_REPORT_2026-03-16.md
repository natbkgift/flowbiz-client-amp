# AMP V2 Buying Cost Estimator Completion Report

Date: 2026-03-16

Report scope:

- completed Buying Cost Estimator implementation slices
- route ownership confirmation
- UI surface summary
- formula, share, and advisor handoff summary
- guardrail verification
- validation summary
- remaining intentionally out-of-scope items
- impact on advisory platform capability
- recommendation for the next governance scope

Execution status:

- Buying Cost Estimator implementation completed for the full approved slice chain
- no new implementation started before the full estimator chain merged on `main`
- this report is created as a governance handoff artifact only

## Executive Summary

The Buying Cost Estimator execution completed all five approved slices under the active implementation gate while keeping the protected V1, CRM, and advisory-owned surfaces unchanged.

Execution outcome:

1. a dedicated localized estimator route was delivered as an additive public buyer tool separate from the protected `/buy` owner surface
2. the UI contract, server-authoritative formula boundary, share-result reopen flow, and advisor handoff context were merged one slice at a time
3. deterministic totals remained assumption-led and advisory-safe, with unresolved items kept outside the deterministic total
4. advisor escalation remained additive through the existing contact route without changing CRM or lead-form ownership
5. every merged slice landed only after local validation and green required GitHub checks on the final merge path to `main`

## 1. Implemented Slices

The completed Buying Cost Estimator slice chain is:

| Slice | Issue | Final merged PR | Outcome |
| --- | --- | --- | --- |
| Route Owner And Page Shell | `#485` | `#486` | launched the dedicated localized estimator route with approved page composition, metadata, and advisory-safe expectation-setting copy |
| Estimator UI Contract Surface | `#487` | `#496` | replaced the shell placeholder with governed estimator inputs, validation, preview cards, and unresolved advisory-safe disclosure framing |
| Server-Authoritative Formula Engine | `#489` | `#497` | added the shared formula logic, public API boundary, and authoritative deterministic result rendering |
| Share Result Reopen Flow | `#492` | `#498` | serialized approved estimator state back onto the estimator route and reopened shared results safely on the same owner surface |
| Advisor Handoff Context | `#494` | `#499` | carried conservative `bc_*` summary context into the existing contact route without altering lead-form or CRM ownership |

Implementation note:

- original stacked PRs `#488`, `#490`, `#493`, and `#495` were superseded by replacement PRs `#496` through `#499` after the first stacked base branch was deleted during merge execution; the final merged path on `main` is `#486`, `#496`, `#497`, `#498`, `#499`

Delivered estimator capability now includes:

1. localized estimator route ownership at `/[locale]/buying-cost-estimator`
2. governed input collection for purchase context, ownership, transfer split, financing, and approved assumptions
3. server-authoritative deterministic totals and explicit unresolved items
4. share-state reopen behavior on the estimator route itself via approved `bc_*` query state
5. additive advisor handoff into `/[locale]/contact` with conservative summary context

## 2. Route Ownership Confirmation

Route ownership remained aligned to the approved implementation direction.

Confirmed owner surfaces:

1. localized estimator page owner at `admin-app/app/(site)/[locale]/buying-cost-estimator/page.tsx`
2. localized estimator client module owner at `admin-app/app/(site)/[locale]/buying-cost-estimator/_components/BuyingCostEstimatorShell.tsx`
3. public API proxy usage through `admin-app` on `/api/tools/buying-cost`
4. backend formula route owner at `apps/api/routes/tools.py`
5. existing advisor/contact owner at `admin-app/app/(site)/[locale]/contact/page.tsx`

Ownership conclusion:

- estimator route ownership stayed inside the approved additive localized site route family
- deterministic formula ownership stayed inside the shared backend and approved tools API surface
- advisor escalation reused the existing contact owner and did not move into CRM, admin, homepage, `/buy`, or advisory funnel ownership

## 3. UI Surface Summary

The completed public UI surface is intentionally limited to the approved estimator route and adjacent handoff context.

Implemented UI summary:

1. the estimator route presents localized explanatory copy, inputs, advanced assumptions, live validation, and conservative result framing
2. result presentation separates deterministic cost totals from unresolved items and disclosure keys
3. version-aware share-state reopen keeps estimator state on the estimator route and prevents silent drift when assumption identity mismatches
4. the estimator exposes a shareable reopen flow on the same route rather than moving state ownership into another surface
5. the contact route renders an additive estimator summary above the existing form when approved handoff query context is present

UI conclusion:

- the estimator UI now supports public buyer estimation, safe share continuity, and advisor escalation context without redesigning protected V1 browse or contact ownership

## 4. Formula, Share, And Advisor Handoff Summary

Execution was checked against the estimator formula, share-state, and advisor handoff contracts.

Verified behavior:

1. deterministic totals are computed through shared backend logic in `packages/core` rather than browser-only arithmetic
2. unresolved items remain visible and explicitly excluded from deterministic totals where authority remains case-specific
3. assumption-set identity and version are preserved in share-state where available
4. share reopen uses the estimator route itself and the approved `bc_*` namespace only
5. advisor handoff serializes conservative summary fields and unresolved items separately into the existing `/[locale]/contact` route
6. lead-form transport, CRM lifecycle, and advisor routing ownership remain unchanged

Behavior conclusion:

- the completed module is a governed public estimation and escalation surface, not a legal engine, CRM workflow, or advisory funnel rewrite

## 5. Guardrail Verification

Execution was checked against the active Buying Cost Estimator implementation gate and architecture guardrails.

Verified guardrails:

1. additive-only implementation strategy maintained throughout
2. one issue, one branch, and one PR used per slice at implementation time
3. merge occurred only after required GitHub checks passed on the final merge path
4. V1 pages remained untouched
5. CRM remained untouched
6. lead forms remained untouched
7. core layout remained untouched
8. homepage remained untouched
9. advisory funnel ownership remained untouched
10. `/buy` owner surface remained untouched
11. no schema change was introduced
12. no legal certainty, guarantee, or recommendation language was introduced

Guardrail conclusion:

- the full Buying Cost Estimator slice chain completed without reopening protected V1, CRM, homepage, `/buy`, or advisory-owned surfaces

## 6. Validation Summary

Validation pattern used across the implementation chain:

1. targeted frontend tests for estimator and handoff surfaces
2. targeted backend formula tests for deterministic calculation behavior
3. `git diff --check`
4. `npm --prefix admin-app run build`
5. `npm --prefix admin-app run test:smoke:admin`
6. required GitHub checks before merge

Representative local validation commands used in the slice chain:

- `npm --prefix admin-app run test -- __tests__/buying_cost_estimator_page.test.tsx`
- `npm --prefix admin-app run test -- __tests__/buying_cost_estimator_page.test.tsx __tests__/investor_handoff_regression.test.ts`
- `d:/FlowBiz/flowbiz-client-amp/.venv/Scripts/python.exe -m pytest -q tests/test_b15_buying_cost_estimator_formula.py`
- `git diff --check`
- `npm --prefix admin-app run build`
- `npm --prefix admin-app run test:smoke:admin`

Per-PR required checks on the final merge path:

- `CI Governance Gates`
- `Admin Smoke E2E`

Validation outcome:

- all final merged estimator PRs `#486`, `#496`, `#497`, `#498`, and `#499` landed with green required GitHub checks
- local validation remained green for the final estimator handoff state before merge

## 7. Remaining Intentionally Out-Of-Scope Items

The completed Buying Cost Estimator module does not implement the following features and does not reopen them implicitly:

1. legal certainty or advisor-only fee interpretation
2. hidden fee assumptions or guarantee language
3. CRM workflow branching, advisor assignment, or lead-form redesign
4. authenticated estimator history, saved calculations, or workspace continuity
5. homepage, core layout, `/buy`, or advisory funnel redesign
6. broader search/discovery ownership changes
7. schema changes for estimator persistence or contact-linked history
8. automatic recommendation behavior based on estimator output

Scope conclusion:

- the current estimator is a governed public cash-needed estimation surface, not a legal calculator, CRM feature, or authenticated buyer workspace

## 8. Impact On Advisory Platform Capability

The completed work strengthens advisory platform capability without changing advisory funnel ownership.

Observed platform impact:

1. the platform now has a dedicated public buyer estimation route for deterministic closing-cost framing
2. advisor conversations can begin from clearer cost context without exposing private advisory logic publicly
3. users can preserve and reopen estimator state safely before escalating to contact
4. the existing contact route can now receive conservative estimator context without CRM or lead-form changes
5. later additive buyer tooling can reuse the estimator's query-state and assumption-governance patterns

Practical effect:

- the advisory platform gains a stronger pre-contact buyer planning tool while keeping nuanced fee interpretation and case-specific judgment in the existing advisor path

## 9. Recommendation For Next Scope

Execution should now stop only long enough to open the next governance-selected implementation gate.

Recommended immediate next scope:

- Saved Shortlist implementation gate opening

Assessment:

- strongest remaining next implementation candidate under the current autonomous governance policy
- `Search` remains blocked because its first approved owner route still sits too close to the protected `/buy` advisory-funnel boundary under the recorded hard-stop policy
- Foreign Buyer Hub, Market Intelligence, Shortlist UX, Investor Decision Tools, and Buying Cost Estimator already have completion artifacts and should not be selected again
- `Saved Shortlist` has the clearest next architectural foundation in `AMP_V2_SHORTLIST_DATA_MODEL_DRAFT.md` and the Sprint 3 backlog objective for persistence, ownership, and save/share continuity

Advantages:

1. extends current shortlist UX into governed persistence without reopening CRM ownership
2. creates the cleanest bridge from public discovery into future workspace capability
3. can begin with a narrow persistence-model slice before broader auth or workspace behavior is considered

Risks:

1. owner model decisions must stay session-vs-user abstract until auth direction is explicitly approved
2. shortlist persistence must not blur into CRM lifecycle, collaboration, or deal-room scope

Recommendation status:

- recommended as the next implementation gate