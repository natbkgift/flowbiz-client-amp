import type { Metadata } from 'next';

import { ListingGrid } from '../../../components/listing/ListingGrid';
import { Container } from '../../../components/layout/Container';
import { fetchProperties } from '../../_lib/public-api-server';

export const metadata: Metadata = {
  title: 'Rent | Asset Management Property',
  description: 'Browse properties for rent in Pattaya.',
};

export default async function RentPage() {
  const res = await fetchProperties({ type: 'rent', limit: 60, sort: 'newest' });

  return (
    <main className="section" id="main-content">
      <Container>
        <ListingGrid items={res.data ?? []} />
      </Container>
    </main>
  );
}
