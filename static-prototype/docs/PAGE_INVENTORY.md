# AMP Pattaya Static Prototype Page Inventory

Source references inspected:

- `docs/design/AMP Pattaya UX System _Offline_.html`
- `docs/design/Amppattaya_extracted/AMP Pattaya UX System.html`
- `docs/design/Amppattaya_extracted/styles.css`
- `docs/design/Amppattaya_extracted/data.jsx`
- `docs/design/Amppattaya_extracted/shared.jsx`
- `docs/design/Amppattaya_extracted/screens/*.jsx`
- `docs/design/Amppattaya_extracted/admin/*.jsx`

Note: `Amppattaya.zip` was not present in the workspace. The extracted reference package above was used as the visual source of truth.

## Design System Inventory

- Palette: warm bone page background, sand surfaces, white paper cards, deep teal/ink text, coral CTA, champagne premium accent.
- Typography: editorial serif display headings, clean sans body/UI text, mono numbers for prices and KPIs.
- Brand: framed AMP mark, serif AMP Pattaya wordmark, premium real-estate trust positioning.
- Buttons: coral primary CTA, ink/teal dark buttons, paper/ghost secondary buttons, pill radii.
- Components: top navigation, footer, project cards, property cards, metric tiles, tags/badges, filter chips, lead form, trust bar, mobile sticky CTA, admin sidebar, KPI cards, tables, kanban cards, map placeholders.
- UX rules: trust before delight, investor-first copy, foreign-quota transparency, same-day advisor contact, mobile-first conversion.

## Public Website Pages Found

### Homepage

Reference: `screens/homepage.jsx`

- Dark image hero with luxury/investor positioning.
- Sticky topbar with Home, Buy, New Projects, Areas, Invest, Contact.
- Hero CTAs: view available units, Smart Finder.
- Right-side lead form.
- Overlapping search bar with Buy/Rent/Off-plan/Villas tabs.
- Featured investor-grade projects.
- Dark proof/investment stats band.
- Area/location cards.
- Smart Finder CTA and sample shortlist output.
- Trust bar.
- Testimonials and advisor panel.
- Foreign ownership/quota module.
- FAQ section.
- Bottom contact CTA strip.
- Footer.

### Project Listing / Projects

Reference: `screens/listing.jsx`

- Header strip with result count and sort.
- View switcher: grid, split, map.
- Filter chips and sticky filter sidebar.
- Project cards and list rows.
- Map panel with price pins and Pattaya coastal map treatment.
- Compare floating bar.
- Footer.

### Project Detail

Reference: `screens/project-detail.jsx`

- Breadcrumb and action bar.
- Large multi-image gallery.
- Project title, location, developer, tags.
- Key stats: from price, yield, completion, foreign quota.
- Section nav: Overview, Units & plans, Amenities, Investment, Location, Developer, FAQ.
- Why this project cards.
- Available units table and floor plan CTA.
- Amenities grid.
- Dark investment thesis block.
- Map/location placeholder.
- Developer proof card.
- Sticky lead form and advisor contact card.
- Similar projects.
- Footer.
- Mobile reference includes simplified hero, stat cards, lead CTA, sticky bottom CTA.

### Property Detail

Reference: `screens/property-detail.jsx`

- Breadcrumb.
- Gallery with active image thumbnails.
- Unit title, price, price per sqm, monthly estimate.
- Primary CTA, save, WhatsApp/LINE.
- Unit specifications grid.
- Floor plan preview.
- Description.
- Investment numbers.
- Total cost to acquire.
- Location map placeholder.
- Sticky agent card and schedule-viewing card.
- Similar units.
- Footer.
- Mobile reference includes condensed hero/gallery, sticky CTA, specs, agent card.

### Smart Finder

Reference: `screens/finder.jsx` and mobile finder

- Quiz/intake layout.
- Progress bar.
- Budget, area, timeline and buyer-intent steps.
- Recommended shortlist output.
- Mobile full-screen 90-second finder pattern.

### Compare

Reference: `screens/compare.jsx`

- Side-by-side project comparison.
- Project header cards.
- Row-based comparison table with highlighted best values.
- Foreign quota status tags.
- AMP recommendation block.
- CTA row.
- Footer.

### Cost / Yield Calculator

Reference: `screens/calculator.jsx`

- Investor toolkit hero.
- Left-side input sliders: purchase price, down payment, mortgage, rental income, management fee.
- Right-side result cards: cash yield, total cash to close, monthly cash flow.
- Upfront cost breakdown.
- 5-year return projection chart.
- Advisory CTA.
- Footer.

### Contact / Lead Capture

Reference: `screens/contact.jsx`

- Hero with same-day reply positioning.
- Channel cards: WhatsApp, LINE, phone, email.
- Office address card.
- Sticky lead form.
- Team/advisor cards.
- Trust bar.
- Footer.

### Area Guide

Reference: `screens/area-guide.jsx`

- Area pill navigation.
- Large area hero with image background.
- Area stats and investment thesis.
- Best-for chips and watch-out callout.
- Map placeholder with project pins.
- Nearby amenities.
- Projects in area.
- Footer.

