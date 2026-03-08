const GENERIC_ERROR_MESSAGE = "Request failed. Please retry.";
const HTML_ERROR_FALLBACK = "The server returned an unreadable error response. Please retry.";
const NOT_FOUND_FALLBACK = "Requested data is unavailable right now. Please retry.";
const SERVER_FALLBACK = "Server error. Please retry.";
const MAX_DETAIL_LENGTH = 240;

export function readRequestFailedStatus(error: unknown): number | null {
  if (!(error instanceof Error)) return null;
  if (!error.message.startsWith("request_failed:")) return null;
  const parts = error.message.split(":");
  const status = Number.parseInt(parts[1] ?? "", 10);
  if (!Number.isFinite(status)) return null;
  return status;
}

export function isProbablyHtmlPayload(value: string): boolean {
  const text = value.trim();
  if (!text) return false;
  return /<\s*!doctype\s+html/i.test(text) || /<\s*(html|head|body|script|style)\b/i.test(text);
}

export function normalizeApiErrorDetail(raw: string): string {
  const collapsed = raw.replace(/\0/g, "").replace(/\s+/g, " ").trim();
  if (!collapsed) return "";
  if (isProbablyHtmlPayload(collapsed)) return HTML_ERROR_FALLBACK;
  if (collapsed.length <= MAX_DETAIL_LENGTH) return collapsed;
  return `${collapsed.slice(0, MAX_DETAIL_LENGTH - 3)}...`;
}

export function formatSeoApiError(error: unknown): string {
  if (!(error instanceof Error)) return GENERIC_ERROR_MESSAGE;
  const status = readRequestFailedStatus(error);

  if (status === null) {
    return normalizeApiErrorDetail(error.message) || GENERIC_ERROR_MESSAGE;
  }

  const detail = normalizeApiErrorDetail(error.message.split(":").slice(2).join(":"));
  if (detail) return detail;
  if (status === 404) return NOT_FOUND_FALLBACK;
  if (status >= 500) return SERVER_FALLBACK;
  return GENERIC_ERROR_MESSAGE;
}
