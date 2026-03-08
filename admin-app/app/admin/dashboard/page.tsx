"use client";

import { type FormEvent, useEffect, useState } from "react";

import { clearAuthSession, loginAdmin, persistAuthSession, readAuthSession } from "@/app/_lib/admin-auth";
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
  const [authToken, setAuthToken] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [dashboardState, setDashboardState] = useState<DashboardState>("idle");
  const [chartPeriod, setChartPeriod] = useState<TrendPeriod>("7d");

  useEffect(() => {
    setLocale(detectLocale());
    const session = readAuthSession();
    if (!session) return;
    setAuthToken(session.token);
    setAuthEmail(session.email);
    setDashboardState("idle");
  }, []);

  const t = dashboardCopy[locale];

  async function loadDashboard(tokenOverride?: string) {
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
      persistAuthSession(activeToken, authEmail || loginEmail);
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
    if (!email || !password) {
      setAuthError(t.loginMissing);
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    try {
      const loginResult = await loginAdmin(email, password);
      if (!loginResult.ok) {
        setAuthError(loginResult.status === 401 ? t.loginInvalid : t.loginError);
        return;
      }
      const accessToken = loginResult.accessToken;
      setAuthToken(accessToken);
      setAuthEmail(email);
      setLoginPassword("");
      persistAuthSession(accessToken, email);
      await loadDashboard(accessToken);
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
