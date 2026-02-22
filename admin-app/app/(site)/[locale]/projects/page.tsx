import type { Metadata } from 'next';
import { makeListingPageMetadata } from '@/app/_lib/i18n/metadata';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProjectCard } from '@/components/project/ProjectCard';
import { fetchProjects } from '@/app/_lib/public-api-server';
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
  try {
    projects = await fetchProjects({ limit: 100 });
  } catch {
    projectsFetchOk = false;
    projects = [];
  }

  const sorted = [...projects].sort((a, b) =>
    (a.name ?? '').localeCompare(b.name ?? '') || (a.slug ?? '').localeCompare(b.slug ?? '')
  );

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
            {sorted.length
              ? `${sorted.length} ${dict.listing.publishedProjects}`
              : dict.listing.projectsSubtitle}
          </p>
        </div>

        {sorted.length ? (
          <div className="grid grid-3">
            {sorted.map((p) => (
              <ProjectCard
                key={p.id}
                name={p.name}
                count={0}
                slug={p.slug}
                locale={locale}
                dict={dict}
                startingPrice={p.starting_price ? Number(p.starting_price) : null}
                coverImage={p.cover_image_url}
              />
            ))}
          </div>
        ) : (
          <>
            {!projectsFetchOk ? (
              <div className="card">
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'ไม่สามารถโหลดข้อมูลโปรเจกต์ได้ กรุณาลองใหม่อีกครั้ง'
                    : 'Unable to load projects. Please try again later.'}
                </p>
              </div>
            ) : (
              <p>{dict.listing.noProperties}</p>
            )}
          </>
        )}
      </Container>
    </main>
  );
}
