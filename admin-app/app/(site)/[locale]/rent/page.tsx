import type { Metadata } from 'next';

import { ListingGrid } from '@/components/listing/ListingGrid';
import { LeadForm } from '@/components/forms/LeadForm';
import { Container } from '@/components/layout/Container';
import { fetchProperties } from '@/app/_lib/public-api-server';

import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const canonical = `/${locale}/rent`;
  return {
    title: `${dict.nav.live} | ${dict.brand.name}`,
    description: dict.home.pathLive.desc,
    alternates: {
      canonical,
      languages: {
        en: '/en/rent',
        th: '/th/rent',
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${dict.nav.live} | ${dict.brand.name}`,
      description: dict.home.pathLive.desc,
      siteName: dict.brand.name,
      locale: locale === 'th' ? 'th_TH' : 'en_US',
    },
  };
}

export default async function RentPage({ params }: { params: { locale: string } }) {
  const res = await fetchProperties({ type: 'rent', limit: 60, sort: 'newest' });

  return (
    <main id="main-content">
      <section className="hero">
        <Container>
          <h1>Find Your Pattaya Rental — No Ghost Listings, No Hidden Fees</h1>
          <p className="hero-subtitle">Fast replies, clear terms, and real availability</p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 style={{ marginBottom: 8 }}>Pattaya Area Guide</h2>
          <p style={{ color: 'var(--color-gray-600)' }}>
            Not sure where to live? Use our quick area guide and tell us your priorities.
          </p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 style={{ marginBottom: 16 }}>Featured Rentals</h2>
          <ListingGrid items={res.data ?? []} />
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 style={{ marginBottom: 8 }}>What&apos;s Included in Every Rental</h2>
          <p style={{ color: 'var(--color-gray-600)' }}>
            Clear move-in requirements • viewing coordination • transparent fees.
          </p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 style={{ marginBottom: 8 }}>Trust Signals</h2>
          <p style={{ color: 'var(--color-gray-600)' }}>
            Local team • fast scheduling • we confirm availability before you waste time.
          </p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 style={{ marginBottom: 8 }}>FAQ</h2>
          <p style={{ color: 'var(--color-gray-600)' }}>
            Typical lease terms, deposits, and timelines — ask anything.
          </p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 style={{ marginBottom: 12 }}>Tell Us What You&apos;re Looking For</h2>
          <LeadForm defaultMessage="I'm looking for a rental in Pattaya. My budget and preferred area are..." />
        </Container>
      </section>
    </main>
  );
}
