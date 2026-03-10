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
  AdminSectionCard,
  AdminStatCard,
  AdminTable,
  LogCard,
} from "@/components/admin/AdminPrimitives";

type Locale = AdminLocale;

type AuthSession = {
  token: string;
  email: string;
};

type LoginResponse = {
  access_token: string;
  token_type: string;
};

type MediaItem = {
  id: string;
  storage_path: string;
  kind: string;
  status: string;
  rights_status: string | null;
  approval_status: string | null;
  source_url: string | null;
  updated_at: string | null;
};

type MediaListResponse = {
  items: MediaItem[];
};

type IntegritySummary = {
  scanned_at: string | null;
  error_count: number;
  warn_count: number;
  missing_file_count: number;
  checksum_mismatch_count: number;
  invalid_path_format_count: number;
  empty_file_count: number;
  external_leakage_count: number;
};

type IntegrityResponse = {
  summary?: IntegritySummary;
};

const AUTH_SESSION_STORAGE_KEY = "flowbiz_admin_auth_session_v1";
const LEGACY_TOKEN_STORAGE_KEY = "flowbiz_admin_token";

const copy = {
  en: {
    eyebrow: "Media operations",
    title: "Admin Media Workspace",
    subtitle:
      "Full media operations: upload, edit metadata, archive/restore, replace file, usage, and gallery sync.",
    loginTitle: "Admin sign in",
    loginSubtitle: "Use the same credentials as /api/v1/auth/login.",
    sessionTitle: "Admin",
    sessionDescription: "Active media workspace session.",
    email: "Admin email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in",
    signOut: "Sign out",
    refresh: "Refresh",
    loading: "Loading media workspace",
    authRequired: "Sign in to load media workspace.",
    loginMissing: "Email and password are required.",
    loginInvalid: "Invalid credentials.",
    loginError: "Unable to sign in right now.",
    loadError: "Unable to load media data right now.",
    errorTitle: "Media workspace error",
    errorHint: "Please retry. If it keeps failing, check API status and auth session.",
    retry: "Retry",
    integrity: "Integrity summary",
    mediaList: "Recent media assets",
    empty: "No media records found.",
    scannedAt: "Scanned at",
    broken: "Broken media",
    leakage: "External leakage",
    errors: "Errors",
    warnings: "Warnings",
    operations: "Media operations",
    upload: "Upload",
    uploadFile: "Upload file",
    uploadTitle: "Title (optional)",
    mediaId: "Media ID",
    patchJson: "Patch JSON",
    replaceFile: "Replace file",
    runPatch: "Run patch",
    runGet: "Get media",
    runArchive: "Archive",
    runRestore: "Restore",
    runUsage: "Usage",
    runReplace: "Replace file",
    galleryOps: "Gallery sync",
    galleryTargetType: "Target type",
    galleryTargetId: "Target ID",
    galleryPayload: "Gallery payload JSON",
    runGallery: "Apply gallery",
    result: "Operation result",
  },
  th: {
    eyebrow: "งานจัดการสื่อ",
    title: "จัดการสื่อ",
    subtitle: "ดูแลอัปโหลด แก้ metadata archive/restore replace usage และ gallery sync ผ่านพื้นที่งานเดียว",
    loginTitle: "เข้าสู่ระบบแอดมิน",
    loginSubtitle: "ใช้บัญชีเดียวกับ /api/v1/auth/login",
    sessionTitle: "เซสชันแอดมิน",
    sessionDescription: "เซสชันพื้นที่งานสื่อที่กำลังใช้งานอยู่",
    email: "อีเมลแอดมิน",
    password: "รหัสผ่าน",
    signIn: "เข้าสู่ระบบ",
    signingIn: "กำลังเข้าสู่ระบบ",
    signOut: "ออกจากระบบ",
    refresh: "รีเฟรช",
    loading: "กำลังโหลดพื้นที่งานสื่อ",
    authRequired: "กรุณาเข้าสู่ระบบก่อนใช้งานพื้นที่งานสื่อ",
    loginMissing: "ต้องกรอกอีเมลและรหัสผ่าน",
    loginInvalid: "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง",
    loginError: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้",
    loadError: "ไม่สามารถโหลดข้อมูลสื่อได้",
    errorTitle: "ข้อผิดพลาดของพื้นที่งานสื่อ",
    errorHint: "กรุณาลองใหม่ หากยังไม่สำเร็จให้ตรวจสอบ API และเซสชันการเข้าสู่ระบบ",
    retry: "ลองใหม่",
    integrity: "สรุปความสมบูรณ์ของสื่อ",
    mediaList: "รายการสื่อล่าสุด",
    empty: "ไม่พบรายการสื่อ",
    scannedAt: "เวลาสแกน",
    broken: "สื่อเสีย",
    leakage: "สื่อภายนอกที่รั่วเข้าระบบ",
    errors: "ข้อผิดพลาด",
    warnings: "คำเตือน",
    operations: "คำสั่งจัดการสื่อ",
    upload: "อัปโหลด",
    uploadFile: "ไฟล์อัปโหลด",
    uploadTitle: "ชื่อไฟล์/หัวข้อ (ถ้ามี)",
    mediaId: "รหัสสื่อ",
    patchJson: "Patch JSON",
    replaceFile: "ไฟล์ทดแทน",
    runPatch: "บันทึก patch",
    runGet: "ดูข้อมูลสื่อ",
    runArchive: "เก็บเข้าคลัง",
    runRestore: "กู้คืน",
    runUsage: "ดูการใช้งาน",
    runReplace: "แทนที่ไฟล์",
    galleryOps: "ซิงก์แกลเลอรี",
    galleryTargetType: "ประเภทเป้าหมาย",
    galleryTargetId: "รหัสเป้าหมาย",
    galleryPayload: "Gallery payload JSON",
    runGallery: "อัปเดตแกลเลอรี",
    result: "ผลลัพธ์",
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
      const parsed = JSON.parse(fromSession) as { token?: unknown; email?: unknown };
      const token = typeof parsed.token === "string" ? parsed.token.trim() : "";
      const email = typeof parsed.email === "string" ? parsed.email.trim() : "";
      if (token) return { token, email };
    } catch {
      window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }
  }

  const legacyToken = window.localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY) || "";
  if (!legacyToken.trim()) return null;

  const session = { token: legacyToken.trim(), email: "" };
  window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
  return session;
}

