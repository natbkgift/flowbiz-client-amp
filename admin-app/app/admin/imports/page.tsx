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
    title: "Admin Imports Workspace",
    subtitle: "Full import operations: run import, filter history, and track mirror/deploy outcomes.",
    loginTitle: "Admin sign in",
    loginSubtitle: "Use the same credentials as /api/v1/auth/login.",
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
    executeImport: "Execute import",
    importResult: "Import result",
    imports: "Latest imports",
    mirror: "Mirror status",
    deploy: "Deploy status",
    checkedAt: "Checked at",
    total: "Total",
    empty: "No import records found yet.",
    filterStatus: "Status filter",
    filterDryRun: "Dry-run filter",
    all: "all",
    true: "true",
    false: "false",
  },
  th: {
    title: "Admin Imports Workspace",
    subtitle: "รองรับ import แบบครบ: run import, filter history และติดตาม mirror/deploy",
    loginTitle: "เข้าสู่ระบบแอดมิน",
    loginSubtitle: "ใช้บัญชีเดียวกับ /api/v1/auth/login",
    email: "อีเมลแอดมิน",
    password: "รหัสผ่าน",
    signIn: "เข้าสู่ระบบ",
    signingIn: "กำลังเข้าสู่ระบบ",
    signOut: "ออกจากระบบ",
    refresh: "รีเฟรช",
    loading: "กำลังโหลด imports workspace",
    authRequired: "กรุณาเข้าสู่ระบบก่อนใช้งาน imports workspace",
    loginMissing: "ต้องกรอกอีเมลและรหัสผ่าน",
    loginInvalid: "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง",
    loginError: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้",
    loadError: "ไม่สามารถโหลดข้อมูล import/mirror ได้",
    errorTitle: "ข้อผิดพลาดของ imports workspace",
    errorHint: "กรุณาลองใหม่ หากยังไม่สำเร็จให้ตรวจสอบ API และเซสชันการเข้าสู่ระบบ",
    retry: "ลองใหม่",
    importRun: "รัน import",
    csvFile: "ไฟล์ CSV",
    dryRun: "โหมด dry run",
    executeImport: "รัน import",
    importResult: "ผลการ import",
    imports: "รายการ import ล่าสุด",
    mirror: "สถานะ mirror",
    deploy: "สถานะ deploy",
    checkedAt: "เวลาตรวจสอบ",
    total: "ทั้งหมด",
    empty: "ยังไม่มีรายการ import",
    filterStatus: "กรองสถานะ",
    filterDryRun: "กรอง dry-run",
    all: "ทั้งหมด",
    true: "true",
    false: "false",
  },
};

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

export default function AdminImportsPage() {
  const [locale, setLocale] = useState<Locale>("en");
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
  }

  async function runImport() {
    if (!importFile || !authToken.trim()) return;
    setImportBusy(true);
    setPageError(null);
    try {
      const formData = new FormData();
      formData.set("file", importFile);
      const result = await fetchJson<ImportRunResponse>(
        `/admin/properties/import?dry_run=${dryRun ? "true" : "false"}`,
        authToken,
        { method: "POST", body: formData }
      );
      setImportResult(toPrettyJson(result));
      await loadWorkspace();
    } catch (error) {
      setPageError(formatWorkspaceErrorMessage(error, t.errorHint));
    } finally {
      setImportBusy(false);
    }
  }

  return (
    <main id="main-content" className="container content-stack">
      <AdminPageHeader title={t.title} description={t.subtitle} icon="imports" eyebrow="Import operations" />

      <ActionCard
        className="dashboard-controls"
        title={isAuthenticated ? (authEmail || "Admin") : t.loginTitle}
        description={isAuthenticated ? "Active workspace session and refresh controls." : t.loginSubtitle}
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
          <section className="dashboard-grid">
            <AdminStatCard
              label={t.mirror}
              value={mirrorStatus?.status || "-"}
              detail={`${t.checkedAt}: ${prettyDate(mirrorStatus?.checked_at, locale)}`}
              icon="refresh"
              tone="info"
            />
            <AdminStatCard
              label={t.deploy}
              value={deployStatus?.deploy_status || "-"}
              detail={`${t.checkedAt}: ${prettyDate(deployStatus?.deploy_checked_at, locale)} · source: ${deployStatus?.source || "-"}`}
              icon="dashboard"
              tone="neutral"
            />
            <AdminStatCard label={t.total} value={total} icon="imports" tone="ok" />
          </section>

          <ActionCard
            title={t.importRun}
            description="Upload a CSV, choose dry-run mode, and inspect the normalized import result."
            icon="imports"
            titleTag="h2"
          >
            <div className="dashboard-grid">
              <label className="field" htmlFor="imports-file">
                <span>{t.csvFile}</span>
                <input
                  id="imports-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => setImportFile(event.target.files?.[0] || null)}
                />
              </label>
              <label className="field" htmlFor="imports-dryrun">
                <span>{t.dryRun}</span>
                <input
                  id="imports-dryrun"
                  type="checkbox"
                  checked={dryRun}
                  onChange={(event) => setDryRun(event.target.checked)}
                />
              </label>
              <div className="card-actions">
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
            <label className="field" htmlFor="imports-result">
              <span>{t.importResult}</span>
              <textarea id="imports-result" rows={8} readOnly value={importResult} />
            </label>
          </ActionCard>

          <LogCard
            title={t.imports}
            description="Recent import executions with status, file, row counts, and runtime."
            icon="table"
            titleTag="h2"
          >
            <div className="dashboard-grid">
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
              <div className="state-empty">{t.empty}</div>
            ) : (
              <AdminTable caption={t.imports}>
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Created</th>
                      <th>Status</th>
                      <th>File</th>
                      <th>Rows</th>
                      <th>Created rows</th>
                      <th>Updated rows</th>
                      <th>Duration (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {imports.map((row) => (
                      <tr key={row.id}>
                        <td>{prettyDate(row.created_at, locale)}</td>
                        <td>{row.status || "-"}</td>
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
