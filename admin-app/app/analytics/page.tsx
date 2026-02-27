'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiRequest, handleUnauthorizedError } from '../../lib/api';
import { getToken } from '../../lib/auth-store';
import { AdminLayout } from '../../components/layout/AdminLayout';

type Summary = {
  generated_at: string;
  inquiries_by_status: Record<string, number>;
  leads_by_source: Array<{ source: string; count: number }>;
  advisor_metrics: Array<{
    advisor_user_id: string;
    assigned: number;
    closed: number;
    conversion_ratio: number;
  }>;
  avg_days_to_close: number | null;
  top_projects: Array<{ project_id: string; inquiries: number }>;
  marketplace: { published_items: number; engagement_events: number };
  seller: {
    total_submissions: number;
    approved_submissions: number;
    conversion_ratio: number;
  };
};

const FUNNEL_ORDER = ['new', 'contacted', 'qualified', 'closed', 'lost'] as const;

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    apiRequest<Summary>('/admin/analytics/summary')
      .then(setData)
      .catch((err: Error) => {
        if (handleUnauthorizedError(err, router)) return;
        setError('Unable to load analytics');
      });
  }, [router]);

  const funnel = useMemo(() => {
    const by = data?.inquiries_by_status ?? {};
    const rows = FUNNEL_ORDER.map((k) => ({ status: k, count: by[k] ?? 0 }));
    const max = Math.max(1, ...rows.map((r) => r.count));
    return { rows, max };
  }, [data?.inquiries_by_status]);

  return (
    <AdminLayout>
      <main id="main-content" className="max-w-6xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Analytics</h1>

      {error ? <p className="text-red-600" role="alert">{error}</p> : null}
      {!data && !error ? <p aria-live="polite">Loading...</p> : null}

      {data ? (
        <>
          <section className="bg-white rounded-lg shadow-sm p-6 space-y-3">
            <h2 className="text-lg font-semibold">Funnel</h2>
            <p className="text-sm text-slate-600">Generated: {new Date(data.generated_at).toLocaleString()}</p>

            <div className="space-y-2">
              {funnel.rows.map((r) => (
                <div key={r.status} className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium capitalize">{r.status}</div>
                  <div className="flex-1">
                    <div className="h-3 rounded bg-slate-100 overflow-hidden">
                      <div
                        className="h-3 bg-slate-900"
                        style={{ width: `${Math.round((r.count / funnel.max) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm tabular-nums">{r.count}</div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-sm text-slate-600">
              Avg days to close: <span className="font-medium text-slate-900">{data.avg_days_to_close ?? '-'}</span>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-lg shadow-sm p-6 space-y-3">
              <h2 className="text-lg font-semibold">Leads by source</h2>
              {data.leads_by_source.length ? (
                <div className="space-y-2">
                  {data.leads_by_source.map((s) => (
                    <div key={s.source} className="flex items-center justify-between text-sm">
                      <div className="truncate">{s.source}</div>
                      <div className="tabular-nums font-medium">{s.count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">No source data yet.</p>
              )}
            </section>

            <section className="bg-white rounded-lg shadow-sm p-6 space-y-3">
              <h2 className="text-lg font-semibold">Advisor performance</h2>
              {data.advisor_metrics.length ? (
                <div className="overflow-auto">
                  <table className="w-full text-sm" aria-label="Advisor performance metrics">
                    <caption className="sr-only">Advisor metrics: assigned, closed, and conversion ratio</caption>
                    <thead className="bg-slate-100">
                      <tr>
                        <th scope="col" className="text-left p-2">Advisor</th>
                        <th scope="col" className="text-right p-2">Assigned</th>
                        <th scope="col" className="text-right p-2">Closed</th>
                        <th scope="col" className="text-right p-2">Conv.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.advisor_metrics.map((a) => (
                        <tr key={a.advisor_user_id} className="border-t">
                          <td className="p-2 font-mono">{a.advisor_user_id.slice(0, 8)}</td>
                          <td className="p-2 text-right tabular-nums">{a.assigned}</td>
                          <td className="p-2 text-right tabular-nums">{a.closed}</td>
                          <td className="p-2 text-right tabular-nums">{Math.round(a.conversion_ratio * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-600">No advisor data yet.</p>
              )}
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-lg shadow-sm p-6 space-y-3">
              <h2 className="text-lg font-semibold">Marketplace</h2>
              <div className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Published listings</span>
                  <span className="font-medium tabular-nums">{data.marketplace.published_items}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Engagement events</span>
                  <span className="font-medium tabular-nums">{data.marketplace.engagement_events}</span>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-lg shadow-sm p-6 space-y-3">
              <h2 className="text-lg font-semibold">Seller</h2>
              <div className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Submissions</span>
                  <span className="font-medium tabular-nums">{data.seller.total_submissions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Approved</span>
                  <span className="font-medium tabular-nums">{data.seller.approved_submissions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Conversion</span>
                  <span className="font-medium tabular-nums">{Math.round(data.seller.conversion_ratio * 100)}%</span>
                </div>
              </div>
            </section>
          </div>

          <section className="bg-white rounded-lg shadow-sm p-6 space-y-3">
            <h2 className="text-lg font-semibold">Top projects (by inquiries)</h2>
            {data.top_projects.length ? (
              <div className="overflow-auto">
                <table className="w-full text-sm" aria-label="Top projects by inquiry count">
                  <caption className="sr-only">Projects ranked by number of inquiries</caption>
                  <thead className="bg-slate-100">
                    <tr>
                      <th scope="col" className="text-left p-2">Project</th>
                      <th scope="col" className="text-right p-2">Inquiries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_projects.map((p) => (
                      <tr key={p.project_id} className="border-t">
                        <td className="p-2 font-mono">{p.project_id.slice(0, 8)}</td>
                        <td className="p-2 text-right tabular-nums">{p.inquiries}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-600">No project inquiry data yet.</p>
            )}
          </section>
        </>
      ) : null}
      </main>
    </AdminLayout>
  );
}
