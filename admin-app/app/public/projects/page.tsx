'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { API_BASE } from '../_shared/api';
import type { PropertyListResponse } from '../_shared/types';

type ProjectRow = {
  name: string;
  count: number;
};

export default function PublicProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ProjectRow[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/v1/properties?limit=100&page=1&sort=newest`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return (await res.json()) as PropertyListResponse;
      })
      .then((body) => {
        const byName = new Map<string, number>();
        for (const p of body.data ?? []) {
          const name = p.address;
          if (name && name.trim()) {
            byName.set(name.trim(), (byName.get(name.trim()) ?? 0) + 1);
          }
        }
        const list: ProjectRow[] = Array.from(byName.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
        setRows(list);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('Unable to load projects');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const content = useMemo(() => {
    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-600">{error}</p>;
    if (rows.length === 0) return <p>No projects found</p>;

    return (
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between">
            <Link className="underline" href={`/public/properties?search=${encodeURIComponent(r.name)}`}>
              {r.name}
            </Link>
            <span className="text-slate-600">{r.count}</span>
          </li>
        ))}
      </ul>
    );
  }, [error, loading, rows]);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-slate-600">Grouped by project name (address).</p>
      </header>

      {content}
    </main>
  );
}
