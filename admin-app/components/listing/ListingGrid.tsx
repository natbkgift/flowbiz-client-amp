'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

import type { PropertyListItem } from '../../app/public/_shared/types';
import { PropertyCard } from '../cards/PropertyCard';
import { SidebarFilter } from './SidebarFilter';
import { IconFilter } from '../icons/SvgIcons';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname } from '../../app/_lib/i18n/routing';

type SortKey = 'newest' | 'price_asc' | 'price_desc';

export function ListingGrid({ items }: { items: PropertyListItem[] }) {
  const [filtered, setFiltered] = useState<PropertyListItem[]>(items);
  const [sort, setSort] = useState<SortKey>('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const pathname = usePathname() ?? '/';
  const locale = localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;

  const handleFilterChange = useCallback((next: PropertyListItem[]) => setFiltered(next), []);

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
        className="btn btn-primary mobile-only w-full mb-6"
        onClick={() => setFiltersOpen(true)}
      >
        <IconFilter size="sm" /> {dict.listing.filtersAndSort}
      </button>

      <div className="listing-layout">
        <SidebarFilter
          items={items}
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          onChange={handleFilterChange}
        />

        <div>
          <div className="results-header">
            <div className="results-count">{sorted.length} {dict.listing.results}</div>
            <div className="flex gap-2 items-center">
              <label htmlFor="sort-select" className="text-sm text-[var(--color-text-secondary)]">{dict.listing.sort}</label>
              <select
                id="sort-select"
                className="form-select"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="newest">{dict.listing.newest}</option>
                <option value="price_asc">{dict.listing.priceLowToHigh}</option>
                <option value="price_desc">{dict.listing.priceHighToLow}</option>
              </select>
            </div>
          </div>

          {sorted.length ? (
            <div className="grid grid-fluid" aria-label={dict.listing.results}>
              {sorted.map((p) => (
                <PropertyCard key={p.id} item={p} dict={dict} />
              ))}
            </div>
          ) : (
            <p>{dict.listing.noProperties}</p>
          )}
        </div>
      </div>
    </>
  );
}
