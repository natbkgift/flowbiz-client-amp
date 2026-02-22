import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { IconCheck, IconShield, IconTrendingUp, IconUsers } from '@/components/icons/SvgIcons';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'about', dict.about.heroTitle, dict.about.metaDescription, dict.brand.name);
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: locale === 'th' ? 'เกี่ยวกับเรา' : 'About', href: `/${locale}/about` },
  ];

  const breadcrumbJsonLd = breadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
  );

  const icons = [<IconShield key="shield" />, <IconUsers key="users" />, <IconTrendingUp key="trend" />];

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumbs items={breadcrumbItems} />

      {/* Hero */}
      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{dict.about.heroTitle}</h1>
          <p className="subhead">{dict.about.heroSubtitle}</p>
        </Container>
      </section>

      {/* Mission */}
      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.about.missionTitle}</h2>
            <p className="section-subtitle">{dict.about.missionSubtitle}</p>
          </div>
          <div className="grid grid-3">
            {dict.about.missionCards.map((card, i) => (
              <div key={card.title} className="card reveal">
                <div className="premium-highlight__icon mb-4">
                  {icons[i]}
                </div>
                <h3 className="card-title">{card.title}</h3>
                <p className="card-subtitle">{card.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Who We Are */}
      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.about.whoTitle}</h2>
          </div>
          <div className="max-w-prose mx-auto">
            {dict.about.whoParagraphs.map((text, i) => (
              <p
                key={i}
                className={`leading-relaxed text-[var(--color-text-secondary)]${i < dict.about.whoParagraphs.length - 1 ? ' mb-4' : ''}`}
              >
                {text}
              </p>
            ))}
          </div>
        </Container>
      </section>

      {/* Value Proposition */}
      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.about.whyTitle}</h2>
          </div>
          <div className="grid grid-2">
            {dict.about.whyBullets.map((bullet) => (
              <div key={bullet} className="feature-item px-5 py-4">
                <span className="text-[var(--color-primary)]">
                  <IconCheck size="sm" />
                </span>
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Our Team */}
      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">Our Team</h2>
            <p className="section-subtitle">Meet the people behind FlowBiz</p>
          </div>
          <div className="grid grid-3">
            {[
              { name: 'Sarah Chen', role: 'CEO & Founder', bio: 'Over 15 years of experience in Thai real estate. Previously led property investments across Southeast Asia.' },
              { name: 'Somchai Pattanakul', role: 'Head of Sales', bio: 'Licensed real estate agent with deep knowledge of Pattaya and the Eastern Seaboard market.' },
              { name: 'James Wilson', role: 'Senior Property Advisor', bio: 'Specializes in helping foreign investors navigate the Thai property buying process.' },
              { name: 'Nattaya Srisuwan', role: 'Marketing Director', bio: 'Brings 10 years of digital marketing expertise to help sellers reach the right buyers.' },
              { name: 'David Park', role: 'Investment Analyst', bio: 'Provides data-driven market analysis and rental yield projections for investors.' },
              { name: 'Ploy Charoensuk', role: 'Client Relations Manager', bio: 'Ensures every client receives personalized support throughout their property journey.' },
            ].map((member) => (
              <div key={member.name} className="card reveal text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary)] text-2xl font-bold text-white">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="card-title">{member.name}</h3>
                <p className="text-sm font-medium text-[var(--color-primary)]">{member.role}</p>
                <p className="card-subtitle mt-2">{member.bio}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Bottom CTA */}
      <section className="section section--cta">
        <Container>
          <div className="cta-panel reveal">
            <div>
              <h2 className="cta-title">{dict.about.ctaTitle}</h2>
              <p className="cta-body">{dict.about.ctaBody}</p>
            </div>
            <div className="cta-row">
              <TrackedLink
                className="btn btn-cta"
                href={withLocale(locale, '/contact')}
                eventType="cta_click"
                eventPayload={{ cta: 'speak_to_advisor', from: 'about' }}
              >
                {dict.cta.speakToAdvisor}
              </TrackedLink>
              <TrackedLink
                className="btn btn-secondary"
                href={withLocale(locale, '/invest')}
                eventType="cta_click"
                eventPayload={{ cta: 'explore_investment', from: 'about' }}
              >
                {dict.cta.exploreInvestment}
              </TrackedLink>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
