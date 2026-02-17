import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { TrackedLink } from '@/components/analytics/TrackedLink';
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
    title: `${dict.brand.name} | ${dict.home.heroTitle}`,
    description: dict.home.heroSubtitle,
  };
}

export default function HomePage({ params }: { params: { locale: string } }) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

  const featured = [
    { title: 'Central Pattaya', subtitle: 'New-build and resale options' },
    { title: 'Jomtien', subtitle: 'Rental demand and lifestyle access' },
    { title: 'Pratumnak', subtitle: 'Quiet pockets with strong appeal' },
  ];

  return (
    <main id="main-content">
      <section className="hero hero--premium">
        <Container>
          <div className="hero-grid">
            <div>
              <h1 className="headline">{dict.home.heroTitle}</h1>
              <p className="subhead">{dict.home.heroSubtitle}</p>
              <div className="cta-row">
                <TrackedLink
                  className="btn btn-cta"
                  href={withLocale(locale, '/invest')}
                  eventType="cta_click"
                  eventPayload={{ cta: 'explore_investment', from: 'home_hero' }}
                >
                  {dict.cta.exploreInvestment}
                </TrackedLink>
                <TrackedLink
                  className="btn btn-secondary"
                  href={withLocale(locale, '/contact')}
                  eventType="cta_click"
                  eventPayload={{ cta: 'speak_to_advisor', from: 'home_hero' }}
                >
                  {dict.cta.speakToAdvisor}
                </TrackedLink>
              </div>
            </div>

            <div className="hero-panel" aria-hidden="true">
              <div className="hero-panel__card reveal">
                <div className="hero-panel__title">{dict.home.heroPanelTitle}</div>
                <div className="hero-panel__meta">{dict.home.heroPanelMeta}</div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.home.pathSectionTitle}</h2>
            <p className="section-subtitle">{dict.home.pathSectionSubtitle}</p>
          </div>

          <div className="grid grid-3">
            <TrackedLink
              className="path-card reveal"
              href={withLocale(locale, '/invest')}
              eventType="path_entry_click"
              eventPayload={{ path: 'invest' }}
            >
              <h3>{dict.home.pathInvest.title}</h3>
              <p>{dict.home.pathInvest.desc}</p>
            </TrackedLink>
            <TrackedLink
              className="path-card reveal"
              href={withLocale(locale, '/buy')}
              eventType="path_entry_click"
              eventPayload={{ path: 'buy' }}
            >
              <h3>{dict.home.pathBuy.title}</h3>
              <p>{dict.home.pathBuy.desc}</p>
            </TrackedLink>
            <TrackedLink
              className="path-card reveal"
              href={withLocale(locale, '/rent')}
              eventType="path_entry_click"
              eventPayload={{ path: 'live' }}
            >
              <h3>{dict.home.pathLive.title}</h3>
              <p>{dict.home.pathLive.desc}</p>
            </TrackedLink>
          </div>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.home.trustTitle}</h2>
            <p className="section-subtitle">{dict.home.trustSubtitle}</p>
          </div>

          <ul className="bullet-list">
            {dict.home.trustBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.home.featuredTitle}</h2>
            <p className="section-subtitle">{dict.home.featuredSubtitle}</p>
          </div>

          <div className="grid grid-3">
            {featured.map((it) => (
              <div key={it.title} className="card reveal">
                <h3 className="card-title">{it.title}</h3>
                <p className="card-subtitle">{it.subtitle}</p>
                <div className="card-actions">
                  <TrackedLink
                    className="btn btn-tertiary"
                    href={withLocale(locale, '/buy')}
                    eventType="featured_click"
                    eventPayload={{ featured: it.title, action: 'buy' }}
                  >
                    {dict.nav.buy}
                  </TrackedLink>
                  <TrackedLink
                    className="btn btn-secondary"
                    href={withLocale(locale, '/invest')}
                    eventType="featured_click"
                    eventPayload={{ featured: it.title, action: 'invest' }}
                  >
                    {dict.nav.invest}
                  </TrackedLink>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.home.insightTitle}</h2>
            <p className="section-subtitle">{dict.home.insightSubtitle}</p>
          </div>

          <div className="grid grid-3">
            {dict.home.insightCards.map((c) => (
              <div key={c.title} className="card reveal">
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
            <h2 className="section-title">{dict.home.testimonialsTitle}</h2>
            <p className="section-subtitle">{dict.home.testimonialsSubtitle}</p>
          </div>

          <div className="grid grid-2">
            {dict.common.testimonials.map((t) => (
              <figure key={t.quote} className="testimonial reveal">
                <blockquote>“{t.quote}”</blockquote>
                <figcaption>
                  <div className="testimonial__name">{t.name}</div>
                  <div className="testimonial__context">{t.context}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel reveal">
            <div>
              <h2 className="cta-title">{dict.home.premiumCtaTitle}</h2>
              <p className="cta-body">{dict.home.premiumCtaBody}</p>
            </div>
            <div className="cta-row">
              <TrackedLink
                className="btn btn-cta"
                href={withLocale(locale, '/invest')}
                eventType="cta_click"
                eventPayload={{ cta: 'explore_investment', from: 'home_premium' }}
              >
                {dict.cta.exploreInvestment}
              </TrackedLink>
              <TrackedLink
                className="btn btn-secondary"
                href={withLocale(locale, '/contact')}
                eventType="cta_click"
                eventPayload={{ cta: 'speak_to_advisor', from: 'home_premium' }}
              >
                {dict.cta.speakToAdvisor}
              </TrackedLink>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
