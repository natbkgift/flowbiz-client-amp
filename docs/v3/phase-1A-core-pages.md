# Phase 1A — Core Page Blueprints (V3)

Assumptions (explicit):
- V3 keeps bilingual routing under `/{locale}/...` with EN default.
- V3 introduces marketplace + membership + CRM without weakening the current authority-first advisory funnel.
- First‑party analytics remains the only analytics system (events → `/api/v1/events`).

Analytics taxonomy (used below; consistent naming):
- `page_view` (server or client): `{ page, locale, session_id }`
- `nav_click`: `{ from_page, to, label, placement: 'header'|'mobile'|'footer' }`
- `cta_click`: `{ page, cta_id, label, placement, intent }`
- `section_view`: `{ page, section_id }` (triggered on 50% intersection)
- `form_start|form_submit|form_success|form_error`: `{ page, form_id, context_id? }`
- `search_open|search_filter_change|search_results_view|listing_impression|listing_click`: `{ page, ... }`
- `membership_gate_view|membership_upgrade_click`: `{ page, plan }`

---

## 1) Home

### 1️⃣ Strategic Role
- Funnel position: Entry → segmentation → advisor contact.
- Core objective: Route visitors to the right journey (Invest / Buy / Live) while establishing authority and trust.
- Business outcome: Qualified inquiries + WhatsApp/LINE conversations + returning sessions.

### 2️⃣ Target Personas
- Investor, Expat, Lifestyle Buyer.

### 3️⃣ Full Section Architecture

**S1 — Hero: Authority Promise + Dual CTA (locked copy in v2; retain tone)**
- Objective: Communicate “authority + process + Pattaya focus” in one scan; offer 2 clear next actions.
- Headline concept: “Confidence through process, not hype.”
- Subtext logic: 1–2 sentences: secure ownership, net assumptions, advisory.
- CTA placement & type:
  - Primary: `Explore Investment Opportunities` → `/{locale}/invest`.
  - Secondary: `Speak to an Advisor` → `/{locale}/contact`.
- Conversion intent: Soft commit (content) + direct commit (advisor).
- Data dependency (DB model): none required; optional `home_hero_variants` for controlled A/B (server-side).
- Analytics events:
  - `page_view` (page=`home`)
  - `section_view` (section_id=`hero`)
  - `cta_click` for both CTAs with `placement='hero'`.
- Internal linking logic: hero CTAs anchor the two core funnels; add tertiary “Why trust us” anchor link.

**S2 — Path Selector (3 cards: Invest / Buy / Live)**
- Objective: Self-identification and funnel routing.
- Headline concept: “Choose your path.”
- Subtext logic: Each card answers “what you get in 60 seconds”.
- CTA placement & type: Each card is clickable + “Learn more” micro CTA.
- Conversion intent: Move to dedicated funnel pages without forcing contact yet.
- Data dependency: none.
- Analytics: `cta_click` with `cta_id='path_invest'|'path_buy'|'path_live'`.
- Internal linking: link to `/{locale}/invest`, `/{locale}/buy`, `/{locale}/rent` and to `/{locale}/buying-process`.

**S3 — Trust Stack (3–5 bullets + compliance microcopy)**
- Objective: Reduce perceived risk and “agency skepticism.”
- Headline concept: “Why international buyers trust us.”
- Subtext logic: Process-led, local market context, privacy-first analytics.
- CTA placement: Single text CTA at end: “How our process works” → `/{locale}/buying-process`.
- Conversion intent: Credibility reinforcement.
- Data dependency: `trust_markers` (optional CMS) for audit-ready claims.
- Analytics: `section_view(trust)`, `cta_click(process_link)`.
- Internal linking: to `buying-process`, `about`, `team`.

**S4 — Featured Developments (curated projects)**
- Objective: Provide tangible inventory without “marketplace noise.”
- Headline concept: “Curated starting points.”
- Subtext logic: 3–6 projects with area, price band, investor/lifestyle tag.
- CTA placement:
  - Card CTA: “View project” → `/{locale}/projects/{slug}`.
  - Section CTA: “Browse all projects” → `/{locale}/projects`.
