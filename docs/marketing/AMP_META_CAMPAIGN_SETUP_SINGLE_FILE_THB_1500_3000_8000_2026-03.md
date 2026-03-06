# AMP Meta Campaign Setup (Single File) - THB 1,500 / 3,000 / 8,000 per day

Last updated: 2026-03-07
Scope: Phase 1 only (Facebook / Instagram / WhatsApp, no website required)
Primary KPI: Qualified inbound chat (message-first)
Call policy: Call only when user explicitly requests

## 0) วิธีใช้เอกสารนี้

1. เลือกงบรายวัน 1 ระดับ: `1500` หรือ `3000` หรือ `8000` บาท/วัน
2. เปิดเฉพาะแคมเปญที่งบในคอลัมน์นั้นมากกว่า 0
3. ตั้งค่าที่ Ads Manager ตาม "Campaign Setup Cards" ด้านล่าง
4. ใช้ครีเอทีฟจากไฟล์:
   - `docs/marketing/AMP_TOP3_NEW_CONDO_CAROUSEL_VIDEO_FILLED_2026-03-07.md`
   - `docs/marketing/AMP_REAL_META_AD_EXAMPLES_6CAMPAIGNS_TH_EN.csv`
5. ทุกแชตต้องติดแท็ก CRM ให้ครบ (`locale`, `lead_type`, `offer_family`, `intent`, `campaign_name`, `call_requested`)

---

## 1) Budget Scenario Matrix (Campaign-by-Campaign)

Use naming rule: `AMP_P1_{LOCALE}_{LANE}_{OBJECTIVE}_{MONTH}`

| Campaign ID | Campaign Name (recommended) | Goal Lane | THB/day @1500 | THB/day @3000 | THB/day @8000 |
|---|---|---|---:|---:|---:|
| C01 | `AMP_P1_TH_NEW_TOP3_MSG_2026-03` | New condo (TH) | 450 | 850 | 2200 |
| C02 | `AMP_P1_EN_NEW_TOP3_MSG_2026-03` | New condo (EN) | 300 | 600 | 1600 |
| C03 | `AMP_P1_THEN_DISCOVERY_MSG_2026-03` | Discovery (undecided) | 100 | 200 | 600 |
| C04 | `AMP_P1_TH_OWNER_SERVICE_MSG_2026-03` | Owner leads (TH) | 200 | 350 | 1000 |
| C05 | `AMP_P1_EN_OWNER_SERVICE_MSG_2026-03` | Owner leads (EN) | 100 | 250 | 600 |
| C06 | `AMP_P1_THEN_RETARGET_WARM_MSG_2026-03` | Retarget warm | 200 | 400 | 800 |
| C07 | `AMP_P1_THEN_RETARGET_HOT_MSG_2026-03` | Retarget hot | 0 | 50 | 400 |
| C08 | `AMP_P1_THEN_AUTHORITY_TRUST_MSG_2026-03` | Authority/brand trust | 150 | 300 | 800 |
|  | **TOTAL** |  | **1500** | **3000** | **8000** |

Budget mix outcome:
- Demand + Retarget = 70% (`C01+C02+C03+C06+C07`)
- Owner supply = 20% (`C04+C05`)
- Authority = 10% (`C08`)

---

## 2) Campaign Setup Cards (ใส่ค่าตามนี้ได้ทันที)

## C01 - TH New Condo Top 3

- Objective: `Leads`
- Conversion location: `Messaging apps`
- Messaging app: `WhatsApp` (primary)
- Buying type: `Auction`
- Budget type: `ABO` (Ad set budget)
- Attribution setting: `7-day click`
- Placements: `Advantage+ placements`
- Schedule: start today, run continuously

Ad sets:
- `AS1_TH_Broad_Pattaya+Bangkok`
- `AS2_TH_InvestorInterest` (เปิดเมื่อ budget scenario >= 3000)
- `AS3_TH_LAL_Engagers_1-3%` (เปิดเมื่อ budget scenario = 8000 และมีข้อมูลพอ)

Creative set:
- 2x Reel 15s (TH)
- 1x Carousel 6 cards (TH)
- 1x Story cutdown 9:16

