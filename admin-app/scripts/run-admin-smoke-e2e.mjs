import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { chromium } from "playwright";

const BASE_URL = process.env.ADMIN_SMOKE_BASE_URL || "http://127.0.0.1:3000";
const ARTIFACT_DIR = process.env.ADMIN_SMOKE_ARTIFACT_DIR || path.join(process.cwd(), "artifacts", "admin-smoke");
const SMOKE_MODE = process.env.ADMIN_SMOKE_MODE === "live" ? "live" : "mocked";

function parseLoginPayload(rawBody) {
  if (!rawBody) {
    throw new Error("admin smoke failed: login request body was empty");
  }
  let parsed;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new Error("admin smoke failed: login request body was not valid JSON");
  }
  const email = typeof parsed?.email === "string" ? parsed.email.trim() : "";
  const password = typeof parsed?.password === "string" ? parsed.password : "";
  if (!email || !password) {
    throw new Error("admin smoke failed: login payload must include non-empty email and password");
  }
  return { email, password };
}

function buildDashboardSmokePayload() {
  const generatedDate = new Date();
  const generatedAt = generatedDate.toISOString();
  const baseTimestamp = generatedDate.getTime();
  return {
    generated_at: generatedAt,
    data_freshness: {
      import_feed: {
        checked_at: generatedAt,
        age_seconds: 42,
      },
    },
    raw_metrics: {
      recent_inquiries: {
        count: 1,
        latest_at: generatedAt,
      },
      last_deploy_health_status: {
        health_status: "ok",
        health_checked_at: generatedAt,
        deploy_status: "ok",
        deploy_checked_at: generatedAt,
        source: "admin-smoke",
        build_sha: "adminsm",
      },
    },
    widgets: [
      {
        key: "recent_leads_inquiries",
        title: "Recent leads / inquiries",
        value: 1,
        status: "ok",
        summary: "Latest captured inquiries are visible.",
        actions: [],
      },
      {
        key: "last_deploy_health_status",
        title: "Deploy health",
        value: "Healthy",
        status: "ok",
        summary: "Last deploy and health checks look normal.",
        actions: [],
      },
    ],
    trend_series: {
      "7d": Array.from({ length: 7 }).map((_, index) => ({
        bucket_date: new Date(baseTimestamp - (6 - index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        count: index === 6 ? 1 : 0,
      })),
      "30d": Array.from({ length: 30 }).map((_, index) => ({
        bucket_date: new Date(baseTimestamp - (29 - index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        count: index === 29 ? 1 : 0,
      })),
    },
    recent_inquiries: [
      {
        id: "smoke-inquiry-1",
        created_at: generatedAt,
        name: "Smoke Inquiry",
        email: "smoke@example.com",
        phone: null,
        status: "new",
        intent: "general",
        source_page: "/en/contact",
      },
    ],
    incomplete_widget_count: 0,
    warnings: ["Smoke warning check"],
  };
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`admin smoke failed: ${name} is required when ADMIN_SMOKE_MODE=live`);
  }
  return value.trim();
}

function getSmokeCredentials() {
  if (SMOKE_MODE === "live") {
    return {
      email: requireEnv("ADMIN_SMOKE_EMAIL"),
      password: requireEnv("ADMIN_SMOKE_PASSWORD"),
    };
  }

  return {
    email: "admin@example.com",
    password: "correct-password",
  };
}

function ensureRecord(value, label) {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`admin smoke failed: dashboard summary ${label} must be an object`);
  }
  return value;
}

function ensureArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`admin smoke failed: dashboard summary ${label} must be an array`);
  }
  return value;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function inspectDashboardSummary(payload) {
  const summary = ensureRecord(payload, "payload");
  const widgets = ensureArray(summary.widgets, "widgets");
  const trendSeries = ensureRecord(summary.trend_series, "trend_series");
  const trend7d = ensureArray(trendSeries["7d"], 'trend_series["7d"]');
  const trend30d = ensureArray(trendSeries["30d"], 'trend_series["30d"]');
  const recentInquiries = ensureArray(summary.recent_inquiries, "recent_inquiries");
  const warnings = ensureArray(summary.warnings, "warnings");

  if (summary.generated_at !== null && typeof summary.generated_at !== "string") {
    throw new Error("admin smoke failed: dashboard summary generated_at must be null or string");
  }
  if (typeof summary.incomplete_widget_count !== "number") {
    throw new Error("admin smoke failed: dashboard summary incomplete_widget_count must be a number");
  }

  for (const widget of widgets) {
    if (
      !widget ||
      typeof widget !== "object" ||
      typeof widget.key !== "string" ||
      typeof widget.title !== "string" ||
      typeof widget.summary !== "string" ||
      !Array.isArray(widget.actions)
    ) {
      throw new Error("admin smoke failed: dashboard summary widgets must include key/title/summary/actions");
    }
  }

  for (const bucket of [...trend7d, ...trend30d]) {
    if (!bucket || typeof bucket !== "object" || typeof bucket.bucket_date !== "string" || typeof bucket.count !== "number") {
      throw new Error("admin smoke failed: dashboard trend buckets must include bucket_date and count");
    }
  }

  for (const inquiry of recentInquiries) {
    if (
      !inquiry ||
      typeof inquiry !== "object" ||
      typeof inquiry.id !== "string" ||
      typeof inquiry.name !== "string" ||
      typeof inquiry.status !== "string"
    ) {
      throw new Error("admin smoke failed: recent inquiries must include id, name, and status");
    }
  }

  for (const warning of warnings) {
    if (typeof warning !== "string") {
      throw new Error("admin smoke failed: warnings must be strings");
    }
  }

  return {
    generatedAt: summary.generated_at ?? null,
    widgetCount: widgets.length,
    trendBucketCounts: {
      "7d": trend7d.length,
      "30d": trend30d.length,
    },
    recentInquiryCount: recentInquiries.length,
    warningCount: warnings.length,
    incompleteWidgetCount: summary.incomplete_widget_count,
    firstWidgetTitle: widgets.find((item) => item.title.trim())?.title ?? null,
    firstInquiryText:
      recentInquiries
        .flatMap((item) => [item.name, item.email, item.source_page])
        .find((value) => typeof value === "string" && value.trim()) ?? null,
    firstWarning: warnings.find((item) => item.trim()) ?? null,
  };
}

async function waitForVisibleText(page, value) {
  if (!value) return;
  await page.getByText(new RegExp(escapeRegExp(value), "i")).first().waitFor({ timeout: 10000 });
}

async function verifyDashboardUi(page, contractSummary) {
  await page.getByRole("button", { name: /sign out|ออกจากระบบ/i }).waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: /refresh dashboard|รีเฟรชแดชบอร์ด/i }).first().waitFor({ timeout: 10000 });
  await page.getByRole("heading", { name: /Admin Health \/ QA Dashboard/i }).waitFor({ timeout: 10000 });
  await page.getByRole("heading", { name: /Health widgets|วิดเจ็ตสุขภาพระบบ/i }).waitFor({ timeout: 10000 });
  await page.getByRole("heading", { name: /Lead activity trend|แนวโน้ม activity ของลีด/i }).waitFor({ timeout: 10000 });
  await page.getByRole("heading", { name: /Recent leads\/inquiries|ลีด\/อินไควรีล่าสุด/i }).waitFor({ timeout: 10000 });
  await page
    .getByPlaceholder(
      /Filter inquiries|กรอง inquiry|Search name, contact, status, intent, or source|ค้นหาชื่อ ช่องทางติดต่อ สถานะ เป้าหมาย หรือหน้าต้นทาง/i,
    )
    .waitFor({ timeout: 10000 });
  await page.getByRole("heading", { name: /Deploy health/i }).waitFor({ timeout: 10000 });

  if (contractSummary.widgetCount > 0) {
    await waitForVisibleText(page, contractSummary.firstWidgetTitle);
  } else {
    await page.getByText(/No widgets returned|ยังไม่มีวิดเจ็ต/i).first().waitFor({ timeout: 10000 });
  }

  if (contractSummary.recentInquiryCount > 0) {
    await waitForVisibleText(page, contractSummary.firstInquiryText);
  } else {
    await page.getByText(/No recent inquiries|ยังไม่มีอินไควรีล่าสุด/i).first().waitFor({ timeout: 10000 });
  }

  if (contractSummary.warningCount > 0) {
    await waitForVisibleText(page, contractSummary.firstWarning);
  } else {
    await page.getByText(/No active warnings|ไม่มีคำเตือนที่เปิดอยู่/i).first().waitFor({ timeout: 10000 });
  }
}