- Conversion intent: Engagement + intent reveal.
- Data dependency: `projects`, `areas`, `developers`.
- Analytics: `listing_impression` (type=`project`), `listing_click`.
- Internal linking: projects → developers → areas; each card includes area link.

**S5 — Market Insight (3 pillars + 1 authority asset)**
- Objective: Establish analytical credibility (demand, costs, risk) and capture leads via gated asset.
- Headline concept: “How we model reality.”
- Subtext logic: “No hype—assumptions and constraints.”
- CTA placement:
  - Primary: “Request a Yield Report” → `/{locale}/contact` with prefilled context.
- Conversion intent: High-intent lead capture.
- Data dependency: `reports` (future), `lead_magnets`.
- Analytics: `cta_click(yield_report)`.
- Internal linking: to `/{locale}/insights` and `/{locale}/invest`.

**S6 — Testimonials (2–4 credible quotes + identity cues)**
- Objective: Social proof with specificity.
- Headline concept: “What clients valued.”
- Subtext logic: Quote + persona + journey type.
- CTA placement: “Read more” → `/{locale}/testimonials`.
- Conversion intent: Trust.
- Data dependency: `testimonials`.
- Analytics: `section_view(testimonials)`, `cta_click(testimonials_more)`.
- Internal linking: map each testimonial to relevant page (invest/buy/areas).

**S7 — Bottom CTA + Lead Form (one last ask, no clutter)**
- Objective: Convert warm users.
- Headline concept: “Shortlist built around your criteria.”
- CTA placement:
  - Primary: `Explore Investment Opportunities`.
  - Secondary: `Speak to an Advisor`.
  - Inline lead form: optional (shown after `section_view` to reduce early friction).
- Conversion intent: Inquiry creation.
- Data dependency: `inquiries`.
- Analytics: `form_*` + `cta_click`.
- Internal linking: contact, invest.

### 4️⃣ UX Behavior
- Scroll structure: Hero → Segmentation → Trust → Tangible inventory → Insight → Proof → CTA.
- Visual hierarchy: 1 dominant hero statement, 2 CTAs, then progressively denser content.
- CTA frequency: hard cap 2 primary CTAs above fold; avoid repeating WhatsApp + LINE + Phone simultaneously.
- Mobile adjustments: sticky bottom CTA (2 buttons) only after first scroll; keep header compact.
- Sticky elements: sticky header, sticky mobile CTA; floating WhatsApp is optional but must not overlap sticky bar.
- Friction reduction: show lead form only after user scrolls past Trust or clicks “Speak to an Advisor”.

### 5️⃣ System Dependency
- DB tables: `projects`, `areas`, `developers`, `testimonials`, `inquiries`, `analytics_events`.
- Relations: `projects.area_id → areas.id`, `projects.developer_id → developers.id`.
- Admin module impact: need admin CRUD for projects/areas/testimonials and `is_featured` toggle.
- Role visibility rules: Guest sees curated subset; Admin/Content Manager can preview drafts.

### 6️⃣ SEO & Authority Logic
- Primary keyword: “invest property pattaya” / “buy property pattaya”.
- Supporting: “foreign quota condo thailand”, “pattaya condo investment”, “pattaya area guide”.
- Internal linking: Home → Invest/Buy/Rent; Home → Projects/Areas; Home → Insights/Buying Process.
- Content depth: 900–1400 words equivalent across sections; include 1–2 structured data blocks (Organization + WebSite/SearchAction).

---

## 2) About

### 1️⃣ Strategic Role
- Funnel position: Trust confirmation (mid-funnel).
- Core objective: Explain operating philosophy, process discipline, and local expertise.
- Business outcome: Increase contact conversion rate; reduce “is this a real agency?” doubt.

### 2️⃣ Target Personas
- Investor, Expat, Developer, Seller.

### 3️⃣ Full Section Architecture

