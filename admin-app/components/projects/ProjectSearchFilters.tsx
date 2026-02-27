'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname } from '../../app/_lib/i18n/routing';
import { trackEvent } from '../../lib/analytics';

export type ProjectSortOption = 'newest' | 'a-z' | 'price-asc' | 'price-desc';

export type ProjectFilterOption = {
    value: string;
    label: string;
};

type ProjectSearchFiltersProps = {
    areaOptions: ProjectFilterOption[];
    developerOptions: ProjectFilterOption[];
    statusOptions: ProjectFilterOption[];
    activeSearch: string;
    activeArea: string;
    activeStatus: string;
    activeDeveloper: string;
    activeSort: ProjectSortOption;
};

export function ProjectSearchFilters({
    areaOptions,
    developerOptions,
    statusOptions,
    activeSearch,
    activeArea,
    activeStatus,
    activeDeveloper,
    activeSort,
}: ProjectSearchFiltersProps) {
    const router = useRouter();
    const pathname = usePathname() ?? '/';
    const searchParams = useSearchParams();

    const locale = localeFromPathname(pathname);
    const dict = locale === 'th' ? th : en;

    const [search, setSearch] = useState(activeSearch);
    const [area, setArea] = useState(activeArea);
    const [status, setStatus] = useState(activeStatus);
    const [developer, setDeveloper] = useState(activeDeveloper);
    const [sort, setSort] = useState<ProjectSortOption>(activeSort);

    useEffect(() => {
        setSearch(activeSearch);
        setArea(activeArea);
        setStatus(activeStatus);
        setDeveloper(activeDeveloper);
        setSort(activeSort);
    }, [activeArea, activeDeveloper, activeSearch, activeSort, activeStatus, searchParams]);

    const updateUrl = useCallback(
        (
            next: {
                search?: string;
                area?: string;
                status?: string;
                developer?: string;
                sort?: ProjectSortOption;
                page?: number;
            },
            eventMeta?: { action: string; value?: string }
        ) => {
            const params = new URLSearchParams(searchParams?.toString() ?? '');

            const newSearch = next.search ?? search;
            const newArea = next.area ?? area;
            const newStatus = next.status ?? status;
            const newDeveloper = next.developer ?? developer;
            const newSort = next.sort ?? sort;
            const newPage = next.page ?? 1;

            if (newSearch.trim()) params.set('search', newSearch.trim());
            else params.delete('search');

            if (newArea) params.set('area', newArea);
            else params.delete('area');

            if (newStatus) params.set('status', newStatus);
            else params.delete('status');

            if (newDeveloper) params.set('developer', newDeveloper);
            else params.delete('developer');

            if (newSort !== 'newest') params.set('sort', newSort);
            else params.delete('sort');

            if (newPage > 1) params.set('page', String(newPage));
            else params.delete('page');

            if (eventMeta) {
                void trackEvent('cta_click', pathname, {
                    cta: 'projects_filter',
                    from: 'projects_listing',
                    action: eventMeta.action,
                    value: eventMeta.value ?? null,
                });
            }

            const qs = params.toString();
            router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        },
        [area, developer, pathname, router, search, searchParams, sort, status]
    );

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        updateUrl({ search, page: 1 }, { action: 'search_submit', value: search.trim() || 'all' });
    }

    function handleSortChange(nextSort: ProjectSortOption) {
        setSort(nextSort);
        updateUrl({ sort: nextSort, page: 1 }, { action: 'sort_change', value: nextSort });
    }

    function clearAll() {
        setSearch('');
        setArea('');
        setStatus('');
        setDeveloper('');
        setSort('newest');
        updateUrl({ search: '', area: '', status: '', developer: '', sort: 'newest', page: 1 }, { action: 'reset' });
    }

    return (
        <form onSubmit={onSubmit} className="mb-6 rounded-xl bg-[var(--color-surface)] p-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
                <input
                    type="search"
                    className="form-input lg:col-span-2"
                    placeholder={locale === 'th' ? 'ค้นหาชื่อโครงการ...' : 'Search projects...'}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label={locale === 'th' ? 'ค้นหาโครงการ' : 'Search projects'}
                />

                <select
                    className="form-input"
                    aria-label={locale === 'th' ? 'เลือกพื้นที่' : 'Filter by area'}
                    value={area}
                    onChange={(e) => {
                        const next = e.target.value;
                        setArea(next);
                        updateUrl({ area: next, page: 1 }, { action: 'area_change', value: next || 'all' });
                    }}
                >
                    <option value="">{locale === 'th' ? 'ทุกพื้นที่' : 'All areas'}</option>
                    {areaOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>

                <select
                    className="form-input"
                    aria-label={locale === 'th' ? 'เลือกผู้พัฒนาโครงการ' : 'Filter by developer'}
                    value={developer}
                    onChange={(e) => {
                        const next = e.target.value;
                        setDeveloper(next);
                        updateUrl({ developer: next, page: 1 }, { action: 'developer_change', value: next || 'all' });
                    }}
                >
                    <option value="">{locale === 'th' ? 'ทุกผู้พัฒนา' : 'All developers'}</option>
                    {developerOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>

                <select
                    className="form-input"
                    aria-label={locale === 'th' ? 'เลือกสถานะโครงการ' : 'Filter by status'}
                    value={status}
                    onChange={(e) => {
                        const next = e.target.value;
                        setStatus(next);
                        updateUrl({ status: next, page: 1 }, { action: 'status_change', value: next || 'all' });
                    }}
                >
                    <option value="">{locale === 'th' ? 'ทุกสถานะ' : 'All statuses'}</option>
                    {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>

                <select
                    className="form-input"
                    aria-label={locale === 'th' ? 'เรียงลำดับโครงการ' : 'Sort projects'}
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value as ProjectSortOption)}
                >
                    <option value="newest">{locale === 'th' ? 'ล่าสุด' : 'Newest'}</option>
                    <option value="a-z">{locale === 'th' ? 'ชื่อ: ก - ฮ' : 'Name: A - Z'}</option>
                    <option value="price-asc">{locale === 'th' ? 'ราคา: ต่ำไปสูง' : 'Price: Low to High'}</option>
                    <option value="price-desc">{locale === 'th' ? 'ราคา: สูงไปต่ำ' : 'Price: High to Low'}</option>
                </select>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                <button type="submit" className="btn btn-primary">
                    {locale === 'th' ? 'ใช้ตัวกรอง' : 'Apply filters'}
                </button>
                <button type="button" className="btn btn-tertiary" onClick={clearAll}>
                    {locale === 'th' ? 'ล้างทั้งหมด' : 'Clear all'}
                </button>
            </div>
        </form>
    );
}
