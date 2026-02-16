import type { Metadata } from 'next';

import { PropertyGrid } from '../_lib/public-components';
import { fetchProperties } from '../_lib/public-api';

export const metadata: Metadata = {
  title: 'Buy Properties | AMP Pattaya',
  description: 'Browse resale properties for sale in Pattaya.',
};

export default async function BuyPage() {
  const res = await fetchProperties({ type: 'resale', limit: 60, sort: 'newest' });

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Buy</h1>
        <p className="text-slate-600">Latest resale listings.</p>
      </header>

      <PropertyGrid items={res.data ?? []} />
    </main>
  );
}
