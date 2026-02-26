'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { apiRequest, handleUnauthorizedError } from '@/lib/api';
import { getToken } from '@/lib/auth-store';

type MediaAsset = {
  id: string;
  storage_path: string;
  kind: string;
  mime_type: string;
  file_size_bytes: number;
  width: number | null;
  height: number | null;
  checksum_sha256: string;
  title: string | null;
  alt_text_en: string | null;
  alt_text_th: string | null;
  caption_en: string | null;
  caption_th: string | null;
  tags: string[] | null;
  source_url: string | null;
  source_domain: string | null;
  source_type: string | null;
  rights_status: string | null;
  credit: string | null;
  focal_x: string | null;
  focal_y: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type MediaListResponse = {
  data: MediaAsset[];
  meta: { page: number; limit: number; total: number };
};

type UploadResponse = {
  item: MediaAsset;
  deduped: boolean;
};

export default function AdminMediaLibraryPage() {
  const router = useRouter();

  const [items, setItems] = useState<MediaAsset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [sourceDomainFilter, setSourceDomainFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [search, setSearch] = useState('');

  const [uploading, setUploading] = useState(false);
  const [ingestUrl, setIngestUrl] = useState('');
  const [propertySourceId, setPropertySourceId] = useState('');

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  async function loadMedia(): Promise<void> {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', '60');
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (tagFilter.trim()) params.set('tag', tagFilter.trim());
    if (sourceDomainFilter.trim()) params.set('source_domain', sourceDomainFilter.trim());
    if (search.trim()) params.set('search', search.trim());

    try {
      const res = await apiRequest<MediaListResponse>(`/admin/media-assets?${params.toString()}`);
      setItems(res.data);
      if (!selectedId && res.data.length > 0) {
        setSelectedId(res.data[0].id);
      }
      if (selectedId && !res.data.some((item) => item.id === selectedId)) {
        setSelectedId(res.data[0]?.id ?? null);
      }
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError('Unable to load media assets');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    void loadMedia();
  }, [router]);

  async function handleUpload(file: File): Promise<void> {
    setUploading(true);
    setError(null);
    setNotice(null);

    try {
      const form = new FormData();
      form.set('file', file);
      const res = await apiRequest<UploadResponse>('/admin/media-assets/upload', {
        method: 'POST',
        body: form,
      });
      setNotice(res.deduped ? 'Upload matched existing asset (deduped).' : 'Upload successful.');
      await loadMedia();
      setSelectedId(res.item.id);
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleIngestUrl(): Promise<void> {
    if (!ingestUrl.trim()) return;
    setUploading(true);
    setError(null);
    setNotice(null);

    try {
      const res = await apiRequest<UploadResponse>('/admin/media-assets/ingest-url', {
        method: 'POST',
        body: JSON.stringify({
          source_url: ingestUrl.trim(),
          source_type: 'external_url',
          rights_status: 'pending_review',
        }),
      });
      setNotice(res.deduped ? 'Ingest matched existing asset (deduped).' : 'Ingest successful.');
      setIngestUrl('');
      await loadMedia();
      setSelectedId(res.item.id);
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Ingest failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveMetadata(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!selected) return;

    const fd = new FormData(e.currentTarget);
    const tagsRaw = String(fd.get('tags') ?? '').trim();

    const payload = {
      title: String(fd.get('title') ?? '').trim() || null,
      alt_text_en: String(fd.get('alt_text_en') ?? '').trim() || null,
      alt_text_th: String(fd.get('alt_text_th') ?? '').trim() || null,
      caption_en: String(fd.get('caption_en') ?? '').trim() || null,
      caption_th: String(fd.get('caption_th') ?? '').trim() || null,
      source_url: String(fd.get('source_url') ?? '').trim() || null,
      source_type: String(fd.get('source_type') ?? '').trim() || null,
      rights_status: String(fd.get('rights_status') ?? '').trim() || null,
      credit: String(fd.get('credit') ?? '').trim() || null,
      tags: tagsRaw ? tagsRaw.split(',').map((tag) => tag.trim()).filter(Boolean) : null,
      focal_x: String(fd.get('focal_x') ?? '').trim() || null,
      focal_y: String(fd.get('focal_y') ?? '').trim() || null,
    };

    setError(null);
    setNotice(null);

    try {
      const updated = await apiRequest<MediaAsset>(`/admin/media-assets/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setItems((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setNotice('Metadata saved.');
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to save metadata');
    }
  }

  async function handleArchiveRestore(nextStatus: 'archived' | 'active'): Promise<void> {
    if (!selected) return;

    setError(null);
    setNotice(null);

    try {
      const updated = await apiRequest<MediaAsset>(
        `/admin/media-assets/${selected.id}/${nextStatus === 'archived' ? 'archive' : 'restore'}`,
        { method: 'POST' }
      );
      setItems((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setNotice(nextStatus === 'archived' ? 'Asset archived.' : 'Asset restored.');
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Unable to update status');
    }
  }

  async function handleAssignToProperty(): Promise<void> {
    if (!selected || !propertySourceId.trim()) return;

    setError(null);
    setNotice(null);

    try {
      await apiRequest(`/admin/media-assets/${selected.id}/assign/property`, {
        method: 'POST',
        body: JSON.stringify({
          property_source_id: propertySourceId.trim(),
          set_as_cover: true,
          append_to_local_images: true,
        }),
      });
      setNotice(`Assigned to property source_id ${propertySourceId.trim()}.`);
    } catch (err) {
      if (handleUnauthorizedError(err, router)) return;
      setError(err instanceof Error ? err.message : 'Assign failed');
    }
  }

  return (
    <AdminLayout>
      <main id="main-content" className="max-w-7xl mx-auto p-6 section-stack">
        <div className="section-stack">
          <h1 className="text-2xl font-semibold">Media Library</h1>
          <p className="type-small text-[var(--color-text-secondary)]">
            Upload images to local storage only. Runtime usage must reference local paths like <code>/media/...</code>.
          </p>
        </div>

        {error ? <p className="ui-status ui-status--error" role="alert">{error}</p> : null}
        {notice ? <p className="ui-status ui-status--success" role="status">{notice}</p> : null}

        <section className="card section-stack">
          <h2 className="text-lg font-semibold">Upload / Ingest</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="form-field">
              <span className="form-label">Upload image file</span>
              <input
                className="form-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file);
                  e.currentTarget.value = '';
                }}
              />
            </label>

            <div className="form-field">
              <label className="form-label" htmlFor="ingest-url">Ingest from source URL</label>
              <div className="flex gap-2">
                <input
                  id="ingest-url"
                  className="form-input"
                  placeholder="https://example.com/image.jpg"
                  value={ingestUrl}
                  onChange={(e) => setIngestUrl(e.target.value)}
                />
                <button className="btn btn-secondary" type="button" onClick={() => void handleIngestUrl()} disabled={uploading || !ingestUrl.trim()}>
                  Ingest
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="card section-stack">
          <h2 className="text-lg font-semibold">Search / Filters</h2>
          <div className="grid md:grid-cols-4 gap-3">
            <label className="form-field">
              <span className="form-label">Status</span>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'archived')}>
                <option value="all">all</option>
                <option value="active">active</option>
                <option value="archived">archived</option>
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">Tag</span>
              <input className="form-input" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} />
            </label>
            <label className="form-field">
              <span className="form-label">Source domain</span>
              <input className="form-input" value={sourceDomainFilter} onChange={(e) => setSourceDomainFilter(e.target.value)} />
            </label>
            <label className="form-field">
              <span className="form-label">Search title/path</span>
              <input className="form-input" value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
          </div>
          <div>
            <button type="button" className="btn btn-primary" onClick={() => void loadMedia()} disabled={loading}>Apply filters</button>
          </div>
        </section>

        <section className="grid lg:grid-cols-[1.2fr_1fr] gap-4">
          <div className="card section-stack">
            <h2 className="text-lg font-semibold">Assets</h2>
            {loading ? (
              <div className="ui-loading-grid"><div className="ui-loading-card"><div className="skeleton skeleton--image" /><div className="skeleton skeleton--title" /></div></div>
            ) : items.length === 0 ? (
              <div className="ui-empty">
                <h3 className="ui-empty__title">No media assets found</h3>
                <p className="ui-empty__body">Upload an image or change filters.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`text-left card-interactive border rounded-xl p-3 ${selectedId === item.id ? 'ring-2 ring-[var(--color-primary)]' : ''}`}
                  >
                    <div className="media-shell" style={{ aspectRatio: '4 / 3' }}>
                      <img src={item.storage_path} alt={item.alt_text_en || item.alt_text_th || item.title || 'Media asset'} className="media-shell__img" loading="lazy" decoding="async" />
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-safe-wrap text-clamp-2">{item.title || item.storage_path.split('/').pop()}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{item.status} · {item.mime_type}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card section-stack">
            <h2 className="text-lg font-semibold">Metadata / Actions</h2>
            {!selected ? (
              <div className="ui-empty">
                <h3 className="ui-empty__title">Select an asset</h3>
                <p className="ui-empty__body">Pick an item from the grid to edit metadata and assign it.</p>
              </div>
            ) : (
              <>
                <div className="media-shell" style={{ aspectRatio: '16 / 10' }}>
                  <img src={selected.storage_path} alt={selected.alt_text_en || selected.alt_text_th || selected.title || 'Media preview'} className="media-shell__img" loading="lazy" decoding="async" />
                </div>

                <div className="section-stack">
                  <div className="text-xs text-[var(--color-text-secondary)] text-safe-wrap">Path: <strong>{selected.storage_path}</strong></div>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost" type="button" onClick={() => navigator.clipboard.writeText(selected.storage_path)}>Copy local path</button>
                    <a className="btn btn-link" href={selected.storage_path} target="_blank" rel="noreferrer">Open preview</a>
                  </div>
                </div>

                <form className="section-stack" onSubmit={(e) => void handleSaveMetadata(e)}>
                  <label className="form-field"><span className="form-label">Title</span><input name="title" className="form-input" defaultValue={selected.title ?? ''} /></label>
                  <label className="form-field"><span className="form-label">Alt text (EN)</span><input name="alt_text_en" className="form-input" defaultValue={selected.alt_text_en ?? ''} /></label>
                  <label className="form-field"><span className="form-label">Alt text (TH)</span><input name="alt_text_th" className="form-input" defaultValue={selected.alt_text_th ?? ''} /></label>
                  <label className="form-field"><span className="form-label">Caption (EN)</span><textarea name="caption_en" className="form-textarea" defaultValue={selected.caption_en ?? ''} /></label>
                  <label className="form-field"><span className="form-label">Caption (TH)</span><textarea name="caption_th" className="form-textarea" defaultValue={selected.caption_th ?? ''} /></label>
                  <label className="form-field"><span className="form-label">Tags (comma separated)</span><input name="tags" className="form-input" defaultValue={(selected.tags ?? []).join(', ')} /></label>
                  <label className="form-field"><span className="form-label">Source URL</span><input name="source_url" className="form-input" defaultValue={selected.source_url ?? ''} /></label>
                  <label className="form-field"><span className="form-label">Source type</span><input name="source_type" className="form-input" defaultValue={selected.source_type ?? ''} /></label>
                  <label className="form-field"><span className="form-label">Rights status</span><input name="rights_status" className="form-input" defaultValue={selected.rights_status ?? ''} /></label>
                  <label className="form-field"><span className="form-label">Credit</span><input name="credit" className="form-input" defaultValue={selected.credit ?? ''} /></label>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="form-field"><span className="form-label">Focal X (0-100)</span><input name="focal_x" className="form-input" defaultValue={selected.focal_x ?? ''} /></label>
                    <label className="form-field"><span className="form-label">Focal Y (0-100)</span><input name="focal_y" className="form-input" defaultValue={selected.focal_y ?? ''} /></label>
                  </div>

                  <div className="flex gap-2">
                    <button className="btn btn-primary" type="submit">Save metadata</button>
                    {selected.status === 'active' ? (
                      <button className="btn btn-secondary" type="button" onClick={() => void handleArchiveRestore('archived')}>Archive</button>
                    ) : (
                      <button className="btn btn-secondary" type="button" onClick={() => void handleArchiveRestore('active')}>Restore</button>
                    )}
                  </div>
                </form>

                <section className="section-stack">
                  <h3 className="text-base font-semibold">Assign to property (proof flow)</h3>
                  <label className="form-field">
                    <span className="form-label">Property source_id</span>
                    <input className="form-input" value={propertySourceId} onChange={(e) => setPropertySourceId(e.target.value)} placeholder="src-12345" />
                  </label>
                  <button className="btn btn-primary" type="button" onClick={() => void handleAssignToProperty()} disabled={!propertySourceId.trim()}>
                    Assign as cover/local image
                  </button>
                </section>
              </>
            )}
          </div>
        </section>
      </main>
    </AdminLayout>
  );
}
