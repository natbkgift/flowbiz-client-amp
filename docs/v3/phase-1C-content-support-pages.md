# Phase 1C — Content/Authority + Support/Legal Page Blueprints (V3)

Authority content principles (V3):
- One contextual primary CTA per page (gold), one secondary max (outline).
- Structured for scanning: definition → constraints → examples → next step.
- Content pages reduce friction by linking directly to the most relevant funnel endpoint (Invest/Buy/Areas/Contact).

Analytics events used below (aligned with Phase 1A taxonomy):
- `page_view`, `section_view`, `cta_click`, `nav_click`, `search_filter_change`, `listing_impression`, `listing_click`, `form_start|form_submit|form_success|form_error`, `membership_gate_view`.

---

## 1) Blog

### 1️⃣ Strategic Role
- Funnel position: Top-of-funnel acquisition (SEO) → trust → routing.
- Core objective: Capture intent via content clusters and route to Invest/Buy/Areas.
- Business outcome: Organic sessions → returning sessions → inquiries.

### 2️⃣ Target Personas
- Investor, Expat, Lifestyle Buyer.

### 3️⃣ Full Section Architecture

**S1 — Blog Hero (positioning + single CTA)**
- Section objective: Set expectation: analytical, process-led content.
- Headline concept: “Pattaya property intelligence—without hype.”
- Subtext logic: 1–2 sentences on assumptions, costs, due diligence.
- CTA placement & type: Primary CTA “Browse Investor Insights” → `/{locale}/insights`.
- Conversion intent: Route high-intent readers to Insights.
- Data dependency (DB model): `content_blocks` (blog hero copy).
- Analytics events triggered: `page_view(page='blog')`, `cta_click(cta_id='blog_to_insights', placement='hero')`.
- Internal linking logic: direct link to Insights; secondary link to Buying Process in subtext.

**S2 — Category & Tag Filters (chips)**
- Section objective: Reduce bounce by immediate relevance.
- Headline concept: “Find the angle that matches your intent.”
- Subtext logic: none (keep compact).
- CTA placement & type: filter interactions only.
- Conversion intent: Keep engagement, guide deeper reading.
- Data dependency: `blog_categories`, `blog_tags`.
- Analytics: `search_filter_change(page='blog', filter='category|tag', value=...)`.
- Internal linking: each category has a canonical route `/{locale}/blog?category=...`.

**S3 — Featured Posts (editorial picks)**
- Section objective: steer to the highest-converting, authority posts.
- Headline concept: “Start here.”
- Subtext logic: each card includes “why it matters” (1 line).
- CTA placement & type: card click.
- Conversion intent: article reads → contextual CTA.
- Data dependency: `blog_posts.is_featured`.
- Analytics: `listing_impression(type='blog_post')`, `listing_click(type='blog_post')`.
- Internal linking: featured posts link into clusters (Insights/Buying Process/Areas).

**S4 — All Posts (paginated list)**
- Section objective: breadth, long-tail SEO.
- Headline concept: “Latest.”
- Subtext logic: show updated date + category.
- CTA: list item click.
- Conversion intent: reading.
- Data dependency: `blog_posts`.
- Analytics: `listing_impression`, `listing_click`.
- Internal linking: every post includes “Related” modules.

**S5 — Newsletter / Updates (optional, first-party)**
- Section objective: retention.
- Headline concept: “Get the next update.”
- Subtext logic: “No spam; unsubscribe anytime.”
- CTA: subscribe.
- Conversion intent: capture email.
- Data dependency: `subscriptions`.
- Analytics: `form_* (form_id='newsletter')`.
- Internal linking: link to Privacy.

### 4️⃣ UX Behavior
- Scroll structure: hero → filters → featured → list → newsletter.
- Visual hierarchy: featured posts distinct; list is lighter.
- CTA frequency: 1 primary CTA (hero), 1 optional (newsletter) at end.
- Mobile adjustments: filter chips horizontal scroll; keep cards tall enough for tap.
- Sticky elements: none.
- Friction reduction logic: persist selected filters in URL; keep pagination shallow.

