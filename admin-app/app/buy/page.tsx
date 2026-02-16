import type { Metadata } from 'next';

import { fetchProperties } from '../_lib/public-api-server';
import { PublicListingClient } from '../_lib/public-listing-client';

export const metadata: Metadata = {
  title: 'Buy Properties | AMP Pattaya',
  description: 'Browse resale properties for sale in Pattaya.',
};

export default async function BuyPage() {
  const res = await fetchProperties({ type: 'resale', limit: 60, sort: 'newest' });

  return (
    <PublicListingClient
      title="Buy"
      subtitle="Premium resale opportunities in Pattaya — explore hand-picked properties."
      items={res.data ?? []}
      initialSort="newest"
    />
  );
}
