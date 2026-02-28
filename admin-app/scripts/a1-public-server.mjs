import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';

const host = process.env.A1_HOST || '127.0.0.1';
const port = Number(process.env.A1_PORT || 3000);

const cssPath = path.join(process.cwd(), 'app', 'globals.css');
const cssText = await fs.readFile(cssPath, 'utf8');
const internalMediaHosts = new Set(['127.0.0.1', 'localhost', 'flowbiz.com', 'www.flowbiz.com']);
const eventStore = [];

const CONTENT = {
  en: {
    title: 'Verified Pattaya properties for Europeans — buy, invest, rent, sell with confidence.',
    subtitle: 'Real local media, transparent pricing, and a remote-friendly process.',
    primaryCta: 'Request Consultation',
    secondaryCta: 'Browse Curated Projects',
    trustStrip: 'Local-only media • Foreign ownership guidance • Clear fees & steps • Reply within 1 business day',
    intentTitle: 'Choose your path',
    investDisclaimer: 'Figures are estimates, not guarantees.',
    formPromise: 'Tell us your budget and timeline—we\'ll send a curated shortlist and floor plans within 1 business day.',
    formTrust: 'No spam • Reply within 1 business day',
    noListings: 'More verified listings are being added weekly.',
    insightsFallback: 'Fresh market insights are being verified and added this week.',
    reviewsFallback: 'Client stories are being verified. See client stories for recent cases.',
    methodology: 'See methodology',
  },
  th: {
    title: 'อสังหาพัทยาที่ตรวจสอบแล้วสำหรับชาวยุโรป — ซื้อ ลงทุน เช่า ขาย อย่างมั่นใจ',
    subtitle: 'สื่อท้องถิ่นจริง ราคาชัดเจน และกระบวนการที่ทำงานจากระยะไกลได้',
    primaryCta: 'ขอคำปรึกษา',
    secondaryCta: 'ดูโครงการคัดสรร',
    trustStrip: 'สื่อจากพื้นที่จริง • คำแนะนำสิทธิ์ต่างชาติ • ค่าใช้จ่ายและขั้นตอนชัดเจน • ตอบกลับภายใน 1 วันทำการ',
    intentTitle: 'เลือกเส้นทางของคุณ',
    investDisclaimer: 'ตัวเลขเป็นการประมาณการ ไม่ใช่การรับประกัน',
    formPromise: 'แจ้งงบและไทม์ไลน์ของคุณ แล้วเราจะส่ง shortlist พร้อม floor plan ภายใน 1 วันทำการ',
    formTrust: 'ไม่สแปม • ตอบกลับภายใน 1 วันทำการ',
    noListings: 'กำลังเพิ่มรายการที่ผ่านการตรวจสอบอย่างต่อเนื่องทุกสัปดาห์',
    insightsFallback: 'กำลังเพิ่มข้อมูลเชิงลึกตลาดที่ตรวจสอบแล้วในสัปดาห์นี้',
    reviewsFallback: 'กำลังอัปเดตรีวิวลูกค้าที่ตรวจสอบแล้ว ดูเรื่องราวลูกค้าเพิ่มเติมได้',
    methodology: 'ดูวิธีคัดเลือก',
  },
};

const intentCards = {
  en: [
    { key: 'invest', title: 'Invest', fit: 'For yield-focused investors', outcome: 'Get vetted picks + risk notes', href: '/en/investment?intent=invest' },
    { key: 'buy', title: 'Buy', fit: 'For end-buyers moving to Pattaya', outcome: 'Receive shortlist + legal steps', href: '/en/projects?intent=buy' },
    { key: 'rent', title: 'Rent', fit: 'For lifestyle renters and expats', outcome: 'Compare ready-to-move options', href: '/en/rent?intent=rent' },
    { key: 'sell', title: 'Sell', fit: 'For owners preparing an exit', outcome: 'Get pricing and go-to-market plan', href: '/en/sell?intent=sell' },
  ],
  th: [
    { key: 'invest', title: 'Invest', fit: 'สำหรับนักลงทุนที่เน้นผลตอบแทน', outcome: 'รับรายการคัดกรองพร้อมบันทึกความเสี่ยง', href: '/th/investment?intent=invest' },
    { key: 'buy', title: 'Buy', fit: 'สำหรับผู้ซื้อเพื่ออยู่อาศัยในพัทยา', outcome: 'รับ shortlist พร้อมขั้นตอนกฎหมาย', href: '/th/projects?intent=buy' },
    { key: 'rent', title: 'Rent', fit: 'สำหรับผู้เช่าและชาวต่างชาติ', outcome: 'เปรียบเทียบยูนิตพร้อมเข้าอยู่', href: '/th/rent?intent=rent' },
    { key: 'sell', title: 'Sell', fit: 'สำหรับเจ้าของที่ต้องการขาย', outcome: 'รับแผนตั้งราคาและนำออกตลาด', href: '/th/sell?intent=sell' },
  ],
};

