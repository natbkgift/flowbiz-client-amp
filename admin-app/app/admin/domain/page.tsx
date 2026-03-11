"use client";

import { type FormEvent, useEffect, useState } from "react";
import { ADMIN_AUTH_LOGIN_PATH } from "@/app/_lib/admin-auth";
import { detectAdminLocale, type AdminLocale } from "@/app/_lib/admin-i18n";
import { formatWorkspaceErrorMessage } from "@/app/_lib/admin-workspace-error";
import AdminWorkspaceErrorState from "@/components/admin/AdminWorkspaceErrorState";
import {
  ActionCard,
  AdminButton,
  AdminPageHeader,
  AdminStatCard,
  AdminTable,
  LogCard,
} from "@/components/admin/AdminPrimitives";

type Locale = AdminLocale;
type EntityType = "areas" | "developers" | "projects";

type AuthSession = { token: string; email: string };
type LoginResponse = { access_token: string; token_type: string };
type EntityRow = { id: string; slug: string; name: string; status: string; updated_at: string | null };
type DashboardSummaryResponse = {
  raw_metrics: {
    pending_translations?: { total_pending_translations?: number };
    unpublished_drafts?: { total_unpublished_drafts?: number };
  };
};

const AUTH_SESSION_STORAGE_KEY = "flowbiz_admin_auth_session_v1";
const LEGACY_TOKEN_STORAGE_KEY = "flowbiz_admin_token";

const copy = {
  en: {
    title: "Admin Domain Workspace",
    subtitle: "CRUD for areas/developers/projects with publish controls.",
    loginTitle: "Admin sign in",
    email: "Admin email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in",
    signOut: "Sign out",
    refresh: "Refresh",
    authRequired: "Sign in to load domain workspace.",
    loadError: "Unable to load domain data.",
    errorTitle: "Domain workspace error",
    errorHint: "Please retry. If it keeps failing, check API status and auth session.",
    retry: "Retry",
    pending: "Pending translations",
    drafts: "Unpublished drafts",
    entity: "Entity",
    entityId: "Entity ID",
    createJson: "Create payload JSON",
    patchJson: "Patch payload JSON",
    statsJson: "Area stats JSON",
    create: "Create",
    get: "Get",
    patch: "Patch",
    stats: "Upsert stats",
    publish: "Publish",
    unpublish: "Unpublish",
    del: "Delete",
    result: "Result",
    sessionDescription: "Active CRUD workspace session.",
    loginDescription: "Use admin credentials to manage areas, developers, and projects.",
    loadingWorkspace: "Loading workspace",
    editorDescription: "Create, patch, publish, unpublish, or delete selected entities without changing payload shapes.",
    listDescription: "Latest entity rows for the currently selected workspace type.",
    adminFallback: "admin",
    createJson: "Create payload JSON",
    patchJson: "Patch payload JSON",
    statsJson: "Area stats JSON",
    editSelect: "select",
    deleteConfirm: "Delete this entity now? This action cannot be undone.",
  },
  th: {
    title: "Admin Domain Workspace",
    subtitle: "รองรับ CRUD สำหรับ areas, developers และ projects พร้อมคำสั่งเผยแพร่ในพื้นที่เดียว",
    loginTitle: "เข้าสู่ระบบแอดมิน",
    email: "อีเมลแอดมิน",
    password: "รหัสผ่าน",
    signIn: "เข้าสู่ระบบ",
    signingIn: "กำลังเข้าสู่ระบบ",
    signOut: "ออกจากระบบ",
    refresh: "รีเฟรช",
    authRequired: "กรุณาเข้าสู่ระบบก่อนใช้งาน domain workspace",
    loadError: "ไม่สามารถโหลดข้อมูล domain ได้",
    errorTitle: "ข้อผิดพลาดของ domain workspace",
    errorHint: "กรุณาลองใหม่ หากยังไม่สำเร็จให้ตรวจสอบ API และเซสชันการเข้าสู่ระบบ",
    retry: "ลองใหม่",
    pending: "รายการแปลที่ค้าง",
    drafts: "ฉบับร่างที่ยังไม่เผยแพร่",
    entity: "ประเภทข้อมูล",
    entityId: "รหัสรายการ",
    createJson: "JSON สำหรับสร้างรายการ",
    patchJson: "JSON สำหรับอัปเดต",
    statsJson: "JSON สถิติของ area",
    create: "สร้าง",
    get: "ดูข้อมูล",
    patch: "อัปเดต",
    stats: "บันทึกสถิติ",
    publish: "เผยแพร่",
    unpublish: "ยกเลิกเผยแพร่",
    del: "ลบ",
    result: "ผลลัพธ์",
    sessionDescription: "เซสชัน CRUD workspace ที่กำลังใช้งานอยู่",
    loginDescription: "ใช้บัญชีแอดมินเพื่อจัดการ areas, developers และ projects",
    loadingWorkspace: "กำลังโหลด workspace",
    editorDescription: "สร้าง อัปเดต เผยแพร่ ยกเลิกเผยแพร่ หรือลบรายการที่เลือกโดยไม่เปลี่ยนรูปแบบ payload",
    listDescription: "รายการล่าสุดของ workspace ประเภทที่กำลังเลือก",
    adminFallback: "แอดมิน",
    editSelect: "เลือก",
    deleteConfirm: "ต้องการลบรายการนี้ตอนนี้หรือไม่ การกระทำนี้ย้อนกลับไม่ได้",
  },
};

