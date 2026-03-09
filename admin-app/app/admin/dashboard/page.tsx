"use client";

import { type FormEvent, useEffect, useState } from "react";

import { type AdminAuthErrorCode, useAdminAuthController } from "@/app/_lib/admin-auth-hooks";
import { detectAdminLocale, type AdminLocale } from "@/app/_lib/admin-i18n";
import {
  transitionDashboardState,
  type DashboardState,
} from "@/app/admin/dashboard/state-utils";
import { dashboardCopy } from "@/components/admin/domain/dashboard/dashboard-copy";
import { AdminDashboardScreen } from "@/components/admin/domain/dashboard/AdminDashboardScreen";
import { type DashboardSummaryResponse } from "@/components/admin/domain/dashboard/dashboard-types";
import { type TrendPeriod } from "@/components/admin/dashboard/trend-utils";

type Locale = AdminLocale;

function detectLocale(): Locale {
  return detectAdminLocale();
}

async function fetchSummary(token: string): Promise<DashboardSummaryResponse> {
  const response = await fetch("/api/admin/dashboard/health-summary", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`request_failed:${response.status}`);
  }
  return (await response.json()) as DashboardSummaryResponse;
}

export default function AdminDashboardPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [dashboardState, setDashboardState] = useState<DashboardState>("idle");
  const [chartPeriod, setChartPeriod] = useState<TrendPeriod>("7d");
  const {
    token: authToken,
    email: authEmail,
    authLoading,
    authErrorCode,
    persistSession,
    login: loginWithAdminSession,
    logout: clearAdminSession,
  } = useAdminAuthController();

  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  const t = dashboardCopy[locale];
  const authError = authErrorCode ? authErrorMessage(t, authErrorCode) : null;

  async function loadDashboard(tokenOverride?: string, emailOverride?: string) {
    const activeToken = (tokenOverride ?? authToken).trim();
    if (!activeToken) {
      setPageError(t.authRequired);
      setDashboardState((current) => transitionDashboardState(current, "fetch_error"));
      return;
    }

    setLoading(true);
    setPageError(null);
    setDashboardState((current) => transitionDashboardState(current, "fetch_start"));
    try {
      const body = await fetchSummary(activeToken);
      setSummary(body);
      setDashboardState((current) => transitionDashboardState(current, "fetch_success", body));
      persistSession(activeToken, emailOverride ?? authEmail || loginEmail);
    } catch {
      setSummary(null);
      setPageError(`${t.loadError} ${t.loadErrorHint}`);
      setDashboardState((current) => transitionDashboardState(current, "fetch_error"));
    } finally {
      setLoading(false);
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || loginEmail).trim();
    const password = String(formData.get("password") || loginPassword);
    try {
      const loginResult = await loginWithAdminSession({ email, password });
      if (!loginResult.ok) return;
      setLoginPassword("");
      await loadDashboard(loginResult.accessToken, loginResult.email);
    } catch {
      return;
    }
  }

  function logout() {
    clearAdminSession();
    setLoginPassword("");
    setPageError(null);
    setSummary(null);
    setDashboardState((current) => transitionDashboardState(current, "reset"));
  }

  return (
    <AdminDashboardScreen
      locale={locale}
      authToken={authToken}
      authEmail={authEmail}
      loginEmail={loginEmail}
      loginPassword={loginPassword}
      authLoading={authLoading}
      authError={authError}
      loading={loading}
      pageError={pageError}
      summary={summary}
      dashboardState={dashboardState}
      chartPeriod={chartPeriod}
      onChartPeriodChange={setChartPeriod}
      onLoginEmailChange={setLoginEmail}
      onLoginPasswordChange={setLoginPassword}
      onLogin={login}
      onLogout={logout}
      onRefresh={() => void loadDashboard()}
    />
  );
}

function authErrorMessage(
  t: (typeof dashboardCopy)[keyof typeof dashboardCopy],
  code: AdminAuthErrorCode
): string {
  if (code === "missing_credentials") return t.loginMissing;
  if (code === "invalid_credentials") return t.loginInvalid;
  return t.loginError;
}
