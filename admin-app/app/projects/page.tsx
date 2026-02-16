import type { Metadata } from 'next';
import Link from 'next/link';

import { fetchProperties } from '../_lib/public-api';

export const metadata: Metadata = {
  title: 'Projects | AMP Pattaya',
  description: 'Explore projects grouped by name.',
};

type ProjectRow = { name: string; count: number };

export default async function ProjectsPage() {
  // Minimal: derive project_name from address.
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
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-slate-600">Grouped by project name (address).</p>
      </header>

      {rows.length ? (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center justify-between">
              <span>{r.name}</span>
              <span className="text-slate-600">{r.count}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No projects found</p>
      )}

      <p className="text-sm text-slate-600">
        Want a specific project? Use the listings pages:
        {' '}
        <Link className="underline" href="/rent">Rent</Link> /{' '}
        <Link className="underline" href="/buy">Buy</Link>
      </p>
    </main>
  );
}
