import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { ProjectCard } from '@/components/project/ProjectCard';
import { fetchProjects, fetchProperties } from '@/app/_lib/public-api-server';

import { normalizeLocale } from '@/app/_lib/i18n/get-dictionary';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const canonical = `/${locale}/projects`;
  const title = 'Projects | AMP Pattaya';
  const description = 'Explore published projects in Pattaya.';
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: '/en/projects',
        th: '/th/projects',
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      siteName: 'AMP Pattaya',
      locale: locale === 'th' ? 'th_TH' : 'en_US',
    },
  };
}

type ProjectRow = { name: string; count: number };

export default async function ProjectsPage({ params }: { params: { locale: string } }) {
  const locale = params.locale === 'th' ? 'th' : 'en';
  const projects = await fetchProjects({ limit: 100 });
  if (projects.length) {
    return (
      <main className="section" id="main-content">
        <Container>
          <div className="section-header" style={{ marginBottom: 24 }}>
            <h1 className="section-title">Projects</h1>
            <p className="section-subtitle">Published projects</p>
          </div>

          <div className="grid grid-3">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                name={p.name}
                count={0}
                slug={p.slug}
                locale={locale}
              />
            ))}
          </div>
        </Container>
      </main>
    );
  }

  const res = await fetchProperties({ limit: 100, sort: 'newest' });

  const byName = new Map<string, number>();
  for (const p of res.data ?? []) {
    const name = (p.address || '').trim();
    if (!name) continue;
    byName.set(name, (byName.get(name) ?? 0) + 1);
  }

  const rows: ProjectRow[] = Array.from(byName.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return (
    <main className="section" id="main-content">
      <Container>
        <div className="section-header" style={{ marginBottom: 24 }}>
          <h1 className="section-title">Projects</h1>
          <p className="section-subtitle">Grouped by project/building name</p>
        </div>

        {rows.length ? (
          <div className="grid grid-3">
            {rows.map((r) => (
              <ProjectCard key={r.name} name={r.name} count={r.count} />
            ))}
          </div>
        ) : (
          <p>No projects found</p>
        )}
      </Container>
    </main>
  );
}