const featuredProjects = [
  {
    id: 'prj-1', name: 'Andromeda Residences', area: 'Pratumnak', price: 'From THB 5.9M', facts: ['6 min to beach', 'Branded management', 'Sky pool'], why: 'Strong resale velocity among EU buyers', badge: 'Hot', media: '/media/library/featured/andromeda-cover.jpg',
  },
  {
    id: 'prj-2', name: 'Nova Ocean View', area: 'Wongamat', price: 'From THB 7.2M', facts: ['Prime north Pattaya', 'Sea-view inventory', 'Hotel-grade lobby'], why: 'Low vacancy profile for premium rentals', badge: 'Beachfront', media: '/media/library/featured/nova-ocean-cover.jpg',
  },
  {
    id: 'prj-3', name: 'Aurora Jomtien', area: 'Jomtien', price: 'From THB 3.4M', facts: ['Family amenities', 'Near transport', 'Developer warranty'], why: 'Balanced entry pricing and demand depth', badge: 'New', media: '/media/library/featured/aurora-jomtien-cover.jpg',
  },
  {
    id: 'prj-4', name: 'Central Bay Lofts', area: 'Central Pattaya', price: 'From THB 4.1M', facts: ['CBD walkability', 'Retail access', 'Large layouts'], why: null, badge: null, media: '/media/library/featured/central-bay-cover.jpg',
  },
  {
    id: 'prj-5', name: 'Laguna Horizon', area: 'Na Jomtien', price: 'From THB 8.3M', facts: ['Marina proximity', 'Low-density block', 'Concierge service'], why: null, badge: null, media: '/media/library/featured/laguna-horizon-cover.jpg',
  },
  {
    id: 'prj-6', name: 'Serenity Park', area: 'East Pattaya', price: 'From THB 6.2M', facts: ['Villa-style units', 'Private parking', 'Quiet community'], why: null, badge: null, media: '/media/library/featured/serenity-park-cover.jpg',
  },
];

const investmentPicks = [
  { id: 'pick-1', title: 'Studio near Terminal 21', location: 'North Pattaya', price: 'THB 2.85M', stats: ['Gross est. 6.4%', 'Occupancy est. 86%', 'Mgmt fee medium'], tags: ['Core', 'Liquidity'], media: '/media/library/investment/pick-1.jpg' },
  { id: 'pick-2', title: '1BR sea-view leasehold', location: 'Wongamat', price: 'THB 4.9M', stats: ['Gross est. 5.9%', 'Occupancy est. 82%', 'Premium segment'], tags: ['Premium'], media: '/media/library/investment/pick-2.jpg' },
  { id: 'pick-3', title: '2BR family unit', location: 'Jomtien', price: 'THB 5.4M', stats: ['Gross est. 6.1%', 'Occupancy est. 79%', 'School catchment'], tags: ['Family'], media: '/media/library/investment/pick-3.jpg' },
  { id: 'pick-4', title: 'Resale entry condo', location: 'Central Pattaya', price: 'THB 2.4M', stats: ['Gross est. 6.7%', 'Occupancy est. 84%', 'Below replacement'], tags: ['Value'], media: '/media/library/investment/pick-4.jpg' },
  { id: 'pick-5', title: 'Marina-side 1BR', location: 'Na Jomtien', price: 'THB 6.1M', stats: ['Gross est. 5.4%', 'Occupancy est. 77%', 'Limited supply'], tags: ['Lifestyle'], media: '/media/library/investment/pick-5.jpg' },
  { id: 'pick-6', title: 'Corner duplex', location: 'Pratumnak', price: 'THB 8.8M', stats: ['Gross est. 5.2%', 'Occupancy est. 74%', 'Distinct inventory'], tags: ['Upside'], media: '/media/library/investment/pick-6.jpg' },
];