**S1 — About Hero (authority thesis)**
- Objective: “Who we are + why we exist” in 1 scan.
- Headline concept: “International-grade diligence, Pattaya-local execution.”
- Subtext logic: process-led advisory, transparent assumptions.
- CTA: `Speak to an Advisor`.
- Data: `organization_profile`.
- Analytics: `page_view(about)`, `cta_click(about_contact)`.
- Internal linking: to Team, Buying Process, Contact.

**S2 — Operating Principles (3–5 principles)**
- Objective: Turn vague trust into concrete standards.
- Headline: “What we will and won’t do.”
- Subtext: bullets with examples (quota check, fee breakdown, viewing plan).
- CTA: “See the process” → Buying Process.
- Data: `principles` (CMS).
- Analytics: `section_view(principles)`.

**S3 — Local Market Method (how insights are formed)**
- Objective: Establish analytical authority (not influencer marketing).
- Headline: “How we evaluate demand, costs, and exit paths.”
- CTA: “Explore insights” → Insights.
- Data: `insight_topics`, `market_snapshots`.
- Analytics: `cta_click(insights)`.

**S4 — Compliance & Risk Notes (legal disclaimer done right)**
- Objective: Reduce liability while increasing perceived professionalism.
- Headline: “Clarity on what we provide.”
- Subtext: not legal advice; encourage professional verification.
- CTA: none (avoid clutter).
- Data: `legal_snippets`.
- Analytics: `section_view(compliance)`.

**S5 — Proof of Work (case-style, anonymized)**
- Objective: Replace testimonials-only proof with process evidence.
- Headline: “What a shortlist looks like.”
- CTA: “Request a shortlist” → Contact with context.
- Data: `case_studies`.
- Analytics: `cta_click(request_shortlist)`.

### 4️⃣ UX Behavior
- Scroll: thesis → principles → method → compliance → proof.
- CTA frequency: 1 in hero, 1 at end.
- Mobile: collapse long sections into accordions; keep “Request shortlist” button persistent at end.
- Friction reduction: content-first; form appears only as final section.

### 5️⃣ System Dependency
- Tables: `content_blocks`, `team_members`, `case_studies` (new).
- Admin impact: Content Manager updates About page blocks, publishes.
- Visibility: all public.

### 6️⃣ SEO & Authority Logic
- Primary keyword: “pattaya property advisor”.
- Supporting: “international buyers thailand property”, “due diligence pattaya”.
- Internal linking: About → Team → Contact; About → Buying Process; About → Press.
- Depth: 1200–1800 words; E‑E‑A‑T signals (team names, credentials, office contact).

---

## 3) Contact

### 1️⃣ Strategic Role
- Funnel position: Primary conversion endpoint.
- Core objective: Convert to inquiry + direct messaging.
- Business outcome: Inquiries with enough criteria to produce shortlist.

### 2️⃣ Target Personas
- Investor, Expat, Lifestyle Buyer, Seller, Developer, Co-Agent.

### 3️⃣ Full Section Architecture

**S1 — Contact Hero (advisor-led guidance)**
- Objective: Confirm visitor is in the right place.
- Headline: “Speak with an Advisor.”
- Subtext: response expectations and what info helps.
- CTA placement: WhatsApp + LINE + Phone (phone only on mobile).
- Conversion intent: direct contact.
- Data: `contact_channels`.
- Analytics: `cta_click(channel_whatsapp|channel_line|channel_phone)`.
- Internal linking: to Buying Process and FAQ.

**S2 — Trust Markers (compact)**
- Objective: Reduce hesitation before form.
- Headline: “Clear process. Privacy-first.”
- CTA: none.
- Data: `trust_markers`.
- Analytics: `section_view(contact_trust)`.

**S3 — Structured Inquiry Form (criteria-first)**
- Objective: Capture minimum viable info: journey type, budget band, timeline, areas.
- Headline: “Send your request.”
- Subtext: “We reply with clear next steps.”
- CTA: Submit.
- Conversion intent: create `inquiry`.
- Data dependency: `inquiries`, `lead_attribution`.
- Analytics:
  - `form_start` when focus enters
  - `form_submit`, `form_success`, `form_error`
