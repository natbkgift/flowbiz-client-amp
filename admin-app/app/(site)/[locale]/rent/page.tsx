import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ListingGrid } from '@/components/listing/ListingGrid';
import { LeadForm } from '@/components/forms/LeadForm';
import { fetchProperties } from '@/app/_lib/public-api-server';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
 

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'rent', dict.nav.live, dict.home.pathLive.desc, dict.brand.name);
}

export default async function RentPage({ params }: { params: { locale: string } }) {
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
        <Container>
          <h1 className="headline">{dict.rent.heroTitle}</h1>
          <p className="subhead">{dict.rent.heroSub}</p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 className="section-title mb-2">{dict.rent.areaTitle}</h2>
          <p className="text-[var(--color-text-secondary)]">{dict.rent.areaDesc}</p>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <h2 className="section-title mb-4">{dict.rent.featuredTitle}</h2>
          <ListingGrid items={res.data ?? []} />
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 className="section-title mb-2">{dict.rent.includedTitle}</h2>
          <p className="text-[var(--color-text-secondary)]">{dict.rent.includedDesc}</p>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <h2 className="section-title mb-2">{dict.rent.trustTitle}</h2>
          <p className="text-[var(--color-text-secondary)]">{dict.rent.trustDesc}</p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 className="section-title mb-2">{dict.rent.faqTitle}</h2>
          <p className="text-[var(--color-text-secondary)]">{dict.rent.faqDesc}</p>
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <h2 className="section-title mb-3">{dict.rent.formTitle}</h2>
          <LeadForm defaultMessage={dict.rent.formDefault} />
        </Container>
      </section>
    </main>
  );
}
