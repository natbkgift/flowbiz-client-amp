import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { LeadForm } from '@/components/forms/LeadForm';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale } from '@/app/_lib/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return {
    title: `${dict.nav.areaGuide} | ${dict.brand.name}`,
    description: dict.areaGuide.subtitle,
  };
}

export default function AreaGuidePage({ params }: { params: { locale: string } }) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

  const areas = [
    {
      title: 'Central Pattaya',
      lifestyle: 'Walkability and access to amenities.',
      investment: 'High liquidity, varies by building and unit fit.',
    },
    {
      title: 'Jomtien',
      lifestyle: 'Beach access with quieter pockets.',
      investment: 'Broad rental demand, depends on location and management.',
    },
    {
      title: 'Pratumnak',
      lifestyle: 'Residential feel between Pattaya and Jomtien.',
      investment: 'Selective demand—unit fit matters.',
    },
  ];

  return (
    <main id="main-content">
      <section className="hero hero--page">
        <Container>
          <p className="eyebrow">{dict.brand.tagline}</p>
          <h1 className="headline">{dict.areaGuide.title}</h1>
          <p className="subhead">{dict.areaGuide.subtitle}</p>
          <div className="cta-row">
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, '/invest')}>
              {dict.cta.exploreInvestment}
            </a>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.areaGuide.areasTitle}</h2>
            <p className="section-subtitle">{dict.areaGuide.areasSubtitle}</p>
          </div>

          <div className="grid grid-3">
            {areas.map((a) => (
              <div key={a.title} className="card">
                <h3 className="card-title">{a.title}</h3>
                <p className="card-subtitle">{a.lifestyle}</p>
                <p className="card-subtitle">{a.investment}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.areaGuide.mapTitle}</h2>
            <p className="section-subtitle">{dict.areaGuide.mapSubtitle}</p>
          </div>

          <div className="map-grid" role="list">
            {areas.map((a) => (
              <div key={a.title} className="map-item" role="listitem">
                <div className="map-item__title">{a.title}</div>
                <div className="map-item__row">
                  <span className="map-item__label">{dict.areaGuide.mapLabels.lifestyle}</span>
                  <span className="map-item__value">{a.lifestyle}</span>
                </div>
                <div className="map-item__row">
                  <span className="map-item__label">{dict.areaGuide.mapLabels.investment}</span>
                  <span className="map-item__value">{a.investment}</span>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{dict.contact.advisoryTitle}</h2>
              <p className="cta-body">{dict.contact.advisoryBody}</p>
            </div>
            <div className="cta-panel__form">
              <LeadForm defaultMessage={dict.contact.advisoryBody} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
