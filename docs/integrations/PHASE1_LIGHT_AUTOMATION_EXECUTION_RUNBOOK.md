# PHASE 1 LIGHT AUTOMATION — EXTERNAL EXECUTION RUNBOOK

Source of truth: `PHASE_1_LIGHT_AUTOMATION_LAYER.md`

This runbook covers only external systems that cannot be provisioned from this repository:
- HubSpot configuration
- Make (Integromat) scenarios
- GTM / GA4 / Google Ads / Meta audience setup
- Line group notification wiring

Hard constraints:
- Exactly 4 Make scenarios
- English-only operation
- No pricing / ROI / legal advisory output from chatbot
- LLM fallback classification-only
- Additive scoring only (no negative points)

## A) HubSpot Foundation

### A1. Create Custom Contact Properties (exact)
- `amp_purpose` (dropdown)
- `amp_budget_range` (dropdown)
- `amp_area_preference` (dropdown)
- `amp_timeline` (dropdown)
- `amp_in_thailand` (dropdown)
- `amp_investment_goal` (dropdown)
- `amp_first_time_investor` (checkbox)
- `amp_rental_duration` (dropdown)
- `amp_lead_score` (number)
- `amp_lead_temp` (dropdown: cold/warm/hot/fire)
- `amp_preferred_channel` (dropdown)
- `amp_source_page` (single line text)
- `amp_lead_source` (dropdown)
- `amp_line_id` (single line text)

Gate:
- all 14 properties visible in HubSpot
- types match list above

### A2. Create 4 pipelines (exact names)
1. Purchase — Owner Occupier
2. Purchase — Investor
3. Rental
4. Nurture

Stages must match the phase document exactly and in listed order.

Gate:
- no extra pipelines
- no extra stages

### A3. Temperature thresholds
- 0-20 => cold
- 21-45 => warm
- 46-70 => hot
- 71-100 => fire

Gate:
- test with 4 dummy leads and verify `amp_lead_temp`

## B) Chatbot Build

Deployment:
- only on `amppattaya.com`
- do not deploy on `assetmp.net`

State machine:
- 0 Greeting
- 1 Purpose
- 2A Buyer
- 2B Investor
- 2C Renter
- 2D Explorer
- 3 Contact
- 4 Confirmation
- 5 End

Rules:
- button-driven flow
- free text only for classification fallback
- fallback returns category only (`purpose`, `budget_range`, `area_preference`)
- no generated advisory text

Gate:
- run 10 off-script inputs
- confirm every response remains template-driven

## C) Make Scenarios (exactly 4)

### Scenario 1 — Lead Intake (AMP)
Trigger: webhook from chatbot

Steps:
1. Parse JSON
2. Calculate additive score
3. Derive temperature
4. Search HubSpot contact (email + phone)
5. Create/update contact
6. Create deal in mapped pipeline
7. Create tasks (Day 0/3/7/14)
8. Conditional Line notify
9. Conditional lead magnet email

Error handling:
- route all module failures to Make error handler
- send failure alert to Line + email

Gate:
- 5 end-to-end test payloads
- score equals manual expected score

### Scenario 2 — Lead Intake (ASSETMP)
Trigger: `assetmp.net` form submission

Steps:
1. Parse
2. Create contact
3. Create deal in "Inbound — assetmp"
4. Send Line notify
5. Send auto-reply email

Gate:
- 5 test submissions verified in HubSpot + Line

### Scenario 3 — Daily Summary
Schedule:
- 09:00
- 14:00

Steps:
1. Query leads in last 24h
2. Count by temperature
3. Send Line summary

Gate:
- one forced run validates output format

### Scenario 4 — Score Update (Revisit)
Trigger: GA4 webhook

Steps:
1. Match contact
2. Add incremental score
3. Recalculate temperature
4. Update HubSpot
5. Notify Line only when threshold crossed

Gate:
- simulate revisit event and verify threshold crossing behavior

## D) Scoring validation protocol

- scoring must remain additive only
- no negative points
- audit first 20 real leads
- pass criterion: >= 90% manual match

## E) Tracking + retargeting setup

Install on both sites via GTM:
- GA4
- Google Ads conversion tag
- Google Ads remarketing tag
- Meta Pixel

Required events:
- `page_view_buy`
- `page_view_invest`
- `page_view_rent`
- `chat_started`
- `chat_completed`
- `lead_magnet_download`
- `whatsapp_click`
- `form_submit`
- `property_view`
- `time_on_site_120s`

Gate:
- all events visible in GA4 debug mode

Audience setup (minimum):
- Google: All Visitors, Buy Intent, Invest Intent, Rent Intent, Engaged, Converters(exclude)
- Meta: AMP All Visitors, AMP Engaged, AMP Converters(exclude), Lookalike 1% (test)

Launch guard:
- do not launch audience-based retargeting until audience size >= 100 users

## F) SLA enforcement

- HOT => response within 15 minutes
- FIRE => response within 5 minutes
- enforce via auto-created HubSpot tasks and owner assignment

Gate:
- week-1 manual SLA audit

## G) QA before go-live

Execute all:
1. chatbot full flow x20
2. escalation triggers
3. scoring boundaries
4. pipeline routing
5. duplicate prevention
6. Line message formatting
7. sequence pause on reply

Go-live only when all checks pass.

## Day-30 review metrics

- chat completion > 40%
- webhook success > 98%
- zero hallucination incidents
- HOT/FIRE SLA compliance
- retargeting CPL within target

If fail: iterate Phase 1 only. Do not proceed to Phase 2.
