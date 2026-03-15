# AMP V2 Epic To Issue Breakdown

Date: 2026-03-15

Governance lock:
`027ef62f` on `origin/main`

Status guardrail:

- `V1 closed / production-ready`
- `V2 roadmap only`
- no issue in this document may reopen V1 scope

## EPIC 1 — Advanced Search

| Issue | Description | Owner | Priority |
| --- | --- | --- | --- |
| search API | backend search endpoint | backend | high |
| search filters UI | filter panel | frontend | high |
| search results page | result grid | frontend | high |
| search pagination | paging system | backend | medium |
| search sorting | price/size/latest/recommended | backend | medium |
| search URL state | query sync | frontend | medium |
| search analytics contract | event naming and payloads | frontend | medium |
| search SEO rules | crawlable query/page rules | seo | medium |

## EPIC 2 — Buying Cost Estimator

| Issue | Description | Owner | Priority |
| --- | --- | --- | --- |
| estimator UI | form inputs | frontend | high |
| cost formula engine | calculation logic | backend | high |
| estimator page | tool page route | frontend | high |
| share result link | encoded/shareable result state | frontend | medium |
| fee assumption source | approved fee rules and disclosure copy | product/legal | high |
| advisor handoff contract | result-to-contact payload handoff | frontend | medium |

## EPIC 3 — V2 Architecture Preparation

| Issue | Description | Owner | Priority |
| --- | --- | --- | --- |
| data model review | property schema check | backend | high |
| search index strategy | db query plan | backend | high |
| SEO search strategy | crawlable search pages | seo | medium |
| route ownership decision | decide first owning route for V2 search | product/frontend | high |
| V2 scope boundary check | confirm no V1 pages are reopened | product | high |

## Sprint 1 Definition of Done

Sprint 1 does not build the features.

Sprint 1 is done only when:

```text
search scope brief approved
estimator scope brief approved
epic to issue breakdown approved
issues opened in GitHub
owners assigned
```

## Sprint 1 Risk Control

Sprint 1 must not touch:

```text
V1 pages
CRM
core layout
lead forms
```

Reason:

`V1` is locked and closed.

## Required Output After Sprint 1

- one approved search contract
- one approved buying-cost estimator contract
- one issue map with owner and priority
- one explicit implementation gate for Sprint 2
