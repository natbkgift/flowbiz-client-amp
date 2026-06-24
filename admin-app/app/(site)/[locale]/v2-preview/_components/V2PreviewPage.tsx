import Link from 'next/link';

import { SafeCoverImage } from '@/components/media/SafeCoverImage';
import { cx } from '@/components/public/cx';

import type { V2PreviewAreaCard, V2PreviewData } from '../_lib/v2-preview-data';
import styles from '../v2-preview.module.css';

type ProjectCardData = V2PreviewData['projectCards'][number];
type PropertyCardData = V2PreviewData['propertyCards'][number];

const NAV_ITEMS = [
  { label: 'Home', href: '/en?source=v2_preview_nav' },
  { label: 'Buy', href: '/en/buy?source=v2_preview_nav' },
  { label: 'New Projects', href: '/en/projects?source=v2_preview_nav' },
  { label: 'Areas', href: '/en/area-guide?source=v2_preview_nav' },
  { label: 'Invest', href: '/en/invest?source=v2_preview_nav' },
  { label: 'Contact', href: '/en/contact?source=v2_preview_nav' },
];

const HERO_STATS = [
  { value: 'Curated', label: 'Pattaya projects' },
  { value: 'Freehold', label: 'Foreign buyer context' },
  { value: 'Verified', label: 'Advisor fact check' },
  { value: 'Private', label: 'Shortlist handoff' },
];

const SEARCH_TABS = [
  { label: 'Buy', href: '/en/buy?source=v2_preview_search_tab' },
  { label: 'Rent', href: '/en/rent?source=v2_preview_search_tab' },
  { label: 'Off-plan', href: '/en/projects?source=v2_preview_search_tab' },
  { label: 'Villas', href: '/en/buy?property_type=villa&source=v2_preview_search_tab' },
];

const SEARCH_FIELDS = [
  { label: 'Location', value: 'Pattaya / Jomtien' },
  { label: 'Type', value: 'Condo or villa' },
  { label: 'Bedrooms', value: 'Buyer-fit brief' },
  { label: 'Budget', value: 'Price on request' },
];

const BUYER_FIT_CARDS = [
  {
    title: 'Foreign buyer route',
    body: 'Clarify ownership structure, transfer cost questions, and advisor checks before shortlisting projects.',
    href: '/en/buy?source=v2_preview_fit_foreign',
  },
  {
    title: 'Investor comparison',
    body: 'Compare location, building profile, holding plan, and rental assumptions without treating estimates as facts.',
    href: '/en/invest?source=v2_preview_fit_invest',
  },
  {
    title: 'Lifestyle first',
    body: 'Choose by daily rhythm: beach access, commute, building feel, facilities, and viewing practicality.',
    href: '/en/area-guide?source=v2_preview_fit_lifestyle',
  },
];

const TRUST_STEPS = [
  {
    title: 'Brief',
    body: 'Budget, nationality, lifestyle, timeline, and risk tolerance shape the first shortlist.',
  },
  {
    title: 'Verify',
    body: 'Ask the advisor to confirm price list, foreign quota, availability, transfer timing, and viewing access.',
  },
  {
    title: 'Visit',
    body: 'Move into private viewing or a tighter project comparison only when the next question is clear.',
  },
];

const FOOTER_GROUPS = [
  {
    title: 'Explore',
    links: [
      { label: 'Buy property', href: '/en/buy?source=v2_preview_footer' },
      { label: 'Rent property', href: '/en/rent?source=v2_preview_footer' },
      { label: 'New projects', href: '/en/projects?source=v2_preview_footer' },
    ],
  },
  {
    title: 'Advisor routes',
    links: [
      { label: 'Smart Finder', href: '/en/smart-finder?source=v2_preview_footer' },
      { label: 'Area guide', href: '/en/area-guide?source=v2_preview_footer' },
      { label: 'Contact', href: '/en/contact?source=v2_preview_footer' },
    ],
  },
];

type SectionHeadingProps = {
  label: string;
  title: string;
  body: string;
  align?: 'left' | 'center';
};

function V2Logo() {
  return (
    <span className={styles.logo} aria-label="AMP Pattaya">
      <span className={styles.logoMark}>A</span>
      <span className={styles.logoCopy}>
        <span>
          AMP <em>Pattaya</em>
        </span>
        <small>Pattaya Property Advisory</small>
      </span>
    </span>
  );
}