- Internal linking: after submit, show “Next steps” (FAQ + Buying Process) links.

**S4 — What Happens Next (3-step timeline)**
- Objective: Set expectations and reduce anxiety.
- Headline: “What you’ll receive in 24 hours.”
- CTA: “View our process” (Buying Process).
- Data: CMS.
- Analytics: `cta_click(next_steps_process)`.

### 4️⃣ UX Behavior
- Scroll: channels → trust → form → next steps.
- CTA frequency: channels top; avoid repeating WhatsApp/LINE inside form if channels already above (pick one location).
- Mobile: sticky bottom “WhatsApp / Advisor” bar; form fields use full-width.
- Friction reduction: provide preset dropdowns for budget/timeline/intent; free-text optional.

### 5️⃣ System Dependency
- Tables: `inquiries`, `users`(advisor), `lead_assignments`, `analytics_events`.
- Relations: inquiry assigned to advisor; channel click ties to session_id.
- Admin impact: lead inbox, assignment UI, SLA timers.
- Visibility: public; internal leads view restricted.

### 6️⃣ SEO & Authority Logic
- Primary keyword: “contact property agent pattaya”.
- Supporting: “whatsapp property pattaya”, “investment advisor pattaya”.
- Internal linking: contact ↔ invest/buy/rent; contact ↔ FAQ/buying-process.
- Depth: 400–700 words (keep conversion focused).

---

## 4) Team

### 1️⃣ Strategic Role
- Funnel position: Trust validation (late mid-funnel).
- Core objective: Human authority + role clarity.
- Business outcome: Increased contact conversion, lower spam/low-quality leads.

### 2️⃣ Target Personas
- Investor, Expat, Developer, Seller, Co-Agent.

### 3️⃣ Full Section Architecture

**S1 — Team Hero**
- Objective: “Real people, real accountability.”
- Headline concept: “Advisors with process discipline.”
- CTA: “Speak to an Advisor” → Contact.
- Data: `team_members`.
- Analytics: `page_view(team)`, `cta_click(team_contact)`.

**S2 — Team Grid (roles + languages + specialties)**
- Objective: Help users self-select the best contact.
- Headline: “Who you’ll work with.”
- CTA: each card “View profile” → Team Profile.
- Conversion intent: deeper trust.
- Data: `team_members`, `team_specialties`.
- Analytics: `listing_impression(type=team)`, `listing_click`.
- Internal linking: profile pages, contact.

**S3 — How We Work (short)**
- Objective: Connect people → process.
- CTA: Buying Process.
- Data: CMS.

### 4️⃣ UX Behavior
- Scroll: hero → grid → how we work.
- CTA frequency: only one global CTA; per-card CTA is informational.
- Mobile: card list with collapsible specialties.

### 5️⃣ System Dependency
- Tables: `users`, `team_members` (or `users` with role `advisor`), `roles`.
- Admin impact: manage team bios + availability.
- Visibility: public; hide private contact details.

### 6️⃣ SEO & Authority Logic
- Primary keyword: “pattaya property advisors”.
- Supporting: “english speaking agent pattaya”, “thai property advisor”.
- Internal linking: Team → Team Profile → Contact.
- Depth: 700–1200 words total.

---

## 5) Team Profile

### 1️⃣ Strategic Role
- Funnel position: Last-mile trust.
- Core objective: Convert “browsing” into “contact this person/team.”
- Business outcome: Higher-quality inquiries with clearer intent.

### 2️⃣ Target Personas
- Investor, Expat, Lifestyle Buyer, Developer, Co-Agent.

### 3️⃣ Full Section Architecture

**S1 — Profile Hero (name + role + language + response SLA)**
- Objective: credibility and comfort.
- CTA: “WhatsApp this advisor” + “Send criteria” (opens form anchored).
- Data: `users`, `advisor_profiles`.
- Analytics: `cta_click(advisor_whatsapp)`.

