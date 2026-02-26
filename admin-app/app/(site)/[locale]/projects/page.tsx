import type { Metadata } from 'next';
import Link from 'next/link';

import { makeListingPageMetadata } from '@/app/_lib/i18n/metadata';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProjectCard } from '@/components/project/ProjectCard';
import { ProjectSearchFilters } from '@/components/projects/ProjectSearchFilters';
import { EmptyStateCard, InlineStatusMessage } from '@/components/ui/StateBlocks';
import { fetchAreas, fetchDevelopers, fetchProjects } from '@/app/_lib/public-api-server';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale } from '@/app/_lib/i18n/routing';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';

export const revalidate = 300;

type ListingSort = 'newest' | 'a-z' | 'price-asc' | 'price-desc';

const PAGE_SIZE = 12;
const VALID_SORTS: readonly ListingSort[] = ['newest', 'a-z', 'price-asc', 'price-desc'];

function pickQueryValue(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return '';
}

function normalizeSort(value: string): ListingSort {
  return VALID_SORTS.includes(value as ListingSort) ? (value as ListingSort) : 'newest';
}

function normalizePage(value: string): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return makeListingPageMetadata(locale, 'projects', dict.nav.projects, dict.listing.exploreProjectsDesc, dict.brand.name, resolvedSearchParams);
}