### 5️⃣ System Dependency
- DB tables used: `blog_posts`, `blog_categories`, `blog_tags`, `subscriptions`, `analytics_events`.
- Required relations: `blog_posts.author_user_id → users.id`.
- Admin module impact: editorial workflow (draft/review/publish), scheduled publishing.
- Role visibility rules: Guest sees published only; Content Manager sees drafts.

### 6️⃣ SEO & Authority Logic
- Primary keyword: “Pattaya property market insights”.
- Supporting keywords: “Pattaya condo prices”, “Pattaya rental demand”, “Thailand condo foreign quota”.
- Internal linking structure: Blog → Insights / Buying Process / Areas clusters.
- Content depth requirement: index page 400–800 words + category intros.

---

## 2) Blog Detail

### 1️⃣ Strategic Role
- Funnel position: Authority proof → conversion routing.
- Core objective: Satisfy intent; then route to the correct next step.
- Business outcome: CTA clicks + saved items + inquiries.

### 2️⃣ Target Personas
- Investor, Expat, Lifestyle Buyer.

### 3️⃣ Full Section Architecture

**S1 — Article Header (E‑E‑A‑T signals)**
- Objective: credibility and recency.
- Headline concept: exact query match.
- Subtext logic: author, updated date, reading time, disclosure.
- CTA: none.
- Data: `blog_posts`.
- Analytics: `page_view(page='blog_detail')`, `section_view(section_id='article_header')`.
- Internal linking: author links to Team Profile (if advisor author).

**S2 — TL;DR / Key Takeaways**
- Objective: reduce bounce.
- Headline: “Key takeaways.”
- Subtext: 3 bullets with constraints.
- CTA: none.
- Data: `blog_posts.tldr_json` (or derived).
- Analytics: `section_view('tldr')`.

**S3 — Main Content (anchored sections)**
- Objective: full intent satisfaction.
- Headline: section headers reflect search intent.
- Subtext: “constraints and assumptions” callouts.
- CTA: none inside body (avoid spam).
- Data: `blog_posts.body_md`.
- Analytics: `section_view(section_id='content_{h2_slug}')`.

**S4 — Contextual CTA (single, algorithmic)**
- Objective: route to next best action.
- Headline concept: “Next step.”
- Subtext logic: 1 sentence mapping the article to action.
- CTA placement & type:
  - Invest-tagged: “Request a Yield Report” → `/{locale}/contact?intent=invest&context=post:{slug}`
  - Buy-tagged: “Speak to an Advisor” → `/{locale}/contact?intent=buy&context=post:{slug}`
  - Area-tagged: “Explore Areas” → `/{locale}/areas`
- Conversion intent: inquiry creation.
- Data dependency: `blog_posts.tags` + routing rules.
- Analytics: `cta_click(cta_id='article_primary', placement='post_end', intent=...)`.
- Internal linking: CTA target includes UTM-like internal context.

**S5 — Related (posts + areas + projects)**
- Objective: keep session alive.
- Headline: “Related.”
- Subtext logic: show why it’s related.
- CTA: card click.
- Data: `blog_post_relations`, `areas`, `projects`.
- Analytics: `listing_impression`, `listing_click`.
- Internal linking: each related card must link to its cluster hub.

### 4️⃣ UX Behavior
- Scroll structure: header → TL;DR → content → CTA → related.
- CTA frequency: exactly one primary CTA.
- Mobile adjustments: larger line-height; anchors accessible.
- Sticky elements: optional progress bar only.
- Friction reduction: show “jump to section” on mobile.

### 5️⃣ System Dependency
- Tables: `blog_posts`, `blog_post_relations`, `analytics_events`.
- Admin impact: canonical & redirect controls.
- Role visibility: public; internal drafts behind auth.

