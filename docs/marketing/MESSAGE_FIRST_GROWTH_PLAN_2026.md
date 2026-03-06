# Message-First Growth Plan (2026)

Last updated: 2026-03-06
Owner: Growth + Sales Ops + CRM Admin

## 1) Goal and Constraints

Primary goal:
- Generate qualified inbound conversations via chat (Facebook, Instagram, WhatsApp).

Secondary goal:
- Calls happen only when the prospect explicitly asks for a call.

Non-goal:
- Do not optimize for collecting phone numbers for outbound cold-calling.

Operating rule:
- All CTAs should prioritize "Send Message", "WhatsApp", or "DM now".

## 1.1) Business Model Context (Asset Management Property)

Core business lanes:
- New project sales: condo and villa projects in Pattaya via developer agreements.
- Owner supply management: properties from owners who want to sell or rent out.
- Buyer/renter/investor advisory: matching qualified demand to both developer stock and owner stock.

Commercial reality:
- Developer lane usually has official price sheets and sales kit support.
- Owner lane usually needs trust, speed, and clear management process.

Implication for growth:
- Campaign and CRM design must separate `demand leads` (buyers/renters/investors) from `supply leads` (owners/developers).

## 2) North Star Metrics (Message-First)

Track weekly and monthly:
- New Message Starts: unique first conversations started.
- Qualified Chat Rate: % of new conversations that match ICP criteria.
- Cost per Qualified Chat (CPQC): paid spend / qualified chats.
- Median First Response Time: first human reply time in minutes.
- Voluntary Call Request Rate: % of qualified chats where user explicitly asks for a call.
- Conversation-to-Deal Rate: deals / qualified chats.
- Qualified Owner Supply Chats: owners ready for sell/rent management discussion.
- Developer Partnership Chats: inbound conversations from developer-side stakeholders.

Suggested operating targets for phase 1:
- Median first response time <= 5 minutes in business hours.
- Qualified chat rate >= 30%.
- Voluntary call request rate >= 8%.
- Stable CPQC for at least 2 consecutive weeks before scaling spend.

## 3) Existing Product Hooks You Can Reuse

Current system already supports message-led measurement:
- Event endpoint: `/api/v1/events` (accepts extensible `event_name` + payload).
- Existing tracked event examples include `home_whatsapp_click` and `home_form_submit`.
- CRM ingestion endpoint: `/v1/inquiries`.
- Inquiry model already stores `intent`, `persona`, `budget_band`, `timeline`, `source_page`, `tags`.
- Admin CRM supports follow-up states and quick contact actions (including WhatsApp URL generation).

Why this matters:
- You can start message-first attribution immediately without waiting for a new analytics stack.

## 4) Phased Roadmap

## Phase 0 (Foundation): 2026-03-09 to 2026-03-22
Objective:
- Build clean tracking, routing, and response operations before paid scale.

Actions:
- Connect Facebook Page, Instagram account, and WhatsApp Business to one operating team.
- Define CRM tagging convention for incoming chats:
  - `source_platform` (fb, ig, wa)
  - `campaign_name`
  - `lead_type` (buyer, renter, investor, owner, developer, general)
  - `inventory_source` (developer_new, owner_resale, owner_rental)
  - `intent` (buy, rent, invest, sell, partner, general)
  - `qualification` (qualified, not_qualified, nurture)
  - `call_requested` (yes only if user asks)
- Prepare canned response scripts and qualification questions.
- Set response SLA and staffing schedule.

Exit criteria:
- Team can label and route 100% of inbound conversations within SLA.

## Phase 1 (No Website): 2026-03-23 to 2026-05-17
Objective:
- Acquire and qualify chat conversations through Facebook/Instagram/WhatsApp only.

Actions:
- Run Meta message-focused campaigns (click-to-message / message conversation optimization).
- Split budget:
  - 70% demand capture (buyers/renters/investors for new projects + managed stock)
  - 20% owner supply acquisition (owners wanting sell/rent management)
  - 10% brand authority and developer partnership credibility content
- Within each budget lane:
  - 60% prospecting
  - 30% retargeting (video viewers, engagers, page visitors inside Meta ecosystem)
  - 10% creative experiments
- Launch weekly creative testing:
  - 3 hook angles
  - 2 offers
  - 2 creatives per angle
- Implement strict "call by request only" policy in scripts.

Exit criteria:
- >= 120 qualified chats/month for 2 consecutive months.
- >= 20 qualified owner supply chats/month.
- CPQC stable within target band for 2 consecutive weeks.

## Phase 2 (Website + Google Mix): 2026-05-18 to 2026-08-09
Objective:
- Add website as trust and conversion assist, not as phone-lead collector.

Actions:
- Keep primary CTA on site as WhatsApp/Message.
- Connect website events to conversion tracking:
  - `whatsapp_click`
  - `inquiry_submit`
  - `qualified_inquiry`
  - `call_requested_by_user`
- Launch Google mix:
  - Search (high-intent)
  - Demand Gen / YouTube (consideration)
  - Display / remarketing (nurture)
  - Performance Max (only after conversion signals are clean)
