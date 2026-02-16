import type { Metadata } from 'next';

import { fetchProperties } from '../_lib/public-api-server';
import { PublicListingClient } from '../_lib/public-listing-client';

export const metadata: Metadata = {
  title: 'Rent Properties | AMP Pattaya',
  description: 'Browse condos and villas for rent in Pattaya.',
};

export default async function RentPage() {
  const res = await fetchProperties({ type: 'rent', limit: 60, sort: 'newest' });

  return (
    <PublicListingClient
      title="Rent"
      subtitle="Luxury condos and villas for rent in Pattaya — browse verified local listings."
      items={res.data ?? []}
      initialSort="newest"
    />
  );
}
