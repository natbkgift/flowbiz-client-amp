import Link from 'next/link';

import { LeadForm } from '@/components/forms/LeadForm';
import { SafeCoverImage } from '@/components/media/SafeCoverImage';
import { cx } from '@/components/public/cx';
import { Button } from '@/components/public-system/components/Button';
import { ProjectCard } from '@/components/public-system/components/ProjectCard';
import { PropertyCard } from '@/components/public-system/components/PropertyCard';

import type { V2PreviewAreaCard, V2PreviewData } from '../_lib/v2-preview-data';
import styles from '../v2-preview.module.css';

const BUYER_FIT_CARDS = [
  {
    title: 'Buy to live',
    body: 'Shortlist by daily rhythm first: beach access, commute, facilities, and how each building feels after a full week.',
    href: '/en/buy?source=v2_preview_fit_live',
  },
  {
    title: 'Buy to invest',
    body: 'Compare projects with advisor context before asking for price lists, quotas, rental assumptions, and handover details.',
    href: '/en/invest?source=v2_preview_fit_invest',
  },
  {
    title: 'Rent before deciding',
    body: 'Use rental options to test an area, building, or lifestyle fit before committing to a purchase route.',
    href: '/en/rent?source=v2_preview_fit_rent',
  },
];

const TRUST_STEPS = [
  {
    title: 'Start with the brief',
    body: 'Budget, nationality, lifestyle, timeline, and risk tolerance shape the first shortlist.',
  },
  {
    title: 'Check the moving parts',
    body: 'The advisor follow-up can confirm current price lists, foreign quota, availability, and transfer timing.',
  },
  {
    title: 'Choose a next step',
    body: 'Move from a broad search into project comparison, private viewing, or a tighter area-led shortlist.',
  },
];

type SectionHeadingProps = {
  label: string;
  title: string;
  body: string;
  align?: 'left' | 'center';
};

function SectionHeading({ label, title, body, align = 'left' }: SectionHeadingProps) {
  return (
    <div className={cx(styles.sectionHeading, align === 'center' && styles.sectionHeadingCenter)}>
      <p className={styles.sectionLabel}>{label}</p>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
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
          className={styles.coverImage}
          ssrStartWithPrimary
        />
      </span>
      <span className={styles.areaBody}>
        <span className={styles.areaName}>{area.name}</span>
        <span className={styles.areaDescription}>{area.description}</span>
        <span className={styles.textLink}>Open area guide</span>
      </span>
    </Link>
  );
}

