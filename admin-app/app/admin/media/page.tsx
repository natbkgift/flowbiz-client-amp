"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ADMIN_AUTH_LOGIN_PATH } from "@/app/_lib/admin-auth";
import { detectAdminLocale, type AdminLocale, withAdminLocale } from "@/app/_lib/admin-i18n";
import { formatWorkspaceErrorMessage } from "@/app/_lib/admin-workspace-error";
import AdminWorkspaceErrorState from "@/components/admin/AdminWorkspaceErrorState";
import {
  ActionCard,
  AdminAccessGate,
  AdminBadge,
  AdminButton,
  AdminPageHeader,
  AdminPrimaryActionBar,
  AdminResponsiveList,
  AdminSectionCard,
  AdminSectionTabs,
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

type GallerySelectionItem = {
  id: string;
  storage_path: string;
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
    title: "Media Library",
    subtitle:
      "Find the right asset, run one media task, and verify integrity without bouncing across tools.",
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
    emptyHint: "Refresh the workspace or upload a new file to repopulate the list.",
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
    sessionActive: "Session active",
    operationErrorHint: "Unable to complete the requested media action right now.",
    operationResultHint: "Review the response payload before moving on to the next media action.",
    operationSuccessTitle: "Next verification",
    operationSuccessBody: "Use dashboard and SEO to confirm the latest media change did not leave rights, integrity, or publishing issues behind.",
    selectionHint: "Pick a record, run one action at a time, and verify the result before continuing with archive, replace, or gallery sync.",
    invalidPatchJson: "Patch JSON must be valid JSON.",
    invalidGalleryPayload: "Gallery payload must be valid JSON.",
    getSuccess: "Media record loaded.",
    uploadSuccess: "Upload completed.",
    patchSuccess: "Media record updated.",
    archiveSuccess: "Media record archived.",
    restoreSuccess: "Media record restored.",
    usageSuccess: "Usage details loaded.",
    replaceSuccess: "File replacement completed.",
    gallerySuccess: "Gallery updated.",
    archiveConfirm: "Archive this media record? References will stay intact, but the item will move out of the active library.",
    operationsDescription: "Run upload, record management, replacement, and gallery sync workflows from one shared control surface.",
    uploadDescription: "Upload a new media asset and optionally attach title metadata before it enters the library.",
    crudTitle: "Media record tools",
    crudDescription: "Read, patch, archive, restore, or inspect how a media record is being used.",
    replaceDescription: "Replace an existing media file while preserving the current record and references.",
    galleryDescription: "Apply gallery payloads to property or project targets from the same workspace.",
    mediaListDescription: "Recent media assets with approval, rights, status, and quick-select actions.",
    searchLibrary: "Search library",
    searchLibraryPlaceholder: "Search by path, status, approval, or rights",
    selectedAsset: "Selected asset",
    selectedAssetDescription: "This record is ready for get, patch, archive, restore, usage, or replace actions.",
    queueForGallery: "Queue image",
    setAsCover: "Set cover",
    galleryBuilderTitle: "Gallery builder",
    galleryBuilderDescription: "Build the cover image and ordered gallery list from selected local assets before applying the existing gallery endpoint.",
    galleryBuilderHint: "Builder actions rewrite the JSON payload below so operators do not have to hand-order media paths.",
    galleryQueueEmpty: "No gallery assets queued yet. Use library actions to set a cover or add images.",
    clearGalleryBuilder: "Clear builder",
    moveUp: "Move up",
    moveDown: "Move down",
    remove: "Remove",
    selectedInRecord: "Selected in record tools",
    property: "property",
    project: "project",
    path: "Path",
    status: "Status",
    approval: "Approval",
    rights: "Rights",
    updated: "Updated",
    action: "Action",
    select: "Select",
    active: "Active",
    archived: "Archived",
    pending: "Pending",
    approved: "Approved",
    blocked: "Blocked",
    rejected: "Rejected",
    unknown: "Unknown",
    ready: "Ready",
    watch: "Watch",
    live: "Live",
    openDashboard: "Open dashboard",
    openSeo: "Open SEO",
    authWorkspaceHint: "Sign in first, then use this workspace to inspect integrity, fix one media record at a time, and confirm downstream effects in dashboard or SEO views.",
    sessionHint: "Use dashboard for health context, then return here to fix the exact media record, rights, or gallery action without losing session context.",
    listEmptyTitle: "No media records loaded yet",
    listEmptyBody: "Refresh the workspace or upload one asset, then use dashboard and SEO views to verify follow-on publishing effects.",
    searchEmptyTitle: "No media matched this search",
    searchEmptyBody: "Try another path, status, approval, or rights keyword to narrow the library.",
  },
  th: {
    eyebrow: "งานจัดการสื่อ",
    title: "Media Library",
    subtitle: "ค้นหาไฟล์ที่ถูกต้อง จัดการงานสื่อทีละอย่าง และยืนยันความสมบูรณ์จากหน้าเดียว",
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
    emptyHint: "รีเฟรชพื้นที่งานหรืออัปโหลดไฟล์ใหม่เพื่อเติมรายการ",
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
    patchJson: "ข้อมูลอัปเดตแบบ JSON",
    replaceFile: "ไฟล์ทดแทน",
    runPatch: "อัปเดตข้อมูล",
    runGet: "ดูข้อมูลสื่อ",
    runArchive: "เก็บเข้าคลัง",
    runRestore: "กู้คืน",
    runUsage: "ดูการใช้งาน",
    runReplace: "แทนที่ไฟล์",
    galleryOps: "ซิงก์แกลเลอรี",
    galleryTargetType: "ประเภทเป้าหมาย",
    galleryTargetId: "รหัสเป้าหมาย",
    galleryPayload: "ข้อมูลแกลเลอรีแบบ JSON",
    runGallery: "อัปเดตแกลเลอรี",
    result: "ผลลัพธ์",
    sessionActive: "เซสชันพร้อมใช้งาน",
    operationErrorHint: "ไม่สามารถดำเนินการคำสั่งสื่อนี้ได้ในขณะนี้",
    operationResultHint: "ตรวจผลลัพธ์นี้ก่อนเริ่มคำสั่งถัดไปกับรายการสื่อ",
    operationSuccessTitle: "จุดตรวจถัดไป",
    operationSuccessBody: "ใช้ dashboard และ SEO เพื่อตรวจว่าการเปลี่ยนแปลงสื่อล่าสุดไม่ทิ้งปัญหาเรื่องสิทธิ์ integrity หรือการเผยแพร่ไว้ด้านหลัง",
    selectionHint: "เลือกรายการให้ชัด สั่งงานทีละอย่าง แล้วตรวจผลลัพธ์ก่อนทำ archive แทนที่ไฟล์ หรือซิงก์แกลเลอรีต่อ",
    invalidPatchJson: "ข้อมูลอัปเดตต้องอยู่ในรูปแบบ JSON ที่ถูกต้อง",
    invalidGalleryPayload: "ข้อมูลแกลเลอรีต้องอยู่ในรูปแบบ JSON ที่ถูกต้อง",
    getSuccess: "โหลดข้อมูลรายการสื่อแล้ว",
    uploadSuccess: "อัปโหลดสำเร็จ",
    patchSuccess: "อัปเดตรายการสื่อแล้ว",
    archiveSuccess: "เก็บรายการสื่อเข้าคลังแล้ว",
    restoreSuccess: "กู้คืนรายการสื่อแล้ว",
    usageSuccess: "โหลดข้อมูลการใช้งานแล้ว",
    replaceSuccess: "แทนที่ไฟล์สำเร็จ",
    gallerySuccess: "อัปเดตแกลเลอรีแล้ว",
    archiveConfirm: "ต้องการเก็บรายการสื่อนี้เข้าคลังหรือไม่ รายการอ้างอิงจะยังอยู่ แต่สื่อนี้จะถูกย้ายออกจากคลังที่ใช้งานอยู่",
    operationsDescription: "สั่งงานอัปโหลด จัดการเรคอร์ด แทนที่ไฟล์ และซิงก์แกลเลอรีจากแผงควบคุมเดียว",
    uploadDescription: "อัปโหลดไฟล์สื่อใหม่ พร้อมใส่ชื่อหรือเมทาดาทาเบื้องต้นก่อนเข้าสู่คลังสื่อ",
    crudTitle: "เครื่องมือจัดการรายการสื่อ",
    crudDescription: "ดูข้อมูล อัปเดตรายการ เก็บเข้าคลัง กู้คืน และตรวจการใช้งานของรายการสื่อ",
    replaceDescription: "แทนที่ไฟล์สื่อเดิมโดยคงเรคอร์ดและการอ้างอิงเดิมไว้",
    galleryDescription: "ส่งเพย์โหลดแกลเลอรีไปยังทรัพย์หรือโครงการจากหน้าเดียวกัน",
    mediaListDescription: "รายการสื่อล่าสุด พร้อมสถานะการอนุมัติ สิทธิ์ และปุ่มเลือกใช้งานทันที",
    searchLibrary: "ค้นหาในคลังสื่อ",
    searchLibraryPlaceholder: "ค้นหาจากพาธ สถานะ การอนุมัติ หรือสิทธิ์",
    selectedAsset: "asset ที่เลือกอยู่",
    selectedAssetDescription: "รายการนี้พร้อมใช้กับคำสั่งดูข้อมูล อัปเดต เก็บเข้าคลัง กู้คืน ดูการใช้งาน หรือแทนที่ไฟล์",
    queueForGallery: "เพิ่มเข้า gallery",
    setAsCover: "ตั้งเป็นภาพปก",
    galleryBuilderTitle: "ตัวจัด gallery",
    galleryBuilderDescription: "ประกอบ cover image และลำดับรูปจาก asset โลคัลที่เลือกไว้ ก่อนส่งเข้า gallery endpoint เดิมของระบบ",
    galleryBuilderHint: "ทุก action ใน builder จะเขียน payload JSON ด้านล่างให้อัตโนมัติ เพื่อลดการจัดลำดับพาธด้วยมือ",
    galleryQueueEmpty: "ยังไม่มี asset ในคิว gallery ใช้ action จากรายการสื่อเพื่อกำหนดภาพปกหรือเพิ่มรูปก่อน",
    clearGalleryBuilder: "ล้างตัวจัด gallery",
    moveUp: "เลื่อนขึ้น",
    moveDown: "เลื่อนลง",
    remove: "นำออก",
    selectedInRecord: "เลือกแล้วในเครื่องมือ record",
    property: "ทรัพย์",
    project: "โครงการ",
    path: "พาธ",
    status: "สถานะ",
    approval: "การอนุมัติ",
    rights: "สิทธิ์",
    updated: "อัปเดตเมื่อ",
    action: "การทำงาน",
    select: "เลือก",
    active: "ใช้งานอยู่",
    archived: "เก็บเข้าคลัง",
    pending: "รอตรวจสอบ",
    approved: "อนุมัติแล้ว",
    blocked: "ถูกบล็อก",
    rejected: "ไม่อนุมัติ",
    unknown: "ไม่ทราบ",
    ready: "พร้อม",
    watch: "เฝ้าระวัง",
    live: "สด",
    openDashboard: "ดูแดชบอร์ด",
    openSeo: "ดู SEO",
    authWorkspaceHint: "เข้าสู่ระบบก่อน แล้วใช้หน้านี้ตรวจ integrity แก้รายการสื่อทีละจุด และย้อนไปดูผลต่อเนื่องใน dashboard หรือ SEO ได้ทันที",
    sessionHint: "ใช้แดชบอร์ดดูภาพรวมสุขภาพระบบก่อน แล้วกลับมาแก้รายการสื่อ สิทธิ์ หรือ gallery action ที่หน้านี้ต่อได้โดยไม่หลุดบริบท",
    listEmptyTitle: "ยังไม่มีรายการสื่อที่โหลดเข้ามา",
    listEmptyBody: "รีเฟรช workspace หรืออัปโหลดสื่อหนึ่งรายการก่อน แล้วใช้ dashboard และ SEO เพื่อตรวจผลต่อเนื่องก่อนเผยแพร่",
    searchEmptyTitle: "ไม่พบรายการสื่อตามคำค้นนี้",
    searchEmptyBody: "ลองเปลี่ยนคำค้นจากพาธ สถานะ การอนุมัติ หรือสิทธิ์ เพื่อกรองคลังสื่อใหม่",
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

function translateMediaValue(value: string | null | undefined, t: (typeof copy)[Locale]): string {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  const normalized = raw.toLowerCase();
  if (normalized === "active") return t.active;
  if (normalized === "archived") return t.archived;
  if (normalized === "pending") return t.pending;
  if (normalized === "pending_review") return t.pending;
  if (normalized === "approved") return t.approved;
  if (normalized === "blocked") return t.blocked;
  if (normalized === "restricted") return t.blocked;
  if (normalized === "exception_allowed") return t.ready;
  if (normalized === "rejected") return t.rejected;
  if (normalized === "unknown") return t.unknown;
  return raw;
}

function toMediaPath(value: string | null | undefined): string {
  return String(value || "").trim();
}

function toGalleryPayloadValue(coverImage: string | null, images: GallerySelectionItem[]): string {
  return JSON.stringify(
    {
      cover_image: coverImage,
      images: images.map((item) => item.storage_path),
    },
    null,
    2,
  );
}

export default function AdminMediaPage() {
  const [locale, setLocale] = useState<Locale>(() => detectLocale());
  const [activeTab, setActiveTab] = useState<"library" | "upload" | "record" | "gallery">("library");
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
  const [librarySearch, setLibrarySearch] = useState("");

  const [opBusy, setOpBusy] = useState(false);
  const [opError, setOpError] = useState<string | null>(null);
  const [opNotice, setOpNotice] = useState<string | null>(null);
  const [opResult, setOpResult] = useState<string>("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [mediaId, setMediaId] = useState("");
  const [patchJson, setPatchJson] = useState('{"title":"Updated title"}');
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [galleryTargetType, setGalleryTargetType] = useState<"property" | "project">("property");
  const [galleryTargetId, setGalleryTargetId] = useState("");
  const [galleryPayload, setGalleryPayload] = useState('{"cover_image": null, "images": []}');
  const [galleryCoverImage, setGalleryCoverImage] = useState<string | null>(null);
  const [gallerySelection, setGallerySelection] = useState<GallerySelectionItem[]>([]);

  useEffect(() => {
    setLocale(detectLocale());
    const session = readAuthSession();
    if (!session) return;
    setAuthToken(session.token);
    setAuthEmail(session.email);
  }, []);

  const t = copy[locale];
  const isAuthenticated = authToken.trim().length > 0;
  const filteredItems = useMemo(() => {
    const keyword = librarySearch.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => {
      const candidates = [item.id, item.storage_path, item.status, item.approval_status, item.rights_status]
        .map((value) => String(value || "").trim().toLowerCase())
        .filter(Boolean);
      return candidates.some((value) => value.includes(keyword));
    });
  }, [items, librarySearch]);
  const selectedMediaRecord = useMemo(
    () => items.find((item) => item.id === mediaId.trim()) || null,
    [items, mediaId],
  );

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
    setOpNotice(null);
    setOpResult("");
  }

  function parseJsonObject(value: string, invalidMessage: string): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("invalid_json_shape");
      }
      return parsed as Record<string, unknown>;
    } catch {
      setOpError(invalidMessage);
      return null;
    }
  }

  async function runAction(action: () => Promise<unknown>, options?: { successMessage?: string; onSuccess?: () => void }) {
    setOpBusy(true);
    setOpError(null);
    setOpNotice(null);
    try {
      const result = await action();
      setOpResult(toPrettyJson(result));
      if (options?.successMessage) setOpNotice(options.successMessage);
      options?.onSuccess?.();
      await loadWorkspace();
    } catch (error) {
      setOpError(formatWorkspaceErrorMessage(error, t.operationErrorHint));
    } finally {
      setOpBusy(false);
    }
  }

  const brokenCount =
    Number(integrity?.missing_file_count || 0) +
    Number(integrity?.checksum_mismatch_count || 0) +
    Number(integrity?.invalid_path_format_count || 0) +
    Number(integrity?.empty_file_count || 0);

  async function runUploadAction() {
    if (!uploadFile) return;
    await runAction(async () => {
      const formData = new FormData();
      formData.set("file", uploadFile as File);
      if (uploadTitle.trim()) formData.set("title", uploadTitle.trim());
      return fetchJson("/admin/media/upload", authToken, {
        method: "POST",
        body: formData,
      });
    }, {
      successMessage: t.uploadSuccess,
      onSuccess: () => {
        setUploadFile(null);
        setUploadTitle("");
      },
    });
  }

  function updateGalleryComposer(nextCoverImage: string | null, nextImages: GallerySelectionItem[]) {
    setGalleryCoverImage(nextCoverImage);
    setGallerySelection(nextImages);
    setGalleryPayload(toGalleryPayloadValue(nextCoverImage, nextImages));
  }

  function selectMediaRecordForActions(item: MediaItem) {
    setMediaId(item.id);
    setOpError(null);
    setOpNotice(null);
  }

  function queueGalleryImage(item: MediaItem) {
    const storagePath = toMediaPath(item.storage_path);
    if (!storagePath) return;
    const existing = gallerySelection.find((entry) => entry.storage_path === storagePath);
    if (existing) {
      setActiveTab("gallery");
      return;
    }
    updateGalleryComposer(galleryCoverImage, [...gallerySelection, { id: item.id, storage_path: storagePath }]);
    setActiveTab("gallery");
  }

  function setGalleryCover(item: MediaItem) {
    const storagePath = toMediaPath(item.storage_path);
    if (!storagePath) return;
    const nextImages = gallerySelection.some((entry) => entry.storage_path === storagePath)
      ? gallerySelection
      : [...gallerySelection, { id: item.id, storage_path: storagePath }];
    updateGalleryComposer(storagePath, nextImages);
    setActiveTab("gallery");
  }

  function moveGalleryImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= gallerySelection.length) return;
    const nextImages = [...gallerySelection];
    const [moved] = nextImages.splice(index, 1);
    nextImages.splice(nextIndex, 0, moved);
    updateGalleryComposer(galleryCoverImage, nextImages);
  }

  function removeGalleryImage(storagePath: string) {
    const nextImages = gallerySelection.filter((entry) => entry.storage_path !== storagePath);
    const nextCoverImage = galleryCoverImage === storagePath ? null : galleryCoverImage;
    updateGalleryComposer(nextCoverImage, nextImages);
  }

  function clearGalleryComposer() {
    updateGalleryComposer(null, []);
  }

  async function runGetAction() {
    if (!mediaId.trim()) return;
    await runAction(() => fetchJson(`/admin/media/${mediaId.trim()}`, authToken), {
      successMessage: t.getSuccess,
    });
  }

  async function runPatchAction() {
    if (!mediaId.trim()) return;
    const parsedPatch = parseJsonObject(patchJson, t.invalidPatchJson);
    if (!parsedPatch) return;
    await runAction(
      () =>
        fetchJson(`/admin/media/${mediaId.trim()}`, authToken, {
          method: "PATCH",
          body: JSON.stringify(parsedPatch),
          headers: { "content-type": "application/json" },
        }),
      { successMessage: t.patchSuccess },
    );
  }

  async function runArchiveAction() {
    if (!mediaId.trim()) return;
    if (!confirmAction(t.archiveConfirm)) return;
    await runAction(
      () =>
        fetchJson(`/admin/media/${mediaId.trim()}/archive?block_if_used=false`, authToken, {
          method: "POST",
        }),
      { successMessage: t.archiveSuccess },
    );
  }

  async function runRestoreAction() {
    if (!mediaId.trim()) return;
    await runAction(
      () =>
        fetchJson(`/admin/media/${mediaId.trim()}/restore`, authToken, {
          method: "POST",
        }),
      { successMessage: t.restoreSuccess },
    );
  }

  async function runUsageAction() {
    if (!mediaId.trim()) return;
    await runAction(() => fetchJson(`/admin/media/${mediaId.trim()}/usage`, authToken), {
      successMessage: t.usageSuccess,
    });
  }

  async function runReplaceAction() {
    if (!mediaId.trim() || !replaceFile) return;
    await runAction(async () => {
      const formData = new FormData();
      formData.set("file", replaceFile as File);
      return fetchJson(`/admin/media/${mediaId.trim()}/replace`, authToken, {
        method: "POST",
        body: formData,
      });
    }, {
      successMessage: t.replaceSuccess,
      onSuccess: () => {
        setReplaceFile(null);
      },
    });
  }

  async function runGalleryAction() {
    if (!galleryTargetId.trim()) return;
    const payload = parseJsonObject(galleryPayload, t.invalidGalleryPayload);
    if (!payload) return;
    await runAction(() => {
      const base =
        galleryTargetType === "project"
          ? `/admin/media/projects/${galleryTargetId.trim()}/gallery`
          : `/admin/media/properties/${galleryTargetId.trim()}/gallery`;
      return fetchJson(base, authToken, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    }, { successMessage: t.gallerySuccess });
  }

  function confirmAction(message: string): boolean {
    if (typeof window === "undefined") return true;
    return window.confirm(message);
  }

  const stickyPrimaryAction =
    activeTab === "upload"
      ? { label: t.upload, onClick: () => void runUploadAction() }
      : activeTab === "record"
        ? { label: t.runPatch, onClick: () => void runPatchAction() }
      : activeTab === "gallery"
          ? { label: t.runGallery, onClick: () => void runGalleryAction() }
          : { label: t.refresh, onClick: () => void loadWorkspace() };
  const stickySecondaryActions =
    activeTab === "library"
      ? [{ label: t.signOut, onClick: logout, disabled: loading || opBusy }]
      : [
          { label: t.refresh, onClick: () => void loadWorkspace(), disabled: !isAuthenticated || loading || opBusy },
          { label: t.signOut, onClick: logout, disabled: loading || opBusy },
        ];

  return (
    <main id="main-content" className="container content-stack admin-media-library-page">
      <AdminPageHeader title={t.title} description={t.subtitle} icon="media" eyebrow={t.eyebrow} />
      <AdminAccessGate
        className="admin-media-library-access-gate"
        isAuthenticated={isAuthenticated}
        authTitle={t.loginTitle}
        authDescription={t.loginSubtitle}
        sessionTitle={authEmail || t.sessionTitle}
        sessionDescription={t.sessionDescription}
        authContent={
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
            <div className="state-empty admin-workspace-empty-state" role="status">
              <strong>{t.authRequired}</strong>
              <p className="locale-safe">{t.authWorkspaceHint}</p>
            </div>
          </form>
        }
      >
        <AdminPrimaryActionBar
          title={t.title}
          description={t.subtitle}
          primaryAction={{ ...stickyPrimaryAction, disabled: !isAuthenticated || opBusy || loading || (activeTab === "upload" ? !uploadFile : activeTab === "record" ? !mediaId.trim() : activeTab === "gallery" ? !galleryTargetId.trim() : false) }}
          secondaryActions={stickySecondaryActions}
          meta={<AdminBadge tone="info">{prettyDate(integrity?.scanned_at || null, locale)}</AdminBadge>}
          mobileBottom
        />
        <AdminSectionTabs
          activeTab={activeTab}
          onChange={(key) => setActiveTab(key as "library" | "upload" | "record" | "gallery")}
          tabs={[
            { key: "library", label: t.mediaList, count: items.length },
            { key: "upload", label: t.upload },
            { key: "record", label: t.crudTitle },
            { key: "gallery", label: t.galleryOps },
          ]}
        />

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
            <AdminStatCard
              label={t.broken}
              value={brokenCount}
              detail={`${translateMediaValue(integrity?.missing_file_count ? "blocked" : "approved", t)} · ${t.errors} ${Number(integrity?.error_count || 0)}`}
              badgeLabel={t.watch}
              icon="warning"
              tone="warn"
            />
            <AdminStatCard
              label={t.leakage}
              value={Number(integrity?.external_leakage_count || 0)}
              detail={`${t.scannedAt}: ${prettyDate(integrity?.scanned_at || null, locale)}`}
              badgeLabel={t.ready}
              icon="globe"
              tone="neutral"
            />
            <AdminStatCard
              label={t.errors}
              value={Number(integrity?.error_count || 0)}
              detail={`${t.broken}: ${brokenCount}`}
              badgeLabel={t.blocked}
              icon="x"
              tone="error"
            />
            <AdminStatCard
              label={t.warnings}
              value={Number(integrity?.warn_count || 0)}
              detail={`${t.leakage}: ${Number(integrity?.external_leakage_count || 0)}`}
              badgeLabel={t.live}
              icon="info"
              tone="info"
            />
          </section>

          {activeTab === "upload" || activeTab === "record" || activeTab === "gallery" ? (
          <AdminSectionCard
            className="admin-workspace-panel admin-workspace-panel--actions admin-workspace-panel--media-actions"
            title={t.operations}
            description={t.operationsDescription}
            icon="media"
          >
            <p className="admin-input__hint">{t.selectionHint}</p>
            <div className="admin-workspace-action-grid admin-workspace-action-grid--media">
              <ActionCard title={t.upload} description={t.uploadDescription} icon="plus">
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
                  onClick={() => void runUploadAction()}
                >
                  {t.upload}
                </AdminButton>
              </ActionCard>

              <ActionCard title={t.crudTitle} description={t.crudDescription} icon="refresh">
                {selectedMediaRecord ? (
                  <div className="admin-workspace-prerequisite admin-media-selection-card">
                    <strong>{t.selectedAsset}</strong>
                    <p className="locale-safe">{t.selectedAssetDescription}</p>
                    <div className="admin-workspace-inline-metrics">
                      <AdminBadge tone="info">{selectedMediaRecord.storage_path || selectedMediaRecord.id}</AdminBadge>
                      <AdminBadge tone="neutral">{t.selectedInRecord}</AdminBadge>
                    </div>
                  </div>
                ) : null}
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
                    rows={5}
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
                    onClick={() => void runGetAction()}
                  >
                    {t.runGet}
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    icon="refresh"
                    type="button"
                    disabled={opBusy || !mediaId.trim()}
                    onClick={() => void runPatchAction()}
                  >
                    {t.runPatch}
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    icon="warning"
                    type="button"
                    disabled={opBusy || !mediaId.trim()}
                    onClick={() => void runArchiveAction()}
                  >
                    {t.runArchive}
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    icon="success"
                    type="button"
                    disabled={opBusy || !mediaId.trim()}
                    onClick={() => void runRestoreAction()}
                  >
                    {t.runRestore}
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    icon="table"
                    type="button"
                    disabled={opBusy || !mediaId.trim()}
                    onClick={() => void runUsageAction()}
                  >
                    {t.runUsage}
                  </AdminButton>
                </div>
              </ActionCard>

              <ActionCard title={t.runReplace} description={t.replaceDescription} icon="refresh">
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
                  onClick={() => void runReplaceAction()}
                >
                  {t.runReplace}
                </AdminButton>
              </ActionCard>

              <ActionCard title={t.galleryOps} description={t.galleryDescription} icon="media">
                <div className="admin-workspace-prerequisite admin-media-gallery-builder">
                  <strong>{t.galleryBuilderTitle}</strong>
                  <p className="locale-safe">{t.galleryBuilderDescription}</p>
                  <p className="admin-input__hint">{t.galleryBuilderHint}</p>
                  <div className="admin-workspace-inline-metrics">
                    <AdminBadge tone={galleryCoverImage ? "ok" : "neutral"}>
                      {t.setAsCover}: {galleryCoverImage || "-"}
                    </AdminBadge>
                    <AdminBadge tone={gallerySelection.length > 0 ? "info" : "neutral"}>
                      {t.queueForGallery}: {gallerySelection.length}
                    </AdminBadge>
                  </div>
                  {gallerySelection.length > 0 ? (
                    <ol className="admin-media-gallery-queue">
                      {gallerySelection.map((item, index) => (
                        <li key={`${item.id}-${item.storage_path}`} className="admin-media-gallery-queue__item">
                          <div className="admin-media-gallery-queue__copy">
                            <strong>{index + 1}. {item.storage_path}</strong>
                            {galleryCoverImage === item.storage_path ? <span>{t.setAsCover}</span> : null}
                          </div>
                          <div className="card-actions">
                            <AdminButton variant="secondary" size="sm" type="button" disabled={index === 0} onClick={() => moveGalleryImage(index, -1)}>
                              {t.moveUp}
                            </AdminButton>
                            <AdminButton variant="secondary" size="sm" type="button" disabled={index === gallerySelection.length - 1} onClick={() => moveGalleryImage(index, 1)}>
                              {t.moveDown}
                            </AdminButton>
                            <AdminButton variant="secondary" size="sm" type="button" onClick={() => removeGalleryImage(item.storage_path)}>
                              {t.remove}
                            </AdminButton>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="state-empty admin-workspace-empty-state">{t.galleryQueueEmpty}</div>
                  )}
                  <div className="card-actions">
                    <AdminButton variant="secondary" size="sm" type="button" disabled={!gallerySelection.length && !galleryCoverImage} onClick={clearGalleryComposer}>
                      {t.clearGalleryBuilder}
                    </AdminButton>
                  </div>
                </div>
                <label className="field" htmlFor="gallery-target-type">
                  <span>{t.galleryTargetType}</span>
                  <select
                    id="gallery-target-type"
                    value={galleryTargetType}
                    onChange={(event) =>
                      setGalleryTargetType(event.target.value === "project" ? "project" : "property")
                    }
                  >
                    <option value="property">{t.property}</option>
                    <option value="project">{t.project}</option>
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
                    rows={5}
                    value={galleryPayload}
                    onChange={(event) => setGalleryPayload(event.target.value)}
                  />
                </label>
                <AdminButton
                  variant="secondary"
                  icon="media"
                  type="button"
                  disabled={opBusy || !galleryTargetId.trim()}
                  onClick={() => void runGalleryAction()}
                >
                  {t.runGallery}
                </AdminButton>
              </ActionCard>
            </div>

            <div className="admin-workspace-result-stack">
              {opError ? <div className="state-error">{opError}</div> : null}
              {opNotice ? <div className="state-success">{opNotice}</div> : null}
              <label className="field admin-workspace-result-field" htmlFor="media-op-result">
                <span>{t.result}</span>
                <textarea id="media-op-result" rows={opResult ? 6 : 2} value={opResult} readOnly />
              </label>
              <p className="admin-input__hint">{t.operationResultHint}</p>
              {opNotice ? (
                <div className="admin-workspace-success-handoff" role="status">
                  <strong>{t.operationSuccessTitle}</strong>
                  <p className="locale-safe">{t.operationSuccessBody}</p>
                  <div className="card-actions">
                    <Link className="admin-button admin-button--secondary admin-button--sm" href={withAdminLocale("/admin/dashboard", locale)}>
                      {t.openDashboard}
                    </Link>
                    <Link className="admin-button admin-button--secondary admin-button--sm" href={withAdminLocale("/admin/seo", locale)}>
                      {t.openSeo}
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </AdminSectionCard>
          ) : null}

          {activeTab === "library" ? (
          <LogCard
            className="admin-workspace-panel admin-workspace-panel--records"
            bodyClassName="admin-workspace-log-body"
            title={t.mediaList}
            description={t.mediaListDescription}
            icon="table"
            titleTag="h2"
          >
            <label className="field" htmlFor="media-library-search">
              <span>{t.searchLibrary}</span>
              <input
                id="media-library-search"
                type="search"
                placeholder={t.searchLibraryPlaceholder}
                value={librarySearch}
                onChange={(event) => setLibrarySearch(event.target.value)}
              />
            </label>
            {filteredItems.length === 0 ? (
              <div className="state-empty admin-workspace-empty-state" role="status">
                <strong>{items.length === 0 ? t.listEmptyTitle : t.searchEmptyTitle}</strong>
                <p className="locale-safe">{items.length === 0 ? t.listEmptyBody : t.searchEmptyBody}</p>
                <div className="card-actions">
                  <Link className="admin-button admin-button--secondary admin-button--sm" href={withAdminLocale("/admin/dashboard", locale)}>
                    {t.openDashboard}
                  </Link>
                  <Link className="admin-button admin-button--secondary admin-button--sm" href={withAdminLocale("/admin/seo", locale)}>
                    {t.openSeo}
                  </Link>
                </div>
              </div>
            ) : (
              <AdminResponsiveList
                desktop={(
                  <AdminTable caption={t.mediaList}>
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>{t.path}</th>
                          <th>{t.status}</th>
                          <th>{t.approval}</th>
                          <th>{t.rights}</th>
                          <th>{t.updated}</th>
                          <th>{t.action}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map((item) => (
                          <tr key={item.id}>
                            <td>{item.storage_path || "-"}</td>
                            <td>{translateMediaValue(item.status, t)}</td>
                            <td>{translateMediaValue(item.approval_status, t)}</td>
                            <td>{translateMediaValue(item.rights_status, t)}</td>
                            <td>{prettyDate(item.updated_at, locale)}</td>
                            <td>
                              <div className="card-actions">
                                <AdminButton variant="secondary" size="sm" icon="search" type="button" onClick={() => selectMediaRecordForActions(item)}>
                                  {t.select}
                                </AdminButton>
                                <AdminButton variant="secondary" size="sm" type="button" onClick={() => setGalleryCover(item)}>
                                  {t.setAsCover}
                                </AdminButton>
                                <AdminButton variant="secondary" size="sm" type="button" onClick={() => queueGalleryImage(item)}>
                                  {t.queueForGallery}
                                </AdminButton>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </AdminTable>
                )}
                mobile={(
                  <div className="admin-mobile-record-list" aria-label={t.mediaList}>
                    {filteredItems.map((item) => (
                      <article key={item.id} className="dashboard-table-card admin-mobile-record-card">
                        <div className="dashboard-table-card-head">
                          <div>
                            <h3 className="dashboard-table-card-name">{item.storage_path || "-"}</h3>
                            <p>{prettyDate(item.updated_at, locale)}</p>
                          </div>
                          <AdminButton variant="secondary" size="sm" icon="search" type="button" onClick={() => selectMediaRecordForActions(item)}>
                            {t.select}
                          </AdminButton>
                        </div>
                        <div className="dashboard-table-card-meta admin-mobile-record-card__meta">
                          <div>
                            <span>{t.status}</span>
                            <strong>{translateMediaValue(item.status, t)}</strong>
                          </div>
                          <div>
                            <span>{t.approval}</span>
                            <strong>{translateMediaValue(item.approval_status, t)}</strong>
                          </div>
                          <div>
                            <span>{t.rights}</span>
                            <strong>{translateMediaValue(item.rights_status, t)}</strong>
                          </div>
                        </div>
                        <div className="card-actions">
                          <AdminButton variant="secondary" size="sm" type="button" onClick={() => setGalleryCover(item)}>
                            {t.setAsCover}
                          </AdminButton>
                          <AdminButton variant="secondary" size="sm" type="button" onClick={() => queueGalleryImage(item)}>
                            {t.queueForGallery}
                          </AdminButton>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              />
            )}
          </LogCard>
          ) : null}
        </>
      ) : null}
      </AdminAccessGate>
    </main>
  );
}
