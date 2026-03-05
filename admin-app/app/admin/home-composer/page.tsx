'use client';

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  clearAuthSession,
  LEGACY_TOKEN_STORAGE_KEY,
  loginAdmin,
  persistAuthSession,
  readAuthSession,
} from '@/app/_lib/admin-auth';
import { normalizeLocalMediaPath } from '@/app/_lib/local-media';
import { apiRequest } from '../../../lib/api';
import { getToken, setToken } from '../../../lib/auth-store';

type LocaleCode = 'en' | 'th';

type GovernanceMessage = {
  level: string;
  path: string;
  detail: string;
};

type ValidationResult = {
  errors: string[];
  warnings: string[];
  media_warnings: GovernanceMessage[];
};

type ComposerItem = {
  id: string;
  page_key: string;
  locale: LocaleCode;
  status: string;
  version: number;
  config: Record<string, unknown>;
  updated_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type ComposerBundle = {
  page_key: string;
  locale: LocaleCode;
  draft: ComposerItem | null;
  published: ComposerItem | null;
};

type SaveResponse = {
  item: ComposerItem;
  validation: ValidationResult;
};

type SeededAuthSession = {
  token: string;
  email: string;
};

type CandidateProject = {
  id: string;
  slug: string;
  name: string;
  status: string;
  cover_image_url: string | null;
};

type CandidateProperty = {
  id: string;
  source_id: string;
  slug: string | null;
  title: string;
  type: string;
  status: string;
  cover_image: string | null;
};

type MediaAsset = {
  id: string;
  storage_path: string;
  rights_status: string | null;
  approval_status: string | null;
  is_exception: boolean;
};

const SECTION_KEYS = [
  'hero',
  'path_selector',
  'featured_projects',
  'featured_properties',
  'proof_trust',
  'market_insights',
  'reviews',
  'videos',
  'bottom_cta',
] as const;
const HERO_IMAGE_LOCAL_ONLY_ERROR = 'Hero image must use local media only.';

type SectionKey = (typeof SECTION_KEYS)[number];

type HomeComposerConfig = {
  enabled_sections: SectionKey[];
  section_order: SectionKey[];
  hero: {
    heading?: string;
    subheading?: string;
    primary_cta_label?: string;
    primary_cta_url?: string;
    secondary_cta_label?: string;
    secondary_cta_url?: string;
    trust_items?: string[];
    hero_image?: string | null;
  };
  path_selector: {
    enabled?: boolean;
    paths?: Array<{ key: string; label?: string; description?: string; url?: string }>;
  };
  featured_projects: {
    enabled?: boolean;
    mode?: 'manual' | 'auto';
    selected_project_ids?: string[];
    selected_project_slugs?: string[];
    heading?: string;
    subcopy?: string;
    fallback_rule?: string;
  };
  featured_properties: {
    enabled?: boolean;
    mode?: 'manual' | 'auto';
    selected_property_ids?: string[];
    selected_source_ids?: string[];
    heading?: string;
    subcopy?: string;
    fallback_rule?: string;
  };
  proof_trust: {
    enabled?: boolean;
    why_pattaya_metrics?: Array<Record<string, unknown>>;
    trust_proofs?: Array<Record<string, unknown>>;
    process_timeline?: Array<Record<string, unknown>>;
  };
  market_insights: { enabled?: boolean; heading?: string; subcopy?: string; mode?: string };
  reviews: { enabled?: boolean; heading?: string; subcopy?: string; mode?: string };
  videos: { enabled?: boolean; heading?: string; subcopy?: string; mode?: string };
  bottom_cta: {
    enabled?: boolean;
    heading?: string;
    subheading?: string;
    trust_note?: string;
    primary_cta_label?: string;
    primary_cta_url?: string;
    secondary_cta_label?: string;
    secondary_cta_url?: string;
  };
};

function defaultConfig(): HomeComposerConfig {
  return {
    enabled_sections: [...SECTION_KEYS],
    section_order: [...SECTION_KEYS],
    hero: {
      heading: '',
      subheading: '',
      primary_cta_label: '',
      primary_cta_url: '/contact',
      secondary_cta_label: '',
      secondary_cta_url: '/projects',
      trust_items: [],
      hero_image: null,
    },
    path_selector: {
      enabled: true,
      paths: [
        { key: 'buy', label: '', description: '', url: '/buy' },
        { key: 'invest', label: '', description: '', url: '/invest' },
        { key: 'rent', label: '', description: '', url: '/rent' },
        { key: 'sell', label: '', description: '', url: '/sell' },
      ],
    },
    featured_projects: {
      enabled: true,
      mode: 'auto',
      selected_project_ids: [],
      selected_project_slugs: [],
      heading: '',
      subcopy: '',
      fallback_rule: 'priority_recent',
    },
    featured_properties: {
      enabled: true,
      mode: 'auto',
      selected_property_ids: [],
      selected_source_ids: [],
      heading: '',
      subcopy: '',
      fallback_rule: 'mixed_recent',
    },
    proof_trust: {
      enabled: true,
      why_pattaya_metrics: [],
      trust_proofs: [],
      process_timeline: [],
    },
    market_insights: { enabled: true, heading: '', subcopy: '', mode: 'fallback' },
    reviews: { enabled: true, heading: '', subcopy: '', mode: 'fallback' },
    videos: { enabled: true, heading: '', subcopy: '', mode: 'fallback' },
    bottom_cta: {
      enabled: true,
      heading: '',
      subheading: '',
      trust_note: '',
      primary_cta_label: '',
      primary_cta_url: '/contact',
      secondary_cta_label: '',
      secondary_cta_url: '/invest',
    },
  };
}

function normalizeConfig(input: Record<string, unknown> | null | undefined): HomeComposerConfig {
  const base = defaultConfig();
  if (!input || typeof input !== 'object') return base;
  return {
    ...base,
    ...input,
    hero: { ...base.hero, ...(input.hero as Record<string, unknown> ?? {}) },
    path_selector: { ...base.path_selector, ...(input.path_selector as Record<string, unknown> ?? {}) },
    featured_projects: { ...base.featured_projects, ...(input.featured_projects as Record<string, unknown> ?? {}) },
    featured_properties: { ...base.featured_properties, ...(input.featured_properties as Record<string, unknown> ?? {}) },
    proof_trust: { ...base.proof_trust, ...(input.proof_trust as Record<string, unknown> ?? {}) },
    market_insights: { ...base.market_insights, ...(input.market_insights as Record<string, unknown> ?? {}) },
    reviews: { ...base.reviews, ...(input.reviews as Record<string, unknown> ?? {}) },
    videos: { ...base.videos, ...(input.videos as Record<string, unknown> ?? {}) },
    bottom_cta: { ...base.bottom_cta, ...(input.bottom_cta as Record<string, unknown> ?? {}) },
  } as HomeComposerConfig;
}

function parseJsonArray(text: string, fieldName: string): Array<Record<string, unknown>> {
  const raw = text.trim();
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${fieldName} must be valid JSON array`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`${fieldName} must be a JSON array`);
  }
  return parsed as Array<Record<string, unknown>>;
}

function prettyJson(value: unknown): string {
  if (!value || !Array.isArray(value) || value.length === 0) return '[]';
  return JSON.stringify(value, null, 2);
}

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function syncLegacyTokenFromUnifiedSession(): SeededAuthSession | null {
  if (typeof window === 'undefined') return null;
  const session = readAuthSession();
  if (session) {
    setToken(session.token);
    return session;
  }

  const current = getToken();
  if (current?.trim()) {
    const token = current.trim();
    persistAuthSession(token, '');
    return { token, email: '' };
  }

  const legacy = window.localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY) || '';
  if (legacy.trim()) {
    const token = legacy.trim();
    setToken(token);
    persistAuthSession(token, '');
    window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
    return { token, email: '' };
  }
  return null;
}

export default function HomeComposerPage() {
  const [authToken, setAuthToken] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [locale, setLocale] = useState<LocaleCode>('en');
  const [bundle, setBundle] = useState<ComposerBundle | null>(null);
  const [config, setConfig] = useState<HomeComposerConfig>(defaultConfig());

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const [projectCandidates, setProjectCandidates] = useState<CandidateProject[]>([]);
  const [propertyCandidates, setPropertyCandidates] = useState<CandidateProperty[]>([]);
  const [mediaCandidates, setMediaCandidates] = useState<MediaAsset[]>([]);
  const [candidateSearch, setCandidateSearch] = useState('');

  const [metricsText, setMetricsText] = useState('[]');
  const [trustProofsText, setTrustProofsText] = useState('[]');
  const [processTimelineText, setProcessTimelineText] = useState('[]');
  const [trustItemsText, setTrustItemsText] = useState('');
  const [heroImageError, setHeroImageError] = useState<string | null>(null);
  const [heroMediaModalOpen, setHeroMediaModalOpen] = useState(false);
  const heroMediaCloseButtonRef = useRef<HTMLButtonElement | null>(null);

  const draftId = bundle?.draft?.id ?? null;
  const isAuthenticated = authToken.trim().length > 0;

  const selectedProjectIds = useMemo(() => new Set(config.featured_projects.selected_project_ids || []), [config.featured_projects.selected_project_ids]);
  const selectedPropertyIds = useMemo(() => new Set(config.featured_properties.selected_property_ids || []), [config.featured_properties.selected_property_ids]);

  const clearComposerSession = useCallback((nextAuthError?: string): void => {
    setToken(null);
    clearAuthSession();
    setAuthToken('');
    setAuthEmail('');
    setLoginPassword('');
    setBundle(null);
    setProjectCandidates([]);
    setPropertyCandidates([]);
    setMediaCandidates([]);
    setValidation(null);
    setNotice(null);
    setSaving(false);
    setPublishing(false);
    setLoading(false);
    setHeroImageError(null);
    setHeroMediaModalOpen(false);
    if (nextAuthError) {
      setAuthError(nextAuthError);
    }
  }, []);

  const handleComposerUnauthorized = useCallback((err: unknown): boolean => {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      clearComposerSession('Session expired. Please sign in again.');
      return true;
    }
    return false;
  }, [clearComposerSession]);

  const loadBundle = useCallback(async (targetLocale: LocaleCode): Promise<void> => {
    const activeToken = getToken();
    if (!activeToken?.trim()) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      let nextBundle: ComposerBundle;
      try {
        nextBundle = await apiRequest<ComposerBundle>(`/admin/home-composer?page_key=home&locale=${targetLocale}`);
      } catch (err) {
        if (handleComposerUnauthorized(err)) return;
        throw err;
      }

      if (!nextBundle.draft) {
        const created = await apiRequest<ComposerItem>('/admin/home-composer', {
          method: 'POST',
          body: JSON.stringify({ page_key: 'home', locale: targetLocale, config: defaultConfig() }),
        });
        nextBundle = { ...nextBundle, draft: created };
      }

      setBundle(nextBundle);
      const rawConfig = normalizeConfig((nextBundle.draft?.config ?? nextBundle.published?.config ?? defaultConfig()) as Record<string, unknown>);
      setConfig(rawConfig);
      setMetricsText(prettyJson(rawConfig.proof_trust.why_pattaya_metrics));
      setTrustProofsText(prettyJson(rawConfig.proof_trust.trust_proofs));
      setProcessTimelineText(prettyJson(rawConfig.proof_trust.process_timeline));
      setTrustItemsText((rawConfig.hero.trust_items || []).join('\n'));
      setValidation(null);
      setHeroImageError(null);
      setHeroMediaModalOpen(false);
    } catch (err) {
      if (handleComposerUnauthorized(err)) return;
      setError(err instanceof Error ? err.message : 'Unable to load home composer');
    } finally {
      setLoading(false);
    }
  }, [handleComposerUnauthorized]);

  const loadCandidates = useCallback(async (term: string): Promise<void> => {
    const activeToken = getToken();
    if (!activeToken?.trim()) return;
    try {
      const query = term.trim() ? `?search=${encodeURIComponent(term.trim())}` : '';
      const [projects, properties, media] = await Promise.all([
        apiRequest<CandidateProject[]>(`/admin/home-composer/candidates/projects${query}`),
        apiRequest<CandidateProperty[]>(`/admin/home-composer/candidates/properties${query}`),
        apiRequest<MediaAsset[]>(`/admin/properties/media-candidates?limit=60${term.trim() ? `&search=${encodeURIComponent(term.trim())}` : ''}`),
      ]);
      setProjectCandidates(projects);
      setPropertyCandidates(properties);
      setMediaCandidates(media);
    } catch (err) {
      if (handleComposerUnauthorized(err)) return;
      setError('Unable to load candidates');
    }
  }, [handleComposerUnauthorized]);

  useEffect(() => {
    const seededSession = syncLegacyTokenFromUnifiedSession();
    if (!seededSession) return;
    setAuthToken(seededSession.token);
    setAuthEmail(seededSession.email);
    if (seededSession.email) {
      setLoginEmail(seededSession.email);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadBundle(locale);
  }, [isAuthenticated, loadBundle, locale]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setTimeout(() => {
      void loadCandidates(candidateSearch);
    }, 250);
    return () => clearTimeout(timer);
  }, [candidateSearch, isAuthenticated, loadCandidates]);

  useEffect(() => {
    if (!heroMediaModalOpen) return;
    heroMediaCloseButtonRef.current?.focus();
  }, [heroMediaModalOpen]);

  useEffect(() => {
    if (!heroMediaModalOpen) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setHeroMediaModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [heroMediaModalOpen]);

  async function login(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const email = loginEmail.trim();
    const password = loginPassword;
    if (!email || !password) {
      setAuthError('Email and password are required.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = await loginAdmin(email, password);
      if (!result.ok) {
        setAuthError(result.status === 401 ? 'Invalid credentials.' : 'Unable to sign in right now.');
        return;
      }
      const token = result.accessToken;
      setToken(token);
      persistAuthSession(token, email);
      setAuthToken(token);
      setAuthEmail(email);
      setLoginPassword('');
      setError(null);
      await Promise.all([loadBundle(locale), loadCandidates(candidateSearch)]);
    } catch {
      setAuthError('Unable to sign in right now.');
    } finally {
      setAuthLoading(false);
    }
  }

  function logout(): void {
    setAuthError(null);
    setError(null);
    clearComposerSession();
  }

  function updateSectionEnabled(section: SectionKey, enabled: boolean): void {
    const next = new Set(config.enabled_sections || []);
    if (enabled) next.add(section);
    else next.delete(section);
    setConfig((prev) => ({ ...prev, enabled_sections: SECTION_KEYS.filter((key) => next.has(key)) }));
  }

  function moveSection(section: SectionKey, direction: -1 | 1): void {
    const order = [...(config.section_order || SECTION_KEYS)];
    const idx = order.indexOf(section);
    const nextIdx = idx + direction;
    if (idx < 0 || nextIdx < 0 || nextIdx >= order.length) return;
    [order[idx], order[nextIdx]] = [order[nextIdx], order[idx]];
    setConfig((prev) => ({ ...prev, section_order: order }));
  }

  function toggleProjectSelection(id: string): void {
    const current = [...(config.featured_projects.selected_project_ids || [])];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    setConfig((prev) => ({
      ...prev,
      featured_projects: {
        ...prev.featured_projects,
        selected_project_ids: next,
      },
    }));
  }

  function togglePropertySelection(id: string): void {
    const current = [...(config.featured_properties.selected_property_ids || [])];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    setConfig((prev) => ({
      ...prev,
      featured_properties: {
        ...prev.featured_properties,
        selected_property_ids: next,
      },
    }));
  }

  function updateHeroImage(nextValue: string | null): void {
    const raw = nextValue ?? '';
    const trimmed = raw.trim();
    setConfig((prev) => ({ ...prev, hero: { ...prev.hero, hero_image: raw || null } }));
    if (!trimmed) {
      setHeroImageError(null);
      return;
    }
    setHeroImageError(normalizeLocalMediaPath(trimmed) ? null : HERO_IMAGE_LOCAL_ONLY_ERROR);
  }

  function selectHeroMedia(nextValue: string): void {
    const normalized = normalizeLocalMediaPath(nextValue);
    if (!normalized) {
      setHeroImageError(HERO_IMAGE_LOCAL_ONLY_ERROR);
      return;
    }
    setHeroImageError(null);
    setConfig((prev) => ({ ...prev, hero: { ...prev.hero, hero_image: normalized } }));
    setHeroMediaModalOpen(false);
  }

  function readConfigForSave(): HomeComposerConfig {
    const heroImageValue = (config.hero.hero_image || '').trim();
    const normalizedHeroImage = heroImageValue ? normalizeLocalMediaPath(heroImageValue) : null;
    if (heroImageValue && !normalizedHeroImage) {
      setHeroImageError(HERO_IMAGE_LOCAL_ONLY_ERROR);
    }
    const safeHeroImage = heroImageValue && normalizedHeroImage ? normalizedHeroImage : null;
    return {
      ...config,
      hero: {
        ...config.hero,
        hero_image: safeHeroImage,
        trust_items: splitLines(trustItemsText),
      },
      proof_trust: {
        ...config.proof_trust,
        why_pattaya_metrics: parseJsonArray(metricsText, 'proof_trust.why_pattaya_metrics'),
        trust_proofs: parseJsonArray(trustProofsText, 'proof_trust.trust_proofs'),
        process_timeline: parseJsonArray(processTimelineText, 'proof_trust.process_timeline'),
      },
    };
  }

  async function handleSaveDraft(): Promise<void> {
    if (!draftId) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const payloadConfig = readConfigForSave();
      const res = await apiRequest<SaveResponse>(`/admin/home-composer/${draftId}`, {
        method: 'PATCH',
        body: JSON.stringify({ config: payloadConfig }),
      });
      setValidation(res.validation);
      setNotice('Draft saved');
      setBundle((prev) => prev ? ({ ...prev, draft: res.item }) : prev);
      setConfig(normalizeConfig(res.item.config as Record<string, unknown>));
    } catch (err) {
      if (handleComposerUnauthorized(err)) return;
      setError(err instanceof Error ? err.message : 'Unable to save draft');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(): Promise<void> {
    if (!draftId) return;
    setPublishing(true);
    setError(null);
    setNotice(null);
    try {
      await handleSaveDraft();
      const res = await apiRequest<SaveResponse>(`/admin/home-composer/${draftId}/publish`, {
        method: 'POST',
      });
      setValidation(res.validation);
      setNotice('Published');
      setBundle((prev) => prev ? ({ ...prev, published: res.item }) : prev);
    } catch (err) {
      if (handleComposerUnauthorized(err)) return;
      setError(err instanceof Error ? err.message : 'Unable to publish');
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
    <main id="main-content" className="container content-stack">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Home Composer</h1>
          <p className="text-sm text-slate-600">Compose Home sections, hero copy/media, and featured entity selections with governance-aware publish checks.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-slate-700">
            Locale
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as LocaleCode)}
              className="ml-2 rounded-md border border-slate-300 px-2 py-1"
            >
              <option value="en">EN</option>
              <option value="th">TH</option>
            </select>
          </label>
          {isAuthenticated ? (
            <>
              <button type="button" onClick={() => void loadBundle(locale)} disabled={loading} className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-60">{loading ? 'Refreshing…' : 'Refresh'}</button>
              <button type="button" onClick={() => void handleSaveDraft()} disabled={saving || loading} className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save Draft'}</button>
              <button type="button" onClick={() => void handlePublish()} disabled={publishing || loading} className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-60">{publishing ? 'Publishing…' : 'Publish'}</button>
              <button type="button" onClick={logout} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Sign out</button>
            </>
          ) : null}
        </div>
      </header>

      <section className="card dashboard-controls" aria-label="Admin sign in">
        {!isAuthenticated ? (
          <form className="crm-login-form" onSubmit={(event) => void login(event)}>
            <h2>Admin sign in</h2>
            <p className="locale-safe">Use the same admin credentials as /api/v1/auth/login.</p>

            <label className="field" htmlFor="home-composer-login-email">
              <span>Admin email</span>
              <input
                id="home-composer-login-email"
                type="email"
                autoComplete="username"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
            </label>

            <label className="field" htmlFor="home-composer-login-password">
              <span>Password</span>
              <input
                id="home-composer-login-password"
                type="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />
            </label>

            {authError ? <div className="state-error">{authError}</div> : null}

            <div className="card-actions">
              <button className="btn" type="submit" disabled={authLoading}>
                {authLoading ? 'Signing in' : 'Sign in'}
              </button>
            </div>
          </form>
        ) : (
          <div className="crm-session-panel" role="status" aria-live="polite">
            <p className="locale-safe">{authEmail ? `Signed in as ${authEmail}` : 'Signed in session active.'}</p>
          </div>
        )}
        {!isAuthenticated ? <div className="state-empty">Sign in to manage home composer.</div> : null}
      </section>

      {isAuthenticated ? (
        <>
          {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
          {notice ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div> : null}

          {validation && (validation.errors.length > 0 || validation.warnings.length > 0 || validation.media_warnings.length > 0) ? (
            <section className="rounded-md border border-slate-200 bg-white p-3 text-sm" aria-live="polite">
              <h2 className="font-medium text-slate-900">Validation panel</h2>
              {validation.errors.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 text-rose-700">
                  {validation.errors.map((item, index) => <li key={`error-${index}`}>{item}</li>)}
                </ul>
              ) : null}
              {validation.warnings.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 text-amber-700">
                  {validation.warnings.map((item, index) => <li key={`warn-${index}`}>{item}</li>)}
                </ul>
              ) : null}
              {validation.media_warnings.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 text-amber-700">
                  {validation.media_warnings.map((item, index) => <li key={`media-${index}`}>{item.path} — {item.detail}</li>)}
                </ul>
              ) : null}
            </section>
          ) : null}

          {loading ? (
            <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">Loading composer configuration…</div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr,1fr]">
          <section className="space-y-4">
            <article className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-medium text-slate-900">Section controls (enable + order)</h2>
              <div className="mt-3 space-y-2">
                {(config.section_order || SECTION_KEYS).map((section, idx) => (
                  <div key={section} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={(config.enabled_sections || []).includes(section)}
                        onChange={(e) => updateSectionEnabled(section, e.target.checked)}
                      />
                      {section}
                    </label>
                    <div className="flex items-center gap-1">
                      <button type="button" className="rounded border border-slate-300 px-2 py-1 text-xs" onClick={() => moveSection(section, -1)} disabled={idx === 0}>Up</button>
                      <button type="button" className="rounded border border-slate-300 px-2 py-1 text-xs" onClick={() => moveSection(section, 1)} disabled={idx === (config.section_order || SECTION_KEYS).length - 1}>Down</button>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
              <h2 className="text-sm font-medium text-slate-900">Hero</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm text-slate-700">Heading<input value={config.hero.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, heading: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700">Subheading<input value={config.hero.subheading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, subheading: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700">Primary CTA label<input value={config.hero.primary_cta_label || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, primary_cta_label: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700">Primary CTA URL<input value={config.hero.primary_cta_url || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, primary_cta_url: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700">Secondary CTA label<input value={config.hero.secondary_cta_label || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, secondary_cta_label: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700">Secondary CTA URL<input value={config.hero.secondary_cta_url || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, secondary_cta_url: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
              </div>
              <label className="block text-sm text-slate-700">Hero image (`/media/...` only)
                <div className="mt-1 flex items-center gap-2">
                  <input
                    value={config.hero.hero_image || ''}
                    onChange={(e) => updateHeroImage(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2"
                    aria-invalid={!!heroImageError}
                    aria-describedby={heroImageError ? 'hero-image-error' : undefined}
                  />
                  <button type="button" aria-label="Choose hero image media" onClick={() => setHeroMediaModalOpen(true)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                    Choose media
                  </button>
                </div>
              </label>
              {heroImageError ? (
                <p id="hero-image-error" className="text-sm text-rose-700" role="alert">
                  {heroImageError}
                </p>
              ) : null}
              {heroMediaModalOpen ? (
                <div
                  className="rounded-md border border-slate-200 bg-white p-3"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Hero image media picker"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-700">Select a media asset for the hero image.</p>
                    <button ref={heroMediaCloseButtonRef} type="button" aria-label="Close hero image media picker" className="rounded border border-slate-300 px-2 py-1 text-xs" onClick={() => setHeroMediaModalOpen(false)}>
                      Close
                    </button>
                  </div>
                  <div className="max-h-56 space-y-2 overflow-auto">
                    {mediaCandidates.length > 0 ? mediaCandidates.map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        aria-label={`Select hero image ${asset.storage_path || asset.id}`}
                        onClick={() => selectHeroMedia(asset.storage_path)}
                        className="w-full rounded-md border border-slate-200 p-2 text-left hover:bg-slate-50"
                      >
                        <div className="font-mono text-xs text-slate-700 break-all">{asset.storage_path}</div>
                        <div className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[11px] ${mediaBadgeClass(asset)}`}>
                          rights={asset.rights_status || 'unknown'} · approval={asset.approval_status || 'unknown'}
                        </div>
                      </button>
                    )) : <div className="text-sm text-slate-500">No media items available.</div>}
                  </div>
                </div>
              ) : null}
              <label className="block text-sm text-slate-700">Trust micro-strip items (one per line)
                <textarea value={trustItemsText} onChange={(e) => setTrustItemsText(e.target.value)} rows={4} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
              <h2 className="text-sm font-medium text-slate-900">Path selector</h2>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={Boolean(config.path_selector.enabled)} onChange={(e) => setConfig((prev) => ({ ...prev, path_selector: { ...prev.path_selector, enabled: e.target.checked } }))} />
                Enabled
              </label>
              {(config.path_selector.paths || []).map((path, idx) => (
                <div key={path.key || idx} className="rounded-md border border-slate-200 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{path.key}</div>
                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                    <label className="text-sm text-slate-700">Label<input value={path.label || ''} onChange={(e) => setConfig((prev) => {
                      const nextPaths = [...(prev.path_selector.paths || [])];
                      nextPaths[idx] = { ...nextPaths[idx], label: e.target.value };
                      return { ...prev, path_selector: { ...prev.path_selector, paths: nextPaths } };
                    })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                    <label className="text-sm text-slate-700">Description<input value={path.description || ''} onChange={(e) => setConfig((prev) => {
                      const nextPaths = [...(prev.path_selector.paths || [])];
                      nextPaths[idx] = { ...nextPaths[idx], description: e.target.value };
                      return { ...prev, path_selector: { ...prev.path_selector, paths: nextPaths } };
                    })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                    <label className="text-sm text-slate-700">URL<input value={path.url || ''} onChange={(e) => setConfig((prev) => {
                      const nextPaths = [...(prev.path_selector.paths || [])];
                      nextPaths[idx] = { ...nextPaths[idx], url: e.target.value };
                      return { ...prev, path_selector: { ...prev.path_selector, paths: nextPaths } };
                    })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                  </div>
                </div>
              ))}
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
              <h2 className="text-sm font-medium text-slate-900">Featured Projects</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm text-slate-700">Mode
                  <select value={config.featured_projects.mode || 'auto'} onChange={(e) => setConfig((prev) => ({ ...prev, featured_projects: { ...prev.featured_projects, mode: e.target.value as 'manual' | 'auto' } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                    <option value="auto">auto</option>
                    <option value="manual">manual</option>
                  </select>
                </label>
                <label className="text-sm text-slate-700">Fallback rule<input value={config.featured_projects.fallback_rule || ''} onChange={(e) => setConfig((prev) => ({ ...prev, featured_projects: { ...prev.featured_projects, fallback_rule: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700">Heading<input value={config.featured_projects.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, featured_projects: { ...prev.featured_projects, heading: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700">Subcopy<input value={config.featured_projects.subcopy || ''} onChange={(e) => setConfig((prev) => ({ ...prev, featured_projects: { ...prev.featured_projects, subcopy: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
              </div>
              <div className="max-h-52 overflow-auto rounded-md border border-slate-200 p-2">
                {projectCandidates.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
                    <input
                      id={`featured-project-${item.id}`}
                      type="checkbox"
                      checked={selectedProjectIds.has(item.id)}
                      onChange={() => toggleProjectSelection(item.id)}
                      aria-label={`Select project ${item.name || item.slug || item.id}`}
                    />
                    <label htmlFor={`featured-project-${item.id}`} className="cursor-pointer">
                      <span className="font-medium text-slate-800">{item.name || item.slug || item.id}</span>
                      <span className="ml-2 text-xs text-slate-500">{item.slug} · {item.status}</span>
                    </label>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
              <h2 className="text-sm font-medium text-slate-900">Featured Properties / Investment picks</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm text-slate-700">Mode
                  <select value={config.featured_properties.mode || 'auto'} onChange={(e) => setConfig((prev) => ({ ...prev, featured_properties: { ...prev.featured_properties, mode: e.target.value as 'manual' | 'auto' } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                    <option value="auto">auto</option>
                    <option value="manual">manual</option>
                  </select>
                </label>
                <label className="text-sm text-slate-700">Fallback rule<input value={config.featured_properties.fallback_rule || ''} onChange={(e) => setConfig((prev) => ({ ...prev, featured_properties: { ...prev.featured_properties, fallback_rule: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700">Heading<input value={config.featured_properties.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, featured_properties: { ...prev.featured_properties, heading: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700">Subcopy<input value={config.featured_properties.subcopy || ''} onChange={(e) => setConfig((prev) => ({ ...prev, featured_properties: { ...prev.featured_properties, subcopy: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
              </div>
              <div className="max-h-52 overflow-auto rounded-md border border-slate-200 p-2">
                {propertyCandidates.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
                    <input
                      id={`featured-property-${item.id}`}
                      type="checkbox"
                      checked={selectedPropertyIds.has(item.id)}
                      onChange={() => togglePropertySelection(item.id)}
                      aria-label={`Select property ${item.title || item.source_id || item.id}`}
                    />
                    <label htmlFor={`featured-property-${item.id}`} className="cursor-pointer">
                      <span className="font-medium text-slate-800">{item.title || item.source_id || item.id}</span>
                      <span className="ml-2 text-xs text-slate-500">{item.source_id} · {item.status} · {item.type}</span>
                    </label>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
              <h2 className="text-sm font-medium text-slate-900">Proof / Trust</h2>
              <label className="block text-sm text-slate-700">Why Pattaya metrics JSON
                <textarea rows={6} value={metricsText} onChange={(e) => setMetricsText(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs" />
              </label>
              <label className="block text-sm text-slate-700">Trust proofs JSON
                <textarea rows={6} value={trustProofsText} onChange={(e) => setTrustProofsText(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs" />
              </label>
              <label className="block text-sm text-slate-700">Process timeline JSON
                <textarea rows={6} value={processTimelineText} onChange={(e) => setProcessTimelineText(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs" />
              </label>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
              <h2 className="text-sm font-medium text-slate-900">Market Insights / Reviews / Videos / Bottom CTA</h2>
              {(['market_insights', 'reviews', 'videos'] as const).map((section) => (
                <div key={section} className="rounded-md border border-slate-200 p-3 space-y-2">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{section}</div>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={Boolean(config[section].enabled)} onChange={(e) => setConfig((prev) => ({ ...prev, [section]: { ...prev[section], enabled: e.target.checked } }))} />
                    Enabled
                  </label>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <label className="text-sm text-slate-700">Heading<input value={config[section].heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, [section]: { ...prev[section], heading: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                    <label className="text-sm text-slate-700">Subcopy<input value={config[section].subcopy || ''} onChange={(e) => setConfig((prev) => ({ ...prev, [section]: { ...prev[section], subcopy: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                    <label className="text-sm text-slate-700">Mode<input value={config[section].mode || ''} onChange={(e) => setConfig((prev) => ({ ...prev, [section]: { ...prev[section], mode: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                  </div>
                </div>
              ))}
              <div className="rounded-md border border-slate-200 p-3 space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">bottom_cta</div>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={Boolean(config.bottom_cta.enabled)} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, enabled: e.target.checked } }))} />
                  Enabled
                </label>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <label className="text-sm text-slate-700">Heading<input value={config.bottom_cta.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, heading: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                  <label className="text-sm text-slate-700">Subheading<input value={config.bottom_cta.subheading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, subheading: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                  <label className="text-sm text-slate-700">Trust note<input value={config.bottom_cta.trust_note || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, trust_note: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                  <label className="text-sm text-slate-700">Primary label<input value={config.bottom_cta.primary_cta_label || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, primary_cta_label: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                  <label className="text-sm text-slate-700">Primary URL<input value={config.bottom_cta.primary_cta_url || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, primary_cta_url: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                  <label className="text-sm text-slate-700">Secondary label<input value={config.bottom_cta.secondary_cta_label || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, secondary_cta_label: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                  <label className="text-sm text-slate-700">Secondary URL<input value={config.bottom_cta.secondary_cta_url || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, secondary_cta_url: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                </div>
              </div>
            </article>
          </section>

          <aside className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-medium text-slate-900">Media picker</h2>
              <input value={candidateSearch} onChange={(e) => setCandidateSearch(e.target.value)} placeholder="Search projects/properties/media" className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <div className="mt-3 max-h-[65vh] space-y-2 overflow-auto">
                {mediaCandidates.map((asset) => (
                  <button key={asset.id} type="button" onClick={() => selectHeroMedia(asset.storage_path)} className="w-full rounded-md border border-slate-200 p-2 text-left hover:bg-slate-50">
                    <div className="font-mono text-xs text-slate-700 break-all">{asset.storage_path}</div>
                    <div className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[11px] ${mediaBadgeClass(asset)}`}>
                      rights={asset.rights_status || 'unknown'} · approval={asset.approval_status || 'unknown'}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <h2 className="font-medium text-slate-900">Composer status</h2>
              <ul className="mt-2 space-y-1">
                <li>Page key: {bundle?.page_key || 'home'}</li>
                <li>Locale: {bundle?.locale || locale}</li>
                <li>Draft version: {bundle?.draft?.version ?? 'N/A'}</li>
                <li>Published version: {bundle?.published?.version ?? 'N/A'}</li>
                <li>Published at: {bundle?.published?.published_at || 'N/A'}</li>
              </ul>
            </section>
          </aside>
        </div>
        </>
      ) : null}
    </main>
  );
}
