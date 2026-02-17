# Phase 1B — Marketplace + Membership Page Blueprints (V3)

Guiding constraint (V3): Marketplace and membership must **increase authority** (tools, vetted vendors, investor intelligence) without turning the site into a noisy classifieds portal.

Membership tiers referenced (monetization details in Phase 3):
- Guest (public)
- Member: Free (account) — saved searches, shortlist history
- Member: Investor (paid) — yield tools, reports, comparables exports
- Member: Pro (paid) — co-agent tools, lead routing, marketplace discounts

---

## 1) Sell

### 1️⃣ Strategic Role
- Funnel position: Seller acquisition (parallel funnel).
- Core objective: Capture seller leads with property details and motivation.
- Business outcome: Listing pipeline for inventory + commission opportunities.

### 2️⃣ Target Personas
- Seller, Expat, Investor.

### 3️⃣ Full Section Architecture

**S1 — Sell Hero (authority + discretion)**
- Objective: reassure sellers about professionalism and privacy.
- Headline concept: “Sell with clear pricing context and qualified buyer reach.”
- Subtext logic: “We don’t spam your listing; we qualify inquiries.”
- CTA: “Request a valuation call” → form anchor.
- Data dependency: none.
- Analytics: `page_view(sell)`, `cta_click(sell_valuation)`.
- Internal linking: to Testimonials (seller quote), About.

**S2 — How We Price (process transparency)**
- Objective: educate seller and filter unrealistic expectations.
- Headline: “Pricing that clears, not just ‘asking.’”
- Subtext: comps, condition, floor/stack, time-to-sell expectations.
- CTA: “See comparable logic” (gated preview) → membership gate.
- Data: `pricing_models` (future), `comparables` (future).
- Analytics: `membership_gate_view(pricing_comps)`.

**S3 — Seller Intake Form (structured)**
- Objective: capture listing details.
- Fields: property type, building/project, bedrooms, size, floor, facing, condition, asking price, urgency, ownership notes, contact.
- CTA: Submit.
- Conversion intent: create `seller_lead` (or `inquiry` with type=`sell`).
- Data: `inquiries` (extend with `intent='sell'`) OR new `seller_leads`.
- Analytics: `form_*` with `form_id='sell_intake'`.
- Internal linking: post-submit “Next steps” + “What documents help” → Resources.

**S4 — What Happens Next (SLA + doc checklist)**
- Objective: reduce seller anxiety.
- CTA: download “seller checklist” (resource).
- Data: `resources`.
- Analytics: `resource_download`.

### 4️⃣ UX Behavior
- CTA frequency: hero + form submit only.
- Mobile: stepper-style form (3 steps) to reduce fatigue.
- Friction reduction: allow “I don’t know” options for complex fields.

### 5️⃣ System Dependency
- Tables: `inquiries` (intent sell), `properties` (optional matching), `lead_assignments`, `audit_logs`.
- Admin impact: add Seller pipeline view + valuation tasks.
- Role visibility: public; submissions visible to Admin/Advisor only.

### 6️⃣ SEO & Authority Logic
- Primary keyword: “sell condo pattaya”.
- Supporting: “sell property pattaya foreign owner”, “pattaya condo valuation”.
- Internal linking: Sell → Resources (docs) → Contact.
- Depth: 800–1300 words; include clear disclaimers.

---

## 2) Member Profile

### 1️⃣ Strategic Role
- Funnel position: Retention + monetization expansion.
- Core objective: Give members a reason to return: saved items, saved searches, requested reports.
- Business outcome: Higher LTV + upgrade conversion.

### 2️⃣ Target Personas
- Investor, Buyer, Co-Agent.

### 3️⃣ Full Section Architecture

**S1 — Member Dashboard Header**
- Objective: identity + plan status + upgrade hook.
- Headline: “Your workspace.”
- CTA:
  - If Free: “Upgrade to Investor”
  - If Investor: “Request a report”
- Data: `users`, `members`, `subscriptions`.
- Analytics: `page_view(member_profile)`, `membership_upgrade_click`.

**S2 — Saved Searches (Property Hub presets)**
- Objective: re-engagement.
- CTA: “Run search” (opens Property Hub with filters).
- Data: `saved_searches`.
- Analytics: `cta_click(run_saved_search)`.

**S3 — Saved Items (properties/projects/areas)**
- Objective: keep shortlist inside platform.
- CTA: each item “Share with advisor” (creates inquiry context).
- Data: `saved_items` (polymorphic: property/project/area).
- Analytics: `listing_click(saved_item)`.

**S4 — Reports & Exports (Investor tier)**
- Objective: premium utility.
- CTA: download/export.
- Data: `reports`, `report_requests`.
- Analytics: `report_download`.

**S5 — Conversation History (inquiries + advisor updates)**
- Objective: reduce fragmentation across WhatsApp/Email.
- CTA: “Update criteria” (inquiry update).
- Data: `inquiries`, `inquiry_messages`.
- Analytics: `cta_click(update_criteria)`.

### 4️⃣ UX Behavior
- Scroll: summary → saved searches → saved items → reports → history.
- Mobile: tabs (Saved / Reports / Messages).
- Sticky elements: none; dashboard must feel calm.

### 5️⃣ System Dependency
- Tables: `users`, `members`, `subscriptions`, `saved_searches`, `saved_items`, `inquiries`.
- Admin impact: member management and subscription reconciliation.
- Visibility: authenticated only.

