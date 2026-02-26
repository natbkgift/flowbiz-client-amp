'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { apiRequest, handleUnauthorizedError } from '../../lib/api';
import { getToken } from '../../lib/auth-store';

type GovernanceMessage = {
  level: string;
  path: string;
  detail: string;
};

type AreaItem = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  status: string;
  hero_image_url: string | null;
  created_at: string;
  updated_at: string;
};

type AreaStatistics = {
  avg_price_sqm: string | null;
  avg_rent_monthly: string | null;
  avg_roi_percent: string | null;
  total_projects: number | null;
  total_units: number | null;
  as_of_date: string | null;
  avg_price: string | null;
  avg_rent: string | null;
  roi_percent: string | null;
};

type AreaDetail = {
  area: AreaItem;
  statistics: AreaStatistics | null;
  content: Record<string, unknown> | null;
  map_center: Record<string, unknown> | null;
  media_warnings: GovernanceMessage[];
};

type AreaListResponse = {
  data: AreaItem[];
  meta: { page: number; limit: number; total: number };
};

type AreaPublishResponse = {
  area: AreaItem;
  published: boolean;
};

type MediaAsset = {
  id: string;
  storage_path: string;
  title: string | null;
  source_domain: string | null;
  rights_status: string | null;
  approval_status: string | null;
  is_exception: boolean;
};

type FormState = {
  name: string;
  slug: string;
  city: string;
  status: string;
  hero_image_url: string;
  content_json: string;
  map_center_json: string;
  avg_price_sqm: string;
  avg_rent_monthly: string;
  avg_roi_percent: string;
  total_projects: string;
  total_units: string;
  as_of_date: string;
  avg_price: string;
  avg_rent: string;
  roi_percent: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  city: 'Pattaya',
  status: 'draft',
  hero_image_url: '',
  content_json: '',
  map_center_json: '',
  avg_price_sqm: '',
  avg_rent_monthly: '',
  avg_roi_percent: '',
  total_projects: '',
  total_units: '',
  as_of_date: '',
  avg_price: '',
  avg_rent: '',
  roi_percent: '',
};

function parseNumberOrNull(value: string): number | null {
  const raw = value.trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseIntOrNull(value: string): number | null {
  const parsed = parseNumberOrNull(value);
  if (parsed === null) return null;
  return Math.trunc(parsed);
}

function prettyJson(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  return JSON.stringify(value, null, 2);
}

function parseObjectOrNull(text: string, fieldName: string): Record<string, unknown> | null {
  const raw = text.trim();
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${fieldName} must be valid JSON`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${fieldName} must be a JSON object`);
  }
  return parsed as Record<string, unknown>;
}