Message opener:
- `สวัสดีครับ/ค่ะ ส่งงบ + ไทม์ไลน์ได้เลย เดี๋ยวทีมคัด shortlist ให้ตรงเป้าหมายครับ/ค่ะ`

Tags on first qualification:
- `locale:th|lead_type:buyer_or_investor|offer_family:new_project|inventory_source:developer_new|campaign_name:C01|call_requested:no`

## C02 - EN New Condo Top 3

- Objective: `Leads`
- Conversion location: `Messaging apps`
- Messaging app: `Messenger + Instagram Direct`
- Buying type: `Auction`
- Budget type: `ABO`
- Attribution: `7-day click`
- Placements: `Advantage+ placements`

Ad sets:
- `AS1_EN_Broad_ExpatTH`
- `AS2_EN_PropertyInterest` (>= 3000)
- `AS3_EN_LAL_Engagers_1-3%` (= 8000 with enough data)

Creative set:
- 2x Reel 15s (EN)
- 1x Carousel 6 cards (EN)

Message opener:
- `Hi, share your budget and timeline and we will send you a focused shortlist in chat.`

Tags:
- `locale:en|lead_type:buyer_or_investor|offer_family:new_project|inventory_source:developer_new|campaign_name:C02|call_requested:no`

## C03 - TH/EN Discovery (Undecided)

- Objective: `Leads`
- Conversion location: `Messaging apps`
- Messaging app: `Messenger + Instagram Direct`
- Audience: broad + video viewers
- Optimization intent: conversation starts

Ad sets:
- `AS1_TH_Discovery` (always on)
- `AS2_EN_Discovery` (>= 3000)

Creative set:
- 1x TH decision-map Reel
- 1x EN decision-map Reel
- 1x static FAQ post

Opener:
- `ตอนนี้สนใจ ลงทุน / อยู่เอง / พักผ่อน แบบไหนมากที่สุดครับ/ค่ะ?`
- `Which goal is your priority now: investment, living, or holiday use?`

Tags:
- `lead_type:undecided|offer_family:discovery|intent:general|campaign_name:C03|call_requested:no`

## C04 - TH Owner Service

- Objective: `Leads` -> messaging
- Messaging app: `WhatsApp`
- Audience: owner-related interests + page engagers
- Offer: ฝากขาย/ปล่อยเช่าแบบมีระบบ

Ad sets:
- `AS1_TH_Owner_Broad`
- `AS2_TH_Owner_Engagers` (>= 3000)

Creative set:
- 1x process carousel (6 cards)
- 1x trust reel (before/after workflow)
- 1x testimonial card

Opener:
- `ทรัพย์ต้องการขายหรือปล่อยเช่าครับ/ค่ะ และอยู่โซนไหน?`

Tags:
- `locale:th|lead_type:owner|offer_family:owner_service|intent:sell_or_rentout|campaign_name:C04|call_requested:no`

## C05 - EN Owner Service

- Objective: `Leads` -> messaging
- Messaging app: `Messenger`
- Audience: landlord/owner expat segment

Ad sets:
- `AS1_EN_Owner_Broad` (always on)

Creative set:
- 1x owner process video (EN)
- 1x owner FAQ static (EN)

Opener:
- `Are you planning to sell, rent out, or both?`

Tags:
- `locale:en|lead_type:owner|offer_family:owner_service|intent:sell_or_rentout|campaign_name:C05|call_requested:no`

## C06 - Retarget Warm (7-30 days)

- Objective: `Leads` -> messaging
- Audience source: engagers / video viewers / page interactions in 7-30 days
- Exclude: people who already became qualified in past 14 days

Ad sets:
- `AS1_TH_Warm`
- `AS2_EN_Warm` (>= 3000)

Creative set:
- 1x comparison carousel
- 1x objection-handling reel

Opener:
- `ยังเทียบโครงการอยู่ไหมครับ/ค่ะ? ส่งงบมา เดี๋ยวสรุปให้ในแชต`
- `Still comparing projects? Share your budget and we will narrow it down fast.`

Tags:
- `offer_family:retarget|campaign_name:C06|call_requested:no`

## C07 - Retarget Hot (1-7 days)

