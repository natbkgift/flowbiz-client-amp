'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { PropertyListItem } from '../../app/public/_shared/types';
import { PropertyCard } from '../cards/PropertyCard';
import { SidebarFilter, type ListingFilters, type ListingFilterOptions } from './SidebarFilter';
import { IconFilter } from '../icons/SvgIcons';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname } from '../../app/_lib/i18n/routing';
import { trackEvent } from '../../lib/analytics';
import { EmptyStateCard } from '../ui/StateBlocks';

type SortKey = 'newest' | 'oldest' | 'price_asc' | 'price_desc';

const PAGE_SIZE = 12;

function firstParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return '';
}

function parsePositiveInt(value: string, fallback: number): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function toSortKey(value: string): SortKey {
  if (value === 'oldest' || value === 'price_asc' || value === 'price_desc') return value;
  return 'newest';
}

function parseNumberInput(value: string): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeLabel(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function statusLabel(status: string, locale: 'en' | 'th'): string {
  if (locale === 'th') {
    if (status === 'active') return 'ใช้งานอยู่';
    if (status === 'published') return 'เผยแพร่แล้ว';
    if (status === 'draft') return 'แบบร่าง';
    if (status === 'archived') return 'เก็บถาวร';
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export type ListingPreset = {
  type?: string;
  status?: string;
};

type ListingGridProps = {
  items: PropertyListItem[];
  projectOptions?: { value: string; label: string }[];
  areaOptions?: { value: string; label: string }[];
  developerOptions?: { value: string; label: string }[];
  preset?: ListingPreset;
  listingSource?: 'buy' | 'rent' | 'investment' | 'marketplace';
};

export function ListingGrid({
  items,
  projectOptions = [],
  areaOptions = [],
  developerOptions = [],
  preset,
  listingSource = 'buy',
}: ListingGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const pathname = usePathname() ?? '/';
  const locale = localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;

  const query = useMemo(() => {
    const search = firstParam(searchParams?.get('search') ?? '').trim();
    const propertyType = firstParam(searchParams?.get('property_type') ?? '').trim();
    const projectId = firstParam(searchParams?.get('project') ?? '').trim();
    const areaId = firstParam(searchParams?.get('area') ?? '').trim();
    const developerId = firstParam(searchParams?.get('developer') ?? '').trim();
    const status = firstParam(searchParams?.get('status') ?? '').trim();
    const beds = firstParam(searchParams?.get('beds') ?? '').trim();
    const baths = firstParam(searchParams?.get('baths') ?? '').trim();
    const minPrice = firstParam(searchParams?.get('min_price') ?? '').trim();
    const maxPrice = firstParam(searchParams?.get('max_price') ?? '').trim();
    const sort = toSortKey(firstParam(searchParams?.get('sort') ?? ''));
    const page = parsePositiveInt(firstParam(searchParams?.get('page') ?? ''), 1);
    return {
      search,
      propertyType,
      projectId,
      areaId,
      developerId,
      status,
      beds,
      baths,
      minPrice,
      maxPrice,
      sort,
      page,
    };
  }, [searchParams]);

  const pushQuery = useCallback(
    (next: Partial<ListingFilters> & { sort?: SortKey; page?: number }, action: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');

      const merged: ListingFilters = {
        search: next.search ?? query.search,
        propertyType: next.propertyType ?? query.propertyType,
        projectId: next.projectId ?? query.projectId,
        areaId: next.areaId ?? query.areaId,
        developerId: next.developerId ?? query.developerId,
        status: next.status ?? query.status,
        beds: next.beds ?? query.beds,
        baths: next.baths ?? query.baths,
        minPrice: next.minPrice ?? query.minPrice,
        maxPrice: next.maxPrice ?? query.maxPrice,
      };
      const sort = next.sort ?? query.sort;
      const page = next.page ?? 1;

      if (merged.search) params.set('search', merged.search); else params.delete('search');
      if (merged.propertyType) params.set('property_type', merged.propertyType); else params.delete('property_type');
      if (merged.projectId) params.set('project', merged.projectId); else params.delete('project');
      if (merged.areaId) params.set('area', merged.areaId); else params.delete('area');
      if (merged.developerId) params.set('developer', merged.developerId); else params.delete('developer');
      if (merged.status) params.set('status', merged.status); else params.delete('status');
      if (merged.beds) params.set('beds', merged.beds); else params.delete('beds');
      if (merged.baths) params.set('baths', merged.baths); else params.delete('baths');
      if (merged.minPrice) params.set('min_price', merged.minPrice); else params.delete('min_price');
      if (merged.maxPrice) params.set('max_price', merged.maxPrice); else params.delete('max_price');
      if (sort !== 'newest') params.set('sort', sort); else params.delete('sort');
      if (page > 1) params.set('page', String(page)); else params.delete('page');

      if (preset?.type) params.set('type', preset.type);
      if (preset?.status) params.set('status', preset.status);

      void trackEvent('cta_click', pathname, {
        cta: 'property_listing_query',
        from: listingSource,
        action,
      });

      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [listingSource, pathname, preset?.status, preset?.type, query, router, searchParams]
  );

  const currentFilters = useMemo<ListingFilters>(
    () => ({
      search: query.search,
      propertyType: query.propertyType,
      projectId: query.projectId,
      areaId: query.areaId,
      developerId: query.developerId,
      status: query.status,
      beds: query.beds,
      baths: query.baths,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
    }),
    [query]
  );

  const dynamicOptions = useMemo(() => {
    const propertyTypes = Array.from(
      new Set(items.map((item) => normalizeLabel(String(item.property_type || item.type || '').toLowerCase())).filter(Boolean))
    ).map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }));

    const statuses = Array.from(
      new Set(items.map((item) => String(item.status || '').toLowerCase()).filter(Boolean))
    ).map((value) => ({ value, label: statusLabel(value, locale) }));

    const bedOptions = Array.from(
      new Set(items.map((item) => item.bedrooms).filter((value): value is number => Number.isFinite(value as number)))
    ).sort((a, b) => a - b);

    const bathOptions = Array.from(
      new Set(items.map((item) => item.bathrooms).filter((value): value is number => Number.isFinite(value as number)))
    ).sort((a, b) => a - b);

    return {
      propertyTypes,
      statuses,
      bedOptions,
      bathOptions,
    };
  }, [items, locale]);

  const filterOptions = useMemo<ListingFilterOptions>(
    () => ({
      propertyTypes: dynamicOptions.propertyTypes,
      projects: projectOptions,
      areas: areaOptions,
      developers: developerOptions,
      statuses: dynamicOptions.statuses,
      bedOptions: dynamicOptions.bedOptions,
      bathOptions: dynamicOptions.bathOptions,
    }),
    [areaOptions, developerOptions, dynamicOptions, projectOptions]
  );

  const filtered = useMemo(() => {
    const search = query.search.toLowerCase();
    const minPrice = parseNumberInput(query.minPrice);
    const maxPrice = parseNumberInput(query.maxPrice);
    const beds = parseNumberInput(query.beds);
    const baths = parseNumberInput(query.baths);

    return items.filter((item) => {
      const itemType = normalizeLabel(String(item.property_type || item.type || '').toLowerCase());
      const itemStatus = String(item.status || '').toLowerCase();
      const itemProject = String(item.project_id || '');
      const itemArea = String(item.area_id || '');
      const itemDeveloper = String(item.developer_id || '');
      const itemBeds = Number(item.bedrooms);
      const itemBaths = Number(item.bathrooms);
      const itemPrice = Number(item.price);

      if (preset?.type && String(item.type || '').toLowerCase() !== preset.type.toLowerCase()) return false;
      if (preset?.status && itemStatus !== preset.status.toLowerCase()) return false;

      if (search) {
        const haystack = [item.title, item.address, item.city, item.view_label, ...(item.tags ?? [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (query.propertyType && itemType !== normalizeLabel(query.propertyType.toLowerCase())) return false;
      if (query.projectId && itemProject !== query.projectId) return false;
      if (query.areaId && itemArea !== query.areaId) return false;
      if (query.developerId && itemDeveloper !== query.developerId) return false;
      if (query.status && itemStatus !== query.status.toLowerCase()) return false;
      if (beds != null && (!Number.isFinite(itemBeds) || itemBeds !== beds)) return false;
      if (baths != null && (!Number.isFinite(itemBaths) || itemBaths !== baths)) return false;
      if (minPrice != null && Number.isFinite(itemPrice) && itemPrice < minPrice) return false;
      if (maxPrice != null && Number.isFinite(itemPrice) && itemPrice > maxPrice) return false;

      return true;
    });
  }, [items, preset?.status, preset?.type, query]);

  const sorted = useMemo(() => {
    const out = [...filtered];
    if (query.sort === 'price_asc') {
      out.sort((a, b) => Number(a.price) - Number(b.price));
      return out;
    }
    if (query.sort === 'price_desc') {
      out.sort((a, b) => Number(b.price) - Number(a.price));
      return out;
    }
    if (query.sort === 'oldest') {
      out.sort((a, b) => (new Date(a.created_at || 0).getTime() || 0) - (new Date(b.created_at || 0).getTime() || 0));
      return out;
    }
    out.sort((a, b) => (new Date(b.created_at || 0).getTime() || 0) - (new Date(a.created_at || 0).getTime() || 0));
    return out;
  }, [filtered, query.sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(query.page, totalPages);
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const applyFilters = useCallback(() => {
    pushQuery(currentFilters, 'apply_filters');
    setFiltersOpen(false);
  }, [currentFilters, pushQuery]);

  const resetFilters = useCallback(() => {
    pushQuery(
      {
        search: '',
        propertyType: '',
        projectId: '',
        areaId: '',
        developerId: '',
        status: preset?.status ?? '',
        beds: '',
        baths: '',
        minPrice: '',
        maxPrice: '',
        sort: 'newest',
        page: 1,
      },
      'reset_filters'
    );
  }, [preset?.status, pushQuery]);

  const updateDraftFilters = useCallback(
    (next: Partial<ListingFilters>) => {
      pushQuery({ ...next, page: 1 }, 'filter_change');
    },
    [pushQuery]
  );

  const goToPage = useCallback(
    (page: number) => {
      pushQuery({ page: Math.min(Math.max(1, page), totalPages) }, 'paginate');
    },
    [pushQuery, totalPages]
  );

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
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          dict={dict}
          filters={currentFilters}
          options={filterOptions}
          onFiltersChange={updateDraftFilters}
          onApply={applyFilters}
          onReset={resetFilters}
        />

        <div>
          <div className="results-header">
            <div className="results-count">{sorted.length.toLocaleString()} {dict.listing.results}</div>
            <div className="flex gap-2 items-center">
              <label htmlFor="sort-select" className="text-sm text-[var(--color-text-secondary)]">{dict.listing.sort}</label>
              <select
                id="sort-select"
                className="form-select"
                value={query.sort}
                onChange={(e) => pushQuery({ sort: e.target.value as SortKey, page: 1 }, 'sort_change')}
              >
                <option value="newest">{dict.listing.newest}</option>
                <option value="oldest">{dict.listing.oldest}</option>
                <option value="price_asc">{dict.listing.priceLowToHigh}</option>
                <option value="price_desc">{dict.listing.priceHighToLow}</option>
              </select>
            </div>
          </div>

          {pageItems.length ? (
            <div className="grid grid-fluid" aria-label={dict.listing.results}>
              {pageItems.map((p) => (
                <PropertyCard key={p.id} item={p} dict={dict} locale={locale} />
              ))}
            </div>
          ) : (
            <EmptyStateCard
              title={dict.listing.noProperties}
              body={dict.errors.tryAgain}
              action={
                <button type="button" className="btn btn-tertiary" onClick={resetFilters}>
                  {dict.filters.clear}
                </button>
              }
            />
          )}

          {sorted.length > 0 ? (
            <nav className="mt-8 flex items-center justify-between" aria-label={dict.listing.paginationLabel}>
              <button
                type="button"
                className={`btn btn-tertiary ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                aria-disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                {dict.listing.previousPage}
              </button>
              <span className="text-sm text-[var(--color-text-muted)]">
                {dict.listing.pageOf.replace('{page}', String(currentPage)).replace('{total}', String(totalPages))}
              </span>
              <button
                type="button"
                className={`btn btn-tertiary ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
                aria-disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                {dict.listing.nextPage}
              </button>
            </nav>
          ) : null}
        </div>
      </div>
    </>
  );
}
