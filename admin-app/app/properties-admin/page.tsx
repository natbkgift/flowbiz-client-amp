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

type PropertyItem = {
  id: string;
  source_id: string;
  slug: string | null;
  title: string;
  description: string | null;
  type: string;
  property_type: string;
  status: string;
  price: number;
  address: string;
  city: string;
  currency: string;
  price_period: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  view: string | null;
  view_label: string | null;
  project_id: string | null;
  area_id: string | null;
  developer_id: string | null;
  cover_image: string | null;
  cover_image_url: string | null;
  local_images: string[] | null;
  tags: string[] | null;
  media_warnings: GovernanceMessage[];
  updated_at: string;
};

type PropertyListResponse = {
  data: PropertyItem[];
  meta: { page: number; limit: number; total: number };
};

type PropertyPublishResponse = {
  property: PropertyItem;
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
  source_id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  property_type: string;
  status: string;
  price: string;
  currency: string;
  price_period: string;
  bedrooms: string;
  bathrooms: string;
  size_sqm: string;
  view: string;
  view_label: string;
  project_id: string;
  area_id: string;
  developer_id: string;
  address: string;
  city: string;
  cover_image: string;
  local_images_text: string;
  tags_text: string;
};

const EMPTY_FORM: FormState = {
  source_id: '',
  slug: '',
  title: '',
  description: '',
  type: 'new',
  property_type: 'condo',
  status: 'inactive',
  price: '',
  currency: 'THB',
  price_period: '',
  bedrooms: '',
  bathrooms: '',
  size_sqm: '',
  view: '',
  view_label: '',
  project_id: '',
  area_id: '',
  developer_id: '',
  address: '',
  city: 'Pattaya',
  cover_image: '',
  local_images_text: '',
  tags_text: '',
};

function parseNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseIntOrNull(value: string): number | null {
  const parsed = parseNumberOrNull(value);
  if (parsed === null) return null;
  return Math.trunc(parsed);
}

function parseLines(value: string): string[] {
  const out: string[] = [];
  for (const line of value.split('\n')) {
    const text = line.trim();
    if (!text) continue;
    if (!out.includes(text)) out.push(text);
  }
  return out;
}

