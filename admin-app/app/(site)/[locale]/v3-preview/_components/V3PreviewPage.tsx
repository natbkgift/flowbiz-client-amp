/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import type { ReactNode } from 'react';

import {
  advisors,
  areas,
  contactHeroImage,
  faqs,
  heroImage,
  processNotes,
  projects,
  type V3PreviewRoute,
  type V3Project,
} from '../_lib/v3-preview-data';
import styles from '../v3-preview.module.css';

const basePath = '/en/v3-preview';

function href(path = '') {
  return `${basePath}${path}`;
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 0 20" />
      <path d="M12 2a15.3 15.3 0 0 0 0 20" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1.2" />
      <rect x="14" y="4" width="6" height="6" rx="1.2" />
      <rect x="4" y="14" width="6" height="6" rx="1.2" />
      <rect x="14" y="14" width="6" height="6" rx="1.2" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M8 6h12" />
      <path d="M8 12h12" />
      <path d="M8 18h12" />
      <circle cx="4" cy="6" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21s-7.5-4.8-9.5-9.3C.9 8.2 2.8 5 6.1 5c1.8 0 3.3 1 4.1 2.3C11 6 12.5 5 14.3 5c3.3 0 5.2 3.2 3.6 6.7C16 16.2 12 21 12 21Z" />
    </svg>
  );
}

function Logo() {
  return (
    <span className={styles.logo} aria-label="AMP Pattaya">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="0.5" y="0.5" width="31" height="31" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M9 23 L16 9 L23 23 M12 18 L20 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>AMP <em>Pattaya</em></span>
    </span>
  );
}

