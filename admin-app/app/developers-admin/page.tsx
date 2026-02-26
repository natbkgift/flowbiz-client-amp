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

type DeveloperItem = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  tier: string | null;
  logo_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type DeveloperDetail = {
  developer: DeveloperItem;
  summary: Record<string, unknown> | null;
  media_warnings: GovernanceMessage[];
};

type DeveloperListResponse = {
  data: DeveloperItem[];
  meta: { page: number; limit: number; total: number };
};

type DeveloperPublishResponse = {
  developer: DeveloperItem;
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
  website: string;
  tier: string;
  status: string;
  logo_url: string;
  summary_json: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  website: '',
  tier: '',
  status: 'inactive',
  logo_url: '',
  summary_json: '',
};

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

export default function DevelopersAdminPage() {
  const router = useRouter();

  const [items, setItems] = useState<DeveloperItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<DeveloperDetail | null>(null);
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

  function applyDetailToForm(detail: DeveloperDetail): void {
    setForm({
      name: detail.developer.name || '',
      slug: detail.developer.slug || '',
      website: detail.developer.website || '',
      tier: detail.developer.tier || '',
      status: detail.developer.status || 'inactive',
      logo_url: detail.developer.logo_url || '',
      summary_json: prettyJson(detail.summary),
    });
  }

  async function loadDevelopers(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<DeveloperListResponse>('/admin/developers?limit=100&page=1');
      setItems(res.data);
      if (!res.data.length) {
        setSelectedId(null);
        setSelected(null);
        setForm(EMPTY_FORM);
        return;
      }
      const next = selectedId && res.data.some((item) => item.id === selectedId) ? selectedId : res.data[0].id;
      setSelectedId(next);
      await loadDeveloperDetail(next);
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to load developers');
    } finally {
      setLoading(false);
    }
  }

  async function loadDeveloperDetail(id: string): Promise<void> {
    try {
      const detail = await apiRequest<DeveloperDetail>(`/admin/developers/${id}`);
      setSelected(detail);
      applyDetailToForm(detail);
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to load developer detail');
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
    void loadDevelopers();
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
      const created = await apiRequest<DeveloperDetail>('/admin/developers', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          website: form.website.trim() || null,
          tier: form.tier.trim() || null,
          status: form.status,
          logo_url: form.logo_url.trim() || null,
          summary: parseObjectOrNull(form.summary_json, 'summary_json'),
        }),
      });
      setNotice('Developer created');
      await loadDevelopers();
      setSelectedId(created.developer.id);
      await loadDeveloperDetail(created.developer.id);
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to create developer');
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
      await apiRequest<DeveloperDetail>(`/admin/developers/${selectedId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          website: form.website.trim() || null,
          tier: form.tier.trim() || null,
          status: form.status,
          logo_url: form.logo_url.trim() || null,
          summary: parseObjectOrNull(form.summary_json, 'summary_json'),
        }),
      });
      setNotice('Developer updated');
      await loadDevelopers();
      await loadDeveloperDetail(selectedId);
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to save developer');
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
      const res = await apiRequest<DeveloperPublishResponse>(`/admin/developers/${selectedId}/${endpoint}`, {
        method: 'POST',
      });
      setNotice(res.published ? 'Developer published' : 'Developer unpublished');
      await loadDevelopers();
      await loadDeveloperDetail(selectedId);
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to update developer publication status');
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
            <h1 className="text-2xl font-semibold text-slate-900">Developers Admin CMS</h1>
            <p className="text-sm text-slate-600">Manage developer entities, profile metadata, and governed logo media.</p>
          </div>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={saving}
            className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm disabled:opacity-60"
          >
            {saving ? 'Creating…' : 'Create Developer'}
          </button>
        </header>

        {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
        {notice ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div> : null}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px,1fr,360px]">
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">Developers</div>
            <div className="max-h-[70vh] overflow-auto p-2">
              {loading ? <div className="px-2 py-3 text-sm text-slate-500">Loading…</div> : null}
              {!loading && !items.length ? <div className="px-2 py-3 text-sm text-slate-500">No developers yet.</div> : null}
              <ul className="space-y-1">
                {items.map((item) => {
                  const active = item.id === selectedId;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(item.id);
                          void loadDeveloperDetail(item.id);
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
                Website
                <input value={form.website} onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-700">
                Tier
                <input value={form.tier} onChange={(e) => setForm((prev) => ({ ...prev, tier: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="premium | mid | budget" />
              </label>
              <label className="text-sm text-slate-700">
                Status
                <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                  <option value="inactive">inactive</option>
                  <option value="active">active</option>
                  <option value="archived">archived</option>
                </select>
              </label>
            </div>

            <label className="text-sm text-slate-700 block">
              Logo (`/media/...` only)
              <input value={form.logo_url} onChange={(e) => setForm((prev) => ({ ...prev, logo_url: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>

            <label className="text-sm text-slate-700 block">
              Summary JSON
              <textarea value={form.summary_json} onChange={(e) => setForm((prev) => ({ ...prev, summary_json: e.target.value }))} rows={10} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs" />
            </label>

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
                  onClick={() => setForm((prev) => ({ ...prev, logo_url: asset.storage_path }))}
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
