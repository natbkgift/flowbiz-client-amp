# AMP V2 Shortlist UX Completion Report

Date: 2026-03-15

Report scope:

- completed Sprint 2 Shortlist UX implementation slices
- route ownership confirmation
- UX surface summary
- guardrail verification
- validation summary
- remaining intentionally out-of-scope items
- impact on advisory platform capability
- recommendation for the next governance scope

Execution status:

- Shortlist UX implementation completed for the full approved Sprint 2 slice chain
- no new implementation started after the final share slice merged
- this report is created as a governance handoff artifact only

## Executive Summary

Sprint 2 Shortlist UX execution completed the four approved implementation slices under the active implementation gate while keeping all protected surfaces unchanged.

Execution outcome:

1. shortlist UX was delivered as an additive public interaction layer on top of the existing shortlist API foundation
2. entry points, review surface, save/remove synchronization, and controlled share flow were merged one slice at a time
3. session-first shortlist ownership remained unchanged throughout the full slice chain
4. every PR merged only after local validation and green required CI checks
5. execution is now intentionally paused pending governance selection of the next scope

## 1. Implemented Slices

The completed Shortlist UX slice chain is:

| Slice | Issue | PR | Outcome |
| --- | --- | --- | --- |
| Shortlist entry points and CTA placement | `#469` | `#470` | added direct save CTAs on property surfaces and shortlist-oriented entry CTAs on approved project, compare, and smart-finder surfaces |
| Shortlist panel / list view surface | `#471` | `#472` | launched additive shortlist review surface at localized shortlist routes with ordered item review and approved next steps |
| Save/remove interaction UX | `#473` | `#474` | synchronized shortlist save/remove state across property surfaces and shortlist review surface with clean empty-state handling |
| Share shortlist UX flow | `#475` | `#476` | added controlled read-only share flow from the shortlist surface and public shared shortlist route |

Implemented public surfaces now include:

- `/en/shortlist`
- `/th/shortlist`
- `/en/shortlist/shared/[shareToken]`
- `/th/shortlist/shared/[shareToken]`

Delivered shortlist UX capability now includes:

1. shortlist entry points on shortlist-ready property surfaces
2. shortlist-oriented routing from approved project-first discovery surfaces
3. dedicated shortlist review surface
4. synchronized save/remove interaction state
5. controlled read-only share flow from shortlist surface only
6. public shared shortlist read-only route

## 2. Route Ownership Confirmation

Route ownership remained aligned to the approved implementation direction.

Confirmed shortlist state owner:

- `apps/api/routes/v1/shortlists.py`

Confirmed shortlist API contract kept in place:

1. `GET /v1/shortlists/current`
2. `POST /v1/shortlists/current/items`
3. `DELETE /v1/shortlists/current/items/{property_id}`
4. `POST /v1/shortlists/current/share`
5. `GET /v1/shortlists/shared/{share_token}`

Confirmed public UX route owners:

1. localized site shortlist review route at `admin-app/app/(site)/[locale]/shortlist/page.tsx`
2. localized shared shortlist read-only route at `admin-app/app/(site)/[locale]/shortlist/shared/[shareToken]/page.tsx`
3. additive shortlist entry controls on existing approved public surfaces only

Ownership conclusion:

- shortlist state ownership remained API-owned
- public UX remained in the existing localized site route family
- no shortlist ownership moved into CRM, admin, homepage, advisory funnel, or a separate workspace module

## 3. UX Surface Summary

The completed UX surface set is intentionally limited to the approved shortlist scope.

Implemented surface summary:

1. property listing cards on shortlist-ready browse surfaces expose direct session shortlist save state
2. property detail CTA region exposes direct shortlist save/remove state
3. project inventory, project detail, compare, and smart-finder surfaces remain shortlist-oriented entry surfaces rather than project-level save owners
4. shortlist review route exposes ordered saved listings with concise facts and approved next steps
5. shortlist review route handles empty state and remove interaction cleanly
6. shortlist review route exposes controlled share-link creation only from the shortlist surface
7. shared shortlist route exposes public read-only viewing only and does not allow editing

UX conclusion:

- the delivered shortlist UX now supports public shortlist review, interaction continuity, and read-only sharing without reopening auth, CRM, or advisory funnel ownership

## 4. Guardrail Verification

Execution was checked against the active Shortlist UX implementation gate and architecture guardrails.

Verified guardrails:

1. additive-only implementation strategy maintained throughout
2. one issue, one branch, and one PR used per slice
3. merge occurred only after required CI checks passed
4. V1 pages remained untouched
5. CRM remained untouched
6. lead forms remained untouched
7. core layout remained untouched
8. homepage remained untouched
9. advisory funnel ownership remained untouched
10. no redesign shipped outside approved shortlist surfaces
11. session-first shortlist ownership remained unchanged
12. project-level save behavior was not invented where the backend contract remained property-based