**S2 — Specialty Focus (invest / buy / rent / developer)**
- Objective: reassure fit.
- Data: `advisor_specialties`.

**S3 — Recent Insights / Listings (optional, small)**
- Objective: show real work.
- CTA: link to a relevant Insight.
- Data: `blog_posts`/`insights`, `properties`.
- Analytics: `listing_click`.

**S4 — Contact Form (prefilled advisor_id)**
- Objective: create inquiry directly assigned.
- Data: `inquiries`, `lead_assignments`.
- Analytics: `form_*` with `context_id=advisor_id`.

### 4️⃣ UX Behavior
- Sticky: on mobile, a single “WhatsApp advisor” button.
- Friction reduction: prefill message template and intent.

### 5️⃣ System Dependency
- Tables: `users`, `roles`, `inquiries`, `lead_assignments`, `analytics_events`.
- Role visibility: public.

### 6️⃣ SEO & Authority Logic
- Primary keyword: “property advisor pattaya [name]”.
- Supporting: “investment advisor pattaya”.
- Internal linking: Team grid → Profile → Contact.
- Depth: 500–900 words.

---

## 6) Projects

### 1️⃣ Strategic Role
- Funnel position: Inventory discovery (mid-funnel).
- Core objective: Browse developments with authority framing (not classifieds).
- Business outcome: Project detail views → inquiries.

### 2️⃣ Target Personas
- Investor, Lifestyle Buyer, Expat, Developer.

### 3️⃣ Full Section Architecture

**S1 — Projects Landing Hero**
- Objective: position projects as curated opportunities.
- CTA: “Speak to an Advisor”.
- Data: none.
- Analytics: `page_view(projects)`.

**S2 — Filter Panel (minimal + opinionated)**
- Objective: reduce overwhelm.
- Filters: area, budget band, yield potential tag, completion status.
- CTA: none.
- Data: `projects`, `areas`.
- Analytics: `search_filter_change`.

**S3 — Projects Grid (cards)**
- Objective: scan quickly.
- Card: name, area, developer, delivery, starting price, 1-line investment note.
- CTA: “View project”.
- Data: `projects`, `developers`.
- Analytics: `listing_impression(type=project)`, `listing_click`.

**S4 — Advisory CTA (contextual)**
- Objective: conversion after engagement.
- CTA: “Request shortlist for these criteria” (prefills filters).
- Data: `inquiries`.
- Analytics: `cta_click(projects_shortlist)`.

### 4️⃣ UX Behavior
- Scroll: hero → filters → results → advisory CTA.
- Mobile: filters open as drawer; results list.
- Sticky: “Filters” button only; avoid sticky contact bar + sticky filters simultaneously.

### 5️⃣ System Dependency
- Tables: `projects`, `areas`, `developers`, `project_media`.
- Admin impact: project CRUD, publish/draft, featured flag.
- Visibility: guest sees published only.

### 6️⃣ SEO & Authority Logic
- Primary keyword: “pattaya new condo projects”.
- Supporting: “condo projects jomtien”, “central pattaya condo”.
- Internal linking: projects → project detail; projects → areas; projects → developers.
- Depth: 900–1400 words equivalent (include “how we curate” mini block).

---

## 7) Project Detail

### 1️⃣ Strategic Role
- Funnel position: Decision support.
- Core objective: Provide enough clarity to request shortlist/viewing.
- Business outcome: inquiries with project_id + viewing requests.

### 2️⃣ Target Personas
- Investor, Lifestyle Buyer, Expat.

### 3️⃣ Full Section Architecture

**S1 — Project Hero (facts first)**
- Objective: immediate clarity.
- Headline: project name + area.
- Subtext: developer, status, delivery, starting price.
- CTA: “Request viewing plan” + “Speak to an Advisor”.
- Data: `projects`, `areas`, `developers`.
- Analytics: `page_view(project_detail)`; `cta_click(viewing_plan)`.

