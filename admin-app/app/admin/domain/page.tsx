"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { fetchJson } from "@/app/_lib/admin-auth";
import { useAdminAuthController } from "@/app/_lib/admin-auth-hooks";
import { detectAdminLocale, withAdminLocale } from "@/app/_lib/admin-i18n";
import { formatWorkspaceErrorMessage } from "@/app/_lib/admin-workspace-error";
import {
  AdminAccessGate,
  AdminBadge,
  AdminButton,
  AdminPage,
  AdminPageHeader,
  AdminPrimaryActionBar,
  AdminResponsiveList,
  AdminSectionCard,
  AdminSectionGrid,
  AdminSectionTabs,
  AdminTable,
} from "@/components/admin/AdminPrimitives";

type Locale = "en" | "th";
type EntityType = "areas" | "developers" | "projects";

type DomainRow = {
  id: string;
  slug?: string | null;
  name?: string | null;
  title?: string | null;
  status?: string | null;
  updated_at?: string | null;
};

type HealthSummary = {
  raw_metrics?: {
    pending_translations?: { total_pending_translations?: number };
    unpublished_drafts?: { total_unpublished_drafts?: number };
    stale_content?: { total_stale_content?: number };
  };
};

const copy = {
  en: {
    title: "Domain Ops",
    subtitle: "Legacy route hub for domain content. Review the current signal, then move into the right workspace without touching raw payloads here.",
    eyebrow: "Legacy admin route",
    authTitle: "Admin sign in",
    authDescription: "Use the existing admin session to review current domain health and hand work off to the right workspace.",
    sessionTitle: "Domain handoff session",
    sessionDescription: "This route is now read-only. Refresh the summary here, then continue in Areas, Developers, or Projects.",
    email: "Admin email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in...",
    signOut: "Sign out",
    refresh: "Refresh summary",
    authEmpty: "Sign in to review domain health and recent records.",
    authErrorMissing: "Email and password are required.",
    authErrorInvalid: "Invalid credentials.",
    authErrorUnknown: "Unable to sign in right now.",
    loadError: "Unable to load the domain summary right now.",
    retry: "Retry",
    primaryActionTitle: "Route legacy work safely",
    primaryActionBody: "Use this page only to confirm what needs attention, then continue in the focused workspace for the actual change.",
    primaryActionMeta: "No create, patch, publish, or raw payload editing lives on this route anymore.",
    openCurrent: "Open current workspace",
    openDashboard: "Open Operations Hub",
    tabOverview: "Overview",
    tabAreas: "Areas",
    tabDevelopers: "Developers",
    tabProjects: "Projects",
    pending: "Pending translations",
    drafts: "Unpublished drafts",
    stale: "Stale content signals",
    areasTitle: "Areas workspace",
    areasBody: "Use Areas when the next job is location copy, local market proof, or readiness checks.",
    developersTitle: "Developers workspace",
    developersBody: "Use Developers when the next job is trust proof, profile content, or publish readiness.",
    projectsTitle: "Projects workspace",
    projectsBody: "Use Projects when the next job is project copy, linked media, or publishing.",
    openAreas: "Open Areas",
    openDevelopers: "Open Developers",
    openProjects: "Open Projects",
    recentTitle: "Recent records",
    recentBody: "Latest rows from the current entity family so operators can jump straight into the right editor.",
    emptyRecords: "No records were returned for this workspace.",
    listLoading: "Loading current domain summary...",
    slug: "Slug",
    name: "Name",
    status: "Status",
    updated: "Updated",
    useRecord: "Open workspace",
    statusSummary: "Summary state",
    summaryHealthy: "Current route is stable and read-only.",
    summaryError: "Current route could not load the latest summary.",
  },
  th: {
    title: "Domain Ops",
    subtitle: "ฮับของ route เดิมสำหรับงานโดเมน ใช้หน้านี้ดูสัญญาณรวม แล้วค่อยไปต่อใน workspace ที่ถูกต้องโดยไม่แตะ payload ดิบที่นี่",
    eyebrow: "เส้นทางเดิมของแอดมิน",
    authTitle: "เข้าสู่ระบบแอดมิน",
    authDescription: "ใช้เซสชันแอดมินเดิมเพื่อตรวจภาพรวมของ domain แล้วส่งต่องานไปยัง workspace ที่เหมาะสม",
    sessionTitle: "เซสชันสำหรับส่งต่องานโดเมน",
    sessionDescription: "หน้านี้เป็นแบบอ่านอย่างเดียวแล้ว ใช้รีเฟรชภาพรวมที่นี่ แล้วไปทำงานต่อใน Areas, Developers หรือ Projects",
    email: "อีเมลแอดมิน",
    password: "รหัสผ่าน",
    signIn: "เข้าสู่ระบบ",
    signingIn: "กำลังเข้าสู่ระบบ...",
    signOut: "ออกจากระบบ",
    refresh: "รีเฟรชภาพรวม",
    authEmpty: "เข้าสู่ระบบก่อนเพื่อตรวจ domain health และรายการล่าสุด",
    authErrorMissing: "กรอกอีเมลและรหัสผ่านก่อน",
    authErrorInvalid: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    authErrorUnknown: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้",
    loadError: "ไม่สามารถโหลดภาพรวมของโดเมนได้ในขณะนี้",
    retry: "ลองใหม่",
    primaryActionTitle: "ส่งต่องานจาก route เดิมอย่างปลอดภัย",
    primaryActionBody: "ใช้หน้านี้เพื่อตรวจว่ามีอะไรต้องทำต่อ แล้วค่อยไปยัง workspace ที่โฟกัสงานจริงของรายการนั้น",
    primaryActionMeta: "หน้านี้ไม่มีคำสั่งสร้าง แก้ไข เผยแพร่ หรือการแก้ payload ดิบอีกแล้ว",
    openCurrent: "เปิด workspace ปัจจุบัน",
    openDashboard: "เปิด Operations Hub",
    tabOverview: "ภาพรวม",
    tabAreas: "พื้นที่",
    tabDevelopers: "ผู้พัฒนา",
    tabProjects: "โครงการ",
    pending: "งานแปลที่ค้าง",
    drafts: "ฉบับร่างที่ยังไม่เผยแพร่",
    stale: "สัญญาณคอนเทนต์ล้าสมัย",
    areasTitle: "พื้นที่จัดการ Areas",
    areasBody: "ใช้ Areas เมื่องานถัดไปคือคอนเทนต์ทำเล หลักฐานตลาดท้องถิ่น หรือ readiness checks",
    developersTitle: "พื้นที่จัดการ Developers",
    developersBody: "ใช้ Developers เมื่องานถัดไปคือ trust proof โปรไฟล์ หรือการเช็กความพร้อมก่อนเผยแพร่",
    projectsTitle: "พื้นที่จัดการ Projects",
    projectsBody: "ใช้ Projects เมื่องานถัดไปคือคอนเทนต์โครงการ สื่อที่เชื่อมอยู่ หรือการเผยแพร่",
    openAreas: "เปิด Areas",
    openDevelopers: "เปิด Developers",
    openProjects: "เปิด Projects",
    recentTitle: "รายการล่าสุด",
    recentBody: "แถวล่าสุดของกลุ่มข้อมูลที่เลือก เพื่อให้ผู้ปฏิบัติงานข้ามไปยัง editor ที่ถูกต้องได้ทันที",
    emptyRecords: "ยังไม่มีรายการจาก workspace นี้",
    listLoading: "กำลังโหลดภาพรวมของโดเมน...",
    slug: "Slug",
    name: "ชื่อ",
    status: "สถานะ",
    updated: "อัปเดตล่าสุด",
    useRecord: "เปิด workspace",
    statusSummary: "สถานะของภาพรวม",
    summaryHealthy: "route ปัจจุบันเสถียรและเป็นแบบอ่านอย่างเดียว",
    summaryError: "route ปัจจุบันไม่สามารถโหลดภาพรวมล่าสุดได้",
  },
} as const;