function detectLocale(): Locale {
  return detectAdminLocale();
}

function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const fromSession = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (fromSession) {
    try {
      const parsed = JSON.parse(fromSession) as { token?: string; email?: string };
      if (parsed.token?.trim()) return { token: parsed.token.trim(), email: (parsed.email || "").trim() };
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

function persistAuthSession(token: string, email: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({ token: token.trim(), email: email.trim() }));
  window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
}

function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
}

async function fetchJson<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(path, { ...init, headers, cache: "no-store" });
  if (!response.ok) throw new Error(`request_failed:${response.status}:${await response.text()}`);
  return (await response.json()) as T;
}

function prettyDate(value: string | null, locale: Locale): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const CREATE_TEMPLATES: Record<EntityType, string> = {
  areas:
    '{"name":"Sample Area","slug":"sample-area-crud","city":"Pattaya","status":"draft","summary":{"en":"Summary","th":"สรุป"},"content":{"en":{"why_live_invest":"ok","transport":"ok","lifestyle":"ok","beach_proximity":"ok","metrics_update_cadence":"monthly"},"th":{"why_live_invest":"ok","transport":"ok","lifestyle":"ok","beach_proximity":"ok","metrics_update_cadence":"monthly"}},"source_note":"owner approved"}',
  developers:
    '{"name":"Sample Developer","slug":"sample-developer-crud","status":"inactive","profile":{"en":"Profile","th":"โปรไฟล์"},"summary":{"en":"Summary","th":"สรุป"},"source_note":"owner approved","trust_proof":{"approval_status":"approved"}}',
  projects:
    '{"name":"Sample Project","slug":"sample-project-crud","status":"draft","property_type":"condo","summary":{"en":"Summary","th":"สรุป"},"description":{"en":"Description","th":"รายละเอียด"},"source_notes":{"en":"source","th":"ที่มา"}}',
};

