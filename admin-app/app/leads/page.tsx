'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { apiRequest, handleUnauthorizedError } from '../../lib/api';
import { getToken } from '../../lib/auth-store';
import { AdminLayout } from '../../components/layout/AdminLayout';

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  score: number;
  status: string;
  source_page?: string | null;
  purpose?: string | null;
  owner_user_id?: string | null;
  follow_up_due_at?: string | null;
  is_duplicate_hint?: boolean;
  is_spam_hint?: boolean;
  created_at: string;
};

type LeadListResponse = {
  data: Lead[];
  meta: { page: number; limit: number; total: number };
};

const STATUSES = ['all', 'new', 'contacted', 'qualified', 'won', 'lost'] as const;

export default function LeadsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<Lead[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = Number(searchParams.get('page') ?? '1') || 1;
  const status = searchParams.get('status') ?? 'all';
  const source = searchParams.get('source') ?? '';
  const purpose = searchParams.get('purpose') ?? '';
  const owner = searchParams.get('owner_user_id') ?? '';
  const q = searchParams.get('q') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';
  const order = searchParams.get('order') ?? 'desc';

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (!v || v === 'all' || (k === 'page' && v === '1') || (k === 'sort' && v === 'newest') || (k === 'order' && v === 'desc')) {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    });
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (status !== 'all') params.set('status', status);
    if (source.trim()) params.set('source', source.trim());
    if (purpose.trim()) params.set('purpose', purpose.trim());
    if (owner.trim()) params.set('owner_user_id', owner.trim());
    if (q.trim()) params.set('q', q.trim());
    if (sort !== 'newest') params.set('sort', sort);
    if (order !== 'desc') params.set('order', order);

    setLoading(true);
    setError(null);
    apiRequest<LeadListResponse>(`/admin/leads?${params.toString()}`)
      .then((res) => {
        setItems(res.data);
        setMeta(res.meta);
      })
      .catch((err: Error) => {
        if (handleUnauthorizedError(err, router)) return;
        setError('Unable to load leads / โหลดรายชื่อลีดไม่สำเร็จ');
      })
      .finally(() => setLoading(false));
  }, [order, owner, page, purpose, q, router, sort, source, status]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(meta.total / meta.limit)), [meta.limit, meta.total]);

  return (
    <AdminLayout>
      <main id="main-content" className="max-w-6xl mx-auto p-6 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold">Leads / ลีด</h1>
          <a className="text-sm underline" href={`/api/admin/leads-export.csv${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}>
            Export CSV
          </a>
        </div>

        {error ? <p className="text-red-600" role="alert">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Lead status filters">
          {STATUSES.map((item) => (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={status === item}
              className={status === item ? 'px-3 py-1 rounded-full bg-slate-900 text-white text-sm' : 'px-3 py-1 rounded-full border text-sm'}
              onClick={() => updateParams({ status: item, page: '1' })}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
          <input className="border rounded px-3 py-2" placeholder="Search" value={q} onChange={(e) => updateParams({ q: e.target.value, page: '1' })} />
          <input className="border rounded px-3 py-2" placeholder="source" value={source} onChange={(e) => updateParams({ source: e.target.value, page: '1' })} />
          <input className="border rounded px-3 py-2" placeholder="purpose" value={purpose} onChange={(e) => updateParams({ purpose: e.target.value, page: '1' })} />
          <input className="border rounded px-3 py-2" placeholder="owner_user_id" value={owner} onChange={(e) => updateParams({ owner_user_id: e.target.value, page: '1' })} />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="sort">Sort</label>
          <select id="sort" className="border rounded px-2 py-2" value={sort} onChange={(e) => updateParams({ sort: e.target.value, page: '1' })}>
            <option value="newest">Newest</option>
            <option value="follow_up_due">Follow-up due</option>
          </select>
          <select aria-label="Sort order" className="border rounded px-2 py-2" value={order} onChange={(e) => updateParams({ order: e.target.value, page: '1' })}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>

        {loading ? (
          <p>Loading leads…</p>
        ) : items.length === 0 ? (
          <p className="text-slate-600">No leads found / ไม่พบข้อมูล</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden" role="region" aria-label="Leads table">
            <table className="w-full text-sm" aria-label="Leads list">
              <thead className="bg-slate-100">
                <tr>
                  <th scope="col" className="text-left p-3">Name</th>
                  <th scope="col" className="text-left p-3">Contact</th>
                  <th scope="col" className="text-left p-3">Status</th>
                  <th scope="col" className="text-left p-3">Purpose</th>
                  <th scope="col" className="text-left p-3">Owner</th>
                  <th scope="col" className="text-left p-3">Hints</th>
                  <th scope="col" className="text-left p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((lead) => (
                  <tr key={lead.id} className="border-t">
                    <td className="p-3">{lead.name}</td>
                    <td className="p-3">{lead.email ?? lead.phone ?? '-'}</td>
                    <td className="p-3">{lead.status}</td>
                    <td className="p-3">{lead.purpose ?? 'TODO: map purpose legacy'}</td>
                    <td className="p-3">{lead.owner_user_id ? lead.owner_user_id.slice(0, 8) : 'Unassigned'}</td>
                    <td className="p-3">
                      {lead.is_duplicate_hint ? <span className="mr-2">Duplicate</span> : null}
                      {lead.is_spam_hint ? <span>Spam</span> : null}
                      {!lead.is_duplicate_hint && !lead.is_spam_hint ? '-' : null}
                    </td>
                    <td className="p-3">
                      <Link className="underline" href={`/leads/${lead.id}`}>Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <p>Page {meta.page} / {totalPages} · Total {meta.total}</p>
          <div className="flex items-center gap-2">
            <button className="border rounded px-3 py-1" disabled={meta.page <= 1} onClick={() => updateParams({ page: String(Math.max(1, meta.page - 1)) })}>Prev</button>
            <button className="border rounded px-3 py-1" disabled={meta.page >= totalPages} onClick={() => updateParams({ page: String(Math.min(totalPages, meta.page + 1)) })}>Next</button>
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}