**S2 — Investment Snapshot (numbers with assumptions)**
- Objective: authority via constraints.
- Blocks: rent range (band), occupancy assumption, costs highlights.
- CTA: “Request yield worksheet” (membership-gated optional in v3).
- Data: `project_investment_models`.
- Analytics: `section_view(investment_snapshot)`, `membership_gate_view`.

**S3 — Lifestyle Fit (who it suits)**
- Objective: reduce mismatch.
- Data: `project_tags`, `amenities`.

**S4 — Unit Types / Floor Plans (if available)**
- Objective: reduce follow-up friction.
- CTA: “Send me unit availability” (contact).
- Data: `project_units`, `media`.

**S5 — Location Context (area + map)**
- Objective: connect to Area Detail.
- CTA: “Explore this area” → Area Detail.
- Data: `areas`.
- Analytics: `cta_click(area_detail)`.

**S6 — Related Properties (resale/rent matching)**
- Objective: bridge new-build ↔ resale inventory.
- CTA: “Open Property Hub with filters”
- Data: `properties` (query by area/project linkage).
- Analytics: `listing_click(type=property)`.

**S7 — Advisor Form (project_id prefilled)**
- Objective: inquiry.
- Data: `inquiries`.
- Analytics: `form_*`.

### 4️⃣ UX Behavior
- Scroll: facts → snapshot → fit → units → location → related → form.
- CTA frequency: hero + after snapshot + final form.
- Mobile: sticky “WhatsApp / Request viewing”.

### 5️⃣ System Dependency
- Tables: `projects`, `developers`, `areas`, `properties`, `inquiries`, `analytics_events`.
- Admin: manage snapshot values; control what’s public.
- Visibility: investment snapshot detail gated for Members (Investor tier).

### 6️⃣ SEO & Authority Logic
- Primary keyword: “[Project Name] Pattaya”.
- Supporting: “investment yield [project]”, “condo [area]”.
- Internal linking: to developer detail, area detail, property hub.
- Depth: 1200–2200 words equivalent.

---

## 8) Developers

### 1️⃣ Strategic Role
- Funnel position: Authority/inventory exploration.
- Objective: Let users evaluate developer credibility quickly.
- Outcome: developer detail views → project browsing.

### 2️⃣ Target Personas
- Investor, Lifestyle Buyer, Developer.

### 3️⃣ Full Section Architecture
- S1 Hero: “Developers we cover” + “How we vet claims” microcopy.
- S2 Developer list with filters (brand tier, track record, area presence).
- S3 Advisory CTA: “Request projects shortlist by developer”.
- Data: `developers`, `projects`.
- Analytics: `search_filter_change`, `listing_click(type=developer)`.

### 4️⃣ UX Behavior
- Minimal; no heavy CTAs.

### 5️⃣ System Dependency
- Admin: developer CRUD + attach press items.

### 6️⃣ SEO
- Primary keyword: “pattaya property developers”.

---

## 9) Developer Detail

### 1️⃣ Strategic Role
- Funnel: Decision support.
- Objective: consolidate developer reputation, projects, and risk framing.
- Outcome: shortlist inquiry.

### 2️⃣ Target Personas
- Investor, Lifestyle Buyer.

### 3️⃣ Full Section Architecture
- S1 Hero: developer name + positioning.
- S2 Track record: completed vs in-progress.
- S3 Projects grid (developer scoped).
- S4 Press + statements (authority).
- S5 Advisory CTA: “Compare projects from 2–3 developers” (contact).
- Data: `developers`, `projects`, `press_items`.
- Analytics: `page_view(developer_detail)`, `cta_click(compare_developers)`.

### 4️⃣ UX
- Tabs: Overview / Projects / Press.

### 5️⃣ System
- Role: published only.

### 6️⃣ SEO
- Primary keyword: “[Developer] Pattaya projects”.

---

## 10) Buy

### 1️⃣ Strategic Role
- Funnel position: “Buyer education” → “contact”.
- Objective: reduce fear (quota/due diligence) and guide steps.
- Outcome: inquiries with intent=buy.

