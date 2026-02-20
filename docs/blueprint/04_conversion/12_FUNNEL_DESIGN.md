# 12 -- FUNNEL DESIGN

> Phase 4: Conversion & Funnel Layer -- Defines user journeys and lead capture architecture for Buy, Rent, and Sell intents.

---

## Funnel Overview

AMP Pattaya operates three distinct conversion funnels. Each funnel is designed to move users from awareness to qualified lead with minimum friction.

```
AWARENESS -> INTEREST -> CONSIDERATION -> INTENT -> CONVERSION
```

---

## 1. Buy Funnel

### User Journey

```
Search / Organic / Ad
  |
  v
Landing Page (/buy/, /buy/condo-pattaya/, /invest/)
  |
  v
Browse Projects (/projects/)
  |
  v
Project Detail (/projects/{slug}/)
  |
  v
Unit Detail (/property/{slug}/)
  |
  v
Inquiry Form (CTA) --> Lead Created
  |
  v
Thank You Page + Advisor Assignment
```

### Trigger Points

| Stage | Trigger | Action |
|-------|---------|--------|
| Landing | User reads overview | Show property count, featured projects |
| Browse | User filters/sorts | Track filter preferences for scoring |
| Project | User views specific project | Show "Compare" button, related units |
| Unit | User views unit detail | Display price, CTA prominently |
| CTA | User clicks "Inquire" | Open inquiry form with property pre-filled |

### Lead Capture Points

| Location | CTA Type | Fields |
|----------|----------|--------|
| Landing page hero | Primary button | Name, Email, Phone, Intent |
| Project page (after units list) | Inline form | Name, Email, Phone, Message |
| Unit page (sidebar/sticky) | Floating form | Name, Email/Phone, Message |
| Smart Finder results | Contextual | Name, Email, Phone |
| Compare page | "Get Expert Advice" | Name, Email, Phone |
| Exit intent popup (desktop only) | Modal | Email only (newsletter) |

### Follow-up Automation Hooks

| Event | Automation |
|-------|------------|
| Inquiry submitted | Instant email confirmation + advisor notification |
| No response in 24h | Automated follow-up email/LINE message |
| Inquiry viewed but no reply in 48h | Escalate to team lead |
| Multiple inquiries from same user | Flag as hot lead, merge records |

---

## 2. Rent Funnel

### User Journey

```
Search / Organic / Ad
  |
  v
Landing Page (/rent/, /rent/condo-pattaya/)
  |
  v
Filter Properties (bedrooms, area, budget)
  |
  v
Property Detail (/property/{slug}/)
  |
  v
Contact / Viewing Request (CTA) --> Lead Created
  |
  v
Viewing Scheduled --> Advisor Assigned
```

### Trigger Points

| Stage | Trigger | Action |
|-------|---------|--------|
| Landing | Price range shown | Quick filter by budget |
| Filter | User narrows results | Show count + "Can't find? Contact us" |
| Detail | User checks availability | Show "Available from {date}" |
| CTA | User requests viewing | Calendar picker for preferred date |

### Lead Capture Points

| Location | CTA Type | Fields |
|----------|----------|--------|
| Rent landing | "Find your rental" | Budget, Area, Move-in date |
| Property detail | "Schedule Viewing" | Name, Phone, Preferred date |
| Filter results (empty) | "Let us help" | Name, Email, Requirements |

### Follow-up Automation Hooks

| Event | Automation |
|-------|------------|
| Viewing requested | Confirmation + calendar invite |
| No response to viewing confirmation | SMS/LINE reminder 24h before |
| Viewing completed | Feedback form sent |

---

## 3. Sell Funnel

### User Journey

```
Search / Organic / Ad
  |
  v
Sell Landing Page (/sell/)
  |
  v
Free Valuation Tool (/sell/valuation/)
  |
  v
Valuation Form Submit --> Lead Created
  |
  v
Advisor Contact + Listing Discussion
  |
  v
Property Listed (becomes inventory)
```

### Trigger Points

| Stage | Trigger | Action |
|-------|---------|--------|
| Landing | "What's your property worth?" | Emphasize free, no-obligation |
| Valuation | User enters property details | Show estimated range instantly |
| Submit | User submits for detailed valuation | Capture full contact + property data |

### Lead Capture Points

| Location | CTA Type | Fields |
|----------|----------|--------|
| Sell landing hero | "Get Free Valuation" | Property Type, Area, Size |
| Valuation tool | Multi-step form | Address, Size, Bedrooms, Condition, Images |
| Sell landing footer | "List Your Property" | Name, Phone, Property Type |

### Follow-up Automation Hooks

| Event | Automation |
|-------|------------|
| Valuation submitted | Instant acknowledgment + timeline |
| Advisor assigned | Personal introduction email |
| 7 days no listing agreement | Follow-up with market data |

---

## Cross-Funnel Interactions

Users may switch intents during their journey:

| From Funnel | To Funnel | Trigger |
|-------------|-----------|---------|
| Buy | Invest | User shows interest in ROI data |
| Rent | Buy | User rents long-term, starts considering purchase |
| Sell | Buy | Owner selling one property, buying another |

### Intent Detection

Track these signals to adjust CTA and content:

| Signal | Detected Intent |
|--------|----------------|
| Views investment calculator | Investor |
| Filters by ROI/yield | Investor |
| Views area guide + properties | Lifestyle buyer |
| Views multiple units in same project | Serious buyer |
| Views rent listings + area guides | Relocation renter |
| Returns 3+ times to same property | High intent |

---

## Lead Scoring Integration

| Action | Score Points |
|--------|-------------|
| Page view (any) | +1 |
| Property view | +3 |
| Project view | +3 |
| Smart Finder use | +5 |
| Compare tool use | +5 |
| Calculator use | +5 |
| Inquiry form started | +10 |
| Inquiry submitted | +20 |
| Return visit (within 7 days) | +5 |
| Multiple inquiries | +10 per additional |

### Lead Tiers

| Score | Tier | Action |
|-------|------|--------|
| 0-10 | Cold | Newsletter nurture |
| 11-25 | Warm | Advisor outreach within 24h |
| 26-50 | Hot | Advisor outreach within 1h |
| 51+ | Priority | Immediate phone call |

---

## Funnel Metrics

| Metric | Target |
|--------|--------|
| Landing -> Browse conversion | > 40% |
| Browse -> Detail conversion | > 20% |
| Detail -> Inquiry conversion | > 5% |
| Overall funnel conversion | > 2% |
| Lead response time | < 30 seconds (AI) |
| Viewing-to-close rate | > 15% |
