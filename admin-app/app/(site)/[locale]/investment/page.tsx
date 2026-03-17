
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ForeignQuotaExplainer } from '@/components/knowledge/ForeignQuotaExplainer';
import { OwnershipComparison } from '@/components/knowledge/OwnershipComparison';

import { LeadForm } from '@/components/forms/LeadForm';
import { getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';

export const revalidate = 300;

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'investment', dict.segments.investment.heroTitle, dict.segments.investment.heroSubtitle, dict.brand.name);
}

export default async function InvestmentPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const seg = dict.segments.investment;
  const advisoryLabels = getAdvisoryLabels(locale);
  const advisoryProofs = getAdvisoryProofs(dict);

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: seg.heroTitle, href: `/${locale}/investment` },
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
            title: locale === 'th' ? 'ผู้ซื้อที่ต้องการเข้าใจผลตอบแทนและโครงสร้างการถือครอง' : 'Buyers who need ROI and ownership clarity',
            body: locale === 'th'
              ? 'เหมาะกับผู้ที่ต้องการเข้าใจผลตอบแทน โครงสร้างถือครอง และข้อจำกัดของแต่ละทางเลือก'
              : 'Best for buyers who want ROI logic, ownership context, and legal structure before choosing.',
            icon: 'trend',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'ให้ทีมวางกลยุทธ์ก่อนลงลึกแต่ละโครงการ' : 'Use strategy first, then go deeper',
            body: locale === 'th'
              ? 'เริ่มจากแผนลงทุนเพื่อรู้ว่าโครงการแบบไหนเหมาะกับเป้าหมายของคุณจริง'
              : 'Start with the investment plan so the project shortlist is aligned with the actual objective.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'มีทั้งความรู้เรื่องการถือครองและการปิดดีล' : 'Ownership context with execution support',
            body: locale === 'th'
              ? 'เราเชื่อมข้อมูลเชิงกฎหมายกับการคัด inventory และ flow ปิดดีลให้ต่อกัน'
              : 'We connect legal framing, inventory curation, and execution steps in one advisory workflow.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'investment', source: 'investment_hero' }),
          id: 'investment_plan_primary',
          label: dict.cta.getInvestmentPlan,
          eventPayload: { cta: 'get_investment_plan', from: 'investment_hero' },
        }}
        secondaryAction={{
          href: withLocale(locale, '/projects'),
          id: 'investment_projects_secondary',
          label: dict.advisory.browseVerifiedInventory,
          eventPayload: { cta: 'browse_verified_inventory', from: 'investment_hero' },
        }}
      />

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{seg.roiTitle}</h2>
            <p className="section-subtitle">{seg.roiSubtitle}</p>
          </div>
          <ul className="bullet-list">
            {seg.roiBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{seg.ownershipTitle}</h2>
            <p className="section-subtitle">{seg.ownershipSubtitle}</p>
          </div>
          <div className="grid grid-3">
            {seg.ownershipCards.map((c) => (
              <div key={c.title} className="card">
                <h3 className="card-title">{c.title}</h3>
                <p className="card-subtitle">{c.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <ForeignQuotaExplainer locale={locale} />
      <OwnershipComparison locale={locale} />

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