### 2️⃣ Target Personas
- Expat, Lifestyle Buyer, Investor.

### 3️⃣ Full Section Architecture

**S1 — Buy Hero (clarity + process)**
- Objective: reassure and set scope.
- CTA: `Speak to an Advisor`.
- Data: none.
- Analytics: `page_view(buy)`, `cta_click(buy_contact_hero)`.

**S2 — Buying Process (high-level, 3–5 steps)**
- Objective: reduce overwhelm.
- CTA: “See full process” → Buying Process.
- Data: `content_blocks`.
- Analytics: `cta_click(buying_process_full)`.

**S3 — Foreign Quota (condo ownership)**
- Objective: prevent surprise.
- CTA: “Ask us to confirm quota” → Contact prefilled.
- Data: `legal_topics`.
- Analytics: `cta_click(quota_confirm)`.

**S4 — Due Diligence Checklist (practical)**
- Objective: authority + conversion.
- CTA: “Send my target building/unit” → Contact.
- Data: `resources` (downloadable checklist; gated optional).
- Analytics: `resource_download` (future).

**S5 — Featured Listings (buy inventory)**
- Objective: tangible inventory.
- CTA: property card “View” + “Contact”.
- Data: `properties` (type=sale).
- Analytics: `listing_impression(type=property)`, `listing_click`, `cta_click(property_contact)`.

**S6 — Advisory CTA + Lead Form**
- Objective: inquiry.
- Data: `inquiries`.

### 4️⃣ UX Behavior
- Scroll: hero → process → quota → diligence → listings → form.
- CTA frequency: 1 primary repeated after listings.
- Mobile: filters as drawer; sticky CTA after scrolling past hero.

### 5️⃣ System Dependency
- Tables: `properties`, `areas`, `inquiries`, `analytics_events`.
- Admin: property import/sync, moderation.

### 6️⃣ SEO
- Primary: “buy property pattaya”.
- Supporting: “foreign quota pattaya condo”, “due diligence thailand condo”.
- Linking: buy → buying-process → resources; buy → property hub.

---

## 11) Rent

### 1️⃣ Strategic Role
- Funnel: Lifestyle entry with conversion.
- Objective: help find area + shortlist rentals.
- Outcome: inquiries with intent=rent + viewing requests.

### 2️⃣ Personas
- Lifestyle Buyer, Expat.

### 3️⃣ Sections
- S1 Hero: “Find Your Pattaya Rental” + CTA “Speak to an Advisor”.
- S2 Area-first browsing (Areas teaser + Map).
- S3 Rental listings (filters: budget, bedrooms, move-in date).
- S4 Advisory CTA + form.
- Data: `properties` (type=rent), `areas`.
- Analytics: `search_filter_change`, `listing_click`, `form_*`.

### 4️⃣ UX
- Reduce filters; rental shoppers need speed.

### 5️⃣ System
- `viewings` table (schedule) becomes relevant.

### 6️⃣ SEO
- “rent condo pattaya”, “pattaya condo rental jomtien”.

---

## 12) Property Hub (Unified Search)

### 1️⃣ Strategic Role
- Funnel position: Marketplace discovery engine.
- Objective: a single, fast, trustworthy search that powers Buy/Rent and internal “related listings.”
- Outcome: listing engagement + inquiry creation.

### 2️⃣ Personas
- Investor, Expat, Lifestyle Buyer, Seller.

### 3️⃣ Full Section Architecture

**S1 — Search Hero (one field + 3 quick filters)**
- Objective: “start in 5 seconds.”
- CTA: none.
- Data: none.
- Analytics: `search_open`.

**S2 — Filter System (opinionated presets)**
- Filters: intent (buy/rent), area, price band, bedrooms, property type, tags (near beach, high floor).
- Data: `properties`, `areas`, `property_tags`.
- Analytics: `search_filter_change` with diff.

**S3 — Results + Sorting**
- Objective: trust (no dark patterns).
- Sort: relevance, newest, price.
- Data: `properties`.
- Analytics: `search_results_view`, `listing_impression`.

