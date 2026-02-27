# PHASE 1 — LIGHT AUTOMATION LAYER

## 30-Day Execution Plan | Foreign Buyer Acquisition Automation

**Scope:** English-speaking foreign market only
**Website A:** assetmp.net → Conversion capture only
**Website B:** amppattaya.com → Automation core (VPS control)
**CRM:** HubSpot
**Automation:** Make (Integromat)
**Notifications:** Line Group
**Traffic:** Google Ads English (primary)
**Phase Duration:** 30 days

---

## SECTION 1 — BASIC AI PRE-QUALIFIER

### 1.1 Architecture Decision

**Approach:** State-machine chatbot with lightweight LLM fallback.

- **Primary engine:** Rule-based decision tree (handles 80% of interactions)
- **Fallback:** OpenAI GPT-4o-mini API call for free-text parsing when user deviates from expected input
- **No vector database. No RAG. No memory persistence beyond the active session.**

**Reasoning:** A full conversational AI system introduces hallucination risk around pricing, legal, and ROI — all of which are liability-sensitive in Thai real estate. The rule-based core guarantees controlled output. The LLM fallback only parses ambiguous user input into structured categories — it does not generate advisory responses.

**Deployment:** Embedded chat widget on `amppattaya.com` (all 3 landing pages + homepage). Not on `assetmp.net` in Phase 1.

