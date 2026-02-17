# Phase 2C — Lead Flow Architecture (V3: CRM + automation)

Objective: turn first‑party analytics + structured inquiries into a measurable, abuse‑resistant CRM pipeline with deterministic assignment and revenue attribution.

Status pipeline (canonical):
- `new` → `contacted` → `qualified` → `viewing_scheduled` → `closed_won` | `closed_lost`

Core entities used:
- `analytics_events`, `inquiries`, `lead_assignments`, `users` (advisors), `viewings`, `notifications`, `audit_logs`

---

## 1) End-to-end Lifecycle (system view)

### Step 0 — Visitor session bootstrap
- Trigger: first page load.
- Client actions:
  - generate `session_id`
  - capture attribution: `utm_*`, `referrer`, `device`, `first_touch_timestamp`
- Data:
  - stored client-side (localStorage) + appended to inquiry payload later
  - optionally send `page_view` event immediately
- Analytics events:
  - `page_view` `{ page, locale, session_id }`

### Step 1 — Page interaction logging
- Trigger: nav clicks, CTA clicks, filter changes, listing impressions.
- Data:
  - stored in `analytics_events.payload` (json)
- Examples:
  - `cta_click` `{ cta_id, placement, intent }`
  - `search_filter_change` `{ filters_diff, result_count }`

### Step 2 — Conversion action (CTA → form start)
- Trigger: user focuses contact form or opens WhatsApp.
- Analytics:
  - `form_start` `{ form_id, context: property_id|project_id|area_id|post_slug }`
  - `cta_click` for messaging channels

### Step 3 — Form submission → Inquiry creation
- Trigger: `POST /api/v1/inquiries`.
- Server behavior:
  - validate payload (require email or phone)
  - honeypot trap (reject bots)
  - rate-limit by IP-hash
  - persist inquiry with attribution fields
- Data written:
  - `inquiries` row
  - `audit_logs` entry `action='create'`
- Analytics:
  - `form_submit` client-side
  - `inquiry_created` server-side event into `analytics_events` (already done in v2 CRM route)

### Step 4 — Duplicate detection (immediate)
- Trigger: on inquiry create.
- Goal: prevent fragmented lead records.

**Deterministic rules (run in order)**
1) Email exact match (normalized lowercase) within last 180 days → duplicate candidate.
2) Phone normalized match within 180 days → duplicate candidate.
3) Same `session_id` + similar `message` within 2 hours → duplicate candidate.
4) Fuzzy name + same device/referrer within 24 hours → weak candidate.

**Actions**
- If strong match:
  - set `inquiries.duplicate_of_inquiry_id = existing_id`
  - keep new inquiry but auto-close as `closed_lost` with reason `duplicate` OR merge messages into existing (preferred).
  - append `audit_logs` `action='merge'` with diff.
- If weak match:
  - flag for advisor review (`inquiries.status` remains `new`, add `payload.flag='possible_duplicate'`).

Indexes required:
- `inquiries(email)`, `inquiries(phone)`, `inquiries(created_at)`.

### Step 5 — Auto-assignment (immediate)
- Trigger: new inquiry (non-duplicate) created.
- Output:
  - set `inquiries.advisor_user_id`
  - create `lead_assignments` row
  - create `notifications` for advisor
  - `audit_logs` `action='assign'`

**Assignment inputs**
- Inquiry:
  - `intent`, `area_id/project_id/property_id`
  - `locale` (derived from `source_page` or captured client-side)
  - `utm_source` (ads vs organic)
- Advisor profile:
  - languages (en/th/ru/etc)
  - specializations (invest/buy/rent/sell)
  - capacity (active leads count)
  - SLA performance (median first response time)
  - business hours

**Algorithm (skills-weighted round-robin)**
- Compute score per advisor:
  - +30 if language match
  - +25 if intent specialization
  - +10 if area specialization
  - - (active_open_leads * 3)
  - - penalty if out of business hours (unless on-call)
  - + small bonus for best SLA quartile
- Pick top N advisors (N=3). Among them, choose the one with the oldest last-assigned time (round-robin fairness).

**Fallback**
- If no advisor matches, assign to default pool owner (Admin/Lead Desk).

### Step 6 — Advisor workflow (operational)

