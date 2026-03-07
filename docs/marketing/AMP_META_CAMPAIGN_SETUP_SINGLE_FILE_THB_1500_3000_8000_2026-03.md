# AMP Meta Campaign Setup (Entry / Mid / Premium) - THB 1,500 / 3,000 / 8,000 per day

Last updated: 2026-03-07
Scope: Phase 1 only (Facebook / Instagram / WhatsApp, no website required)
Primary KPI: Qualified inbound chat (message-first)
Call policy: Call only when user explicitly requests

## 0) วิธีใช้เอกสารนี้

1. เลือกงบรายวัน 1 ระดับ: `1500` หรือ `3000` หรือ `8000` บาท/วัน
2. เปิดเฉพาะแคมเปญที่งบในคอลัมน์นั้นมากกว่า 0
3. ทำตาม Campaign Setup Cards (`S01-S08`) ด้านล่าง
4. ใช้ครีเอทีฟจากไฟล์:
   - `docs/marketing/AMP_TOP3_NEW_CONDO_CAROUSEL_VIDEO_FILLED_2026-03-07.md`
   - `docs/marketing/AMP_REMAINING4_NEW_CONDO_CAROUSEL_VIDEO_FILLED_2026-03-07.md`
5. ทุกแชตต้องติดแท็ก CRM ครบ (`locale`, `lead_type`, `offer_family`, `intent`, `campaign_name`, `price_segment`, `call_requested`)

---

## 1) Project-to-Segment Map (แกนหลักใหม่)

Segment definitions:
- `Entry`: ราคาตั้งต้นอ้างอิง <= 4.9M
- `Mid`: ราคาตั้งต้นอ้างอิง 5.0M-8.9M
- `Premium`: ราคาตั้งต้นอ้างอิง >= 9.0M

Project grouping (initial):
- Entry core:
  - Avenue Boutique
  - EMBASSY LIFE
- Mid core:
  - ZENITH Pattaya II
  - Sea Spire Jomtien
  - Copacabana Coral Reef Jomtien
- Premium core:
  - ONCE Wongamat
  - The Riviera Palm Beach Wongamat

Important:
- โครงการบางตัวมีหลายช่วงราคา (เช่นยูนิตเล็ก vs ยูนิตใหญ่) ให้ยึด "ราคาในครีเอทีฟชิ้นนั้น" เป็นตัวกำหนด segment
- รีเฟรช mapping ทุก 14 วันจากราคา/สต็อกล่าสุด

---

## 2) Budget Scenario Matrix (Campaign-by-Campaign)

Use naming rule: `AMP_P1_{LOCALE}_{SEGMENT}_{GOAL}_{MONTH}`

| Campaign ID | Campaign Name (recommended) | Segment Role | THB/day @1500 | THB/day @3000 | THB/day @8000 |
|---|---|---|---:|---:|---:|
| S01 | `AMP_P1_TH_ENTRY_MSG_2026-03` | TH Entry buyers/investors | 350 | 650 | 1500 |
| S02 | `AMP_P1_TH_MID_MSG_2026-03` | TH Mid buyers/investors | 250 | 450 | 1200 |
| S03 | `AMP_P1_TH_PREMIUM_MSG_2026-03` | TH Premium buyers/investors | 100 | 200 | 600 |
| S04 | `AMP_P1_EN_ENTRYMID_MSG_2026-03` | EN Entry+Mid (combined) | 250 | 500 | 900 |
| S05 | `AMP_P1_EN_PREMIUM_MSG_2026-03` | EN Premium (separate) | 0 | 0 | 450 |
| S06 | `AMP_P1_THEN_RETARGET_SEGMENT_MSG_2026-03` | Retarget by segment | 200 | 450 | 1100 |
| S07 | `AMP_P1_THEN_OWNER_SERVICE_MSG_2026-03` | Owner supply lane | 250 | 550 | 1500 |
| S08 | `AMP_P1_THEN_DISCOVERY_AUTHORITY_MSG_2026-03` | Discovery + trust | 100 | 200 | 750 |
|  | **TOTAL** |  | **1500** | **3000** | **8000** |

