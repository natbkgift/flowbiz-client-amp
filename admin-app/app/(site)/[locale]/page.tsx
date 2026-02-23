import type { Metadata } from 'next';
import Link from 'next/link';

import { TrackedLink } from '@/components/analytics/TrackedLink';
import { HomeHero } from '@/components/home/HomeHero';
import { FeaturedProjects } from '@/components/home/FeaturedProjects';
import { LeadForm } from '@/components/forms/LeadForm';
import { buildWhatsAppUrl } from '@/app/_lib/public-cta';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale } from '@/app/_lib/i18n/routing';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { getContentRecommendation } from '@/lib/personalization';
import { organizationSchema, webSiteSchema, localBusinessSchema } from '@/app/_lib/schema-markup';
import { fetchProjects } from '@/app/_lib/public-api-server';

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
    return url.pathname + url.search;
  }

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

  // Fetch real projects for featured section
  let allProjects: Awaited<ReturnType<typeof fetchProjects>> = [];
  try {
    allProjects = await fetchProjects({ limit: 100 });
  } catch {
    allProjects = [];
  }

  // Prefer featured projects, fallback to first 6
  const featuredProjects = allProjects.filter((p) => p.is_featured).length > 0
    ? allProjects.filter((p) => p.is_featured).slice(0, 6)
    : allProjects.slice(0, 6);

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

      <HomeHero
        dict={dict}
        locale={locale}
        guidedHref={withLocale(locale, hrefWithQuery('/', { guided: '1', step: 'goal' }))}
      />

      {/* Guided Goal Modal */}
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

      {/* Explore Opportunities (Combined Flow) */}
      <section className="py-16 md:py-20 xl:py-24 2xl:py-28">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-8 xl:px-16 2xl:px-24">
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

          <div className="mt-16 pt-16 border-t border-gray-100">
            <h3 className="text-2xl font-serif font-bold text-center mb-4">{dict.homepageSegmentation.sectionTitle}</h3>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">{dict.homepageSegmentation.sectionSubtitle}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {dict.homepageSegmentation.cards.map((card: any) => (
                <TrackedLink
                  key={card.href}
                  className="path-card reveal bg-gray-50 border-none shadow-sm hover:shadow-md"
                  href={withLocale(locale, card.href)}
                  eventType="segment_entry_click"
                  eventPayload={{ segment: card.href.replace('/', '') }}
                >
                  <h4 className="text-lg font-bold mb-2 text-gray-900">{card.title}</h4>
                  <p className="text-gray-600 text-sm">{card.desc}</p>
                </TrackedLink>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects — Real Data */}
      {featuredProjects.length > 0 ? (
        <section className="py-16 md:py-20 xl:py-24 2xl:py-28">
          <div className="w-full max-w-7xl mx-auto px-6 md:px-8 xl:px-16 2xl:px-24">
            <FeaturedProjects
              projects={featuredProjects}
              locale={locale}
              title={dict.home.featuredProjectsTitle}
              subtitle={dict.home.featuredProjectsSubtitle}
            />
            <div className="cta-row cta-row--center mt-6">
              <TrackedLink
                className="btn btn-secondary"
                href={withLocale(locale, '/projects')}
                eventType="cta_click"
                eventPayload={{ cta: 'view_all_projects', from: 'home_featured' }}
              >
                {locale === 'th' ? 'ดูโครงการทั้งหมด' : 'View All Projects'}
              </TrackedLink>
            </div>
          </div>
        </section>
      ) : null}

      {/* Investment Stats */}
      <section className="py-16 md:py-20 xl:py-24 2xl:py-28 bg-surface">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-8 xl:px-16 2xl:px-24">
          <div className="section-header">
            <h2 className="section-title">{dict.home.investStatsTitle}</h2>
            <p className="section-subtitle">{dict.home.investStatsSubtitle}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 border-t border-gray-200 pt-12">
            {dict.home.investStats.map((stat: any) => (
              <div key={stat.label} className="reveal text-center md:text-left">
                <div className="text-4xl md:text-5xl font-serif font-bold text-primary mb-3">{stat.value}</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">{stat.label}</div>
                <div className="text-sm text-gray-500 leading-relaxed font-medium">Verified current market data, reflecting steady growth and resilient long-term yields.</div>
              </div>
            ))}
          </div>

          <div className="cta-row cta-row--center mt-8">
            <TrackedLink
              className="btn btn-cta"
              href={withLocale(locale, '/invest')}
              eventType="cta_click"
              eventPayload={{ cta: 'explore_investment', from: 'home_stats' }}
            >
              {dict.cta.exploreInvestment}
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* Trust & Market Insight */}
      <section className="py-16 md:py-20 xl:py-24 2xl:py-28">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-8 xl:px-16 2xl:px-24">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-serif mb-6 text-gray-900">{dict.home.trustTitle}</h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">{dict.home.trustSubtitle}</p>
              <ul className="space-y-4">
                {dict.home.trustBullets.map((b: string) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="text-primary mt-1 text-xl leading-none">✓</span>
                    <span className="text-gray-700 font-medium">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] z-0"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">The AMP Pattaya Standard</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">We protect your investment from day one. Our multi-layered due diligence process ensures every property meets international standards for quality, legal clarity, and long-term value.</p>
                <Link href={`/${locale}/about`} className="text-primary font-semibold hover:text-primary-dark transition-colors inline-flex items-center gap-2">Discover our approach →</Link>
              </div>
            </div>
          </div>

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
                <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption>
                  <div className="testimonial__name">{t.name}</div>
                  <div className="testimonial__context">{t.context}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Premium CTA / Conversion Gate */}
      <section className="py-20 md:py-32 bg-gray-900 text-white mt-8">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-8 xl:px-16 2xl:px-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="reveal">
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6 leading-tight">{dict.home.premiumCtaTitle}</h2>
              <p className="text-lg text-white/80 mb-10 max-w-lg leading-relaxed">{dict.home.premiumCtaBody}</p>
              <div className="flex flex-wrap gap-4">
                <TrackedLink
                  className="px-6 py-3 bg-white text-gray-900 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors"
                  href={withLocale(locale, '/contact')}
                  eventType="cta_click"
                  eventPayload={{ cta: 'speak_to_advisor', from: 'home_premium' }}
                >
                  {dict.cta.speakToAdvisor}
                </TrackedLink>
                <TrackedLink
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium transition-colors border border-white/20"
                  href={withLocale(locale, '/invest')}
                  eventType="cta_click"
                  eventPayload={{ cta: 'explore_investment', from: 'home_premium' }}
                >
                  {dict.cta.exploreInvestment}
                </TrackedLink>
              </div>
            </div>
            <div className="reveal">
              <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl text-gray-900">
                <h3 className="text-2xl font-bold mb-2">Request a Private Consultation</h3>
                <p className="text-gray-600 mb-8 text-sm">Tell us about your requirements and we will curate a personalized shortlist.</p>
                <LeadForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
