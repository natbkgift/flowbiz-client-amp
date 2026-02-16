import type { Metadata } from 'next';

import { ListingGrid } from '../../../components/listing/ListingGrid';
import { LeadForm } from '../../../components/forms/LeadForm';
import { Container } from '../../../components/layout/Container';
import { fetchProperties } from '../../_lib/public-api-server';

export const metadata: Metadata = {
  title: 'Buy | Asset Management Property',
  description: 'Browse properties for sale in Pattaya.',
};

export default async function BuyPage() {
  const res = await fetchProperties({ type: 'resale', limit: 60, sort: 'newest' });

  return (
    <main id="main-content">
      <section className="hero">
        <Container>
          <h1>Buying Property in Thailand Isn&apos;t Like Back Home</h1>
          <p className="hero-subtitle">Licensed Pattaya agency • clear process • real listings</p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 style={{ marginBottom: 16 }}>Browse Listings</h2>
          <ListingGrid items={res.data ?? []} />
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 style={{ marginBottom: 8 }}>Trust Signals</h2>
          <p style={{ color: 'var(--color-gray-600)' }}>
            We help you avoid common pitfalls: unclear fees, missing documents, and bait-and-switch units.
          </p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 style={{ marginBottom: 12 }}>Request Shortlist + Viewing Plan</h2>
          <LeadForm defaultMessage="I want to buy in Pattaya. My budget and preferred areas are..." />
        </Container>
      </section>
    </main>
  );
}