### 1.2 Conversation Flow — State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                    STATE 0: GREETING                        │
│  "Hi! I'm AMP's property assistant. I help foreign buyers  │
│   and renters find the right condo in Pattaya."            │
│  "To match you with the best options, I have a few quick   │
│   questions. This takes about 60 seconds."                 │
│                                                             │
│  [Start] [Talk to a person instead]                        │
│                                                             │
│  → [Start] → STATE 1                                       │
│  → [Talk to a person] → ESCALATION                         │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              STATE 1: PURPOSE IDENTIFICATION                │
│  "What brings you to Pattaya?"                             │
│                                                             │
│  [Buy a condo to live in]                                  │
│  [Buy a condo as an investment]                            │
│  [Rent a condo]                                            │
│  [Not sure yet — just exploring]                           │
│                                                             │
│  → Buy to live     → STATE 2A (Buyer)                      │
│  → Investment      → STATE 2B (Investor)                   │
│  → Rent            → STATE 2C (Renter)                     │
│  → Exploring       → STATE 2D (Explorer)                   │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│            STATE 2A: BUYER QUALIFICATION                    │
│                                                             │
│  Q1: "What's your budget range?"                           │
│      [Under 2M THB] [2M–5M THB]                           │
│      [5M–10M THB] [10M+ THB]                              │
│                                                             │
│  Q2: "Which area interests you most?"                      │
│      [Jomtien] [Pratumnak] [Central Pattaya]              │
│      [Wongamat] [Na Jomtien] [Not sure]                   │
│                                                             │
│  Q3: "When are you planning to buy?"                       │
│      [Within 1 month] [1–3 months]                        │
│      [3–6 months] [Just researching]                      │
│                                                             │
│  Q4: "Are you currently in Thailand?"                      │
│      [Yes, in Pattaya] [Yes, elsewhere in Thailand]       │
│      [No, planning to visit] [No, buying remotely]        │
│                                                             │
│  → All answers collected → STATE 3 (Contact Capture)       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│          STATE 2B: INVESTOR QUALIFICATION                   │
│                                                             │
│  Q1: "What's your investment budget?"                      │
│      [Under 3M THB] [3M–5M THB]                           │
│      [5M–10M THB] [10M+ THB]                              │
│                                                             │
│  Q2: "What's your primary investment goal?"                │
│      [Rental income] [Capital appreciation]                │
│      [Both] [Holiday use + rental when away]              │
│                                                             │
│  Q3: "Have you invested in Thai property before?"          │
│      [Yes] [No, first time]                               │
│                                                             │
│  Q4: "When are you looking to invest?"                     │
│      [Within 1 month] [1–3 months]                        │
│      [3–6 months] [Exploring options]                     │
│                                                             │
│  Q5: "Are you currently in Thailand?"                      │
│      [Yes, in Pattaya] [Yes, elsewhere in Thailand]       │
│      [No, planning to visit] [No, investing remotely]     │
│                                                             │
│  → All answers collected → STATE 3 (Contact Capture)       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│            STATE 2C: RENTER QUALIFICATION                   │
│                                                             │
│  Q1: "What's your monthly budget?"                         │
│      [Under 15K THB] [15K–25K THB]                        │
│      [25K–45K THB] [45K+ THB]                             │
│                                                             │
│  Q2: "How long do you need the rental?"                    │
│      [1–3 months] [3–6 months]                            │
│      [6–12 months] [12+ months]                           │
│                                                             │
│  Q3: "When do you need to move in?"                        │
│      [Within 2 weeks] [Within 1 month]                    │
│      [1–3 months] [Just looking ahead]                    │
│                                                             │
│  Q4: "Preferred area?"                                     │
│      [Jomtien] [Pratumnak] [Central Pattaya]              │
│      [Wongamat] [Na Jomtien] [Not sure]                   │
│                                                             │
│  → All answers collected → STATE 3 (Contact Capture)       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│             STATE 2D: EXPLORER PATH                         │
│                                                             │
│  "No problem! Here are some resources to help:"            │
│  → [Foreign Buyer's Guide (PDF)]                           │
│  → [Pattaya Investment Yield Report]                       │
│  → [Rental Area Guide]                                     │
│                                                             │
│  "Would you like to leave your details so we can send      │
│   you relevant listings when they come up?"                │
│                                                             │
│  [Yes] → STATE 3 (Contact Capture)                         │
│  [No thanks] → STATE 5 (End)                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│            STATE 3: CONTACT CAPTURE                         │
│                                                             │
│  "Great — I've got a clear picture of what you need."      │
│  "One of our team will prepare a personalized shortlist."  │
│                                                             │
│  Q1: "What's your first name?"                             │
│      [Free text input]                                     │
│                                                             │
│  Q2: "Best way to reach you?"                              │
│      [WhatsApp] [Email] [Line]                             │
│                                                             │
│  Q3: (Conditional) "What's your WhatsApp number?"          │
│      OR "What's your email address?"                       │
│      OR "What's your Line ID?"                             │
│      [Free text input]                                     │
│                                                             │
│  Q4: "Which country are you from?" (dropdown)              │
│                                                             │
│  → All captured → STATE 4 (Confirmation)                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│             STATE 4: CONFIRMATION                           │
│                                                             │
│  "Thank you, [Name]! Here's a summary:"                    │
│  → [Display: Purpose / Budget / Area / Timeline]           │
│                                                             │
│  "A member of our team will reach out within [timeframe]   │
│   on [selected channel]."                                  │
│                                                             │
│  "In the meantime, here's our [relevant lead magnet]."     │
│                                                             │
│  → FIRE WEBHOOK → Make scenario → HubSpot + Line          │
│  → STATE 5 (End)                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│             STATE 5: END                                    │
│                                                             │
│  "Thanks for chatting with AMP Pattaya. You can            │
│   restart anytime or message us directly on WhatsApp:      │
│   [number]."                                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Budget Branching Logic

```
PURPOSE = BUY TO LIVE
  Budget < 2M THB → Tag: "budget_entry"
                   → Show: "We have options in that range — mostly
                     studio/1BR in Jomtien and East Pattaya."
                   → Continue to next question

  Budget 2M–5M THB → Tag: "budget_mid"
                    → Continue normally

  Budget 5M–10M THB → Tag: "budget_high"
                     → Continue normally

  Budget 10M+ THB → Tag: "budget_premium"
                   → Add flag: "priority_lead"
                   → Continue normally

PURPOSE = INVESTMENT
  Budget < 3M THB → Tag: "invest_entry"
                   → Show: "At this range, studio units in
                     Jomtien/East Pattaya typically offer
                     the best yield potential."
                   → Continue

  Budget 3M–5M THB → Tag: "invest_mid" → Continue
  Budget 5M–10M THB → Tag: "invest_high" → Continue
  Budget 10M+ THB → Tag: "invest_premium"
                   → Add flag: "priority_lead"
                   → Continue

PURPOSE = RENT
  Budget < 15K/mo → Tag: "rent_budget"
                   → Show: "We have studio options in that
                     range. Availability varies by season."
                   → Continue

  Budget 15K–25K → Tag: "rent_mid" → Continue
  Budget 25K–45K → Tag: "rent_upper" → Continue
  Budget 45K+ → Tag: "rent_premium"
              → Add flag: "priority_lead"
              → Continue
```

### 1.4 Investor vs. Living Logic (Routing Impact)

| Signal | Classification | CRM Impact |
|---|---|---|
| Purpose = Buy + Goal = Live in it | **End User** | Pipeline: "Purchase — Owner Occupier" |
| Purpose = Buy + Goal = Investment | **Investor** | Pipeline: "Purchase — Investor" |
| Purpose = Invest (any sub-answer) | **Investor** | Pipeline: "Purchase — Investor" |
| Purpose = Rent | **Renter** | Pipeline: "Rental" |
| Purpose = Exploring + downloaded investment guide | **Investor (Nurture)** | Pipeline: "Nurture" |
| Purpose = Exploring + downloaded buyer guide | **Buyer (Nurture)** | Pipeline: "Nurture" |
| Purpose = Exploring + no download | **Cold** | Pipeline: "Nurture" |

**Reasoning:** The investor vs. end-user split determines everything downstream — the listing shortlist, the talking points, the urgency framing, and the closing strategy. This must be captured at first touch and tagged in CRM immediately.

### 1.5 Data Capture Structure (Per Session)

```json
{
  "session_id": "uuid",
  "timestamp": "ISO-8601",
  "source_page": "/buy-condo-pattaya | /pattaya-condo-investment | /rent-condo-pattaya | /",
  "utm_source": "google | direct | referral",
  "utm_medium": "cpc | organic",
  "utm_campaign": "buy_condo | investment | rent_condo | brand",

  "qualification": {
    "purpose": "buy_live | buy_invest | rent | exploring",
    "budget_range": "under_2m | 2m_5m | 5m_10m | 10m_plus | under_15k | 15k_25k | 25k_45k | 45k_plus",
    "area_preference": "jomtien | pratumnak | central | wongamat | na_jomtien | not_sure",
    "timeline": "within_1mo | 1_3mo | 3_6mo | researching | within_2wk",
    "in_thailand": "yes_pattaya | yes_elsewhere | no_visiting | no_remote",
    "investment_goal": "rental_income | capital_appreciation | both | holiday_plus_rental | null",
    "first_time_investor": "yes | no | null",
    "rental_duration": "1_3mo | 3_6mo | 6_12mo | 12_plus | null"
  },

  "contact": {
    "first_name": "string",
    "preferred_channel": "whatsapp | email | line",
    "contact_value": "string (phone/email/line_id)",
    "country": "string"
  },

  "system": {
    "lead_score": "integer (calculated)",
    "tags": ["string array"],
    "priority_flag": "boolean",
    "assigned_pipeline": "string",
    "lead_magnet_sent": "string | null"
  }
}
```

### 1.6 Escalation to Human — Trigger Rules

| Trigger | Action |
|---|---|
| User clicks "Talk to a person" at any point | Immediately display WhatsApp link + notify Line group |
| User types free-text that cannot be parsed into a category after 2 attempts | Display: "Let me connect you with a team member who can help directly." → WhatsApp link + Line notify |
| User asks about specific pricing of a named property | Display: "Pricing depends on unit and floor — let me connect you with our team for exact numbers." → Escalate |
| User asks about legal process, tax, visa | Display: "Great question — our team can walk you through the details. Let me connect you." → Escalate |
| User mentions budget 10M+ THB (any purpose) | Auto-flag `priority_lead` → Immediate Line notification with all captured data |
| User asks about ROI percentage or projected returns | **DO NOT ANSWER.** Display: "Returns vary by unit and market conditions. Our team can share actual rental data for specific properties. Want me to connect you?" |
| User mentions urgency ("I'm in Pattaya now", "I want to view tomorrow") | Auto-flag `urgent` → Immediate Line notification |
| Conversation stalls (no input for 90 seconds after a question) | Display: "Still there? No rush — you can also reach us directly on WhatsApp: [number]" |

### 1.7 Fail-Safe Constraints

| Constraint | Implementation |
|---|---|
| **No fabricated ROI** | The chatbot NEVER outputs yield percentages, ROI projections, or return estimates. All financial discussion is escalated to human. Hardcoded rule — not LLM-generated. |
| **No legal advice** | The chatbot NEVER provides guidance on ownership law, quota rules, tax, or visa. It may state: "Foreigners can own condos in Thailand under certain conditions — our team can explain the specifics for your situation." Nothing more. |
| **No pricing** | The chatbot NEVER states a specific price for any property. It may reference budget *ranges* that the user selected. |
| **No availability guarantees** | The chatbot NEVER confirms a unit is available. It says: "We'll check current availability and get back to you." |
| **No competitor comparisons** | The chatbot NEVER mentions other agencies, portals, or developers by name. |
| **LLM fallback scope** | The GPT-4o-mini API call is ONLY used to classify ambiguous free-text input into one of the predefined categories (purpose, budget range, area). It DOES NOT generate customer-facing advisory text. The response shown to the user is always a pre-written template selected by the classification result. |
| **Session data cap** | No conversation history stored beyond 24 hours. Only the structured JSON output (Section 1.5) persists via CRM. |

### 1.8 Technical Implementation

| Component | Tool | Detail |
|---|---|---|
| Chat widget | Tidio, Botpress, or custom (amppattaya.com VPS) | Embedded on all landing pages |
| State machine | Botpress flow editor OR custom Node.js state handler | Pre-defined states, button-driven with free-text fallback |
| LLM fallback | OpenAI API (GPT-4o-mini) | Only for input classification, not response generation |
| Webhook on complete | HTTP POST to Make | Fires on STATE 4 (confirmation) |
| Estimated build time | 7–10 days | Including QA and edge case testing |

---

## SECTION 2 — LEAD SCORING

### 2.1 Scoring Philosophy

Lead scoring in Phase 1 is **additive and behavioral**. Every signal adds points. No signal subtracts. Score is calculated at point of qualification (chat completion) and updated on subsequent behavioral events tracked via Make.

**Maximum possible score:** 100
**Score is stored in HubSpot as a custom property:** `amp_lead_score` (integer)

### 2.2 Behavioral Scoring Table

#### A) Chat Qualification Scores (Assigned at chat completion)

| Signal | Points | Reasoning |
|---|---|---|
| **Purpose** | | |
| Buy to live | +15 | High-value transaction intent |
| Buy to invest | +15 | High-value transaction intent |
| Rent | +8 | Lower transaction value, still valuable |
| Exploring | +3 | Low commitment |
| **Budget** | | |
| Buy: 10M+ THB | +20 | Premium segment |
| Buy: 5M–10M | +15 | High-value segment |
| Buy: 2M–5M | +10 | Standard segment |
| Buy: Under 2M | +5 | Entry segment |
| Rent: 45K+/mo | +12 | Premium rental |
| Rent: 25K–45K | +8 | Mid-upper rental |
| Rent: 15K–25K | +5 | Standard rental |
| Rent: Under 15K | +3 | Budget rental |
| **Timeline** | | |
| Within 1 month / 2 weeks | +20 | Immediate intent |
| 1–3 months | +12 | Near-term intent |
| 3–6 months | +5 | Medium-term |
| Researching / Just looking | +2 | Low urgency |
| **Location in Thailand** | | |
| Currently in Pattaya | +15 | Can view immediately |
| Elsewhere in Thailand | +10 | Can travel to view |
| Planning to visit | +5 | Future viewing potential |
| Remote / Not in Thailand | +3 | Longer conversion cycle |
| **Contact method provided** | | |
| WhatsApp number given | +5 | Direct, high-engagement channel |
| Email given | +3 | Standard but lower engagement |
| Line ID given | +4 | Common in Thailand context |

#### B) Post-Qualification Behavioral Scores (Updated via tracking)

| Signal | Points | Trigger |
|---|---|---|
| Returned to site within 48 hours | +5 | GA4 event → Make |
| Visited 3+ property pages in one session | +5 | GA4 event → Make |
| Downloaded lead magnet | +5 | Form/click event → Make |
| Replied to WhatsApp follow-up within 2 hours | +10 | Manual tag in HubSpot |
| Requested a viewing | +15 | Manual tag in HubSpot |
| Opened follow-up email | +3 | HubSpot email tracking |
| Clicked link in follow-up email | +5 | HubSpot email tracking |
| Referred by existing client | +10 | Manual tag in HubSpot |

### 2.3 Score Thresholds

| Score Range | Classification | Visual Tag (HubSpot) |
|---|---|---|
| **0–20** | 🔵 COLD | `lead_temp: cold` |
| **21–45** | 🟡 WARM | `lead_temp: warm` |
| **46–70** | 🟠 HOT | `lead_temp: hot` |
| **71–100** | 🔴 FIRE | `lead_temp: fire` |

### 2.4 Trigger Actions Per Threshold

| Threshold | Action | Owner | Timing |
|---|---|---|---|
| 🔵 COLD (0–20) | Add to nurture sequence (weekly market update email) | Automated (HubSpot) | Immediate |
| | Send relevant lead magnet based on purpose | Automated (Make) | Within 5 minutes |
| | No Line notification | — | — |
| 🟡 WARM (21–45) | Add to active follow-up sequence | Automated (HubSpot) | Immediate |
| | Send personalized shortlist within 24 hours | Human (assigned agent) | Within 24 hours |
| | Line notification: standard | Automated (Make → Line) | Immediate |
| 🟠 HOT (46–70) | Assign to senior agent | Automated (HubSpot) | Immediate |
| | WhatsApp outreach within 15 minutes | Human (assigned agent) | Within 15 minutes |
| | Send curated shortlist with cost breakdown | Human | Within 4 hours |
| | Line notification: priority | Automated (Make → Line) | Immediate |
| 🔴 FIRE (71–100) | Assign to team lead / most experienced agent | Automated (HubSpot) | Immediate |
| | WhatsApp outreach within 5 minutes | Human (assigned agent) | Within 5 minutes |
| | Prepare viewing schedule proactively | Human | Within 2 hours |
| | Line notification: URGENT with full lead details | Automated (Make → Line) | Immediate |

### 2.5 CRM Tagging Logic

Every lead gets exactly **4 system tags** applied automatically:

```
Tag 1: PURPOSE
  → purpose_buy_live
  → purpose_buy_invest
  → purpose_rent
  → purpose_exploring

Tag 2: TEMPERATURE
  → lead_temp_cold
  → lead_temp_warm
  → lead_temp_hot
  → lead_temp_fire

Tag 3: BUDGET TIER
  → budget_entry
  → budget_mid
  → budget_high
  → budget_premium

Tag 4: URGENCY
  → timeline_immediate (within 1 month)
  → timeline_near (1–3 months)
  → timeline_future (3–6 months)
  → timeline_research
```

Additional manual tags applied by agents after first contact:

```
  → viewed_property (after viewing)
  → negotiating (after offer discussion)
  → lost_reason_[code] (if deal lost: price / timing / location / ghost / competitor)
  → referral_source (if referred)
```

### 2.6 Auto-Priority Notification Rule (Line Group)

```
IF lead_score >= 46 (HOT or FIRE):
  → Send Line notification immediately
  → Format:
    ┌──────────────────────────────────┐
    │ 🔴 HOT LEAD                      │
    │ Name: [first_name]              │
    │ Purpose: [purpose]              │
    │ Budget: [budget_range]          │
    │ Timeline: [timeline]            │
    │ Location: [in_thailand]         │
    │ Contact: [channel] [value]      │
    │ Score: [XX] / 100               │
    │ Source: [utm_campaign]          │
    │ Page: [source_page]            │
    │                                  │
    │ ⏱ Respond within 15 min        │
    └──────────────────────────────────┘

IF lead_score >= 71 (FIRE):
  → Same format but prefix with:
    "🚨 FIRE LEAD — RESPOND IN 5 MIN"

IF lead_score < 46 (WARM or COLD):
  → Line notification: batch summary
  → Send once at 9:00 AM and 2:00 PM daily
  → Format: "📋 [X] new leads today | [Y] warm | [Z] cold | Check HubSpot"
```

---

## SECTION 3 — CRM AUTOMATION (Make → HubSpot)

### 3.1 Data Flow Architecture

```
USER
  │
  ▼
CHATBOT (amppattaya.com)
  │ Completes qualification flow
  │ Fires webhook (HTTP POST) with JSON payload
  ▼
MAKE (Scenario 1: Lead Intake)
  │
  ├─→ Step 1: Parse JSON payload
  │
  ├─→ Step 2: Calculate lead score (formula module)
  │
  ├─→ Step 3: Create/Update HubSpot Contact
  │           (search by email/phone first to avoid duplicates)
  │
  ├─→ Step 4: Create HubSpot Deal (assign to correct pipeline)
  │
  ├─→ Step 5: Create HubSpot Task (follow-up reminder)
  │
  ├─→ Step 6: Send Line notification (conditional on score)
  │
  └─→ Step 7: Send lead magnet email (conditional on purpose)


FORM SUBMISSIONS (assetmp.net)
  │ Standard contact form / inquiry form
  │ Fires webhook (HTTP POST) or HubSpot native form
  ▼
MAKE (Scenario 2: Website A Capture)
  │
  ├─→ Step 1: Parse form data
  │
  ├─→ Step 2: Create HubSpot Contact (minimal fields)
  │           Set source = "assetmp.net"
  │
  ├─→ Step 3: Create HubSpot Deal (pipeline = "Inbound — assetmp")
  │
  ├─→ Step 4: Send Line notification (all leads from assetmp.net
  │           get notified — lower volume expected)
  │
  └─→ Step 5: Auto-reply email: "We received your inquiry"
```

### 3.2 HubSpot Field Mapping

#### Contact Properties

| HubSpot Property | Type | Source | Required |
|---|---|---|---|
| `firstname` | Text | chat: `contact.first_name` | YES |
| `email` | Text | chat: `contact.contact_value` (if email) | Conditional |
| `phone` | Text | chat: `contact.contact_value` (if WhatsApp) | Conditional |
| `amp_line_id` | Text (custom) | chat: `contact.contact_value` (if Line) | Conditional |
| `country` | Dropdown | chat: `contact.country` | YES |
| `amp_purpose` | Dropdown (custom) | chat: `qualification.purpose` | YES |
| `amp_budget_range` | Dropdown (custom) | chat: `qualification.budget_range` | YES |
| `amp_area_preference` | Dropdown (custom) | chat: `qualification.area_preference` | YES |
| `amp_timeline` | Dropdown (custom) | chat: `qualification.timeline` | YES |
| `amp_in_thailand` | Dropdown (custom) | chat: `qualification.in_thailand` | YES |
| `amp_investment_goal` | Dropdown (custom) | chat: `qualification.investment_goal` | NO |
| `amp_first_time_investor` | Checkbox (custom) | chat: `qualification.first_time_investor` | NO |
| `amp_rental_duration` | Dropdown (custom) | chat: `qualification.rental_duration` | NO |
| `amp_lead_score` | Number (custom) | Calculated by Make | YES |
| `amp_lead_temp` | Dropdown (custom) | Derived from score | YES |
| `amp_preferred_channel` | Dropdown (custom) | chat: `contact.preferred_channel` | YES |
| `amp_source_page` | Text (custom) | chat: `source_page` | YES |
| `utm_source` | Text | chat: `utm_source` | YES |
| `utm_medium` | Text | chat: `utm_medium` | YES |
| `utm_campaign` | Text | chat: `utm_campaign` | YES |
| `amp_lead_source` | Dropdown (custom) | "amppattaya_chat" or "assetmp_form" | YES |

#### At Minimum, These Must Exist Before Go-Live

- `firstname` (native)
- `email` OR `phone` (at least one)
- `amp_purpose`
- `amp_budget_range`
- `amp_lead_score`
- `amp_lead_temp`

### 3.3 Pipeline Stage Assignment

#### Pipeline 1: Purchase — Owner Occupier

| Stage | Trigger | Auto/Manual |
|---|---|---|
| New Lead | Deal created (purpose = buy_live) | Auto (Make) |
| Contacted | Agent sends first WhatsApp/email | Manual |
| Shortlist Sent | Agent sends curated listing | Manual |
| Viewing Scheduled | Viewing confirmed | Manual |
| Viewed | Viewing completed | Manual |
| Offer / Negotiation | Price discussion initiated | Manual |
| Contract Signed | Deposit paid, contract executed | Manual |
| Transfer Complete | Land Office transfer done | Manual |
| Lost | Deal closed-lost with reason tag | Manual |

#### Pipeline 2: Purchase — Investor

| Stage | Trigger |
|---|---|
| New Lead | Deal created (purpose = buy_invest) |
| Contacted | First outreach |
| Investment Brief Sent | Yield data + unit details sent |
| Viewing / Due Diligence | Site visit or deep-dive call |
| Offer / Negotiation | Terms discussion |
| Contract Signed | Deposit + contract |
| Transfer Complete | Land Office done |
| Lost | Closed-lost with reason |

#### Pipeline 3: Rental

| Stage | Trigger |
|---|---|
| New Lead | Deal created (purpose = rent) |
| Contacted | First outreach |
| Options Sent | Available units sent |
| Viewing Scheduled | Confirmed |
| Viewed | Completed |
| Lease Signed | Contract executed |
| Moved In | Keys handed over |
| Lost | Closed-lost with reason |

#### Pipeline 4: Nurture

| Stage | Trigger |
|---|---|
| New — Exploring | Deal created (purpose = exploring) |
| Engaged | Opened email or replied to message |
| Reactivated | Returned to site or re-inquired |
| Converted | Moved to Purchase or Rental pipeline |
| Dormant | No engagement for 60 days |

### 3.4 Auto Task Creation (via Make)

| Condition | Task Created | Due Date | Assigned To |
|---|---|---|---|
| 🔴 FIRE lead (score 71+) | "URGENT: Contact [name] within 5 minutes" | Immediate | Team lead |
| 🟠 HOT lead (score 46–70) | "Contact [name] within 15 minutes" | +15 min | Senior agent |
| 🟡 WARM lead (score 21–45) | "Send shortlist to [name]" | +24 hours | Available agent |
| 🔵 COLD lead (score 0–20) | "Add [name] to nurture sequence" | +24 hours | Marketing |
| Any lead, Day 3 | "Follow up with [name] — Day 3" | +3 days | Assigned agent |
| Any lead, Day 7 | "Follow up with [name] — Day 7" | +7 days | Assigned agent |
| Any lead, Day 14 | "Check if [name] is still active" | +14 days | Assigned agent |

**Implementation:** Make scenario creates these tasks via HubSpot API at the moment of deal creation. Day 3/7/14 tasks are created simultaneously with staggered due dates.

### 3.5 Auto Follow-Up Timing (HubSpot Sequences)

| Sequence | Trigger | Emails |
|---|---|---|
| **Buyer Nurture** | Purpose = buy_live or buy_invest + score < 46 | Email 1 (Day 0): "Here's your Foreign Buyer's Guide" |
| | | Email 2 (Day 3): "3 things to know before buying in Pattaya" |
| | | Email 3 (Day 7): "New listings that match your criteria" |
| | | Email 4 (Day 14): "Still exploring? Here's what's happening in Pattaya market" |
| | | Email 5 (Day 30): "Quick check-in + latest opportunities" |
| **Rental Nurture** | Purpose = rent + score < 46 | Email 1 (Day 0): "Pattaya Area Guide" |
| | | Email 2 (Day 3): "Available rentals in [preferred area]" |
| | | Email 3 (Day 7): "Tips for renting in Pattaya as a foreigner" |
| | | Email 4 (Day 14): "New listings this week" |
| **Investor Nurture** | Purpose = buy_invest + downloaded yield report | Email 1 (Day 0): "Your Pattaya Yield Report" |
| | | Email 2 (Day 5): "What the yield numbers don't tell you" |
| | | Email 3 (Day 10): "Current investment-grade opportunities" |
| | | Email 4 (Day 21): "Pattaya market update" |

**Rule:** If a lead replies to any email or WhatsApp message, the sequence pauses and the assigned agent takes over manually. Sequences are a safety net, not a replacement for human follow-up.

### 3.6 Make Scenario Summary

| Scenario # | Name | Trigger | Steps | Frequency |
|---|---|---|---|---|
| 1 | Lead Intake — amppattaya.com | Webhook from chatbot | Parse → Score → HubSpot Contact → Deal → Tasks → Line → Email | Real-time |
| 2 | Lead Intake — assetmp.net | Webhook from form | Parse → HubSpot Contact → Deal → Line → Auto-reply | Real-time |
| 3 | Daily Lead Summary | Scheduled | Query HubSpot → Count by temp → Send Line summary | 2x daily (9am, 2pm) |
| 4 | Score Update — Site Revisit | GA4 event webhook | Match contact → Update score → Update temp tag → Conditional Line notify | Real-time |

**Total Make scenarios: 4.** No more in Phase 1.

---

## SECTION 4 — RETARGETING LOGIC

### 4.1 Tracking Setup (Prerequisites)

| Tool | Purpose | Implementation |
|---|---|---|
| **GA4** | Behavioral tracking on both sites | Already should be live from Phase 0 |
| **Google Ads Conversion Tag** | Retargeting audiences + conversion optimization | Installed via GTM |
| **Google Ads Remarketing Tag** | Build audience lists | Installed via GTM |
| **Meta Pixel** | Facebook/Instagram retargeting | Installed via GTM |
| **GTM (Google Tag Manager)** | Central tag management | Single GTM container per site |

**Install on both sites:** `amppattaya.com` AND `assetmp.net`

### 4.2 Event Triggers Required

| Event Name | Trigger Condition | Platform | Purpose |
|---|---|---|---|
| `page_view_buy` | User visits `/buy-condo-pattaya` | GA4 + Google Ads + Meta | Segment: Purchase intent |
| `page_view_invest` | User visits `/pattaya-condo-investment` | GA4 + Google Ads + Meta | Segment: Investor intent |
| `page_view_rent` | User visits `/rent-condo-pattaya` | GA4 + Google Ads + Meta | Segment: Rental intent |
| `chat_started` | User clicks "Start" in chatbot | GA4 + Google Ads + Meta | Engagement signal |
| `chat_completed` | User reaches STATE 4 (confirmation) | GA4 + Google Ads | Conversion event (primary) |
| `lead_magnet_download` | User downloads any PDF | GA4 + Google Ads + Meta | Engagement signal |
| `whatsapp_click` | User clicks WhatsApp CTA | GA4 + Google Ads | Conversion event (secondary) |
| `form_submit` | Form submitted on assetmp.net | GA4 + Google Ads | Conversion event |
| `property_view` | User views individual property page | GA4 + Meta | Interest signal |
| `time_on_site_120s` | User stays on any landing page 120+ sec | GA4 | Engagement qualifier |

### 4.3 Audience Segmentation Rules

#### Google Ads Audiences

| Audience Name | Definition | Size Estimate (30-day) | Use |
|---|---|---|---|
| `AMP - All Visitors` | All visitors to amppattaya.com | Baseline | Broad retargeting |
| `AMP - Buy Intent` | Visited `/buy-condo-pattaya` + time on site > 30s | Subset | Purchase retargeting |
| `AMP - Invest Intent` | Visited `/pattaya-condo-investment` + time on site > 30s | Subset | Investment retargeting |
| `AMP - Rent Intent` | Visited `/rent-condo-pattaya` + time on site > 30s | Subset | Rental retargeting |
| `AMP - Engaged` | `chat_started` OR `lead_magnet_download` OR `time_on_site_120s` | Subset | High-engagement retargeting |
| `AMP - Converters` | `chat_completed` OR `whatsapp_click` OR `form_submit` | Subset | **EXCLUDE from retargeting** |
| `ASSETMP - All Visitors` | All visitors to assetmp.net | Separate | Cross-site retargeting |

#### Meta (Facebook/Instagram) Audiences

| Audience Name | Definition | Use |
|---|---|---|
| `Meta - AMP All Visitors` | Meta Pixel: all amppattaya.com visitors, 30 days | Broad retargeting |
| `Meta - AMP Engaged` | Meta Pixel: `chat_started` OR `lead_magnet_download` | Engaged retargeting |
| `Meta - AMP Converters` | Meta Pixel: `chat_completed` | **EXCLUDE** |
| `Meta - Lookalike 1%` | Based on `AMP - Engaged` audience | Prospecting (Phase 1 test only) |

### 4.4 Time Window Logic

| Audience | Window | Reasoning |
|---|---|---|
| All Visitors | **30 days** | Foreign buyer research cycle is 2–12 weeks. 30 days captures the active window without wasting budget on stale visitors. |
| Buy/Invest Intent | **45 days** | Purchase decisions take longer. Extended window justified by higher transaction value. |
| Rent Intent | **14 days** | Rental decisions are faster. After 14 days, they've likely found something or left Pattaya. |
| Engaged (chat started, download) | **60 days** | These users showed strong intent. Worth extended retargeting investment. |
| Converters (exclusion) | **90 days** | Exclude converted leads for 90 days to avoid wasting ad spend on people already in pipeline. |

### 4.5 Message Differentiation

| Audience | Ad Message Strategy | Ad Format | Landing Destination |
|---|---|---|---|
| **Buy Intent (didn't convert)** | "Still looking for a condo in Pattaya? Get your personalized shortlist." | Google Display responsive ad + Meta single image | `/buy-condo-pattaya` |
| **Invest Intent (didn't convert)** | "Pattaya condo yields: See the real numbers. Download the free report." | Google Display + Meta single image | `/pattaya-condo-investment` (lead magnet gate) |
| **Rent Intent (didn't convert)** | "Verified Pattaya rentals — no ghost listings. See what's available." | Google Display + Meta carousel (3 units) | `/rent-condo-pattaya` |
| **Engaged (chat started, didn't finish)** | "You started a search — let us finish it. Talk to a Pattaya property expert." | Google Display + Meta single image | `/buy-condo-pattaya` or `/rent-condo-pattaya` (based on page of origin) |
| **ASSETMP visitors** | "Looking at Pattaya properties? Explore our full listings with foreign buyer support." | Meta single image | `amppattaya.com` homepage |

**Rules:**
- Every ad includes the AMP logo and "Licensed Pattaya Agency" text.
- No pricing in ads (avoids mismatch with actual availability).
- No "urgency" tactics ("Only 2 left!") — builds distrust with foreign buyers.
- All ads in English only (Phase 1 scope).

### 4.6 Budget Allocation

| Channel | Monthly Budget (THB) | % of Total Retargeting Budget | Logic |
|---|---|---|---|
| **Google Display — Retargeting** | 8,000–12,000 | 40% | Follows users across web; good for buy/invest intent |
| **Meta — Retargeting** | 8,000–12,000 | 40% | Strong for visual property ads; carousel format |
| **Meta — Lookalike 1% (test)** | 4,000–6,000 | 20% | Small test of prospecting via lookalike; measure CPL vs. Google Search |

**Total retargeting budget:** 20,000–30,000 THB/month

**This is ADDITIONAL to the Google Search budget from Phase 0.** Retargeting is supplementary, not a replacement.

**Rule:** Do not launch retargeting until audience lists reach minimum thresholds:
- Google Display: minimum 100 users in list (Google's requirement for standard remarketing)
- Meta: minimum 100 users in custom audience (Meta's requirement)
- At Phase 0 traffic levels, this should be reached within 1–2 weeks of Phase 1 start.

### 4.7 What NOT to Do in Phase 1 Retargeting

| Do NOT | Reason |
|---|---|
| Build complex multi-step retargeting sequences | Overengineering for audience size; keep it simple |
| Use dynamic remarketing (property-level ads) | Requires product feed setup; Phase 2+ |
| Retarget converters | Waste of budget; they're already in pipeline |
| Run retargeting on YouTube | Audience too small; cost per view not justified |
| Set frequency cap below 3/week | Foreign buyers need multiple touchpoints |
| Set frequency cap above 10/week | Ad fatigue; diminishing returns |
| Use Google Performance Max for retargeting | No audience control; defeats the purpose |

---

## PHASE 1 EXECUTION TIMELINE

| Week | Focus | Deliverables |
|---|---|---|
| **Week 1** | HubSpot setup | Custom properties created, 4 pipelines configured, sequences drafted, task automation logic mapped |
| **Week 1–2** | Chatbot build | State machine flow built, button flows tested, LLM fallback configured, fail-safes verified |
| **Week 2** | Make scenarios | Scenario 1 (lead intake AMP) + Scenario 2 (lead intake ASSETMP) built and tested end-to-end |
| **Week 2–3** | Tracking + Retargeting prep | GTM events configured, GA4 events firing, Google Ads + Meta audiences created, retargeting ads drafted |
| **Week 3** | Integration QA | Full flow test: chatbot → Make → HubSpot → Line. Verify all fields map correctly. Test all score thresholds. Test all pipeline assignments. |
| **Week 3** | Make scenarios 3+4 | Daily summary scenario + score update scenario built and tested |
| **Week 4** | Go-live + monitoring | Chatbot live on amppattaya.com. All Make scenarios active. Retargeting campaigns launched (if audience thresholds met). Daily monitoring. |
| **Day 30** | Phase 1 Review | Score accuracy check. Pipeline flow audit. Retargeting CPL review. Decision: proceed to Phase 2 or iterate. |

---

## RISK REGISTER

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Chatbot generates inappropriate response via LLM fallback | MEDIUM | HIGH | LLM only classifies input; never generates customer-facing text. All responses are pre-written templates. |
| Make webhook fails silently | MEDIUM | HIGH | Enable Make error notifications (email + Line). Add manual form fallback on landing pages. |
| HubSpot duplicate contacts | HIGH | MEDIUM | Make scenario searches for existing contact by email AND phone before creating new. Merge logic documented. |
| Retargeting audiences too small to serve | MEDIUM | LOW | Don't allocate retargeting budget until minimums are met. Check weekly. |
| Lead score miscalculates | LOW | MEDIUM | Manual audit of first 20 leads. Compare calculated score to expected score. Fix formula before scaling. |
| Line notifications overwhelm team | LOW | LOW | Batch COLD/WARM notifications. Only HOT/FIRE get real-time alerts. |
| Users abandon chatbot mid-flow | HIGH | MEDIUM | Track drop-off state. If contact info captured before abandon, still fire webhook with partial data + flag `incomplete`. |
| ASSETMP form submissions not reaching Make | MEDIUM | MEDIUM | Test webhook with 5 manual submissions before go-live. Monitor daily for first week. |

---

## PHASE 1 SUCCESS CRITERIA (Day 30 Review)

| Metric | Target | How to Measure |
|---|---|---|
| Chatbot completion rate | >40% of users who click "Start" reach STATE 4 | GA4 funnel events |
| Lead score accuracy | >90% of leads scored match manual assessment | Sample audit of 20 leads |
| Make → HubSpot success rate | >98% of webhook fires result in correct HubSpot record | Make execution logs |
| Line notification delivery | 100% of HOT/FIRE leads trigger notification within 60 seconds | Manual spot-check |
| Lead response SLA (HOT/FIRE) | <15 min average | HubSpot task completion time |
| Retargeting CTR | >0.5% (Display) / >1.0% (Meta) | Google Ads + Meta dashboards |
| Retargeting CPL | <1,500 THB (Buy/Invest) / <500 THB (Rent) | Calculated from spend + conversions |
| Zero hallucination incidents | 0 cases of chatbot providing pricing, ROI, or legal advice | Manual review of chat logs weekly |

---

**END OF PHASE 1 — LIGHT AUTOMATION LAYER**

*Do not proceed to Phase 2 (advanced AI, multi-language, RAG systems) until all Phase 1 success criteria are met and the pipeline is generating qualified leads at predictable cost.*
