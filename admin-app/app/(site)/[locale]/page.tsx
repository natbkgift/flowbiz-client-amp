import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { CTA } from '@/app/_lib/public-cta';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale } from '@/app/_lib/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const canonical = `/${locale}`;
  return {
    title: `${dict.brand.name} | ${dict.home.heroTitle}`,
    description: dict.home.heroSubtitle,
    alternates: {
      canonical,
      languages: {
        en: '/en',
        th: '/th',
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${dict.brand.name} | ${dict.home.heroTitle}`,
      description: dict.home.heroSubtitle,
      siteName: dict.brand.name,
      locale: locale === 'th' ? 'th_TH' : 'en_US',
    },
  };
}

export default function HomePage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

  type GuidedStep = 'goal' | 'budget' | 'timeline' | 'contact';
  type GuidedGoal = 'buy' | 'rent' | 'invest';

  function pickParam(value: unknown): string | null {
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    return null;
  }

  function normalizeGuidedStep(step: string | null): GuidedStep {
    if (step === 'goal' || step === 'budget' || step === 'timeline' || step === 'contact') return step;
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

  function appendWhatsAppText(baseUrl: string, text: string): string {
    try {
      const url = new URL(baseUrl);
      url.searchParams.set('text', text);
      return url.toString();
    } catch {
      // Best-effort: if the base URL cannot be parsed, fall back to raw.
      return baseUrl;
    }
  }

  const featured = [
    { title: 'Central Pattaya', subtitle: 'New-build and resale options' },
    { title: 'Jomtien', subtitle: 'Rental demand and lifestyle access' },
    { title: 'Pratumnak', subtitle: 'Quiet pockets with strong appeal' },
  ];

  const smartLabels =
    locale === 'th'
      ? { buy: 'ซื้อ', rent: 'เช่า', invest: 'ลงทุน' }
      : { buy: 'Buy', rent: 'Rent', invest: 'Invest' };

  const guidedOpen = pickParam(searchParams?.guided) === '1';
  const step = normalizeGuidedStep(pickParam(searchParams?.step));
  const goal = normalizeGoal(pickParam(searchParams?.goal));
  const budget = pickParam(searchParams?.budget);
  const timeline = pickParam(searchParams?.timeline);

  const effectiveStep: GuidedStep = guidedOpen
    ? goal
      ? step
      : 'goal'
    : 'goal';

  const summaryLines = [
    goal ? `Goal: ${goal}` : null,
    budget ? `Budget: ${budget}` : null,
    timeline ? `Timeline: ${timeline}` : null,
  ].filter(Boolean) as string[];
  const summaryText = summaryLines.join(' | ');
  const whatsAppText = summaryText
    ? `Hi AMP Pattaya — ${summaryText}`
    : 'Hi AMP Pattaya — I want help choosing the right Pattaya property.';
  const whatsAppHref = appendWhatsAppText(CTA.whatsAppUrl, whatsAppText);

  const closeHref = withLocale(locale, '/');

  return (
    <main id="main-content">
      <section className="hero hero--premium">
        <Container>
          <div className="hero-grid">
            <div>
              <h1 className="headline">{dict.home.heroTitle}</h1>
              <p className="subhead">{dict.home.heroSubtitle}</p>

              {/* Phase 1: Smart Entry CTA block (above-the-fold; additive). */}
              <div className="guided-grid" aria-label="Smart entry">
                <div className="guided-row">
                  <TrackedLink
                    className="btn btn-cta"
                    href={withLocale(
                      locale,
                      hrefWithQuery('/', { guided: '1', step: 'budget', goal: 'buy' })
                    )}
                    eventType="cta_click"
                    eventPayload={{ cta: 'smart_entry_buy', from: 'home_hero' }}
                  >
                    {smartLabels.buy}
                  </TrackedLink>
                  <TrackedLink
                    className="btn btn-secondary"
                    href={withLocale(
                      locale,
                      hrefWithQuery('/', { guided: '1', step: 'budget', goal: 'rent' })
                    )}
                    eventType="cta_click"
                    eventPayload={{ cta: 'smart_entry_rent', from: 'home_hero' }}
                  >
                    {smartLabels.rent}
                  </TrackedLink>
                  <TrackedLink
                    className="btn btn-secondary"
                    href={withLocale(
                      locale,
                      hrefWithQuery('/', { guided: '1', step: 'budget', goal: 'invest' })
                    )}
                    eventType="cta_click"
                    eventPayload={{ cta: 'smart_entry_invest', from: 'home_hero' }}
                  >
                    {smartLabels.invest}
                  </TrackedLink>
                </div>
                <p className="guided-dialog__step">Goal → Budget → Timeline → Contact</p>
              </div>

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

      {/* Phase 1: Guided Goal Modal (server-rendered via query params; no-JS friendly). */}
      {guidedOpen ? (
        <div className="guided-overlay" role="presentation">
          <dialog className="guided-dialog" open>
            <div className="guided-dialog__header">
              <div>
                <div className="guided-dialog__title">{locale === 'th' ? 'เริ่มต้นแบบมีไกด์' : 'Guided Shortlist'}</div>
                <div className="guided-dialog__step">
                  {effectiveStep === 'goal'
                    ? 'Goal'
                    : effectiveStep === 'budget'
                      ? 'Budget'
                      : effectiveStep === 'timeline'
                        ? 'Timeline'
                        : 'Contact'}
                  {'  '}•{'  '}Goal → Budget → Timeline → Contact
                </div>
              </div>
              <a className="guided-dialog__close" href={closeHref} aria-label="Close">
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
                </form>
              ) : null}

              {effectiveStep === 'budget' ? (
                <form method="GET" action={withLocale(locale, '/')} className="guided-grid">
                  <input type="hidden" name="guided" value="1" />
                  <input type="hidden" name="step" value="timeline" />
                  <input type="hidden" name="goal" value={goal ?? 'buy'} />

                  <label>
                    <div style={{ fontWeight: 600 }}>{locale === 'th' ? 'งบประมาณ' : 'Budget'}</div>
                    <select className="form-input" name="budget" defaultValue={budget ?? ''}>
                      <option value="" disabled>
                        {locale === 'th' ? 'เลือกงบประมาณ' : 'Select a budget'}
                      </option>
                      <option value="<3m">{locale === 'th' ? 'ต่ำกว่า 3M THB' : 'Under 3M THB'}</option>
                      <option value="3-5m">{locale === 'th' ? '3–5M THB' : '3–5M THB'}</option>
                      <option value="5-8m">{locale === 'th' ? '5–8M THB' : '5–8M THB'}</option>
                      <option value="8m+">{locale === 'th' ? '8M+ THB' : '8M+ THB'}</option>
                      <option value="not_sure">{locale === 'th' ? 'ยังไม่แน่ใจ' : 'Not sure yet'}</option>
                    </select>
                  </label>

                  <div className="cta-row">
                    <button className="btn btn-cta" type="submit">
                      {locale === 'th' ? 'ถัดไป' : 'Next'}
                    </button>
                    <a
                      className="btn btn-secondary"
                      href={withLocale(locale, hrefWithQuery('/', { guided: '1', step: 'goal' }))}
                    >
                      {locale === 'th' ? 'เปลี่ยนเป้าหมาย' : 'Change goal'}
                    </a>
                  </div>
                </form>
              ) : null}

              {effectiveStep === 'timeline' ? (
                <form method="GET" action={withLocale(locale, '/')} className="guided-grid">
                  <input type="hidden" name="guided" value="1" />
                  <input type="hidden" name="step" value="contact" />
                  <input type="hidden" name="goal" value={goal ?? 'buy'} />
                  <input type="hidden" name="budget" value={budget ?? ''} />

                  <label>
                    <div style={{ fontWeight: 600 }}>{locale === 'th' ? 'ไทม์ไลน์' : 'Timeline'}</div>
                    <select className="form-input" name="timeline" defaultValue={timeline ?? ''}>
                      <option value="" disabled>
                        {locale === 'th' ? 'เลือกไทม์ไลน์' : 'Select a timeline'}
                      </option>
                      <option value="0-3m">{locale === 'th' ? '0–3 เดือน' : '0–3 months'}</option>
                      <option value="3-6m">{locale === 'th' ? '3–6 เดือน' : '3–6 months'}</option>
                      <option value="6-12m">{locale === 'th' ? '6–12 เดือน' : '6–12 months'}</option>
                      <option value="12m+">{locale === 'th' ? '12+ เดือน / ยืดหยุ่น' : '12+ months / flexible'}</option>
                    </select>
                  </label>

                  <div className="cta-row">
                    <button className="btn btn-cta" type="submit">
                      {locale === 'th' ? 'ถัดไป' : 'Next'}
                    </button>
                    <a
                      className="btn btn-secondary"
                      href={withLocale(
                        locale,
                        hrefWithQuery('/', {
                          guided: '1',
                          step: 'budget',
                          goal: goal ?? 'buy',
                        })
                      )}
                    >
                      {locale === 'th' ? 'ย้อนกลับ' : 'Back'}
                    </a>
                  </div>
                </form>
              ) : null}

              {effectiveStep === 'contact' ? (
                <div className="guided-grid">
                  <div style={{ fontWeight: 600 }}>{locale === 'th' ? 'สรุป' : 'Summary'}</div>
                  <div className="guided-summary">
                    {summaryLines.length ? (
                      <ul className="bullet-list">
                        {summaryLines.map((l) => (
                          <li key={l}>{l}</li>
                        ))}
                      </ul>
                    ) : (
                      <div>{locale === 'th' ? 'ยังไม่มีข้อมูล' : 'No selections yet.'}</div>
                    )}
                  </div>

                  <div className="guided-row">
                    <TrackedLink
                      className="btn btn-cta"
                      href={withLocale(
                        locale,
                        hrefWithQuery('/contact', {
                          topic: 'private_tour',
                          msg: whatsAppText,
                        })
                      )}
                      eventType="cta_click"
                      eventPayload={{ cta: 'book_private_tour', from: 'home_guided' }}
                    >
                      {dict.cta.bookPrivateTour}
                    </TrackedLink>

                    <a className="btn btn-secondary" href={whatsAppHref} target="_blank" rel="noreferrer">
                      {dict.cta.whatsapp}
                    </a>

                    <TrackedLink
                      className="btn btn-secondary"
                      href={withLocale(
                        locale,
                        hrefWithQuery('/contact', {
                          topic: 'investment_plan',
                          msg: whatsAppText,
                        })
                      )}
                      eventType="cta_click"
                      eventPayload={{ cta: 'get_investment_plan', from: 'home_guided' }}
                    >
                      {dict.cta.getInvestmentPlan}
                    </TrackedLink>
                  </div>

                  <div className="cta-row">
                    <a
                      className="btn btn-tertiary"
                      href={withLocale(
                        locale,
                        hrefWithQuery('/', {
                          guided: '1',
                          step: 'timeline',
                          goal: goal ?? 'buy',
                          budget: budget ?? '',
                        })
                      )}
                    >
                      {locale === 'th' ? 'แก้ไขไทม์ไลน์' : 'Edit timeline'}
                    </a>
                    <a className="btn btn-secondary" href={closeHref}>
                      {locale === 'th' ? 'ปิด' : 'Close'}
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