### 6️⃣ SEO & Authority Logic
- Primary keyword: matches article intent.
- Supporting keywords: derived from clusters.
- Internal linking: post → hub (Insights/Buying Process/Areas) + relevant inventory.
- Content depth: 1200–2500 words depending on cluster; include `Article` schema.

---

## 3) Course

### 1️⃣ Strategic Role
- Funnel position: Monetization + lead qualification.
- Core objective: Turn uncertain buyers/investors into structured, high-quality leads.
- Business outcome: enrollments + upgrades + higher close rate.

### 2️⃣ Target Personas
- Investor, Buyer, Co-Agent.

### 3️⃣ Full Section Architecture

**S1 — Course Catalog Hero**
- Objective: position education as authority.
- Headline: “Learn the process. Reduce avoidable risk.”
- Subtext: outcomes (quota clarity, cost modeling, next steps).
- CTA: Primary “Start a free module” (opens course detail).
- Data: `courses`.
- Analytics: `page_view(page='course')`, `cta_click(cta_id='course_start_free')`.
- Internal linking: to Buying Process and Insights.

**S2 — Course Cards (levels + outcomes)**
- Objective: help self-select.
- Headline: “Choose your track.”
- Subtext: each course shows duration and what you’ll be able to do.
- CTA: “View course”.
- Data: `courses`, `course_modules`.
- Analytics: `listing_impression(type='course')`, `listing_click(type='course')`.
- Internal linking: advanced modules link to relevant Resources.

**S3 — Membership Gate (advanced modules)**
- Objective: monetize and keep premium value tangible.
- Headline: “Investor modules (advanced).”
- Subtext: what’s included; refund policy.
- CTA: “Upgrade to Investor”.
- Data: `members`, `subscriptions`, `course_entitlements`.
- Analytics: `membership_gate_view(context='course')`, `membership_upgrade_click(plan='investor')`.
- Internal linking: to Member Profile.

**S4 — Testimonials / Outcomes**
- Objective: proof.
- CTA: “Speak to an Advisor” (secondary).
- Data: `testimonials` (tagged `course`).
- Analytics: `cta_click(cta_id='course_contact')`.

### 4️⃣ UX Behavior
- Scroll: hero → cards → gate → proof.
- CTA frequency: 1 primary; 1 optional secondary.
- Mobile: cards stacked; gate is a compact banner.

### 5️⃣ System Dependency
- Tables: `courses`, `course_modules`, `course_enrollments`, `members`, `subscriptions`, `analytics_events`.
- Admin impact: course publishing, access control.
- Role visibility: public catalog; enrollment requires auth.

### 6️⃣ SEO & Authority Logic
- Primary keyword: “Thailand property buying course”.
- Supporting: “Pattaya property investment course”.
- Internal linking: courses → Buying Process / Resources.
- Content depth: 700–1200 words for catalog; each course detail 900–1600.

---

## 4) Insights

### 1️⃣ Strategic Role
- Funnel position: High-authority mid-to-late funnel.
- Core objective: Provide analytical framing and lead magnets that convert.
- Business outcome: report requests + membership upgrades + higher inquiry quality.

### 2️⃣ Target Personas
- Investor.

### 3️⃣ Full Section Architecture

**S1 — Insights Hero**
- Objective: position the platform as an authority.
- Headline: “Investor intelligence without hype.”
- Subtext: “Assumptions, comps, constraints.”
- CTA: Primary “Request a Yield Report” → Contact with `intent=invest`.
- Data: CMS content block.
- Analytics: `page_view(page='insights')`, `cta_click(cta_id='insights_request_report')`.
- Internal linking: to Invest and Resources.

**S2 — Insight Clusters (tiles)**
- Objective: routing.
- Headline: “Choose your lens.”
- Subtext: demand/costs/liquidity/areas.
- CTA: tile click.
- Data: `insight_topics`.
- Analytics: `listing_click(type='insight_topic')`.
- Internal linking: topic pages (or filtered blog).