### Foreign Ownership / Quota Explainer

Reference: `screens/area-guide.jsx` (`QuotaExplainer`)

- Foreign ownership hero.
- 49% rule visualization.
- Six steps to ownership.
- Villas and land legal structures.
- Sticky lead form and legal call CTA.
- Footer.

## Public Pages Required For Static Prototype

- `index.html`: homepage pattern.
- `pages/buy.html`: resale/property listing grid using listing/filter patterns.
- `pages/rent.html`: rental listing variant.
- `pages/projects.html`: new project listing using project listing pattern.
- `pages/project-detail.html`: project detail pattern.
- `pages/property-detail.html`: property detail pattern.
- `pages/sell.html`: seller landing page extrapolated from CTA/trust/form components.
- `pages/about.html`: company/trust/team page extrapolated from homepage/contact proof sections.
- `pages/contact.html`: contact pattern.
- `pages/shortlist.html`: saved property layout extrapolated from shortlist/compare state components.
- `pages/compare.html`: compare pattern.
- `pages/buying-cost-estimator.html`: calculator pattern.

## Admin / Back-Office Pages Found

### Admin Shell

Reference: `admin/shell.jsx`

- Left sidebar with workspace, inventory and insights sections.
- Sticky topbar with page title, subtitle, notification, create action.
- Search box and profile block.
- Mobile admin references show stacked/drawer-style navigation.

### Dashboard

Reference: `admin/dashboard.jsx`

- KPI cards: new leads, qualified rate, viewings booked, pipeline value.
- Pipeline funnel chart.
- Lead source breakdown.
- Hot leads table.
- Today's viewings.
- Follow-up reminders.
- Team activity feed.

### Lead Pipeline

Reference: `admin/pipeline.jsx`

- Kanban board with New, Qualified, Viewing, Negotiating, Follow-up, Won columns.
- Lead cards with priority, score, budget, channel actions.
- Filter/search bar.

### Lead Detail

Reference: `admin/lead-detail.jsx`

- Lead profile header with stage, priority and score.
- Stage buttons.
- Tabs: Activity, Notes, Files, Interests, Deals.
- Composer for notes/messages.
- Timeline.
- Shortlist cards.
- Right rail: contact, buyer profile, assigned advisor, suggested next action.

### Property / Project Management

Reference: `admin/properties.jsx`

- Inventory page with tab switcher for properties/projects.
- Search and filter chips.
- Property table with status, completeness, views, inquiries, actions.
- Import and add-property CTAs.

### Viewings Calendar

Reference: `admin/calendar-marketing.jsx`

- Week calendar grid.
- Viewing event cards.
- Today rail.
- Pending confirmations.
- Agent workload.

### Marketing Performance

Reference: `admin/calendar-marketing.jsx`

- Marketing KPI row.
- Revenue by source chart.
- Buyer country breakdown.
- Active campaign table.

### Admin Mobile

Reference: `admin/mobile.jsx`

- Mobile dashboard with hero CTA, today KPIs, hot leads, next viewings, compact nav.
- Mobile lead detail with score, contact actions, buyer profile and timeline.

## Admin Pages Required For Static Prototype

- `admin/login.html`: login card extrapolated from AMP branding and admin shell.
- `admin/index.html`: entry page redirect/link to dashboard.
- `admin/dashboard.html`: dashboard pattern.
- `admin/properties.html`: inventory property table.
- `admin/property-form.html`: create/edit property form extrapolated from inventory fields.
- `admin/projects.html`: project table using inventory/project data.
- `admin/project-form.html`: create/edit project form extrapolated from project detail/inventory fields.
- `admin/leads.html`: lead table and pipeline-inspired filters.
- `admin/lead-detail.html`: lead detail pattern.
- `admin/users.html`: user table extrapolated from agents/admin profile components.
- `admin/settings.html`: company/contact/website/lead-routing settings extrapolated from admin shell/forms.

## Shared Content Inventory

- Example projects: Riviera California, Riviera Beverly Hills, Once Wongamat, Skypark Lucean Jomtien, Grand Solaire Noble, Arom Wongamat, Copacabana Jomtien.
- Example areas: Wongamat, Pratumnak, Jomtien, Na Jomtien, Central Pattaya, Bang Saray.
- CTA wording: Book a Private Tour, View Floor Plans & Prices, Request Latest Availability, Contact Agent, Send Inquiry, Chat on WhatsApp, View Project Details.
- Trust copy: licensed brokerage, foreign quota verification, escrow, multilingual advisors, same-day reply.

## Build Checklist

- Recreate the design tokens in one shared CSS file.
- Keep navigation relative and local-file friendly.
- Use shared public header/footer across all public pages.
- Use shared admin shell across admin pages.
- Include mobile menu and admin drawer behavior in `assets/js/main.js`.
- Add mobile sticky CTA on project and property detail pages.
- Ensure public and admin pages have meaningful static content, not empty placeholders.
