"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { clearAuthSession, loginAdmin, persistAuthSession, readAuthSession } from "@/app/_lib/admin-auth";
import { detectAdminLocale, type AdminLocale, withAdminLocale } from "@/app/_lib/admin-i18n";
import {
  ActionCard,
  AdminAccessGate,
  AdminBadge,
  AdminButton,
  AdminPrimaryActionBar,
  AdminPageHeader,
  AdminSectionCard,
  AdminSectionTabs,
  AdminTable,
  LogCard,
} from "@/components/admin/AdminPrimitives";
import { formatSeoApiError, readRequestFailedStatus } from "./error-utils";

type Locale = AdminLocale;

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

type SeoSuccessKey = "override" | "redirect" | "schema" | "report";

const copy = {
  en: {
    title: "Search Visibility",
    subtitle: "Manage search metadata, redirects, schema, and broken-link recovery one task at a time.",
    signIn: "Sign in",
    signOut: "Sign out",
    save: "Save",
    refresh: "Refresh",
    loading: "Loading",
    authRequired: "Sign in to use SEO controls.",
    loginTitle: "Admin sign in",
    email: "Admin email",
    password: "Password",
    loginMissing: "Email and password are required.",
    loginInvalid: "Invalid credentials.",
    loginError: "Unable to sign in right now.",
    sectionOverrides: "SEO overrides",
    sectionRedirects: "Redirect manager",
    sectionSchema: "Schema source fields",
    sectionBroken: "Broken links report",
    emptyOverrides: "No overrides yet. Add key pages when available.",
    emptyRedirects: "No redirects yet. Add legacy paths when available.",
    emptyReport: "No report yet. Run checker when ready.",
    emptySchema: "Schema source is empty. Fill approved business data before publishing.",
    retry: "Retry",
    sessionDescription: "Active SEO workspace session and refresh controls.",
    loginDescription: "Use admin credentials to manage overrides, redirects, schema, and broken-link reports.",
    overridesDescription: "Manage per-path SEO metadata overrides.",
    redirectsDescription: "Manage redirect rules and preload production mappings.",
    preloadRedirects: "Preload production redirects",
    openDashboard: "Open dashboard",
    openReviewQueue: "Open review queue",
    successTitle: "Next verification",
    overrideSaved: "SEO override saved.",
    redirectSaved: "Redirect rule saved.",
    redirectsPreloaded: "Production redirects loaded.",
    schemaSaved: "Schema source saved.",
    schemaBootstrapped: "Approved schema defaults loaded.",
    reportReady: "Broken-link report refreshed.",
    overrideSuccessBody: "Review dashboard and review queue to confirm the updated path metadata still lines up with the current publishing plan.",
    redirectSuccessBody: "Check dashboard and review queue for any affected legacy journeys before closing this redirect task.",
    schemaSuccessBody: "Use dashboard and review queue to confirm schema source changes still match current content and publishing priorities.",
    reportSuccessBody: "Use dashboard and review queue to hand off any pages that still need content fixes after this checker run.",
    authHint: "Sign in first, then use overrides, redirects, schema, and broken-link tools from one owner workspace.",
    overridesEmptyHint: "Start with one high-traffic path, then return to dashboard or review queue to verify the next content action.",
    redirectsEmptyHint: "Load production redirects first or add one legacy path now so operators do not need to leave this page to start cleanup.",
    schemaEmptyHint: "Bootstrap the approved schema source first, then review locale fields before publishing related content changes.",
    reportEmptyHint: "Run the checker here, then use dashboard or review queue to follow up on pages that need content fixes.",
    schemaDescription: "Edit approved schema source fields by locale.",
    schemaBootstrap: "Load approved schema defaults",
    brokenDescription: "Run the link checker and inspect the latest crawl report.",
    runChecker: "Run checker",
    checkedAt: "Checked at",
    checkedPages: "Checked pages",
    totalLinks: "Total links",
    checkerVersion: "Checker version",
    noBrokenLinks: "No broken links found.",
    deleteOverrideConfirm: "Delete this SEO override now?",
    deleteRedirectConfirm: "Delete this redirect rule now?",
    editing: "Editing",
    edit: "Edit",
    del: "Delete",
  },
  th: {
    title: "การมองเห็นบน Search",
    subtitle: "จัดการเมทาดาทา การส่งต่อ Schema และงานตามลิงก์เสียแบบทีละงานจากหน้าเดียว",
    signIn: "เข้าสู่ระบบ",
    signOut: "ออกจากระบบ",
    save: "บันทึก",
    refresh: "รีเฟรช",
    loading: "กำลังโหลด",
    authRequired: "กรุณาเข้าสู่ระบบก่อนใช้งานเครื่องมือ SEO",
    loginTitle: "เข้าสู่ระบบแอดมิน",
    email: "อีเมลแอดมิน",
    password: "รหัสผ่าน",
    loginMissing: "กรอกอีเมลและรหัสผ่านก่อนเข้าสู่ระบบ",
    loginInvalid: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    loginError: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้",
    sectionOverrides: "การตั้งค่า SEO เฉพาะหน้า",
    sectionRedirects: "จัดการรีไดเรกต์",
    sectionSchema: "ฟิลด์ต้นทางของ Schema",
    sectionBroken: "รายงานลิงก์เสีย",
    emptyOverrides: "ยังไม่มี overrides เพิ่มหน้าสำคัญเมื่อพร้อม",
    emptyRedirects: "ยังไม่มี redirects เพิ่ม path เดิมเมื่อพร้อม",
    emptyReport: "ยังไม่มีรายงาน ให้รัน checker เมื่อพร้อม",
    emptySchema: "ข้อมูล schema ยังว่าง ให้เติมข้อมูลธุรกิจที่อนุมัติก่อนเผยแพร่",
    retry: "ลองใหม่",
    sessionDescription: "เซสชันพื้นที่งาน SEO ที่กำลังใช้งานอยู่ พร้อมคำสั่งรีเฟรชข้อมูล",
    loginDescription: "ใช้บัญชีแอดมินเพื่อจัดการ override, redirect, schema และรายงานลิงก์เสีย",
    overridesDescription: "จัดการเมทาดาทา SEO แบบเฉพาะหน้าและเฉพาะภาษา",
    redirectsDescription: "จัดการกฎ redirect และดึง mapping จาก production",
    preloadRedirects: "ดึง redirect จาก production",
    openDashboard: "ดูแดชบอร์ด",
    openReviewQueue: "ดูคิวตรวจทาน",
    successTitle: "จุดตรวจถัดไป",
    overrideSaved: "บันทึก SEO override แล้ว",
    redirectSaved: "บันทึกกฎ redirect แล้ว",
    redirectsPreloaded: "โหลด redirect จาก production แล้ว",
    schemaSaved: "บันทึก schema source แล้ว",
    schemaBootstrapped: "โหลดค่า schema ที่อนุมัติแล้วเรียบร้อย",
    reportReady: "อัปเดตรายงานลิงก์เสียแล้ว",
    overrideSuccessBody: "ตรวจ dashboard และ review queue เพื่อยืนยันว่าเมทาดาทาของ path ที่แก้ยังสอดคล้องกับแผนเผยแพร่ปัจจุบัน",
    redirectSuccessBody: "ตรวจ dashboard และ review queue สำหรับเส้นทาง legacy ที่ได้รับผลกระทบก่อนปิดงาน redirect นี้",
    schemaSuccessBody: "ใช้ dashboard และ review queue เพื่อตรวจว่าการเปลี่ยน schema source ยังตรงกับคอนเทนต์และลำดับการเผยแพร่ปัจจุบัน",
    reportSuccessBody: "ใช้ dashboard และ review queue เพื่อส่งต่องานให้หน้าที่ยังต้องแก้คอนเทนต์หลังจากรัน checker รอบนี้",
    authHint: "เข้าสู่ระบบก่อน แล้วใช้หน้าเดียวนี้จัดการ override, redirect, schema และ broken-link tools สำหรับ owner",
    overridesEmptyHint: "เริ่มจาก path สำคัญสักหนึ่งหน้า แล้วค่อยกลับไปดู dashboard หรือ review queue เพื่อทำงานต่อกับคอนเทนต์ที่เกี่ยวข้อง",
    redirectsEmptyHint: "ดึง redirect จาก production ก่อน หรือเพิ่ม legacy path แรกจากหน้านี้ได้ทันทีโดยไม่ต้องสลับหน้า",
    schemaEmptyHint: "โหลด schema source ที่อนุมัติแล้วก่อน แล้วค่อยทบทวนฟิลด์ตามภาษาให้พร้อมก่อนเผยแพร่คอนเทนต์ที่เกี่ยวข้อง",
    reportEmptyHint: "รันตัวตรวจจากหน้านี้ แล้วใช้ dashboard หรือ review queue เพื่อตามงานหน้าที่ต้องแก้คอนเทนต์ต่อ",
    schemaDescription: "แก้ไขข้อมูลต้นทางของ Schema ตามภาษาที่เลือก",
    schemaBootstrap: "โหลดค่า schema ที่อนุมัติแล้ว",
    brokenDescription: "รันตัวตรวจลิงก์และตรวจรายงาน crawl ล่าสุดจากหน้าเดียว",
    runChecker: "รันตัวตรวจลิงก์",
    checkedAt: "เวลาตรวจล่าสุด",
    checkedPages: "หน้าที่ตรวจ",
    totalLinks: "ลิงก์ทั้งหมด",
    checkerVersion: "เวอร์ชันตัวตรวจ",
    noBrokenLinks: "ไม่พบลิงก์เสีย",
    deleteOverrideConfirm: "ต้องการลบ SEO override นี้ตอนนี้หรือไม่",
    deleteRedirectConfirm: "ต้องการลบกฎ redirect นี้ตอนนี้หรือไม่",
    editing: "กำลังแก้ไข",
    edit: "แก้ไข",
    del: "ลบ",
  },
};

