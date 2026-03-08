"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import { clearAuthSession, loginAdmin, persistAuthSession, readAuthSession } from "@/app/_lib/admin-auth";
import { detectAdminLocale, type AdminLocale } from "@/app/_lib/admin-i18n";
import { SITE_LAYOUT_CMS_SLUG, SITE_LAYOUT_CMS_TEMPLATE } from "@/app/_lib/layout-cms";
import {
  ActionCard,
  AdminButton,
  AdminPageHeader,
  LogCard,
} from "@/components/admin/AdminPrimitives";

type Locale = AdminLocale;
type CompanyInfoItem = {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  updated_at: string;
};

const API_PREFIX = "/api";

const copy = {
  en: {
    title: "Admin Layout CMS",
    subtitle:
      "Manage header/footer navigation and footer contact blocks from one JSON source of truth.",
    loginTitle: "Admin sign in",
    email: "Admin email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in",
    signOut: "Sign out",
    refresh: "Load current config",
    save: "Save config",
    saving: "Saving",
    reset: "Reset to template",
    authRequired: "Sign in to edit layout CMS.",
    loginMissing: "Email and password are required.",
    loginInvalid: "Invalid credentials.",
    loginError: "Unable to sign in right now.",
    loadError: "Unable to load layout CMS data.",
    saveError: "Unable to save layout CMS data.",
    saveSuccess: "Layout CMS saved.",
    configLabel: "site-layout JSON",
    sourceHint:
      "Stored in /admin/company/site-layout.content. Use internal paths only (example: /invest).",
    preview: "Resolved preview",
    exists: "Record exists",
    missing: "Record will be created on first save",
    updatedAt: "Updated at",
  },
  th: {
    title: "Admin Layout CMS",
    subtitle: "จัดการ header/footer และข้อมูลติดต่อท้ายหน้า จาก JSON แหล่งเดียว",
    loginTitle: "เข้าสู่ระบบแอดมิน",
    email: "อีเมลแอดมิน",
    password: "รหัสผ่าน",
    signIn: "เข้าสู่ระบบ",
    signingIn: "กำลังเข้าสู่ระบบ",
    signOut: "ออกจากระบบ",
    refresh: "โหลดค่าปัจจุบัน",
    save: "บันทึกค่า",
    saving: "กำลังบันทึก",
    reset: "รีเซ็ตตาม template",
    authRequired: "กรุณาเข้าสู่ระบบก่อนแก้ไข layout CMS",
    loginMissing: "กรุณากรอกอีเมลและรหัสผ่าน",
    loginInvalid: "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง",
    loginError: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้",
    loadError: "ไม่สามารถโหลดข้อมูล layout CMS ได้",
    saveError: "ไม่สามารถบันทึก layout CMS ได้",
    saveSuccess: "บันทึก layout CMS สำเร็จ",
    configLabel: "JSON ของ site-layout",
    sourceHint:
      "ข้อมูลถูกเก็บใน /admin/company/site-layout.content กรุณาใช้ internal path เท่านั้น (เช่น /invest)",
    preview: "พรีวิวค่าที่อ่านได้",
    exists: "มี record แล้ว",
    missing: "ยังไม่มี record (ระบบจะสร้างให้เมื่อกดบันทึกครั้งแรก)",
    updatedAt: "อัปเดตล่าสุด",
  },
};

function detectLocale(): Locale {
  return detectAdminLocale();
}