### 6️⃣ SEO
- Noindex (account page).

---

## 3) Marketplace

### 1️⃣ Strategic Role
- Funnel position: Monetization + authority (vetted services).
- Core objective: Provide high-trust vendor/services layer (law, accounting, movers, renovation, property management).
- Business outcome: Marketplace commission + improved conversion by reducing uncertainty.

### 2️⃣ Target Personas
- Investor, Expat, Buyer, Seller, Co-Agent.

### 3️⃣ Full Section Architecture

**S1 — Marketplace Hero (vetted network)**
- Objective: “We only list vetted partners.”
- CTA: “Request an introduction” → Ticket/Contact.
- Data: `marketplace_categories` (for browse).
- Analytics: `page_view(marketplace)`.

**S2 — Category Grid (6–10 categories)**
- Objective: route quickly.
- CTA: category card click.
- Data: `marketplace_categories`.
- Analytics: `listing_click(category)`.
- Internal linking: marketplace → category.

**S3 — Trust & Vetting Standard (short, explicit)**
- Objective: authority; liability control.
- CTA: “How vetting works” → About/Resources.
- Data: CMS.
- Analytics: `cta_click(vetting)`.

**S4 — Featured Items (sponsored, controlled)**
- Objective: revenue without clutter.
- CTA: “View details”.
- Data: `marketplace_items` with `is_featured` and `sponsor_tier`.
- Analytics: `listing_impression(type=marketplace_item)`, `listing_click`.

### 4️⃣ UX Behavior
- CTA normalization: only 1 primary CTA in hero.
- Mobile: category list.

### 5️⃣ System Dependency
- Tables: `marketplace_categories`, `marketplace_items`, `marketplace_item_media`, `marketplace_leads`.
- Admin impact: review workflow (approve/reject), sponsor controls, commission tracking.
- Role visibility: public browse; contact details limited to members (optional) to reduce scraping.

### 6️⃣ SEO & Authority Logic
- Primary keyword: “property services pattaya”.
- Supporting: “thai property lawyer pattaya”, “property management pattaya”.
- Internal linking: relevant pages link to relevant categories (Buy → Legal; Rent → Management).
- Depth: 800–1400 words total.

---

## 4) Marketplace Category

### 1️⃣ Strategic Role
- Funnel: decision support + lead routing.
- Objective: allow comparison of vendors with trust-first information.
- Outcome: introduction requests.

### 2️⃣ Target Personas
- Expat, Buyer, Seller, Investor.

### 3️⃣ Full Section Architecture

**S1 — Category Hero**
- Objective: clarify what this category covers.
- CTA: “Request introduction” (opens short form).
- Data: `marketplace_categories`.
- Analytics: `page_view(marketplace_category)`.

**S2 — Filters (minimal)**
- Filters: language, response SLA, price band.
- Data: `marketplace_items`.
- Analytics: `search_filter_change`.

**S3 — Vendor List**
- Card content: name, 2 proof points, languages, service scope, “Why we list them”.
- CTA: “View details”.
- Data: `marketplace_items`.
- Analytics: `listing_impression`, `listing_click`.

**S4 — Intro Request (inline form)**
- Objective: capture and route.
- CTA: Submit.
- Data: `marketplace_leads` + `inquiries` link.
- Analytics: `form_*`.

### 4️⃣ UX Behavior
- Sticky: none; keep calm.
- Friction reduction: prefilled category in form.

### 5️⃣ System Dependency
- Tables: `marketplace_items`, `marketplace_leads`, `users` (assigned advisor).
- Visibility: public.

### 6️⃣ SEO
- Primary keyword: “[category] pattaya”.

---

## 5) Marketplace Detail

### 1️⃣ Strategic Role
- Funnel: conversion.
- Objective: provide enough trust and scope clarity to request introduction.
- Outcome: marketplace lead + CRM task.

### 2️⃣ Target Personas
- Expat, Buyer, Seller, Investor.

### 3️⃣ Full Section Architecture

**S1 — Vendor Hero**
- Objective: identity + scope.
- CTA: “Request introduction” + “Message advisor”.
- Data: `marketplace_items`.
- Analytics: `page_view(marketplace_detail)`, `cta_click(intro)`.

**S2 — Services & Pricing Signals**
- Objective: reduce back-and-forth.
- Subtext logic: ranges, not exact quotes.
- Data: `marketplace_item_offers`.
- Analytics: `section_view(offers)`.

**S3 — Trust Proof**
- Objective: authority.
- Content: vetting notes, response SLA, testimonials (if permitted).
- Data: `marketplace_item_reviews` (optional), `audit_logs` for internal.

**S4 — Intro Request Form (short)**
- Objective: capture.
- Data: `marketplace_leads`.
- Analytics: `form_*`.

**S5 — Related Resources**
- Objective: help user understand category risks.
- CTA: resource download.
- Data: `resources`.

### 4️⃣ UX Behavior
- CTA frequency: hero + form.
- Mobile: sticky “Request introduction”.

### 5️⃣ System Dependency
- Tables: `marketplace_items`, `marketplace_leads`, `resources`.
- Admin impact: item approval + sponsor tiers.

### 6️⃣ SEO
- Primary: “[vendor] pattaya [service]”.

