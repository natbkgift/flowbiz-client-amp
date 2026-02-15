'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/api';

type PropertyListItem = {
  id: string;
  source_id: string;
  title: string;
  type: 'new' | 'resale' | 'rent' | string;
  price: number;
  city: string;
  images: string[] | null;
  status: string;
  slug: string | null;
};

type PropertyListResponse = {
  data: PropertyListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

const SORT_WHITELIST = ['newest', 'oldest', 'price_asc', 'price_desc'] as const;
type SortValue = (typeof SORT_WHITELIST)[number];

export default function PublicPropertiesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<PropertyListItem[]>([]);
  const [page, setPage] = useState(1);
  const limit = 12;
  const [total, setTotal] = useState(0);

  const [type, setType] = useState<string>('');
  const [sort, setSort] = useState<SortValue>('newest');

  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');

  const safeSort: SortValue = useMemo(() => {
    return SORT_WHITELIST.includes(sort) ? sort : 'newest';
  }, [sort]);

  const hasPrev = page > 1;
  const hasNext = page * limit < total;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    params.set('sort', safeSort);
    if (type) params.set('type', type);
    if (search) params.set('search', search);

    fetch(`${API_BASE}/v1/properties?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        return (await res.json()) as PropertyListResponse;
      })
      .then((data) => {
        setItems(Array.isArray(data.data) ? data.data : []);
        setTotal(typeof data.meta?.total === 'number' ? data.meta.total : 0);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setError('Unable to load properties');
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [limit, page, safeSort, search, type]);

  function onApplySearch() {
    setPage(1);
    setSearch(searchDraft.trim());
  }

  function onChangeType(nextType: string) {
    setPage(1);
    setType(nextType);
  }

  function onChangeSort(nextSort: string) {
    setPage(1);
    if (SORT_WHITELIST.includes(nextSort as SortValue)) {
      setSort(nextSort as SortValue);
    }
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Properties</h1>
        <p className="text-slate-600">Browse available listings.</p>
      </header>

      <section className="flex flex-col md:flex-row gap-3">
        <select
          className="border rounded px-3 py-2 text-sm"
          value={type}
          onChange={(e) => onChangeType(e.target.value)}
        >
          <option value="">All types</option>
          <option value="new">New</option>
          <option value="resale">Resale</option>
          <option value="rent">Rent</option>
        </select>

        <select
          className="border rounded px-3 py-2 text-sm"
          value={safeSort}
          onChange={(e) => onChangeSort(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>

        <div className="flex gap-2 flex-1">
          <input
            className="border rounded px-3 py-2 text-sm flex-1"
            placeholder="Search title, city, address"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onApplySearch();
            }}
          />
          <button
            className="bg-slate-900 text-white rounded px-4 py-2 text-sm"
            onClick={onApplySearch}
          >
            Search
          </button>
        </div>
      </section>

      {loading ? <p>Loading...</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

      {!loading && !error && items.length === 0 ? <p>No properties found</p> : null}

      {!loading && !error && items.length > 0 ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((p) => {
            const thumbnail = p.images?.[0] ?? null;
            return (
              <Link
                key={p.id}
                href={`/public/properties/${p.id}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden"
              >
                {thumbnail ? (
                  <img src={thumbnail} alt={p.title} className="h-44 w-full object-cover" />
                ) : (
                  <div className="h-44 w-full bg-slate-200" />
                )}
                <div className="p-4 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold leading-snug line-clamp-2">{p.title}</h2>
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {p.type}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-slate-900">
                    {Number(p.price).toLocaleString()} THB
                  </p>
                  <p className="text-sm text-slate-600">{p.city}</p>
                </div>
              </Link>
            );
          })}
        </section>
      ) : null}

      <section className="flex items-center justify-between text-sm">
        <span className="text-slate-600">Total: {total}</span>
        <div className="flex items-center gap-3">
          <button
            className="underline disabled:opacity-40"
            disabled={!hasPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span>Page {page}</span>
          <button
            className="underline disabled:opacity-40"
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </section>
    </main>
  );
}
