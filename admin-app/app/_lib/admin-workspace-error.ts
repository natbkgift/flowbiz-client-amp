const GENERIC_WORKSPACE_ERROR = "Request failed. Please retry.";
const HTML_WORKSPACE_ERROR = "The server returned an unreadable error response. Please retry.";

const REQUEST_FAILED_PATTERN = /^request_failed:(\d{3})(?::([\s\S]*))?$/i;

export function isLikelyHtmlPayload(input: string): boolean {
  const source = input.trim().toLowerCase();
  if (!source) return false;
  return source.startsWith("<!doctype html") || source.startsWith("<html") || source.includes("<body");
}

export function normalizeWorkspaceErrorDetail(input: string): string {
  const collapsed = input.replace(/\s+/g, " ").trim();
  if (!collapsed) return "";
  if (isLikelyHtmlPayload(collapsed)) return HTML_WORKSPACE_ERROR;
  const sanitized = collapsed.replace(/[<>]/g, "");
  if (!sanitized) return "";
  const maxLen = 220;
  if (sanitized.length <= maxLen) return sanitized;
  return `${sanitized.slice(0, maxLen - 3)}...`;
}

export function formatWorkspaceErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback || GENERIC_WORKSPACE_ERROR;
  const raw = String(error.message || "").trim();
  if (!raw) return fallback || GENERIC_WORKSPACE_ERROR;

  const requestMatch = raw.match(REQUEST_FAILED_PATTERN);
  if (requestMatch) {
    const status = requestMatch[1];
    const detail = normalizeWorkspaceErrorDetail(requestMatch[2] || "");
    if (detail) return `HTTP ${status}: ${detail}`;
    return `HTTP ${status}: ${fallback || GENERIC_WORKSPACE_ERROR}`;
  }

  const detail = normalizeWorkspaceErrorDetail(raw);
  return detail || fallback || GENERIC_WORKSPACE_ERROR;
}