const videoItems = [
  {
    id: 'video-1',
    title: 'Walkthrough: Premium condo flow',
    href: '/en/case-studies/walkthrough-premium-condo',
    thumb: '/media/library/videos/thumb-walkthrough-1.webp',
    poster: '/media/library/videos/poster-walkthrough-1.webp',
  },
  {
    id: 'video-2',
    title: 'Process: Remote buyer timeline',
    href: '/en/case-studies/remote-buyer-timeline',
    thumb: '/media/library/videos/thumb-process-1.webp',
    poster: '/media/library/videos/poster-process-1.webp',
  },
];

function sendJson(res, code, body) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function sendHtml(res, code, html) {
  res.writeHead(code, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}

function sendNoContent(res, code) {
  res.writeHead(code);
  res.end();
}

async function parseJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function isAllowedMediaUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return false;
  if (raw.startsWith('data:')) return true;
  if (raw.startsWith('/')) return !raw.startsWith('//');

  try {
    const parsed = new URL(raw, `http://${host}:${port}`);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    return internalMediaHosts.has((parsed.hostname || '').toLowerCase());
  } catch {
    return false;
  }
}

function safeMediaUrl(value, fallback) {
  return isAllowedMediaUrl(value) ? value : fallback;
}

function renderA2Home(routeLocale) {
  const locale = routeLocale === 'th' ? 'th' : 'en';
  const t = CONTENT[locale];
  const cards = intentCards[locale];

  const heroPrimaryHref = `/${locale}/contact?intent=consultation`;
  const heroSecondaryHref = `/${locale}/projects?source=home_hero_secondary`;
  const browseHref = `/${locale}/projects?source=home_featured`;
  const methodologyHref = `/${locale}/investment/methodology`;
  const insightsHref = `/${locale}/insights`;
  const storiesHref = `/${locale}/reviews`;
  const teamHref = `/${locale}/about#team`;
  const processHref = `/${locale}/how-we-work`;

  const projectCardsHtml = featuredProjects
    .slice(0, 6)
    .map(
      (project) => `
      <article class="card project-card" aria-label="${project.name}">
        <div class="media-wrap"><img class="cover-media" src="${safeMediaUrl(project.media, '/media/placeholders/property-cover.webp')}" alt="${project.name}" loading="lazy" width="640" height="360" /></div>
        <div class="card-stack">
          <div class="row-inline">
            <h3 class="locale-safe">${project.name}</h3>
            ${project.badge ? `<span class="badge" aria-label="${project.badge}">${project.badge}</span>` : ''}
          </div>
          <p class="locale-safe meta-line">${project.area} • ${project.price}</p>
          <ul class="quick-facts" aria-label="Quick facts">
            ${project.facts.map((fact) => `<li>${fact}</li>`).join('')}
          </ul>
          ${project.why ? `<p class="locale-safe why-picked"><strong>Why picked:</strong> ${project.why}</p>` : ''}
          <a class="btn btn-secondary btn-compact" data-event="home_browse_projects_click" data-placement="featured_card" href="${browseHref}">${t.secondaryCta}</a>
        </div>
      </article>`,
    )
    .join('');

  const investmentCardsHtml = investmentPicks
    .slice(0, 6)
    .map(
      (pick) => `
      <article class="card investment-card" data-item-id="${pick.id}">
        <div class="media-wrap"><img class="cover-media" src="${safeMediaUrl(pick.media, '/media/placeholders/property-cover.webp')}" alt="${pick.title}" loading="lazy" width="640" height="360" /></div>
        <p class="price-prominent" aria-label="Price">${pick.price}</p>
        <h3 class="locale-safe">${pick.title}</h3>
        <p class="locale-safe meta-line">${pick.location}</p>
        <ul class="quick-facts" aria-label="Key stats">${pick.stats.map((stat) => `<li>${stat}</li>`).join('')}</ul>
        <p class="tag-row">${pick.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}</p>
        <a class="btn btn-secondary btn-compact" data-event="home_investment_pick_click" data-item-id="${pick.id}" href="/${locale}/investment/picks/${pick.id}">View pick</a>
      </article>`,
    )
    .join('');

  const videoHtml = videoItems
    .map((video) => {
      const href = locale === 'th' ? video.href.replace('/en/', '/th/') : video.href;
      return `
      <article class="card video-card">
        <a href="${href}">
          <img class="cover-media" src="${safeMediaUrl(video.thumb, '/media/placeholders/image-fallback.webp')}" alt="${video.title}" loading="lazy" width="640" height="360" />
        </a>
        <h3 class="locale-safe">${video.title}</h3>
        <video class="video-proof" controls preload="none" poster="${safeMediaUrl(video.poster, '/media/placeholders/image-fallback.webp')}" aria-label="${video.title}">
          <source src="${safeMediaUrl('/media/library/videos/demo-safe.mp4', '/media/library/videos/demo-safe.mp4')}" type="video/mp4" />
        </video>
      </article>`;
    })
    .join('');

  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FlowBiz Home ${locale.toUpperCase()}</title>
    <style>${cssText}
      .hero-shell{display:grid;gap:var(--space-5);padding-block:var(--space-6)}
      .hero-media{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:var(--radius-lg);background:#e5e7eb}
      .hero-ctas{display:flex;flex-wrap:wrap;gap:var(--space-3)}
      .btn-primary-hero{padding:14px 24px;font-size:1.05rem;font-weight:700;min-height:52px;min-width:250px}
      .btn-secondary-hero{padding:10px 16px;font-size:.95rem;font-weight:500;min-height:44px;min-width:190px}
      .trust-strip{font-size:.95rem;color:var(--color-muted)}
      .section-block{display:grid;gap:var(--space-4)}
      .intent-grid{display:grid;gap:var(--space-4);grid-template-columns:1fr}
      .intent-card{display:grid;gap:var(--space-2);padding:var(--space-4);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface)}
      .intent-card:hover{border-color:var(--color-primary)}
      .intent-card .start-pill{display:inline-flex;align-self:start;color:var(--color-primary-ink);font-weight:700}
      .row-inline{display:flex;gap:var(--space-3);align-items:center;justify-content:space-between}
      .badge,.tag{display:inline-flex;padding:2px 8px;border-radius:999px;background:#edf6f3;color:var(--color-primary-ink);font-size:.85rem}
      .tag-row{display:flex;flex-wrap:wrap;gap:var(--space-2)}
      .meta-line{color:var(--color-muted)}
      .quick-facts{display:grid;gap:4px;padding-left:20px;margin:0}
      .why-picked{font-size:.95rem}
      .project-grid,.video-grid{display:grid;gap:var(--space-4);grid-template-columns:1fr}
      .investment-grid{display:grid;gap:var(--space-4);grid-template-columns:1fr}
      .price-prominent{font-size:1.6rem;font-weight:800;color:var(--color-primary-ink)}
      .btn-compact{align-self:start;padding:8px 12px;font-size:.92rem}
      .proof-grid{display:grid;gap:var(--space-3);grid-template-columns:1fr}
      .method-link{font-weight:600;text-decoration:underline}
      .metrics{display:grid;gap:var(--space-3);grid-template-columns:repeat(3,minmax(0,1fr))}
      .metric{padding:var(--space-3);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface)}
      .sources-note{font-size:.85rem;color:var(--color-muted)}
      .video-proof{width:100%;aspect-ratio:16/9;border-radius:var(--radius-md);background:#000}
      .form-grid{display:grid;gap:var(--space-3);grid-template-columns:1fr}
      .form-meta{font-size:.9rem;color:var(--color-muted)}
      @media (min-width:768px){.intent-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.project-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.video-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.proof-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media (min-width:1024px){.project-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.investment-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media (min-width:2560px){.investment-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}
    </style>
  </head>
  <body>
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <header class="header">
      <div class="container header-shell">
        <a class="brand locale-safe" href="/${locale}">FlowBiz</a>
        <button class="btn btn-secondary nav-toggle" type="button" aria-label="Toggle navigation">Menu</button>
        <nav class="nav" aria-label="Primary">
          <a class="nav-link locale-safe" href="/${locale}/projects">Projects</a>
          <a class="nav-link locale-safe" href="/${locale}/areas">Areas</a>
          <a class="nav-link locale-safe" href="/${locale}/investment">Investment</a>
          <a class="nav-link locale-safe" href="/${locale}/contact">Contact</a>
        </nav>
      </div>
    </header>

    <main id="main-content" class="container content-stack">
      <section class="hero-shell" aria-labelledby="hero-title">
        <img class="hero-media" src="/media/library/home/a2-hero-eu.webp" alt="Pattaya coastline" width="1280" height="720" loading="eager" />
        <div class="content-measure">
          <h1 id="hero-title" class="locale-safe">${t.title}</h1>
          <p class="locale-safe" style="margin-top:var(--space-3)">${t.subtitle}</p>
        </div>
        <div class="hero-ctas" aria-label="Hero actions">
          <a class="btn btn-primary-hero" data-event="home_hero_primary_click" data-cta-id="hero_primary" href="${heroPrimaryHref}">${t.primaryCta}</a>
          <a class="btn btn-secondary btn-secondary-hero" data-event="home_hero_secondary_click" data-cta-id="hero_secondary" data-placement="hero" href="${heroSecondaryHref}">${t.secondaryCta}</a>
        </div>
        <p class="trust-strip locale-safe">${t.trustStrip}</p>
      </section>

      <section class="section-block" aria-labelledby="intent-title">
        <h2 id="intent-title" class="locale-safe">${t.intentTitle}</h2>
        <div class="intent-grid">
          ${cards
            .map(
              (card) => `
            <a class="intent-card" href="${card.href}" data-event="home_intent_start_click" data-intent="${card.key}">
              <h3 class="locale-safe">${card.title}</h3>
              <p class="locale-safe"><strong>Fit:</strong> ${card.fit}</p>
              <p class="locale-safe"><strong>Outcome:</strong> ${card.outcome}</p>
              <span class="start-pill">Start</span>
            </a>`,
            )
            .join('')}
        </div>
      </section>

      <section class="section-block" aria-labelledby="featured-title">
        <div class="row-inline">
          <h2 id="featured-title" class="locale-safe">Curated projects</h2>
          <a class="btn btn-secondary btn-compact" data-event="home_browse_projects_click" data-placement="featured_header" href="${browseHref}">${t.secondaryCta}</a>
        </div>
        ${featuredProjects.length ? `<div class="project-grid">${projectCardsHtml}</div>` : `<div class="state-empty locale-safe">${t.noListings}</div>`}
      </section>

      <section class="section-block" aria-labelledby="investment-title">
        <div class="row-inline">
          <h2 id="investment-title" class="locale-safe">Selected investment opportunities</h2>
          <a class="method-link" href="${methodologyHref}">${t.methodology}</a>
        </div>
        <p class="form-meta locale-safe">${t.investDisclaimer}</p>
        ${investmentPicks.length ? `<div class="investment-grid">${investmentCardsHtml}</div>` : `<div class="state-empty locale-safe">${t.noListings}</div>`}
        <a class="btn btn-secondary btn-compact" href="/${locale}/investment/picks">View all picks</a>
      </section>

      <section class="section-block" aria-labelledby="why-pattaya-title">
        <h2 id="why-pattaya-title" class="locale-safe">Why Pattaya</h2>
        <div class="metrics" role="list">
          <article class="metric" role="listitem"><h3>3 Airports</h3><p>Connected access for regional buyers</p></article>
          <article class="metric" role="listitem"><h3>Year-round demand</h3><p>Tourism + long-stay drivers</p></article>
          <article class="metric" role="listitem"><h3>Price depth</h3><p>Entry to premium inventory range</p></article>
        </div>
        <p class="sources-note locale-safe">Source note: public tourism and infrastructure reports, updated monthly.</p>
        <a class="btn btn-secondary btn-compact" href="/${locale}/guides/areas">Explore area guides</a>
      </section>

      <section class="section-block" aria-labelledby="trust-title">
        <h2 id="trust-title" class="locale-safe">Why international buyers trust us</h2>
        <div class="proof-grid">
          <article class="card"><h3>Local team coverage</h3><p>On-ground advisors across core Pattaya zones.</p></article>
          <article class="card"><h3>Verified curation</h3><p>Only media and listings with source trail and checks.</p></article>
          <article class="card"><h3>3-step process</h3><p>Consult → Shortlist → Tour with clear milestones.</p></article>
          <article class="card"><h3>Reviews proof</h3><p>4.8/5 average from 140+ verified client ratings.</p></article>
          <article class="card"><h3>Response SLA</h3><p>Reply within 1 business day for all consultations.</p></article>
        </div>
        <div class="card-actions">
          <a class="btn btn-secondary btn-compact" href="${teamHref}">Meet the team</a>
          <a class="btn btn-secondary btn-compact" href="${processHref}">How we work</a>
        </div>
      </section>

      <section class="section-block" aria-labelledby="insights-title">
        <h2 id="insights-title" class="locale-safe">Market insight</h2>
        <div class="state-empty locale-safe">${t.insightsFallback}</div>
        <a class="btn btn-secondary btn-compact" href="${insightsHref}">Browse insights</a>
      </section>

      <section class="section-block" aria-labelledby="reviews-title">
        <h2 id="reviews-title" class="locale-safe">Reviews</h2>
        <article class="card" aria-live="polite"><p><strong>4.8/5</strong> from <strong>140+</strong> verified reviews.</p></article>
        <a class="btn btn-secondary btn-compact" href="${storiesHref}">See client stories</a>
      </section>

      <section class="section-block" aria-labelledby="video-title">
        <h2 id="video-title" class="locale-safe">See our work</h2>
        <div class="video-grid">${videoHtml}</div>
        <a class="btn btn-secondary btn-compact" href="/${locale}/case-studies">Watch more case studies</a>
      </section>

      <section class="section-block" aria-labelledby="consult-title">
        <h2 id="consult-title" class="locale-safe">Request consultation</h2>
        <p class="locale-safe">${t.formPromise}</p>
        <form id="consultation-form" class="card" novalidate>
          <div class="form-grid">
            <label class="field locale-safe" for="name"><span>Name</span><input id="name" name="name" type="text" required /></label>
            <label class="field locale-safe" for="contact"><span>WhatsApp or Email</span><input id="contact" name="contact" type="text" required /></label>
            <label class="field locale-safe" for="budget"><span>Budget range</span><select id="budget" name="budget" required><option value="">Select budget</option><option value="lt_3m">Below THB 3M</option><option value="3m_6m">THB 3M - 6M</option><option value="6m_10m">THB 6M - 10M</option><option value="gt_10m">Above THB 10M</option></select></label>
            <label class="field locale-safe" for="purpose"><span>Purpose</span><select id="purpose" name="purpose" required><option value="">Select purpose</option><option value="invest">Invest</option><option value="buy">Buy</option><option value="rent">Rent</option></select></label>
            <label class="field locale-safe" for="timeline"><span>Timeline</span><select id="timeline" name="timeline" required><option value="">Select timeline</option><option value="0_3m">0-3 months</option><option value="3_6m">3-6 months</option><option value="6m_plus">6+ months</option></select></label>
          </div>
          <div class="card-actions">
            <button id="consult-submit" class="btn" type="submit">${t.primaryCta}</button>
            <a class="btn btn-secondary btn-compact" data-event="home_whatsapp_click" data-placement="bottom_form" href="https://wa.me/66000000000">WhatsApp</a>
            <a class="btn btn-secondary btn-compact" href="https://line.me/R/ti/p/@flowbiz">LINE</a>
          </div>
          <p class="form-meta locale-safe">${t.formTrust}</p>
          <p id="form-status" class="form-meta" role="status" aria-live="polite"></p>
          <div id="form-loading" class="state-loading" hidden>Submitting request...</div>
          <div id="form-error" class="state-error" hidden>Unable to submit right now. Please try again.</div>
        </form>
      </section>
    </main>

    <footer class="footer" role="contentinfo">
      <div class="container footer-grid">
        <section class="footer-nap locale-safe" aria-label="Contact details">
          <h3>FlowBiz Pattaya</h3>
          <p>123 Beach Road, Pattaya, Chonburi 20150</p>
          <p>+66 38 000 000</p>
          <p>hello@flowbiz.co</p>
        </section>
        <nav class="footer-links" aria-label="Footer links">
          <a href="/${locale}/projects">Projects</a>
          <a href="/${locale}/areas">Areas</a>
          <a href="/${locale}/investment">Investment</a>
          <a href="/${locale}/about">About</a>
          <a href="/${locale}/contact">Contact</a>
        </nav>
        <nav class="footer-social" aria-label="Legal links">
          <a href="/${locale}/privacy">Privacy Policy</a>
          <a href="/${locale}/terms">Terms of Service</a>
          <a href="/${locale}/cookies">Cookie Policy</a>
        </nav>
      </div>
      <div class="container footer-legal">
        <a href="https://facebook.com/flowbiz">facebook.com/flowbiz</a>
        <span>Copyright 2026 FlowBiz</span>
      </div>
    </footer>

    <script>
      (() => {
        const locale = document.documentElement.lang || 'en';
        const path = location.pathname;
        const endpoint = '/api/v1/events';
        const scrollMarks = [25, 50, 75, 90];
        const firedMarks = new Set();

        function track(eventName, payload) {
          return fetch(endpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ event: eventName, locale, path, ...payload }),
            keepalive: true,
          }).catch(() => null);
        }

        document.querySelectorAll('[data-event]').forEach((node) => {
          node.addEventListener('click', () => {
            const eventName = node.getAttribute('data-event');
            if (!eventName) return;
            const payload = {
              label: node.textContent?.trim() || '',
              placement: node.getAttribute('data-placement') || undefined,
              item_id: node.getAttribute('data-item-id') || undefined,
            };
            track(eventName, payload);
          });
        });

        window.addEventListener('scroll', () => {
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (scrollHeight <= 0) return;
          const depth = Math.round((window.scrollY / scrollHeight) * 100);
          for (const mark of scrollMarks) {
            if (depth >= mark && !firedMarks.has(mark)) {
              firedMarks.add(mark);
              track('home_scroll_depth', { depth: mark });
            }
          }
        }, { passive: true });

        const form = document.getElementById('consultation-form');
        const submitBtn = document.getElementById('consult-submit');
        const statusEl = document.getElementById('form-status');
        const loadingEl = document.getElementById('form-loading');
        const errorEl = document.getElementById('form-error');

        if (form instanceof HTMLFormElement) {
          form.addEventListener('submit', async (event) => {
            event.preventDefault();
            errorEl.hidden = true;
            loadingEl.hidden = false;
            statusEl.textContent = 'Submitting...';
            submitBtn.disabled = true;

            const data = Object.fromEntries(new FormData(form).entries());
            const intent = String(data.purpose || 'general');
            const fieldsPresent = Object.entries(data)
              .filter(([, value]) => String(value || '').trim().length > 0)
              .map(([key]) => key);

            try {
              await track('home_form_submit', { fields_present: fieldsPresent, intent });
              await fetch('/api/v1/inquiries', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  name: data.name,
                  contact: data.contact,
                  budget: data.budget,
                  purpose: data.purpose,
                  timeline: data.timeline,
                  source_page: location.pathname,
                }),
              });
              statusEl.textContent = 'Submitted. We will reply within 1 business day.';
              form.reset();
            } catch {
              errorEl.hidden = false;
              statusEl.textContent = '';
            } finally {
              loadingEl.hidden = true;
              submitBtn.disabled = false;
            }
          });
        }
      })();
    </script>
  </body>
