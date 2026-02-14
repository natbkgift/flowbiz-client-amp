# HYBRID PHASE 0 — BUY FUNNEL CORE (Execution Notes)

## 1) Landing URL
- `/buy-condo-pattaya`
- Primary intent: foreign buyers searching to buy condo in Pattaya

## 2) Tracking Setup
- GA4 installed via `gtag.js`
- Google Ads conversion tag installed via `gtag.js`
- Required events:
  - `SubmitLead` (form submit)
  - `ClickWhatsApp` (WhatsApp click)
- Anti-duplicate: form uses short in-memory guard (`data-tracked`) to avoid duplicate submit firing

### QA Checklist
- Submit test lead from mobile + desktop
- Confirm `SubmitLead` appears in GA4 Realtime
- Confirm conversion appears in Google Ads diagnostics
- Click WhatsApp button once and confirm single `ClickWhatsApp` event

## 3) Google Ads Campaign (Single Campaign)
- Campaign name: `BUY — Pattaya — English`
- Network: Search only
- Match type: Exact + Phrase only
- No Broad, No Display, No PMax
- Initial keyword set:
  - buy condo pattaya
  - condo for sale pattaya
  - foreign quota condo pattaya
  - buy apartment pattaya
- Budget guide: `~2,000 THB/day` (from 60K THB/month)
- Bid strategy: Manual CPC (first 14 days)

## 4) Sales SLA Protocol
- WhatsApp lead response: `< 5 minutes`
- Form lead response: `< 15 minutes`

### First Response Script
"Hi [Name], thank you for contacting AMP. I can prepare a shortlist today. May I confirm your budget range, buying timeline, and purpose (own stay/investment)?"

### Qualification Questions
1. Budget range?
2. Buying timeline?
3. Purpose? (Own stay / Investment)

### Lead Log Fields
- Name
- Date
- Source
- Status
- Next Action