Guardrail conclusion:

- the full Shortlist UX slice chain completed without reopening protected V1, CRM, homepage, or advisory-owned surfaces

## 5. Validation Summary

Validation pattern used across the implementation chain:

1. targeted shortlist frontend tests for touched surfaces
2. shortlist-adjacent regression coverage for nearby discovery/advisory-safe surfaces
3. `git diff --check`
4. `npm --prefix admin-app run build`
5. `npm --prefix admin-app run test:smoke:admin`
6. required GitHub checks before merge

Representative local validation commands used in the slice chain:

- `npm --prefix admin-app run test -- __tests__/shortlist_save_button.test.tsx __tests__/shortlist_entry_surfaces.test.tsx __tests__/investor_handoff_regression.test.ts`
- `npm --prefix admin-app run test -- __tests__/shortlist_save_button.test.tsx __tests__/shortlist_list_surface.test.tsx __tests__/shortlist_entry_surfaces.test.tsx __tests__/investor_handoff_regression.test.ts`
- `npm --prefix admin-app run test -- __tests__/shortlist_save_button.test.tsx __tests__/shortlist_list_surface.test.tsx __tests__/shortlist_share_flow.test.tsx __tests__/shortlist_shared_surface.test.tsx __tests__/shortlist_entry_surfaces.test.tsx __tests__/investor_handoff_regression.test.ts`
- `git diff --check`
- `npm --prefix admin-app run build`
- `npm --prefix admin-app run test:smoke:admin`

Per-PR required checks:

- `CI Governance Gates`
- `Admin Smoke E2E`

Validation outcome:

- all four Shortlist UX PRs merged with green required checks
- shortlist coverage now includes entry surfaces, shortlist review surface, synchronized save/remove behavior, share creation, and shared shortlist read-only rendering

## 6. Remaining Intentionally Out-Of-Scope Items

The completed Shortlist UX implementation does not implement the following features and does not reopen them implicitly:

1. authenticated shortlist continuity across devices or accounts
2. CRM creation, advisor assignment, routing, or follow-up automation from shortlist actions
3. lead form changes or new shortlist-specific conversion flows
4. homepage, core layout, or advisory funnel redesign
5. project-level save ownership outside the existing property-based shortlist contract
6. editable shared shortlist collaboration or multi-user workspace behavior
7. deal-room, workspace, negotiation, or transaction-management features
8. admin-side shortlist moderation or publishing workflows
9. automatic shortlist-to-compare or shortlist-to-contact orchestration beyond the existing adjacent CTAs

Scope conclusion:

- the current Shortlist UX layer is a governed public shortlist interaction surface, not an authenticated workspace, CRM workflow, or collaborative deal-room

## 7. Impact On Advisory Platform Capability

The completed work strengthens advisory platform capability without changing advisory funnel ownership.

Observed platform impact:

1. the platform now has a usable public shortlist flow from discovery through review and read-only sharing
2. shortlist behavior is now visible and consistent across approved property and shortlist surfaces
3. users can preserve and review intent before contact without forcing CRM or auth decisions early
4. advisor/contact escalation remains separate and unchanged beside shortlist behavior
5. public discovery surfaces now support stronger pre-contact intent capture without introducing a new lead workflow owner

Practical effect:

- the advisory platform gains a clearer mid-funnel discovery aid that improves shortlist continuity and shareability while leaving advisor escalation and CRM ownership intact

## 8. Recommendation For Next Scope

Execution should now stop until governance selects the next action.

Recommended immediate next scope:

- governance-led Sprint 2 closeout and scope selection rather than immediate new implementation

Assessment:

- strongest next step after completion of the full Shortlist UX slice chain
- creates a clean checkpoint after shortlist review, interaction synchronization, and share capability are now live under one completed gate
- avoids reopening new implementation while governance has not yet selected the next approved track

Advantages:

1. formalizes the completed Sprint 2 Shortlist UX state before any new gate opens
2. reduces ambiguity around what is intentionally complete versus intentionally out of scope
3. gives governance a clean basis to choose whether the next track should be closeout, deeper shortlist continuity, or another Sprint 2 candidate

Risks:

1. does not add another user-facing capability immediately
2. defers any authenticated continuity, CRM-linked shortlist behavior, or broader workspace design discussion to a later decision

Recommendation status:

- recommended as the next step

## Hold State

Execution is intentionally paused after this report.

Repository state at report authoring start:

- branch: `main`
- working tree: clean
- `origin/main`: synced
- HEAD before report commit: `785708fe`
- final shortlist execution merge commit: `785708fe4c8b59fe6805100719408b491b73be76`

Next required action:

- wait for governance decision before opening the next implementation gate