"use client";

import { useCallback, useEffect, useState } from "react";

import { clearAuthSession, loginAdmin, persistAuthSession, readAuthSession } from "@/app/_lib/admin-auth";

export type AdminAuthErrorCode =
  | "missing_credentials"
  | "invalid_credentials"
  | "login_failed"
  | "protocol_error";

export type AdminSessionState = {
  token: string;
  email: string;
};

export type AdminLoginSuccess = {
  ok: true;
  accessToken: string;
  email: string;
};

export type AdminLoginFailure = {
  ok: false;
  code: AdminAuthErrorCode;
};

export type AdminLoginAttemptResult = AdminLoginSuccess | AdminLoginFailure;

function normalizeAuthErrorCode(status: number): AdminAuthErrorCode {
  if (status === 401) return "invalid_credentials";
  if (status === 0) return "protocol_error";
  return "login_failed";
}

export function useAdminAuthController() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authErrorCode, setAuthErrorCode] = useState<AdminAuthErrorCode | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    const session = readAuthSession();
    if (session) {
      setToken(session.token);
      setEmail(session.email);
    }
    setSessionLoading(false);
  }, []);

  const persistSession = useCallback((nextToken: string, nextEmail: string) => {
    const normalizedToken = nextToken.trim();
    const normalizedEmail = nextEmail.trim();

    if (!normalizedToken) {
      clearAuthSession();
      setToken("");
      setEmail("");
      return;
    }

    persistAuthSession(normalizedToken, normalizedEmail);
    setToken(normalizedToken);
    setEmail(normalizedEmail);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthErrorCode(null);
  }, []);

  const login = useCallback(async ({ email: loginEmail, password }: { email: string; password: string }) => {
    const normalizedEmail = loginEmail.trim();
    if (!normalizedEmail || !password) {
      setAuthErrorCode("missing_credentials");
      return { ok: false, code: "missing_credentials" } satisfies AdminLoginFailure;
    }

    setAuthLoading(true);
    setAuthErrorCode(null);
    try {
      const result = await loginAdmin(normalizedEmail, password);
      if (!result.ok) {
        const code = normalizeAuthErrorCode(result.status);
        setAuthErrorCode(code);
        return { ok: false, code } satisfies AdminLoginFailure;
      }

      persistSession(result.accessToken, normalizedEmail);
      return {
        ok: true,
        accessToken: result.accessToken,
        email: normalizedEmail,
      } satisfies AdminLoginSuccess;
    } catch {
      setAuthErrorCode("login_failed");
      return { ok: false, code: "login_failed" } satisfies AdminLoginFailure;
    } finally {
      setAuthLoading(false);
    }
  }, [persistSession]);

  const logout = useCallback(() => {
    clearAuthSession();
    setToken("");
    setEmail("");
    setAuthErrorCode(null);
  }, []);

  return {
    token,
    email,
    authLoading,
    authErrorCode,
    sessionLoading,
    isAuthenticated: token.trim().length > 0,
    setAuthErrorCode,
    clearAuthError,
    persistSession,
    login,
    logout,
  };
}