- Objective: `Leads` -> messaging
- Activate condition:
  - budget scenario 3000+: ON
  - at least 50 warm conversations in last 14 days

Ad sets:
- `AS1_THEN_Hot_1to7D`

Creative set:
- 1x urgency reel (price-date reminder)
- 1x shortlist CTA card

Opener:
- `ถ้าต้องการ ผมส่ง shortlist 3 ตัวเลือกที่เหมาะสุดให้ตอนนี้ได้เลย`
- `If useful, I can send a 3-option shortlist right now.`

Tags:
- `offer_family:retarget_hot|campaign_name:C07|call_requested:no`

## C08 - Authority / Trust

- Objective: `Leads` -> messaging
- Audience: broad + engagers
- Role: support conversion quality, not volume

Ad sets:
- `AS1_TH_Trust`
- `AS2_EN_Trust` (>= 3000)

Creative set:
- company process explainer
- team credibility / market update
- client education post

Opener:
- `ส่งโจทย์มาได้เลย ทีมจะช่วย map ตัวเลือกให้ในแชต`
- `Share your requirements and we will map options in chat.`

Tags:
- `offer_family:authority|campaign_name:C08|call_requested:no`

---

## 3) Creative Design System (ทีมดีไซน์ทำตามนี้)

Visual direction:
- New condo lanes: premium + clean + location clarity
- Owner lane: trust + process transparency
- Retarget lanes: speed + decision support

Format specs:
- Reel/Story: `9:16` (1080x1920)
- Carousel: `1:1` (1080x1080), 6 cards
- Caption language: TH and EN separated by campaign

Mandatory elements in every ad:
- Project name clearly visible
- 1 key location proof point
- 1-3 facilities max (no overload)
- Starting price with date footnote (`ราคาอ้างอิง ณ ...`)
- Final CTA: `Send Message` or `Send WhatsApp Message`

Avoid:
- forcing phone call in first CTA
- guaranteed return claims
- overcrowded text blocks

---

## 4) 14-Day Optimization Rules (ทำตามนี้ทุกวัน)

Daily at 12:00 and 18:00:
- Check spend, conversations, qualified rate, response speed
- Fix tag completeness to >= 95%

Kill / Pause rule:
- Pause ad/ad set when BOTH conditions are true:
  - spend > 1.5x target CPQC band
  - qualified rate < 20% for 3 consecutive days

Scale rule:
- Increase budget +15% every 48h when BOTH conditions are true:
  - qualified rate >= 30%
  - CPQC is within target band for 3 consecutive days

No-edit rule (learning protection):
- Do not edit same ad set more than once in 24h unless critical issue

---

## 5) KPI Targets by Budget Scenario

| Scenario | Expected Conversations/day | Expected Qualified Chats/day | CPQC Target Band (THB) | Notes |
|---|---:|---:|---:|---|
| 1500/day | 6-12 | 2-4 | 450-700 | prioritize speed + script quality |
| 3000/day | 12-24 | 4-8 | 400-650 | begin audience split and stronger retarget |
| 8000/day | 30-55 | 10-18 | 350-600 | full funnel with dedicated hot retarget |

---

## 6) Daily Execution Checklist (Operator)

- Launch check:
  - campaign/ad set/ad names follow naming rule
  - destination app is correct per campaign card
  - message opener text matches campaign language
- Midday check:
  - SLA first response <= 5 minutes
  - no call push unless user asks for call
- End-of-day check:
  - export key metrics
  - update winners/losers
  - queue next-day creative rotation

---

## 7) Ready-to-Copy Campaign Creation Order

Create in this order:
1. `C01`
2. `C02`
3. `C04`
4. `C06`
5. `C03`
6. `C05`
7. `C08`
8. `C07` (only when activation condition is met)

Reason:
- Start from core demand + owner + warm retarget first, then add discovery/authority/hot retarget to avoid early budget fragmentation.

---

## 8) Policy and Compliance Notes

- Use chat-first CTAs only.
- Keep price claims date-stamped in creative.
- If your target geography/regulatory setup requires Housing/Special Ad Category handling, configure it before launch.
- Keep conversation logs and tags auditable in CRM.
