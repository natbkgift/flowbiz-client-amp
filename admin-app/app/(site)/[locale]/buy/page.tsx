import dynamic from 'next/dynamic';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { fetchProperties } from '@/app/_lib/public-api-server';
import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';
import { EmptyStateCard } from '@/components/ui/StateBlocks';

const ListingGrid = dynamic(() => import('@/components/listing/ListingGrid').then(m => m.ListingGrid), {
  loading: () => <div className="animate-pulse h-96 rounded bg-slate-100" />,
});
const LeadForm = dynamic(() => import('@/components/forms/LeadForm').then(m => m.LeadForm), {
  loading: () => <div className="animate-pulse h-48 rounded bg-slate-100" />,
});

export const revalidate = 300;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const copy = dict.buy.route;
  return makePageMetadata(
    locale,
    'buy',
    copy.metadataTitle,
    copy.metadataDescription,
    dict.brand.name
  );
}

function applyCountTemplate(template: string, count: number): string {
  return template.replace('{count}', String(count));
}

export default async function BuyPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const copy = dict.buy.route;
  const advisoryLabels = getAdvisoryLabels(locale);
  const advisoryProofs = getAdvisoryProofs(dict);

  let res: Awaited<ReturnType<typeof fetchProperties>>;
  try {
    res = await fetchProperties({ type: 'resale', limit: 60, sort: 'newest' });
  } catch {
    res = { data: [], meta: { page: 1, limit: 60, total: 0 } };  // graceful degradation
  }

  const featuredItems = (res.data ?? []).slice(0, 3);
  const hiddenItemCount = Math.max(0, (res.data?.length ?? 0) - featuredItems.length);
  const liveEntryPrice = (res.data ?? [])
    .map((item) => item.price)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0)
    .sort((left, right) => left - right)[0] ?? null;
  const luxuryReadyCount = (res.data ?? []).filter((item) =>
    typeof item.price === 'number' && Number.isFinite(item.price) && item.price >= 10_000_000
  ).length;
  const buyProofs = [
    applyCountTemplate(copy.proofReadyListingsTemplate, res.data?.length ?? 0),
    liveEntryPrice
      ? `${copy.entryFromPrefix} THB ${Math.round(liveEntryPrice).toLocaleString()}`
      : null,
    luxuryReadyCount > 0
      ? applyCountTemplate(copy.luxuryReadyOptionsTemplate, luxuryReadyCount)
      : null,
    ...advisoryProofs,
  ].filter((item): item is string => Boolean(item)).slice(0, 4);

  return (
    <main id="main-content" className="page-template--catalogue buy-page decision-page--confidence">
      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: dict.nav.buy, href: `/${locale}/buy` },
        ]}
      />
      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={copy.heroTitle}
        subtitle={copy.heroSubtitle}
        proofs={buyProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: copy.signals.bestForTitle,
            body: copy.signals.bestForBody,
            icon: 'users',
          },
          {
            kicker: dict.advisory.nextStep,
            title: copy.signals.nextStepTitle,
            body: copy.signals.nextStepBody,
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: copy.signals.trustTitle,
            body: copy.signals.trustBody,
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'buy', source: 'buy_hero' }),
          label: copy.primaryActionLabel,
          eventPayload: { cta: 'buy_consultation', from: 'buy_hero' },
        }}
        secondaryAction={{
          href: withLocale(locale, '/projects'),
          label: copy.secondaryActionLabel,
          eventPayload: { cta: 'browse_verified_inventory', from: 'buy_hero' },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict),
          label: dict.cta.whatsapp,
        }}
        supportNote={copy.supportNote}
      />

      <section className="section">
        <Container variant="wide">
          <div className="buy-scan-note buy-scan-note--hero buy-scan-note--process mb-6" aria-label={copy.scanMode.ariaLabel}>
            <p className="buy-scan-note__eyebrow">
              {copy.scanMode.eyebrow}
            </p>
            <p className="buy-scan-note__body">
              {copy.scanMode.body}
            </p>
          </div>
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

          <div className="buy-flow-utility buy-flow-utility--process" aria-label={copy.processUtility.ariaLabel}>
            <div className="buy-flow-utility__text">
              {copy.processUtility.body}
            </div>
            <div className="buy-flow-utility__links">
              <a className="buy-flow-utility__link" href={withLocale(locale, '/contact')}>
                {copy.processUtility.linkLabel}
              </a>
            </div>
          </div>
        </Container>
      </section>

      <section className="section section--alt">
        <Container variant="wide">
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

      {/* Installment & Transfer Cost Guide (TH-prioritized, but visible to all) */}
      <section className="section">
        <Container variant="wide">
          <div className="section-header">
            <h2 className="section-title">
              {copy.reference.title}
            </h2>
            <p className="section-subtitle">
              {copy.reference.subtitle}
            </p>
          </div>

          <div className="grid grid-2 buy-reference-grid">
            <div className="card buy-reference-card buy-reference-card--installment">
              <h3 className="card-title">
                {copy.reference.installmentTitle}
              </h3>
                <table className="info-table buy-reference-card__table">
                  <thead>
                    <tr>
                      <th>{copy.reference.phaseHeader}</th>
                      <th>{copy.reference.conditionHeader}</th>
                      <th>{copy.reference.percentageHeader}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{copy.reference.bookingLabel}</td>
                      <td>{copy.reference.bookingCondition}</td>
                      <td>฿50,000–200,000</td>
                    </tr>
                    <tr>
                      <td>{copy.reference.contractLabel}</td>
                      <td>{copy.reference.contractCondition}</td>
                      <td>20–30%</td>
                    </tr>
                    <tr>
                      <td>{copy.reference.constructionLabel}</td>
                      <td>{copy.reference.constructionCondition}</td>
                      <td>30–40%</td>
                    </tr>
                    <tr>
                      <td>{copy.reference.transferLabel}</td>
                      <td>{copy.reference.transferCondition}</td>
                      <td>30–40%</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-caption buy-reference-card__caption">
                  {copy.reference.installmentCaption}
                </p>
            </div>

            <div className="card buy-reference-card buy-reference-card--closing">
              <h3 className="card-title">
                {copy.reference.transferTitle}
              </h3>
                <table className="info-table buy-reference-card__table">
                  <thead>
                    <tr>
                      <th>{copy.reference.itemHeader}</th>
                      <th>{copy.reference.rateHeader}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{copy.reference.transferFeeLabel}</td>
                      <td>2%</td>
                    </tr>
                    <tr>
                      <td>{copy.reference.specificBusinessTaxLabel}</td>
                      <td>3.3%</td>
                    </tr>
                    <tr>
                      <td>{copy.reference.stampDutyLabel}</td>
                      <td>0.5%</td>
                    </tr>
                    <tr>
                      <td>{copy.reference.mortgageRegistrationLabel}</td>
                      <td>1%</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-caption buy-reference-card__caption">
                  {copy.reference.transferCaption}
                </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container variant="wide">
          <div className="section-header">
            <h2 className="section-title">{dict.buy.legalTitle}</h2>
            <p className="section-subtitle">{dict.buy.legalSubtitle}</p>
          </div>

          <ul className="bullet-list buy-legal-list">
            {dict.buy.legalBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>

          <div className="buy-flow-utility buy-flow-utility--legal mt-6" aria-label={copy.legalUtility.ariaLabel}>
            <div className="buy-flow-utility__text">
              {copy.legalUtility.body}
            </div>
            <div className="buy-flow-utility__links">
              <a className="buy-flow-utility__link" href={withLocale(locale, '/contact')}>
                {dict.cta.speakToAdvisor}
              </a>
              <a className="buy-flow-utility__link" href={withLocale(locale, '/invest')}>
                {dict.cta.exploreInvestment}
              </a>
            </div>
          </div>
        </Container>
      </section>

      <section className="section section--alt">
        <Container variant="wide">
          <div className="section-header">
            <h2 className="section-title">{dict.buy.featuredTitle}</h2>
            <p className="section-subtitle">{dict.buy.featuredSubtitle}</p>
          </div>

          {featuredItems.length ? (
            <>
              <div className="buy-scan-note buy-scan-note--cards" aria-label={copy.listingScan.ariaLabel}>
                <p className="buy-scan-note__eyebrow">
                  {copy.listingScan.eyebrow}
                </p>
                <p className="buy-scan-note__body">
                  {copy.listingScan.body}
                </p>
              </div>
              <ListingGrid items={featuredItems} />
              <div className="buy-flow-utility buy-flow-utility--shortlist mt-6" aria-label={copy.shortlistUtility.ariaLabel}>
                <div className="buy-flow-utility__text">
                  {hiddenItemCount > 0
                    ? applyCountTemplate(copy.shortlistUtility.moreOptionsTemplate, hiddenItemCount)
                    : copy.shortlistUtility.fallbackBody}
                </div>
                <div className="buy-flow-utility__links">
                  <a className="buy-flow-utility__link" href={withLocale(locale, '/shortlist')}>
                    {copy.shortlistUtility.linkLabel}
                  </a>
                </div>
              </div>
            </>
          ) : (
            <EmptyStateCard
              title={dict.advisory.noPublishedDataTitle}
              body={dict.advisory.noPublishedDataBody}
              action={
                <a className="btn btn-secondary" href={withLocale(locale, '/contact')}>
                  {dict.cta.speakToAdvisor}
                </a>
              }
            />
          )}
        </Container>
      </section>

      <section className="section section--cta buy-closing-cta-section">
        <Container variant="wide">
          <div className="cta-panel buy-closing-cta-panel">
            <div className="buy-closing-cta-panel__copy">
              <p className="buy-closing-cta-panel__eyebrow">{copy.closing.eyebrow}</p>
              <h2 className="cta-title">
                {copy.closing.title}
              </h2>
              <p className="cta-body">{copy.closing.body}</p>
              <p className="buy-closing-cta-panel__note">{copy.closing.note}</p>
            </div>
            <div className="cta-panel__form buy-closing-cta-panel__form">
              <LeadForm
                heading={copy.form.heading}
                description={copy.form.description}
                defaultPurpose="buy"
                defaultMessage={copy.form.defaultMessage}
              />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