async function run() {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });

  const credentials = getSmokeCredentials();
  const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage"] });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  let loginRequests = 0;
  const loginStatuses = [];
  let healthSummaryRequests = 0;
  const healthSummaryStatuses = [];
  let healthSummaryContract = null;

  if (SMOKE_MODE === "mocked") {
    await page.route("**/api/v1/auth/login", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        throw new Error(`admin smoke failed: login method must be POST (got ${request.method()})`);
      }
      const contentType = request.headers()["content-type"] || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        throw new Error(`admin smoke failed: login content-type must be application/json (got ${contentType || "missing"})`);
      }
      parseLoginPayload(request.postData());

      loginRequests += 1;
      if (loginRequests === 1) {
        loginStatuses.push(401);
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ detail: "invalid credentials" }),
        });
        return;
      }

      loginStatuses.push(200);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ access_token: "admin-smoke-token", token_type: "bearer" }),
      });
    });

    await page.route("**/api/admin/dashboard/health-summary", async (route) => {
      const authHeader = route.request().headers().authorization || "";
      if (!/^Bearer\s+\S+$/i.test(authHeader)) {
        throw new Error("admin smoke failed: dashboard summary request missing Authorization bearer token");
      }

      healthSummaryRequests += 1;
      healthSummaryStatuses.push(200);
      healthSummaryContract = inspectDashboardSummary(buildDashboardSmokePayload());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(buildDashboardSmokePayload()),
      });
    });
  }

  try {
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForURL("**/admin/dashboard", { timeout: 10000 });

    await page.fill("#dashboard-login-email", credentials.email);
    if (SMOKE_MODE === "mocked") {
      const failedLoginResponse = page.waitForResponse(
        (response) => response.url().includes("/api/v1/auth/login") && response.request().method() === "POST",
      );
      await page.fill("#dashboard-login-password", "wrong-password");
      await page.getByRole("button", { name: /sign in|เข้าสู่ระบบ/i }).click();
      const failedLogin = await failedLoginResponse;
      if (failedLogin.status() !== 401) {
        throw new Error(`admin smoke failed: expected mocked invalid login status 401 (got ${failedLogin.status()})`);
      }
      await page.getByText(/Invalid credentials|ข้อมูลเข้าสู่ระบบไม่ถูกต้อง/).first().waitFor({ timeout: 10000 });
    }

    const loginResponse = page.waitForResponse(
      (response) => response.url().includes("/api/v1/auth/login") && response.request().method() === "POST",
    );
    const healthSummaryResponse = page.waitForResponse((response) =>
      response.url().includes("/api/admin/dashboard/health-summary"),
    );

    await page.fill("#dashboard-login-password", credentials.password);
    await page.getByRole("button", { name: /sign in|เข้าสู่ระบบ/i }).click();
    const successfulLogin = await loginResponse;
    if (!successfulLogin.ok()) {
      throw new Error(`admin smoke failed: login did not succeed (got ${successfulLogin.status()})`);
    }
    const summaryResponse = await healthSummaryResponse;
    if (!summaryResponse.ok()) {
      throw new Error(`admin smoke failed: dashboard summary did not succeed (got ${summaryResponse.status()})`);
    }
    const authHeader = summaryResponse.request().headers().authorization || "";
    if (!/^Bearer\s+\S+$/i.test(authHeader)) {
      throw new Error("admin smoke failed: dashboard summary request missing Authorization bearer token");
    }
    if (SMOKE_MODE === "live") {
      loginRequests += 1;
      loginStatuses.push(successfulLogin.status());
      healthSummaryRequests += 1;
      healthSummaryStatuses.push(summaryResponse.status());
      healthSummaryContract = inspectDashboardSummary(await summaryResponse.json());
    }

    await verifyDashboardUi(page, healthSummaryContract);
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "admin-dashboard-after-login.png"), fullPage: true });

    await page.getByRole("button", { name: /sign out|ออกจากระบบ/i }).click();
    await page.getByRole("button", { name: /sign in|เข้าสู่ระบบ/i }).first().waitFor({ timeout: 10000 });

    if (!loginRequests) throw new Error("admin smoke failed: login endpoint was not called");
    if (!healthSummaryRequests) throw new Error("admin smoke failed: dashboard summary was not loaded after login");

    await fs.writeFile(
      path.join(ARTIFACT_DIR, "admin-smoke-summary.json"),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          smokeMode: SMOKE_MODE,
          baseUrl: BASE_URL,
          loginRequests,
          loginStatuses,
          healthSummaryRequests,
          healthSummaryStatuses,
          healthSummaryContract,
          mockedRoutes:
            SMOKE_MODE === "mocked" ? ["/api/v1/auth/login", "/api/admin/dashboard/health-summary"] : [],
          finalUrl: page.url(),
        },
        null,
        2,
      ),
      "utf-8",
    );
  } catch (error) {
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "admin-dashboard-failure.png"), fullPage: true }).catch(() => {});
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
