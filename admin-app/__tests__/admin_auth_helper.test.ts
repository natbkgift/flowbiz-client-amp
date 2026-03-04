import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchJson, loginAdmin, persistAuthSession, readAuthSession } from "@/app/_lib/admin-auth";

describe("admin auth helper", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("returns 401 status for invalid credentials", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("unauthorized", { status: 401 })
    );

    await expect(loginAdmin("bad@example.com", "bad-password")).resolves.toEqual({
      ok: false,
      status: 401,
    });
  });

  it("returns token and persists session for valid credentials", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ access_token: "token-123", token_type: "bearer" }), { status: 200 })
    );

    const result = await loginAdmin("admin@example.com", "valid-password");
    expect(result).toEqual({ ok: true, accessToken: "token-123" });

    if (result.ok) {
      persistAuthSession(result.accessToken, "admin@example.com");
    }

    expect(readAuthSession()).toEqual({ token: "token-123", email: "admin@example.com" });
  });

  it("uses bearer token when calling admin APIs", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    await fetchJson<{ ok: boolean }>("/admin/dashboard/health-summary", "token-xyz");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/admin/dashboard/health-summary",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.any(Headers),
      })
    );
    const [, init] = fetchSpy.mock.calls[0];
    const authHeader = new Headers(init?.headers).get("Authorization");
    expect(authHeader).toBe("Bearer token-xyz");
  });
});
