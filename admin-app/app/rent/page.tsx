import type { Metadata } from 'next';

import { PropertyGrid } from '../_lib/public-components';
import { fetchProperties } from '../_lib/public-api';

export const metadata: Metadata = {
  title: 'Rent Properties | AMP Pattaya',
  description: 'Browse condos and villas for rent in Pattaya.',
};

export default async function RentPage() {
  const res = await fetchProperties({ type: 'rent', limit: 60, sort: 'newest' });

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Rent</h1>
        <p className="text-slate-600">Latest rental listings.</p>
      </header>

      <PropertyGrid items={res.data ?? []} />
    </main>
  );
}
