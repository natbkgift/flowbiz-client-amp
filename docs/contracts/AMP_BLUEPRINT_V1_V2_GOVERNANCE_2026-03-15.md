# AMP Blueprint Scope Governance (V1/V2)

Date: 2026-03-15

Source blueprint:
`d:\FlowBiz\FlowBiz Company\amp_pattaya_master_ux_blueprint.md`

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
| `V1 production-ready` | The advisory website is implemented, validated, and usable in production. | Use for the current repo summary. |
| `V1 largely implemented` | Most V1 scope exists, but a few material UX or readiness gaps remain. | Use for intermediate delivery reports. |
| `V2 partial` | A V2 module has real implementation or foundations, but is not yet a complete product capability. | Use for smart finder, investor tooling, CRM maturity, or similar in-progress modules. |
| `V2 missing` | The blueprint module is not implemented as a product feature in this repo. | Use for saved shortlist, deal room, or acquisition system product surfaces. |
| `Supporting / excluded` | The blueprint content is strategic or operational guidance, not a product scope item. | Use for benchmark lists, prompts, and strategic-outcome appendices. |

## Canonical Status Sentence

Use this sentence when speaking to the team, stakeholders, or investors:

`AMP Pattaya repo is no longer a redesign prototype; it is a largely implemented V1 advisory website with production-grade CRM/admin foundations, while several V2 platform modules remain partial or missing.`

Thai rendering:

`AMP Pattaya repo ไม่ใช่ prototype สำหรับงาน redesign แล้ว แต่เป็น V1 advisory website ที่ implement ไปมากและมีฐาน CRM/admin ระดับ production แล้ว ขณะที่ V2 platform modules หลายส่วนยังอยู่ในสถานะ partial หรือยังไม่มี`

## Reporting Rules

1. Every status update must declare scope first: `V1`, `V2`, or `Supporting / excluded`.
2. Do not say `DONE` across the full master blueprint unless the statement explicitly excludes V2 roadmap modules.
3. `Phase A-E` reporting belongs under `V1` only.
4. Advanced search, AI, market intelligence, saved shortlist, deal room, and acquisition system must always be reported under `V2`.
5. Team and investor summaries should use one top-line sentence plus a V1/V2 split, not a raw list of blueprint headings.

## Practical Interpretation for This Repo

- Current repo summary: `V1 production-ready`
- Current platform summary: `V2 partial / missing depending on module`
- Current admin/CRM summary: `production-grade foundation already present`

This governance file supersedes ambiguous phrases that compress both website delivery and future platform roadmap into one status label.
