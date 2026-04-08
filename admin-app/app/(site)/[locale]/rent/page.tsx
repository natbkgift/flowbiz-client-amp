import dynamic from 'next/dynamic';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { fetchProperties } from '@/app/_lib/public-api-server';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';

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
  return makePageMetadata(locale, 'rent', dict.nav.live, dict.home.pathLive.desc, dict.brand.name);
}

export default async function RentPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

  let res: Awaited<ReturnType<typeof fetchProperties>>;
  try {
    res = await fetchProperties({ type: 'rent', limit: 60, sort: 'newest' });
  } catch {
    res = { data: [], meta: { page: 1, limit: 60, total: 0 } };  // graceful degradation
  }

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
            { label: dict.nav.home, href: `/${locale}` },
          { label: dict.nav.live, href: `/${locale}/rent` },
        ]}
      />
      <section className="hero hero--page">
        <Container variant="wide">
          <h1 className="headline">{dict.rent.heroTitle}</h1>
          <p className="subhead">{dict.rent.heroSub}</p>
        </Container>
      </section>

      <section className="section">
        <Container variant="wide">
          <h2 className="section-title mb-2">{dict.rent.areaTitle}</h2>
          <p className="text-[var(--color-text-secondary)]">{dict.rent.areaDesc}</p>
        </Container>
      </section>

      <section className="section section--alt">
        <Container variant="wide">
          <h2 className="section-title mb-4">{dict.rent.featuredTitle}</h2>
          <ListingGrid items={res.data ?? []} />
        </Container>
      </section>

      <section className="section">
        <Container variant="wide">
          <h2 className="section-title mb-2">{dict.rent.includedTitle}</h2>
          <p className="text-[var(--color-text-secondary)]">{dict.rent.includedDesc}</p>
        </Container>
      </section>

      <section className="section section--alt">
        <Container variant="wide">
          <h2 className="section-title mb-2">{dict.rent.trustTitle}</h2>
          <p className="text-[var(--color-text-secondary)]">{dict.rent.trustDesc}</p>
        </Container>
      </section>

      <section className="section">
        <Container variant="wide">
          <h2 className="section-title mb-2">{dict.rent.faqTitle}</h2>
          <p className="text-[var(--color-text-secondary)]">{dict.rent.faqDesc}</p>
        </Container>
      </section>

      <section className="section section--cta">
        <Container variant="wide">
          <h2 className="section-title mb-3">{dict.rent.formTitle}</h2>
          <LeadForm defaultPurpose="rent" defaultMessage={dict.rent.formDefault} />
        </Container>
      </section>
    </main>
  );
}

