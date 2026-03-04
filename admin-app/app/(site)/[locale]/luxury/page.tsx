
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

import { LeadForm } from '@/components/forms/LeadForm';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';

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

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: seg.heroTitle, href: `/${locale}/luxury` },
        ]}
      />
      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{seg.heroTitle}</h1>
          <p className="subhead">{seg.heroSubtitle}</p>
          <div className="cta-row">
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.bookPrivateTour}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, '/projects')}>
              {dict.nav.projects}
            </a>
          </div>
        </Container>
      </section>

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