**S3 — Featured Report Preview (gated full)**
- Objective: monetize while proving value.
- Headline: “Featured report.”
- Subtext: preview summary + methodology.
- CTA: “Download full report” (gate).
- Data: `reports`.
- Analytics: `membership_gate_view(context='report')`, `report_download`.
- Internal linking: to Member Profile.

**S4 — Upgrade Value Block (only once)**
- Objective: clear upgrade rationale.
- CTA: Upgrade.
- Data: `plans`.
- Analytics: `membership_upgrade_click`.

### 4️⃣ UX Behavior
- Scroll: hero → clusters → featured → upgrade.
- CTA frequency: 1 primary + 1 upgrade.
- Mobile: clusters as cards; avoid long text.

### 5️⃣ System Dependency
- Tables: `insights`, `reports`, `members`, `subscriptions`, `analytics_events`.
- Admin impact: report publishing and gating.
- Visibility: preview public; full gated.

### 6️⃣ SEO & Authority Logic
- Primary keyword: “Pattaya condo yield analysis”.
- Supporting: “net yield assumptions”, “occupancy seasonality Pattaya”.
- Internal linking: Insights → Invest → Contact; Insights → Areas.
- Depth: 900–1500 words; add report schema where appropriate.

---

## 5) Buying Process

### 1️⃣ Strategic Role
- Funnel position: Conversion support.
- Core objective: Replace uncertainty with a predictable roadmap.
- Business outcome: higher form completion; fewer low-quality leads.

### 2️⃣ Target Personas
- Expat, Lifestyle Buyer, Investor.

### 3️⃣ Full Section Architecture

**S1 — Process Hero**
- Objective: reassure.
- Headline: “A clear process from criteria to closing.”
- Subtext: what you’ll know after step 1.
- CTA: Primary “Speak to an Advisor” → Contact with `intent=buy`.
- Data: CMS.
- Analytics: `page_view(page='buying_process')`, `cta_click(cta_id='process_contact')`.

**S2 — Stepper (5 steps with deliverables)**
- Objective: clarity.
- Headline: “The steps.”
- Subtext: each step includes deliverable (shortlist, viewing plan, doc checklist).
- CTA: none.
- Data: `content_blocks`.
- Analytics: `section_view(section_id='process_step_{n}')`.

**S3 — What We Verify (checklist)**
- Objective: authority.
- CTA: “Send your target building/unit” (secondary) → Contact prefilled.
- Data: `resources` (checklist).
- Analytics: `cta_click(cta_id='process_send_target')`.

**S4 — What You Provide (expectations)**
- Objective: lead quality.
- CTA: none.
- Data: CMS.
- Analytics: `section_view('process_you_provide')`.

**S5 — FAQ Snippet**
- Objective: friction reduction.
- CTA: “See all FAQs” → FAQ.
- Data: `faqs`.
- Analytics: `cta_click(cta_id='process_to_faq')`.

### 4️⃣ UX Behavior
- Scroll: hero → stepper → verify → you provide → FAQ.
- CTA frequency: 1 primary; 2 secondary max.
- Mobile: stepper collapsible; anchors for navigation.

### 5️⃣ System Dependency
- Tables: `faqs`, `resources`, `content_blocks`, `analytics_events`.
- Admin impact: content maintenance.
- Visibility: public.

### 6️⃣ SEO & Authority Logic
- Primary keyword: “Thailand condo buying process”.
- Supporting: “foreign quota condo process”, “due diligence Thailand condo”.
- Linking: Process → Buy → Resources; Process → Contact.
- Depth: 1200–2000 words, with `FAQPage` schema section.

---

## 6) Resources

### 1️⃣ Strategic Role
- Funnel position: Authority asset library + lead capture.
- Core objective: Provide checklists/templates that increase trust and capture emails.
- Business outcome: downloads → upgrades → inquiries.

