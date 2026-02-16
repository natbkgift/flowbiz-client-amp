'use client';

import { useMemo, useState } from 'react';

import type { PropertyListItem } from '../public/_shared/types';
import { PropertyGrid } from './public-components';

type SortKey = 'newest' | 'price_asc' | 'price_desc';

function parseBedroomsFromTitle(title: string): number | null {
  const t = (title || '').trim();
  if (!t) return null;

  if (/\bstudio\b/i.test(t)) return 0;

  // Common patterns: "2BR", "2 BR", "2 Bedroom", "2 Bed".
  const m = t.match(/\b(\d{1,2})\s*(?:br|bed|beds|bedroom|bedrooms)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function PublicListingClient({
  title,
  subtitle,
  items,
  initialSort = 'newest',
}: {
  title: string;
  subtitle: string;
  items: PropertyListItem[];
  initialSort?: SortKey;
}) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>(initialSort);

  const prices = useMemo(
    () => items.map((p) => Number(p.price)).filter((n) => Number.isFinite(n)),
    [items]
  );
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const [priceMin, setPriceMin] = useState<number>(minPrice);
  const [priceMax, setPriceMax] = useState<number>(maxPrice);
  const [bedrooms, setBedrooms] = useState<Set<number>>(new Set());
  const [areas, setAreas] = useState<Set<string>>(new Set());

  const bedroomOptions = useMemo(() => {
    const set = new Set<number>();
    for (const p of items) {
      const b = parseBedroomsFromTitle(p.title);
      if (b != null) set.add(b);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [items]);

  const areaOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of items) {
      const a = (p.city ?? '').trim();
      if (a) set.add(a);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const result = items.filter((p) => {
      const price = Number(p.price);
      if (Number.isFinite(price)) {
        if (price < priceMin || price > priceMax) return false;
      }

      if (bedrooms.size) {
        const b = parseBedroomsFromTitle(p.title);
        if (b == null || !bedrooms.has(b)) return false;
      }

      if (areas.size) {
        const a = (p.city ?? '').trim();
        if (!a || !areas.has(a)) return false;
      }

      return true;
    });

    if (sort === 'price_asc') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === 'price_desc') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    }
    // newest: keep API order (server already requested newest)

    return result;
  }, [areas, bedrooms, items, priceMax, priceMin, sort]);

  function clearFilters() {
    setPriceMin(minPrice);
    setPriceMax(maxPrice);
    setBedrooms(new Set());
    setAreas(new Set());
  }

  return (
    <main className="bg-slate-50">
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {title}{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Listings</span>
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-400/80" />
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-slate-200">{subtitle}</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="lg:hidden rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold"
            onClick={() => setIsFiltersOpen((v) => !v)}
          >
            {isFiltersOpen ? 'Close filters' : 'Filters'}
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-slate-600">Sort</span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          <aside
            className={
              'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ' +
              (isFiltersOpen ? 'block' : 'hidden lg:block')
            }
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
              <button
                type="button"
                className="text-sm font-semibold text-amber-700 hover:text-amber-800"
                onClick={clearFilters}
              >
                Clear
              </button>
            </div>

            <div className="mt-4 space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600">Price (THB)</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className="text-xs text-slate-500">Min</span>
                    <input
                      inputMode="numeric"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={priceMin}
                      onChange={(e) => setPriceMin(Number(e.target.value) || 0)}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-slate-500">Max</span>
                    <input
                      inputMode="numeric"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={priceMax}
                      onChange={(e) => setPriceMax(Number(e.target.value) || 0)}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600">Bedrooms</p>
                {bedroomOptions.length ? (
                  <div className="flex flex-wrap gap-2">
                    {bedroomOptions.map((b) => {
                      const active = bedrooms.has(b);
                      return (
                        <button
                          key={b}
                          type="button"
                          className={
                            'rounded-full px-3 py-1 text-sm border transition ' +
                            (active
                              ? 'border-amber-400 bg-amber-50 text-amber-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-amber-200')
                          }
                          onClick={() => {
                            setBedrooms((prev) => {
                              const next = new Set(prev);
                              if (next.has(b)) next.delete(b);
                              else next.add(b);
                              return next;
                            });
                          }}
                        >
                          {b}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No bedroom data</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600">Area</p>
                {areaOptions.length ? (
                  <div className="space-y-2">
                    {areaOptions.slice(0, 10).map((a) => {
                      const active = areas.has(a);
                      return (
                        <button
                          key={a}
                          type="button"
                          className={
                            'w-full text-left rounded-xl px-3 py-2 text-sm border transition ' +
                            (active
                              ? 'border-amber-400 bg-amber-50 text-amber-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-amber-200')
                          }
                          onClick={() => {
                            setAreas((prev) => {
                              const next = new Set(prev);
                              if (next.has(a)) next.delete(a);
                              else next.add(a);
                              return next;
                            });
                          }}
                        >
                          {a}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No area data</p>
                )}
              </div>
            </div>
          </aside>

          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{filtered.length}</span> properties
            </p>
            <PropertyGrid items={filtered} />
          </div>
        </div>
      </section>
    </main>
  );
}