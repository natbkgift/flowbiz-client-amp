import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { LeadForm } from '@/components/forms/LeadForm';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
 

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'invest', dict.nav.invest, dict.invest.subtitle, dict.brand.name);
}

export default function InvestPage({ params }: { params: { locale: string } }) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: dict.nav.invest, href: `/${locale}/invest` },
        ]}
      />
      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{dict.invest.title}</h1>
          <p className="subhead">{dict.invest.subtitle}</p>
          <div className="cta-row">
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, '/buy')}>
              {dict.nav.buy}
            </a>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.invest.whyTitle}</h2>
            <p className="section-subtitle">{dict.invest.whySubtitle}</p>
          </div>

          <div className="grid grid-3">
            {dict.invest.whyCards.map((c) => (
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
            <h2 className="section-title">{dict.invest.demandTitle}</h2>
            <p className="section-subtitle">{dict.invest.demandSubtitle}</p>
          </div>

          <ul className="bullet-list">
            {dict.invest.demandBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>

          <div className="cta-strip">
            <div className="cta-strip__text">{dict.invest.reportCtaBody}</div>
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.invest.reportCtaTitle}
            </a>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.invest.yieldTitle}</h2>
            <p className="section-subtitle">{dict.invest.yieldSubtitle}</p>
          </div>

          <div className="grid grid-2">
            {dict.invest.yieldCards.map((c) => (
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
            <h2 className="section-title">{dict.invest.riskTitle}</h2>
            <p className="section-subtitle">{dict.invest.riskSubtitle}</p>
          </div>

          <ul className="bullet-list">
            {dict.invest.riskBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{dict.invest.reportCtaTitle}</h2>
              <p className="cta-body">{dict.invest.reportCtaBody}</p>
            </div>
            <div className="cta-panel__form">
              <LeadForm defaultMessage={dict.invest.reportCtaBody} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
