'use client';

import { useMemo, useState } from 'react';

import type { PropertyListItem } from '../../app/public/_shared/types';
import { PropertyCard } from '../cards/PropertyCard';
import { SidebarFilter } from './SidebarFilter';

type SortKey = 'newest' | 'price_asc' | 'price_desc';

export function ListingGrid({ items }: { items: PropertyListItem[] }) {
  const [filtered, setFiltered] = useState<PropertyListItem[]>(items);
  const [sort, setSort] = useState<SortKey>('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const sorted = useMemo(() => {
    const out = [...filtered];
    if (sort === 'price_asc') out.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price_desc') out.sort((a, b) => Number(b.price) - Number(a.price));
    return out;
  }, [filtered, sort]);

  return (
    <>
      <button
        type="button"
        className="btn btn-primary mobile-only"
        style={{ width: '100%', marginBottom: 24 }}
        onClick={() => setFiltersOpen(true)}
      >
        🔍 Filters & Sort
      </button>

      <div className="listing-layout">
        <SidebarFilter
          items={items}
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          onChange={(next) => setFiltered(next)}
        />

        <div>
          <div className="results-header">
            <div className="results-count">{sorted.length} Results</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 14, color: 'var(--color-gray-600)' }}>Sort:</label>
              <select
                className="form-select"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
              </select>
            </div>
          </div>

          {sorted.length ? (
            <div className="grid grid-3">
              {sorted.map((p) => (
                <PropertyCard key={p.id} item={p} />
              ))}
            </div>
          ) : (
            <p>No properties found</p>
          )}
        </div>
      </div>
    </>
  );
}