function detectLocale(): Locale {
  return detectAdminLocale();
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

function redirectStatusTone(statusCode: number): "info" | "warn" {
  return statusCode === 302 ? "warn" : "info";
}

async function api<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (token.trim()) headers.set("Authorization", `Bearer ${token.trim()}`);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(`/api${path}`, { ...init, headers, cache: "no-store" });
  if (!response.ok) throw new Error(`request_failed:${response.status}:${await response.text()}`);
  return (await response.json()) as T;
}

export default function AdminSeoPage() {
  const [locale, setLocale] = useState<Locale>(() => detectLocale());
  const [activeTab, setActiveTab] = useState<"overrides" | "redirects" | "schema" | "broken">("overrides");
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
  const [pageNotice, setPageNotice] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<SeoSuccessKey | null>(null);

  useEffect(() => {
    const l = detectLocale();
    setLocale(l);
    setOverrideForm(emptyOverride(l));
    setSchemaForm(emptySchema(l));
    const s = readAuthSession();
    if (!s) return;
    setToken(s.token);
    setEmail(s.email);
  }, []);

  const t = copy[locale];
  const isAuth = token.trim().length > 0;

  function successBody(key: SeoSuccessKey | null): string {
    if (key === "redirect") return t.redirectSuccessBody;
    if (key === "schema") return t.schemaSuccessBody;
    if (key === "report") return t.reportSuccessBody;
    return t.overrideSuccessBody;
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setAuthError(t.loginMissing);
      return;
    }
    setBusy(true);
    setAuthError(null);
    try {
      const result = await loginAdmin(loginEmail.trim(), loginPassword);
      if (!result.ok) {
        setAuthError(result.status === 401 ? t.loginInvalid : t.loginError);
        return;
      }
      const accessToken = result.accessToken;
      setToken(accessToken);
      setEmail(loginEmail.trim());
      persistAuthSession(accessToken, loginEmail.trim());
      await refreshAll(accessToken);
    } catch {
      setAuthError(t.loginError);
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    clearAuthSession();
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
    setPageNotice(null);
    setSuccessKey(null);
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
      if (readRequestFailedStatus(error) === 404) {
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
      setPageError(formatSeoApiError(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuth) return;
    void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function saveOverrideAction() {
    if (!isAuth) return;
    setBusy(true);
    setPageError(null);
    setPageNotice(null);
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
      setPageNotice(t.overrideSaved);
      setSuccessKey("override");
    } catch (error) {
      setPageError(formatSeoApiError(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveOverride(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveOverrideAction();
  }

  async function saveRedirectAction() {
    if (!isAuth) return;
    setBusy(true);
    setPageError(null);
    setPageNotice(null);
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
      setPageNotice(t.redirectSaved);
      setSuccessKey("redirect");
    } catch (error) {
      setPageError(formatSeoApiError(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveRedirect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveRedirectAction();
  }

  async function preloadRedirectsFromProduction() {
    if (!isAuth) return;
    setBusy(true);
    setPageError(null);
    setPageNotice(null);
    try {
      await api("/admin/seo/redirects/preload-production", token, {
        method: "POST",
        body: JSON.stringify({ dry_run: false, overwrite_existing: true }),
      });
      await loadRedirects(token);
      setPageNotice(t.redirectsPreloaded);
      setSuccessKey("redirect");
    } catch (error) {
      setPageError(formatSeoApiError(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveSchemaAction() {
    if (!isAuth) return;
    setBusy(true);
    setPageError(null);
    setPageNotice(null);
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
      setPageNotice(t.schemaSaved);
      setSuccessKey("schema");
    } catch (error) {
      setPageError(formatSeoApiError(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveSchema(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveSchemaAction();
  }

  async function bootstrapSchemaFromProduction() {
    if (!isAuth) return;
    setBusy(true);
    setPageError(null);
    setPageNotice(null);
    try {
      await api("/admin/seo/schema-source/bootstrap-production", token, {
        method: "POST",
        body: JSON.stringify({ locale: schemaForm.locale, overwrite_existing: true }),
      });
      await loadSchema(token, schemaForm.locale);
      setPageNotice(t.schemaBootstrapped);
      setSuccessKey("schema");
    } catch (error) {
      setPageError(formatSeoApiError(error));
    } finally {
      setBusy(false);
    }
  }

  async function runBrokenLinks() {
    if (!isAuth) return;
    setBusy(true);
    setPageError(null);
    setPageNotice(null);
    try {
      const body = await api<{ report: BrokenLinkReport }>("/admin/seo/broken-links/run", token, {
        method: "POST",
      });
      setReport(body.report || null);
      setPageNotice(t.reportReady);
      setSuccessKey("report");
    } catch (error) {
      setPageError(formatSeoApiError(error));
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
  const stickyPrimaryAction =
    activeTab === "redirects"
      ? { label: t.save, onClick: () => void saveRedirectAction() }
      : activeTab === "schema"
        ? { label: t.save, onClick: () => void saveSchemaAction() }
        : activeTab === "broken"
          ? { label: t.runChecker, onClick: () => void runBrokenLinks() }
          : { label: t.save, onClick: () => void saveOverrideAction() };
  const stickySecondaryActions =
    activeTab === "redirects"
      ? [
          { label: t.preloadRedirects, onClick: () => void preloadRedirectsFromProduction(), disabled: !isAuth || busy },
          { label: t.refresh, onClick: () => void refreshAll(), disabled: !isAuth || loading || busy },
          { label: t.signOut, onClick: logout, disabled: busy },
        ]
      : activeTab === "schema"
        ? [
            { label: t.schemaBootstrap, onClick: () => void bootstrapSchemaFromProduction(), disabled: !isAuth || busy },
            { label: t.refresh, onClick: () => void refreshAll(), disabled: !isAuth || loading || busy },
            { label: t.signOut, onClick: logout, disabled: busy },
          ]
        : [
            { label: t.refresh, onClick: () => void refreshAll(), disabled: !isAuth || loading || busy },
            { label: t.signOut, onClick: logout, disabled: busy },
          ];

  return (
    <main id="main-content" className="container content-stack admin-overflow-guard">
      <AdminPageHeader title={t.title} description={t.subtitle} icon="globe" eyebrow="Search workflow" />

      <AdminAccessGate
        isAuthenticated={isAuth}
        authTitle={t.loginTitle}
        authDescription={t.loginDescription}
        sessionTitle={email || t.authRequired}
        sessionDescription={t.sessionDescription}
        authContent={
          <form className="crm-login-form" method="post" onSubmit={(event) => void login(event)}>
            <label className="field" htmlFor="seo-login-email">
              <span>{t.email}</span>
              <input id="seo-login-email" name="email" type="email" autoComplete="username" required value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
            </label>
            <label className="field" htmlFor="seo-login-password">
              <span>{t.password}</span>
              <input id="seo-login-password" name="password" type="password" autoComplete="current-password" required value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} />
            </label>
            {authError ? <div className="state-error" role="alert">{authError}</div> : null}
            <div className="card-actions">
              <AdminButton variant="primary" icon="workspace" type="submit" disabled={busy}>{t.signIn}</AdminButton>
            </div>
            <div className="state-empty admin-workspace-empty-state" role="status">
              <strong>{t.authRequired}</strong>
              <p className="locale-safe">{t.authHint}</p>
            </div>
          </form>
        }
        sessionContent={isAuth ? <AdminBadge tone="ok">{email || t.authRequired}</AdminBadge> : null}
      >
        <AdminPrimaryActionBar
          title={t.title}
          description={t.subtitle}
          primaryAction={{ ...stickyPrimaryAction, disabled: !isAuth || busy || loading }}
          secondaryActions={stickySecondaryActions}
          meta={<AdminBadge tone={pageNotice ? "ok" : "info"}>{pageNotice || t.sessionDescription}</AdminBadge>}
          mobileBottom
        />
        <AdminSectionTabs
          activeTab={activeTab}
          onChange={(key) => setActiveTab(key as "overrides" | "redirects" | "schema" | "broken")}
          tabs={[
            { key: "overrides", label: t.sectionOverrides, count: overrides.length },
            { key: "redirects", label: t.sectionRedirects, count: redirects.length },
            { key: "schema", label: t.sectionSchema },
            { key: "broken", label: t.sectionBroken, count: report?.broken_links.length ?? 0 },
          ]}
        />

      {pageError ? (
          <div className="state-error" role="alert">
            <p style={{ margin: 0, overflowWrap: "anywhere" }}>{pageError}</p>
            <div className="card-actions">
              <AdminButton variant="secondary" type="button" onClick={() => void refreshAll()} disabled={!isAuth || loading || busy}>
                {t.retry}
              </AdminButton>
            </div>
          </div>
        ) : null}
      {pageNotice ? (
        <div className="admin-workspace-success-handoff" role="status">
          <div className="state-success">{pageNotice}</div>
          <strong>{t.successTitle}</strong>
          <p className="locale-safe">{successBody(successKey)}</p>
          <div className="card-actions">
            <Link className="admin-button admin-button--secondary admin-button--sm" href={withAdminLocale("/admin/dashboard", locale)}>
              {t.openDashboard}
            </Link>
            <Link className="admin-button admin-button--secondary admin-button--sm" href={withAdminLocale("/admin/review-queue", locale)}>
              {t.openReviewQueue}
            </Link>
          </div>
        </div>
      ) : null}
      {loading ? <div className="state-loading">{t.loading}</div> : null}

      <section className="seo-layout">
        {activeTab === "overrides" ? (
        <AdminSectionCard
          className="seo-pane"
          title={t.sectionOverrides}
          description={t.overridesDescription}
          icon="globe"
        >
          <form className="seo-form-grid" onSubmit={(event) => void saveOverride(event)}>
            <label className="field" htmlFor="seo-override-path"><span>Path</span><input id="seo-override-path" value={overrideForm.path} onChange={(event) => setOverrideForm((prev) => ({ ...prev, path: event.target.value }))} required /></label>
            <label className="field" htmlFor="seo-override-locale"><span>Locale</span><select id="seo-override-locale" value={overrideForm.locale} onChange={(event) => setOverrideForm((prev) => ({ ...prev, locale: event.target.value === "th" ? "th" : "en" }))}><option value="en">en</option><option value="th">th</option></select></label>
            <label className="field" htmlFor="seo-override-title"><span>Title</span><input id="seo-override-title" value={overrideForm.title} onChange={(event) => setOverrideForm((prev) => ({ ...prev, title: event.target.value }))} /></label>
            <label className="field seo-field-wide" htmlFor="seo-override-description"><span>Description</span><textarea id="seo-override-description" rows={2} value={overrideForm.description} onChange={(event) => setOverrideForm((prev) => ({ ...prev, description: event.target.value }))} /></label>
            <label className="field seo-field-wide" htmlFor="seo-override-canonical"><span>Canonical</span><input id="seo-override-canonical" value={overrideForm.canonical} onChange={(event) => setOverrideForm((prev) => ({ ...prev, canonical: event.target.value }))} /></label>
            <label className="seo-inline-check" htmlFor="seo-override-robots-index"><input id="seo-override-robots-index" type="checkbox" checked={overrideForm.robots_index} onChange={(event) => setOverrideForm((prev) => ({ ...prev, robots_index: event.target.checked }))} /><span>index</span></label>
            <label className="seo-inline-check" htmlFor="seo-override-robots-follow"><input id="seo-override-robots-follow" type="checkbox" checked={overrideForm.robots_follow} onChange={(event) => setOverrideForm((prev) => ({ ...prev, robots_follow: event.target.checked }))} /><span>follow</span></label>
            <label className="seo-inline-check" htmlFor="seo-override-enabled"><input id="seo-override-enabled" type="checkbox" checked={overrideForm.enabled} onChange={(event) => setOverrideForm((prev) => ({ ...prev, enabled: event.target.checked }))} /><span>enabled</span></label>
            <div className="card-actions seo-actions-wide">
              <AdminButton variant="primary" type="submit" disabled={!isAuth || busy}>{t.save}</AdminButton>
            </div>
          </form>
          {overrides.length === 0 ? (
            <div className="state-empty admin-workspace-empty-state" role="status">
              <strong>{t.emptyOverrides}</strong>
              <p className="locale-safe">{t.overridesEmptyHint}</p>
              <div className="card-actions">
                <Link className="admin-button admin-button--secondary admin-button--sm" href={withAdminLocale("/admin/dashboard", locale)}>
                  {t.openDashboard}
                </Link>
                <Link className="admin-button admin-button--secondary admin-button--sm" href={withAdminLocale("/admin/review-queue", locale)}>
                  {t.openReviewQueue}
                </Link>
              </div>
            </div>
          ) : null}
          {overrides.length > 0 ? (
            <ul className="seo-item-list" aria-label={t.sectionOverrides}>
              {overrides.map((item) => (
                <li key={item.id} className="seo-item-row">
                  <div className="seo-item-head"><strong>{item.path}</strong><AdminBadge tone="info">{item.locale}</AdminBadge></div>
                  <p className="seo-item-meta">{item.title || "-"}</p>
                  <div className="card-actions">
                    <AdminButton variant="secondary" type="button" onClick={() => { setEditingOverrideId(item.id); setOverrideForm({ path: item.path, locale: item.locale === "th" ? "th" : "en", title: item.title || "", description: item.description || "", canonical: item.canonical || "", robots_index: item.robots_index, robots_follow: item.robots_follow, enabled: item.enabled }); }}>{editingOverrideId === item.id ? t.editing : t.edit}</AdminButton>
                    <AdminButton variant="secondary" type="button" onClick={async () => { if (typeof window !== "undefined" && !window.confirm(t.deleteOverrideConfirm)) return; await api(`/admin/seo/overrides/${item.id}`, token, { method: "DELETE" }); if (editingOverrideId === item.id) { setEditingOverrideId(null); setOverrideForm(emptyOverride(locale)); } await loadOverrides(token); }}>{t.del}</AdminButton>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </AdminSectionCard>
        ) : null}

        {activeTab === "redirects" ? (
        <AdminSectionCard
          className="seo-pane"
          title={t.sectionRedirects}
          description={t.redirectsDescription}
          icon="refresh"
        >
          <form className="seo-form-grid" onSubmit={(event) => void saveRedirect(event)}>
            <label className="field" htmlFor="seo-redirect-old-path"><span>Old path</span><input id="seo-redirect-old-path" value={redirectForm.old_path} onChange={(event) => setRedirectForm((prev) => ({ ...prev, old_path: event.target.value }))} required /></label>
            <label className="field" htmlFor="seo-redirect-new-path"><span>New path</span><input id="seo-redirect-new-path" value={redirectForm.new_path} onChange={(event) => setRedirectForm((prev) => ({ ...prev, new_path: event.target.value }))} required /></label>
            <label className="field" htmlFor="seo-redirect-status-code"><span>Status</span><select id="seo-redirect-status-code" value={String(redirectForm.status_code)} onChange={(event) => setRedirectForm((prev) => ({ ...prev, status_code: event.target.value === "302" ? 302 : 301 }))}><option value="301">301</option><option value="302">302</option></select></label>
            <label className="seo-inline-check" htmlFor="seo-redirect-preserve-query"><input id="seo-redirect-preserve-query" type="checkbox" checked={redirectForm.preserve_query} onChange={(event) => setRedirectForm((prev) => ({ ...prev, preserve_query: event.target.checked }))} /><span>preserve query</span></label>
            <label className="seo-inline-check" htmlFor="seo-redirect-enabled"><input id="seo-redirect-enabled" type="checkbox" checked={redirectForm.enabled} onChange={(event) => setRedirectForm((prev) => ({ ...prev, enabled: event.target.checked }))} /><span>enabled</span></label>
            <div className="card-actions seo-actions-wide">
              <AdminButton variant="primary" type="submit" disabled={!isAuth || busy}>{t.save}</AdminButton>
              <AdminButton variant="secondary" type="button" onClick={() => void preloadRedirectsFromProduction()} disabled={!isAuth || busy}>{t.preloadRedirects}</AdminButton>
            </div>
          </form>
          {redirects.length === 0 ? (
            <div className="state-empty admin-workspace-empty-state" role="status">
              <strong>{t.emptyRedirects}</strong>
              <p className="locale-safe">{t.redirectsEmptyHint}</p>
              <div className="card-actions">
                <AdminButton variant="secondary" type="button" onClick={() => void preloadRedirectsFromProduction()} disabled={!isAuth || busy}>
                  {t.preloadRedirects}
                </AdminButton>
              </div>
            </div>
          ) : null}
          {redirects.length > 0 ? (
            <ul className="seo-item-list" aria-label={t.sectionRedirects}>
              {redirects.map((item) => (
                <li key={item.id} className="seo-item-row">
                  <div className="seo-item-head"><strong>{item.old_path}</strong><AdminBadge tone={redirectStatusTone(item.status_code)}>{item.status_code}</AdminBadge></div>
                  <p className="seo-item-meta">{item.new_path}</p>
                  <div className="card-actions">
                    <AdminButton variant="secondary" type="button" onClick={() => { setEditingRedirectId(item.id); setRedirectForm({ old_path: item.old_path, new_path: item.new_path, status_code: item.status_code === 302 ? 302 : 301, preserve_query: item.preserve_query, enabled: item.enabled }); }}>{editingRedirectId === item.id ? t.editing : t.edit}</AdminButton>
                    <AdminButton variant="secondary" type="button" onClick={async () => { if (typeof window !== "undefined" && !window.confirm(t.deleteRedirectConfirm)) return; await api(`/admin/seo/redirects/${item.id}`, token, { method: "DELETE" }); if (editingRedirectId === item.id) { setEditingRedirectId(null); setRedirectForm(emptyRedirect()); } await loadRedirects(token); }}>{t.del}</AdminButton>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </AdminSectionCard>
        ) : null}

        {activeTab === "schema" ? (
        <AdminSectionCard
          className="seo-pane seo-full"
          title={t.sectionSchema}
          description={t.schemaDescription}
          icon="layout"
        >
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
              <AdminButton variant="primary" type="submit" disabled={!isAuth || busy}>{t.save}</AdminButton>
              <AdminButton variant="secondary" type="button" onClick={() => void bootstrapSchemaFromProduction()} disabled={!isAuth || busy}>{t.schemaBootstrap}</AdminButton>
            </div>
          </form>
          {!schemaHasData ? (
            <div className="state-empty admin-workspace-empty-state" role="status">
              <strong>{t.emptySchema}</strong>
              <p className="locale-safe">{t.schemaEmptyHint}</p>
              <div className="card-actions">
                <AdminButton variant="secondary" type="button" onClick={() => void bootstrapSchemaFromProduction()} disabled={!isAuth || busy}>
                  {t.schemaBootstrap}
                </AdminButton>
              </div>
            </div>
          ) : null}
        </AdminSectionCard>
        ) : null}

        {activeTab === "broken" ? (
        <LogCard
          className="seo-pane seo-full"
          title={t.sectionBroken}
          description={t.brokenDescription}
          icon="warning"
          titleTag="h2"
        >
          <div className="card-actions">
            <AdminButton variant="primary" type="button" onClick={() => void runBrokenLinks()} disabled={!isAuth || busy}>{t.runChecker}</AdminButton>
            <AdminButton variant="secondary" type="button" onClick={() => void loadReport(token)} disabled={!isAuth || busy}>{t.refresh}</AdminButton>
          </div>
          {policy ? (
            <div className="seo-report-grid" role="status" aria-live="polite">
              <p><strong>policy:</strong> {policy.version}</p>
              <p><strong>max_depth:</strong> {policy.max_depth}</p>
              <p><strong>max_pages:</strong> {policy.max_pages}</p>
              <p><strong>max_link_checks:</strong> {policy.max_link_checks}</p>
            </div>
          ) : null}
          {!report ? (
            <div className="state-empty admin-workspace-empty-state" role="status">
              <strong>{t.emptyReport}</strong>
              <p className="locale-safe">{t.reportEmptyHint}</p>
              <div className="card-actions">
                <AdminButton variant="secondary" type="button" onClick={() => void runBrokenLinks()} disabled={!isAuth || busy}>
                  {t.runChecker}
                </AdminButton>
                <Link className="admin-button admin-button--secondary admin-button--sm" href={withAdminLocale("/admin/dashboard", locale)}>
                  {t.openDashboard}
                </Link>
              </div>
            </div>
          ) : null}
          {report ? (
            <>
              <div className="seo-report-grid" role="status" aria-live="polite">
              <p><strong>{t.checkedAt}:</strong> {reportTime}</p>
              <p><strong>{t.checkedPages}:</strong> {report.checked_pages.length}</p>
              <p><strong>{t.totalLinks}:</strong> {report.total_links}</p>
              <p><strong>{t.checkerVersion}:</strong> {report.checker_version}</p>
            </div>
              {report.broken_links.length === 0 ? (
                <div className="state-empty">{t.noBrokenLinks}</div>
              ) : (
                <AdminTable caption="Broken links report">
                  <table className="admin-table">
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
                </AdminTable>
              )}
            </>
          ) : null}
        </LogCard>
        ) : null}
      </section>
      </AdminAccessGate>
    </main>
  );
}
