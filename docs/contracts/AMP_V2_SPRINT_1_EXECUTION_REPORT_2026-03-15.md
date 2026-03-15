# AMP V2 Sprint 1 Execution Report

Date: 2026-03-15

Report scope:

- architecture preparation `#419`-`#423`
- search foundation `#405`-`#412`
- estimator foundation `#413`-`#418`
- guardrail verification
- CI results
- repository state

Execution status:

- Sprint 1 execution completed
- no further implementation started after Sprint 1 completion
- report created after all Sprint 1 execution issues and epics were closed

## Executive Summary

Sprint 1 execution completed the approved architecture-preparation chain, the search foundation chain, and the estimator foundation chain under the locked governance gate.

Execution outcome:

1. architecture-preparation dependencies were resolved first
2. search scope was completed next, including the only runtime implementation issue in Sprint 1: `#405` Search API
3. estimator scope was completed after its governance dependencies were locked
4. all issue-linked PRs merged only after required CI checks passed
5. repository remained additive-only with no approved reopening of V1 pages, CRM, lead forms, or core layout

## 1. Architecture Preparation (`#419`-`#423`)

Purpose:

- resolve the prerequisite planning and guardrail decisions before search and estimator implementation work

Completed issues:

| Issue | Outcome | Main artifact | PR |
| --- | --- | --- | --- |
| `#419` Data Model Review | property/search data fit reviewed | `docs/contracts/AMP_V2_DATA_MODEL_REVIEW_2026-03-15.md` | `#424` |
| `#420` Search Index Strategy | search query/index approach locked | `docs/contracts/AMP_V2_SEARCH_INDEX_STRATEGY_2026-03-15.md` | `#425` |
| `#421` SEO Search Strategy | crawl/index strategy locked | `docs/contracts/AMP_V2_SEO_SEARCH_STRATEGY_2026-03-15.md` | `#426` |
| `#422` Route Ownership Decision | `/[locale]/buy` locked as search owner | `docs/contracts/AMP_V2_ROUTE_OWNERSHIP_DECISION_2026-03-15.md` | `#427` |
| `#423` V2 Scope Boundary Check | V1/V2 boundary and blocked scope confirmed | `docs/contracts/AMP_V2_SCOPE_BOUNDARY_CHECK_2026-03-15.md` | `#428` |

Execution result:

- search and estimator execution proceeded only after this dependency chain merged cleanly
- route ownership, data fit, SEO direction, and scope boundaries were documented before downstream work started

## 2. Search Foundation (`#405`-`#412`)

Purpose:

- establish the approved search API and the downstream contracts needed for UI, URL state, analytics, pagination, sorting, and SEO

### 2.1 Runtime implementation completed

Issue `#405` Search API was the only runtime implementation issue in this track.

Runtime changes delivered:

- added search response models in `packages/core/schemas/property_api.py`
- added a dedicated `search_properties(...)` handler in `apps/api/routes/v1/properties.py`
- exposed public `/search` and `/search/` aliases in `apps/api/main.py`
- added targeted coverage in `tests/test_b15_search_api.py`

Approved behavior delivered:

- property-first filtering for active buy inventory
- deterministic search sorting
- offset pagination contract
- enrichment of project and area display values after row narrowing

Validation completed for `#405`:

- targeted search API tests passed
- related property contract tests passed
- lint/ruff checks for touched Python paths passed

PR:

- `#429`

### 2.2 Search planning contracts completed

The remaining search issues were completed as additive Sprint 1 contracts, consistent with the approved planning scope and V1 lock.

| Issue | Outcome | Main artifact | PR |
| --- | --- | --- | --- |
| `#406` Search Filters UI | filter model and interaction plan locked | `docs/contracts/AMP_V2_SEARCH_FILTERS_UI_PLAN_2026-03-15.md` | `#430` |
| `#407` Search Results Page | results-region/page composition locked | `docs/contracts/AMP_V2_SEARCH_RESULTS_PAGE_PLAN_2026-03-15.md` | `#431` |
| `#408` Search Pagination | offset pagination contract locked | `docs/contracts/AMP_V2_SEARCH_PAGINATION_PLAN_2026-03-15.md` | `#432` |
| `#409` Search Sorting | canonical sort semantics locked | `docs/contracts/AMP_V2_SEARCH_SORTING_PLAN_2026-03-15.md` | `#433` |
| `#410` Search URL State | applied-state query model locked | `docs/contracts/AMP_V2_SEARCH_URL_STATE_PLAN_2026-03-15.md` | `#434` |
| `#411` Search Analytics Contract | event namespace and payload baseline locked | `docs/contracts/AMP_V2_SEARCH_ANALYTICS_CONTRACT_2026-03-15.md` | `#435` |
| `#412` Search SEO Rules | canonical/noindex/crawl rules locked | `docs/contracts/AMP_V2_SEARCH_SEO_RULES_2026-03-15.md` | `#436` |

