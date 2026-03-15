# AMP V2 Backlog (4 Sprints)

Date: 2026-03-15

Governance lock:
`027ef62f` on `origin/main`

Status guardrail:

- `V1` remains `closed / production-ready`
- `V2` is `roadmap only`
- this backlog must not reopen or re-scope V1

## Active Source Of Truth For Sprint 1 Planning

The following four files are the only active source of truth for Sprint 1 planning:

- `docs/contracts/AMP_V2_SEARCH_SCOPE_BRIEF.md`
- `docs/contracts/AMP_V2_BUYING_COST_ESTIMATOR_SCOPE.md`
- `docs/contracts/AMP_V2_EPIC_TO_ISSUE_BREAKDOWN.md`
- `docs/contracts/AMP_V2_ARCHITECTURE_GUARDRAILS.md`

If there is any conflict between older roadmap notes and these four files, these four files win.

Sprint 1 implementation is governed separately by:

- `docs/contracts/AMP_V2_SPRINT_1_IMPLEMENTATION_GATE_2026-03-15.md`

This implementation gate does not replace the four planning sources above. It operationalizes the approved planning set for execution.

## Operating Rule

Sprint planning is active only for `Sprint 1` at this time.

`Sprint 2` to `Sprint 4` are roadmap placeholders with enough structure for sequencing, but they are not active implementation plans yet.

## Sprint 1 (Approved Planning / Implementation Gate Open)

Planning approval has been recorded and Sprint 1 implementation may begin only within:

- `docs/contracts/AMP_V2_SPRINT_1_IMPLEMENTATION_GATE_2026-03-15.md`

This does not reopen `V1`, does not activate Sprint 2-4, and does not change the top-line status that `V2` remains `roadmap only`.

### Epic 1: Advanced Search Foundation

- Objective:
  Build the first V2 search upgrade on top of the current smart-finder and listing inventory so users can filter and sort inventory with a stronger decision UX.
- Acceptance criteria:
  - a search entry point is defined for header, projects, and at least one guided landing route
  - filter set is agreed for `price`, `bedrooms`, `property type`, `area`, and `completion status`
  - secondary filters are explicitly scoped or deferred
  - desktop and mobile interaction model is documented
  - result-card reuse strategy is defined against the current listing/project components
  - analytics events for search submit, filter change, and result click are specified
- Dependencies:
  - current public inventory contracts
  - existing listing/project card surfaces
  - existing analytics event conventions
  - decision on whether search is project-led, listing-led, or hybrid in Sprint 1
- Risk level:
  `Medium`

### Epic 2: Buying Cost Estimator

- Objective:
  Add a dedicated V2 investor/buyer tool that estimates transfer and closing costs without reopening V1 page scope.
- Acceptance criteria:
  - tool purpose, inputs, outputs, and disclaimer language are documented
  - fee assumptions and editable rules are defined
  - ownership-type handling is explicitly scoped
  - handoff path into contact/advisor flow is defined
  - page placement decision is locked: dedicated route vs embedded module
  - tracking events for estimator start, calculate, and advisor handoff are specified
- Dependencies:
  - fee-policy source of truth
  - ownership/foreign-buyer guidance copy
  - contact handoff conventions already used by calculator and compare
- Risk level:
  `Medium`

### Epic 3: V2 Issue Breakdown

- Objective:
  Turn V2 roadmap scope into a delivery backlog with clean ownership boundaries and no ambiguity with V1.
- Acceptance criteria:
  - every V2 module is converted into an epic or issue bucket
  - each V2 item has scope, owner type, dependency note, and target sprint or parking-lot label
  - V1 items are explicitly excluded
  - status vocabulary matches the governance document
  - the team has one roadmap source of truth for V2 sequencing
- Dependencies:
  - `AMP_BLUEPRINT_V1_V2_GOVERNANCE_2026-03-15.md`
  - `AMP_BLUEPRINT_STATUS_MATRIX_2026-03-15.md`
- Risk level:
  `Low`

### Sprint 1 Deliverables

- V2 search scope brief
- buying cost estimator scope brief
- V2 epic breakdown and sequencing map

### Sprint 1 Non-Goals

- no V1 redesign work
- no deal room build
- no AI matching implementation
- no acquisition-system implementation

## Sprint 2 (Roadmap Placeholder)

### Epic 1: Foreign Buyer Hub Consolidation

- Objective:
  Consolidate foreign-buyer guidance into a dedicated V2 module with clearer ownership, process, and document guidance.
- Acceptance criteria:
  - hub scope and page/module structure defined
  - ownership guide, process guide, and FAQ surfaces defined
  - advisor CTA path defined
- Dependencies:
  - current buy/investment guidance content
  - legal/copy review
- Risk level:
  `Medium`

### Epic 2: Public Market Intelligence Module

- Objective:
  Turn current market signals into a dedicated public-facing intelligence surface.
- Acceptance criteria:
  - section model defined for market overview, area comparison, and investment signals
  - data freshness/display rules defined
  - authority CTA and internal linking plan defined
- Dependencies:
  - area/project statistics sources
  - content sign-off for market framing
- Risk level:
  `Medium`

## Sprint 3 (Roadmap Placeholder)

### Epic 1: Saved Shortlist

- Objective:
  Create a persistent shortlist layer that bridges current compare/contact flows into future workspace capabilities.
- Acceptance criteria:
  - shortlist persistence model defined
  - add/remove/save UX defined
  - user/session model decision locked
- Dependencies:
  - auth/session decision
  - compare and listing card reuse
- Risk level:
  `High`

### Epic 2: Lead Automation Maturity

- Objective:
  Extend current CRM/admin foundations into stronger automation and routing behavior.
- Acceptance criteria:
  - automation candidates listed
  - follow-up triggers identified
  - outbound/integration plan defined
- Dependencies:
  - current inquiry lifecycle
  - notification/integration decisions
- Risk level:
  `Medium`

## Sprint 4 (Roadmap Placeholder)

### Epic 1: AI Matching Spike

- Objective:
  Validate whether a stronger matching system should evolve from the current deterministic recommendation layer.
- Acceptance criteria:
  - matching hypotheses defined
  - required data signals listed
  - go/no-go recommendation produced
- Dependencies:
  - event data quality
  - saved-shortlist and search usage data
- Risk level:
  `High`

### Epic 2: Deal Room / Document Vault Architecture

- Objective:
  Define the minimum architecture for a secure buyer workspace without committing to premature implementation.
- Acceptance criteria:
  - access model defined
  - document scope defined
  - security and storage assumptions listed
- Dependencies:
  - shortlist persistence direction
  - auth/user-workspace decision
- Risk level:
  `High`

### Epic 3: Acquisition System Integration Plan

- Objective:
  Decide how much of the acquisition system belongs in product vs marketing operations.
- Acceptance criteria:
  - product vs ops boundary documented
  - required integrations listed
  - implementation recommendation produced
- Dependencies:
  - marketing operating model
  - CRM tracking requirements
- Risk level:
  `Medium`

## Recommended Execution Order

1. Sprint 1 implementation only within the approved gate
2. Sprint 2 delivery only after Sprint 1 execution confirms the scope and a new gate is opened
3. Sprint 3 only after shortlist persistence and CRM direction are approved
4. Sprint 4 only after data, auth, and storage assumptions are mature enough

## Status Language For All Future V2 Reporting

Use:

- `V1 closed / production-ready`
- `V2 roadmap only`

Do not use:

- `master blueprint complete`
- `all phases done`
- `V1 reopened`
