# Responsive Checklist

## Desktop 1440px / Laptop 1280px

- Public header shows full navigation.
- Hero uses two-column layout with lead form.
- Listing pages use sidebar filters and multi-column cards.
- Detail pages use gallery + content/lead-rail layout.
- Admin pages use fixed sidebar and topbar.

## Tablet 768px

- Public navigation collapses behind menu button.
- Hero, contact, detail and calculator layouts stack to one column.
- Listing filters become a drawer opened by the Filters button.
- Cards reduce to two or one columns depending on available width.
- Admin sidebar becomes a drawer opened by the Menu button.

## Mobile 390px / 430px

- No section uses fixed page-width content.
- Cards stack vertically.
- Filter panel opens as an off-canvas drawer with backdrop.
- Detail pages include sticky bottom CTA.
- Buttons maintain touch-friendly height.
- Tables remain horizontally scrollable inside `table-wrap` containers.
- Admin tables and kanban areas remain scrollable without page-wide overflow.

## Interaction Checks

- Mobile menu toggle: `data-menu-toggle`.
- Filter drawer toggle: `data-filter-toggle`.
- Admin drawer toggle: `data-admin-toggle`.
- Gallery thumbnail switching: `data-gallery-thumb`.
- Buying cost estimator: isolated frontend calculation, no network calls.
