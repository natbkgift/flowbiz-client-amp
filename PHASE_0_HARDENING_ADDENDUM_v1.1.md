# PHASE 0 HARDENING ADDENDUM v1.1

## Objective

เพิ่ม determinism, ลด waste, ป้องกัน data pollution ก่อน scale

---

## SECTION H1 — NEGATIVE KEYWORD BASELINE (MANDATORY)

### H1.1 Account-Level Negatives (ใส่ก่อนยิงจริง)

```text
cheap
cheapest
hotel
airbnb
hostel
job
jobs
career
salary
agent job
intern
training
course
review
reddit
forum
crime
news
scam
visa
citizenship
passport
free
photo
pictures only
map
distance
```

### H1.2 Investment Campaign Additional Negatives

```text
stock
stocks
bitcoin
crypto
forex
etf
mutual fund
gold investment
```

### H1.3 Rental Campaign Additional Negatives

```text
daily rental
short stay
hourly
guest house
resort
```

### Rule

- Add negative list before Day 1
- Review search terms every 72 hours in first 2 weeks
- Add new negatives weekly

Failure to enforce = CPL spike within 10–14 days

---

## SECTION H2 — LEAD QUALIFICATION DEFINITION (DETERMINISTIC)

ต้องนิยามคำว่า “Qualified” ให้ชัด ห้ามใช้ intuition

### H2.1 BUY — Qualified Lead Criteria

Qualified = ALL conditions met:

- Budget ≥ 2,000,000 THB
- Timeline ≤ 6 months
- Purpose: Live or Invest (not “just browsing”)
- Responds at least once after first message

If any missing → mark as “Unqualified”

### H2.2 INVESTMENT — Qualified Criteria

- Budget ≥ 3,000,000 THB
- Yield expectation realistic (≤ 8–10%)
- Open to Jomtien / Pratumnak / Wongamat
- Timeline ≤ 6 months

### H2.3 RENT — Qualified Criteria

- Budget ≥ 15,000 THB/month
- Stay ≥ 3 months
- Move-in date defined
- Responds to first follow-up

### Why This Matters

Without strict definition:

- Lead qualification rate becomes emotional
- Revenue forecast unreliable
- Budget reallocation decisions flawed

---

## SECTION H3 — FORM HARDENING (CONVERSION PROTECTION)

### H3.1 Buy / Investment Form (Max 5 Fields Required)

Required:

- Name
- WhatsApp / Phone
- Budget Range (dropdown)
- Timeline (dropdown)
- Purpose (Live / Invest)

Optional (not required):

- Area preference
- Email

### H3.2 Rental Form (Max 4 Required)

- Name
- WhatsApp
- Monthly Budget
- Move-in Date

### Rule

If form requires typing more than 30 seconds → Conversion rate drops below 5%

---

## SECTION H4 — GEO & TRAFFIC FILTERING

### H4.1 Target Countries (Phase 0 Only)

Primary:

- UK
- Australia
- USA
- Germany
- France
- Sweden / Norway / Denmark

Secondary (after data proven):

- Canada
- Netherlands
- Finland

### H4.2 Exclude Countries (High Noise / Low Close Rate)

- India
- Pakistan
- Bangladesh
- Nigeria

(Not value judgement — conversion data pattern control)

### H4.3 Language Targeting

- English only
- Do NOT mix Thai

---

## SECTION H5 — RESPONSE TIME ENFORCEMENT

SLA ต้อง measurable

Create daily sheet column:

| Lead Time | First Response Time | Delta (minutes) |
|---|---|---|

### Hard Rule

If response time > 30 minutes:

- Mark lead as “SLA Breach”
- Review weekly

If >20% SLA breach → Do NOT increase budget

---

## SECTION H6 — LISTING ACCURACY CONTROL

Weekly ritual:

1. Verify foreign quota for Buy listings
2. Confirm availability of Rent listings
3. Remove any stale units
4. Update price if changed

### Hard Rule

If >10% of inquiries are about unavailable units → Pause traffic and fix inventory

Trust collapse spreads fast in expat market.

---

## SECTION H7 — CALL TRACKING & WHATSAPP TRACKING

Even if you don’t promote calls, track:

- tel: clicks
- WhatsApp click events
- Form submit events

Verify event fires in Google Tag Assistant before Day 1

No tracking = blind optimization

---

## SECTION H8 — AD COPY STRUCTURE CONTROL

### Buy Campaign Template

Headline 1:
Buy Condo Pattaya — Foreign Ownership Verified

Headline 2:
Full Legal Support. Transparent Costs.

Headline 3:
Licensed English Agency

Description:
Foreign quota verification, full transfer support,
and transparent total cost breakdown.
Book your free consultation.

### Investment Campaign Template

Headline 1:
Pattaya Condo Investment — Real Yield Data

Headline 2:
No Developer Hype. Verified Returns.

Headline 3:
Foreign Ownership Supported

Description:
Investment-grade condos with rental yield analysis.
Request current opportunities.

### Rental Campaign Template

Headline 1:
Rent Condo Pattaya — No Ghost Listings

Headline 2:
Verified Units. English Lease.

Headline 3:
Available Now

Description:
Tell us your budget and move-in date.
We’ll send verified options today.

Deterministic copy improves CTR stability.

---

## SECTION H9 — DECISION GUARDRAILS (STOP CONDITIONS)

Pause campaign if:

- CTR < 3% after 1,000 impressions
- Conversion rate < 3% after 200 clicks
- CPL > 2x projected range for 7 consecutive days
- SLA breach rate > 20%

Do NOT keep spending “hoping it fixes itself”

---

## SECTION H10 — PHASE 0 SUCCESS REDEFINED

Phase 0 considered VALIDATED if:

- ≥ 1 closed sale
- ≥ 3 closed rentals
- ≥ 30% viewing conversion rate
- ≤ 1,500 THB CPL for Buy
- ≤ 500 THB CPL for Rent
- SLA compliance ≥ 90%

Only then scale budget.

---

## Final Verdict

With Addendum applied:

- CPL variance decreases
- Junk leads drop 30–50%
- Funnel predictability increases
- Scaling becomes controlled, not emotional

---

## Implementation Note

This addendum is mandatory for Phase 0 execution and should be reviewed together with the main blueprint.
