"use client";

import { type FormEvent, useEffect, useState } from "react";

import { clearAuthSession, loginAdmin, persistAuthSession, readAuthSession } from "@/app/_lib/admin-auth";
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

type ImportItem = {
  id: string;
  admin_email: string | null;
  filename: string | null;
  rows_total: number;
  rows_created: number;
  rows_updated: number;
  status: string;
  duration_ms: number;
  created_at: string;
};

type ImportListResponse = {
  items: ImportItem[];
  total: number;
};

type ImportRunResponse = {
  inserted: number;
  updated: number;
  errors: string[];
  total_rows: number;
  dry_run: boolean;
};

type DashboardSummaryResponse = {
  raw_metrics: {
    last_mirror_status?: {
      status: string | null;
      checked_at: string | null;
      failures_count: number | null;
      ok: boolean | null;
    };
    last_deploy_health_status?: {
      deploy_status: string | null;
      deploy_checked_at: string | null;
      build_sha?: string | null;
      source?: string | null;
    };
  };
};

const copy = {
  en: {
    eyebrow: "Import operations",
    title: "Admin Imports Workspace",
    subtitle: "Run imports, review history, and track mirror and publish health from one operational workspace.",
    loginTitle: "Admin sign in",
    loginSubtitle: "Use the same credentials as /api/v1/auth/login.",
    sessionTitle: "Admin",
    sessionDescription: "Active workspace session and refresh controls.",
    email: "Admin email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in",
    signOut: "Sign out",
    refresh: "Refresh",
    loading: "Loading imports workspace",
    authRequired: "Sign in to load imports workspace.",
    loginMissing: "Email and password are required.",
    loginInvalid: "Invalid credentials.",
    loginError: "Unable to sign in right now.",
    loadError: "Unable to load import/mirror data right now.",
    errorTitle: "Imports workspace error",
    errorHint: "Please retry. If the problem persists, check API health and auth session.",
    retry: "Retry",
    importRun: "Run import",
    csvFile: "CSV file",
    dryRun: "Dry run",
    executeImport: "Start import",
    importResult: "Import result",
    imports: "Latest imports",
    mirror: "Mirror status",
    deploy: "Deploy status",
    checkedAt: "Checked at",
    total: "Total",
    empty: "No import records found yet.",
    emptyHint: "Run an import or relax the filters to load more history.",
    filterStatus: "Status filter",
    filterDryRun: "Dry-run filter",
    sessionActive: "Session active",
    importRunDescription: "Upload a CSV, choose dry-run mode, and review the normalized import result before committing changes.",
    importSelectionHint: "Keep one file ready, choose dry-run when validating mappings, then review the response before the live run.",
    importHistoryDescription: "Recent import executions with status, source file, row counts, and runtime.",
    importSuccess: "Import request completed.",
    dryRunSuccess: "Dry-run import completed.",
    importResultHint: "Review the response payload before running the next import.",
    selectedFile: "Selected file",
    selectedMode: "Run mode",
    source: "Source",
    created: "Created",
    status: "Status",
    file: "File",
    rows: "Rows",
    createdRows: "Created rows",
    updatedRows: "Updated rows",
    durationMs: "Duration (ms)",
    success: "Success",
    partial: "Partial",
    failed: "Failed",
    pending: "Pending",
    unknown: "Unknown",
    liveRun: "Live run",
    dryRunValue: "Dry run",
    live: "Live",
    ready: "Ready",
    stable: "Stable",
    sourceTelemetryMissing: "Telemetry file missing",
    sourceTelemetryFile: "Telemetry file",
    sourceUnknown: "Unknown source",
    all: "all",
    true: "Dry run",
    false: "Live run",
  },
  th: {
    eyebrow: "งานนำเข้าข้อมูล",
    title: "จัดการงานนำเข้า",
    subtitle: "ดูแลการนำเข้าไฟล์ ประวัติการรัน และติดตามสถานะมิเรอร์กับสถานะเผยแพร่ผ่านพื้นที่ปฏิบัติการเดียว",
    loginTitle: "เข้าสู่ระบบแอดมิน",
    loginSubtitle: "ใช้บัญชีเดียวกับ /api/v1/auth/login",
    sessionTitle: "เซสชันแอดมิน",
    sessionDescription: "เซสชันที่ใช้งานอยู่ พร้อมปุ่มรีเฟรชและควบคุมการทำงานของพื้นที่นี้",
    email: "อีเมลแอดมิน",
    password: "รหัสผ่าน",
    signIn: "เข้าสู่ระบบ",
    signingIn: "กำลังเข้าสู่ระบบ",
    signOut: "ออกจากระบบ",
    refresh: "รีเฟรช",
    loading: "กำลังโหลดพื้นที่งานนำเข้า",
    authRequired: "กรุณาเข้าสู่ระบบก่อนใช้งานพื้นที่งานนำเข้า",
    loginMissing: "ต้องกรอกอีเมลและรหัสผ่าน",
    loginInvalid: "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง",
    loginError: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้",
    loadError: "ไม่สามารถโหลดข้อมูลงานนำเข้าและสถานะมิเรอร์ได้",
    errorTitle: "ข้อผิดพลาดของพื้นที่งานนำเข้า",
    errorHint: "กรุณาลองใหม่ หากยังไม่สำเร็จให้ตรวจสอบ API และเซสชันการเข้าสู่ระบบ",
    retry: "ลองใหม่",
    importRun: "เริ่มงานนำเข้า",
    csvFile: "ไฟล์ CSV",
    dryRun: "โหมดทดลองรัน",
    executeImport: "เริ่มนำเข้า",
    importResult: "ผลลัพธ์การนำเข้า",
    imports: "ประวัติการนำเข้าล่าสุด",
    mirror: "สถานะมิเรอร์",
    deploy: "สถานะเผยแพร่",
    checkedAt: "เวลาตรวจสอบ",
    total: "ทั้งหมด",
    empty: "ยังไม่มีรายการ import",
    emptyHint: "เริ่มงานนำเข้าหรือผ่อนตัวกรองเพื่อดูประวัติเพิ่มเติม",
    filterStatus: "กรองสถานะ",
    filterDryRun: "กรองโหมดทดลองรัน",
    sessionActive: "เซสชันพร้อมใช้งาน",
    importRunDescription: "อัปโหลดไฟล์ CSV เลือกโหมดทดลองรัน และตรวจผลลัพธ์ที่ระบบแปลงก่อนสั่งนำเข้าจริง",
    importSelectionHint: "เตรียมไฟล์ไว้หนึ่งชุด เลือกโหมดทดลองรันเมื่อต้องตรวจ mapping แล้วค่อยดูผลลัพธ์ก่อนสั่งรันจริง",
    importHistoryDescription: "ประวัติการรันล่าสุด พร้อมสถานะ ไฟล์ จำนวนแถว และเวลาที่ใช้ในการประมวลผล",
    importSuccess: "สั่งงานนำเข้าสำเร็จ",
    dryRunSuccess: "ทดลองรันสำเร็จ",
    importResultHint: "ตรวจผลลัพธ์นี้ก่อนเริ่มการนำเข้ารอบถัดไป",
    selectedFile: "ไฟล์ที่เลือก",
    selectedMode: "โหมดที่กำลังใช้",
    source: "แหล่งที่มา",
    created: "สร้างเมื่อ",
    status: "สถานะ",
    file: "ไฟล์",
    rows: "จำนวนแถว",
    createdRows: "แถวที่สร้าง",
    updatedRows: "แถวที่อัปเดต",
    durationMs: "เวลาที่ใช้ (ms)",
    success: "สำเร็จ",
    partial: "บางส่วน",
    failed: "ล้มเหลว",
    pending: "รอดำเนินการ",
    unknown: "ไม่ทราบ",
    liveRun: "รันจริง",
    dryRunValue: "ทดลองรัน",
    live: "สด",
    ready: "พร้อม",
    stable: "เสถียร",
    sourceTelemetryMissing: "ไม่พบไฟล์ telemetry",
    sourceTelemetryFile: "จากไฟล์ telemetry",
    sourceUnknown: "ไม่ทราบแหล่งที่มา",
    all: "ทั้งหมด",
    true: "ทดลองรัน",
    false: "รันจริง",
  },
};