export default function AreasAdminPage() {
  const router = useRouter();

  const [items, setItems] = useState<AreaItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<AreaDetail | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [mediaItems, setMediaItems] = useState<MediaAsset[]>([]);
  const [mediaSearch, setMediaSearch] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedListItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  function applyDetailToForm(detail: AreaDetail): void {
    const stat = detail.statistics;
    setForm({
      name: detail.area.name || '',
      slug: detail.area.slug || '',
      city: detail.area.city || 'Pattaya',
      status: detail.area.status || 'draft',
      hero_image_url: detail.area.hero_image_url || '',
      content_json: prettyJson(detail.content),
      map_center_json: prettyJson(detail.map_center),
      avg_price_sqm: stat?.avg_price_sqm != null ? String(stat.avg_price_sqm) : '',
      avg_rent_monthly: stat?.avg_rent_monthly != null ? String(stat.avg_rent_monthly) : '',
      avg_roi_percent: stat?.avg_roi_percent != null ? String(stat.avg_roi_percent) : '',
      total_projects: stat?.total_projects != null ? String(stat.total_projects) : '',
      total_units: stat?.total_units != null ? String(stat.total_units) : '',
      as_of_date: stat?.as_of_date || '',
      avg_price: stat?.avg_price != null ? String(stat.avg_price) : '',
      avg_rent: stat?.avg_rent != null ? String(stat.avg_rent) : '',
      roi_percent: stat?.roi_percent != null ? String(stat.roi_percent) : '',
    });
  }

  async function loadAreas(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<AreaListResponse>('/admin/areas?limit=100&page=1');
      setItems(res.data);
      if (!res.data.length) {
        setSelectedId(null);
        setSelected(null);
        setForm(EMPTY_FORM);
        return;
      }
      const next = selectedId && res.data.some((item) => item.id === selectedId) ? selectedId : res.data[0].id;
      setSelectedId(next);
      await loadAreaDetail(next);
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to load areas');
    } finally {
      setLoading(false);
    }
  }

  async function loadAreaDetail(id: string): Promise<void> {
    try {
      const detail = await apiRequest<AreaDetail>(`/admin/areas/${id}`);
      setSelected(detail);
      applyDetailToForm(detail);
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to load area detail');
    }
  }

  async function loadMediaCandidates(term: string): Promise<void> {
    try {
      const params = new URLSearchParams();
      params.set('limit', '40');
      if (term.trim()) params.set('search', term.trim());
      const rows = await apiRequest<MediaAsset[]>(`/admin/properties/media-candidates?${params.toString()}`);
      setMediaItems(rows);
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError('Unable to load media candidates');
    }
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    void loadAreas();
    void loadMediaCandidates('');
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadMediaCandidates(mediaSearch);
    }, 250);
    return () => clearTimeout(timer);
  }, [mediaSearch]);

  async function handleCreate(): Promise<void> {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const created = await apiRequest<AreaDetail>('/admin/areas', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          city: form.city.trim() || null,
          status: form.status,
          hero_image_url: form.hero_image_url.trim() || null,
          content: parseObjectOrNull(form.content_json, 'content_json'),
          map_center: parseObjectOrNull(form.map_center_json, 'map_center_json'),
        }),
      });
      setNotice('Area created');
      await loadAreas();
      setSelectedId(created.area.id);
      await loadAreaDetail(created.area.id);
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to create area');
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(): Promise<void> {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest<AreaDetail>(`/admin/areas/${selectedId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          city: form.city.trim() || null,
          status: form.status,
          hero_image_url: form.hero_image_url.trim() || null,
          content: parseObjectOrNull(form.content_json, 'content_json'),
          map_center: parseObjectOrNull(form.map_center_json, 'map_center_json'),
        }),
      });
      await apiRequest(`/admin/areas/${selectedId}/statistics`, {
        method: 'PUT',
        body: JSON.stringify({
          avg_price_sqm: parseNumberOrNull(form.avg_price_sqm),
          avg_rent_monthly: parseNumberOrNull(form.avg_rent_monthly),
          avg_roi_percent: parseNumberOrNull(form.avg_roi_percent),
          total_projects: parseIntOrNull(form.total_projects),
          total_units: parseIntOrNull(form.total_units),
          as_of_date: form.as_of_date.trim() || null,
          avg_price: parseNumberOrNull(form.avg_price),
          avg_rent: parseNumberOrNull(form.avg_rent),
          roi_percent: parseNumberOrNull(form.roi_percent),
        }),
      });
      setNotice('Area updated');
      await loadAreas();
      await loadAreaDetail(selectedId);
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to save area');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(nextPublished: boolean): Promise<void> {
    if (!selectedId) return;
    setPublishing(true);
    setError(null);
    setNotice(null);
    try {
      const endpoint = nextPublished ? 'publish' : 'unpublish';
      const res = await apiRequest<AreaPublishResponse>(`/admin/areas/${selectedId}/${endpoint}`, {
        method: 'POST',
      });
      setNotice(res.published ? 'Area published' : 'Area unpublished');
      await loadAreas();
      await loadAreaDetail(selectedId);
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to update area publication status');
    } finally {
      setPublishing(false);
    }
  }

  const mediaBadgeClass = (asset: MediaAsset): string => {
    const rights = (asset.rights_status || '').toLowerCase();
    const approval = (asset.approval_status || '').toLowerCase();
    if (rights === 'restricted' || rights === 'rejected' || approval === 'rejected') {
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    }
    if (rights === 'pending_review' || rights === 'exception_allowed' || approval === 'pending' || asset.is_exception) {
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  };

  return (
    <AdminLayout>
      <main className="p-6 space-y-4">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Areas Admin CMS</h1>
            <p className="text-sm text-slate-600">Manage area entities, publish status, statistics, and governed media links.</p>
          </div>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={saving}
            className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm disabled:opacity-60"
          >
            {saving ? 'Creating…' : 'Create Area'}
          </button>
        </header>

        {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
        {notice ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div> : null}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px,1fr,360px]">
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">Areas</div>
            <div className="max-h-[70vh] overflow-auto p-2">
              {loading ? <div className="px-2 py-3 text-sm text-slate-500">Loading…</div> : null}
              {!loading && !items.length ? <div className="px-2 py-3 text-sm text-slate-500">No areas yet.</div> : null}
              <ul className="space-y-1">
                {items.map((item) => {
                  const active = item.id === selectedId;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(item.id);
                          void loadAreaDetail(item.id);
                        }}
                        className={`w-full text-left rounded-md px-3 py-2 text-sm border ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs opacity-80">{item.slug} · {item.status}</div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="text-sm text-slate-700">
                Name
                <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-700">
                Slug
                <input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-700">
                City
                <input value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-700">
                Status
                <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </select>
              </label>
            </div>

            <label className="text-sm text-slate-700 block">
              Hero image (`/media/...` only)
              <input value={form.hero_image_url} onChange={(e) => setForm((prev) => ({ ...prev, hero_image_url: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="text-sm text-slate-700 block">
                Content JSON
                <textarea value={form.content_json} onChange={(e) => setForm((prev) => ({ ...prev, content_json: e.target.value }))} rows={7} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs" />
              </label>
              <label className="text-sm text-slate-700 block">
                Map center JSON
                <textarea value={form.map_center_json} onChange={(e) => setForm((prev) => ({ ...prev, map_center_json: e.target.value }))} rows={7} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs" />
              </label>
            </div>

            <div className="rounded-md border border-slate-200 p-3">
              <h2 className="text-sm font-medium text-slate-800">Statistics</h2>
              <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="text-sm text-slate-700">avg_price_sqm<input value={form.avg_price_sqm} onChange={(e) => setForm((prev) => ({ ...prev, avg_price_sqm: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700">avg_rent_monthly<input value={form.avg_rent_monthly} onChange={(e) => setForm((prev) => ({ ...prev, avg_rent_monthly: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700">avg_roi_percent<input value={form.avg_roi_percent} onChange={(e) => setForm((prev) => ({ ...prev, avg_roi_percent: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700">total_projects<input value={form.total_projects} onChange={(e) => setForm((prev) => ({ ...prev, total_projects: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700">total_units<input value={form.total_units} onChange={(e) => setForm((prev) => ({ ...prev, total_units: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700">as_of_date<input value={form.as_of_date} onChange={(e) => setForm((prev) => ({ ...prev, as_of_date: e.target.value }))} placeholder="YYYY-MM-DD" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700">avg_price (legacy)<input value={form.avg_price} onChange={(e) => setForm((prev) => ({ ...prev, avg_price: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700">avg_rent (legacy)<input value={form.avg_rent} onChange={(e) => setForm((prev) => ({ ...prev, avg_rent: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700">roi_percent (legacy)<input value={form.roi_percent} onChange={(e) => setForm((prev) => ({ ...prev, roi_percent: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
              </div>
            </div>

            {selected?.media_warnings?.length ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <div className="font-medium">Media governance warnings</div>
                <ul className="mt-2 list-disc pl-5">
                  {selected.media_warnings.map((warning, index) => (
                    <li key={`${warning.path}-${index}`}>{warning.path} — {warning.detail}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void handleSave()} disabled={!selectedId || saving} className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" onClick={() => void handlePublish(true)} disabled={!selectedId || publishing} className="px-4 py-2 rounded-md border border-slate-300 text-sm disabled:opacity-60">Publish</button>
              <button type="button" onClick={() => void handlePublish(false)} disabled={!selectedId || publishing} className="px-4 py-2 rounded-md border border-slate-300 text-sm disabled:opacity-60">Unpublish</button>
            </div>
          </section>

          <aside className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-medium text-slate-800">Media candidates</h2>
            <input
              value={mediaSearch}
              onChange={(e) => setMediaSearch(e.target.value)}
              placeholder="Search media…"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="max-h-[70vh] overflow-auto space-y-2">
              {mediaItems.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, hero_image_url: asset.storage_path }))}
                  className="w-full rounded-md border border-slate-200 p-2 text-left hover:bg-slate-50"
                >
                  <div className="text-xs font-mono break-all text-slate-700">{asset.storage_path}</div>
                  <div className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[11px] ${mediaBadgeClass(asset)}`}>
                    rights={asset.rights_status || 'unknown'} · approval={asset.approval_status || 'unknown'}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Only local `/media/...` paths are accepted. Restricted/rejected assets are blocked on save.
            </p>
            {selectedListItem ? <p className="text-xs text-slate-500">Selected: {selectedListItem.slug}</p> : null}
          </aside>
        </div>
      </main>
    </AdminLayout>
  );
}