export default function PropertiesAdminPage() {
  const router = useRouter();

  const [items, setItems] = useState<PropertyItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');

  const [mediaItems, setMediaItems] = useState<MediaAsset[]>([]);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaLoading, setMediaLoading] = useState(false);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  function applyToForm(item: PropertyItem): void {
    setForm({
      source_id: item.source_id || '',
      slug: item.slug || '',
      title: item.title || '',
      description: item.description || '',
      type: item.type || 'new',
      property_type: item.property_type || 'condo',
      status: item.status || 'inactive',
      price: String(item.price ?? ''),
      currency: item.currency || 'THB',
      price_period: item.price_period || '',
      bedrooms: item.bedrooms != null ? String(item.bedrooms) : '',
      bathrooms: item.bathrooms != null ? String(item.bathrooms) : '',
      size_sqm: item.size_sqm != null ? String(item.size_sqm) : '',
      view: item.view || '',
      view_label: item.view_label || '',
      project_id: item.project_id || '',
      area_id: item.area_id || '',
      developer_id: item.developer_id || '',
      address: item.address || '',
      city: item.city || 'Pattaya',
      cover_image: item.cover_image || item.cover_image_url || '',
      local_images_text: (item.local_images || []).join('\n'),
      tags_text: (item.tags || []).join(', '),
    });
  }

  async function loadProperties(): Promise<void> {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', '100');
    if (search.trim()) params.set('search', search.trim());
    if (statusFilter.trim()) params.set('status', statusFilter.trim());
    if (typeFilter.trim()) params.set('type', typeFilter.trim());
    if (projectFilter.trim()) params.set('project_id', projectFilter.trim());
    if (areaFilter.trim()) params.set('area_id', areaFilter.trim());

    try {
      const res = await apiRequest<PropertyListResponse>(`/admin/properties?${params.toString()}`);
      setItems(res.data);
      setSelectedIds((prev) => prev.filter((id) => res.data.some((item) => item.id === id)));

      if (res.data.length === 0) {
        setSelectedId(null);
        setForm(EMPTY_FORM);
      } else {
        const next = selectedId && res.data.some((item) => item.id === selectedId)
          ? selectedId
          : res.data[0].id;
        setSelectedId(next);
        const match = res.data.find((item) => item.id === next);
        if (match) applyToForm(match);
      }
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to load properties');
    } finally {
      setLoading(false);
    }
  }

  async function loadMediaCandidates(term: string): Promise<void> {
    setMediaLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '60');
      if (term.trim()) params.set('search', term.trim());
      const data = await apiRequest<MediaAsset[]>(`/admin/properties/media-candidates?${params.toString()}`);
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
    void loadProperties();
    void loadMediaCandidates('');
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadMediaCandidates(mediaSearch);
    }, 250);
    return () => clearTimeout(timer);
  }, [mediaSearch]);

  function currentPayload() {
    return {
      source_id: form.source_id.trim() || `manual-${Date.now()}`,
      slug: form.slug.trim() || null,
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      property_type: form.property_type,
      status: form.status,
      price: Number(form.price),
      currency: form.currency.trim() || 'THB',
      price_period: form.price_period.trim() || null,
      bedrooms: parseIntOrNull(form.bedrooms),
      bathrooms: parseIntOrNull(form.bathrooms),
      size_sqm: parseNumberOrNull(form.size_sqm),
      view: form.view.trim() || null,
      view_label: form.view_label.trim() || null,
      project_id: form.project_id.trim() || null,
      area_id: form.area_id.trim() || null,
      developer_id: form.developer_id.trim() || null,
      address: form.address.trim(),
      city: form.city.trim() || 'Pattaya',
      cover_image: form.cover_image.trim() || null,
      local_images: parseLines(form.local_images_text),
      tags: form.tags_text.split(',').map((tag) => tag.trim()).filter(Boolean),
    };
  }

  async function handleCreate(): Promise<void> {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const created = await apiRequest<PropertyItem>('/admin/properties', {
        method: 'POST',
        body: JSON.stringify(currentPayload()),
      });
      setNotice('Property draft created');
      await loadProperties();
      setSelectedId(created.id);
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to create property');
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
      await apiRequest<PropertyItem>(`/admin/properties/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify(currentPayload()),
      });
      setNotice('Property updated');
      await loadProperties();
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to update property');
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
      const res = await apiRequest<PropertyPublishResponse>(`/admin/properties/${selected.id}/publish`, {
        method: 'POST',
      });
      setNotice(res.published ? 'Property published' : 'Property status unchanged');
      await loadProperties();
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to publish property');
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish(): Promise<void> {
    if (!selected) return;
    setPublishing(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest<PropertyItem>(`/admin/properties/${selected.id}/unpublish`, {
        method: 'POST',
      });
      setNotice('Property unpublished');
      await loadProperties();
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to unpublish property');
    } finally {
      setPublishing(false);
    }
  }

  async function handleBulkStatus(nextStatus: 'active' | 'inactive'): Promise<void> {
    if (selectedIds.length === 0) return;
    setBulkUpdating(true);
    setError(null);
    setNotice(null);
    try {
      const res = await apiRequest<{ updated: number }>('/admin/properties/bulk/status', {
        method: 'POST',
        body: JSON.stringify({
          property_ids: selectedIds,
          status: nextStatus,
        }),
      });
      setNotice(`Bulk update completed (${res.updated} rows).`);
      await loadProperties();
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to run bulk status update');
    } finally {
      setBulkUpdating(false);
    }
  }

  function appendImage(path: string): void {
    const rows = parseLines(form.local_images_text);
    if (rows.includes(path)) return;
    setForm((prev) => ({
      ...prev,
      local_images_text: [...rows, path].join('\n'),
    }));
  }

  function moveImage(index: number, direction: -1 | 1): void {
    const rows = parseLines(form.local_images_text);
    const next = index + direction;
    if (next < 0 || next >= rows.length) return;
    const copy = [...rows];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setForm((prev) => ({ ...prev, local_images_text: copy.join('\n') }));
  }

  const galleryRows = useMemo(() => parseLines(form.local_images_text), [form.local_images_text]);

  return (
    <AdminLayout>
      <main id="main-content" className="max-w-7xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Properties CMS</h1>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSelectedId(null);
              setForm(EMPTY_FORM);
              setNotice('New property draft form ready');
            }}
          >
            New Draft
          </button>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)]">
          EN/TH long-form localization for property content is not fully modeled in this phase. TODO: wire bilingual content fields when content schema is finalized.
        </p>

        {error ? <p className="ui-status ui-status--error" role="alert">{error}</p> : null}
        {notice ? <p className="ui-status ui-status--success" role="status">{notice}</p> : null}

        <section className="card section-stack">
          <h2 className="text-lg font-semibold">Search / Filters</h2>
          <div className="grid md:grid-cols-5 gap-3">
            <label className="form-field">
              <span className="form-label">Search</span>
              <input className="form-input" value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
            <label className="form-field">
              <span className="form-label">Status</span>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">all</option>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="archived">archived</option>
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">Listing type</span>
              <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">all</option>
                <option value="new">new</option>
                <option value="resale">resale</option>
                <option value="rent">rent</option>
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">Project ID</span>
              <input className="form-input" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} />
            </label>
            <label className="form-field">
              <span className="form-label">Area ID</span>
              <input className="form-input" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={() => void loadProperties()} disabled={loading}>
              Apply filters
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => void handleBulkStatus('active')} disabled={bulkUpdating || selectedIds.length === 0}>
              Bulk Publish
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => void handleBulkStatus('inactive')} disabled={bulkUpdating || selectedIds.length === 0}>
              Bulk Unpublish
            </button>
          </div>
        </section>

        <section className="grid lg:grid-cols-[1fr_1.4fr_1fr] gap-4">
          <div className="card section-stack">
            <h2 className="text-lg font-semibold">Properties</h2>
            {loading ? <p>Loading...</p> : null}
            {!loading && items.length === 0 ? (
              <div className="ui-empty">
                <h3 className="ui-empty__title">No properties found</h3>
                <p className="ui-empty__body">Create a draft or change filters.</p>
              </div>
            ) : null}
            <div className="space-y-2 max-h-[72vh] overflow-auto">
              {items.map((item) => {
                const checked = selectedIds.includes(item.id);
                return (
                  <div key={item.id} className={`border rounded-lg px-3 py-2 ${selectedId === item.id ? 'ring-2 ring-[var(--color-primary)]' : ''}`}>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        aria-label={`Select ${item.title}`}
                        checked={checked}
                        onChange={(e) => {
                          setSelectedIds((prev) => {
                            if (e.target.checked) return [...prev, item.id];
                            return prev.filter((id) => id !== item.id);
                          });
                        }}
                      />
                      <button
                        type="button"
                        className="text-left flex-1"
                        onClick={() => {
                          setSelectedId(item.id);
                          applyToForm(item);
                        }}
                      >
                        <p className="font-medium text-safe-wrap">{item.title}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{item.slug || item.source_id} · {item.type} · {item.status}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{Number(item.price).toLocaleString()} {item.currency}</p>
                        {item.media_warnings?.length ? (
                          <p className="text-xs text-amber-700">{item.media_warnings.length} media warning(s)</p>
                        ) : null}
                      </button>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card section-stack">
            <h2 className="text-lg font-semibold">Editor</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="form-field"><span className="form-label">Source ID</span><input className="form-input" value={form.source_id} onChange={(e) => setForm((p) => ({ ...p, source_id: e.target.value }))} /></label>
              <label className="form-field"><span className="form-label">Slug</span><input className="form-input" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} /></label>
              <label className="form-field"><span className="form-label">Title</span><input className="form-input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></label>
              <label className="form-field"><span className="form-label">Listing type</span><select className="form-select" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}><option value="new">new</option><option value="resale">resale</option><option value="rent">rent</option></select></label>
              <label className="form-field"><span className="form-label">Property type</span><select className="form-select" value={form.property_type} onChange={(e) => setForm((p) => ({ ...p, property_type: e.target.value }))}><option value="condo">condo</option><option value="villa">villa</option><option value="house">house</option><option value="land">land</option><option value="hotel">hotel</option><option value="shop">shop</option><option value="office">office</option></select></label>
              <label className="form-field"><span className="form-label">Status</span><select className="form-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><option value="inactive">inactive</option><option value="active">active</option><option value="archived">archived</option></select></label>
              <label className="form-field"><span className="form-label">Price</span><input className="form-input" inputMode="decimal" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} /></label>
              <label className="form-field"><span className="form-label">Currency</span><input className="form-input" value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} /></label>
              <label className="form-field"><span className="form-label">Price period</span><input className="form-input" value={form.price_period} onChange={(e) => setForm((p) => ({ ...p, price_period: e.target.value }))} placeholder="monthly / yearly" /></label>
              <label className="form-field"><span className="form-label">Address</span><input className="form-input" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} /></label>
              <label className="form-field"><span className="form-label">City</span><input className="form-input" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></label>
              <label className="form-field"><span className="form-label">Bedrooms</span><input className="form-input" inputMode="numeric" value={form.bedrooms} onChange={(e) => setForm((p) => ({ ...p, bedrooms: e.target.value }))} /></label>
              <label className="form-field"><span className="form-label">Bathrooms</span><input className="form-input" inputMode="numeric" value={form.bathrooms} onChange={(e) => setForm((p) => ({ ...p, bathrooms: e.target.value }))} /></label>
              <label className="form-field"><span className="form-label">Size (sqm)</span><input className="form-input" inputMode="decimal" value={form.size_sqm} onChange={(e) => setForm((p) => ({ ...p, size_sqm: e.target.value }))} /></label>
              <label className="form-field"><span className="form-label">View type</span><input className="form-input" value={form.view} onChange={(e) => setForm((p) => ({ ...p, view: e.target.value }))} /></label>
              <label className="form-field"><span className="form-label">View label</span><input className="form-input" value={form.view_label} onChange={(e) => setForm((p) => ({ ...p, view_label: e.target.value }))} /></label>
              <label className="form-field"><span className="form-label">Tags (comma-separated)</span><input className="form-input" value={form.tags_text} onChange={(e) => setForm((p) => ({ ...p, tags_text: e.target.value }))} /></label>
              <label className="form-field"><span className="form-label">Project ID</span><input className="form-input" value={form.project_id} onChange={(e) => setForm((p) => ({ ...p, project_id: e.target.value }))} /></label>
              <label className="form-field"><span className="form-label">Area ID</span><input className="form-input" value={form.area_id} onChange={(e) => setForm((p) => ({ ...p, area_id: e.target.value }))} /></label>
              <label className="form-field"><span className="form-label">Developer ID</span><input className="form-input" value={form.developer_id} onChange={(e) => setForm((p) => ({ ...p, developer_id: e.target.value }))} /></label>
              <label className="form-field md:col-span-2"><span className="form-label">Description</span><textarea className="form-textarea min-h-24" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></label>
              <label className="form-field md:col-span-2"><span className="form-label">Cover image path</span><input className="form-input" value={form.cover_image} onChange={(e) => setForm((p) => ({ ...p, cover_image: e.target.value }))} placeholder="/media/..." /></label>
            </div>

            <label className="form-field">
              <span className="form-label">Gallery paths (one per line)</span>
              <textarea className="form-textarea min-h-28" value={form.local_images_text} onChange={(e) => setForm((p) => ({ ...p, local_images_text: e.target.value }))} placeholder="/media/..." />
            </label>

            {galleryRows.length > 0 ? (
              <div className="space-y-1 border rounded-lg p-3">
                <p className="text-sm font-medium">Gallery order</p>
                {galleryRows.map((path, index) => (
                  <div key={path} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 text-safe-wrap">{path}</span>
                    <button type="button" className="btn btn-secondary" onClick={() => moveImage(index, -1)} disabled={index === 0}>Up</button>
                    <button type="button" className="btn btn-secondary" onClick={() => moveImage(index, 1)} disabled={index === galleryRows.length - 1}>Down</button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void handleCreate()}>Create</button>
              <button type="button" className="btn btn-secondary" disabled={!selected || saving} onClick={() => void handleSave()}>Save</button>
              <button type="button" className="btn btn-secondary" disabled={!selected || publishing} onClick={() => void handlePublish()}>Publish</button>
              <button type="button" className="btn btn-secondary" disabled={!selected || publishing} onClick={() => void handleUnpublish()}>Unpublish</button>
            </div>

            {selected?.media_warnings?.length ? (
              <div className="ui-status ui-status--warning">
                <p className="font-medium">Media governance warnings (pending/exception allowed)</p>
                <ul className="list-disc pl-5 text-sm">
                  {selected.media_warnings.map((warning) => (
                    <li key={`${warning.path}-${warning.detail}`}>{warning.path} — {warning.detail}</li>
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
            <div className="space-y-2 max-h-[72vh] overflow-auto">
              {mediaItems.map((item) => {
                const blocked = item.rights_status === 'restricted' || item.rights_status === 'rejected' || item.approval_status === 'rejected';
                const caution = !blocked && (item.approval_status === 'pending' || item.rights_status === 'pending_review' || item.is_exception);
                return (
                  <div key={item.id} className="border rounded-lg p-2 text-sm">
                    <p className="font-medium text-safe-wrap">{item.title || item.storage_path.split('/').pop()}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] text-safe-wrap">{item.storage_path}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">rights={item.rights_status || 'unknown'} · approval={item.approval_status || 'pending'}</p>
                    {blocked ? <p className="text-xs text-red-700">Blocked by rights governance</p> : null}
                    {caution ? <p className="text-xs text-amber-700">Warning: pending/exception asset</p> : null}
                    <div className="flex gap-2 mt-2">
                      <button type="button" className="btn btn-secondary" onClick={() => setForm((p) => ({ ...p, cover_image: item.storage_path }))} disabled={blocked}>Set Cover</button>
                      <button type="button" className="btn btn-secondary" onClick={() => appendImage(item.storage_path)} disabled={blocked}>Add Gallery</button>
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
