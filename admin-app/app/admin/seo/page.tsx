"use client";

import { type FormEvent, useEffect, useState } from "react";

type Locale = "en" | "th";

type AuthSession = { token: string; email: string };
type LoginResponse = { access_token: string; token_type: string };

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
  preserve_query: boolean;
  enabled: boolean;
};

type BrokenLinkReport = {
  id: string;
  checked_at: string;
  checked_pages: string[];
  total_links: number;
  broken_links: Array<{
    source_page: string;
    href: string;
    status: number | null;
    error: string | null;
  }>;
  checker_version: string;
};

type BrokenLinkPolicy = {
  version: string;
  seed_paths: string[];
  max_depth: number;
  max_pages: number;
  max_link_checks: number;
};

type OverrideForm = {
  path: string;
  locale: Locale;
  title: string;
  description: string;
  canonical: string;
  robots_index: boolean;
  robots_follow: boolean;
  enabled: boolean;
};

type RedirectForm = {
  old_path: string;
  new_path: string;
  status_code: 301 | 302;
  preserve_query: boolean;
  enabled: boolean;
};

type SchemaForm = {
  locale: Locale;
  enabled: boolean;
  schema_org_name: string;
  schema_org_url: string;
  schema_org_logo_url: string;
  schema_org_same_as_text: string;
  schema_local_business_name: string;
  schema_local_business_url: string;
  schema_local_business_phone: string;
  schema_local_business_price_range: string;
  schema_local_business_address: string;
  schema_website_name: string;
  schema_website_url: string;
  schema_website_search_path: string;
  schema_article_author: string;
  schema_article_author_url: string;
};

const AUTH_SESSION_STORAGE_KEY = "flowbiz_admin_auth_session_v1";
const LEGACY_TOKEN_STORAGE_KEY = "flowbiz_admin_token";

const copy = {
  en: {
    title: "SEO Controls",
    subtitle: "Owner controls for SEO overrides, redirects, schema source, and broken-link reports.",
    signIn: "Sign in",
    signOut: "Sign out",
    save: "Save",
    refresh: "Refresh",
    loading: "Loading",
    authRequired: "Sign in to use SEO controls.",
    loginTitle: "Admin sign in",
    email: "Admin email",
    password: "Password",
    sectionOverrides: "SEO overrides",
    sectionRedirects: "Redirect manager",
    sectionSchema: "Schema source fields",
    sectionBroken: "Broken links report",
    emptyOverrides: "No overrides yet. Add key pages when available.",
    emptyRedirects: "No redirects yet. Add legacy paths when available.",
    emptyReport: "No report yet. Run checker when ready.",
    emptySchema: "Schema source is empty. Fill approved business data before publishing.",
  },
  th: {
    title: "SEO Controls หลังบ้าน",
    subtitle: "หน้าควบคุม SEO สำหรับ owner ครบ override, redirect, schema source และรายงานลิงก์เสีย.",
    signIn: "เข้าสู่ระบบ",
    signOut: "ออกจากระบบ",
    save: "บันทึก",
    refresh: "รีเฟรช",
    loading: "กำลังโหลด",
    authRequired: "กรุณาเข้าสู่ระบบก่อนใช้งาน SEO controls",
    loginTitle: "เข้าสู่ระบบแอดมิน",
    email: "อีเมลแอดมิน",
    password: "รหัสผ่าน",
    sectionOverrides: "SEO overrides",
    sectionRedirects: "Redirect manager",
    sectionSchema: "Schema source fields",
    sectionBroken: "รายงานลิงก์เสีย",
    emptyOverrides: "ยังไม่มี overrides เพิ่มหน้าสำคัญเมื่อพร้อม",
    emptyRedirects: "ยังไม่มี redirects เพิ่ม path เดิมเมื่อพร้อม",
    emptyReport: "ยังไม่มีรายงาน ให้รัน checker เมื่อพร้อม",
    emptySchema: "ข้อมูล schema ยังว่าง ให้เติมข้อมูลธุรกิจที่อนุมัติก่อนเผยแพร่",
  },
};

