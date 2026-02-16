import type { Metadata } from 'next';

import { Container } from '../../../components/layout/Container';
import { ProjectCard } from '../../../components/project/ProjectCard';
import { fetchProperties } from '../../_lib/public-api-server';

export const metadata: Metadata = {
  title: 'Projects | Asset Management Property',
  description: 'Explore projects grouped by name.',
};

type ProjectRow = { name: string; count: number };

export default async function ProjectsPage() {
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
