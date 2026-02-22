import type { Metadata } from 'next';
import { makeListingPageMetadata } from '@/app/_lib/i18n/metadata';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProjectCard } from '@/components/project/ProjectCard';
import { fetchProjects, fetchProperties } from '@/app/_lib/public-api-server';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';

export const revalidate = 300;

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

type ProjectRow = { name: string; count: number };

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';
  const canonicalUrl = `${siteUrl}/${locale}/projects`;

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.projects, href: `/${locale}/projects` },
  ];
  const breadcrumbJsonLd = breadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
  );

  let projects: Awaited<ReturnType<typeof fetchProjects>>;
  let projectsFetchOk = true;
  const startedAt = Date.now();
  try {
    projects = await fetchProjects({ limit: 100 });
  } catch {
    projectsFetchOk = false;
    projects = [];  // graceful degradation
  }
  if (projects.length) {
    const sorted = [...projects].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '') || (a.slug ?? '').localeCompare(b.slug ?? ''));
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
            <p className="section-subtitle">{dict.listing.publishedProjects}</p>
          </div>

          <div className="grid grid-3">
            {sorted.map((p) => (
              <ProjectCard
                key={p.id}
                name={p.name}
                count={0}
                slug={p.slug}
                locale={locale}
                dict={dict}
              />
            ))}
          </div>
        </Container>
      </main>
    );
  }

  const projectsElapsedMs = Date.now() - startedAt;
  const shouldAttemptPropertyFallback = projectsFetchOk && projectsElapsedMs < 20_000;

  const res: Awaited<ReturnType<typeof fetchProperties>> = shouldAttemptPropertyFallback
    ? await fetchProperties({ limit: 100, sort: 'newest' }).catch(() => ({
        data: [],
        meta: { page: 1, limit: 100, total: 0 },
      }))
    : { data: [], meta: { page: 1, limit: 100, total: 0 } };

  const byName = new Map<string, number>();
  for (const p of res.data ?? []) {
    const name = (p.address || '').trim();
    if (!name) continue;
    byName.set(name, (byName.get(name) ?? 0) + 1);
  }

  const rows: ProjectRow[] = Array.from(byName.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const jsonLd = JSON.stringify(
    [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: dict.nav.projects,
        url: canonicalUrl,
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
          <p className="section-subtitle">{dict.listing.projectsSubtitle}</p>
        </div>

        {rows.length ? (
          <div className="grid grid-3">
            {rows.map((r) => (
              <ProjectCard key={r.name} name={r.name} count={r.count} dict={dict} />
            ))}
          </div>
        ) : (
          <p>{dict.listing.noProperties}</p>
        )}
      </Container>
    </main>
  );
}
