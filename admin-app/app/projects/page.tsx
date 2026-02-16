import type { Metadata } from 'next';

import { fetchProperties } from '../_lib/public-api-server';

export const metadata: Metadata = {
  title: 'Projects | AMP Pattaya',
  description: 'Explore projects grouped by name.',
};

type ProjectRow = { name: string; count: number };

export default async function ProjectsPage() {
  // No DB/API change: derive project_name from address.
  const res = await fetchProperties({ limit: 100, sort: 'newest' });

  const byName = new Map<string, number>();
  for (const p of res.data ?? []) {
    const name = p.address?.trim();
    if (name) byName.set(name, (byName.get(name) ?? 0) + 1);
  }

  const rows: ProjectRow[] = Array.from(byName.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return (
    <main className="bg-slate-50">
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Projects{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Directory</span>
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-400/80" />
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-slate-200">
            Browse properties grouped by project/building name.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto p-6">
        {rows.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((r) => (
              <div
                key={r.name}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-semibold text-slate-900 line-clamp-2">{r.name}</p>
                <p className="mt-1 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{r.count}</span> listings
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-700">No projects found</p>
        )}
      </section>
    </main>
  );
}
