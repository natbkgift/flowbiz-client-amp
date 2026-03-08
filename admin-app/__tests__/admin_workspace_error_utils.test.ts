import { describe, expect, it } from "vitest";

import {
  formatWorkspaceErrorMessage,
  isLikelyHtmlPayload,
  normalizeWorkspaceErrorDetail,
} from "@/app/_lib/admin-workspace-error";

describe("admin workspace error utils", () => {
  it("detects and sanitizes HTML payloads", () => {
    const html = "<!doctype html><html><body>not found</body></html>";
    expect(isLikelyHtmlPayload(html)).toBe(true);
    expect(normalizeWorkspaceErrorDetail(html)).toBe(
      "The server returned an unreadable error response. Please retry.",
    );
  });

  it("formats request_failed errors with status code and safe detail", () => {
    const error = new Error("request_failed:404:resource missing");
    expect(formatWorkspaceErrorMessage(error, "fallback")).toBe("HTTP 404: resource missing");
  });

  it("uses fallback when no safe detail can be extracted", () => {
    const error = new Error("request_failed:500:");
    expect(formatWorkspaceErrorMessage(error, "Please retry now.")).toBe("HTTP 500: Please retry now.");
  });
});
