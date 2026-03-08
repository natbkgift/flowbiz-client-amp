import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { chromium } from "playwright";

const BASE_URL = process.env.ADMIN_SMOKE_BASE_URL || "http://127.0.0.1:3000";
const ARTIFACT_DIR = process.env.ADMIN_SMOKE_ARTIFACT_DIR || path.join(process.cwd(), "artifacts", "admin-smoke");

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
  const generatedAt = new Date().toISOString();
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

async function run() {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage"] });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  let loginRequests = 0;
  const loginStatuses = [];
  let healthSummaryRequests = 0;

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
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildDashboardSmokePayload()),
    });
  });

  try {
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForURL("**/admin/dashboard", { timeout: 10000 });

    await page.fill("#dashboard-login-email", "admin@example.com");
    await page.fill("#dashboard-login-password", "wrong-password");
    await page.getByRole("button", { name: /sign in|เข้าสู่ระบบ/i }).click();
    await page.getByText(/Invalid credentials|ข้อมูลเข้าสู่ระบบไม่ถูกต้อง/).first().waitFor({ timeout: 10000 });

    await page.fill("#dashboard-login-password", "correct-password");
    await page.getByRole("button", { name: /sign in|เข้าสู่ระบบ/i }).click();
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
    await page.getByText(/Smoke warning check/i).waitFor({ timeout: 10000 });
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
          baseUrl: BASE_URL,
          loginRequests,
          loginStatuses,
          healthSummaryRequests,
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
