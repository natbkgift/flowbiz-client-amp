# Design Implementation Notes

## Matched From Reference

- Warm bone/sand/paper palette with deep ink, coral CTA and champagne premium accent.
- Serif editorial display headings paired with clean sans UI text and mono-style numbers.
- Premium real-estate card system: large image regions, soft borders, pill CTAs and restrained shadows.
- Homepage rhythm: dark hero, lead form, overlapping search, investor shortlist, proof band, area section, trust, CTA.
- Listing patterns: filter drawer/sidebar, chip rows, sort UI, property/project cards and map placeholder.
- Detail patterns: gallery, key facts, section navigation, sticky lead rail, agent card and mobile sticky CTA.
- Admin shell: left navigation, sticky topbar, KPI cards, tables, kanban, CRM detail and settings forms.

## Approximations

- The source reference was React artboards; this deliverable is static HTML, so interactive state is reduced to local UI toggles.
- Some bundled image files in the existing app were tiny placeholders. Where useful, project import assets were copied into the prototype and reused.
- The admin calendar and marketing artboards were represented through dashboard/tasks/activity and lead/inventory tables rather than creating separate required pages, because the requested admin page list did not require calendar or marketing pages.
- Icons are represented by text labels, tags and simple UI affordances instead of recreating the full JSX icon library.

## Safety Boundaries

- No production application files were modified.
- No backend, database, authentication, analytics, tracking or external scripts were added.
- All created files live under `static-prototype/`.
- Forms are visual-only; buttons do not submit data.
