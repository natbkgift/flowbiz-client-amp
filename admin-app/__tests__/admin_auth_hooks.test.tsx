import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AUTH_SESSION_STORAGE_KEY, readAuthSession } from "@/app/_lib/admin-auth";
import { useAdminAuthController } from "@/app/_lib/admin-auth-hooks";

describe("admin auth hooks", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("restores the persisted admin session on mount", async () => {
    window.sessionStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({ token: "token-123", email: "admin@example.com" })
    );

    const { result } = renderHook(() => useAdminAuthController());

    await waitFor(() => {
      expect(result.current.sessionLoading).toBe(false);
    });

    expect(result.current.token).toBe("token-123");
    expect(result.current.email).toBe("admin@example.com");
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("maps invalid credentials to a structured auth error code", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("unauthorized", { status: 401 }));

    const { result } = renderHook(() => useAdminAuthController());
    let loginResult:
      | Awaited<ReturnType<typeof result.current.login>>
      | undefined;

    await act(async () => {
      loginResult = await result.current.login({
        email: "admin@example.com",
        password: "bad-password",
      });
    });

    expect(loginResult).toEqual({ ok: false, code: "invalid_credentials" });
    expect(result.current.authErrorCode).toBe("invalid_credentials");
    expect(result.current.authLoading).toBe(false);
  });

  it("persists successful login sessions and clears them on logout", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ access_token: "token-456", token_type: "bearer" }), { status: 200 })
    );

    const { result } = renderHook(() => useAdminAuthController());

    await act(async () => {
      await result.current.login({
        email: "admin@example.com",
        password: "valid-password",
      });
    });

    expect(readAuthSession()).toEqual({ token: "token-456", email: "admin@example.com" });
    expect(result.current.token).toBe("token-456");
    expect(result.current.email).toBe("admin@example.com");

    act(() => {
      result.current.logout();
    });

    expect(readAuthSession()).toBeNull();
    expect(result.current.token).toBe("");
    expect(result.current.email).toBe("");
    expect(result.current.isAuthenticated).toBe(false);
  });
});