- Use destination-based pages by intent and inventory source:
  - Buyer/renter/investor pages for project discovery.
  - Owner landing pages for "sell with us" and "rent out with us".
  - Developer page for partnership and project onboarding.

Exit criteria:
- At least 40% of qualified chats attributed to website+Google path with acceptable CPQC.

## Phase 3 (Channel Expansion): 2026-08-10 to 2026-10-04
Objective:
- Expand to additional channels without breaking attribution or response quality.

Actions:
- Add only 1 new channel at a time (example: TikTok, LINE OA, LinkedIn).
- Keep same qualification and tagging model.
- Reuse winning creative themes from phases 1-2.

Exit criteria:
- New channel reaches >= 70% of baseline quality (qualified rate) within 6 weeks.

## Phase 4 (Cross-Channel Mix): 2026-10-05 to 2026-11-29
Objective:
- Optimize budget allocation across channels by incremental lift, not vanity volume.

Actions:
- Build weekly channel scorecard: volume, quality, CPQC, deal rate.
- Reallocate spend from low-quality volume to high-quality conversations.
- Coordinate retargeting frequency and sequencing across Meta + Google.

Exit criteria:
- Blended CPQC improvement >= 15% vs phase 2 baseline.

## Phase 5 (AI Agent Automation): Start 2026-11-30
Objective:
- Automate first-response triage and qualification while keeping human close for closing.

Actions:
- AI handles greeting, FAQ, basic qualification, and routing.
- Human handoff trigger rules:
  - high intent
  - complex case
  - user asks for call
  - policy-sensitive questions
- Log all AI actions to CRM timeline.
- Enforce compliance guardrails and consent handling before outbound follow-up.

Exit criteria:
- >= 30% reduction in first-response time and no quality drop in qualified rate.

## 5) Phase 1 Content Plan (4-Week Starter)

Publishing cadence:
- Reels/Short videos: 4 per week
- Carousel/Static educational: 2 per week
- Stories: daily
- Live/Q&A: 2 times per month

Content mix:
- 35% demand education (buyers/renters/investors)
- 25% project proof and inventory highlights (new condos/villas)
- 25% owner acquisition trust content (sell/rent management process)
- 15% developer authority and partnership credibility

Weekly structure:
- Monday: demand pain point + myth busting
- Tuesday: project insight (new condo/villa) + practical checklist
- Wednesday: case proof (client or project-level result)
- Thursday: owner-focused FAQ (sell/rent management)
- Friday: direct CTA ("message us for shortlist or owner assessment")
- Saturday: process transparency and team credibility
- Sunday: soft retargeting by segment (demand or owner)

Every content asset must include:
- A clear persona signal (who this is for)
- One concrete next step ("Send message with keyword: START")
- No forced phone request

## 6) Chat Script Policy (Call Only by User Request)

First response template:
- "Thanks for reaching out. I can help in chat first. If you prefer a call later, just type CALL and your preferred time."

Qualification flow:
- Ask intent.
- Ask budget range or requirement constraints.
- Ask timeline.
- Offer shortlist/recommendation in chat.

Call rule:
- Ask for call details only after user explicitly requests it.
- Store `call_requested=yes` only on explicit user intent.

## 7) 30-Day Execution Checklist

Week 1:
- Finalize KPI definitions and CRM tags.
- Finalize response SLA and staffing.
- Prepare 20 content ideas and 10 ad creatives.

Week 2:
- Produce content batch for 2 weeks.
- Build ad sets for 3 audience clusters.
- QA all links and messaging CTAs.

Week 3:
- Launch campaigns with conservative daily budgets.
- Daily review: CPQC, response time, qualification rate.
- Pause low-quality ad sets quickly.

Week 4:
- Scale top 20-30% ad sets.
- Refresh weak hooks/creatives.
- Publish monthly learnings and next-month optimization plan.

## 8) Risk Controls

Key risks:
- High message volume with low qualification.
- Slow response causing drop-off.
- Team drifts back to phone-first behavior.
- Attribution becomes inconsistent across channels.

Controls:
- Enforce qualification tagging in CRM.
- SLA dashboard with owner accountability.
- Weekly QA on conversation transcripts.
- Single naming convention for campaigns and tags.

## 9) Source Notes (Platform Guidance)

This plan is aligned with:
- Meta guidance for message-based ad experiences and business messaging setup.
- Google Ads guidance for Search, Display, Demand Gen/YouTube, Performance Max, and website conversion tracking.

Recommended validation point before each phase launch:
- Recheck platform UI/objective names because Meta and Google can rename campaign types over time.

## 10) Audience + Offer Matrix (TH + EN)

Locale split:
- `th`: Thai local and Thai-speaking buyers/owners.
- `en`: Foreign buyers/investors/owners and international developer stakeholders.

Primary demand segments:
- `investor`: yield-focused, tenant demand, resale liquidity.
- `residence_buyer`: primary living in Pattaya.
- `holiday_buyer`: second-home and vacation usage.
- `renter`: long-term and short-term lifestyle demand.