</html>`;
}

function buildHtml(routePath, locale) {
  if (routePath === '/') {
    return renderA2Home(locale);
  }

  const title = `${locale.toUpperCase()} ${routePath === '/' ? 'home' : routePath.slice(1)}`;
  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>${cssText}</style>
  </head>
  <body>
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <header class="header">
      <div class="container header-shell">
        <a class="brand locale-safe" href="/${locale}">FlowBiz</a>
        <button class="btn btn-secondary nav-toggle" type="button" aria-label="Toggle navigation">Menu</button>
        <nav class="nav" aria-label="Primary">
          <a class="nav-link locale-safe" href="/${locale}/about">About</a>
          <a class="nav-link locale-safe" href="/${locale}/projects">Projects</a>
          <a class="nav-link locale-safe" href="/${locale}/property/sample-property">Properties</a>
          <a class="nav-link locale-safe" href="/${locale}/contact">Contact</a>
        </nav>
      </div>
    </header>
    <main id="main-content" class="container content-stack">
      <section class="content-measure locale-safe">
        <h1>${title}</h1>
        <p>Public route: ${routePath}</p>
      </section>
      <article class="card">
        <h2 class="locale-safe">Shared UI Card</h2>
        <h3 class="locale-safe">Typography H3 Example</h3>
        <p class="locale-safe">Button, input and card states are shared globally for every route.</p>
        <div class="card-actions">
          <button class="btn" type="button">Primary action</button>
          <button class="btn btn-secondary" type="button">Secondary action</button>
          <button class="btn" type="button" disabled>Disabled action</button>
        </div>
        <label class="field locale-safe">
          <span>Search properties</span>
          <input type="text" placeholder="Type a keyword" />
        </label>
        <img class="cover-media" src="/media/placeholders/property-cover.webp" alt="Local media example" loading="lazy" />
      </article>
      <section class="state-grid">
        <div class="state-empty locale-safe">Empty state: no items found for this section.</div>
        <div class="state-loading locale-safe">Loading state</div>
        <div class="state-error locale-safe">Error state: unable to load data. Please retry.</div>
      </section>
    </main>
    <footer class="footer" role="contentinfo">
      <div class="container footer-grid">
        <section class="footer-nap locale-safe" aria-label="Contact details">
          <h3>FlowBiz Pattaya</h3>
          <p>123 Beach Road, Pattaya, Chonburi 20150</p>
          <p>+66 38 000 000</p>
          <p>hello@flowbiz.co</p>
        </section>
        <nav class="footer-links" aria-label="Footer links">
          <a href="/${locale}/about">About</a>
          <a href="/${locale}/projects">Projects</a>
          <a href="/${locale}/property/sample-property">Properties</a>
          <a href="/${locale}/contact">Contact</a>
        </nav>
        <nav class="footer-social" aria-label="Social links">
          <a href="https://facebook.com/flowbiz">Facebook</a>
          <a href="https://instagram.com/flowbiz">Instagram</a>
          <a href="https://youtube.com/@flowbiz">YouTube</a>
        </nav>
      </div>
      <div class="container footer-legal">
        <a href="/${locale}/privacy">Privacy Policy</a>
        <a href="/${locale}/terms">Terms of Service</a>
        <span>Copyright 2026 FlowBiz</span>
      </div>
    </footer>
  </body>
</html>`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${host}:${port}`);
  const pathname = url.pathname;

  if (pathname === '/api/v1/events') {
    if (req.method === 'OPTIONS') {
      return sendNoContent(res, 204);
    }
    if (req.method === 'POST') {
      parseJsonBody(req)
        .then((payload) => {
          eventStore.push({
            event: String(payload.event || ''),
            locale: String(payload.locale || ''),
            path: String(payload.path || ''),
            payload,
            created_at: new Date().toISOString(),
          });
          sendJson(res, 202, { ok: true, endpoint: '/api/v1/events' });
        })
        .catch(() => {
          sendJson(res, 400, { ok: false, error: 'invalid_json' });
        });
      return;
    }
    return sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
  }

  if (pathname === '/api/v1/inquiries' && req.method === 'POST') {
    parseJsonBody(req)
      .then((payload) => {
        sendJson(res, 201, {
          ok: true,
          inquiry_id: `inq_${Date.now()}`,
          source_page: payload.source_page || null,
        });
      })
      .catch(() => {
        sendJson(res, 400, { ok: false, error: 'invalid_json' });
      });
    return;
  }

  if (pathname === '/api/v1/events-log') {
    return sendJson(res, 200, { data: eventStore });
  }

  if (pathname === '/healthz') {
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === '/api/v1/projects') {
    return sendJson(res, 200, { data: [{ slug: 'sample-project' }] });
  }
  if (pathname === '/api/v1/properties') {
    return sendJson(res, 200, { data: [{ slug: 'sample-property' }] });
  }
  if (pathname === '/api/v1/content/blog-posts/' || pathname === '/api/v1/content/blog-posts') {
    return sendJson(res, 200, [{ slug: 'sample-blog' }]);
  }
  if (pathname === '/api/v1/content/guides/' || pathname === '/api/v1/content/guides') {
    return sendJson(res, 200, [{ slug: 'sample-guide' }]);
  }
  if (pathname === '/api/v1/areas') {
    return sendJson(res, 200, [{ slug: 'sample-area' }]);
  }
  if (pathname === '/api/v1/developers') {
    return sendJson(res, 200, [{ slug: 'sample-developer' }]);
  }

  const parts = pathname.split('/').filter(Boolean);
  const locale = parts[0] === 'th' ? 'th' : 'en';
  const routePath = parts.length ? `/${parts.slice(1).join('/')}` || '/' : '/';
  return sendHtml(res, 200, buildHtml(routePath, locale));
});

server.listen(port, host, () => {
  console.log(`A1 public server listening at http://${host}:${port}`);
});
