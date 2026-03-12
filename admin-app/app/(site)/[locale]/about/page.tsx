import { Container } from '@/components/layout/Container';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { IconCheck, IconShield, IconTrendingUp, IconUsers } from '@/components/icons/SvgIcons';
import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';

export const revalidate = 300;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'about', dict.about.heroTitle, dict.about.metaDescription, dict.brand.name);
}

export default async function AboutPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const advisoryLabels = getAdvisoryLabels(locale);
  const advisoryProofs = getAdvisoryProofs(dict);

  const icons = [<IconShield key="shield" />, <IconUsers key="users" />, <IconTrendingUp key="trend" />];

  return (
    <main id="main-content">
      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={dict.about.heroTitle}
        subtitle={dict.about.heroSubtitle}
        proofs={advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'ผู้ซื้อที่ต้องการรู้ว่าใครจะดูแลดีลนี้' : 'Buyers who want to know who is guiding the deal',
            body: locale === 'th'
              ? 'หน้านี้ตอบว่า AMP ทำงานอย่างไร คิดอย่างไร และทำไมจึงไม่ใช่แค่พอร์ทัลรวมประกาศ'
              : 'This page explains how AMP works, how we think, and why the service is more than a listing portal.',
            icon: 'users',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'รู้จักทีมก่อน แล้วค่อยคุย shortlist' : 'Meet the team before building the shortlist',
            body: locale === 'th'
              ? 'ถ้าคุณอยากเข้าใจวิธีทำงานก่อนเริ่มคัดห้อง หน้านี้คือจุดเริ่มต้นที่ถูกต้อง'
              : 'If you want to understand the advisory method before discussing units, this is the right starting point.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'หลักการทำงานที่ตรวจสอบได้' : 'Trust grounded in how we operate',
            body: locale === 'th'
              ? 'แนวทางของเราเน้นข้อมูลที่ตรวจสอบได้ คำแนะนำตรงไปตรงมา และไม่ overpromise'
              : 'The team is built around verifiable data, transparent advice, and not overpromising outcomes.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'consultation', source: 'about_hero' }),
          label: dict.cta.speakToAdvisor,
          eventPayload: { cta: 'speak_to_advisor', from: 'about_hero' },
        }}
        secondaryAction={{
          href: withLocale(locale, '/projects'),
          label: dict.advisory.browseVerifiedInventory,
          eventPayload: { cta: 'browse_verified_inventory', from: 'about_hero' },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict),
          label: dict.cta.whatsapp,
        }}
      />

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