function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const q = new URLSearchParams(window.location.search).get("lang");
  if (q === "th" || q === "en") return q;
  return navigator.language.toLowerCase().startsWith("th") ? "th" : "en";
}

function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { token?: string; email?: string };
      if (parsed.token?.trim()) {
        return { token: parsed.token.trim(), email: (parsed.email || "").trim() };
      }
    } catch {
      window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }
  }
  const legacy = (window.localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY) || "").trim();
  if (!legacy) return null;
  const session = { token: legacy, email: "" };
  window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
  return session;
}

function writeSession(token: string, email: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify({ token: token.trim(), email: email.trim() })
  );
  window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
}

function clearSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
}

function emptyOverride(locale: Locale): OverrideForm {
  return {
    path: "/en/projects",
    locale,
    title: "",
    description: "",
    canonical: "",
    robots_index: true,
    robots_follow: true,
    enabled: true,
  };
}

function emptyRedirect(): RedirectForm {
  return {
    old_path: "/legacy-path",
    new_path: "/en/projects",
    status_code: 301,
    preserve_query: true,
    enabled: true,
  };
}

function emptySchema(locale: Locale): SchemaForm {
  return {
    locale,
    enabled: true,
    schema_org_name: "",
    schema_org_url: "",
    schema_org_logo_url: "",
    schema_org_same_as_text: "",
    schema_local_business_name: "",
    schema_local_business_url: "",
    schema_local_business_phone: "",
    schema_local_business_price_range: "",
    schema_local_business_address: "",
    schema_website_name: "",
    schema_website_url: "",
    schema_website_search_path: "",
    schema_article_author: "",
    schema_article_author_url: "",
  };
}

function parseList(value: string): string[] {
  return value
    .split(/[\n,]/g)
    .map((v) => v.trim())
    .filter((v, i, all) => v.length > 0 && all.indexOf(v) === i);
}

function readApiError(error: unknown): string {
  if (!(error instanceof Error)) return "request_failed";
  if (!error.message.startsWith("request_failed:")) return error.message;
  const parts = error.message.split(":");
  return parts.slice(2).join(":").trim() || error.message;
}

async function api<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (token.trim()) headers.set("Authorization", `Bearer ${token.trim()}`);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(path, { ...init, headers, cache: "no-store" });
  if (!response.ok) throw new Error(`request_failed:${response.status}:${await response.text()}`);
  return (await response.json()) as T;
}