### 2️⃣ Target Personas
- Investor, Expat, Seller.

### 3️⃣ Full Section Architecture

**S1 — Resources Hero**
- Objective: orient quickly.
- Headline: “Practical guides and checklists.”
- Subtext: “Built from real transaction steps.”
- CTA: Primary “Download due diligence checklist” (gated optional).
- Data: `resources`.
- Analytics: `page_view(page='resources')`, `cta_click(cta_id='resources_primary')`.

**S2 — Categories**
- Objective: reduce scanning cost.
- CTA: category click.
- Data: `resource_categories`.
- Analytics: `search_filter_change`.

**S3 — Resource List (preview + one action)**
- Objective: provide value without clutter.
- CTA: “Download” or “View” (single).
- Data: `resources`, `resource_files`.
- Analytics: `resource_view`, `resource_download`.
- Internal linking: each resource links to relevant process page.

**S4 — Membership Gate (only for premium resources)**
- Objective: monetize.
- CTA: Upgrade.
- Data: `members`, `subscriptions`.
- Analytics: `membership_gate_view(context='resource')`, `membership_upgrade_click`.

**S5 — Advisory CTA**
- Objective: convert stuck users.
- CTA: “Ask an advisor what applies to you” → Contact.
- Data: none.
- Analytics: `cta_click(cta_id='resources_contact')`.

### 4️⃣ UX Behavior
- Scroll: hero → categories → list → (gate) → advisory.
- CTA frequency: one primary + one advisory.
- Mobile: list with clear “Download” buttons.

### 5️⃣ System Dependency
- Tables: `resources`, `resource_categories`, `members`, `subscriptions`, `analytics_events`.
- Admin impact: file uploads (Phase 3 storage).
- Visibility: public previews; gated downloads.

### 6️⃣ SEO & Authority Logic
- Primary keyword: “Thailand condo due diligence checklist”.
- Supporting: “Pattaya condo transfer fees”, “foreign ownership documents Thailand”.
- Linking: Resources → Buying Process → Contact.
- Depth: 600–1200 words plus structured resource descriptions.

---

## 7) Press

### 1️⃣ Strategic Role
- Funnel position: Authority proof.
- Core objective: Show third-party validation.
- Business outcome: increased conversion trust.

### 2️⃣ Target Personas
- Investor, Developer, Seller.

### 3️⃣ Full Section Architecture

**S1 — Press Hero**
- Objective: position credibility.
- Headline: “Press and mentions.”
- Subtext: “Selected references.”
- CTA: secondary “Media inquiries” → Contact.
- Data: CMS.
- Analytics: `page_view(page='press')`, `cta_click(cta_id='press_media_inquiries')`.

**S2 — Press List**
- Objective: proof.
- Headline: “Coverage.”
- Subtext: source, date, excerpt.
- CTA: “Read” outbound.
- Data: `press_items`.
- Analytics: `listing_impression(type='press_item')`, `listing_click(type='press_item')`.

### 4️⃣ UX Behavior
- Scroll: hero → list.
- CTA frequency: 0–1.
- Mobile: simple list.

### 5️⃣ System Dependency
- Tables: `press_items`, `analytics_events`.
- Admin impact: content updates.
- Visibility: public.

### 6️⃣ SEO & Authority Logic
- Primary keyword: “AMP Pattaya press”.
- Supporting: “international property investment authority Pattaya”.
- Linking: About ↔ Press.
- Depth: 400–800 words.

---

## 8) Testimonials

### 1️⃣ Strategic Role
- Funnel position: Trust confirmation.
- Core objective: Validate the process narrative with specific outcomes.
- Business outcome: higher contact conversion.

### 2️⃣ Target Personas
- Investor, Expat, Lifestyle Buyer, Seller.

### 3️⃣ Full Section Architecture

