
import { SellerForm } from '@/components/forms/SellerForm';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs } from '@/app/_lib/public-advisory';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';

export const revalidate = 300;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'sell', dict.sell.eyebrow, dict.sell.metaDescription, dict.brand.name);
}

export default async function SellPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const advisoryLabels = getAdvisoryLabels(locale);
  const advisoryProofs = getAdvisoryProofs(dict, 2);
  const sellProofs = [dict.sell.reviewProof, dict.sell.followUpProof, ...advisoryProofs].slice(0, 4);

  return (
    <main id="main-content" className="page-template--narrative sell-page decision-page decision-page--confidence">
      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: dict.sell.eyebrow, href: `/${locale}/sell` },
        ]}
      />
      <PublicAdvisoryHero
        eyebrow={dict.sell.eyebrow}
        title={dict.sell.headline}
        subtitle={dict.sell.subhead}
        proofs={sellProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: dict.sell.advisorySignals.bestForTitle,
            body: dict.sell.advisorySignals.bestForBody,
            icon: 'users',
          },
          {
            kicker: dict.advisory.nextStep,
            title: dict.sell.advisorySignals.nextStepTitle,
            body: dict.sell.advisorySignals.nextStepBody,
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: dict.sell.advisorySignals.trustTitle,
            body: dict.sell.advisorySignals.trustBody,
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: '#seller-form',
          label: dict.sell.primaryAction,
          eventPayload: { cta: 'seller_brief', from: 'sell_hero' },
        }}
        secondaryAction={{
          href: '#seller-process',
          label: dict.sell.secondaryAction,
          eventPayload: { cta: 'seller_process', from: 'sell_hero' },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict, dict.sell.whatsAppMessage),
          label: dict.cta.whatsapp,
        }}
        supportNote={dict.sell.supportNote}
      />

      <section className="section" id="seller-process">
        <Container>
          <div className="split">
            <aside className="split__aside">
              <h2 className="section-title">{dict.sell.whatHappensNext}</h2>
              <p className="section-subtitle mb-4">{dict.sell.whatHappensIntro}</p>
              <ul className="bullet-list">
                {dict.sell.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </aside>

            <div className="split__main" id="seller-form">
              <p className="text-[var(--color-text-secondary)] mb-4">{dict.sell.formIntro}</p>
              <SellerForm heading={dict.sell.formHeading} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}


