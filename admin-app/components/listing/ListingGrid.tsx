'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import type { PropertyListItem } from '../../app/public/_shared/types';
import { PropertyCard } from '../cards/PropertyCard';
import { SidebarFilter } from './SidebarFilter';
import { IconFilter } from '../icons/SvgIcons';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname } from '../../app/_lib/i18n/routing';
import { ShortlistStateHydrator } from '../shortlist/ShortlistStateHydrator';
import { PublicChip } from '../public/PublicChip';

type SortKey = 'newest' | 'price_asc' | 'price_desc';

export function ListingGrid({ items }: { items: PropertyListItem[] }) {
  const [filtered, setFiltered] = useState<PropertyListItem[]>(items);
  const [sort, setSort] = useState<SortKey>('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [activeFilterSummary, setActiveFilterSummary] = useState<string[]>([]);
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null);
  const wasFiltersOpenRef = useRef(false);

  const pathname = usePathname() ?? '/';
  const locale = localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;

  const handleFilterApply = useCallback((next: PropertyListItem[], count: number, summary: string[]) => {
    setFiltered(next);
    setActiveFilterCount(count);
    setActiveFilterSummary(summary);
  }, []);

  useEffect(() => {
    if (wasFiltersOpenRef.current && !filtersOpen) {
      filterTriggerRef.current?.focus();
    }

    wasFiltersOpenRef.current = filtersOpen;
  }, [filtersOpen]);

  const sorted = useMemo(() => {
    const out = [...filtered];
    if (sort === 'price_asc') out.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price_desc') out.sort((a, b) => Number(b.price) - Number(a.price));
    return out;
  }, [filtered, sort]);
  const sortLabel = sort === 'newest'
    ? dict.listing.newest
    : sort === 'price_asc'
      ? dict.listing.priceLowToHigh
      : dict.listing.priceHighToLow;
  const headerSummaryChips = [
    locale === 'th' ? `จัดเรียง: ${sortLabel}` : `Sort: ${sortLabel}`,
    ...activeFilterSummary,
  ];
  const filterTriggerMeta = activeFilterSummary.length
    ? `${activeFilterSummary.join(' • ')} • ${sortLabel}`
    : locale === 'th'
      ? `ยังไม่ได้ใช้ตัวกรอง • ${sortLabel}`
      : `No filters applied • ${sortLabel}`;

  return (
    <>
      <ShortlistStateHydrator locale={locale} />

      <button
        ref={filterTriggerRef}
        type="button"
        className="listing-filter-trigger mobile-only mb-6"
        onClick={() => setFiltersOpen(true)}
        aria-controls="buy-filter-drawer"
        aria-expanded={filtersOpen}
      >
        <span className="listing-filter-trigger__label">
          <IconFilter size="sm" /> {dict.listing.filtersAndSort}{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </span>
        <span className="listing-filter-trigger__meta">{filterTriggerMeta}</span>
      </button>

      <div className="listing-layout">
        <SidebarFilter
          items={items}
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          onApply={handleFilterApply}
        />

        <div>
          <div className="results-header">
            <div className="results-header__intro">
              <div className="results-count">{sorted.length} {dict.listing.results}</div>
              <p className="results-header__note">
                {locale === 'th'
                  ? 'สแกนการ์ดก่อน เปิดรายละเอียดเมื่อยูนิตนั้นผ่าน first pass แล้วค่อยบันทึกลง shortlist'
                  : 'Scan the cards first. Open details when a unit survives the first pass, then save it to the shortlist.'}
              </p>
              <div className="results-header__summary" aria-label={locale === 'th' ? 'สรุปผลลัพธ์ปัจจุบัน' : 'Current result summary'}>
                <div className="results-header__summary-chips">
                  {headerSummaryChips.map((chip) => (
                    <PublicChip key={chip} className="results-header__summary-chip" size="sm">
                      {chip}
                    </PublicChip>
                  ))}
                </div>
              </div>
            </div>
            <div className="results-header__controls pattern-inline-controls">
              <label className="form-label form-label--compact">{dict.listing.sort}</label>
              <select
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
            <div className="grid grid-3" role="list" aria-label={dict.listing.results}>
              {sorted.map((p) => (
                <PropertyCard key={p.id} item={p} dict={dict} locale={locale} />
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