Operational note:
- `S05` เปิดเฉพาะงบ `8000` เพื่อเลี่ยง budget fragmentation

---

## 3) Campaign Setup Cards (พร้อมตั้งค่าทันที)

## S01 - TH Entry

- Objective: `Leads`
- Conversion location: `Messaging apps`
- Messaging app: `WhatsApp` (primary)
- Buying type: `Auction`
- Budget type: `ABO`
- Attribution: `7-day click`
- Placements: `Advantage+ placements`

Project pool in ads:
- Avenue Boutique
- EMBASSY LIFE

Ad sets:
- `AS1_TH_Entry_Broad`
- `AS2_TH_Entry_Investor` (>= 3000)

Tags:
- `locale:th|offer_family:new_project|price_segment:entry|campaign_name:S01|call_requested:no`

## S02 - TH Mid

- Objective: `Leads` -> messaging
- Messaging app: `WhatsApp + Messenger`
- Placements: `Advantage+ placements`

Project pool in ads:
- ZENITH Pattaya II
- Sea Spire Jomtien
- Copacabana Coral Reef Jomtien (entry-mid units)

Ad sets:
- `AS1_TH_Mid_Broad`
- `AS2_TH_Mid_Investor` (>= 3000)

Tags:
- `locale:th|offer_family:new_project|price_segment:mid|campaign_name:S02|call_requested:no`

## S03 - TH Premium

- Objective: `Leads` -> messaging
- Messaging app: `Messenger + WhatsApp`

Project pool in ads:
- ONCE Wongamat
- The Riviera Palm Beach Wongamat
- Copacabana Coral Reef (premium-size units only)

Ad sets:
- `AS1_TH_Premium_Broad`

Tags:
- `locale:th|offer_family:new_project|price_segment:premium|campaign_name:S03|call_requested:no`

## S04 - EN Entry+Mid (combined)

- Objective: `Leads` -> messaging
- Messaging app: `Messenger + Instagram Direct`

Project pool in ads:
- Entry + Mid projects in EN lane

Ad sets:
- `AS1_EN_EntryMid_Broad`
- `AS2_EN_EntryMid_ExpatTH` (>= 3000)

Tags:
- `locale:en|offer_family:new_project|price_segment:entry_mid|campaign_name:S04|call_requested:no`

## S05 - EN Premium (separate)

- Objective: `Leads` -> messaging
- Activate only when budget scenario = `8000`
- Messaging app: `Messenger + Instagram Direct`

Project pool in ads:
- ONCE Wongamat
- The Riviera Palm Beach Wongamat

Ad sets:
- `AS1_EN_Premium_Broad`

Tags:
- `locale:en|offer_family:new_project|price_segment:premium|campaign_name:S05|call_requested:no`

## S06 - Retarget by Segment

- Objective: `Leads` -> messaging
- Audience source: page engagers, IG engagers, video viewers, prior message openers
- Lookback windows: warm `7-30 days`, hot `1-7 days`

Ad sets:
- `AS1_THEN_Entry_Warm_7to30`
- `AS2_THEN_Mid_Warm_7to30`
- `AS3_THEN_Premium_Warm_7to30` (>= 3000)
- `AS4_THEN_Hot_1to7` (>= 3000)

Tags:
- `offer_family:retarget|campaign_name:S06|call_requested:no`

## S07 - Owner Service (TH+EN)

- Objective: `Leads` -> messaging
- Messaging app: `WhatsApp` (TH), `Messenger` (EN)

Ad sets:
- `AS1_TH_Owner`
- `AS2_EN_Owner`

Tags:
- `offer_family:owner_service|campaign_name:S07|call_requested:no`

## S08 - Discovery + Authority

- Objective: `Leads` -> messaging
- Role: จับกลุ่มยังไม่ชัดเจน + สร้างความน่าเชื่อถือแบรนด์

Ad sets:
- `AS1_THEN_Discovery`
- `AS2_THEN_Authority`

