import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { TransferFeesBreakdown } from '@/components/knowledge/TransferFeesBreakdown';
import { LeadForm } from '@/components/forms/LeadForm';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
 

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'holiday-home', dict.segments.holidayHome.heroTitle, dict.segments.holidayHome.heroSubtitle, dict.brand.name);
}

export default async function HolidayHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const seg = dict.segments.holidayHome;

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: seg.heroTitle, href: `/${locale}/holiday-home` },
        ]}
      />
      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{seg.heroTitle}</h1>
          <p className="subhead">{seg.heroSubtitle}</p>
          <div className="cta-row">
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, '/area-guide')}>
              {dict.nav.areaGuide}
            </a>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{seg.lifestyleTitle}</h2>
            <p className="section-subtitle">{seg.lifestyleSubtitle}</p>
          </div>
          <div className="grid grid-3">
            {seg.lifestyleCards.map((c) => (
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
            <h2 className="section-title">{seg.rentalYieldTitle}</h2>
            <p className="section-subtitle">{seg.rentalYieldSubtitle}</p>
          </div>
          <ul className="bullet-list">
            {seg.rentalYieldBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{seg.managementTitle}</h2>
            <p className="section-subtitle">{seg.managementSubtitle}</p>
          </div>
          <ul className="bullet-list">
            {seg.managementBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Container>
      </section>

      <TransferFeesBreakdown locale={locale} />

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