function formatDate(value: string | null | undefined, locale: Locale): string {
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

function pickRows(body: { data?: DomainRow[] } | null | undefined): DomainRow[] {
  return Array.isArray(body?.data) ? body.data.filter(Boolean).slice(0, 5) : [];
}

export default function AdminDomainPage() {
  const locale = detectAdminLocale() as Locale;
  const t = copy[locale];
  const [activeTab, setActiveTab] = useState<EntityType | "overview">("overview");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [areas, setAreas] = useState<DomainRow[]>([]);
  const [developers, setDevelopers] = useState<DomainRow[]>([]);
  const [projects, setProjects] = useState<DomainRow[]>([]);

  const {
    token,
    email,
    authLoading,
    authErrorCode,
    isAuthenticated,
    persistSession,
    login,
    logout,
  } = useAdminAuthController();

  const authError =
    authErrorCode === "missing_credentials"
      ? t.authErrorMissing
      : authErrorCode === "invalid_credentials"
        ? t.authErrorInvalid
        : authErrorCode
          ? t.authErrorUnknown
          : null;

  const currentHref = useMemo(() => {
    switch (activeTab) {
      case "areas":
        return "/admin/areas";
      case "developers":
        return "/admin/developers";
      case "projects":
        return "/admin/projects";
      default:
        return "/admin/dashboard";
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    void loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  async function loadSummary(tokenOverride?: string): Promise<void> {
    const activeToken = (tokenOverride ?? token).trim();
    if (!activeToken) {
      setPageError(t.authEmpty);
      return;
    }

    setLoading(true);
    setPageError(null);

    try {
      const [areasBody, developersBody, projectsBody, summaryBody] = await Promise.all([
        fetchJson<{ data?: DomainRow[] }>("/api/admin/areas?limit=5", activeToken),
        fetchJson<{ data?: DomainRow[] }>("/api/admin/developers?limit=5", activeToken),
        fetchJson<{ data?: DomainRow[] }>("/api/admin/projects?limit=5", activeToken),
        fetchJson<HealthSummary>("/api/admin/dashboard/health-summary", activeToken),
      ]);

      setAreas(pickRows(areasBody));
      setDevelopers(pickRows(developersBody));
      setProjects(pickRows(projectsBody));
      setSummary(summaryBody);
      persistSession(activeToken, email || loginEmail);
    } catch (error) {
      setPageError(formatWorkspaceErrorMessage(error, t.loadError));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const result = await login({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    if (!result.ok) {
      return;
    }
    setLoginPassword("");
    await loadSummary(result.accessToken);
  }

  const pendingTranslations = Number(summary?.raw_metrics?.pending_translations?.total_pending_translations || 0);
  const unpublishedDrafts = Number(summary?.raw_metrics?.unpublished_drafts?.total_unpublished_drafts || 0);
  const staleContent = Number(summary?.raw_metrics?.stale_content?.total_stale_content || 0);
  const activeRows = activeTab === "areas" ? areas : activeTab === "developers" ? developers : projects;

  const tabs = [
    { key: "overview", label: t.tabOverview },
    { key: "areas", label: t.tabAreas, count: areas.length },
    { key: "developers", label: t.tabDevelopers, count: developers.length },
    { key: "projects", label: t.tabProjects, count: projects.length },
  ];

  const handoffCards = [
    {
      key: "areas",
      title: t.areasTitle,
      body: t.areasBody,
      href: "/admin/areas",
      cta: t.openAreas,
      icon: "areas" as const,
    },
    {
      key: "developers",
      title: t.developersTitle,
      body: t.developersBody,
      href: "/admin/developers",
      cta: t.openDevelopers,
      icon: "developers" as const,
    },
    {
      key: "projects",
      title: t.projectsTitle,
      body: t.projectsBody,
      href: "/admin/projects",
      cta: t.openProjects,
      icon: "projects" as const,
    },
  ];

  return (
    <AdminPage className="admin-domain-page admin-overflow-guard" busy={loading}>
      <AdminPageHeader
        title={t.title}
        description={t.subtitle}
        icon="domain"
        eyebrow={t.eyebrow}
        meta={
          <>
            <AdminBadge tone={pageError ? "warn" : "ok"} icon={pageError ? "warning" : "success"}>
              {t.statusSummary}
            </AdminBadge>
            <AdminBadge tone={pageError ? "warn" : "neutral"} icon={pageError ? "warning" : "info"}>
              {pageError ? t.summaryError : t.summaryHealthy}
            </AdminBadge>
          </>
        }
      />

      <AdminAccessGate
        isAuthenticated={isAuthenticated}
        authTitle={t.authTitle}
        authDescription={t.authDescription}
        sessionTitle={t.sessionTitle}
        sessionDescription={t.sessionDescription}
        authContent={
          <form className="crm-login-form" onSubmit={(event) => void handleLogin(event)}>
            <label className="field" htmlFor="domain-login-email">
              <span>{t.email}</span>
              <input
                id="domain-login-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
            </label>
            <label className="field" htmlFor="domain-login-password">
              <span>{t.password}</span>
              <input
                id="domain-login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />
            </label>
            {authError ? <div className="state-error">{authError}</div> : null}
            <AdminButton variant="primary" icon="workspace" type="submit" disabled={authLoading}>
              {authLoading ? t.signingIn : t.signIn}
            </AdminButton>
            <div className="state-empty admin-workspace-empty-state">{t.authEmpty}</div>
          </form>
        }
        sessionContent={
          <div className="crm-session-panel" role="status" aria-live="polite">
            <p>{email || "admin"}</p>
            <div className="card-actions">
              <AdminButton variant="secondary" icon="refresh" type="button" onClick={() => void loadSummary()} disabled={loading}>
                {t.refresh}
              </AdminButton>
              <AdminButton variant="secondary" icon="x" type="button" onClick={logout} disabled={loading}>
                {t.signOut}
              </AdminButton>
            </div>
          </div>
        }
      />

      {isAuthenticated ? (
        <>
          <AdminPrimaryActionBar
            title={t.primaryActionTitle}
            description={t.primaryActionBody}
            meta={<span className="locale-safe">{t.primaryActionMeta}</span>}
            primaryAction={{ label: t.openCurrent, href: withAdminLocale(currentHref, locale) }}
            secondaryActions={[
              { label: t.openDashboard, href: withAdminLocale("/admin/dashboard", locale) },
              { label: t.refresh, onClick: () => void loadSummary(), disabled: loading },
            ]}
            mobileBottom
          />

          <AdminSectionTabs tabs={tabs} activeTab={activeTab} onChange={(key) => setActiveTab(key as EntityType | "overview")} />

          {pageError ? (
            <div className="state-error" role="alert">
              {pageError}
            </div>
          ) : null}
          {loading ? <div className="state-loading">{t.listLoading}</div> : null}

          {activeTab === "overview" ? (
            <>
              <AdminSectionGrid>
                <AdminSectionCard title={t.pending} icon="language">
                  <strong>{pendingTranslations}</strong>
                </AdminSectionCard>
                <AdminSectionCard title={t.drafts} icon="blog">
                  <strong>{unpublishedDrafts}</strong>
                </AdminSectionCard>
                <AdminSectionCard title={t.stale} icon="warning">
                  <strong>{staleContent}</strong>
                </AdminSectionCard>
              </AdminSectionGrid>
              <AdminSectionGrid>
                {handoffCards.map((card) => (
                  <AdminSectionCard key={card.key} title={card.title} description={card.body} icon={card.icon}>
                    <Link className="admin-button admin-button--secondary" href={withAdminLocale(card.href, locale)}>
                      {card.cta}
                    </Link>
                  </AdminSectionCard>
                ))}
              </AdminSectionGrid>
            </>
          ) : (
            <AdminSectionCard title={t.recentTitle} description={t.recentBody} icon="table">
              {activeRows.length === 0 && !loading ? (
                <div className="state-empty admin-workspace-empty-state">{t.emptyRecords}</div>
              ) : (
                <AdminResponsiveList
                  desktop={
                    <AdminTable caption={t.recentTitle}>
                      <table>
                        <thead>
                          <tr>
                            <th>{t.slug}</th>
                            <th>{t.name}</th>
                            <th>{t.status}</th>
                            <th>{t.updated}</th>
                            <th>{t.useRecord}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeRows.map((row) => (
                            <tr key={row.id}>
                              <td>{row.slug || "-"}</td>
                              <td>{row.name || row.title || "-"}</td>
                              <td>{row.status || "-"}</td>
                              <td>{formatDate(row.updated_at, locale)}</td>
                              <td>
                                <Link className="admin-button admin-button--secondary admin-button--sm" href={withAdminLocale(currentHref, locale)}>
                                  {t.useRecord}
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </AdminTable>
                  }
                  mobile={
                    <div className="admin-mobile-record-list">
                      {activeRows.map((row) => (
                        <article key={row.id} className="admin-mobile-record-card">
                          <div className="admin-mobile-record-card__header">
                            <strong>{row.name || row.title || row.slug || row.id}</strong>
                            <AdminBadge tone="neutral" icon="info">
                              {row.status || "-"}
                            </AdminBadge>
                          </div>
                          <dl className="admin-mobile-record-card__meta">
                            <div>
                              <dt>{t.slug}</dt>
                              <dd>{row.slug || "-"}</dd>
                            </div>
                            <div>
                              <dt>{t.updated}</dt>
                              <dd>{formatDate(row.updated_at, locale)}</dd>
                            </div>
                          </dl>
                          <Link className="admin-button admin-button--secondary admin-button--sm" href={withAdminLocale(currentHref, locale)}>
                            {t.useRecord}
                          </Link>
                        </article>
                      ))}
                    </div>
                  }
                />
              )}
            </AdminSectionCard>
          )}
        </>
      ) : null}
    </AdminPage>
  );
}
