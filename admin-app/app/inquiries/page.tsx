'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiRequest, handleUnauthorizedError } from '../../lib/api';
import { getToken } from '../../lib/auth-store';
import { AdminLayout } from '../../components/layout/AdminLayout';

type Inquiry = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  score: number | null;
  status: string;
  advisor_user_id?: string | null;
  duplicate_of_inquiry_id?: string | null;
  created_at: string;
};

export default function InquiriesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | string>('all');
  const [sort, setSort] = useState<'created_at' | 'score'>('created_at');

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    apiRequest<Inquiry[]>('/admin/inquiries')
      .then(setItems)
      .catch((err: Error) => {
        if (handleUnauthorizedError(err, router)) return;
        setError('Unable to load inquiries');
      });
  }, [router]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const it of items) c[it.status] = (c[it.status] ?? 0) + 1;
    return c;
  }, [items]);

  const visible = useMemo(() => {
    const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);
    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'score') {
        const as = a.score ?? 0;
        const bs = b.score ?? 0;
        if (bs !== as) return bs - as;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return sorted;
  }, [filter, items, sort]);

  function statusBadgeClass(s: string): string {
    switch (s) {
      case 'new':
        return 'bg-blue-50 text-blue-700 ring-blue-200';
      case 'contacted':
        return 'bg-indigo-50 text-indigo-700 ring-indigo-200';
      case 'qualified':
        return 'bg-amber-50 text-amber-800 ring-amber-200';
      case 'closed':
        return 'bg-green-50 text-green-700 ring-green-200';
      case 'lost':
        return 'bg-rose-50 text-rose-700 ring-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-200';
    }
  }

  function scoreBadgeClass(score: number): string {
    if (score >= 80) return 'bg-green-50 text-green-700 ring-green-200';
    if (score >= 50) return 'bg-amber-50 text-amber-800 ring-amber-200';
    return 'bg-slate-50 text-slate-700 ring-slate-200';
  }

  const FILTERS: Array<{ key: 'all' | string; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'contacted', label: 'Contacted' },
    { key: 'qualified', label: 'Qualified' },
    { key: 'closed', label: 'Closed' },
    { key: 'lost', label: 'Lost' },
  ];

  return (
    <AdminLayout>
      <main id="main-content" className="max-w-6xl mx-auto p-6 space-y-4">
        <div className="flex items-baseline gap-4">
          <h1 className="text-2xl font-semibold">Inquiries</h1>
          <Link prefetch={false} className="text-sm underline" href="/leads">Legacy Leads</Link>
        </div>

      {error ? <p className="text-red-600" role="alert">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="radio"
              aria-checked={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={
                filter === f.key
                  ? 'px-3 py-1 rounded-full bg-slate-900 text-white text-sm'
                  : 'px-3 py-1 rounded-full bg-white text-slate-700 text-sm border'
              }
            >
              {f.label} <span className={filter === f.key ? 'opacity-90' : 'text-slate-500'}>({counts[f.key] ?? 0})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">Sort</span>
          <button
            type="button"
            aria-pressed={sort === 'created_at'}
            className={sort === 'created_at' ? 'underline font-medium' : 'underline'}
            onClick={() => setSort('created_at')}
          >
            Created
          </button>
          <span className="text-slate-300" aria-hidden="true">|</span>
          <button
            type="button"
            aria-pressed={sort === 'score'}
            className={sort === 'score' ? 'underline font-medium' : 'underline'}
            onClick={() => setSort('score')}
          >
            Score
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden" role="region" aria-label="Inquiries table">
        <table className="w-full text-sm" aria-label="Inquiries list">
          <caption className="sr-only">List of inquiries with contact, score, status, and assignment</caption>
          <thead className="bg-slate-100">
            <tr>
              <th scope="col" className="text-left p-3">Name</th>
              <th scope="col" className="text-left p-3">Contact</th>
              <th scope="col" className="text-left p-3">Score</th>
              <th scope="col" className="text-left p-3">Status</th>
              <th scope="col" className="text-left p-3">Assigned</th>
              <th scope="col" className="text-left p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-3">{it.name}</td>
                <td className="p-3">{it.email ?? it.phone ?? '-'}</td>
                <td className="p-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full ring-1 ${scoreBadgeClass(it.score ?? 0)}`}
                    title="Lead score"
                  >
                    {it.score ?? 0}
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full ring-1 ${statusBadgeClass(it.status)}`}
                  >
                    {it.status}
                  </span>
                </td>
                <td className="p-3">
                  {it.advisor_user_id ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full ring-1 bg-slate-50 text-slate-700 ring-slate-200 font-mono">
                      {it.advisor_user_id.slice(0, 8)}
                    </span>
                  ) : (
                    <span className="text-slate-500">Unassigned</span>
                  )}
                </td>
                <td className="p-3">
                  <Link prefetch={false} className="underline" href={`/inquiries/${it.id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </main>
    </AdminLayout>
  );
}
