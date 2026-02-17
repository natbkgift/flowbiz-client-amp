# Phase 2B — Role & Permission Matrix (V3 RBAC)

RBAC principles:
- Roles grant permissions (capabilities), not UI routes.
- Visibility is enforced at API level; UI hides but never relies on hiding.
- Lead visibility is the highest-risk domain: default to least privilege.

Permission key pattern:
- `{entity}.{action}` e.g., `properties.read`, `inquiries.assign`, `analytics.read_aggregate`.

---

## Role: Guest

**Page access (public)**
- Can access: Home, Buy, Rent, Invest, Areas, Area Detail, Projects, Project Detail, Developers, Developer Detail, Blog, Blog Detail, Insights (preview), Buying Process, Resources (public), Testimonials, Press, FAQ, Privacy, Terms, Marketplace (browse).
- Cannot access: Member Profile, Ticket (redirect to Contact), any admin pages.

**CRUD permissions**
- `inquiries.create` (public lead form)
- `analytics_events.create` (public events API)

**Lead visibility**
- none

**Marketplace control**
- none (browse only)

**Project visibility**
- published only

**Analytics visibility**
- none

**Assignment logic**
- system assigns inquiry to advisor; guest cannot choose assignee.

---

## Role: Buyer (member)

**Page access**
- All guest pages
- Member Profile
- Ticket (create + view own)

**CRUD**
- `saved_searches.create/read/update/delete` (own)
- `saved_items.create/read/delete` (own)
- `tickets.create/read/update` (own; update = add message)
- `inquiries.create` (and `inquiries.read_own` if member-auth tied to inquiry)

**Lead visibility**
- only own inquiries/tickets

**Marketplace control**
- can request introductions

**Analytics visibility**
- none

---

## Role: Investor (member)

Includes Buyer capabilities plus gated content.

**Page access**
- Everything Buyer can access
- Insights (full reports gated)
- Resources (investor-gated)

**CRUD**
- `reports.read_gated`
- `report_requests.create`

**Lead visibility**
- own only

**Analytics visibility**
- none

---

## Role: Seller (member)

**Page access**
- Guest pages + Sell
- Member Profile
- Ticket

**CRUD**
- `inquiries.create(intent='sell')`
- `tickets.create/read/update` (own)

**Lead visibility**
- own only

---

## Role: Developer (partner)

Goal: allow controlled self-service for developer profiles/projects without exposing other data.

**Page access**
- Developer dashboard (private) for their own developer entity

**CRUD**
- `developers.read_own`
- `developers.update_own` (limited fields, subject to review)
- `projects.create_own` (draft)
- `projects.update_own` (draft)
- `projects.request_publish` (creates moderation task)
- `marketplace_items.create_own` (if allowed)

**Lead visibility**
- none by default
- optional: `inquiries.read_partner` only for inquiries explicitly linked to developer’s project AND explicitly shared

**Marketplace control**
- can manage own marketplace items (if vendor)

**Analytics visibility**
- `analytics.read_partner_aggregate` for their own project page performance only (no PII)

**Assignment logic**
- partner never assigns leads

---

## Role: Co-Agent (member/pro)

Goal: empower referrals + collaboration without leaking all leads.

**Page access**
- Co-Agent workspace (private)

**CRUD**
- `referrals.create` (new)
- `referrals.read_own`
- `saved_searches.*` (own)

**Lead visibility**
- only referrals they created and status updates for those referrals

**Marketplace control**
- can request introductions; possible Pro discount access

**Analytics visibility**
- own referral performance aggregates only

---

## Role: Agent / Advisor

Goal: handle leads, assignments, follow-ups.

**Page access**
- Leads inbox
- Lead detail
- Tickets (assigned)
- Content read (all)

**CRUD permissions**
- `inquiries.read_assigned`
- `inquiries.update_assigned` (status, notes, score)
- `viewings.create/update/read` (assigned inquiries)
- `lead_assignments.read` (history for assigned inquiries)
- `tickets.read_assigned`, `tickets.update_assigned`
- `notifications.read_own`

**Lead visibility**
- assigned only (default)
- optional: team-lead view if `inquiries.read_team` granted

**Marketplace control**
- can create marketplace introduction on behalf of member

**Project visibility**
- published only; can flag content issues

**Analytics visibility**
- `analytics.read_aggregate` (non-PII dashboards)
- `analytics.read_lead_events` only for sessions tied to their assigned inquiries (requires careful linking)

**Assignment logic**
- can request reassignment; cannot assign to others unless `inquiries.assign` granted

---

## Role: Content Manager

Goal: publish authority content without touching leads.

**Page access**
- Admin content modules: Blog, Insights, Resources, Press, Testimonials, FAQs, Company Info

**CRUD**
- `blog_posts.*`
- `insights.*`
- `resources.*`
- `press_items.*`
- `testimonials.*`
- `faqs.*`
- `company_info.*`
- Read-only on inventory: `projects.read`, `developers.read`, `areas.read`

**Lead visibility**
- none

**Marketplace control**
- none (unless explicitly granted)

**Analytics visibility**
- `analytics.read_content_aggregate` (page-level only)

---

## Role: Admin

Goal: operations across content + inventory + CRM.

**Page access**
- All admin modules

**CRUD**
- Inventory: `properties.*`, `projects.*`, `developers.*`, `areas.*`
- CRM: `inquiries.*`, `viewings.*`, `lead_assignments.*`
- Support: `tickets.*`
- Marketplace: `marketplace_items.*`, `marketplace_categories.*`
- Content: all Content Manager perms

**Lead visibility**
- all leads

**Analytics visibility**
- `analytics.read_aggregate`, `analytics.read_raw_limited` (no raw IP)

**Assignment logic**
- can assign/reassign; can set routing rules

---

## Role: Super Admin

Goal: security + governance.

**Page access**
- Everything Admin can access
- RBAC management UI
- Audit logs UI
- System settings UI

**CRUD**
- `roles.*`, `permissions.*`, `user_roles.*`
- `audit_logs.read`
- `users.*`
- `system_settings.*`

**Lead visibility**
- all

**Analytics visibility**
- all (still avoid storing raw IP; only hashed)

**Assignment logic**
- override + emergency access

---

## Enforcement Notes (non-negotiable)

- API must enforce:
  - row-level lead access (assigned-only by default)
  - content publish workflow (draft not public)
  - marketplace moderation (`draft` never public)
- Audit logs:
  - record every status change and assignment on `inquiries`
  - record publishing actions on content