Execution result:

- the full search foundation chain `#405`-`#412` completed and merged
- public search route ownership, sorting, pagination, state, analytics, and SEO were all contract-bound before later feature work

## 3. Estimator Foundation (`#413`-`#418`)

Purpose:

- establish the fee-governance, advisor handoff, UI, formula, page-placement, and share-state contracts for the Buying Cost Estimator

Execution note:

- estimator execution respected the gate ordering in `AMP_V2_SPRINT_1_IMPLEMENTATION_GATE_2026-03-15.md`
- governance dependencies `#417` and `#418` were completed before the dependent UI/page/share work moved forward

Completed issues:

| Issue | Outcome | Main artifact | PR |
| --- | --- | --- | --- |
| `#417` Fee Assumption Source | fixed/editable/placeholder fee governance locked | `docs/contracts/AMP_V2_ESTIMATOR_FEE_ASSUMPTION_SOURCE_2026-03-15.md` | `#437` |
| `#418` Advisor Handoff Contract | `/contact` handoff payload and `bc_` namespace locked | `docs/contracts/AMP_V2_ESTIMATOR_ADVISOR_HANDOFF_CONTRACT_2026-03-15.md` | `#438` |
| `#413` Estimator UI | input groups and interaction model locked | `docs/contracts/AMP_V2_ESTIMATOR_UI_PLAN_2026-03-15.md` | `#439` |
| `#414` Cost Formula Engine | server-authoritative execution boundary locked | `docs/contracts/AMP_V2_ESTIMATOR_COST_FORMULA_ENGINE_PLAN_2026-03-15.md` | `#440` |
| `#415` Estimator Page | dedicated route and module placement locked | `docs/contracts/AMP_V2_ESTIMATOR_PAGE_PLAN_2026-03-15.md` | `#441` |
| `#416` Share Result Link | transparent applied-state share model locked | `docs/contracts/AMP_V2_ESTIMATOR_SHARE_RESULT_LINK_PLAN_2026-03-15.md` | `#442` |

Execution result:

- estimator foundation completed without starting runtime implementation beyond the approved Sprint 1 scope
- fee-source governance, handoff semantics, UI behavior, formula boundary, route ownership, and share-state behavior are now contract-bound for the next gate

## 4. Guardrail Verification

Sprint 1 execution was checked against the non-negotiable constraints from the implementation gate and architecture guardrails.

Verified guardrails:

1. dependency order respected
2. one issue worked at a time
3. one branch per issue
4. one PR per issue
5. merge only after CI success
6. additive-only change strategy
7. no CRM redesign
8. no core-layout change
9. no lead-form change
10. no reopening of locked V1 pages
11. no Sprint 2+ implementation bundled into Sprint 1 work

Behavioral verification:

- search runtime work was limited to the approved API foundation issue `#405`
- all other Sprint 1 issues in the completed chain were resolved as planning/contract artifacts where the issue language and gate required it
- estimator execution did not begin until its governance dependencies were locked

## 5. CI Results

Per-PR merge gate:

- `CI Governance Gates` passed before merge for each Sprint 1 PR in this execution set
- `Admin Smoke E2E` passed before merge for each Sprint 1 PR in this execution set

Additional targeted validation performed:

- `#405` search runtime implementation received targeted backend test validation and lint checks before merge
- docs-only issues were validated with `git diff --check` before commit/PR

Merged PR chain covered in Sprint 1 execution:

- architecture preparation: `#424`, `#425`, `#426`, `#427`, `#428`
- search foundation: `#429`, `#430`, `#431`, `#432`, `#433`, `#434`, `#435`, `#436`
- estimator foundation: `#437`, `#438`, `#439`, `#440`, `#441`, `#442`

CI outcome summary:

- no Sprint 1 PR in the executed chain was merged with failing required checks

## 6. Repository State

Repository state at report authoring start:

- branch: `main`
- working tree: clean
- HEAD before report commit: `02f10c7f`

Issue/epic state:

- epic `#402` Advanced Search: closed
- epic `#403` Buying Cost Estimator: closed
- epic `#404` V2 Architecture Preparation: closed
- issue chain `#405`-`#423`: closed

Execution-state conclusion:

- Sprint 1 execution is complete for the approved chain covered by this gate
- no new implementation should begin until the next governance gate is opened

## 7. Final Sprint 1 Outcome

Sprint 1 execution delivered:

1. completed architecture-preparation prerequisites
2. completed search foundation with one approved runtime API implementation and downstream contracts
3. completed estimator foundation as a full contract set for the next execution gate
4. maintained the V1 lock and additive-only constraints throughout execution
5. left the repository on `main` in a clean, merge-complete state before this report commit

## 8. Hold State

Execution is intentionally paused after this report.

Next step required:

- wait for the next governance gate before starting additional implementation