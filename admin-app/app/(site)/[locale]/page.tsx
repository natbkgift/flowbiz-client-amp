import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { CTA, buildWhatsAppUrl } from '@/app/_lib/public-cta';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale } from '@/app/_lib/i18n/routing';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { getContentRecommendation } from '@/lib/personalization';
import { organizationSchema, webSiteSchema, localBusinessSchema } from '@/app/_lib/schema-markup';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, '', `${dict.brand.name} | ${dict.home.heroTitle}`, dict.home.heroSubtitle, dict.brand.name);
}

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);

  type GuidedStep = 'goal' | 'budget' | 'contact';
  type GuidedGoal = 'buy' | 'rent' | 'invest';

  function pickParam(value: unknown): string | null {
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    return null;
  }

  function normalizeGuidedStep(step: string | null): GuidedStep {
    if (step === 'goal' || step === 'budget' || step === 'contact') return step;
    return 'goal';
  }

  function normalizeGoal(goal: string | null): GuidedGoal | null {
    if (goal === 'buy' || goal === 'rent' || goal === 'invest') return goal;
    return null;
  }

  function hrefWithQuery(path: string, query: Record<string, string>): string {
    const url = new URL(path, 'https://amppattaya.com');
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
    // Keep it relative.
    return url.pathname + url.search;
  }

  // WhatsApp URL builder extracted to shared utility: @/app/_lib/public-cta

  const featured = [
    { title: dict.home.featuredCentralTitle, subtitle: dict.home.featuredCentralSubtitle },
    { title: dict.home.featuredJomtienTitle, subtitle: dict.home.featuredJomtienSubtitle },
    { title: dict.home.featuredPratumnakTitle, subtitle: dict.home.featuredPratumnakSubtitle },
  ];

  const smartLabels = {
    buy: dict.guided.buy,
    rent: dict.guided.rent,
    invest: dict.guided.invest,
  };

  const sp = searchParams ? await searchParams : undefined;
  const guidedOpen = pickParam(sp?.guided) === '1';
  const step = normalizeGuidedStep(pickParam(sp?.step));
  const goal = normalizeGoal(pickParam(sp?.goal));
  const budget = pickParam(sp?.budget);
  const timeline = pickParam(sp?.timeline);

  const effectiveStep: GuidedStep = guidedOpen
    ? goal
      ? step
      : 'goal'
    : 'goal';

  const summaryLines = [
    goal ? `${dict.home.goalPrefix}: ${goal}` : null,
    budget ? `${dict.home.budgetPrefix}: ${budget}` : null,
    timeline ? `${dict.home.timelinePrefix}: ${timeline}` : null,
  ].filter(Boolean) as string[];
  const summaryText = summaryLines.join(' | ');
  const whatsAppText = summaryText
    ? `${dict.home.whatsAppGreeting} — ${summaryText}`
    : dict.home.whatsAppFallback;
  const whatsAppHref = buildWhatsAppUrl(whatsAppText);

  const closeHref = withLocale(locale, '/');

  const recommendation = getContentRecommendation();

  const jsonLd = JSON.stringify([
    organizationSchema(),
    webSiteSchema(),
    localBusinessSchema(),
  ], null, 0);

  return (
    <main id="main-content" data-emphasis={recommendation.emphasis}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
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
              <TrackedLink
                className="hero-guided-trigger"
                href={withLocale(locale, hrefWithQuery('/', { guided: '1', step: 'goal' }))}
                eventType="cta_click"
                eventPayload={{ cta: 'open_guided_finder', from: 'home_hero' }}
              >
                {dict.guided.heroTrigger ?? 'Not sure where to start? Let us guide you →'}
              </TrackedLink>
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

      {/* Phase 1: Guided Goal Modal (server-rendered via query params; no-JS friendly). */}
      {guidedOpen ? (
        <div className="guided-overlay" role="presentation">
          <dialog className="guided-dialog" open aria-modal="true" aria-labelledby="guided-dialog-title">
            <div className="guided-dialog__header">
              <div>
                <div className="guided-dialog__title" id="guided-dialog-title">{dict.guided.title}</div>
                <div className="guided-dialog__step">
                  {effectiveStep === 'goal'
                    ? dict.guided.stepGoal
                    : effectiveStep === 'budget'
                      ? dict.guided.stepBudget
                      : dict.guided.stepContact}
                  {'  '}•{'  '}{dict.guided.stepProgress}
                </div>
              </div>
              <a className="guided-dialog__close" href={closeHref} aria-label={dict.common.close}>
                ✕
              </a>
            </div>

            <div className="guided-dialog__body">
              {effectiveStep === 'goal' ? (
                <form method="GET" action={withLocale(locale, '/')} className="guided-grid">
                  <input type="hidden" name="guided" value="1" />
                  <input type="hidden" name="step" value="budget" />
                  <div className="guided-row">
                    <button className="btn btn-cta" type="submit" name="goal" value="buy">
                      {smartLabels.buy}
                    </button>
                    <button className="btn btn-secondary" type="submit" name="goal" value="rent">
                      {smartLabels.rent}
                    </button>
                    <button className="btn btn-secondary" type="submit" name="goal" value="invest">
                      {smartLabels.invest}
                    </button>
                  </div>
                  <div className="cta-row cta-row--center">
                    <a
                      className="btn btn-tertiary"
                      href={withLocale(
                        locale,
                        hrefWithQuery('/', { guided: '1', step: 'contact' })
                      )}
                    >
                      {dict.guided.skipToContact}
                    </a>
                  </div>
                </form>
              ) : null}

              {effectiveStep === 'budget' ? (
                <form method="GET" action={withLocale(locale, '/')} className="guided-grid">
                  <input type="hidden" name="guided" value="1" />
                  <input type="hidden" name="step" value="contact" />
                  <input type="hidden" name="goal" value={goal ?? 'buy'} />

                  <label>
                    <div className="font-semibold">{dict.guided.budgetLabel}</div>
                    <select className="form-input" name="budget" defaultValue={budget ?? ''}>
                      <option value="" disabled>
                        {dict.guided.budgetSelect}
                      </option>
                      <option value="<3m">{dict.guided.budgetUnder3m}</option>
                      <option value="3-5m">{dict.guided.budget3to5m}</option>
                      <option value="5-8m">{dict.guided.budget5to8m}</option>
                      <option value="8m+">{dict.guided.budget8mPlus}</option>
                      <option value="not_sure">{dict.guided.budgetNotSure}</option>
                    </select>
                  </label>

                  <div className="cta-row">
                    <button className="btn btn-cta" type="submit">
                      {dict.guided.next}
                    </button>
                    <a
                      className="btn btn-secondary"
                      href={withLocale(locale, hrefWithQuery('/', { guided: '1', step: 'goal' }))}
                    >
                      {dict.guided.changeGoal}
                    </a>
                  </div>
                </form>
              ) : null}

              {effectiveStep === 'contact' ? (
                <div className="guided-grid">
                  <div className="font-semibold">{dict.guided.summary}</div>
                  <div className="guided-summary">
                    {summaryLines.length ? (
                      <ul className="bullet-list">
                        {summaryLines.map((l) => (
                          <li key={l}>{l}</li>
                        ))}
                      </ul>
                    ) : (
                      <div>{dict.guided.noSelections}</div>
                    )}
                  </div>

                  <div className="guided-row">
                    <TrackedLink
                      className="btn btn-cta"
                      href={withLocale(
                        locale,
                        hrefWithQuery('/contact', {
                          topic: 'private_consultation',
                          msg: whatsAppText,
                        })
                      )}
                      eventType="cta_click"
                      eventPayload={{ cta: 'book_consultation', from: 'home_guided' }}
                    >
                      {dict.cta.bookPrivateTour}
                    </TrackedLink>

                    <a className="btn btn-secondary" href={whatsAppHref} target="_blank" rel="noreferrer">
                      {dict.cta.whatsapp}
                    </a>
                  </div>

                  <div className="cta-row">
                    <a
                      className="btn btn-tertiary"
                      href={withLocale(
                        locale,
                        hrefWithQuery('/', {
                          guided: '1',
                          step: 'budget',
                          goal: goal ?? 'buy',
                          budget: budget ?? '',
                        })
                      )}
                    >
                      {dict.guided.back}
                    </a>
                    <a className="btn btn-secondary" href={closeHref}>
                      {dict.guided.close}
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          </dialog>
        </div>
      ) : null}

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

          <div className="section-header">
            <h2 className="section-title">{dict.homepageSegmentation.sectionTitle}</h2>
            <p className="section-subtitle">{dict.homepageSegmentation.sectionSubtitle}</p>
          </div>
          <div className="grid grid-3">
            {dict.homepageSegmentation.cards.map((card) => (
              <TrackedLink
                key={card.href}
                className="path-card reveal"
                href={withLocale(locale, card.href)}
                eventType="segment_entry_click"
                eventPayload={{ segment: card.href.replace('/', '') }}
              >
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </TrackedLink>
            ))}
          </div>
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
              <div key={it.title} className="card reveal" role="article">
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
            <h2 className="section-title">{dict.home.trustTitle}</h2>
            <p className="section-subtitle">{dict.home.trustSubtitle}</p>
          </div>

          <ul className="bullet-list">
            {dict.home.trustBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>

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

          <div className="testimonial-strip">
            {dict.common.testimonials.slice(0, 2).map((t) => (
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