export default function AdminSeoPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const [overrides, setOverrides] = useState<SeoOverride[]>([]);
  const [redirects, setRedirects] = useState<RedirectRule[]>([]);
  const [report, setReport] = useState<BrokenLinkReport | null>(null);
  const [policy, setPolicy] = useState<BrokenLinkPolicy | null>(null);

  const [overrideForm, setOverrideForm] = useState<OverrideForm>(emptyOverride("en"));
  const [redirectForm, setRedirectForm] = useState<RedirectForm>(emptyRedirect());
  const [schemaForm, setSchemaForm] = useState<SchemaForm>(emptySchema("en"));

  const [editingOverrideId, setEditingOverrideId] = useState<string | null>(null);
  const [editingRedirectId, setEditingRedirectId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    const l = detectLocale();
    setLocale(l);
    setOverrideForm(emptyOverride(l));
    setSchemaForm(emptySchema(l));
    const s = readSession();
    if (!s) return;
    setToken(s.token);
    setEmail(s.email);
    setLoginEmail(s.email);
  }, []);

  const t = copy[locale];
  const isAuth = token.trim().length > 0;

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setAuthError("missing_credentials");
      return;
    }
    setBusy(true);
    setAuthError(null);
    try {
      const res = await fetch("/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      if (!res.ok) throw new Error(`login_failed:${res.status}`);
      const body = (await res.json()) as LoginResponse;
      const accessToken = String(body.access_token || "").trim();
      if (!accessToken) throw new Error("empty_token");
      setToken(accessToken);
      setEmail(loginEmail.trim());
      writeSession(accessToken, loginEmail.trim());
      await refreshAll(accessToken);
    } catch (error) {
      setAuthError(readApiError(error));
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    clearSession();
    setToken("");
    setEmail("");
    setAuthError(null);
    setOverrides([]);
    setRedirects([]);
    setReport(null);
    setPolicy(null);
    setOverrideForm(emptyOverride(locale));
    setRedirectForm(emptyRedirect());
    setSchemaForm(emptySchema(locale));
    setEditingOverrideId(null);
    setEditingRedirectId(null);
    setPageError(null);
  }

  async function loadOverrides(activeToken: string) {
    const body = await api<{ data: SeoOverride[] }>("/admin/seo/overrides", activeToken);
    setOverrides(body.data || []);
  }

  async function loadRedirects(activeToken: string) {
    const body = await api<{ data: RedirectRule[] }>("/admin/seo/redirects", activeToken);
    setRedirects(body.data || []);
  }

  async function loadSchema(activeToken: string, targetLocale: Locale) {
    const body = await api<{ source: Record<string, unknown> }>(
      `/admin/seo/schema-source?locale=${targetLocale}`,
      activeToken
    );
    const source = body.source || {};
    setSchemaForm({
      locale: targetLocale,
      enabled: Boolean(source.enabled ?? true),
      schema_org_name: String(source.schema_org_name || ""),
      schema_org_url: String(source.schema_org_url || ""),
      schema_org_logo_url: String(source.schema_org_logo_url || ""),
      schema_org_same_as_text: Array.isArray(source.schema_org_same_as)
        ? (source.schema_org_same_as as string[]).join("\n")
        : "",
      schema_local_business_name: String(source.schema_local_business_name || ""),
      schema_local_business_url: String(source.schema_local_business_url || ""),
      schema_local_business_phone: String(source.schema_local_business_phone || ""),
      schema_local_business_price_range: String(source.schema_local_business_price_range || ""),
      schema_local_business_address: String(source.schema_local_business_address || ""),
      schema_website_name: String(source.schema_website_name || ""),
      schema_website_url: String(source.schema_website_url || ""),
      schema_website_search_path: String(source.schema_website_search_path || ""),
      schema_article_author: String(source.schema_article_author || ""),
      schema_article_author_url: String(source.schema_article_author_url || ""),
    });
  }

  async function loadReport(activeToken: string) {
    try {
      const body = await api<{ report: BrokenLinkReport }>("/admin/seo/broken-links/latest", activeToken);
      setReport(body.report || null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("request_failed:404")) {
        setReport(null);
        return;
      }
      throw error;
    }
  }

  async function loadPolicy(activeToken: string) {
    const body = await api<{ policy: BrokenLinkPolicy }>("/admin/seo/broken-links/policy", activeToken);
    setPolicy(body.policy || null);
  }

  async function refreshAll(active?: string) {
    const activeToken = (active ?? token).trim();
    if (!activeToken) return;
    setLoading(true);
    setPageError(null);
    try {
      await Promise.all([
        loadOverrides(activeToken),
        loadRedirects(activeToken),
        loadSchema(activeToken, schemaForm.locale),
        loadReport(activeToken),
        loadPolicy(activeToken),
      ]);
    } catch (error) {
      setPageError(readApiError(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuth) return;
    void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function saveOverride(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuth) return;
    setBusy(true);
    setPageError(null);
    try {
      const payload = {
        path: overrideForm.path.startsWith("/") ? overrideForm.path.trim() : `/${overrideForm.path.trim()}`,
        locale: overrideForm.locale,
        title: overrideForm.title.trim() || null,
        description: overrideForm.description.trim() || null,
        canonical: overrideForm.canonical.trim() || null,
        robots_index: overrideForm.robots_index,
        robots_follow: overrideForm.robots_follow,
        enabled: overrideForm.enabled,
      };
      if (editingOverrideId) {
        await api(`/admin/seo/overrides/${editingOverrideId}`, token, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/admin/seo/overrides", token, { method: "POST", body: JSON.stringify(payload) });
      }
      setEditingOverrideId(null);
      setOverrideForm(emptyOverride(locale));
      await loadOverrides(token);
    } catch (error) {
      setPageError(readApiError(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveRedirect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuth) return;
    setBusy(true);
    setPageError(null);
    try {
      const payload = {
        old_path: redirectForm.old_path.startsWith("/") ? redirectForm.old_path.trim() : `/${redirectForm.old_path.trim()}`,
        new_path: redirectForm.new_path.trim(),
        status_code: redirectForm.status_code,
        preserve_query: redirectForm.preserve_query,
        enabled: redirectForm.enabled,
      };
      if (editingRedirectId) {
        await api(`/admin/seo/redirects/${editingRedirectId}`, token, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/admin/seo/redirects", token, { method: "POST", body: JSON.stringify(payload) });
      }
      setEditingRedirectId(null);
      setRedirectForm(emptyRedirect());
      await loadRedirects(token);
    } catch (error) {
      setPageError(readApiError(error));
    } finally {
      setBusy(false);
    }
  }

  async function preloadRedirectsFromProduction() {
    if (!isAuth) return;
    setBusy(true);
    setPageError(null);
    try {
      await api("/admin/seo/redirects/preload-production", token, {
        method: "POST",
        body: JSON.stringify({ dry_run: false, overwrite_existing: true }),
      });
      await loadRedirects(token);
    } catch (error) {
      setPageError(readApiError(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveSchema(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuth) return;
    setBusy(true);
    setPageError(null);
    try {
      await api("/admin/seo/schema-source", token, {
        method: "PUT",
        body: JSON.stringify({
          locale: schemaForm.locale,
          enabled: schemaForm.enabled,
          schema_org_name: schemaForm.schema_org_name.trim() || null,
          schema_org_url: schemaForm.schema_org_url.trim() || null,
          schema_org_logo_url: schemaForm.schema_org_logo_url.trim() || null,
          schema_org_same_as: parseList(schemaForm.schema_org_same_as_text),
          schema_local_business_name: schemaForm.schema_local_business_name.trim() || null,
          schema_local_business_url: schemaForm.schema_local_business_url.trim() || null,
          schema_local_business_phone: schemaForm.schema_local_business_phone.trim() || null,
          schema_local_business_price_range: schemaForm.schema_local_business_price_range.trim() || null,
          schema_local_business_address: schemaForm.schema_local_business_address.trim() || null,
          schema_website_name: schemaForm.schema_website_name.trim() || null,
          schema_website_url: schemaForm.schema_website_url.trim() || null,
          schema_website_search_path: schemaForm.schema_website_search_path.trim() || null,
          schema_article_author: schemaForm.schema_article_author.trim() || null,
          schema_article_author_url: schemaForm.schema_article_author_url.trim() || null,
        }),
      });
      await loadSchema(token, schemaForm.locale);
    } catch (error) {
      setPageError(readApiError(error));
    } finally {
      setBusy(false);
    }
  }

  async function bootstrapSchemaFromProduction() {
    if (!isAuth) return;
    setBusy(true);
    setPageError(null);
    try {
      await api("/admin/seo/schema-source/bootstrap-production", token, {
        method: "POST",
        body: JSON.stringify({ locale: schemaForm.locale, overwrite_existing: true }),
      });
      await loadSchema(token, schemaForm.locale);
    } catch (error) {
      setPageError(readApiError(error));
    } finally {
      setBusy(false);
    }
  }

  async function runBrokenLinks() {
    if (!isAuth) return;
    setBusy(true);
    setPageError(null);
    try {
      const body = await api<{ report: BrokenLinkReport }>("/admin/seo/broken-links/run", token, {
        method: "POST",
      });
      setReport(body.report || null);
    } catch (error) {
      setPageError(readApiError(error));
    } finally {
      setBusy(false);
    }
  }

  const schemaHasData = [
    schemaForm.schema_org_name,
    schemaForm.schema_org_url,
    schemaForm.schema_org_logo_url,
    schemaForm.schema_org_same_as_text,
    schemaForm.schema_local_business_name,
    schemaForm.schema_local_business_url,
    schemaForm.schema_local_business_phone,
    schemaForm.schema_local_business_price_range,
    schemaForm.schema_local_business_address,
    schemaForm.schema_website_name,
    schemaForm.schema_website_url,
    schemaForm.schema_website_search_path,
    schemaForm.schema_article_author,
    schemaForm.schema_article_author_url,
  ].some((v) => v.trim().length > 0);

  const reportTime = report?.checked_at ? new Date(report.checked_at).toLocaleString() : "-";

  return (
    <main id="main-content" className="container content-stack">
      <section className="card">
        <h1>{t.title}</h1>
        <p className="locale-safe">{t.subtitle}</p>
      </section>

      <section className="card" aria-label={t.loginTitle}>
        {!isAuth ? (
          <form className="crm-login-form" onSubmit={(event) => void login(event)}>
            <h2>{t.loginTitle}</h2>
            <label className="field" htmlFor="seo-login-email">
              <span>{t.email}</span>
              <input id="seo-login-email" type="email" autoComplete="username" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
            </label>
            <label className="field" htmlFor="seo-login-password">
              <span>{t.password}</span>
              <input id="seo-login-password" type="password" autoComplete="current-password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} />
            </label>
            {authError ? <div className="state-error">{authError}</div> : null}
            <div className="card-actions">
              <button className="btn" type="submit" disabled={busy}>{t.signIn}</button>
            </div>
          </form>
        ) : (
          <div className="crm-session-panel" role="status" aria-live="polite">
            <p className="locale-safe">{email || t.authRequired}</p>
            <div className="card-actions">
              <button className="btn btn-secondary" type="button" onClick={logout}>{t.signOut}</button>
              <button className="btn btn-secondary" type="button" onClick={() => void refreshAll()} disabled={loading}>{loading ? t.loading : t.refresh}</button>
            </div>
          </div>
        )}
        {!isAuth ? <div className="state-empty">{t.authRequired}</div> : null}
      </section>

      {pageError ? <div className="state-error">{pageError}</div> : null}
      {loading ? <div className="state-loading">{t.loading}</div> : null}

      <section className="seo-layout">
        <article className="card seo-pane">
          <h2>{t.sectionOverrides}</h2>
          <form className="seo-form-grid" onSubmit={(event) => void saveOverride(event)}>
            <label className="field" htmlFor="seo-override-path"><span>Path</span><input id="seo-override-path" value={overrideForm.path} onChange={(event) => setOverrideForm((prev) => ({ ...prev, path: event.target.value }))} required /></label>
            <label className="field" htmlFor="seo-override-locale"><span>Locale</span><select id="seo-override-locale" value={overrideForm.locale} onChange={(event) => setOverrideForm((prev) => ({ ...prev, locale: event.target.value === "th" ? "th" : "en" }))}><option value="en">en</option><option value="th">th</option></select></label>
            <label className="field" htmlFor="seo-override-title"><span>Title</span><input id="seo-override-title" value={overrideForm.title} onChange={(event) => setOverrideForm((prev) => ({ ...prev, title: event.target.value }))} /></label>
            <label className="field seo-field-wide" htmlFor="seo-override-description"><span>Description</span><textarea id="seo-override-description" rows={2} value={overrideForm.description} onChange={(event) => setOverrideForm((prev) => ({ ...prev, description: event.target.value }))} /></label>
            <label className="field seo-field-wide" htmlFor="seo-override-canonical"><span>Canonical</span><input id="seo-override-canonical" value={overrideForm.canonical} onChange={(event) => setOverrideForm((prev) => ({ ...prev, canonical: event.target.value }))} /></label>
            <label className="seo-inline-check" htmlFor="seo-override-robots-index"><input id="seo-override-robots-index" type="checkbox" checked={overrideForm.robots_index} onChange={(event) => setOverrideForm((prev) => ({ ...prev, robots_index: event.target.checked }))} /><span>index</span></label>
            <label className="seo-inline-check" htmlFor="seo-override-robots-follow"><input id="seo-override-robots-follow" type="checkbox" checked={overrideForm.robots_follow} onChange={(event) => setOverrideForm((prev) => ({ ...prev, robots_follow: event.target.checked }))} /><span>follow</span></label>
            <label className="seo-inline-check" htmlFor="seo-override-enabled"><input id="seo-override-enabled" type="checkbox" checked={overrideForm.enabled} onChange={(event) => setOverrideForm((prev) => ({ ...prev, enabled: event.target.checked }))} /><span>enabled</span></label>
            <div className="card-actions seo-actions-wide"><button className="btn" type="submit" disabled={!isAuth || busy}>{t.save}</button></div>
          </form>
          {overrides.length === 0 ? <div className="state-empty">{t.emptyOverrides}</div> : null}
          {overrides.length > 0 ? (
            <ul className="seo-item-list" aria-label={t.sectionOverrides}>
              {overrides.map((item) => (
                <li key={item.id} className="seo-item-row">
                  <div className="seo-item-head"><strong>{item.path}</strong><span className="seo-item-chip">{item.locale}</span></div>
                  <p className="seo-item-meta">{item.title || "-"}</p>
                  <div className="card-actions">
                    <button className="btn btn-secondary" type="button" onClick={() => { setEditingOverrideId(item.id); setOverrideForm({ path: item.path, locale: item.locale === "th" ? "th" : "en", title: item.title || "", description: item.description || "", canonical: item.canonical || "", robots_index: item.robots_index, robots_follow: item.robots_follow, enabled: item.enabled }); }}>{editingOverrideId === item.id ? "Editing" : "Edit"}</button>
                    <button className="btn btn-secondary" type="button" onClick={async () => { await api(`/admin/seo/overrides/${item.id}`, token, { method: "DELETE" }); if (editingOverrideId === item.id) { setEditingOverrideId(null); setOverrideForm(emptyOverride(locale)); } await loadOverrides(token); }}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </article>

        <article className="card seo-pane">
          <h2>{t.sectionRedirects}</h2>
          <form className="seo-form-grid" onSubmit={(event) => void saveRedirect(event)}>
            <label className="field" htmlFor="seo-redirect-old-path"><span>Old path</span><input id="seo-redirect-old-path" value={redirectForm.old_path} onChange={(event) => setRedirectForm((prev) => ({ ...prev, old_path: event.target.value }))} required /></label>
            <label className="field" htmlFor="seo-redirect-new-path"><span>New path</span><input id="seo-redirect-new-path" value={redirectForm.new_path} onChange={(event) => setRedirectForm((prev) => ({ ...prev, new_path: event.target.value }))} required /></label>
            <label className="field" htmlFor="seo-redirect-status-code"><span>Status</span><select id="seo-redirect-status-code" value={String(redirectForm.status_code)} onChange={(event) => setRedirectForm((prev) => ({ ...prev, status_code: event.target.value === "302" ? 302 : 301 }))}><option value="301">301</option><option value="302">302</option></select></label>
            <label className="seo-inline-check" htmlFor="seo-redirect-preserve-query"><input id="seo-redirect-preserve-query" type="checkbox" checked={redirectForm.preserve_query} onChange={(event) => setRedirectForm((prev) => ({ ...prev, preserve_query: event.target.checked }))} /><span>preserve query</span></label>
            <label className="seo-inline-check" htmlFor="seo-redirect-enabled"><input id="seo-redirect-enabled" type="checkbox" checked={redirectForm.enabled} onChange={(event) => setRedirectForm((prev) => ({ ...prev, enabled: event.target.checked }))} /><span>enabled</span></label>
            <div className="card-actions seo-actions-wide">
              <button className="btn" type="submit" disabled={!isAuth || busy}>{t.save}</button>
              <button className="btn btn-secondary" type="button" onClick={() => void preloadRedirectsFromProduction()} disabled={!isAuth || busy}>Preload production redirects</button>
            </div>
          </form>
          {redirects.length === 0 ? <div className="state-empty">{t.emptyRedirects}</div> : null}
          {redirects.length > 0 ? (
            <ul className="seo-item-list" aria-label={t.sectionRedirects}>
              {redirects.map((item) => (
                <li key={item.id} className="seo-item-row">
                  <div className="seo-item-head"><strong>{item.old_path}</strong><span className="seo-item-chip">{item.status_code}</span></div>
                  <p className="seo-item-meta">{item.new_path}</p>
                  <div className="card-actions">
                    <button className="btn btn-secondary" type="button" onClick={() => { setEditingRedirectId(item.id); setRedirectForm({ old_path: item.old_path, new_path: item.new_path, status_code: item.status_code === 302 ? 302 : 301, preserve_query: item.preserve_query, enabled: item.enabled }); }}>{editingRedirectId === item.id ? "Editing" : "Edit"}</button>
                    <button className="btn btn-secondary" type="button" onClick={async () => { await api(`/admin/seo/redirects/${item.id}`, token, { method: "DELETE" }); if (editingRedirectId === item.id) { setEditingRedirectId(null); setRedirectForm(emptyRedirect()); } await loadRedirects(token); }}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </article>

        <article className="card seo-pane seo-full">
          <h2>{t.sectionSchema}</h2>
          <form className="seo-form-grid" onSubmit={(event) => void saveSchema(event)}>
            <label className="field" htmlFor="seo-schema-locale"><span>Locale</span><select id="seo-schema-locale" value={schemaForm.locale} onChange={(event) => setSchemaForm((prev) => ({ ...prev, locale: event.target.value === "th" ? "th" : "en" }))}><option value="en">en</option><option value="th">th</option></select></label>
            <label className="seo-inline-check" htmlFor="seo-schema-enabled"><input id="seo-schema-enabled" type="checkbox" checked={schemaForm.enabled} onChange={(event) => setSchemaForm((prev) => ({ ...prev, enabled: event.target.checked }))} /><span>enabled</span></label>
            <label className="field" htmlFor="seo-schema-org-name"><span>Organization name</span><input id="seo-schema-org-name" value={schemaForm.schema_org_name} onChange={(event) => setSchemaForm((prev) => ({ ...prev, schema_org_name: event.target.value }))} /></label>
            <label className="field" htmlFor="seo-schema-org-url"><span>Organization URL</span><input id="seo-schema-org-url" value={schemaForm.schema_org_url} onChange={(event) => setSchemaForm((prev) => ({ ...prev, schema_org_url: event.target.value }))} /></label>
            <label className="field" htmlFor="seo-schema-org-logo"><span>Organization logo path</span><input id="seo-schema-org-logo" value={schemaForm.schema_org_logo_url} onChange={(event) => setSchemaForm((prev) => ({ ...prev, schema_org_logo_url: event.target.value }))} /></label>
            <label className="field seo-field-wide" htmlFor="seo-schema-org-same-as"><span>Organization sameAs URLs</span><textarea id="seo-schema-org-same-as" rows={2} value={schemaForm.schema_org_same_as_text} onChange={(event) => setSchemaForm((prev) => ({ ...prev, schema_org_same_as_text: event.target.value }))} /></label>
            <label className="field" htmlFor="seo-schema-local-name"><span>LocalBusiness name</span><input id="seo-schema-local-name" value={schemaForm.schema_local_business_name} onChange={(event) => setSchemaForm((prev) => ({ ...prev, schema_local_business_name: event.target.value }))} /></label>
            <label className="field" htmlFor="seo-schema-local-url"><span>LocalBusiness URL</span><input id="seo-schema-local-url" value={schemaForm.schema_local_business_url} onChange={(event) => setSchemaForm((prev) => ({ ...prev, schema_local_business_url: event.target.value }))} /></label>
            <label className="field" htmlFor="seo-schema-local-phone"><span>LocalBusiness phone</span><input id="seo-schema-local-phone" value={schemaForm.schema_local_business_phone} onChange={(event) => setSchemaForm((prev) => ({ ...prev, schema_local_business_phone: event.target.value }))} /></label>
            <label className="field" htmlFor="seo-schema-local-price"><span>LocalBusiness price range</span><input id="seo-schema-local-price" value={schemaForm.schema_local_business_price_range} onChange={(event) => setSchemaForm((prev) => ({ ...prev, schema_local_business_price_range: event.target.value }))} /></label>
            <label className="field seo-field-wide" htmlFor="seo-schema-local-address"><span>LocalBusiness address</span><input id="seo-schema-local-address" value={schemaForm.schema_local_business_address} onChange={(event) => setSchemaForm((prev) => ({ ...prev, schema_local_business_address: event.target.value }))} /></label>
            <label className="field" htmlFor="seo-schema-website-name"><span>Website name</span><input id="seo-schema-website-name" value={schemaForm.schema_website_name} onChange={(event) => setSchemaForm((prev) => ({ ...prev, schema_website_name: event.target.value }))} /></label>
            <label className="field" htmlFor="seo-schema-website-url"><span>Website URL</span><input id="seo-schema-website-url" value={schemaForm.schema_website_url} onChange={(event) => setSchemaForm((prev) => ({ ...prev, schema_website_url: event.target.value }))} /></label>
            <label className="field" htmlFor="seo-schema-website-search-path"><span>Website search path</span><input id="seo-schema-website-search-path" value={schemaForm.schema_website_search_path} onChange={(event) => setSchemaForm((prev) => ({ ...prev, schema_website_search_path: event.target.value }))} /></label>
            <label className="field" htmlFor="seo-schema-article-author"><span>Article author override</span><input id="seo-schema-article-author" value={schemaForm.schema_article_author} onChange={(event) => setSchemaForm((prev) => ({ ...prev, schema_article_author: event.target.value }))} /></label>
            <label className="field" htmlFor="seo-schema-article-author-url"><span>Article author URL</span><input id="seo-schema-article-author-url" value={schemaForm.schema_article_author_url} onChange={(event) => setSchemaForm((prev) => ({ ...prev, schema_article_author_url: event.target.value }))} /></label>
            <div className="card-actions seo-actions-wide">
              <button className="btn" type="submit" disabled={!isAuth || busy}>{t.save}</button>
              <button className="btn btn-secondary" type="button" onClick={() => void bootstrapSchemaFromProduction()} disabled={!isAuth || busy}>Load approved schema defaults</button>
            </div>
          </form>
          {!schemaHasData ? <div className="state-empty">{t.emptySchema}</div> : null}
        </article>

        <article className="card seo-pane seo-full">
          <h2>{t.sectionBroken}</h2>
          <div className="card-actions">
            <button className="btn" type="button" onClick={() => void runBrokenLinks()} disabled={!isAuth || busy}>Run checker</button>
            <button className="btn btn-secondary" type="button" onClick={() => void loadReport(token)} disabled={!isAuth || busy}>{t.refresh}</button>
          </div>
          {policy ? (
            <div className="seo-report-grid" role="status" aria-live="polite">
              <p><strong>policy:</strong> {policy.version}</p>
              <p><strong>max_depth:</strong> {policy.max_depth}</p>
              <p><strong>max_pages:</strong> {policy.max_pages}</p>
              <p><strong>max_link_checks:</strong> {policy.max_link_checks}</p>
            </div>
          ) : null}
          {!report ? <div className="state-empty">{t.emptyReport}</div> : null}
          {report ? (
            <>
              <div className="seo-report-grid" role="status" aria-live="polite">
                <p><strong>checked_at:</strong> {reportTime}</p>
                <p><strong>checked_pages:</strong> {report.checked_pages.length}</p>
                <p><strong>total_links:</strong> {report.total_links}</p>
                <p><strong>checker_version:</strong> {report.checker_version}</p>
              </div>
              {report.broken_links.length === 0 ? (
                <div className="state-empty">No broken links found.</div>
              ) : (
                <div className="seo-table-wrap">
                  <table className="seo-table">
                    <thead><tr><th>source_page</th><th>href</th><th>status</th><th>error</th></tr></thead>
                    <tbody>
                      {report.broken_links.map((row, index) => (
                        <tr key={`${row.source_page}-${row.href}-${index}`}>
                          <td>{row.source_page || "-"}</td>
                          <td>{row.href || "-"}</td>
                          <td>{row.status ?? "-"}</td>
                          <td>{row.error || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </article>
      </section>
    </main>
  );
}