**S1 — Testimonials Hero**
- Objective: set expectation.
- Headline: “What clients value most.”
- Subtext: “Process clarity, realistic assumptions, focused shortlists.”
- CTA: Primary “Speak to an Advisor” → Contact.
- Data: CMS.
- Analytics: `page_view(page='testimonials')`, `cta_click(cta_id='testimonials_contact')`.

**S2 — Filters (intent/persona)**
- Objective: relevance.
- CTA: filter change.
- Data: `testimonials.tags`.
- Analytics: `search_filter_change`.

**S3 — Testimonial Cards**
- Objective: proof.
- CTA: none (keep calm) or “Related: Invest/Buy” link.
- Data: `testimonials`.
- Analytics: `listing_impression(type='testimonial')`.

### 4️⃣ UX Behavior
- Scroll: hero → filters → list.
- CTA frequency: 1.
- Mobile: cards stacked.

### 5️⃣ System Dependency
- Tables: `testimonials`, `analytics_events`.
- Admin impact: approve/publish.
- Visibility: public.

### 6️⃣ SEO & Authority Logic
- Primary keyword: “Pattaya property agency reviews”.
- Supporting: “foreign buyer Pattaya agency”.
- Linking: Home/Buy/Invest → Testimonials.
- Depth: 600–1200 words plus quotes.

---

## 9) FAQ

### 1️⃣ Strategic Role
- Funnel position: friction reducer.
- Core objective: Answer high-volume questions and reduce form hesitation.
- Business outcome: higher form completion; fewer support messages.

### 2️⃣ Target Personas
- Investor, Expat, Lifestyle Buyer, Seller, Co-Agent.

### 3️⃣ Full Section Architecture

**S1 — FAQ Hero**
- Objective: orientation.
- Headline: “Fast answers.”
- Subtext: “If you have edge cases, talk to an advisor.”
- CTA: Secondary “Speak to an Advisor” → Contact.
- Data: CMS.
- Analytics: `page_view(page='faq')`, `cta_click(cta_id='faq_contact')`.

**S2 — Search + Categories**
- Objective: find quickly.
- CTA: search query.
- Data: `faqs`.
- Analytics: `faq_search`.

**S3 — Accordion Q&A**
- Objective: answer.
- CTA: none.
- Data: `faqs`.
- Analytics: `faq_open(question_id=...)`.

**S4 — Still Unsure CTA**
- Objective: convert.
- CTA: “Send your criteria” → Contact.
- Data: none.
- Analytics: `cta_click(cta_id='faq_send_criteria')`.

### 4️⃣ UX Behavior
- Scroll: hero → search/categories → accordions → CTA.
- CTA frequency: 1–2 max.
- Mobile: accordion with large hit targets.

### 5️⃣ System Dependency
- Tables: `faqs`, `analytics_events`.
- Admin impact: content updates.
- Visibility: public.

### 6️⃣ SEO & Authority Logic
- Primary keyword: “Pattaya property FAQ”.
- Supporting: “foreign quota FAQ”, “transfer fee Thailand FAQ”.
- Linking: FAQ → Buying Process/Resources; relevant pages deep-link to specific FAQ anchors.
- Depth: 900–2000 words; implement `FAQPage` schema.

---

## 10) Ticket

### 1️⃣ Strategic Role
- Funnel position: Support (post-lead; membership).
- Core objective: Structured support intake with SLA.
- Business outcome: reduced chaos, measurable advisor performance.

### 2️⃣ Target Personas
- Investor, Buyer, Seller, Co-Agent (authenticated).

### 3️⃣ Full Section Architecture

**S1 — Ticket Intro**
- Objective: direct users to the right channel.
- Headline: “Support request.”
- Subtext: “For sales inquiries use Contact; for existing cases use Tickets.”
- CTA: none.
- Data: CMS.
- Analytics: `page_view(page='ticket')`.

