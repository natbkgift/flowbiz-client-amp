'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

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
  is_duplicate_hint?: boolean;
  is_spam_hint?: boolean;
  created_at: string;
};

type InquiryListResponse = {
  data: Inquiry[];
  meta: { page: number; limit: number; total: number };
};

const FILTERS: Array<{ key: string; label: string; labelTh: string }> = [
  { key: 'all', label: 'All', labelTh: 'ทั้งหมด' },
  { key: 'new', label: 'New', labelTh: 'ใหม่' },
  { key: 'contacted', label: 'Contacted', labelTh: 'ติดต่อแล้ว' },
  { key: 'qualified', label: 'Qualified', labelTh: 'มีคุณภาพ' },
  { key: 'closed', label: 'Closed', labelTh: 'ปิดแล้ว' },
  { key: 'lost', label: 'Lost', labelTh: 'ไม่สำเร็จ' },
];

export default function InquiriesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<Inquiry[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusFilter = searchParams.get('status') ?? 'all';
  const sort = searchParams.get('sort') ?? 'created_at';
  const order = searchParams.get('order') ?? 'desc';
  const page = Number(searchParams.get('page') ?? '1') || 1;
  const q = searchParams.get('q') ?? '';

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (!v || v === 'all' || (k === 'page' && v === '1') || (k === 'sort' && v === 'created_at') || (k === 'order' && v === 'desc')) {
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
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (sort !== 'created_at') params.set('sort', sort);
    if (order !== 'desc') params.set('order', order);
    if (q.trim()) params.set('q', q.trim());

    setLoading(true);
    setError(null);
    apiRequest<InquiryListResponse>(`/admin/inquiries?${params.toString()}`)
      .then((res) => {
        setItems(res.data);
        setMeta(res.meta);
      })
      .catch((err: Error) => {
        if (handleUnauthorizedError(err, router)) return;
        setError('Unable to load inquiries / โหลดรายการสอบถามไม่สำเร็จ');
      })
      .finally(() => setLoading(false));
  }, [order, page, q, router, sort, statusFilter]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(meta.total / meta.limit)), [meta.limit, meta.total]);

  function scoreBadgeClass(score: number): string {
    if (score >= 80) return 'bg-green-50 text-green-700 ring-green-200';
    if (score >= 50) return 'bg-amber-50 text-amber-800 ring-amber-200';
    return 'bg-slate-50 text-slate-700 ring-slate-200';
  }

  return (
    <AdminLayout>
      <main id="main-content" className="max-w-6xl mx-auto p-6 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-4">
            <h1 className="text-2xl font-semibold">Inquiries / รายการสอบถาม</h1>
            <Link className="text-sm underline" href="/leads">Legacy Leads</Link>
          </div>
          <a
            className="text-sm underline"
            href={`/api/admin/inquiries-export.csv${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
          >
            Export CSV
          </a>
        </div>

        {error ? <p className="text-red-600" role="alert">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Filter inquiries by status">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="radio"
              aria-checked={statusFilter === f.key}
              onClick={() => updateParams({ status: f.key, page: '1' })}
              className={
                statusFilter === f.key
                  ? 'px-3 py-1 rounded-full bg-slate-900 text-white text-sm'
                  : 'px-3 py-1 rounded-full bg-white text-slate-700 text-sm border'
              }
            >
              {f.label} / {f.labelTh}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <label htmlFor="q" className="text-slate-600">Search</label>
            <input
              id="q"
              value={q}
              onChange={(e) => updateParams({ q: e.target.value, page: '1' })}
              className="border rounded px-3 py-2"
              placeholder="name, email, phone"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-slate-600">Sort</label>
            <select
              id="sort"
              className="border rounded px-2 py-2"
              value={sort}
              onChange={(e) => updateParams({ sort: e.target.value, page: '1' })}
            >
              <option value="created_at">Created</option>
              <option value="score">Score</option>
              <option value="status">Status</option>
            </select>
            <select
              aria-label="Sort order"
              className="border rounded px-2 py-2"
              value={order}
              onChange={(e) => updateParams({ order: e.target.value, page: '1' })}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading inquiries…</p>
        ) : items.length === 0 ? (
          <p className="text-slate-600">No inquiries found / ไม่พบรายการ</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden" role="region" aria-label="Inquiries table">
            <table className="w-full text-sm" aria-label="Inquiries list">
              <thead className="bg-slate-100">
                <tr>
                  <th scope="col" className="text-left p-3">Name</th>
                  <th scope="col" className="text-left p-3">Contact</th>
                  <th scope="col" className="text-left p-3">Score</th>
                  <th scope="col" className="text-left p-3">Status</th>
                  <th scope="col" className="text-left p-3">Assigned</th>
                  <th scope="col" className="text-left p-3">Hints</th>
                  <th scope="col" className="text-left p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="p-3">{it.name}</td>
                    <td className="p-3">{it.email ?? it.phone ?? '-'}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full ring-1 ${scoreBadgeClass(it.score ?? 0)}`}>
                        {it.score ?? 0}
                      </span>
                    </td>
                    <td className="p-3">{it.status}</td>
                    <td className="p-3">{it.advisor_user_id ? it.advisor_user_id.slice(0, 8) : 'Unassigned'}</td>
                    <td className="p-3">
                      {it.is_duplicate_hint ? <span className="mr-2">Duplicate</span> : null}
                      {it.is_spam_hint ? <span>Spam</span> : null}
                      {!it.is_duplicate_hint && !it.is_spam_hint ? '-' : null}
                    </td>
                    <td className="p-3">
                      <Link className="underline" href={`/inquiries/${it.id}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <p>
            Page {meta.page} / {totalPages} · Total {meta.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="border rounded px-3 py-1"
              disabled={meta.page <= 1}
              onClick={() => updateParams({ page: String(Math.max(1, meta.page - 1)) })}
            >
              Prev
            </button>
            <button
              type="button"
              className="border rounded px-3 py-1"
              disabled={meta.page >= totalPages}
              onClick={() => updateParams({ page: String(Math.min(totalPages, meta.page + 1)) })}
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}