**S4 — Compare (lightweight)**
- Objective: reduce tab chaos.
- Data: none.
- Analytics: `compare_add`, `compare_remove`.

**S5 — Exit CTA**
- Objective: capture when user is stuck.
- CTA: “Send my criteria” (opens form with filters prefilled).
- Data: `inquiries`.
- Analytics: `cta_click(hub_send_criteria)`.

### 4️⃣ UX
- Sticky: on desktop, filter sidebar; on mobile, filter drawer.
- Friction: keep results visible; show count + clear reset.

### 5️⃣ System Dependency
- Tables: `properties`, `property_media`, `areas`, `projects`, `inquiries`, `analytics_events`.
- Admin: moderation + mapping external IDs.

### 6️⃣ SEO
- Primary: “pattaya property listings”.
- Supporting: “condo for sale pattaya”, “villa pattaya for sale”.
- Depth: indexable category pages (Property Hub + filters → canonical rules).

---

## 13) Property Detail

### 1️⃣ Strategic Role
- Funnel: decision support + conversion.
- Objective: present listing clearly with trust framing and next steps.
- Outcome: inquiry with property_id, viewing request.

### 2️⃣ Personas
- Investor, Expat, Lifestyle Buyer.

### 3️⃣ Sections
- S1 Hero: title, price, key facts; CTA “Request viewing / Speak to advisor”.
- S2 Gallery + floorplan.
- S3 Facts table (fees, ownership notes).
- S4 Area context (link to area detail).
- S5 Comparable framing (related listings).
- S6 Lead form prefilled with listing.
- Data: `properties`, `property_media`, `areas`, `projects`, `inquiries`.
- Analytics: `page_view(property_detail)`, `cta_click(viewing)`, `form_*`, `listing_click(related)`.

### 4️⃣ UX
- Sticky: on mobile, “WhatsApp / Request viewing”.

### 5️⃣ System
- Role: public.

### 6️⃣ SEO
- Primary: “condo for sale pattaya [area]”.

---

## 14) Areas

### 1️⃣ Strategic Role
- Funnel: orientation + routing.
- Objective: help choose area based on lifestyle + investment.
- Outcome: area detail views → property hub filtered → inquiries.

### 2️⃣ Personas
- Investor, Lifestyle Buyer, Expat.

### 3️⃣ Sections
- S1 Hero: “Areas” + short framing.
- S2 Area cards with dual score (lifestyle/investment) + disclaimers.
- S3 Map overview.
- S4 CTA: “Talk through areas” → Contact (prefill).
- Data: `areas`, `area_scores`, `projects`, `properties`.
- Analytics: `listing_click(type=area)`, `cta_click(areas_contact)`.

### 4️⃣ UX
- Keep it clean; avoid long text.

### 5️⃣ System
- Admin: area content, tags, score sliders.

### 6️⃣ SEO
- Primary: “pattaya areas guide”.

---

## 15) Area Detail

### 1️⃣ Strategic Role
- Funnel: decision support.
- Objective: provide context + relevant listings/projects.
- Outcome: filtered property hub use + inquiries.

### 2️⃣ Personas
- Investor, Lifestyle Buyer, Expat.

### 3️⃣ Sections
- S1 Hero: area name + 1-line thesis.
- S2 Lifestyle blocks: transport, beach, amenities.
- S3 Investment blocks: liquidity, demand notes, unit fit.
- S4 Curated projects in area.
- S5 Listings in area (hub embed).
- S6 CTA + form.
- Data: `areas`, `area_content_blocks`, `projects`, `properties`.
- Analytics: `section_view` per block, `listing_click`, `form_*`.

### 4️⃣ UX
- Scroll: thesis → lifestyle → investment → projects → listings → contact.
- Sticky: “View listings in this area” button.

### 5️⃣ System
- Role: public.

### 6️⃣ SEO
- Primary: “[Area] pattaya condos”.
- Supporting: “rent in [area] pattaya”, “investment [area] pattaya”.

