import { type InquiryFilters, type InquiryLocale } from "@/components/admin/domain/crm/inquiries-types";

export const FOLLOW_UP_STATUSES = ["pending", "scheduled", "completed", "no_response"] as const;
export const CRM_STATUSES = ["new", "contacted", "qualified", "closed", "lost"] as const;
export const SAVED_FILTERS_STORAGE_KEY = "flowbiz_crm_saved_filters_v1";
export const MAX_SAVED_FILTERS = 10;

export function buildQuery(filters: InquiryFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    const normalized = value.trim();
    if (normalized) params.set(key, normalized);
  }
  params.set("page", "1");
  params.set("limit", "50");
  params.set("sort", "created_at");
  params.set("order", "desc");
  return params.toString();
}

export function toLocalInputDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  const local = new Date(date.getTime() - tzOffsetMs);
  return local.toISOString().slice(0, 16);
}

export function prettyDate(value: string | null, locale: InquiryLocale): string {
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

export function readRoleFromToken(token: string): string {
  const value = token.trim();
  if (!value || typeof window === "undefined") return "admin";
  const chunks = value.split(".");
  if (chunks.length < 2) return "admin";
  try {
    const normalized = chunks[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const payload = JSON.parse(window.atob(padded)) as { role?: unknown };
    const role = typeof payload.role === "string" ? payload.role.trim() : "";
    return role || "admin";
  } catch {
    return "admin";
  }
}

export function savedFiltersKey(role: string): string {
  return `${SAVED_FILTERS_STORAGE_KEY}:${role}`;
}

export function dueClass(dueAt: string | null): string {
  if (!dueAt) return "crm-chip-muted";
  const due = new Date(dueAt).getTime();
  if (!Number.isFinite(due)) return "crm-chip-muted";
  const now = Date.now();
  return due < now ? "crm-chip-warn" : "crm-chip-sla";
}

export function statusIndex(status: string): number {
  return CRM_STATUSES.findIndex((value) => value === status);
}

export function translateInquiryStatus(value: string | null | undefined, locale: InquiryLocale): string {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  const normalized = raw.toLowerCase();
  if (locale === "th") {
    if (normalized === "new") return "ใหม่";
    if (normalized === "contacted") return "ติดต่อแล้ว";
    if (normalized === "qualified") return "ผ่านการคัดกรอง";
    if (normalized === "closed") return "ปิดงานแล้ว";
    if (normalized === "lost") return "หลุดไปแล้ว";
  }
  return raw.replace(/_/g, " ");
}

export function translateFollowUpStatus(value: string | null | undefined, locale: InquiryLocale): string {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  const normalized = raw.toLowerCase();
  if (locale === "th") {
    if (normalized === "pending") return "รอติดตาม";
    if (normalized === "scheduled") return "นัดหมายแล้ว";
    if (normalized === "completed") return "ติดตามแล้ว";
    if (normalized === "no_response") return "ยังไม่ตอบกลับ";
  }
  return raw.replace(/_/g, " ");
}