export function V2PreviewPage({ data }: { data: V2PreviewData }) {
  const heroProjectNames = data.projectCards.slice(0, 3).map((project) => project.name);

  return (
    <main className={styles.page} data-testid="amp-public-v2-preview">
      <section className={styles.hero} aria-labelledby="v2-preview-hero-title">
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.brandLine}>AMP Pattaya</p>
            <h1 id="v2-preview-hero-title">Find the Pattaya property that fits the way you want to live</h1>
            <p className={styles.heroLead}>
              A calmer public search experience for buyers who need context before comparing projects, areas,
              price lists, and private viewing options.
            </p>
            <div className={styles.heroActions}>
              <Button href="#v2-preview-contact" variant="primary" className={styles.heroPrimaryCta}>
                Speak with a Pattaya property advisor
              </Button>
              <Button
                href="/en/projects?source=v2_preview_hero"
                variant="secondary"
                className={cx(styles.heroSecondaryCta, 'v2-preview-hero-secondary')}
              >
                Browse verified projects
              </Button>
            </div>
            <dl className={styles.heroProofGrid} aria-label="Preview search assurances">
              <div>
                <dt>Search style</dt>
                <dd>Advisor-led</dd>
              </div>
              <div>
                <dt>Route</dt>
                <dd>English public</dd>
              </div>
              <div>
                <dt>Next step</dt>
                <dd>Updated shortlist</dd>
              </div>
            </dl>
          </div>

          <div className={styles.heroMediaPanel} aria-label="Featured Pattaya property media">
            <div className={styles.heroImageFrame}>
              <SafeCoverImage
                src={data.heroImageSrc}
                alt={data.heroImageAlt}
                fallbackSrc="/images/hero-banner-20260318.webp"
                priority
                loading="eager"
                fetchPriority="high"
                sizes="(min-width: 1024px) 48vw, 100vw"
                className={styles.coverImage}
                ssrStartWithPrimary
              />
            </div>
            <div className={styles.heroAdvisorPanel}>
              <p>Shortlist starting points</p>
              <ul>
                {heroProjectNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.fitSection} aria-labelledby="v2-preview-fit-title">
        <SectionHeading
          label="Buyer fit"
          title="Start from intent, not a generic property grid"
          body="The preview keeps the first decision simple: choose the route that matches how the buyer wants to use the property."
        />
        <div className={styles.fitGrid}>
          {BUYER_FIT_CARDS.map((card) => (
            <article key={card.title} className={styles.fitCard}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              <Link href={card.href} className={styles.textLink}>
                Continue this route
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.projectSection} aria-labelledby="v2-preview-projects-title">
        <SectionHeading
          label="Projects"
          title="Project cards with safe public data"
          body="Cards use live project data when available, and fall back to existing AMP media with neutral availability labels."
        />
        <div className={styles.cardRail}>
          {data.projectCards.slice(0, 3).map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              ctaLabel="Request updated price list"
              imagePriority={index === 0}
              className={cx(styles.previewCard, 'v2-preview-card')}
            />
          ))}
        </div>
      </section>

      <section className={styles.propertySection} aria-labelledby="v2-preview-properties-title">
        <SectionHeading
          label="Residences"
          title="A tighter way to scan buy and rent options"
          body="The preview separates buyer intent from listing detail, while still sending visitors to the existing safe routes."
        />
        <div className={styles.cardRail}>
          {data.propertyCards.slice(0, 3).map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              ctaLabel={property.listingType === 'rent' ? 'View rental route' : 'View buying route'}
              className={cx(styles.previewCard, 'v2-preview-card')}
            />
          ))}
        </div>
      </section>

      <section className={styles.areaSection} aria-labelledby="v2-preview-areas-title">
        <SectionHeading
          label="Areas"
          title="Choose by beach, commute, and daily rhythm"
          body="Area cards keep the lifestyle question close to the property search without making unverified performance claims."
          align="center"
        />
        <div className={styles.areaGrid}>
          {data.areaCards.map((area) => (
            <AreaCard key={area.id} area={area} />
          ))}
        </div>
      </section>

      <section className={styles.trustSection} aria-labelledby="v2-preview-trust-title">
        <div className={styles.trustIntro}>
          <SectionHeading
            label="Advisor workflow"
            title="The shortlist is only useful when the next question is clear"
            body="The v2 foundation is designed around a human follow-up path, so buyers know what needs confirmation before a viewing or reservation conversation."
          />
        </div>
        <ol className={styles.trustList}>
          {TRUST_STEPS.map((step, index) => (
            <li key={step.title} className={styles.trustItem}>
              <span className={styles.trustIndex}>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="v2-preview-contact" className={styles.contactSection} aria-labelledby="v2-preview-contact-title">
        <div className={styles.contactCopy}>
          <p className={styles.sectionLabel}>Lead handoff</p>
          <h2 id="v2-preview-contact-title">Speak with a Pattaya property advisor</h2>
          <p>
            Share the brief once. The existing inquiry workflow can carry the route, budget, area, and timeline
            context into advisor follow-up.
          </p>
          <ul className={styles.contactChecks}>
            <li>Request updated price list</li>
            <li>Confirm availability before viewing</li>
            <li>Compare areas before committing</li>
          </ul>
        </div>
        <div className={styles.formPanel}>
          <LeadForm
            locale="en"
            formId="v2-preview-advisor"
            heading="Speak with a Pattaya property advisor"
            description="Tell us what you are comparing and the sales team will respond with the clearest next step."
            submitLabel="Send brief to advisor"
            defaultMessage="I am reviewing the AMP Public v2 preview and would like help comparing Pattaya projects, areas, and current availability."
            defaultTimeframe="flexible"
            inquiryIntent="project_consultation"
            inquirySource="v2_preview"
            inquiryTags={['v2_preview', 'english_public', 'advisor_led']}
            contextSummary={[
              'Source route: /en/v2-preview',
              'Intent: advisor-led Pattaya property shortlist',
              'Fallback labels are used when price or availability is not confirmed',
            ]}
            hideSupport
          />
        </div>
      </section>
    </main>
  );
}
