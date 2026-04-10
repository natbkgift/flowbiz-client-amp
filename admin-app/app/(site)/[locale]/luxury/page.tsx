
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

import { LeadForm } from '@/components/forms/LeadForm';
import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';

export const revalidate = 300;

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'luxury', dict.segments.luxury.heroTitle, dict.segments.luxury.heroSubtitle, dict.brand.name);
}

export default async function LuxuryPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const seg = dict.segments.luxury;
  const advisoryLabels = getAdvisoryLabels(locale);
  const advisoryProofs = getAdvisoryProofs(dict);

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: seg.heroTitle, href: `/${locale}/luxury` },
        ]}
      />
      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={seg.heroTitle}
        subtitle={seg.heroSubtitle}
        proofs={advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'ผู้ซื้อที่ต้องการนัดชมแบบส่วนตัวและการคัดแบบเฉพาะโจทย์' : 'Buyers who want bespoke private tours',
            body: locale === 'th'
              ? 'เหมาะกับผู้ซื้อระดับบนที่ต้องการคัดยูนิตจากคุณภาพโครงการ วิว และความเป็นส่วนตัว'
              : 'Best for buyers prioritising building quality, view, privacy, and viewing efficiency.',
            icon: 'building',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'นัดชมแบบส่วนตัวจากรายการที่คัดไว้' : 'Book a private tour from a curated shortlist',
            body: locale === 'th'
              ? 'บอกทำเล งบ และรูปแบบการใช้งาน ทีมจะคัดห้องที่คุ้มเวลาชมจริงให้ก่อน'
              : 'Share area, budget, and use case, and we will narrow the viewing plan before you tour.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'คัดตัวเลือกระดับลักชัวรีแบบไม่ส่งเกินจำเป็น' : 'Luxury inventory without unnecessary noise',
            body: locale === 'th'
              ? 'เราเน้นคุณภาพของรายการคัดไว้ มากกว่าจำนวนประกาศ เพื่อให้ทุกการนัดชมมีเหตุผลรองรับ'
              : 'We keep the shortlist tight so each tour slot has a clear strategic reason.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'luxury', source: 'luxury_hero' }),
          label: dict.cta.bookPrivateTour,
          eventPayload: { cta: 'book_private_tour', from: 'luxury_hero' },
        }}
        secondaryAction={{
          href: withLocale(locale, '/projects'),
          label: dict.advisory.browseVerifiedInventory,
          eventPayload: { cta: 'browse_verified_inventory', from: 'luxury_hero' },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict),
          label: dict.cta.whatsapp,
        }}
      />

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{seg.premiumTitle}</h2>
            <p className="section-subtitle">{seg.premiumSubtitle}</p>
          </div>
          <div className="grid grid-3">
            {seg.premiumCards.map((c) => (
              <div key={c.title} className="card">
                <h3 className="card-title">{c.title}</h3>
                <p className="card-subtitle">{c.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{seg.exclusiveTitle}</h2>
            <p className="section-subtitle">{seg.exclusiveSubtitle}</p>
          </div>
          <ul className="bullet-list">
            {seg.exclusiveBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{seg.ctaTitle}</h2>
              <p className="cta-body">{seg.ctaBody}</p>
            </div>
            <div className="cta-panel__form">
              <LeadForm defaultMessage={seg.ctaBody} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}