Supply segments:
- `owner_sell`: owner wants to sell.
- `owner_rent`: owner wants rental management.
- `developer_partner`: project-level partnership and inventory onboarding.

Offer families to rotate in ads:
- New project offer: condo/villa launch inventory from developer agreements.
- Resale offer: ready-to-transfer owner inventory.
- Rental offer: ready-to-move and managed rental supply.
- Intent-discovery offer: "not sure yet" quiz/chat entry for undecided users.
- Owner service offer: sell/rent management onboarding.

Rule:
- Every campaign/ad set must map to exactly one `segment` and one `offer_family`.

## 11) End-to-End Operating System (Acquisition to Deal)

Acquisition layer:
- Meta (FB/IG/WhatsApp): message-first campaigns for fast conversation starts.
- Google (phase 2 onward): Search + Demand Gen/YouTube + Display + remarketing.

Intake layer:
- All channels route to chat or inquiry endpoint with standardized tags.
- Required minimum metadata on first touch:
  - `locale`
  - `lead_type`
  - `offer_family`
  - `source_platform`
  - `campaign_name`
  - `intent`

Routing layer:
- Route A: demand desk (buy/rent/invest/holiday).
- Route B: owner desk (sell/rent management).
- Route C: developer desk (project partnership).
- Route D: undecided desk ("not sure yet") with quick clarification script.

Qualification layer:
- Mandatory fields before marking qualified:
  - intent
  - budget band or price expectation
  - timeline
  - area preference / asset location
- For owners:
  - asset type
  - expected price/rent
  - readiness docs status
- For developers:
  - project type
  - inventory volume
  - sales kit readiness

Pipeline layer (CRM):
- `new` -> `qualified` -> `matched` -> `viewing_or_meeting` -> `offer_or_contract` -> `closed_won` / `closed_lost`
- Track reasons for `closed_lost` to improve targeting and scripts.

Service-level layer (SLA):
- First response (business hours): <= 5 minutes.
- First qualification pass: <= 30 minutes.
- First shortlist/proposal: <= 24 hours.
- Human escalation after AI uncertainty: <= 10 minutes.

Governance layer:
- Weekly quality audit: 30 random conversations per segment.
- Weekly campaign review: pause low-quality ad sets and reallocate budget.
- Monthly taxonomy audit: ensure naming/tag consistency across channels.

## 12) "Perfect" Definition and Acceptance Gates

Operationally, "perfect" means controlled, repeatable, and measurable quality at scale.

Gate A - Data quality:
- >= 95% of new chats have complete required tags.

Gate B - Speed:
- >= 90% of chats receive first response within SLA.

Gate C - Qualification:
- Qualified rate stable for 4 consecutive weeks by segment.

Gate D - Commercial:
- CPQC and conversation-to-deal meet target for 2 consecutive months.

Gate E - Behavior policy:
- 100% compliance with "call only when customer requests call."

If any gate fails:
- Freeze scale-up for 7 days.
- Run root-cause review.
- Relaunch only after corrective actions are verified.

## 13) 90-Day Build Order (Execution Sequence)

2026-03-09 to 2026-03-22:
- Finalize taxonomy, routing rules, scripts, SLA owners.
- Launch bilingual content and message operations.

2026-03-23 to 2026-04-19:
- Run message campaigns for demand + owner + developer lanes.
- Stabilize qualification and response quality.

2026-04-20 to 2026-05-17:
- Scale top-performing segment-offer pairs.
- Cut underperforming pairs and refresh creatives weekly.

2026-05-18 onward:
- Add website + Google channel mix with conversion mapping.

## 14) Execution Assets in Repo

Use these files as daily operating inputs:
- `docs/marketing/AMP_END_TO_END_OPERATING_SYSTEM_2026.md`
- `docs/marketing/AMP_SOP_DAILY_OPERATIONS_TH_EN.md`
- `docs/marketing/AMP_CRM_TAG_TAXONOMY.csv`
- `docs/marketing/AMP_AD_COPY_BANK_TH_EN.md`
- `docs/marketing/AMP_WEEKLY_SCORECARD_TEMPLATE.csv`
- `docs/marketing/AMP_NEW_PROJECT_PRIORITY_QUEUE_2026-03.md`
- `docs/marketing/PHASE1_NEW_PROJECT_ROTATION_CALENDAR_2026-03_2026-04.csv`
- `docs/marketing/AMP_DAY_BY_DAY_PLAYBOOK_30D_2026-03-09_to_2026-04-07.md`
- `docs/marketing/AMP_REAL_CONTENT_EXAMPLES_7D_TH_EN.md`
- `docs/marketing/AMP_REAL_META_AD_EXAMPLES_6CAMPAIGNS_TH_EN.csv`
- `docs/marketing/AMP_VERIFIED_PROJECT_AD_WINNERS_2026.md`
- `docs/marketing/AMP_NEW_CONDO_TH_EN_WORKING_EXAMPLES_2026.md`
- `docs/marketing/PHASE1_30DAY_CONTENT_PLAN.csv`
- `docs/marketing/PHASE1_MESSAGE_SCRIPTS.md`