export default function AdminDomainPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pendingTranslations, setPendingTranslations] = useState(0);
  const [unpublishedDrafts, setUnpublishedDrafts] = useState(0);
  const [areas, setAreas] = useState<EntityRow[]>([]);
  const [developers, setDevelopers] = useState<EntityRow[]>([]);
  const [projects, setProjects] = useState<EntityRow[]>([]);

  const [entity, setEntity] = useState<EntityType>("areas");
  const [entityId, setEntityId] = useState("");
  const [createJson, setCreateJson] = useState(CREATE_TEMPLATES.areas);
  const [patchJson, setPatchJson] = useState('{"name":"Updated name"}');
  const [statsJson, setStatsJson] = useState(
    '{"avg_price_sqm":120000,"avg_rent_monthly":25000,"avg_roi_percent":6.5,"total_projects":10,"total_units":1200,"as_of_date":"2026-03-01"}'
  );
  const [opBusy, setOpBusy] = useState(false);
  const [opError, setOpError] = useState<string | null>(null);
  const [opResult, setOpResult] = useState("");

  useEffect(() => {
    setLocale(detectLocale());
    const session = readAuthSession();
    if (!session) return;
    setToken(session.token);
    setEmail(session.email);
  }, []);

  const t = copy[locale];
  const isAuthenticated = token.trim().length > 0;

  useEffect(() => {
    if (!token.trim()) return;
    void loadWorkspace(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    setCreateJson(CREATE_TEMPLATES[entity]);
  }, [entity]);

  async function loadWorkspace(tokenOverride?: string) {
    const activeToken = (tokenOverride ?? token).trim();
    if (!activeToken) {
      setPageError(t.authRequired);
      return;
    }
    setLoading(true);
    setPageError(null);
    try {
      const [areasBody, developersBody, projectsBody, summaryBody] = await Promise.all([
        fetchJson<{ data: EntityRow[] }>("/admin/areas?limit=40", activeToken),
        fetchJson<{ data: EntityRow[] }>("/admin/developers?limit=40", activeToken),
        fetchJson<{ data: EntityRow[] }>("/admin/projects?limit=40", activeToken),
        fetchJson<DashboardSummaryResponse>("/admin/dashboard/health-summary", activeToken),
      ]);
      setAreas(Array.isArray(areasBody.data) ? areasBody.data : []);
      setDevelopers(Array.isArray(developersBody.data) ? developersBody.data : []);
      setProjects(Array.isArray(projectsBody.data) ? projectsBody.data : []);
      setPendingTranslations(Number(summaryBody.raw_metrics?.pending_translations?.total_pending_translations || 0));
      setUnpublishedDrafts(Number(summaryBody.raw_metrics?.unpublished_drafts?.total_unpublished_drafts || 0));
      persistAuthSession(activeToken, email || loginEmail);
    } catch (error) {
      setPageError(formatWorkspaceErrorMessage(error, t.errorHint));
    } finally {
      setLoading(false);
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setAuthError("login_required");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(ADMIN_AUTH_LOGIN_PATH, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      if (!response.ok) {
        setAuthError("login_failed");
        return;
      }
      const body = (await response.json()) as LoginResponse;
      const accessToken = String(body.access_token || "").trim();
      if (!accessToken) {
        setAuthError("login_failed");
        return;
      }
      setToken(accessToken);
      setEmail(loginEmail.trim());
      setLoginPassword("");
      persistAuthSession(accessToken, loginEmail.trim());
      await loadWorkspace(accessToken);
    } catch {
      setAuthError("login_failed");
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    clearAuthSession();
    setToken("");
    setEmail("");
    setLoginPassword("");
    setAuthError(null);
    setPageError(null);
    setOpResult("");
    setOpError(null);
  }

  function basePath(): string {
    return entity === "areas" ? "/admin/areas" : entity === "developers" ? "/admin/developers" : "/admin/projects";
  }

  async function runAction(action: () => Promise<unknown>) {
    setOpBusy(true);
    setOpError(null);
    try {
      const result = await action();
      setOpResult(JSON.stringify(result, null, 2));
      await loadWorkspace();
    } catch (error) {
      setOpError(error instanceof Error ? error.message : "operation_failed");
    } finally {
      setOpBusy(false);
    }
  }

  return (
    <main id="main-content" className="container content-stack admin-overflow-guard">
      <AdminPageHeader title={t.title} description={t.subtitle} icon="domain" eyebrow="Domain workspace" />

      <ActionCard
        className="dashboard-controls"
        title={isAuthenticated ? (email || t.adminFallback) : t.loginTitle}
        description={isAuthenticated ? t.sessionDescription : t.loginDescription}
        icon={isAuthenticated ? "profile" : "domain"}
        titleTag="h2"
      >
        {!isAuthenticated ? (
          <form className="crm-login-form" method="post" onSubmit={(event) => void login(event)}>
            <label className="field" htmlFor="domain-login-email">
              <span>{t.email}</span>
              <input id="domain-login-email" name="email" type="email" autoComplete="username" required value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
            </label>
            <label className="field" htmlFor="domain-login-password">
              <span>{t.password}</span>
              <input id="domain-login-password" name="password" type="password" autoComplete="current-password" required value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} />
            </label>
            {authError ? <div className="state-error">{authError}</div> : null}
            <AdminButton variant="primary" icon="workspace" type="submit" disabled={authLoading}>
              {authLoading ? t.signingIn : t.signIn}
            </AdminButton>
          </form>
        ) : (
          <div className="crm-session-panel" role="status" aria-live="polite">
            <p className="locale-safe">{email || "admin"}</p>
            <div className="card-actions">
              <AdminButton variant="secondary" icon="refresh" type="button" onClick={() => void loadWorkspace()} disabled={loading || opBusy}>
                {t.refresh}
              </AdminButton>
              <AdminButton variant="secondary" icon="x" type="button" onClick={logout} disabled={loading || opBusy}>
                {t.signOut}
              </AdminButton>
            </div>
          </div>
        )}
        {!isAuthenticated ? <div className="state-empty">{t.authRequired}</div> : null}
      </ActionCard>

      {pageError ? (
        <AdminWorkspaceErrorState
          title={t.errorTitle}
          detail={pageError}
          actionLabel={t.retry}
          onAction={() => void loadWorkspace()}
          actionDisabled={loading}
        />
      ) : null}
      {loading ? <div className="state-loading">{t.loadingWorkspace}</div> : null}

      {isAuthenticated ? (
        <>
          <section className="dashboard-grid">
            <AdminStatCard label={t.pending} value={pendingTranslations} icon="language" tone="info" />
            <AdminStatCard label={t.drafts} value={unpublishedDrafts} icon="blog" tone="warn" />
          </section>

          <ActionCard
            className="domain-editor-card"
            title={t.entity}
            description={t.editorDescription}
            icon="domain"
            titleTag="h2"
          >
            <label className="field" htmlFor="domain-entity-type">
              <span>{t.entity}</span>
              <select id="domain-entity-type" value={entity} onChange={(event) => setEntity(event.target.value as EntityType)}>
                <option value="areas">areas</option>
                <option value="developers">developers</option>
                <option value="projects">projects</option>
              </select>
            </label>
            <label className="field" htmlFor="domain-entity-id"><span>{t.entityId}</span><input id="domain-entity-id" value={entityId} onChange={(event) => setEntityId(event.target.value)} /></label>
            <label className="field" htmlFor="domain-create-json"><span>{t.createJson}</span><textarea id="domain-create-json" rows={6} value={createJson} onChange={(event) => setCreateJson(event.target.value)} /></label>
            <label className="field" htmlFor="domain-patch-json"><span>{t.patchJson}</span><textarea id="domain-patch-json" rows={6} value={patchJson} onChange={(event) => setPatchJson(event.target.value)} /></label>
            {entity === "areas" ? (
              <label className="field" htmlFor="domain-stats-json"><span>{t.statsJson}</span><textarea id="domain-stats-json" rows={6} value={statsJson} onChange={(event) => setStatsJson(event.target.value)} /></label>
            ) : null}
            <div className="card-actions">
              <AdminButton variant="primary" icon="plus" type="button" disabled={opBusy} onClick={() => void runAction(() => fetchJson(basePath(), token, { method: "POST", body: createJson }))}>{t.create}</AdminButton>
              <AdminButton variant="secondary" icon="search" type="button" disabled={opBusy || !entityId.trim()} onClick={() => void runAction(() => fetchJson(`${basePath()}/${entityId.trim()}`, token))}>{t.get}</AdminButton>
              <AdminButton variant="secondary" icon="refresh" type="button" disabled={opBusy || !entityId.trim()} onClick={() => void runAction(() => fetchJson(`${basePath()}/${entityId.trim()}`, token, { method: "PATCH", body: patchJson }))}>{t.patch}</AdminButton>
              {entity === "areas" ? (
                <AdminButton variant="secondary" icon="table" type="button" disabled={opBusy || !entityId.trim()} onClick={() => void runAction(() => fetchJson(`${basePath()}/${entityId.trim()}/statistics`, token, { method: "PUT", body: statsJson }))}>{t.stats}</AdminButton>
              ) : null}
              <AdminButton variant="secondary" icon="success" type="button" disabled={opBusy || !entityId.trim()} onClick={() => void runAction(() => fetchJson(`${basePath()}/${entityId.trim()}/publish`, token, { method: "POST" }))}>{t.publish}</AdminButton>
              {entity !== "projects" ? (
                <AdminButton variant="secondary" icon="warning" type="button" disabled={opBusy || !entityId.trim()} onClick={() => void runAction(() => fetchJson(`${basePath()}/${entityId.trim()}/unpublish`, token, { method: "POST" }))}>{t.unpublish}</AdminButton>
              ) : null}
              <AdminButton variant="danger" icon="x" type="button" disabled={opBusy || !entityId.trim()} onClick={() => { if (typeof window !== "undefined" && !window.confirm(t.deleteConfirm)) return; void runAction(() => fetchJson(`${basePath()}/${entityId.trim()}`, token, { method: "DELETE" })); }}>{t.del}</AdminButton>
            </div>
            {opError ? <div className="state-error">{opError}</div> : null}
            <label className="field" htmlFor="domain-op-result"><span>{t.result}</span><textarea id="domain-op-result" rows={10} readOnly value={opResult} /></label>
          </ActionCard>

            <LogCard
            title={entity}
            description={t.listDescription}
            icon="table"
            titleTag="h2"
          >
            <AdminTable caption={entity}>
              <table className="dashboard-table">
                <thead><tr><th>Slug</th><th>Name</th><th>Status</th><th>Updated</th><th>Action</th></tr></thead>
                <tbody>
                  {(entity === "areas" ? areas : entity === "developers" ? developers : projects).map((row) => (
                    <tr key={row.id}>
                      <td>{row.slug || "-"}</td><td>{row.name || "-"}</td><td>{row.status || "-"}</td><td>{prettyDate(row.updated_at, locale)}</td>
                      <td><AdminButton variant="secondary" size="sm" icon="search" type="button" onClick={() => setEntityId(row.id)}>{t.editSelect}</AdminButton></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminTable>
          </LogCard>
        </>
      ) : null}
    </main>
  );
}
