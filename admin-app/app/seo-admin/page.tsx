'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiRequest, handleUnauthorizedError } from '../../lib/api';
import { getToken } from '../../lib/auth-store';
import { AdminLayout } from '../../components/layout/AdminLayout';

type SeoOverride = {
  id: string;
  path: string;
  locale: string;
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  enabled: boolean;
};

type RedirectRule = {
  id: string;
  old_path: string;
  new_path: string;
  status_code: number;
  enabled: boolean;
  preserve_query: boolean;
};

export default function SeoAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seoRows, setSeoRows] = useState<SeoOverride[]>([]);
  const [redirectRows, setRedirectRows] = useState<RedirectRule[]>([]);
  const [report, setReport] = useState<{ summary: { total: number; high: number; medium: number; low: number }; issues: Array<{ severity: string; kind: string; path: string }> } | null>(null);

  const [seoForm, setSeoForm] = useState({ path: '/en', locale: 'en', title: '', description: '', canonical: '', robots_index: true, robots_follow: true, enabled: true });
  const [redirectForm, setRedirectForm] = useState({ old_path: '/old-path', new_path: '/en', status_code: 301, enabled: true, preserve_query: true });

  async function loadAll() {
    const [seo, redirects, broken] = await Promise.all([
      apiRequest<{ data: SeoOverride[] }>('/admin/seo-overrides?page=1&limit=50'),
      apiRequest<{ data: RedirectRule[] }>('/admin/redirects?page=1&limit=50'),
      apiRequest<{ summary: { total: number; high: number; medium: number; low: number }; issues: Array<{ severity: string; kind: string; path: string }> }>('/admin/broken-links/report'),
    ]);
    setSeoRows(seo.data);
    setRedirectRows(redirects.data);
    setReport(broken);
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    setLoading(true);
    loadAll()
      .catch((err: Error) => {
        if (handleUnauthorizedError(err, router)) return;
        setError('Unable to load SEO controls / โหลดข้อมูล SEO ไม่สำเร็จ');
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function saveSeo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await apiRequest('/admin/seo-overrides', {
        method: 'PUT',
        body: JSON.stringify({
          ...seoForm,
          title: seoForm.title || null,
          description: seoForm.description || null,
          canonical: seoForm.canonical || null,
        }),
      });
      await loadAll();
    } catch (err) {
      if (handleUnauthorizedError(err as Error, router)) return;
      setError('Unable to save SEO override');
    }
  }

  async function createRedirect(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await apiRequest('/admin/redirects', {
        method: 'POST',
        body: JSON.stringify(redirectForm),
      });
      await loadAll();
    } catch (err) {
      if (handleUnauthorizedError(err as Error, router)) return;
      setError('Unable to create redirect');
    }
  }

  async function toggleRedirect(id: string, enabled: boolean) {
    try {
      await apiRequest(`/admin/redirects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !enabled }),
      });
      await loadAll();
    } catch (err) {
      if (handleUnauthorizedError(err as Error, router)) return;
      setError('Unable to update redirect');
    }
  }

  return (
    <AdminLayout>
      <main id="main-content" className="max-w-6xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">SEO / Redirect Controls</h1>
        {error ? <p className="text-red-600" role="alert">{error}</p> : null}

        {loading ? <p>Loading…</p> : null}

        <section className="bg-white rounded-lg shadow-sm p-4 space-y-3" aria-labelledby="seo-override-title">
          <h2 id="seo-override-title" className="text-lg font-semibold">SEO Override</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-2" onSubmit={saveSeo}>
            <label className="text-sm">Path
              <input className="mt-1 w-full border rounded px-3 py-2" value={seoForm.path} onChange={(e) => setSeoForm((s) => ({ ...s, path: e.target.value }))} />
            </label>
            <label className="text-sm">Locale
              <select className="mt-1 w-full border rounded px-3 py-2" value={seoForm.locale} onChange={(e) => setSeoForm((s) => ({ ...s, locale: e.target.value }))}>
                <option value="en">en</option>
                <option value="th">th</option>
              </select>
            </label>
            <label className="text-sm">Title
              <input className="mt-1 w-full border rounded px-3 py-2" value={seoForm.title} onChange={(e) => setSeoForm((s) => ({ ...s, title: e.target.value }))} />
            </label>
            <label className="text-sm">Description
              <input className="mt-1 w-full border rounded px-3 py-2" value={seoForm.description} onChange={(e) => setSeoForm((s) => ({ ...s, description: e.target.value }))} />
            </label>
            <label className="text-sm">Canonical
              <input className="mt-1 w-full border rounded px-3 py-2" value={seoForm.canonical} onChange={(e) => setSeoForm((s) => ({ ...s, canonical: e.target.value }))} />
            </label>
            <div className="flex items-end gap-3">
              <label className="text-sm"><input type="checkbox" checked={seoForm.robots_index} onChange={(e) => setSeoForm((s) => ({ ...s, robots_index: e.target.checked }))} /> index</label>
              <label className="text-sm"><input type="checkbox" checked={seoForm.robots_follow} onChange={(e) => setSeoForm((s) => ({ ...s, robots_follow: e.target.checked }))} /> follow</label>
              <label className="text-sm"><input type="checkbox" checked={seoForm.enabled} onChange={(e) => setSeoForm((s) => ({ ...s, enabled: e.target.checked }))} /> enabled</label>
            </div>
            <button className="md:col-span-2 bg-slate-900 text-white rounded px-3 py-2" type="submit">Save Override</button>
          </form>
          {seoRows.length === 0 ? <p className="text-sm text-slate-600">No overrides yet.</p> : (
            <ul className="text-sm space-y-1">
              {seoRows.map((row) => <li key={row.id}>{row.locale} {row.path} — {row.title ?? '(no title)'}</li>)}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-sm p-4 space-y-3" aria-labelledby="redirect-title">
          <h2 id="redirect-title" className="text-lg font-semibold">Redirect Manager</h2>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-2" onSubmit={createRedirect}>
            <label className="text-sm">Old path
              <input className="mt-1 w-full border rounded px-3 py-2" value={redirectForm.old_path} onChange={(e) => setRedirectForm((s) => ({ ...s, old_path: e.target.value }))} />
            </label>
            <label className="text-sm">New path
              <input className="mt-1 w-full border rounded px-3 py-2" value={redirectForm.new_path} onChange={(e) => setRedirectForm((s) => ({ ...s, new_path: e.target.value }))} />
            </label>
            <label className="text-sm">Status
              <select className="mt-1 w-full border rounded px-3 py-2" value={redirectForm.status_code} onChange={(e) => setRedirectForm((s) => ({ ...s, status_code: Number(e.target.value) }))}>
                <option value={301}>301</option>
                <option value={302}>302</option>
              </select>
            </label>
            <div className="md:col-span-3 flex items-center gap-3">
              <label className="text-sm"><input type="checkbox" checked={redirectForm.enabled} onChange={(e) => setRedirectForm((s) => ({ ...s, enabled: e.target.checked }))} /> enabled</label>
              <label className="text-sm"><input type="checkbox" checked={redirectForm.preserve_query} onChange={(e) => setRedirectForm((s) => ({ ...s, preserve_query: e.target.checked }))} /> preserve query</label>
              <button className="bg-slate-900 text-white rounded px-3 py-2" type="submit">Create Redirect</button>
            </div>
          </form>
          {redirectRows.length === 0 ? <p className="text-sm text-slate-600">No redirects yet.</p> : (
            <ul className="text-sm space-y-1">
              {redirectRows.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2">
                  <span>{row.old_path} → {row.new_path} ({row.status_code})</span>
                  <button className="underline" onClick={() => void toggleRedirect(row.id, row.enabled)}>{row.enabled ? 'Disable' : 'Enable'}</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-sm p-4 space-y-2" aria-labelledby="broken-title">
          <h2 id="broken-title" className="text-lg font-semibold">Broken Link Report</h2>
          {!report ? <p className="text-sm text-slate-600">No report</p> : (
            <>
              <p className="text-sm">Total: {report.summary.total}, High: {report.summary.high}, Medium: {report.summary.medium}, Low: {report.summary.low}</p>
              {report.issues.length === 0 ? <p className="text-sm text-slate-600">No issues.</p> : (
                <ul className="text-sm space-y-1">
                  {report.issues.map((i, idx) => <li key={`${i.path}-${idx}`}>[{i.severity}] {i.kind} — {i.path}</li>)}
                </ul>
              )}
            </>
          )}
        </section>
      </main>
    </AdminLayout>
  );
}