function ShellHeader({ route }: { route: V3PreviewRoute }) {
  const items = [
    { label: 'Home', route: 'home' as const, href: href() },
    { label: 'Buy', route: 'listing' as const, href: href('/listing') },
    { label: 'New Projects', route: 'listing' as const, href: href('/new-projects') },
    { label: 'Areas', route: 'area-guide' as const, href: href('/area-guide') },
    { label: 'Invest', route: 'calculator' as const, href: href('/calculator') },
    { label: 'Contact', route: 'contact' as const, href: href('/contact') },
  ];

  return (
    <header className={`${styles.header} ${route === 'home' ? styles.headerHome : ''}`}>
      <div className={styles.headerInner}>
        <Link href={href()} className={styles.brand}>
          <Logo />
        </Link>

        <nav className={styles.nav} aria-label="AMP public v3 preview navigation">
          {items.map((item) => (
            <Link key={item.label} href={item.href} className={route === item.route ? styles.navActive : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <button type="button" className={styles.plainPill}>THB <ChevronDownIcon /></button>
          <span className={styles.headerDivider} />
          <button type="button" className={styles.plainPill}><GlobeIcon /> EN <ChevronDownIcon /></button>
          <span className={styles.headerDivider} />
          <button type="button" className={styles.outlinePill}><UserIcon /> Sign in</button>
          <Link href={href('/contact')} className={styles.coralPill}>Book a viewing <ArrowIcon /></Link>
        </div>

        <details className={styles.mobileNav}>
          <summary aria-label="Open v3 preview navigation"><span /><span /><span /></summary>
          <div>
            {items.map((item) => (
              <Link key={item.label} href={item.href}>{item.label}</Link>
            ))}
            <Link href={href('/contact')}>Book a viewing</Link>
          </div>
        </details>
      </div>
    </header>
  );
}

function ShellFooter() {
  const groups = [
    ['Browse', 'New projects', 'Resale condos', 'Pool villas', 'Area guide', 'Compare'],
    ['Plan', 'Price on request', 'Availability to verify', 'Cost planner', 'Viewing notes', 'Legal questions'],
    ['Company', 'About AMP', 'Our team', 'Contact', 'Privacy', 'Disclosure'],
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        <div className={styles.footerBrand}>
          <Logo />
          <p>Pattaya property advisory preview for owner review. Price, availability, and project details subject to confirmation.</p>
          <div className={styles.socials} aria-label="Contact shortcuts">
            <Link href={href('/contact')} aria-label="Chat">⌕</Link>
            <Link href={href('/contact')} aria-label="Email">✉</Link>
            <Link href={href('/contact')} aria-label="Phone">☎</Link>
          </div>
        </div>

        {groups.map(([title, ...links]) => (
          <div key={title} className={styles.footerColumn}>
            <span>{title}</span>
            {links.map((label) => (
              <Link key={label} href={href(label === 'Cost planner' ? '/calculator' : label === 'Contact' ? '/contact' : '/listing')}>{label}</Link>
            ))}
          </div>
        ))}

        <div className={styles.footerColumn}>
          <span>Office</span>
          <p>Office details subject to confirmation.<br />Viewing hours and advisor availability to verify.</p>
          <Link href={href('/contact')}>Request contact details</Link>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <span>© 2026 AMP Pattaya · Design preview for owner review</span>
        <span>Terms&nbsp;&nbsp; Privacy&nbsp;&nbsp; Disclosure</span>
      </div>
    </footer>
  );
}

function StatStrip() {
  const stats = [
    ['Price', 'Price on request'],
    ['Availability', 'Availability to verify'],
    ['Details', 'Project details subject to confirmation'],
    ['Review', 'Owner review required'],
  ];

  return (
    <dl className={styles.heroStats}>
      {stats.map(([value, label]) => (
        <div key={value}>
          <dt>{value}</dt>
          <dd>{label}</dd>
        </div>
      ))}
    </dl>
  );
}

function LeadCard() {
  return (
    <aside className={styles.leadCard}>
      <span className={styles.mono}>Get price &amp; floor plan</span>
      <h3>Speak to an advisor</h3>
      <p><span aria-hidden="true">●</span> Response to verify</p>
      <input aria-label="Your name" placeholder="Your name *" />
      <div className={styles.leadFields}>
        <input aria-label="Phone with code" placeholder="Phone (with code)" />
        <input aria-label="Email" placeholder="Email" />
      </div>
      <div className={styles.leadFields}>
        <select defaultValue="Price on request" aria-label="Budget">
          <option>Price on request</option>
          <option>Availability to verify</option>
          <option>Project details subject to confirmation</option>
        </select>
        <select defaultValue="Availability to verify" aria-label="Bedrooms">
          <option>Availability to verify</option>
          <option>Price on request</option>
          <option>Project details subject to confirmation</option>
        </select>
      </div>
      <select defaultValue="Availability to verify" aria-label="Buying timeline">
        <option>Availability to verify</option>
        <option>Project details subject to confirmation</option>
        <option>Price on request</option>
      </select>
      <small>✓ Preferred contact channel for advisor review</small>
      <Link href={href('/contact')} className={styles.fullCoral}>Send &amp; request details <ArrowIcon /></Link>
      <em>Project details subject to confirmation.</em>
    </aside>
  );
}

function SearchBar() {
  const fields = [
    ['Location', 'Anywhere in Pattaya'],
    ['Type', 'Project details subject to confirmation'],
    ['Bedrooms', 'Availability to verify'],
    ['Budget', 'Price on request'],
  ];

  return (
    <div className={styles.searchPanel}>
      <div className={styles.searchTabs}>
        {['Buy', 'Rent', 'Off-plan', 'Villas'].map((item, index) => (
          <Link key={item} href={href(index === 1 ? '/listing' : '/listing')} className={index === 0 ? styles.tabActive : undefined}>{item}</Link>
        ))}
      </div>
      <div className={styles.searchFields}>
        {fields.map(([label, value]) => (
          <Link key={label} href={href('/listing')}>
            <span>{label}</span>
            <strong>{value}</strong>
          </Link>
        ))}
        <Link href={href('/listing')} className={styles.searchButton}>Search listings</Link>
      </div>
    </div>
  );
}

function ProjectCard({ project, compact = false }: { project: V3Project; compact?: boolean }) {
  return (
    <Link href={href(`/project/${project.slug}`)} className={compact ? styles.projectCardCompact : styles.projectCard}>
      <span className={styles.imageFrame}>
        <img src={project.image} alt={project.name} loading="eager" />
        <span className={styles.imageAction}>{compact ? <HeartIcon /> : <ArrowIcon />}</span>
      </span>
      <span className={styles.cardBody}>
        <span className={styles.cardMeta}>{project.badge} <em>{project.area}</em></span>
        <h3>{project.name}</h3>
        <small>{project.developer}</small>
        <span className={styles.cardStats}>
          <span><b>Price</b>{project.from}</span>
          <span><b>Availability</b>{project.availability}</span>
          <span><b>Details</b>{project.quota}</span>
        </span>
        {compact ? <span className={styles.compareChip}>Compare</span> : null}
      </span>
    </Link>
  );
}

function SectionIntro({ kicker, title, body, action, href: actionHref }: { kicker: string; title: ReactNode; body: string; action?: string; href?: string }) {
  return (
    <div className={styles.sectionIntro}>
      <div>
        <span className={styles.mono}>{kicker}</span>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
      {action ? <Link href={actionHref ?? href('/listing')} className={styles.outlineAction}>{action}</Link> : null}
    </div>
  );
}

function HomePage() {
  return (
    <>
      <section className={styles.hero}>
        <img src={heroImage} alt="Pattaya skyline" className={styles.heroImage} loading="eager" />
        <div className={styles.heroOverlay} />
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <span className={styles.livePill}>Project details subject to confirmation</span>
            <h1>Pattaya, priced for<br /><em>investors who measure</em><br />in years, not weekends.</h1>
            <p>Pattaya property advisory for foreign buyers and Thai investors. Price, availability, ownership details, and project information must be confirmed before production use.</p>
            <div className={styles.heroButtons}>
              <Link href={href('/listing')} className={styles.primaryHero}>View available units <ArrowIcon /></Link>
              <Link href={href('/finder')} className={styles.secondaryHero}>90-second Smart Finder</Link>
            </div>
            <StatStrip />
          </div>
          <LeadCard />
        </div>
        <SearchBar />
      </section>

      <section className={styles.section}>
        <SectionIntro
          kicker="Hand-picked, this quarter"
          title={<>The <em>investor-grade</em> shortlist.</>}
          body="A visual shortlist pattern for owner review. Price, availability, and project details remain subject to confirmation."
          action="Browse all projects"
          href={href('/listing')}
        />
        <div className={styles.projectGridThree}>
          {projects.slice(0, 3).map((project) => <ProjectCard key={project.slug} project={project} />)}
        </div>
      </section>

      <section className={styles.darkBand}>
        <div>
          <span className={styles.mono}>Why Pattaya · Why now</span>
          <h2>The Eastern Seaboard&apos;s next decade is being priced in now.</h2>
          <p>Use this V3 preview to review the information architecture and advisory flow before market data, pricing, and project facts are confirmed.</p>
          <Link href={href('/calculator')} className={styles.primaryLight}>Open cost planner <ArrowIcon /></Link>
        </div>
        <div className={styles.thesisGrid}>
          {[
            ['Price', 'Price on request until owner-approved data is available', 'Safe label'],
            ['Availability', 'Availability to verify before any lead handoff', 'Safe label'],
            ['Details', 'Project details subject to confirmation', 'Safe label'],
            ['Advisor flow', 'Questions and viewing notes are collected without changing submit contracts', 'Preview flow'],
          ].map(([title, body, label]) => (
            <article key={title}>
              <span>{title}</span>
              <p>{body}</p>
              <small>{label}</small>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <SectionIntro
          kicker="Browse by area"
          title={<>Six zones. <em>Six investment theses.</em></>}
          body="Area cards preserve the Figma visual structure while counts and commercial claims stay pending confirmation."
          action="Compare areas"
          href={href('/area-guide')}
        />
        <AreaGrid />
      </section>

      <section className={styles.finderBand}>
        <div className={styles.finderCopy}>
          <span className={styles.mono}>Smart Finder · 90 seconds</span>
          <h2>Tell us your budget,<br />we&apos;ll send a shortlist<br />by end of day.</h2>
          <p>Six questions. No call required. Use the brief flow to review budget, timeline, and project-fit interaction states.</p>
          <div className={styles.heroButtons}>
            <Link href={href('/finder')} className={styles.primaryHero}>Start the brief <ArrowIcon /></Link>
            <Link href={href('/calculator')} className={styles.secondaryDark}>Cost calculator</Link>
          </div>
        </div>
        <div className={styles.shortlistPreview}>
          <span className={styles.mono}>Shortlist preview</span>
          <h3>Your AMP shortlist</h3>
          {['Jomtien Bay Tower', 'Central Marina Suites', 'Na Jomtien Residence'].map((name, index) => (
            <div key={name} className={styles.matchRow}>
              <b>{index + 1}</b>
              <span>{name}</span>
            <em>To verify</em>
            </div>
          ))}
          <Link href={href('/finder')} className={styles.fullTeal}>Get your shortlist</Link>
        </div>
      </section>

      <TrustSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}

function AreaGrid() {
  return (
    <div className={styles.areaGrid}>
      {areas.map((area) => (
        <Link key={area.slug} href={href('/area-guide')} className={styles.areaCard}>
          <img src={area.image} alt={area.title} loading="eager" />
          <span>{area.label}</span>
          <small>{area.listings}</small>
          <h3>{area.title}</h3>
          <p>{area.summary}</p>
        </Link>
      ))}
    </div>
  );
}

function TrustSection() {
  return (
    <section className={styles.trustSection}>
      <SectionIntro
        kicker="Advisory flow"
        title="A human review path for every enquiry."
        body="The preview keeps the Figma card rhythm while avoiding unconfirmed public claims."
      />
      <div className={styles.trustGrid}>
        <div className={styles.testimonialGrid}>
          {processNotes.map((item) => (
            <blockquote key={item.title}>
              <p>{item.title}</p>
              <cite>{item.body}</cite>
              <small>{item.label}</small>
            </blockquote>
          ))}
        </div>
        <AdvisorPanel />
      </div>
    </section>
  );
}

function AdvisorPanel() {
  return (
    <aside className={styles.advisorPanel}>
      <span className={styles.mono}>Your advisors</span>
      <h3>Speak in your language.</h3>
      {advisors.map((advisor) => (
        <div key={advisor.name} className={styles.advisorRow}>
          <img src={advisor.image} alt={advisor.name} loading="eager" />
          <span><b>{advisor.name}</b><small>{advisor.role}</small></span>
          <em>Advisor</em>
        </div>
      ))}
      <Link href={href('/contact')} className={styles.fullTeal}>Book a free advisory call</Link>
    </aside>
  );
}

function ContactAdvisorCard() {
  return (
    <article className={styles.contactAdvisorCard}>
      <h3>Your advisors</h3>
      {advisors.map((advisor) => (
        <div key={advisor.name} className={styles.advisorRow}>
          <img src={advisor.image} alt={advisor.name} loading="eager" />
          <span><b>{advisor.name}</b><small>{advisor.role}</small></span>
          <em>Advisor</em>
        </div>
      ))}
    </article>
  );
}

function FaqSection() {
  return (
    <section className={styles.faqSection}>
      <SectionIntro
        kicker="Common questions"
        title="The questions every foreign buyer asks first."
        body=""
      />
      <div className={styles.faqList}>
        {faqs.map((item) => (
          <details key={item}>
            <summary>{item}<span>+</span></summary>
            <p>Our advisor team gives the current answer based on nationality, ownership route, and selected project before you make a decision.</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className={styles.finalCta}>
      <div>
        <span className={styles.mono}>Ready when you are</span>
        <h3>Book a 20-minute call. No pressure. No call-bots.</h3>
      </div>
      <div className={styles.finalActions}>
        <Link href={href('/contact')}>💬 WhatsApp</Link>
        <Link href={href('/contact')}>LINE</Link>
        <Link href={href('/contact')} className={styles.coralPill}>Book a viewing <ArrowIcon /></Link>
      </div>
    </section>
  );
}

function ListingPage() {
  return (
    <section className={styles.listingPage}>
      <div className={styles.listingHeader}>
        <div>
          <span className={styles.mono}>Projects · New &amp; off-plan</span>
          <h1>Projects across <em>Pattaya</em></h1>
          <button type="button" className={styles.filterToggle}>Filters</button>
        </div>
        <div className={styles.sortTabs}>
          <span className={styles.viewSwitch} aria-label="View mode">
            <button type="button" className={styles.viewActive} aria-label="Grid view"><GridIcon /></button>
            <button type="button" aria-label="List view"><ListIcon /></button>
          </span>
          <select className={styles.sortSelect} defaultValue="Most relevant" aria-label="Sort projects">
            <option>Most relevant</option>
            <option>Price: low to high</option>
            <option>Price: high to low</option>
            <option>Most complete</option>
          </select>
        </div>
      </div>
      <div className={styles.catalogue}>
        <aside className={styles.filters}>
          <PriceRange />
          <FilterRows title="Area" rows={[['Wongamat', ''], ['Pratumnak Hill', ''], ['Central Pattaya', ''], ['Jomtien', ''], ['Na Jomtien', ''], ['Bang Saray', '']]} />
          <FilterRows title="Status" rows={[['Availability to verify', ''], ['Project details subject to confirmation', ''], ['Price on request', '']]} />
          <FilterRows title="Distance to beach" rows={[['Any distance', ''], ['Beachfront', ''], ['Under 100m', ''], ['Under 500m', '']]} radio />
          <button type="button" className={styles.resetButton}>Reset all filters</button>
        </aside>
        <div className={styles.listingGrid}>
          {projects.map((project) => <ProjectCard key={project.slug} project={project} compact />)}
        </div>
      </div>
    </section>
  );
}

function PriceRange() {
  return (
    <div className={styles.filterGroup}>
      <button type="button">Price<span aria-hidden="true">⌃</span></button>
      <div className={styles.priceRange}>
        <span>Price on request</span>
        <span>Availability to verify</span>
      </div>
      <div className={styles.rangeTrack}><span /></div>
    </div>
  );
}

function FilterRows({ title, rows, radio = false }: { title: string; rows: string[][]; radio?: boolean }) {
  return (
    <div className={styles.filterGroup}>
      <button type="button">{title}<span aria-hidden="true">⌃</span></button>
      {rows.map(([label, count], index) => (
        <label key={label} className={styles.filterRow}>
          <input type={radio ? 'radio' : 'checkbox'} checked={radio && index === 0} readOnly />
          <span>{label}</span>
          {count ? <em>{count}</em> : null}
        </label>
      ))}
    </div>
  );
}

function AreaGuidePage() {
  const selected = areas[0];
  const project = projects[0];

  return (
    <>
      <section className={styles.plainHero}>
        <span className={styles.mono}>Area guide · Pattaya</span>
        <h1>Six zones. <em>Six investment theses.</em></h1>
        <p>Each area has a distinct price point, tenant profile, and capital growth potential. Choose your zone before you choose your unit.</p>
      </section>
      <section className={styles.areaGuideLayout}>
        <aside className={styles.areaMenu}>
          {areas.map((area, index) => (
            <button key={area.slug} type="button" className={index === 0 ? styles.areaMenuActive : undefined}>
              <img src={area.image} alt={area.title} loading="eager" />
              <span><b>{area.title}</b><small>{area.listings}</small></span>
            </button>
          ))}
        </aside>
        <article className={styles.areaDetail}>
          <div className={styles.areaHeroImage}>
            <img src={selected.image} alt={selected.title} loading="eager" />
            <span>{selected.label}</span>
            <h2>{selected.title}</h2>
            <p>{selected.summary}</p>
          </div>
          <div className={styles.areaCopy}>
            <h3>{selected.thesis}</h3>
            <p>Wongamat is shown as the selected area pattern for visual review. Area facts, availability, and project details must be confirmed before production use.</p>
            <div className={styles.metricGrid}>
              <span><b>Price</b>Price on request</span>
              <span><b>Availability</b>Availability to verify</span>
              <span><b>Details</b>Project details subject to confirmation</span>
            </div>
            <h4 className={styles.projectListTitle}>Projects in Wongamat</h4>
            <div className={styles.projectMini}>
              <img src={project.image} alt={project.name} loading="eager" />
              <span><b>{project.name}</b><small>Availability to verify</small></span>
              <em>{project.from}<small>price</small></em>
            </div>
            <div className={styles.areaCta}>
              <span className={styles.areaCtaLabel}><MapPinIcon /> Wongamat</span>
              <h4>Get projects in this area</h4>
              <p>Request a visual brief with price, availability, and project details marked for confirmation.</p>
              <Link href={href('/contact')} className={styles.fullCoral}>Request Wongamat brief</Link>
              <Link href={href('/listing')} className={styles.outlineAction}>Browse all listings</Link>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}

function CalculatorPage() {
  const breakdown = [
    ['Price', 'Price on request'],
    ['Availability', 'Availability to verify'],
    ['Project details', 'Project details subject to confirmation'],
    ['Advisor review', 'Required before production use'],
  ];

  return (
    <>
      <section className={`${styles.plainHero} ${styles.toolHero}`}>
        <span className={styles.mono}>Investor toolkit</span>
        <h1><em>Total-cost &amp;</em> availability planner</h1>
        <p>Review the calculator layout and interaction states without publishing unconfirmed commercial claims.</p>
      </section>
      <section className={styles.calculatorGrid}>
        <div className={styles.calcPanel}>
          <CalcGroup title="Property" rows={[['Purchase price', 'Price on request']]} />
          <CalcGroup title="Availability" rows={[['Current availability', 'Availability to verify'], ['Project details', 'Subject to confirmation']]} />
          <CalcGroup title="Review" rows={[['Owner review', 'Required'], ['Advisor follow-up', 'Requested']]} />
          <p className={styles.calcNote}><InfoIcon /> <span>Values are intentionally gated until owner-approved pricing and availability are provided.</span></p>
        </div>
        <div className={styles.calcResults}>
          <div className={styles.resultCards}>
            <span><b>Price</b><strong>On request</strong><small>Price on request</small></span>
            <span><b>Availability</b><strong>To verify</strong><small>Availability to verify</small></span>
            <span><b>Details</b><strong>Confirm</strong><small>Project details subject to confirmation</small></span>
          </div>
          <div className={styles.breakdown}>
            <h3>Confirmation checklist</h3>
            {breakdown.map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}
          </div>
          <div className={styles.chartPanel}>
            <h3>Review sequence</h3>
            <p>Each step remains a visual state until commercial data is confirmed.</p>
            <div className={styles.chartBars}>{['Y1', 'Y2', 'Y3', 'Y4', 'Y5'].map((year, index) => <span key={year} style={{ height: `${42 + index * 18}%` }}>{year}</span>)}</div>
            <strong>Owner review required</strong>
          </div>
        <div className={styles.reportCta}>
            <span>Need owner-approved numbers?</span>
            <p>Request confirmed price, availability, and project details before production use.</p>
          <Link href={href('/contact')} className={styles.coralPill}>Request details</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function CalcGroup({ title, rows }: { title: string; rows: string[][] }) {
  const sliderWidths: Record<string, string> = {
    'Purchase price': '18%',
    'Down payment': '30%',
    'Mortgage term': '41%',
    'Interest rate': '54%',
    'Avg. daily rate': '32%',
    'Occupancy': '72%',
    'Management fee': '50%',
  };

  return (
    <div className={styles.calcGroup}>
      <h3>{title}</h3>
      {rows.map(([label, value]) => (
        <div key={label} className={styles.sliderRow}>
          <span><em>{label}</em><strong>{value}</strong></span>
          <b className={styles.sliderTrack}><i style={{ width: sliderWidths[label] ?? '45%' }} /></b>
        </div>
      ))}
    </div>
  );
}

function FinderPage() {
  return (
    <section className={styles.finderPage}>
      <div className={styles.finderTop}>
        <Logo />
        <span>Step 1 of 7 <em>14%</em></span>
        <div><b style={{ width: '14%' }} /></div>
        <Link href={href()}>Exit</Link>
      </div>
      <div className={styles.finderGridPage}>
        <div className={styles.questionPanel}>
          <span className={styles.mono}>Smart Finder · 90-second brief</span>
          <h1>What&apos;s your primary goal?</h1>
          <p>This shapes everything — from zone to unit size.</p>
          {['Review price and availability', 'Compare project details', 'Plan a viewing request'].map((item) => (
            <button key={item} type="button"><span aria-hidden="true" />{item}</button>
          ))}
          <button type="button" className={`${styles.fullCoral} ${styles.finderContinue}`}>Continue <ArrowIcon /></button>
        </div>
        <div className={styles.liveMatches}>
          <span className={styles.mono}>Live matches · updates as you answer</span>
          <h2>Your shortlist is shaping up</h2>
          <p>Availability to verify</p>
          {[projects[0], projects[1], projects[3], projects[4]].map((project) => (
            <div key={project.slug} className={styles.matchCard}>
              <img src={project.image} alt={project.name} loading="eager" />
              <span><b>{project.name}</b><small>{project.area} · {project.from}</small></span>
              <em>Review</em>
            </div>
          ))}
          <div className={styles.matchHint}>
            <small>6 more questions</small>
            <p>Answer the remaining questions to prepare a visual brief for owner review.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparePage() {
  const selected = projects.slice(0, 3);
  const rows = [
    ['Starting price', ...selected.map((item) => item.from)],
    ['Availability', ...selected.map((item) => item.availability)],
    ['Project details', ...selected.map((item) => item.quota)],
    ['Bedrooms', 'Project details subject to confirmation', 'Project details subject to confirmation', 'Project details subject to confirmation'],
    ['Floors', 'Project details subject to confirmation', 'Project details subject to confirmation', 'Project details subject to confirmation'],
    ['Completion', 'Project details subject to confirmation', 'Project details subject to confirmation', 'Project details subject to confirmation'],
    ['Status', ...selected.map((item) => item.badge)],
    ['Location', ...selected.map((item) => item.area)],
    ['Area', ...selected.map((item) => item.area)],
    ['Developer', ...selected.map((item) => item.developer)],
  ];

  return (
    <>
      <section className={`${styles.plainHero} ${styles.compareHero}`}>
        <span className={styles.mono}>Compare · Side-by-side</span>
        <div>
          <h1>Compare 3 <em>project-review</em> cards</h1>
          <div className={styles.compareActions}>
            <button type="button">Clear all</button>
            <button type="button"><DownloadIcon /> Export brief</button>
            <Link href={href('/contact')} className={styles.coralPill}>Get advisor brief <ArrowIcon /></Link>
          </div>
        </div>
      </section>
      <section className={styles.compareTable}>
        <div className={styles.compareCards}>
          <div className={styles.compareCorner} aria-hidden="true" />
          {selected.map((project) => (
            <article key={project.slug}>
              <button type="button" aria-label={`Remove ${project.name}`}>×</button>
              <img src={project.image} alt={project.name} loading="eager" />
              <h3>{project.name}</h3>
              <p>{project.area}</p>
              <Link href={href(`/project/${project.slug}`)}>View <ArrowIcon /></Link>
            </article>
          ))}
        </div>
        {rows.map(([label, ...values]) => (
          <div key={label} className={styles.compareRow}>
            <b>{label}</b>
            {values.map((value, index) => <span key={`${label}-${index}`}>{value}</span>)}
          </div>
        ))}
        <Link href={href('/contact')} className={styles.fullCoral}>Ask an advisor to compare these</Link>
      </section>
    </>
  );
}

function ContactPage() {
  return (
    <>
      <section className={styles.contactHero}>
        <img src={contactHeroImage} alt="Pattaya advisory office" loading="eager" />
        <div>
          <span className={styles.mono}>Contact · AMP Pattaya</span>
          <h1>Talk to a human. <em>No scripts. No bots.</em></h1>
          <p>Choose a contact channel and request confirmed price, availability, and project details before production use.</p>
        </div>
      </section>
      <section className={styles.contactGrid}>
        <div className={styles.messageForm}>
          <h2>Send us a message</h2>
          <p>Advisor response timing and office details are subject to confirmation.</p>
          <input placeholder="Your name *" />
          <div>
            <input placeholder="Email" />
            <input placeholder="Phone (with code)" />
          </div>
          <textarea rows={5} placeholder="Tell us what you're looking for — budget, bedrooms, timeline, questions…" />
          <span>Preferred contact channel</span>
          <div className={styles.channelPills}>
            <button type="button" className={styles.channelActive}>💬 WhatsApp</button>
            <button type="button">LINE</button>
            <button type="button">📧 Email</button>
            <button type="button">📞 Call me</button>
          </div>
          <button type="button" className={styles.fullCoral}>Send message <ArrowIcon /></button>
        </div>
        <div className={styles.contactSide}>
          <article className={styles.infoCard}>
            <h3>Office &amp; hours</h3>
            <p>⌖ Office details subject to confirmation</p>
            <p>◷ Viewing hours to verify</p>
            <p>☎ Contact details subject to confirmation</p>
            <div>
              <Link href={href('/contact')}>💬 WhatsApp</Link>
              <Link href={href('/contact')}>LINE</Link>
            </div>
          </article>
          <ContactAdvisorCard />
        </div>
      </section>
    </>
  );
}

function DetailPage({ kind }: { kind: 'project' | 'property' }) {
  const project = kind === 'property' ? projects[1] : projects[0];
  const gallery = [project, projects[1], projects[2], projects[3], projects[4]];

  return (
    <>
      <section className={styles.detailGalleryPage}>
        <Link href={href('/listing')} className={styles.backLink}>← All projects</Link>

        <div className={styles.detailMainGallery}>
          <img src={project.image} alt={project.name} loading="eager" />
          <button type="button" className={styles.galleryArrowLeft} aria-label="Previous project image">‹</button>
          <button type="button" className={styles.galleryArrowRight} aria-label="Next project image">›</button>
          <button type="button" className={styles.favoriteButton} aria-label={`Save ${project.name}`}><HeartIcon /></button>
          <div className={styles.galleryDots} aria-hidden="true">
            {gallery.map((item, index) => <span key={item.slug} className={index === 0 ? styles.galleryDotActive : undefined} />)}
          </div>
        </div>

        <div className={styles.detailThumbStrip}>
          {gallery.map((item, index) => (
            <button key={item.slug} type="button" className={index === 0 ? styles.thumbActive : undefined} aria-label={`View ${item.name}`}>
              <img src={item.image} alt="" loading="eager" />
            </button>
          ))}
        </div>

        <div className={styles.detailTitleRow}>
          <div className={styles.detailTitleCopy}>
            <p className={styles.detailMeta}>
              <span>{project.badge}</span>
              <em><MapPinIcon /> {project.area}</em>
            </p>
            <h1>{kind === 'property' ? 'Sea-view residence' : project.name}</h1>
          </div>
          <div className={styles.detailPriceBlock}>
            <strong>{project.from}</strong>
            <span>Starting from</span>
          </div>
          <LeadCard />
        </div>

        <div className={styles.detailStats}>
          <span><b>Price</b>{project.from}</span>
          <span><b>Availability</b>{project.availability}</span>
          <span><b>Details</b>{project.quota}</span>
        </div>
      </section>

      <section className={styles.detailBody}>
        <div className={styles.detailColumns}>
          <article>
            <span className={styles.mono}>Advisor brief</span>
            <h2>{kind === 'property' ? 'A residence page structure for owner review.' : 'Gallery-led detail page with advisor-first conversion.'}</h2>
            <p>{project.tone}</p>
            <p>Price, availability, ownership details, developer information, completion timing, floor plans, and legal notes must be confirmed before this pattern replaces any production route.</p>
          </article>
          <AdvisorPanel />
        </div>
      </section>
    </>
  );
}

function V3RouteContent({ route }: { route: V3PreviewRoute }) {
  if (route === 'listing') return <ListingPage />;
  if (route === 'area-guide') return <AreaGuidePage />;
  if (route === 'calculator') return <CalculatorPage />;
  if (route === 'finder') return <FinderPage />;
  if (route === 'compare') return <ComparePage />;
  if (route === 'contact') return <ContactPage />;
  if (route === 'project-detail') return <DetailPage kind="project" />;
  if (route === 'property-detail') return <DetailPage kind="property" />;
  return <HomePage />;
}

export function V3PreviewPage({ route }: { route: V3PreviewRoute }) {
  const finderOnly = route === 'finder';

  return (
    <main className={`${styles.page} amp-v3-preview-page`} data-testid="amp-public-v3-preview">
      {finderOnly ? null : <ShellHeader route={route} />}
      <V3RouteContent route={route} />
      {finderOnly ? null : <ShellFooter />}
    </main>
  );
}
