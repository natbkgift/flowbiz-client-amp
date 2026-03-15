# AMP V2 Foreign Buyer Hub Scope Brief

Date: 2026-03-15

Status guardrail:

- `V1` remains `closed / production-ready`
- `V2` remains `roadmap only`
- Sprint 2 remains `planning only`
- this brief is additive and architectural only

## Objective

Define a dedicated V2 Foreign Buyer Hub that consolidates foreign-buyer guidance into one governed public module without reopening current V1 buy, investment, or advisory funnel ownership.

The hub should reduce fragmentation across existing guidance, make the international-buyer workflow easier to understand, and create a clearer advisory handoff path.

## Scope Summary

The planned hub should cover four content layers:

1. foreign ownership basics
2. purchase process and required steps
3. document guidance and preparation checklist
4. advisor CTA path for case-specific follow-up

The hub is a planning-only V2 module at this stage. No route, UI, or copy implementation is approved by this brief.

## Proposed Module Structure

### 1. Ownership and eligibility module

Purpose:

- explain the high-level foreign-buyer ownership model in conservative language
- clarify where condo, quota, and legal-structure guidance starts and stops

Planned subtopics:

- foreign quota basics
- ownership-type overview
- when legal review is required

### 2. Buying process module

Purpose:

- show the sequence from discovery to reservation, contract review, transfer, and post-purchase setup

Planned subtopics:

- shortlist and property review
- reservation and due diligence stage
- transfer preparation
- post-transfer support expectations

### 3. Document guidance module

Purpose:

- define which documents should be prepared and which items remain advisory rather than guaranteed requirements

Planned subtopics:

- identity/passport baseline
- funds transfer evidence guidance
- contract/legal review reminders
- developer/resale document differences at a high level

### 4. FAQ and advisory decision module

Purpose:

- answer recurring high-intent foreign-buyer questions while preserving the advisor funnel for case-specific advice

Planned subtopics:

- timeline expectations
- cost and fees overview entry points
- ownership-path questions
- when to escalate to an advisor or lawyer

## Advisory Funnel Integration

The hub must integrate into the current advisory funnel without altering ownership of that funnel.

Approved direction:

- the hub may link into the existing contact/advisor path
- the hub may pass conservative intent context into existing advisory entry points later
- the hub may reference the Sprint 1 estimator and search foundations once implementation gates exist

Not approved:

- a new funnel
- a new lead form
- CRM-side workflow branching
- custom follow-up automation in this planning phase

## International Buyer Workflow

The hub should model a planning workflow with these stages:

1. understand ownership path
2. define budget and purchase intent
3. shortlist eligible inventory
4. prepare documents and funds-transfer evidence
5. obtain advisor and legal review
6. proceed to reservation and transfer support

This workflow is explanatory only. It must not be presented as a legal guarantee or universal checklist for every case.

## Document Guidance Rules

Document guidance must follow these rules:

1. document lists are advisory preparation guidance, not absolute legal requirements
2. the hub must distinguish commonly needed documents from case-specific documents
3. legal and tax certainty claims remain out of scope until explicitly approved elsewhere
4. document guidance should funnel edge cases back to advisor/legal review

## Data Model Implications

This module implies a future content model with at least these content concepts:

- `hub_section`
- `hub_subsection`
- `faq_item`
- `document_requirement_note`
- `workflow_step`
- `advisor_cta_context`

Recommended future metadata fields:

```text
slug
audience
jurisdiction_scope
advisory_level
source_confidence
last_legal_reviewed_at
```

This brief does not require a new CMS schema yet. It identifies the likely content-model direction for later approval.

## Dependencies

- current buy/investment/foreign-buyer guidance inventory
- legal and copy review for ownership/process framing
- approved conservative-language standards already used in public guidance
- future route ownership decision for the hub page or module family

## Non-Goals

- no implementation of a new route or page
- no CRM routing or lead-form changes
- no dynamic document vault or deal-room logic
- no legal-certainty or tax-certainty claims
- no homepage or core-layout restructuring
- no advisory funnel redesign

## Risks

- guidance drifts into unapproved legal advice
- the module duplicates existing public pages instead of consolidating them
- document guidance is interpreted as universally complete when it is not
- funnel integration accidentally expands into CRM or lead-form scope
- international-buyer messaging becomes too generic to be useful or too specific to be governed safely

## Planning Outcome Required

Sprint 2 planning for this module is acceptable only if later reviewers can answer:

1. which content modules belong in the hub
2. how the hub feeds the existing advisory funnel without changing it
3. how document guidance remains conservative and case-sensitive
4. what future content-model shape is likely required
5. which legal/copy approvals are prerequisites before implementation
