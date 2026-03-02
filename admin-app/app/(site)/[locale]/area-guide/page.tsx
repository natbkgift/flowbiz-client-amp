import dynamic from 'next/dynamic';

import { Container } from '@/components/layout/Container';

const LeadForm = dynamic(
  () => import('@/components/forms/LeadForm').then((m) => m.LeadForm),
  { ssr: false },
);
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { PAGE_REVALIDATE_SECONDS } from '@/app/_lib/constants';

export const revalidate = PAGE_REVALIDATE_SECONDS;

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'area-guide', dict.nav.areaGuide, dict.areaGuide.subtitle, dict.brand.name);
}

export default function AreaGuidePage({ params }: { params: { locale: string } }) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

  const areas = [
    {
      title: dict.areaGuide.centralTitle,
      lifestyle: dict.areaGuide.centralLifestyle,
      investment: dict.areaGuide.centralInvestment,
    },
    {
      title: dict.areaGuide.jomtienTitle,
      lifestyle: dict.areaGuide.jomtienLifestyle,
      investment: dict.areaGuide.jomtienInvestment,
    },
    {
      title: dict.areaGuide.pratumnakTitle,
      lifestyle: dict.areaGuide.pratumnakLifestyle,
      investment: dict.areaGuide.pratumnakInvestment,
    },
  ];

  return (
    <main id="main-content">
      <section className="hero hero--page">
        <Container>
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
