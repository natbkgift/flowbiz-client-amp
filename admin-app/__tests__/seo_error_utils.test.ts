import { describe, expect, it } from "vitest";

import {
  formatSeoApiError,
  isProbablyHtmlPayload,
  normalizeApiErrorDetail,
  readRequestFailedStatus,
} from "@/app/admin/seo/error-utils";

describe("SEO error utils", () => {
  it("detects HTML payloads and replaces with safe fallback", () => {
    const error = new Error("request_failed:404:<!doctype html><html><body>Not found</body></html>");
    const message = formatSeoApiError(error);
    expect(isProbablyHtmlPayload("<html><body>bad</body></html>")).toBe(true);
    expect(message).toBe("The server returned an unreadable error response. Please retry.");
    expect(message).not.toContain("<html");
  });

  it("extracts request_failed status code when available", () => {
    expect(readRequestFailedStatus(new Error("request_failed:404:oops"))).toBe(404);
    expect(readRequestFailedStatus(new Error("other_error"))).toBeNull();
  });

  it("normalizes and truncates long plain-text details", () => {
    const raw = `something went wrong ${"x".repeat(400)}`;
    const normalized = normalizeApiErrorDetail(raw);
    expect(normalized.length).toBeLessThanOrEqual(240);
    expect(normalized.endsWith("...")).toBe(true);
  });

  it("keeps non-request_failed plain errors readable", () => {
    const message = formatSeoApiError(new Error("network timeout"));
    expect(message).toBe("network timeout");
  });
});