function persistAuthSession(token: string, email: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify({ token: token.trim(), email: email.trim() })
  );
  window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
}

function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
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

async function fetchJson<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !(init.body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(`/api${path}`, { ...init, headers, cache: "no-store" });
  if (!response.ok) throw new Error(`request_failed:${response.status}:${await response.text()}`);
  return (await response.json()) as T;
}

function toPrettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function AdminMediaPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [authToken, setAuthToken] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [integrity, setIntegrity] = useState<IntegritySummary | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);

  const [opBusy, setOpBusy] = useState(false);
  const [opError, setOpError] = useState<string | null>(null);
  const [opResult, setOpResult] = useState<string>("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [mediaId, setMediaId] = useState("");
  const [patchJson, setPatchJson] = useState('{"title":"Updated title"}');
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [galleryTargetType, setGalleryTargetType] = useState<"property" | "project">("property");
  const [galleryTargetId, setGalleryTargetId] = useState("");
  const [galleryPayload, setGalleryPayload] = useState('{"cover_image": null, "images": []}');

  useEffect(() => {
    setLocale(detectLocale());
    const session = readAuthSession();
    if (!session) return;
    setAuthToken(session.token);
    setAuthEmail(session.email);
  }, []);

  const t = copy[locale];
  const isAuthenticated = authToken.trim().length > 0;

  useEffect(() => {
    if (!authToken.trim()) return;
    void loadWorkspace(authToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  async function loadWorkspace(tokenOverride?: string) {
    const activeToken = (tokenOverride ?? authToken).trim();
    if (!activeToken) {
      setPageError(t.authRequired);
      return;
    }
    setLoading(true);
    setPageError(null);
    try {
      const [integrityBody, listBody] = await Promise.all([
        fetchJson<IntegrityResponse>("/admin/media/integrity-report?orphan_sample_limit=20", activeToken),
        fetchJson<MediaListResponse>("/admin/media?limit=40", activeToken),
      ]);
      setIntegrity(integrityBody.summary || null);
      setItems(Array.isArray(listBody.items) ? listBody.items : []);
      persistAuthSession(activeToken, authEmail || loginEmail);
    } catch (error) {
      setPageError(formatWorkspaceErrorMessage(error, t.errorHint));
    } finally {
      setLoading(false);
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = loginEmail.trim();
    const password = loginPassword;
    if (!email || !password) {
      setAuthError(t.loginMissing);
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(ADMIN_AUTH_LOGIN_PATH, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        setAuthError(response.status === 401 ? t.loginInvalid : t.loginError);
        return;
      }
      const body = (await response.json()) as LoginResponse;
      const accessToken = String(body.access_token || "").trim();
      if (!accessToken) {
        setAuthError(t.loginError);
        return;
      }
      setAuthToken(accessToken);
      setAuthEmail(email);
      setLoginPassword("");
      persistAuthSession(accessToken, email);
      await loadWorkspace(accessToken);
    } catch {
      setAuthError(t.loginError);
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    clearAuthSession();
    setAuthToken("");
    setAuthEmail("");
    setLoginPassword("");
    setAuthError(null);
    setPageError(null);
    setIntegrity(null);
    setItems([]);
    setOpError(null);
    setOpResult("");
  }

  async function runAction(action: () => Promise<unknown>) {
    setOpBusy(true);
    setOpError(null);
    try {
      const result = await action();
      setOpResult(toPrettyJson(result));
      await loadWorkspace();
    } catch (error) {
      setOpError(error instanceof Error ? error.message : "operation_failed");
    } finally {
      setOpBusy(false);
    }
  }

  const brokenCount =
    Number(integrity?.missing_file_count || 0) +
    Number(integrity?.checksum_mismatch_count || 0) +
    Number(integrity?.invalid_path_format_count || 0) +
    Number(integrity?.empty_file_count || 0);

  return (
    <main id="main-content" className="container content-stack">
      <AdminPageHeader title={t.title} description={t.subtitle} icon="media" eyebrow={t.eyebrow} />

      <ActionCard
        className="dashboard-controls"
        title={isAuthenticated ? (authEmail || t.sessionTitle) : t.loginTitle}
        description={isAuthenticated ? t.sessionDescription : t.loginSubtitle}
        icon={isAuthenticated ? "profile" : "media"}
        titleTag="h2"
      >
        {!isAuthenticated ? (
          <form className="crm-login-form" method="post" onSubmit={(event) => void login(event)}>
            <label className="field" htmlFor="media-login-email">
              <span>{t.email}</span>
              <input
                id="media-login-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
            </label>

            <label className="field" htmlFor="media-login-password">
              <span>{t.password}</span>
              <input
                id="media-login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />
            </label>

            {authError ? <div className="state-error">{authError}</div> : null}

            <div className="card-actions">
              <AdminButton variant="primary" icon="workspace" type="submit" disabled={authLoading}>
                {authLoading ? t.signingIn : t.signIn}
              </AdminButton>
            </div>
          </form>
        ) : (
          <div className="crm-session-panel" role="status" aria-live="polite">
            <div className="card-actions">
              <AdminButton variant="secondary" icon="refresh" type="button" onClick={() => void loadWorkspace()}>
                {loading ? t.loading : t.refresh}
              </AdminButton>
              <AdminButton variant="secondary" icon="x" type="button" onClick={logout}>
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
      {loading ? <div className="state-loading">{t.loading}</div> : null}

      {isAuthenticated ? (
        <>
          <section className="dashboard-grid" aria-label={t.integrity}>
            <AdminStatCard label={t.broken} value={brokenCount} icon="warning" tone="warn" />
            <AdminStatCard
              label={t.leakage}
              value={Number(integrity?.external_leakage_count || 0)}
              icon="globe"
              tone="neutral"
            />
            <AdminStatCard label={t.errors} value={Number(integrity?.error_count || 0)} icon="x" tone="error" />
            <AdminStatCard
              label={t.warnings}
              value={Number(integrity?.warn_count || 0)}
              detail={`${t.scannedAt}: ${prettyDate(integrity?.scanned_at || null, locale)}`}
              icon="info"
              tone="info"
            />
          </section>

          <AdminSectionCard
            title={t.operations}
            description="Run upload, CRUD, replace, and gallery sync workflows from a shared action surface."
            icon="media"
          >
            <div className="dashboard-grid">
              <ActionCard title={t.upload} description="Upload a new media asset with optional title metadata." icon="plus">
                <label className="field" htmlFor="media-upload-file">
                  <span>{t.uploadFile}</span>
                  <input
                    id="media-upload-file"
                    type="file"
                    onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                  />
                </label>
                <label className="field" htmlFor="media-upload-title">
                  <span>{t.uploadTitle}</span>
                  <input
                    id="media-upload-title"
                    value={uploadTitle}
                    onChange={(event) => setUploadTitle(event.target.value)}
                  />
                </label>
                <AdminButton
                  variant="primary"
                  icon="plus"
                  type="button"
                  disabled={opBusy || !uploadFile}
                  onClick={() =>
                    void runAction(async () => {
                      const formData = new FormData();
                      formData.set("file", uploadFile as File);
                      if (uploadTitle.trim()) formData.set("title", uploadTitle.trim());
                      return fetchJson("/admin/media/upload", authToken, {
                        method: "POST",
                        body: formData,
                      });
                    })
                  }
                >
                  {t.upload}
                </AdminButton>
              </ActionCard>

              <ActionCard title="CRUD" description="Read, patch, archive, restore, and inspect media usage." icon="refresh">
                <label className="field" htmlFor="media-id">
                  <span>{t.mediaId}</span>
                  <input
                    id="media-id"
                    value={mediaId}
                    onChange={(event) => setMediaId(event.target.value)}
                  />
                </label>
                <label className="field" htmlFor="media-patch-json">
                  <span>{t.patchJson}</span>
                  <textarea
                    id="media-patch-json"
                    rows={6}
                    value={patchJson}
                    onChange={(event) => setPatchJson(event.target.value)}
                  />
                </label>
                <div className="card-actions">
                  <AdminButton
                    variant="secondary"
                    icon="search"
                    type="button"
                    disabled={opBusy || !mediaId.trim()}
                    onClick={() =>
                      void runAction(() => fetchJson(`/admin/media/${mediaId.trim()}`, authToken))
                    }
                  >
                    {t.runGet}
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    icon="refresh"
                    type="button"
                    disabled={opBusy || !mediaId.trim()}
                    onClick={() =>
                      void runAction(() =>
                        fetchJson(`/admin/media/${mediaId.trim()}`, authToken, {
                          method: "PATCH",
                          body: patchJson,
                          headers: { "content-type": "application/json" },
                        })
                      )
                    }
                  >
                    {t.runPatch}
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    icon="warning"
                    type="button"
                    disabled={opBusy || !mediaId.trim()}
                    onClick={() =>
                      void runAction(() =>
                        fetchJson(`/admin/media/${mediaId.trim()}/archive?block_if_used=false`, authToken, {
                          method: "POST",
                        })
                      )
                    }
                  >
                    {t.runArchive}
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    icon="success"
                    type="button"
                    disabled={opBusy || !mediaId.trim()}
                    onClick={() =>
                      void runAction(() =>
                        fetchJson(`/admin/media/${mediaId.trim()}/restore`, authToken, {
                          method: "POST",
                        })
                      )
                    }
                  >
                    {t.runRestore}
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    icon="table"
                    type="button"
                    disabled={opBusy || !mediaId.trim()}
                    onClick={() =>
                      void runAction(() => fetchJson(`/admin/media/${mediaId.trim()}/usage`, authToken))
                    }
                  >
                    {t.runUsage}
                  </AdminButton>
                </div>
              </ActionCard>

              <ActionCard title={t.runReplace} description="Replace an existing media file while preserving the record." icon="refresh">
                <label className="field" htmlFor="media-replace-file">
                  <span>{t.replaceFile}</span>
                  <input
                    id="media-replace-file"
                    type="file"
                    onChange={(event) => setReplaceFile(event.target.files?.[0] || null)}
                  />
                </label>
                <AdminButton
                  variant="secondary"
                  icon="refresh"
                  type="button"
                  disabled={opBusy || !mediaId.trim() || !replaceFile}
                  onClick={() =>
                    void runAction(async () => {
                      const formData = new FormData();
                      formData.set("file", replaceFile as File);
                      return fetchJson(`/admin/media/${mediaId.trim()}/replace`, authToken, {
                        method: "POST",
                        body: formData,
                      });
                    })
                  }
                >
                  {t.runReplace}
                </AdminButton>
              </ActionCard>

              <ActionCard title={t.galleryOps} description="Apply gallery payloads to property or project targets." icon="media">
                <label className="field" htmlFor="gallery-target-type">
                  <span>{t.galleryTargetType}</span>
                  <select
                    id="gallery-target-type"
                    value={galleryTargetType}
                    onChange={(event) =>
                      setGalleryTargetType(event.target.value === "project" ? "project" : "property")
                    }
                  >
                    <option value="property">property</option>
                    <option value="project">project</option>
                  </select>
                </label>
                <label className="field" htmlFor="gallery-target-id">
                  <span>{t.galleryTargetId}</span>
                  <input
                    id="gallery-target-id"
                    value={galleryTargetId}
                    onChange={(event) => setGalleryTargetId(event.target.value)}
                  />
                </label>
                <label className="field" htmlFor="gallery-payload">
                  <span>{t.galleryPayload}</span>
                  <textarea
                    id="gallery-payload"
                    rows={6}
                    value={galleryPayload}
                    onChange={(event) => setGalleryPayload(event.target.value)}
                  />
                </label>
                <AdminButton
                  variant="secondary"
                  icon="media"
                  type="button"
                  disabled={opBusy || !galleryTargetId.trim()}
                  onClick={() =>
                    void runAction(() => {
                      const payload = JSON.parse(galleryPayload) as Record<string, unknown>;
                      const base =
                        galleryTargetType === "project"
                          ? `/admin/media/projects/${galleryTargetId.trim()}/gallery`
                          : `/admin/media/properties/${galleryTargetId.trim()}/gallery`;
                      return fetchJson(base, authToken, {
                        method: "PUT",
                        body: JSON.stringify(payload),
                      });
                    })
                  }
                >
                  {t.runGallery}
                </AdminButton>
              </ActionCard>
            </div>

            {opError ? <div className="state-error">{opError}</div> : null}
            <label className="field" htmlFor="media-op-result">
              <span>{t.result}</span>
              <textarea id="media-op-result" rows={10} value={opResult} readOnly />
            </label>
          </AdminSectionCard>

          <LogCard
            title={t.mediaList}
            description="Recent media assets with approval, rights, status, and quick select actions."
            icon="table"
            titleTag="h2"
          >
            {items.length === 0 ? (
              <div className="state-empty">{t.empty}</div>
            ) : (
              <AdminTable caption={t.mediaList}>
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Path</th>
                      <th>Status</th>
                      <th>Approval</th>
                      <th>Rights</th>
                      <th>Updated</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.storage_path || "-"}</td>
                        <td>{item.status || "-"}</td>
                        <td>{item.approval_status || "-"}</td>
                        <td>{item.rights_status || "-"}</td>
                        <td>{prettyDate(item.updated_at, locale)}</td>
                        <td>
                          <AdminButton variant="secondary" size="sm" icon="search" type="button" onClick={() => setMediaId(item.id)}>
                            select
                          </AdminButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTable>
            )}
          </LogCard>
        </>
      ) : null}
    </main>
  );
}
