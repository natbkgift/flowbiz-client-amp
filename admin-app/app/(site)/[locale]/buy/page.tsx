import type { Metadata } from 'next';

import { ListingGrid } from '@/components/listing/ListingGrid';
import { LeadForm } from '@/components/forms/LeadForm';
import { Container } from '@/components/layout/Container';
import { fetchProperties } from '@/app/_lib/public-api-server';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale } from '@/app/_lib/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const canonical = `/${locale}/buy`;
  return {
    title: `${dict.nav.buy} | ${dict.brand.name}`,
    description: dict.buy.subtitle,
    alternates: {
      canonical,
      languages: {
        en: '/en/buy',
        th: '/th/buy',
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${dict.nav.buy} | ${dict.brand.name}`,
      description: dict.buy.subtitle,
      siteName: dict.brand.name,
      locale: locale === 'th' ? 'th_TH' : 'en_US',
    },
  };
}

export default async function BuyPage({ params }: { params: { locale: string } }) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const res = await fetchProperties({ type: 'resale', limit: 60, sort: 'newest' });

  return (
    <main id="main-content">
      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{dict.buy.title}</h1>
          <p className="subhead">{dict.buy.subtitle}</p>
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
            <h2 className="section-title">{dict.buy.processTitle}</h2>
            <p className="section-subtitle">{dict.buy.processSubtitle}</p>
          </div>

          <div className="grid grid-3">
            {dict.buy.processCards.map((c) => (
              <div key={c.title} className="card">
                <h3 className="card-title">{c.title}</h3>
                <p className="card-subtitle">{c.body}</p>
              </div>
            ))}
          </div>

          <div className="cta-strip">
            <div className="cta-strip__text">{dict.buy.advisoryCtaBody}</div>
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
          </div>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.buy.quotaTitle}</h2>
            <p className="section-subtitle">{dict.buy.quotaSubtitle}</p>
          </div>

          <div className="grid grid-2">
            {dict.buy.quotaCards.map((c) => (
              <div key={c.title} className="card">
                <h3 className="card-title">{c.title}</h3>
                <p className="card-subtitle">{c.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.buy.legalTitle}</h2>
            <p className="section-subtitle">{dict.buy.legalSubtitle}</p>
          </div>

          <ul className="bullet-list">
            {dict.buy.legalBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>

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

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.buy.featuredTitle}</h2>
            <p className="section-subtitle">{dict.buy.featuredSubtitle}</p>
          </div>
          <ListingGrid items={res.data ?? []} />
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{dict.buy.advisoryCtaTitle}</h2>
              <p className="cta-body">{dict.buy.advisoryCtaBody}</p>
            </div>
            <div className="cta-panel__form">
              <LeadForm defaultMessage={dict.buy.advisoryCtaBody} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