**Lead Inbox**
- Views:
  - “New” (uncontacted)
  - “Due today” (follow-ups)
  - “My pipeline” (stage view)

**Lead detail**
- Must show:
  - contact + message
  - attribution (UTM/referrer/device)
  - session highlights (last 20 analytics events for that session_id)
  - recommended next step templates (WhatsApp/Email copy blocks)

**Status updates**
- Advisor can set:
  - status transitions
  - lead score adjustments
  - next follow-up date
  - notes
- Every update writes `audit_logs` and (optionally) `analytics_events` `event_type='crm_status_change'`.

### Step 7 — Follow-up reminders (automation)

**SLA reminders**
- If `status=new` and no contact within 15 minutes:
  - send `notification` to assigned advisor
- If no contact within 2 hours:
  - escalate to lead desk (Admin) notification

**Cadence reminders (qualified leads)**
- For `qualified` leads:
  - follow-up +1 day, +3 days, +7 days (configurable)

Implementation:
- background worker enqueues jobs (Phase 3 tech plan: Celery/RQ + Redis)

### Step 8 — Viewing scheduling
- When status moves to `viewing_scheduled`:
  - create `viewings` rows with `scheduled_at`
  - send confirmation template (email/WhatsApp)
- Analytics:
  - `viewing_scheduled` event (server-side) with `inquiry_id`

### Step 9 — Conversion event (Closed Won/Lost)

**Closed Won**
- Required fields at close:
  - `deal_value` (numeric)
  - `deal_type` (sale|rent)
  - `commission_estimate` (numeric)
  - linked entity: `property_id|project_id`
- Writes:
  - inquiry status update
  - `audit_logs`
  - `analytics_events` `event_type='deal_closed_won'`

**Closed Lost**
- Required close reason:
  - `price`, `timeline`, `went_with_other`, `no_contact`, `duplicate`, `not_qualified`

### Step 10 — Revenue attribution & reporting

**Attribution model (first-party, pragmatic)**
- Primary attribution: first-touch UTM (`first_touch_timestamp` + `utm_*`).
- Secondary: last meaningful CTA click before submit (stored in `analytics_events` by session_id).

**Reporting outputs**
- Funnel:
  - visits → CTA clicks → form starts → submits → qualified → won
- Advisor:
  - time to first response
  - stage conversion rates
  - wins and commission totals
- Content:
  - which pages drive qualified leads (non-PII aggregate)

---

## 2) Lead Scoring Logic (deterministic, adjustable)

Score = base + intent + engagement + clarity + urgency - spam_risk.

**Base**
- Start at 10.

**Intent weighting**
- Invest: +20
- Buy: +15
- Rent: +10
- Sell: +15

**Engagement signals (from analytics_events by session_id)**
- Viewed property detail: +8
- Viewed investment snapshot (gated): +10
- Used filters in Property Hub: +5
- Returned within 7 days: +6

**Clarity signals (from inquiry payload)**
- Provided budget band: +8
- Provided timeline: +6
- Provided preferred areas: +6
- Provided both email+phone: +3

**Urgency**
- timeline ≤ 30 days: +10
- timeline 31–90 days: +6

**Spam risk**
- honeypot filled: hard reject
- rate-limit hits + suspicious UA patterns: -50 (or auto-close)

---

## 3) Duplicate Detection Details (engineering rules)

**Normalization**
- email: lowercase, trim
- phone: keep digits + leading `+` country code

**Merge strategy (preferred)**
- Keep oldest inquiry as canonical.
- Append new message into `inquiry_messages` (new table) linked to inquiry.
- Set new inquiry as duplicate with pointer to canonical.

---

## 4) Advisor Performance Tracking (KPIs)

Per advisor (weekly/monthly):
- median time-to-first-contact (from `assigned_at` to first status change `contacted`)
- qualified rate = qualified / contacted
- win rate = won / qualified
- revenue = sum(commission_estimate)

Data requirements:
- `lead_assignments.created_at`
- `inquiries.status` transitions logged in `audit_logs`

---

## 5) Minimal Admin UX Requirements (so the system works)

- Leads list with filters (status, intent, assigned_to, created_at)
- Lead detail with:
  - assignment history
  - attribution fields
  - timeline of updates
  - quick status change + next follow-up date
- Notifications panel
- Reports dashboard (aggregate only)