type ImportCopy = typeof copy.en;

function detectLocale(): Locale {
  return detectAdminLocale();
}

function prettyDate(value: string | null | undefined, locale: Locale): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
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

function translateImportStatus(value: string | null | undefined, t: ImportCopy): string {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  const normalized = raw.toLowerCase();
  if (normalized === "success") return t.success;
  if (normalized === "ok" || normalized === "healthy") return t.ready;
  if (normalized === "partial") return t.partial;
  if (normalized === "warning" || normalized === "degraded") return t.partial;
  if (normalized === "failed") return t.failed;
  if (normalized === "error" || normalized === "unhealthy") return t.failed;
  if (normalized === "pending") return t.pending;
  if (normalized === "unknown") return t.unknown;
  return raw;
}

function translateImportSource(value: string | null | undefined, t: ImportCopy): string {
  const raw = String(value || "").trim();
  if (!raw) return t.sourceUnknown;
  const normalized = raw.toLowerCase();
  if (normalized === "telemetry_file_missing") return t.sourceTelemetryMissing;
  if (normalized === "telemetry_file") return t.sourceTelemetryFile;
  return raw;
}

export default function AdminImportsPage() {
  const [locale, setLocale] = useState<Locale>(() => detectLocale());
  const [authToken, setAuthToken] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [imports, setImports] = useState<ImportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [mirrorStatus, setMirrorStatus] = useState<DashboardSummaryResponse["raw_metrics"]["last_mirror_status"]>(
    undefined
  );
  const [deployStatus, setDeployStatus] = useState<
    DashboardSummaryResponse["raw_metrics"]["last_deploy_health_status"]
  >(undefined);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState("");
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [dryRunFilter, setDryRunFilter] = useState("");

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
  }, [authToken, statusFilter, dryRunFilter]);

  function buildListUrl(): string {
    const params = new URLSearchParams();
    params.set("limit", "20");
    params.set("page", "1");
    if (statusFilter.trim()) params.set("status", statusFilter.trim());
    if (dryRunFilter === "true" || dryRunFilter === "false") params.set("dry_run", dryRunFilter);
    return `/admin/properties/imports?${params.toString()}`;
  }

  async function loadWorkspace(tokenOverride?: string) {
    const activeToken = (tokenOverride ?? authToken).trim();
    if (!activeToken) {
      setPageError(t.authRequired);
      return;
    }
    setLoading(true);
    setPageError(null);
    try {
      const [importsBody, dashboardBody] = await Promise.all([
        fetchJson<ImportListResponse>(buildListUrl(), activeToken),
        fetchJson<DashboardSummaryResponse>("/admin/dashboard/health-summary", activeToken),
      ]);
      setImports(Array.isArray(importsBody.items) ? importsBody.items : []);
      setTotal(Number(importsBody.total || 0));
      setMirrorStatus(dashboardBody.raw_metrics?.last_mirror_status);
      setDeployStatus(dashboardBody.raw_metrics?.last_deploy_health_status);
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
      const loginResult = await loginAdmin(email, password);
      if (!loginResult.ok) {
        setAuthError(loginResult.status === 401 ? t.loginInvalid : t.loginError);
        return;
      }
      const accessToken = loginResult.accessToken;
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
    setImports([]);
    setTotal(0);
    setMirrorStatus(undefined);
    setDeployStatus(undefined);
    setImportResult("");
    setImportNotice(null);
  }

  async function runImport() {
    if (!importFile || !authToken.trim()) return;
    setImportBusy(true);
    setPageError(null);
    setImportNotice(null);
    try {
      const formData = new FormData();
      formData.set("file", importFile);
      const result = await fetchJson<ImportRunResponse>(
        `/admin/properties/import?dry_run=${dryRun ? "true" : "false"}`,
        authToken,
        { method: "POST", body: formData }
      );
      setImportResult(toPrettyJson(result));
      setImportNotice(dryRun ? t.dryRunSuccess : t.importSuccess);
      setImportFile(null);
      await loadWorkspace();
    } catch (error) {
      setPageError(formatWorkspaceErrorMessage(error, t.errorHint));
    } finally {
      setImportBusy(false);
    }
  }

  return (
    <main id="main-content" className="container content-stack">
      <AdminPageHeader title={t.title} description={t.subtitle} icon="imports" eyebrow={t.eyebrow} />

      <ActionCard
        className="admin-workspace-panel admin-workspace-panel--auth dashboard-controls dashboard-controls--session"
        title={isAuthenticated ? (authEmail || t.sessionTitle) : t.loginTitle}
        description={isAuthenticated ? t.sessionDescription : t.loginSubtitle}
        icon={isAuthenticated ? "profile" : "imports"}
        titleTag="h2"
      >
        {!isAuthenticated ? (
          <form className="crm-login-form" method="post" onSubmit={(event) => void login(event)}>
            <label className="field" htmlFor="imports-login-email">
              <span>{t.email}</span>
              <input
                id="imports-login-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
            </label>

            <label className="field" htmlFor="imports-login-password">
              <span>{t.password}</span>
              <input
                id="imports-login-password"
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
            <div className="crm-session-panel__head">
              <div className="crm-session-panel__copy">
                <strong>{authEmail || t.sessionTitle}</strong>
                <span>{t.sessionActive}</span>
              </div>
              <div className="crm-session-panel__quick-actions">
                <AdminButton variant="secondary" icon="refresh" type="button" onClick={() => void loadWorkspace()} disabled={loading || importBusy}>
                  {loading ? t.loading : t.refresh}
                </AdminButton>
                <AdminButton variant="secondary" icon="x" type="button" onClick={logout} disabled={loading || importBusy}>
                  {t.signOut}
                </AdminButton>
              </div>
            </div>
            <dl className="crm-session-panel__meta">
              <div>
                <dt>{t.total}</dt>
                <dd>{total}</dd>
              </div>
              <div>
                <dt>{t.checkedAt}</dt>
                <dd>{prettyDate(deployStatus?.deploy_checked_at || mirrorStatus?.checked_at, locale)}</dd>
              </div>
            </dl>
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
          <section className="dashboard-grid">
            <AdminStatCard
              label={t.mirror}
              value={translateImportStatus(mirrorStatus?.status, t)}
              detail={`${t.checkedAt}: ${prettyDate(mirrorStatus?.checked_at, locale)}`}
              badgeLabel={t.live}
              icon="refresh"
              tone="info"
            />
            <AdminStatCard
              label={t.deploy}
              value={translateImportStatus(deployStatus?.deploy_status, t)}
              detail={`${t.checkedAt}: ${prettyDate(deployStatus?.deploy_checked_at, locale)} · ${t.source}: ${translateImportSource(
                deployStatus?.source,
                t
              )}`}
              badgeLabel={t.ready}
              icon="dashboard"
              tone="neutral"
            />
            <AdminStatCard label={t.total} value={total} badgeLabel={t.stable} icon="imports" tone="ok" />
          </section>

          <ActionCard
            className="admin-workspace-panel admin-workspace-panel--actions admin-workspace-panel--imports-run"
            title={t.importRun}
            description={t.importRunDescription}
            icon="imports"
            titleTag="h2"
          >
            <div className="admin-workspace-form-grid admin-workspace-form-grid--imports">
              <label className="field" htmlFor="imports-file">
                <span>{t.csvFile}</span>
                <input
                  id="imports-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => setImportFile(event.target.files?.[0] || null)}
                />
              </label>
              <label className="field admin-workspace-toggle-field" htmlFor="imports-dryrun">
                <span>{t.dryRun}</span>
                <input
                  id="imports-dryrun"
                  type="checkbox"
                  checked={dryRun}
                  onChange={(event) => setDryRun(event.target.checked)}
                />
              </label>
              <div className="card-actions admin-workspace-inline-actions">
                <AdminButton
                  variant="primary"
                  icon="imports"
                  type="button"
                  disabled={importBusy || !importFile}
                  onClick={() => void runImport()}
                >
                  {importBusy ? t.loading : t.executeImport}
                </AdminButton>
              </div>
            </div>
            <div className="admin-workspace-inline-meta" role="status" aria-live="polite">
              <span>
                {t.selectedFile}: <strong>{importFile?.name || "-"}</strong>
              </span>
              <span>
                {t.selectedMode}: <strong>{dryRun ? t.dryRunValue : t.liveRun}</strong>
              </span>
            </div>
            <p className="admin-input__hint">{t.importSelectionHint}</p>
            <div className="admin-workspace-result-stack">
              <label className="field admin-workspace-result-field" htmlFor="imports-result">
                <span>{t.importResult}</span>
                <textarea id="imports-result" rows={importResult ? 5 : 2} readOnly value={importResult} />
              </label>
              <p className="admin-input__hint">{t.importResultHint}</p>
              {importNotice ? <div className="state-success">{importNotice}</div> : null}
            </div>
          </ActionCard>

          <LogCard
            className="admin-workspace-panel admin-workspace-panel--records"
            bodyClassName="admin-workspace-log-body"
            title={t.imports}
            description={t.importHistoryDescription}
            icon="table"
            titleTag="h2"
          >
            <div className="dashboard-grid admin-workspace-filter-grid admin-workspace-filter-grid--imports">
              <label className="field" htmlFor="imports-filter-status">
                <span>{t.filterStatus}</span>
                <input
                  id="imports-filter-status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  placeholder={t.all}
                />
              </label>
              <label className="field" htmlFor="imports-filter-dryrun">
                <span>{t.filterDryRun}</span>
                <select
                  id="imports-filter-dryrun"
                  value={dryRunFilter}
                  onChange={(event) => setDryRunFilter(event.target.value)}
                >
                  <option value="">{t.all}</option>
                  <option value="true">{t.true}</option>
                  <option value="false">{t.false}</option>
                </select>
              </label>
            </div>
            {imports.length === 0 ? (
              <div className="state-empty">{`${t.empty} ${t.emptyHint}`}</div>
            ) : (
              <AdminTable caption={t.imports}>
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>{t.created}</th>
                      <th>{t.status}</th>
                      <th>{t.file}</th>
                      <th>{t.rows}</th>
                      <th>{t.createdRows}</th>
                      <th>{t.updatedRows}</th>
                      <th>{t.durationMs}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {imports.map((row) => (
                      <tr key={row.id}>
                        <td>{prettyDate(row.created_at, locale)}</td>
                        <td>{translateImportStatus(row.status, t)}</td>
                        <td>{row.filename || "-"}</td>
                        <td>{row.rows_total}</td>
                        <td>{row.rows_created}</td>
                        <td>{row.rows_updated}</td>
                        <td>{row.duration_ms}</td>
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
