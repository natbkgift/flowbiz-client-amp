# Asset Management Property End-to-End Operating System (2026)

Last updated: 2026-03-06
Scope: TH + EN demand generation, owner supply acquisition, developer partnership flow

## 1) System Objective

Build a reliable full-loop system:
- Ads -> Inbound message -> Qualification -> Matching -> Viewing/Meeting -> Offer/Contract -> Close

Operating principle:
- Message-first
- Call only when customer explicitly requests a call
- Measurable by segment, locale, and inventory source

## 2) Channel and Offer Architecture

Channels:
- Phase 1: Facebook, Instagram, WhatsApp
- Phase 2: Website + Google (Search, Demand Gen/YouTube, Display, PMax after signal quality)

Offer families:
- `new_project` (condo/villa project inventory)
- `resale` (owner resale inventory)
- `rental` (owner rental inventory)
- `discovery` (not sure yet: invest/live/holiday)
- `owner_service` (owner wants to sell/rent out)
- `developer_partnership` (project onboarding partnership)

Locales:
- `th`
- `en`

## 3) Campaign Naming Convention

Pattern:
- `AMP_{platform}_{locale}_{offer_family}_{intent}_{audience}_{objective}_{month}`

Examples:
- `AMP_META_TH_NEW_PROJECT_INVEST_BROAD_MESSAGES_2026-03`
- `AMP_META_EN_DISCOVERY_GENERAL_RETARGET_MESSAGES_2026-03`
- `AMP_META_TH_OWNER_SERVICE_SELL_OWNERLOOKALIKE_MESSAGES_2026-03`
- `AMP_META_EN_DEVELOPER_PARTNERSHIP_PARTNER_B2B_MESSAGES_2026-03`

Rule:
- One ad set = one segment + one offer family + one locale.

## 4) Lead Routing Matrix

Routing keys:
- `lead_type`, `offer_family`, `intent`, `locale`

Route table:
- `buyer/renter/investor` -> Demand Desk
- `owner` -> Owner Desk
- `developer` -> Developer Desk
- `undecided` -> Discovery Desk

Escalation triggers:
- User asks for call
- Legal/contract complexity
- High-value lead with urgent timeline
- AI confidence low (phase 5)

## 5) CRM Data Contract (Practical Mapping)

Current endpoint:
- `POST /v1/inquiries`

Required fields:
- `name`
- `message`
- `source_page`
- `intent`
- `budget_band` (when available)
- `timeline` (when available)
- `persona` (if known)
- `tags` (must carry routing metadata)

Recommended tag payload examples:
- `lead_type:buyer`
- `offer_family:new_project`
- `inventory_source:developer_new`
- `locale:th`
- `campaign:AMP_META_TH_NEW_PROJECT_INVEST_BROAD_MESSAGES_2026-03`
- `call_requested:no`

For owner lead:
- `lead_type:owner`
- `offer_family:owner_service`
- `intent:sell`
- `inventory_source:owner_resale`

For developer lead:
- `lead_type:developer`
- `offer_family:developer_partnership`
- `intent:partner`

## 6) Qualification Criteria by Segment

Demand (buy/rent/invest/holiday):
- intent clear
- budget range
- timeline
- preferred area and inventory preference

Owner supply:
- sale/rent intent
- property type + location
- expected price/rent
- readiness to provide docs

Developer:
- project type
- inventory volume
- launch stage
- pricing and sales kit readiness

## 7) SLA and Handoff Rules

SLA:
- First response <= 5 minutes (business hours)
- Qualification started <= 30 minutes
- First shortlist/proposal <= 24 hours

Handoff:
- If agent cannot qualify within 2 interactions, escalate to senior advisor
- If lead goes silent, use 24h / 72h / 7d follow-up cadence
- Never request phone number unless user asks for call

## 8) Dashboard and Weekly Review

Core dashboard cuts:
- by `locale`
- by `offer_family`
- by `lead_type`
- by campaign

Weekly KPIs:
- New message starts
- Qualified chats
- Qualified rate
- CPQC
- First response SLA compliance
- Voluntary call request rate
- Conversation-to-viewing rate
- Conversation-to-deal rate

Decision rules:
- Pause any campaign with low qualified rate for 3 days in a row
- Reallocate budget to top segment-offer pairs every Monday

## 9) 4-Week Implementation Checklist

Week 1 (2026-03-09 to 2026-03-15):
- Finalize taxonomy and naming convention
- Train team on TH/EN routing and scripts
- Publish first 7 days of content

Week 2 (2026-03-16 to 2026-03-22):
- Launch message campaigns in 3 lanes (demand/owner/developer)
- Enforce tag completeness QA daily
- Start weekly dashboard baseline

Week 3 (2026-03-23 to 2026-03-29):
- Scale top performers 20-30%
- Replace low-performing creatives
- Audit 30 conversations for script compliance

Week 4 (2026-03-30 to 2026-04-05):
- Lock winning hooks and audience clusters
- Publish month-1 performance review
- Prepare phase-2 website + Google handoff inputs

## 10) Near-Perfect Control Standard

Define "production-ready marketing system" as:
- >= 95% tag completeness
- >= 90% first-response SLA compliance
- Stable qualified rate for 4 weeks
- Clear segment profitability signal
- 100% adherence to call-by-request policy

If any metric fails:
- Freeze scaling
- Run root-cause analysis
- Re-test for 7 days before reopening scale