export default async function ProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';
  const canonicalUrl = `${siteUrl}/${locale}/projects`;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const querySearchRaw = pickQueryValue(resolvedSearchParams?.search).trim();
  const queryArea = pickQueryValue(resolvedSearchParams?.area).trim();
  const queryStatus = pickQueryValue(resolvedSearchParams?.status).trim();
  const queryDeveloper = pickQueryValue(resolvedSearchParams?.developer).trim();
  const querySort = normalizeSort(pickQueryValue(resolvedSearchParams?.sort));
  const queryPage = normalizePage(pickQueryValue(resolvedSearchParams?.page));
  const querySearch = querySearchRaw.toLowerCase();

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.projects, href: `/${locale}/projects` },
  ];
  const breadcrumbJsonLd = breadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
  );

  let projects: Awaited<ReturnType<typeof fetchProjects>>;
  let areas: Awaited<ReturnType<typeof fetchAreas>> = [];
  let developers: Awaited<ReturnType<typeof fetchDevelopers>> = [];
  let projectsFetchOk = true;
  const [projectsResult, areasResult, developersResult] = await Promise.allSettled([
    fetchProjects({ limit: 200, page: 1, status_filter: queryStatus || 'published' }),
    fetchAreas(),
    fetchDevelopers(),
  ]);

  if (projectsResult.status === 'fulfilled') {
    projects = projectsResult.value;
  } else {
    projectsFetchOk = false;
    projects = [];
  }
  if (areasResult.status === 'fulfilled') areas = areasResult.value;
  if (developersResult.status === 'fulfilled') developers = developersResult.value;

  const areaNameById = new Map(areas.map((a) => [a.id, a.name]));
  const developerNameById = new Map(developers.map((d) => [d.id, d.name]));
  const allStatuses = Array.from(new Set(projects.map((p) => p.status).filter((s): s is string => !!s))).sort();

  const areaOptions = areas
    .map((area) => ({ value: area.id, label: area.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const developerOptions = developers
    .map((developer) => ({ value: developer.id, label: developer.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const statusOptions = allStatuses.map((status) => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
  }));

  let filtered = projects;
  if (querySearch) {
    filtered = filtered.filter((p) => {
      const areaName = p.area_id ? areaNameById.get(p.area_id) ?? '' : '';
      const developerName = p.developer_id ? developerNameById.get(p.developer_id) ?? '' : '';
      return [p.name ?? '', areaName, developerName].join(' ').toLowerCase().includes(querySearch);
    });
  }
  if (queryArea) filtered = filtered.filter((p) => p.area_id === queryArea);
  if (queryDeveloper) filtered = filtered.filter((p) => p.developer_id === queryDeveloper);
  if (queryStatus) filtered = filtered.filter((p) => p.status === queryStatus);

  const sorted = [...filtered].sort((a, b) => {
    if (querySort === 'newest') {
      const at = new Date(a.created_at).getTime() || 0;
      const bt = new Date(b.created_at).getTime() || 0;
      return bt - at || (a.name ?? '').localeCompare(b.name ?? '');
    }
    if (querySort === 'price-asc') {
      const pa = a.starting_price || 0;
      const pb = b.starting_price || 0;
      if (!pa && pb) return 1;
      if (pa && !pb) return -1;
      return pa - pb || (a.name ?? '').localeCompare(b.name ?? '');
    }
    if (querySort === 'price-desc') {
      const pa = a.starting_price || 0;
      const pb = b.starting_price || 0;
      if (!pa && pb) return 1;
      if (pa && !pb) return -1;
      return pb - pa || (a.name ?? '').localeCompare(b.name ?? '');
    }
    return (a.name ?? '').localeCompare(b.name ?? '') || (a.slug ?? '').localeCompare(b.slug ?? '');
  });

  const totalResults = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const currentPage = Math.min(queryPage, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(start, start + PAGE_SIZE);

  const makeHref = (overrides: {
    search?: string;
    area?: string;
    status?: string;
    developer?: string;
    sort?: ListingSort;
    page?: number;
  }) => {
    const params = new URLSearchParams();
    const nextSearch = overrides.search ?? querySearchRaw;
    const nextArea = overrides.area ?? queryArea;
    const nextStatus = overrides.status ?? queryStatus;
    const nextDeveloper = overrides.developer ?? queryDeveloper;
    const nextSort = overrides.sort ?? querySort;
    const nextPage = overrides.page ?? currentPage;

    if (nextSearch) params.set('search', nextSearch);
    if (nextArea) params.set('area', nextArea);
    if (nextStatus) params.set('status', nextStatus);
    if (nextDeveloper) params.set('developer', nextDeveloper);
    if (nextSort !== 'newest') params.set('sort', nextSort);
    if (nextPage > 1) params.set('page', String(nextPage));

    const qs = params.toString();
    return qs ? `/${locale}/projects?${qs}` : `/${locale}/projects`;
  };

  const jsonLd = JSON.stringify(
    [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: dict.nav.projects,
        url: canonicalUrl,
        itemListElement: sorted.slice(0, 20).map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: p.name,
          url: `${siteUrl}/${locale}/projects/${encodeURIComponent(p.slug)}`,
        })),
        isPartOf: {
          '@type': 'WebSite',
          name: dict.brand.name,
          url: siteUrl,
        },
      },
      breadcrumbJsonLd,
    ],
    null,
    0
  );

  return (
    <main className="section" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Breadcrumbs items={breadcrumbItems} />
      <Container>
        <div className="section-header mb-6">
          <h1 className="section-title">{dict.nav.projects}</h1>
          <p className="section-subtitle">
            {projects.length
              ? `${projects.length} ${dict.listing.publishedProjects}`
              : dict.listing.projectsSubtitle}
          </p>
        </div>

        <ProjectSearchFilters
          areaOptions={areaOptions}
          developerOptions={developerOptions}
          statusOptions={statusOptions}
          activeSearch={querySearchRaw}
          activeArea={queryArea}
          activeStatus={queryStatus}
          activeDeveloper={queryDeveloper}
          activeSort={querySort}
        />

        {projectsFetchOk ? (
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
            <p className="section-subtitle mb-0">
              {locale === 'th'
                ? `แสดง ${totalResults.toLocaleString()} โครงการ`
                : `Showing ${totalResults.toLocaleString()} projects`}
            </p>
            <Link
              className="btn btn-secondary"
              href={withLocale(locale, '/contact?topic=project_shortlist')}
              data-amp-event-type="cta_click"
              data-amp-event-payload={JSON.stringify({ cta: 'projects_shortlist', from: 'projects_listing' })}
            >
              {locale === 'th' ? 'ขอคำแนะนำพร้อมชอร์ตลิสต์' : 'Request a curated shortlist'}
            </Link>
          </div>
        ) : null}

        {pageItems.length ? (
          <div className="grid grid-3">
            {pageItems.map((p) => (
              <ProjectCard
                key={p.id}
                name={p.name}
                count={0}
                slug={p.slug}
                locale={locale}
                dict={dict}
                startingPrice={p.starting_price ? Number(p.starting_price) : null}
                coverImage={p.cover_image_url}
                analyticsSource="projects_listing"
              />
            ))}
          </div>
        ) : (
          <>
            {!projectsFetchOk ? (
              <InlineStatusMessage
                tone="error"
                message={locale === 'th'
                  ? 'ไม่สามารถโหลดข้อมูลโปรเจกต์ได้ กรุณาลองใหม่อีกครั้ง'
                  : 'Unable to load projects. Please try again later.'}
              />
            ) : (
              <EmptyStateCard
                title={locale === 'th' ? 'ยังไม่พบโครงการที่ตรงเงื่อนไข' : 'No projects match your filters'}
                body={dict.listing.noProperties}
              />
            )}
          </>
        )}

        {projectsFetchOk && totalPages > 1 ? (
          <nav className="mt-8 flex items-center justify-between" aria-label={locale === 'th' ? 'การแบ่งหน้าโครงการ' : 'Projects pagination'}>
            <Link
              href={makeHref({ page: Math.max(1, currentPage - 1) })}
              className={`btn btn-tertiary ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
              aria-disabled={currentPage <= 1}
              data-amp-event-type="cta_click"
              data-amp-event-payload={JSON.stringify({ cta: 'projects_pagination_prev', from: 'projects_listing', page: currentPage })}
            >
              {locale === 'th' ? 'ก่อนหน้า' : 'Previous'}
            </Link>
            <span className="text-sm text-[var(--color-text-muted)]">
              {locale === 'th'
                ? `หน้า ${currentPage} จาก ${totalPages}`
                : `Page ${currentPage} of ${totalPages}`}
            </span>
            <Link
              href={makeHref({ page: Math.min(totalPages, currentPage + 1) })}
              className={`btn btn-tertiary ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
              aria-disabled={currentPage >= totalPages}
              data-amp-event-type="cta_click"
              data-amp-event-payload={JSON.stringify({ cta: 'projects_pagination_next', from: 'projects_listing', page: currentPage })}
            >
              {locale === 'th' ? 'ถัดไป' : 'Next'}
            </Link>
          </nav>
        ) : null}
      </Container>
    </main>
  );
}
