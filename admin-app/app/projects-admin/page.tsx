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

type AdminProjectItem = {
  id: string;
  slug: string;
  name: string;
  status: string;
  property_type: string;
  cover_image_url: string | null;
  hero_image_url: string | null;
  images: string[] | null;
  summary: Record<string, string>;
  media_warnings: GovernanceMessage[];
  created_at: string;
  updated_at: string;
};

type AdminProjectListResponse = {
  data: AdminProjectItem[];
  meta: { page: number; limit: number; total: number };
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

type ProjectPublishResponse = {
  project: AdminProjectItem;
  published: boolean;
};

const EMPTY_FORM = {
  slug: '',
  name: '',
  status: 'draft',
  property_type: 'condo',
  cover_image_url: '',
  hero_image_url: '',
  images_text: '',
  summary_en: '',
  summary_th: '',
};

export default function AdminProjectsPage() {
  const router = useRouter();

  const [items, setItems] = useState<AdminProjectItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [mediaItems, setMediaItems] = useState<MediaAsset[]>([]);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaLoading, setMediaLoading] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  function applyProjectToForm(project: AdminProjectItem): void {
    setForm({
      slug: project.slug,
      name: project.name,
      status: project.status,
      property_type: project.property_type || 'condo',
      cover_image_url: project.cover_image_url || '',
      hero_image_url: project.hero_image_url || '',
      images_text: (project.images || []).join('\n'),
      summary_en: String(project.summary?.en || ''),
      summary_th: String(project.summary?.th || ''),
    });
  }

  async function loadProjects(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<AdminProjectListResponse>('/admin/projects?limit=100&page=1');
      setItems(res.data);
      if (res.data.length === 0) {
        setSelectedId(null);
        setForm(EMPTY_FORM);
      } else {
        const next = selectedId && res.data.some((item) => item.id === selectedId)
          ? selectedId
          : res.data[0].id;
        setSelectedId(next);
        const match = res.data.find((item) => item.id === next);
        if (match) applyProjectToForm(match);
      }
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError('Unable to load projects');
    } finally {
      setLoading(false);
    }
  }

  async function loadMediaCandidates(searchTerm: string): Promise<void> {
    setMediaLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '60');
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      const data = await apiRequest<MediaAsset[]>(`/admin/projects-media?${params.toString()}`);
      setMediaItems(data);
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError('Unable to load media candidates');
    } finally {
      setMediaLoading(false);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    void loadProjects();
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
      const images = form.images_text
        .split('\n')
        .map((v) => v.trim())
        .filter(Boolean);

      const created = await apiRequest<AdminProjectItem>('/admin/projects', {
        method: 'POST',
        body: JSON.stringify({
          slug: form.slug.trim(),
          name: form.name.trim(),
          status: form.status,
          property_type: form.property_type,
          cover_image_url: form.cover_image_url.trim() || null,
          hero_image_url: form.hero_image_url.trim() || null,
          images,
          summary: {
            en: form.summary_en.trim(),
            th: form.summary_th.trim(),
          },
        }),
      });
      setNotice('Project created');
      await loadProjects();
      setSelectedId(created.id);
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to create project');
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(): Promise<void> {
    if (!selected) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const images = form.images_text
        .split('\n')
        .map((v) => v.trim())
        .filter(Boolean);

      await apiRequest<AdminProjectItem>(`/admin/projects/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          slug: form.slug.trim(),
          name: form.name.trim(),
          status: form.status,
          property_type: form.property_type,
          cover_image_url: form.cover_image_url.trim() || null,
          hero_image_url: form.hero_image_url.trim() || null,
          images,
          summary: {
            en: form.summary_en.trim(),
            th: form.summary_th.trim(),
          },
        }),
      });
      setNotice('Project updated');
      await loadProjects();
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to update project');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(): Promise<void> {
    if (!selected) return;
    setPublishing(true);
    setError(null);
    setNotice(null);
    try {
      const res = await apiRequest<ProjectPublishResponse>(`/admin/projects/${selected.id}/publish`, {
        method: 'POST',
      });
      setNotice(res.published ? 'Project published' : 'Project status unchanged');
      await loadProjects();
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to publish project');
    } finally {
      setPublishing(false);
    }
  }

  function appendImagePath(path: string): void {
    const current = form.images_text
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean);
    if (current.includes(path)) return;
    setForm((prev) => ({
      ...prev,
      images_text: [...current, path].join('\n'),
    }));
  }

  return (
    <AdminLayout>
      <main id="main-content" className="max-w-7xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Projects CMS</h1>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSelectedId(null);
              setForm(EMPTY_FORM);
              setNotice('New project draft form ready');
            }}
          >
            New Draft
          </button>
        </div>

        {error ? <p className="ui-status ui-status--error" role="alert">{error}</p> : null}
        {notice ? <p className="ui-status ui-status--success" role="status">{notice}</p> : null}

        <section className="grid lg:grid-cols-[1fr_1.3fr_1fr] gap-4">
          <div className="card section-stack">
            <h2 className="text-lg font-semibold">Projects</h2>
            {loading ? <p>Loading...</p> : null}
            <div className="space-y-2 max-h-[70vh] overflow-auto">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(item.id);
                    applyProjectToForm(item);
                  }}
                  className={`w-full text-left border rounded-lg px-3 py-2 ${selectedId === item.id ? 'ring-2 ring-[var(--color-primary)]' : ''}`}
                >
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">/{item.slug} · {item.status}</p>
                  {item.media_warnings.length > 0 ? (
                    <p className="text-xs text-amber-700 mt-1">{item.media_warnings.length} media warning(s)</p>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="card section-stack">
            <h2 className="text-lg font-semibold">Editor</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="form-field">
                <span className="form-label">Slug</span>
                <input className="form-input" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
              </label>
              <label className="form-field">
                <span className="form-label">Name</span>
                <input className="form-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </label>
              <label className="form-field">
                <span className="form-label">Status</span>
                <select className="form-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </select>
              </label>
              <label className="form-field">
                <span className="form-label">Property type</span>
                <input className="form-input" value={form.property_type} onChange={(e) => setForm((p) => ({ ...p, property_type: e.target.value }))} />
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <label className="form-field">
                <span className="form-label">Cover image path</span>
                <input className="form-input" value={form.cover_image_url} onChange={(e) => setForm((p) => ({ ...p, cover_image_url: e.target.value }))} />
              </label>
              <label className="form-field">
                <span className="form-label">Hero image path</span>
                <input className="form-input" value={form.hero_image_url} onChange={(e) => setForm((p) => ({ ...p, hero_image_url: e.target.value }))} />
              </label>
            </div>

            <label className="form-field">
              <span className="form-label">Gallery image paths (one per line)</span>
              <textarea className="form-textarea min-h-28" value={form.images_text} onChange={(e) => setForm((p) => ({ ...p, images_text: e.target.value }))} />
            </label>

            <div className="grid md:grid-cols-2 gap-3">
              <label className="form-field">
                <span className="form-label">Summary EN</span>
                <textarea className="form-textarea min-h-24" value={form.summary_en} onChange={(e) => setForm((p) => ({ ...p, summary_en: e.target.value }))} />
              </label>
              <label className="form-field">
                <span className="form-label">Summary TH</span>
                <textarea className="form-textarea min-h-24" value={form.summary_th} onChange={(e) => setForm((p) => ({ ...p, summary_th: e.target.value }))} />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void handleCreate()}>
                Create
              </button>
              <button type="button" className="btn btn-secondary" disabled={!selected || saving} onClick={() => void handleSave()}>
                Save
              </button>
              <button type="button" className="btn btn-secondary" disabled={!selected || publishing} onClick={() => void handlePublish()}>
                Publish
              </button>
            </div>

            {selected?.media_warnings?.length ? (
              <div className="ui-status ui-status--warning">
                <p className="font-medium">Media governance warnings</p>
                <ul className="list-disc pl-5 text-sm">
                  {selected.media_warnings.map((w) => (
                    <li key={`${w.path}-${w.detail}`}>{w.path} — {w.detail}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="card section-stack">
            <h2 className="text-lg font-semibold">Media Picker</h2>
            <label className="form-field">
              <span className="form-label">Search media</span>
              <input className="form-input" value={mediaSearch} onChange={(e) => setMediaSearch(e.target.value)} placeholder="title, path, domain" />
            </label>
            {mediaLoading ? <p>Loading media...</p> : null}
            <div className="space-y-2 max-h-[70vh] overflow-auto">
              {mediaItems.map((item) => {
                const blocked = item.rights_status === 'restricted' || item.rights_status === 'rejected' || item.approval_status === 'rejected';
                const caution = !blocked && (item.approval_status === 'pending' || item.rights_status === 'pending_review' || item.is_exception);
                return (
                  <div key={item.id} className="border rounded-lg p-2 text-sm">
                    <p className="font-medium text-safe-wrap">{item.title || item.storage_path.split('/').pop()}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] text-safe-wrap">{item.storage_path}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      rights={item.rights_status || 'unknown'} · approval={item.approval_status || 'pending'}
                    </p>
                    {blocked ? <p className="text-xs text-red-700">Blocked by rights governance</p> : null}
                    {caution ? <p className="text-xs text-amber-700">Allowed with warning (pending/exception)</p> : null}
                    <div className="flex gap-2 mt-2">
                      <button type="button" className="btn btn-secondary" onClick={() => setForm((p) => ({ ...p, cover_image_url: item.storage_path }))}>
                        Set Cover
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => setForm((p) => ({ ...p, hero_image_url: item.storage_path }))}>
                        Set Hero
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => appendImagePath(item.storage_path)}>
                        Add Gallery
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </AdminLayout>
  );
}