Tags:
- `offer_family:discovery_or_authority|campaign_name:S08|call_requested:no`

---

## 4) Audience Overlap Control Rules (กันกลุ่มปน)

Exclusion matrix:
- Entry ad sets exclude: engagers of Premium creatives in last 30 days
- Premium ad sets exclude: engagers of Entry creatives in last 30 days
- Mid ad sets exclude: qualified leads in Entry/Premium closed within 14 days
- Retarget ad sets exclude: users with `qualification=qualified` in last 14 days

Creative rule:
- อย่าใส่หลายช่วงราคาในครีเอทีฟชิ้นเดียว
- ทุกชิ้นต้องมี `price anchor` ชัดเจน (เช่น From 2.9M / From 6.8M / From 12.9M)

Routing rule:
- ถ้าลูกค้าแชตมาผิด segment ให้ re-tag แล้วส่ง shortlist segment ที่ถูกภายใน 1 รอบข้อความ

---

## 5) Creative Design System (แยกตาม Segment)

Entry:
- Angle: เริ่มต้นง่าย / ใช้งานจริง / rent-friendly
- Hook examples: `เริ่มจาก X.XM`, `คอนโดใหม่ในงบเอื้อมถึง`

Mid:
- Angle: สมดุลราคา-คุณภาพ-ทำเล
- Hook examples: `ทำเล + ส่วนกลางครบ`, `คุ้มทั้งอยู่เองและลงทุน`

Premium:
- Angle: rarity / view / privacy / iconic location
- Hook examples: `limited high-floor`, `premium beachfront positioning`

Format specs:
- Reel/Story: `9:16` (1080x1920)
- Carousel: `1:1` (1080x1080), 6 cards
- TH and EN separated per ad set

Mandatory elements:
- Project name
- Segment price anchor + date footnote
- 1 location proof point
- 1-3 facility highlights
- CTA: `Send Message` / `Send WhatsApp Message`

---

## 6) 14-Day Optimization Rules

Daily check windows:
- 12:00
- 18:00

Kill / Pause rule:
- Pause when BOTH are true:
  - spend > 1.5x CPQC target band
  - qualified rate < 20% for 3 consecutive days

Scale rule:
- Increase budget +15% every 48h when BOTH are true:
  - qualified rate >= 30%
  - CPQC within target band for 3 consecutive days

No-edit rule:
- Do not edit same ad set more than once in 24h unless critical issue

---

## 7) KPI Targets by Budget Scenario

| Scenario | Expected Conversations/day | Expected Qualified Chats/day | CPQC Target Band (THB) | Primary focus |
|---|---:|---:|---:|---|
| 1500/day | 6-12 | 2-4 | 450-700 | prove segment fit + fast response |
| 3000/day | 12-24 | 4-8 | 400-650 | stabilize Entry/Mid/Premium signal |
| 8000/day | 30-55 | 10-18 | 350-600 | scale winners + separate EN Premium |

---

## 8) Daily Execution Checklist (Operator)

- Launch check:
  - segment label in campaign name is correct (`ENTRY/MID/PREMIUM`)
  - destination app matches campaign card
  - opener text matches language and segment
- Midday check:
  - SLA first response <= 5 minutes
  - no call push unless user explicitly requests call
- End-of-day check:
  - update scorecard by segment
  - log top objections by segment
  - prepare next-day creative replacement for worst segment

---

## 9) Ready-to-Copy Campaign Creation Order

Create in this order:
1. `S01`
2. `S02`
3. `S04`
4. `S07`
5. `S06`
6. `S03`
7. `S08`
8. `S05` (only at 8000 budget scenario)

Reason:
- Start with core demand (Entry/Mid) + owner lane first, then add Premium split and trust layer when volume is stable.

---

## 10) Policy and Compliance Notes

- Keep chat-first CTAs only.
- Keep all price claims date-stamped in creative.
- If geography/regulatory setup requires Housing/Special Ad Category, configure before launch.
- Keep conversation tags auditable in CRM timeline.
