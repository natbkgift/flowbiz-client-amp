'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { API_BASE } from '../_shared/api';
import type { CompanyInfoItem, CompanyListResponse } from '../_shared/types';

export default function PublicCompanyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CompanyInfoItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/v1/company`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        return (await res.json()) as CompanyListResponse;
      })
      .then((data) => {
        setItems(Array.isArray(data.data) ? data.data : []);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setError('Unable to load company info');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Company</h1>
        <p className="text-slate-600">Learn more about us.</p>
      </header>

      {(() => {
        if (loading) return <p>Loading...</p>;
        if (error) return <p className="text-red-600">{error}</p>;
        if (items.length === 0) return <p>No company sections found</p>;

        return (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <Link prefetch={false}
                key={item.id}
                href={`/public/company/${item.slug}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-5"
              >
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="text-sm text-slate-600 mt-1">/{item.slug}</p>
              </Link>
            ))}
          </section>
        );
      })()}
    </main>
  );
}