**S2 — Ticket Form**
- Objective: capture issue category + context.
- Headline: “Create a ticket.”
- Subtext: categories: Documents, Viewing, Payment, Marketplace, Account.
- CTA: Submit.
- Conversion intent: create ticket.
- Data dependency: `tickets`, `ticket_messages`, `ticket_attachments`.
- Analytics: `form_* (form_id='ticket')`.
- Internal linking: to Privacy/Terms for policy.

**S3 — Ticket Status (list + detail)**
- Objective: transparency.
- CTA: open ticket.
- Data: `tickets`.
- Analytics: `listing_click(type='ticket')`.

### 4️⃣ UX Behavior
- Scroll: intro → form → status list.
- Mobile: status list simplified.
- Friction reduction: guest users redirected to Contact with explanation.

### 5️⃣ System Dependency
- Tables: `tickets`, `ticket_messages`, `ticket_attachments`, `users`, `roles`, `analytics_events`.
- Admin impact: ticket queues, SLA timers.
- Role visibility: Member sees own tickets; Admin sees all.

### 6️⃣ SEO
- Noindex.

---

## 11) Privacy

### 1️⃣ Strategic Role
- Funnel position: trust + compliance.
- Core objective: explain first-party analytics and inquiry data handling.
- Business outcome: reduced hesitation, improved form completion.

### 2️⃣ Target Personas
- Guest (privacy-conscious), Investor.

### 3️⃣ Full Section Architecture

**S1 — Privacy Header**
- Objective: transparency.
- Headline: “Privacy policy.”
- Subtext: version + last updated.
- CTA: none.
- Data: `policy_documents`.
- Analytics: `page_view(page='privacy')`.

**S2 — What We Collect**
- Objective: clarity.
- Headline: “Data we collect.”
- Subtext: events (page/session), inquiry fields (contact/criteria), security (rate limits).
- CTA: none.
- Data: `policy_documents`.
- Analytics: `section_view('privacy_collect')`.

**S3 — How We Use It**
- Objective: legitimacy.
- Headline: “How we use your data.”
- Subtext: shortlist quality, fraud prevention, service improvement.
- CTA: none.
- Analytics: `section_view('privacy_use')`.

**S4 — Retention & Rights**
- Objective: compliance.
- CTA: “Contact privacy” mailto.
- Analytics: `cta_click(cta_id='privacy_contact')`.

### 4️⃣ UX Behavior
- Long-form legal: add TOC and anchors.
- No sales CTAs.

### 5️⃣ System Dependency
- Tables: `policy_documents`, `audit_logs`.
- Admin impact: versioned policy publishing.
- Visibility: public.

### 6️⃣ SEO & Authority Logic
- Primary keyword: “privacy policy AMP Pattaya”.
- Internal linking: footer.
- Depth: complete and explicit.

---

## 12) Terms

### 1️⃣ Strategic Role
- Funnel position: compliance + expectation setting.
- Core objective: define platform terms, disclaimers.
- Business outcome: liability control.

### 2️⃣ Target Personas
- All.

### 3️⃣ Full Section Architecture

**S1 — Terms Header**
- Objective: transparency.
- Headline: “Terms of service.”
- Subtext: version + last updated.
- CTA: none.
- Data: `policy_documents`.
- Analytics: `page_view(page='terms')`.

**S2 — Service Scope**
- Objective: define what is and isn’t provided.
- CTA: none.
- Data: `policy_documents`.

**S3 — Disclaimers (legal/financial)**
- Objective: clarity without fear.
- CTA: none.

**S4 — Contact**
- Objective: compliance contact.
- CTA: mailto.
- Analytics: `cta_click(cta_id='terms_contact')`.

### 4️⃣ UX Behavior
- TOC + anchors.
- No sales CTAs.

### 5️⃣ System Dependency
- Tables: `policy_documents`, `audit_logs`.
- Admin: versioned publish.
- Visibility: public.

### 6️⃣ SEO
- Indexable.

