# Tech Stack Report: www.assetmp.net

## Confirmed from HAR and HTML
- Web server: nginx (response header `Server: nginx`).
- Backend: custom PHP; endpoints such as `log_interaction.php`, `searchlocation.php`, `mv/ajax/send-contact.php`.
- Routing: query-based (`?pageid=`), not CMS-style rewrites.
- Multi-language: paths `/en/`, `/th/`, `/cn/`, `/ru/`, `/it/` with hreflang tags.
- Protocols: site over HTTP/1.1; Tawk.to over HTTP/3.

## Frontend Libraries
- Bootstrap 5
- jQuery
- Swiper
- Fancybox
- Nice-select
- animate.css
- lazysizes
- WOW.js
- Easy Pie Chart
- simpleParallax
- html2canvas + jsPDF (client-side PDF)

## Third-party Services
- Tawk.to (live chat) — confirmed via HAR and HTML scripts.
- Social share buttons: Facebook, LinkedIn, X.
- Not detected in this capture: GA/GA4/GTM, Meta Pixel, Google Ads, Hotjar, Clarity.

## Not WordPress or Common CMS
- No `wp-content`, `wp-json`, `wp-admin`.
- No `laravel_session` or `ci_session` cookies.

## Infrastructure Outline
```
Browser
  │ HTTPS
  ▼
Nginx (199.192.22.32)
  - Serves static assets under /mv/
  - Proxies PHP endpoints
  ▼
Custom PHP backend
  - Dynamic pages via ?pageid=
  - AJAX endpoints (.php) for search/contact
```

## Recommendations for Integration
1. Request server/FTP or panel access to inspect codebase and DB schema.
2. Add GA4 + GTM before running ads and to measure landing performance.
3. Spin up a staging subdomain (e.g., dev.assetmp.net) for new landing pages.
4. Align on API contract or create a thin API layer for property data (to sync with Sheets/Airtable if needed).
5. Keep Tawk.to keys handy if chat needs to be reused or integrated with agents.

## Quick Mapping for AMP Project
- Landing page: free to build on new path or subdomain (no CMS constraints).
- Analytics: must be added (not present in current capture).
- Chat: Tawk.to available for reuse.
- Multi-language: structure already present; plan content per locale.
