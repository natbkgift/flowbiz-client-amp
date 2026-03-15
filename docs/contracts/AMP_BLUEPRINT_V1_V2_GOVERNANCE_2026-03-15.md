# AMP Blueprint Scope Governance (V1/V2)

Date: 2026-03-15

Source blueprint:
`d:\FlowBiz\FlowBiz Company\amp_pattaya_master_ux_blueprint.md`

Governance lock:
`027ef62f` on `origin/main`

## Purpose

The source blueprint mixes current website scope, future platform scope, benchmarks, prompts, execution notes, and strategic outcome language in one file.

From this date forward, AMP Pattaya status reporting must use a formal `V1 / V2` split instead of broad phrases such as:

- "all phases are done"
- "the blueprint is done"
- "the redesign is still unfinished"

Those phrases are too ambiguous for the current repo state.

## Official Scope Split

### V1 — Website / Advisory Experience

Track the repo as `V1` when the work directly affects the public website and advisory experience:

- strategy/positioning reflected on the site
- conversion architecture
- home IA + wireframe
- design system
- project detail page
- listing detail page
- area page
- insight/article page
- reusable components
- UX / accessibility / performance / SEO / tracking
- conversion funnel + listing card UX

### V2 — Platform Modules

Track the repo as `V2` when the work extends beyond the current advisory website into platform capabilities:

- advanced search
- investor tools expansion
- lead automation maturity beyond the current state
- AI matching
- market intelligence
- foreign buyer hub/system
- saved shortlist
- deal room / document vault
- acquisition system

## Sections Excluded From Product Status Roll-Up

The following blueprint content supports delivery but must not be rolled into the top-line `V1 / V2` product status:

- benchmark/reference lists
- implementation notes for developers
- ready-to-paste prompts
- code review checklist text
- expected impact / strategic impact / strategic result / strategic outcome sections

`Data architecture` should be tracked as a cross-cutting foundation when needed, but it is not part of the default `V1 / V2` status sentence unless explicitly requested.

## Official Status Vocabulary

| Term | Meaning | When to use it |
| --- | --- | --- |
| `V1 closed / production-ready` | The advisory website scope is complete enough to be treated as an operational baseline, not an active redesign track. | Use for the repo top-line status from this point forward. |
| `V2 roadmap only` | Platform-module scope is not part of the closed V1 baseline and must be treated as future staged expansion work. | Use for all top-line V2 reporting from this point forward. |
| `Supporting / excluded` | The blueprint content is strategic or operational guidance, not a product scope item. | Use for benchmark lists, prompts, and strategic-outcome appendices. |

## Canonical Status Sentence

Use this sentence when speaking to the team, stakeholders, or investors:

`AMP Pattaya repo is no longer a redesign prototype; V1 is closed and production-ready, while V2 is roadmap-only and must be tracked as staged platform expansion.`

Thai rendering:

`AMP Pattaya repo ไม่ใช่ prototype สำหรับงาน redesign แล้ว โดย V1 ถูกปิดเป็น production-ready แล้ว ส่วน V2 เป็น roadmap-only และต้องติดตามแยกเป็นงานขยายแพลตฟอร์มตามลำดับ`

## Official Definition Of `Approved`

For Sprint 1 planning, a document or issue set is considered `approved` only when all of the following are true:

1. there is explicit written approval that names the approved document set
2. there are no open scope objections remaining on those documents
3. there is no request to add features outside Sprint 1 planning scope
4. the approver explicitly confirms that implementation may begin later under the active guardrails

The following do not count as approval:

- "ok"
- "looks good"
- "go ahead"
- verbal or chat-only encouragement that does not name the approved documents

For Sprint 1, the minimum document set that must be named explicitly is:

- `docs/contracts/AMP_V2_SEARCH_SCOPE_BRIEF.md`
- `docs/contracts/AMP_V2_BUYING_COST_ESTIMATOR_SCOPE.md`
- `docs/contracts/AMP_V2_EPIC_TO_ISSUE_BREAKDOWN.md`

If approval comments introduce net-new scope such as saved search, recommendations, compare sync, CRM changes, or V1 redesign work, approval is not complete and the status remains `planning only`.

## Reporting Rules

1. Every status update must declare scope first: `V1`, `V2`, or `Supporting / excluded`.
2. Do not say `DONE` across the full master blueprint unless the statement explicitly excludes V2 roadmap modules.
3. `Phase A-E` reporting belongs under `V1` only.
4. Advanced search, AI, market intelligence, saved shortlist, deal room, and acquisition system must always be reported under `V2`.
5. Team and investor summaries should use one top-line sentence plus a V1/V2 split, not a raw list of blueprint headings.
6. Do not reopen or re-scope `V1` unless there is an explicit product decision that replaces this governance lock.
7. Do not report `master blueprint complete`.
8. All future status updates must distinguish:
   - `V1 closed / production-ready`
   - `V2 roadmap only`
9. Do not treat partial owner feedback as approval unless it satisfies the official definition above.

## Practical Interpretation for This Repo

- Current repo summary: `V1 closed / production-ready`
- Current platform summary: `V2 roadmap only`
- Current admin/CRM summary: `production-grade foundation already present`

This governance file supersedes ambiguous phrases that compress both website delivery and future platform roadmap into one status label.
