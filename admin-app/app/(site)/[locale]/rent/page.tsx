import dynamic from 'next/dynamic';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { fetchProperties } from '@/app/_lib/public-api-server';
import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs } from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';

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
  return makePageMetadata(locale, 'rent', dict.rent.heroTitle, dict.rent.metaDescription, dict.brand.name);
}

export default async function RentPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const advisoryLabels = getAdvisoryLabels(locale);
  const advisoryProofs = getAdvisoryProofs(dict, 2);

  let res: Awaited<ReturnType<typeof fetchProperties>>;
  try {
    res = await fetchProperties({ type: 'rent', limit: 60, sort: 'newest' });
  } catch {
    res = { data: [], meta: { page: 1, limit: 60, total: 0 } };  // graceful degradation
  }

  // Safety-net: exclude non-Pattaya-area listings, seed/test data, and miscategorised sale listings
  const PATTAYA_CITIES = ['pattaya', 'jomtien', 'na jomtien', 'bang lamung', 'banglamung', 'wongamat', 'pratumnak', 'bang saray', 'huay yai', 'khao talo'];
  const MAX_REASONABLE_MONTHLY_RENT = 500_000; // THB – anything above is almost certainly a sale price
  const pattayaListings = (res.data ?? []).filter((item) => {
    const title = (item.title ?? '').toLowerCase();
    if (title.includes('seed listing') || title.includes('seed content')) return false;
    if (title.includes('for sale')) return false;
    const price = typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : 0;
    if (price > MAX_REASONABLE_MONTHLY_RENT) return false;
    const city = (item.city ?? '').toLowerCase();
    return !city || PATTAYA_CITIES.some((allowed) => city.includes(allowed));
  });

  const rentProofs = [dict.rent.availabilityProof, dict.rent.moveInProof, ...advisoryProofs].slice(0, 4);

  return (
    <main id="main-content" className="page-template--catalogue rent-page decision-page decision-page--confidence">
      <Breadcrumbs
        items={[
            { label: dict.nav.home, href: `/${locale}` },
          { label: dict.nav.live, href: `/${locale}/rent` },
        ]}
      />
      <PublicAdvisoryHero
        eyebrow={dict.rent.eyebrow}
        title={dict.rent.heroTitle}
        subtitle={dict.rent.heroSub}
        proofs={rentProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: dict.rent.advisorySignals.bestForTitle,
            body: dict.rent.advisorySignals.bestForBody,
            icon: 'users',
          },
          {
            kicker: dict.advisory.nextStep,
            title: dict.rent.advisorySignals.nextStepTitle,
            body: dict.rent.advisorySignals.nextStepBody,
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: dict.rent.advisorySignals.trustTitle,
            body: dict.rent.advisorySignals.trustBody,
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: '#rent-brief',
          label: dict.rent.primaryAction,
          eventPayload: { cta: 'rent_brief', from: 'rent_hero' },
        }}
        secondaryAction={{
          href: '#rent-featured',
          label: dict.rent.secondaryAction,
          eventPayload: { cta: 'rent_inventory_scan', from: 'rent_hero' },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict, dict.rent.whatsAppMessage),
          label: dict.cta.whatsapp,
        }}
        supportNote={dict.rent.supportNote}
      />

      <section className="section" id="rent-area-guide">
        <Container variant="wide">
          <h2 className="section-title mb-2">{dict.rent.areaTitle}</h2>
          <p className="text-[var(--color-text-secondary)]">{dict.rent.areaDesc}</p>
        </Container>
      </section>

      <section className="section section--alt" id="rent-featured">
        <Container variant="wide">
          <div className="section-header">
            <h2 className="section-title">{dict.rent.featuredTitle}</h2>
            <p className="section-subtitle">{dict.rent.featuredSubtitle}</p>
          </div>
          <ListingGrid items={pattayaListings} />
        </Container>
      </section>

      <section className="section" id="rent-included">
        <Container variant="wide">
          <h2 className="section-title mb-2">{dict.rent.includedTitle}</h2>
          <p className="text-[var(--color-text-secondary)]">{dict.rent.includedDesc}</p>
        </Container>
      </section>

      <section className="section section--alt" id="rent-trust">
        <Container variant="wide">
          <h2 className="section-title mb-2">{dict.rent.trustTitle}</h2>
          <p className="text-[var(--color-text-secondary)]">{dict.rent.trustDesc}</p>
        </Container>
      </section>

      <section className="section" id="rent-faq">
        <Container variant="wide">
          <h2 className="section-title mb-2">{dict.rent.faqTitle}</h2>
          <p className="text-[var(--color-text-secondary)]">{dict.rent.faqDesc}</p>
        </Container>
      </section>

      <section className="section section--cta" id="rent-brief">
        <Container variant="wide">
          <div className="section-header">
            <h2 className="section-title">{dict.rent.formTitle}</h2>
            <p className="section-subtitle">{dict.rent.formIntro}</p>
          </div>
          <LeadForm defaultPurpose="rent" defaultMessage={dict.rent.formDefault} />
        </Container>
      </section>
    </main>
  );
}