async function authFetch(path: string, token: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return fetch(path, { ...init, headers, cache: "no-store" });
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

export default function AdminLayoutCmsPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [recordExists, setRecordExists] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [configText, setConfigText] = useState(SITE_LAYOUT_CMS_TEMPLATE);

  useEffect(() => {
    setLocale(detectLocale());
    const session = readAuthSession();
    if (!session) return;
    setToken(session.token);
    setEmail(session.email);
  }, []);

  const isAuthenticated = token.trim().length > 0;
  const t = copy[locale];

  const preview = useMemo(() => {
    try {
      const parsed = JSON.parse(configText) as Record<string, unknown>;
      const header = (parsed.header || {}) as Record<string, unknown>;
      const footer = (parsed.footer || {}) as Record<string, unknown>;
      const headerLinks = Array.isArray(header.primary_links) ? header.primary_links.length : 0;
      const footerQuick = Array.isArray(footer.quick_links) ? footer.quick_links.length : 0;
      const footerLegal = Array.isArray(footer.legal_links) ? footer.legal_links.length : 0;
      const contact = (footer.contact || {}) as Record<string, unknown>;
      return {
        ok: true,
        headerLinks,
        footerQuick,
        footerLegal,
        email: String(contact.email || "").trim() || "-",
      };
    } catch {
      return { ok: false, headerLinks: 0, footerQuick: 0, footerLegal: 0, email: "-" };
    }
  }, [configText]);

  async function loadCurrent(tokenOverride?: string): Promise<void> {
    const activeToken = (tokenOverride ?? token).trim();
    if (!activeToken) {
      setPageError(t.authRequired);
      return;
    }
    setLoading(true);
    setPageError(null);
    setResultMessage(null);
    try {
      const response = await authFetch(
        `${API_PREFIX}/admin/company/${SITE_LAYOUT_CMS_SLUG}`,
        activeToken,
      );
      if (response.status === 404) {
        setRecordExists(false);
        setUpdatedAt(null);
        setConfigText(SITE_LAYOUT_CMS_TEMPLATE);
        return;
      }
      if (!response.ok) throw new Error(`request_failed:${response.status}`);
      const body = (await response.json()) as CompanyInfoItem;
      setRecordExists(true);
      setUpdatedAt(body.updated_at || null);
      setConfigText(String(body.content || "").trim() || SITE_LAYOUT_CMS_TEMPLATE);
    } catch {
      setPageError(t.loadError);
    } finally {
      setLoading(false);
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextEmail = loginEmail.trim();
    if (!nextEmail || !loginPassword) {
      setAuthError(t.loginMissing);
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const loginResult = await loginAdmin(nextEmail, loginPassword);
      if (!loginResult.ok) {
        setAuthError(loginResult.status === 401 ? t.loginInvalid : t.loginError);
        return;
      }
      const accessToken = loginResult.accessToken;
      setToken(accessToken);
      setEmail(nextEmail);
      setLoginPassword("");
      persistAuthSession(accessToken, nextEmail);
      await loadCurrent(accessToken);
    } catch {
      setAuthError(t.loginError);
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
    setResultMessage(null);
    setRecordExists(false);
    setUpdatedAt(null);
    setConfigText(SITE_LAYOUT_CMS_TEMPLATE);
  }

  async function saveConfig() {
    const activeToken = token.trim();
    if (!activeToken) {
      setPageError(t.authRequired);
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(configText);
    } catch {
      setPageError(`${t.saveError} (invalid JSON)`);
      return;
    }
    if (!parsed || typeof parsed !== "object") {
      setPageError(`${t.saveError} (JSON root must be an object)`);
      return;
    }

    setSaving(true);
    setPageError(null);
    setResultMessage(null);
    try {
      const body = JSON.stringify(
        recordExists
          ? {
              title: "Site Layout CMS",
              content: JSON.stringify(parsed, null, 2),
              meta_description: "Header/Footer CMS source of truth",
            }
          : {
              title: "Site Layout CMS",
              slug: SITE_LAYOUT_CMS_SLUG,
              content: JSON.stringify(parsed, null, 2),
              meta_description: "Header/Footer CMS source of truth",
            },
      );
      const response = await authFetch(
        recordExists
          ? `${API_PREFIX}/admin/company/${SITE_LAYOUT_CMS_SLUG}`
          : `${API_PREFIX}/admin/company`,
        activeToken,
        { method: recordExists ? "PATCH" : "POST", body },
      );
      if (!response.ok) {
        throw new Error(`request_failed:${response.status}`);
      }
      const saved = (await response.json()) as CompanyInfoItem;
      setRecordExists(true);
      setUpdatedAt(saved.updated_at || null);
      setConfigText(String(saved.content || "").trim() || SITE_LAYOUT_CMS_TEMPLATE);
      setResultMessage(t.saveSuccess);
    } catch {
      setPageError(t.saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main id="main-content" className="container content-stack">
      <AdminPageHeader title={t.title} description={t.subtitle} icon="layout" eyebrow="Layout CMS" />

      <ActionCard
        className="dashboard-controls"
        title={isAuthenticated ? (email || "Admin") : t.loginTitle}
        description={isAuthenticated ? "Current layout CMS session and fetch controls." : "Use admin credentials to edit the shared layout source."}
        icon={isAuthenticated ? "profile" : "layout"}
        titleTag="h2"
      >
        {!isAuthenticated ? (
          <form className="crm-login-form" method="post" onSubmit={(event) => void login(event)}>
            <label className="field" htmlFor="layout-login-email">
              <span>{t.email}</span>
              <input
                id="layout-login-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
            </label>
            <label className="field" htmlFor="layout-login-password">
              <span>{t.password}</span>
              <input
                id="layout-login-password"
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
            <p className="locale-safe">{email ? `${t.email}: ${email}` : t.authRequired}</p>
            <div className="card-actions">
              <AdminButton variant="secondary" icon="refresh" type="button" onClick={() => void loadCurrent()}>
                {loading ? t.refresh : t.refresh}
              </AdminButton>
              <AdminButton variant="secondary" icon="x" type="button" onClick={logout}>
                {t.signOut}
              </AdminButton>
            </div>
          </div>
        )}
        {!isAuthenticated ? <div className="state-empty">{t.authRequired}</div> : null}
      </ActionCard>

      {isAuthenticated ? (
        <ActionCard
          title={t.configLabel}
          description={t.sourceHint}
          icon="layout"
          titleTag="h2"
          meta={
            <>
              <span className="locale-safe">{recordExists ? t.exists : t.missing}</span>
              <span>
                <strong>{t.updatedAt}:</strong> {prettyDate(updatedAt, locale)}
              </span>
            </>
          }
        >
          <label className="field" htmlFor="layout-cms-json">
            <span>{t.configLabel}</span>
            <textarea
              id="layout-cms-json"
              rows={24}
              value={configText}
              onChange={(event) => setConfigText(event.target.value)}
            />
          </label>
          <div className="card-actions">
            <AdminButton variant="primary" icon="success" type="button" disabled={saving} onClick={() => void saveConfig()}>
              {saving ? t.saving : t.save}
            </AdminButton>
            <AdminButton
              variant="secondary"
              icon="refresh"
              type="button"
              onClick={() => setConfigText(SITE_LAYOUT_CMS_TEMPLATE)}
            >
              {t.reset}
            </AdminButton>
          </div>
          {pageError ? <div className="state-error">{pageError}</div> : null}
          {resultMessage ? <div className="state-success">{resultMessage}</div> : null}
        </ActionCard>
      ) : null}

      {isAuthenticated ? (
        <LogCard
          title={t.preview}
          description="Resolved counts and contact details parsed from the current JSON config."
          icon="table"
          titleTag="h2"
        >
          {!preview.ok ? (
            <div className="state-error">Invalid JSON</div>
          ) : (
            <ul className="bullet-list">
              <li>Header links: {preview.headerLinks}</li>
              <li>Footer quick links: {preview.footerQuick}</li>
              <li>Footer legal links: {preview.footerLegal}</li>
              <li>Footer email: {preview.email}</li>
            </ul>
          )}
        </LogCard>
      ) : null}
    </main>
  );
}