function V2Header() {
  return (
    <header className={styles.v2Header}>
      <Link href="/en?source=v2_preview_logo" className={styles.logoLink}>
        <V2Logo />
      </Link>

      <nav className={styles.v2Nav} aria-label="AMP public v2 preview navigation">
        {NAV_ITEMS.map((item) => (
          <Link key={item.label} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className={styles.headerActions}>
        <span className={styles.headerPill}>THB</span>
        <span className={styles.headerPill}>EN</span>
        <Link href="/en/contact?source=v2_preview_header_cta" className={styles.headerCta}>
          Book a viewing
        </Link>
      </div>

      <details className={styles.mobileMenu}>
        <summary aria-label="Open preview navigation">
          <span />
          <span />
          <span />
        </summary>
        <div className={styles.mobileMenuPanel}>
          {NAV_ITEMS.map((item) => (
            <Link key={item.label} href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/en/contact?source=v2_preview_mobile_cta" className={styles.mobileMenuCta}>
            Book a viewing
          </Link>
        </div>
      </details>
    </header>
  );
}

function SectionHeading({ label, title, body, align = 'left' }: SectionHeadingProps) {
  return (
    <div className={cx(styles.sectionHeading, align === 'center' && styles.sectionHeadingCenter)}>
      <p>{label}</p>
      <h2>{title}</h2>
      <span>{body}</span>
    </div>
  );
}

function HeroLeadCard() {
  return (
    <aside className={styles.heroLeadCard} aria-label="Advisor lead handoff preview">
      <div className={styles.heroLeadCardHeader}>
        <p>Get price & floor plan</p>
        <span>Advisor reply</span>
      </div>
      <h2>Speak to an advisor</h2>
      <div className={styles.heroVisualForm} aria-hidden="true">
        <span>Your name *</span>
        <span>Phone (with code)</span>
        <span>Email</span>
        <span>5-10M</span>
        <span>1-2 BR</span>
        <span className={styles.visualInputWide}>Within 3 months</span>
      </div>
      <p className={styles.heroConsentLine}>Contact me on WhatsApp if preferred</p>
      <Link href="/en/contact?source=v2_preview_hero_form" className={styles.heroFormButton}>
        Send brief to advisor <span aria-hidden="true">&rarr;</span>
      </Link>
      <p className={styles.heroFinePrint}>Advisor follow-up only.</p>
    </aside>
  );
}

function HeroSearchPanel() {
  return (
    <nav className={styles.heroSearchPanel} aria-label="Preview property search shortcuts">
      <div className={styles.searchTabs}>
        {SEARCH_TABS.map((tab, index) => (
          <Link key={tab.label} href={tab.href} className={cx(index === 0 && styles.searchTabActive)}>
            {tab.label}
          </Link>
        ))}
      </div>
      <div className={styles.searchFields}>
        {SEARCH_FIELDS.map((field) => (
          <Link key={field.label} href="/en/smart-finder?source=v2_preview_search_field">
            <span>{field.label}</span>
            <strong>{field.value}</strong>
          </Link>
        ))}
        <Link href="/en/smart-finder?source=v2_preview_search" className={styles.searchButton}>
          Find buyer-fit projects
        </Link>
      </div>
    </nav>
  );
}

function V2ProjectCard({ project, priority = false }: { project: ProjectCardData; priority?: boolean }) {
  return (
    <Link href={project.href} className={styles.projectCard}>
      <span className={styles.cardImage}>
        <SafeCoverImage
          src={project.imageSrc}
          alt={project.imageAlt}
          fallbackSrc="/images/project-overview.png"
          sizes="(min-width: 1024px) 31vw, 100vw"
          priority={priority}
          loading="eager"
          fetchPriority={priority ? 'high' : undefined}
          className={styles.coverImage}
          ssrStartWithPrimary
        />
      </span>
      <span className={styles.cardBody}>
        <span className={styles.cardKicker}>{project.location || 'Pattaya'}</span>
        <h3>{project.name}</h3>
        <span>{project.startingPriceLabel || 'Price on request'}</span>
      </span>
      <span className={styles.cardFooter}>
        <span>{project.statusLabel || 'Availability to be confirmed'}</span>
        <span>Request updated price list</span>
      </span>
    </Link>
  );
}

function V2PropertyCard({ property }: { property: PropertyCardData }) {
  return (
    <Link href={property.href} className={styles.propertyCard}>
      <span className={styles.propertyImage}>
        <SafeCoverImage
          src={property.imageSrc}
          alt={property.imageAlt}
          fallbackSrc="/images/property-exterior.png"
          sizes="(min-width: 1024px) 24vw, 100vw"
          loading="eager"
          className={styles.coverImage}
          ssrStartWithPrimary
        />
      </span>
      <span className={styles.propertyCopy}>
        <span>{property.listingType === 'rent' ? 'Rental route' : 'Buyer route'}</span>
        <h3>{property.title}</h3>
        <span>{property.location || 'Pattaya'} · {property.propertyType || 'Residence'}</span>
        <em>{property.priceLabel || 'Price on request'}</em>
      </span>
    </Link>
  );
}

function AreaCard({ area }: { area: V2PreviewAreaCard }) {
  return (
    <Link href={area.href} className={styles.areaCard}>
      <span className={styles.areaImage}>
        <SafeCoverImage
          src={area.imageSrc}
          alt={area.imageAlt}
          fallbackSrc="/images/area-guide-pattaya.png"
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
          loading="eager"
          className={styles.coverImage}
          ssrStartWithPrimary
        />
      </span>
      <span className={styles.areaBody}>
        <span>{area.name}</span>
        <small>{area.description}</small>
      </span>
    </Link>
  );
}

function AdvisorCta() {
  return (
    <section id="v2-preview-contact" className={styles.advisorSection} aria-labelledby="v2-preview-contact-title">
      <div>
        <p>Private recommendation</p>
        <h2 id="v2-preview-contact-title">Request a buyer-fit Pattaya shortlist</h2>
        <span>
          Share the brief once. The advisor follow-up can confirm price lists, availability, quota, and viewing
          options before you commit to a project route.
        </span>
      </div>
      <div className={styles.advisorPanel}>
        <span>Recommended next step</span>
        <strong>Speak with a Pattaya property advisor</strong>
        <Link href="/en/contact?source=v2_preview_advisor_cta">
          Request private recommendation <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </section>
  );
}

function V2Footer() {
  return (
    <footer className={styles.v2Footer}>
      <div className={styles.footerBrand}>
        <V2Logo />
        <p>
          AMP Pattaya helps buyers compare homes and projects with advisor verification before price lists, quota
          checks, and viewing plans.
        </p>
      </div>
      <div className={styles.footerLinks}>
        {FOOTER_GROUPS.map((group) => (
          <div key={group.title}>
            <span>{group.title}</span>
            {group.links.map((link) => (
              <Link key={link.label} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}

export function V2PreviewPage({ data }: { data: V2PreviewData }) {
  return (
    <main className={styles.page} data-testid="amp-public-v2-preview">
      <V2Header />

      <section className={styles.hero} aria-labelledby="v2-preview-hero-title">
        <SafeCoverImage
          src={data.heroImageSrc}
          alt={data.heroImageAlt}
          fallbackSrc="/images/hero-banner-20260318.webp"
          priority
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className={cx(styles.coverImage, styles.heroBackgroundImage)}
          ssrStartWithPrimary
        />
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.heroStatusPill}>
              <span aria-hidden="true" />
              Advisor-led search
            </p>
            <h1 id="v2-preview-hero-title">
              Pattaya, priced for <em>investors who measure</em> in years, not weekends.
            </h1>
            <p className={styles.heroLead}>
              A Pattaya property advisory helping foreign buyers compare projects, resale homes, and villa options
              before requesting current price lists, quota checks, and viewing options.
            </p>
            <div className={styles.heroActions}>
              <Link href="/en/projects?source=v2_preview_hero" className={styles.primaryButton}>
                Explore property routes <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link href="/en/smart-finder?source=v2_preview_hero" className={styles.secondaryButton}>
                90-second Smart Finder
              </Link>
            </div>
            <dl className={styles.heroProofGrid} aria-label="Preview search assurances">
              {HERO_STATS.map((stat) => (
                <div key={stat.value}>
                  <dt>{stat.value}</dt>
                  <dd>{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <HeroLeadCard />
        </div>
        <HeroSearchPanel />
      </section>

      <section className={styles.fitSection} aria-labelledby="v2-preview-fit-title">
        <SectionHeading
          label="Buyer fit"
          title="Start with the buyer route, then verify the facts"
          body="Shortlist by ownership context, location fit, and advisor checks without treating price, quota, yield, or availability as confirmed until verified."
        />
        <div className={styles.fitGrid}>
          {BUYER_FIT_CARDS.map((card) => (
            <Link key={card.title} href={card.href} className={styles.fitCard}>
              <span>{card.title}</span>
              <p>{card.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.projectSection} aria-labelledby="v2-preview-projects-title">
        <SectionHeading
          label="Featured projects"
          title="Project cards with advisor-safe labels"
          body="Real project names and media are used when available. Missing price or availability stays neutral."
        />
        <div className={styles.projectGrid}>
          {data.projectCards.slice(0, 3).map((project, index) => (
            <V2ProjectCard key={project.id} project={project} priority={index === 0} />
          ))}
        </div>
      </section>

      <section className={styles.propertySection} aria-labelledby="v2-preview-properties-title">
        <div className={styles.propertyIntro}>
          <SectionHeading
            label="Ready routes"
            title="Scan buyer and rental options without forcing a decision"
            body="Cards link to existing public routes and keep commercial details neutral until an advisor confirms the current facts."
          />
        </div>
        <div className={styles.propertyRail}>
          {data.propertyCards.slice(0, 4).map((property) => (
            <V2PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      <section className={styles.areaSection} aria-labelledby="v2-preview-areas-title">
        <SectionHeading
          label="Areas"
          title="Choose by beach, commute, and lifestyle rhythm"
          body="Area cards stay lifestyle-led and avoid performance claims until advisor verification is available."
          align="center"
        />
        <div className={styles.areaGrid}>
          {data.areaCards.map((area) => (
            <AreaCard key={area.id} area={area} />
          ))}
        </div>
      </section>

      <section className={styles.trustSection} aria-labelledby="v2-preview-trust-title">
        <SectionHeading
          label="Advisor workflow"
          title="A clearer next question before any viewing"
          body="The preview favors buyer confidence, transparent verification, and a calmer handoff to the sales team."
        />
        <ol className={styles.trustList}>
          {TRUST_STEPS.map((step, index) => (
            <li key={step.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <AdvisorCta />
      <V2Footer />
    </main>
  );
}
