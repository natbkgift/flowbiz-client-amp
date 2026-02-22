'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname } from '../../app/_lib/i18n/routing';

export type ProjectSortOption = 'a-z' | 'price-asc' | 'price-desc';

export function ProjectSearchFilters() {
    const router = useRouter();
    const pathname = usePathname() ?? '/';
    const searchParams = useSearchParams();

    const locale = localeFromPathname(pathname);
    const dict = locale === 'th' ? th : en;

    const [search, setSearch] = useState(searchParams?.get('search') ?? '');
    const [sort, setSort] = useState<ProjectSortOption>((searchParams?.get('sort') as ProjectSortOption) ?? 'a-z');

    // Sync state with URL manually if user navigates back/forward
    useEffect(() => {
        setSearch(searchParams?.get('search') ?? '');
        setSort((searchParams?.get('sort') as ProjectSortOption) ?? 'a-z');
    }, [searchParams]);

    const updateUrl = useCallback(
        (newSearch: string, newSort: ProjectSortOption) => {
            const params = new URLSearchParams(searchParams?.toString() ?? '');
            if (newSearch.trim()) params.set('search', newSearch.trim());
            else params.delete('search');

            if (newSort !== 'a-z') params.set('sort', newSort);
            else params.delete('sort');

            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [pathname, router, searchParams]
    );

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        updateUrl(search, sort);
    }

    function handleSortChange(nextSort: ProjectSortOption) {
        setSort(nextSort);
        updateUrl(search, nextSort);
    }

    return (
        <form onSubmit={onSubmit} className="flex flex-col md:flex-row gap-3 mb-6 bg-[var(--color-surface)] p-4 rounded-xl">
            <div className="flex-1 flex gap-2">
                <input
                    type="search"
                    className="form-input flex-1"
                    placeholder={locale === 'th' ? 'ค้นหาชื่อโครงการ...' : 'Search projects...'}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                    {locale === 'th' ? 'ค้นหา' : 'Search'}
                </button>
            </div>

            <div className="md:w-64">
                <select
                    className="form-input w-full"
                    aria-label="Sort projects"
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value as ProjectSortOption)}
                >
                    <option value="a-z">{locale === 'th' ? 'ชื่อ: ก - ฮ' : 'Name: A - Z'}</option>
                    <option value="price-asc">{locale === 'th' ? 'ราคา: ต่ำไปสูง' : 'Price: Low to High'}</option>
                    <option value="price-desc">{locale === 'th' ? 'ราคา: สูงไปต่ำ' : 'Price: High to Low'}</option>
                </select>
            </div>
        </form>
    );
}
