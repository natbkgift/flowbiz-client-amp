import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const DEFAULT_BASE_URL = "http://127.0.0.1:3000";
const EXPLICIT_BASE_URL = typeof process.env.ADMIN_SMOKE_BASE_URL === "string"
  ? process.env.ADMIN_SMOKE_BASE_URL.trim()
  : "";
const BASE_URL = EXPLICIT_BASE_URL || DEFAULT_BASE_URL;
const ARTIFACT_DIR = process.env.ADMIN_SMOKE_ARTIFACT_DIR || path.join(PROJECT_ROOT, "artifacts", "admin-smoke");
const SMOKE_MODE = process.env.ADMIN_SMOKE_MODE === "live" ? "live" : "mocked";
const SMOKE_LOCALE = process.env.ADMIN_SMOKE_LOCALE === "th" ? "th" : "en";
const VIEWPORT_WIDTH = Number.parseInt(process.env.ADMIN_SMOKE_VIEWPORT_WIDTH || "1366", 10) || 1366;
const VIEWPORT_HEIGHT = Number.parseInt(process.env.ADMIN_SMOKE_VIEWPORT_HEIGHT || "900", 10) || 900;
const SMOKE_DIST_DIR = process.env.ADMIN_SMOKE_DIST_DIR || ".next_admin_smoke";
const SMOKE_STARTUP_REQUEST_TIMEOUT_MS = Number.parseInt(process.env.ADMIN_SMOKE_STARTUP_REQUEST_TIMEOUT_MS || "30000", 10) || 30000;
const PROJECT_FILES_TO_RESTORE = ["next-env.d.ts", "tsconfig.json"];
const AUTH_SESSION_STORAGE_KEY = "flowbiz_admin_auth_session_v1";
const LEGACY_TOKEN_STORAGE_KEY = "flowbiz_admin_token";
let activeBaseUrl = BASE_URL;

const VISIBLE_WIDGET_TITLE_BY_KEY = {
  en: {
    project_cover_coverage: "Project Cover Coverage %",
    broken_media_count: "Broken media",
    pending_translations_count: "Pending translations",
    unpublished_drafts_count: "Unpublished drafts",
    recent_leads_inquiries: "Recent leads / inquiries",
    review_video_source_verification_pending: "Video source verification",
    last_import_mirror_status: "Import / mirror health",
    last_deploy_health_status: "Deploy health",
  },
  th: {
    project_cover_coverage: "ความครอบคลุมภาพปกโปรเจกต์",
    broken_media_count: "สื่อที่มีปัญหา",
    pending_translations_count: "คำแปลที่รอดำเนินการ",
    unpublished_drafts_count: "ฉบับร่างที่ยังไม่เผยแพร่",
    recent_leads_inquiries: "ลีดและอินไควรีล่าสุด",
    review_video_source_verification_pending: "การยืนยันแหล่งที่มาวิดีโอ",
    last_import_mirror_status: "สถานะนำเข้าและมิเรอร์",
    last_deploy_health_status: "สถานะดีพลอย",
  },
};

function buildAdminUrl(routePath) {
  const normalizedBase = activeBaseUrl.endsWith("/") ? activeBaseUrl : `${activeBaseUrl}/`;
  const url = new URL(routePath, normalizedBase);
  if (SMOKE_LOCALE !== "en") {
    url.searchParams.set("lang", SMOKE_LOCALE);
  }
  return url.toString();
}

function buildBaseUrlForPort(baseUrl, port) {
  const parsed = new URL(baseUrl);
  parsed.port = String(port);
  return `${parsed.protocol}//${parsed.hostname}:${parsed.port}`;
}

function wait(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

async function readText(url) {
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(SMOKE_STARTUP_REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

async function checkUrlReady(url) {
  try {
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(3000) });
    return response.ok || response.status === 307 || response.status === 308;
  } catch {
    return false;
  }
}

function parseDashboardChunkPath(html) {
  const match = html.match(/\/_next\/static\/chunks\/app\/admin\/dashboard\/page(?:-[^"]+)?\.js/);
  return match?.[0] ?? null;
}

async function isAdminRuntimeReady(baseUrl) {
  const html = await readText(new URL("/admin/dashboard", baseUrl).toString());
  if (!html || (!html.includes("Operations Hub") && !html.includes("Dashboard"))) return false;

  const dashboardChunk = parseDashboardChunkPath(html);
  if (!dashboardChunk) return false;

  try {
    const response = await fetch(new URL(dashboardChunk, baseUrl).toString(), {
      redirect: "manual",
      signal: AbortSignal.timeout(SMOKE_STARTUP_REQUEST_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function snapshotProjectFiles() {
  return Promise.all(
    PROJECT_FILES_TO_RESTORE.map(async (relativePath) => {
      const absolutePath = path.join(PROJECT_ROOT, relativePath);
      try {
        const content = await fs.readFile(absolutePath, "utf-8");
        return { absolutePath, content };
      } catch {
        return { absolutePath, content: null };
      }
    }),
  );
}

async function restoreProjectFiles(snapshot) {
  await Promise.all(
    snapshot.map(async ({ absolutePath, content }) => {
      if (content === null) return;
      await fs.writeFile(absolutePath, content, "utf-8");
    }),
  );
}

function waitForChildExit(child, timeoutMs) {
  if (!child || child.exitCode !== null) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (didExit) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.off("exit", onExit);
      child.off("close", onClose);
      resolve(didExit);
    };
    const onExit = () => finish(true);
    const onClose = () => finish(true);
    const timer = setTimeout(() => finish(false), timeoutMs);
    child.once("exit", onExit);
    child.once("close", onClose);
  });
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
        shell: true,
      });
      killer.on("exit", resolve);
      killer.on("error", resolve);
    });
    await waitForChildExit(child, 5000);
    return;
  }

  try {
    child.kill("SIGTERM");
  } catch {
    return;
  }
  const exitedGracefully = await waitForChildExit(child, 15000);
  if (exitedGracefully || child.exitCode !== null) return;
  try {
    child.kill("SIGKILL");
  } catch {
    return;
  }
  await waitForChildExit(child, 5000);
}

async function startLocalAdminServer(baseUrl) {
  const startupAttempts = Number.parseInt(process.env.ADMIN_SMOKE_STARTUP_ATTEMPTS || "120", 10) || 120;
  const nextCommand = process.platform === "win32"
    ? path.join(PROJECT_ROOT, "node_modules", ".bin", "next.cmd")
    : path.join(PROJECT_ROOT, "node_modules", ".bin", "next");
  const port = new URL(baseUrl).port || "3000";
  const logs = [];
  const child = spawn(nextCommand, ["dev", "-p", port], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      NEXT_LOCAL_FONT_FALLBACK: process.env.NEXT_LOCAL_FONT_FALLBACK || "1",
      NEXT_LOCAL_DIST_DIR: process.env.NEXT_LOCAL_DIST_DIR || SMOKE_DIST_DIR,
    },
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));

  for (let attempt = 0; attempt < startupAttempts; attempt += 1) {
    if (await isAdminRuntimeReady(baseUrl)) {
      return { baseUrl, child, started: true, logs };
    }
    await wait(1000);
  }

  await stopServer(child).catch(() => {});
  throw new Error(`admin smoke failed: unable to boot a hydrate-ready admin runtime at ${baseUrl}\n${logs.join("")}`);
}

async function prepareAdminRuntime() {
  if (await isAdminRuntimeReady(BASE_URL)) {
    return { baseUrl: BASE_URL, child: null, started: false };
  }

  const currentBaseReachable = await checkUrlReady(BASE_URL);
  if (EXPLICIT_BASE_URL) {
    if (!currentBaseReachable) {
      return startLocalAdminServer(BASE_URL);
    }
    throw new Error(
      `admin smoke failed: ${BASE_URL} is reachable but does not serve a hydrate-ready admin runtime. ` +
      "Point ADMIN_SMOKE_BASE_URL to a working Next admin server.",
    );
  }

  if (!currentBaseReachable) {
    return startLocalAdminServer(BASE_URL);
  }

  const fallbackPorts = [3100, 3200, 3300];
  for (const port of fallbackPorts) {
    const fallbackBaseUrl = buildBaseUrlForPort(BASE_URL, port);
    if (await isAdminRuntimeReady(fallbackBaseUrl)) {
      return { baseUrl: fallbackBaseUrl, child: null, started: false };
    }
    if (!(await checkUrlReady(fallbackBaseUrl))) {
      try {
        return await startLocalAdminServer(fallbackBaseUrl);
      } catch {
        // Try the next fallback port.
      }
    }
  }

  throw new Error(
    `admin smoke failed: ${BASE_URL} responded but its admin runtime chunks are unavailable, and no fallback port could host a local Next server.`,
  );
}

function getVisibleWidgetTitle(widgetKey, fallbackTitle) {
  return VISIBLE_WIDGET_TITLE_BY_KEY[SMOKE_LOCALE]?.[widgetKey] || fallbackTitle;
}

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
  const trend7dCounts = [2, 3, 2, 4, 3, 5, 6];
  const trend30dCounts = [
    1, 0, 2, 1, 3, 2, 2, 4, 3, 2,
    4, 5, 3, 2, 4, 6, 5, 4, 6, 5,
    4, 7, 6, 5, 7, 8, 6, 7, 8, 9,
  ];
  const inquiries = Array.from({ length: 12 }).map((_, index) => ({
    id: `smoke-inquiry-${index + 1}`,
    created_at: new Date(baseTimestamp - index * 60 * 1000).toISOString(),
    name: `Smoke Inquiry ${index + 1}`,
    email: `smoke-${index + 1}@example.com`,
    phone: null,
    status: index % 2 === 0 ? "new" : "contacted",
    intent: "general",
    source_page: index % 2 === 0 ? "/en/contact" : "/th/contact",
  }));
  return {
    generated_at: generatedAt,
    data_freshness: {
      import_feed: {
        checked_at: new Date(baseTimestamp - 12 * 60 * 1000).toISOString(),
        age_seconds: 12 * 60,
      },
      media_scan: {
        checked_at: new Date(baseTimestamp - 48 * 60 * 1000).toISOString(),
        age_seconds: 48 * 60,
      },
      translation_queue: {
        checked_at: new Date(baseTimestamp - 3 * 60 * 60 * 1000).toISOString(),
        age_seconds: 3 * 60 * 60,
      },
      deploy_watch: {
        checked_at: new Date(baseTimestamp - 8 * 60 * 60 * 1000).toISOString(),
        age_seconds: 8 * 60 * 60,
      },
    },
    raw_metrics: {
      project_cover_coverage: {
        checked_at: generatedAt,
        projects_total: 124,
        projects_real_cover_count: 114,
        projects_real_cover_pct: 92,
        projects_external_cover_count: 4,
        projects_missing_cover_count: 10,
      },
      media_integrity: {
        scanned_at: new Date(baseTimestamp - 48 * 60 * 1000).toISOString(),
        broken_media_count: 3,
        external_image_leakage_count: 1,
        error_count: 1,
        warn_count: 4,
      },
      pending_translations: {
        total_pending_translations: 8,
        policy: {
          approved: true,
          checked_at: new Date(baseTimestamp - 3 * 60 * 60 * 1000).toISOString(),
        },
        projects_missing_en_th: 3,
        articles_missing_en_th: 2,
        home_composer_missing_locale_pairs: 3,
      },
      unpublished_drafts: {
        total_unpublished_drafts: 4,
        projects_draft: 1,
        articles_draft: 2,
        home_composer_draft: 1,
      },
      recent_inquiries: {
        count: inquiries.length,
        latest_at: generatedAt,
      },
      review_video_source_verification_pending: {
        total_pending: 2,
        reviews_pending: 1,
        videos_pending: 1,
      },
      last_import_status: {
        status: "partial",
        checked_at: new Date(baseTimestamp - 12 * 60 * 1000).toISOString(),
        rows_total: 1240,
        rows_errors: 6,
        filename: "amp-sync-20260310.csv",
      },
      last_mirror_status: {
        status: "ok",
        checked_at: new Date(baseTimestamp - 38 * 60 * 1000).toISOString(),
        failures_count: 1,
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
        key: "project_cover_coverage",
        title: "Project Cover Coverage %",
        value: 92,
        status: "ok",
        summary: "Most projects now serve a verified local cover image.",
        actions: [{ label: "Open media", url: "/admin/media" }],
      },
      {
        key: "broken_media_count",
        title: "Broken media",
        value: 3,
        status: "warn",
        summary: "A small group of media references still needs operator cleanup.",
        actions: [{ label: "Open media", url: "/admin/media" }],
      },
      {
        key: "pending_translations_count",
        title: "Pending translations",
        value: 8,
        status: "warn",
        summary: "Translation backlog is visible but contained within the current queue.",
        actions: [{ label: "Open domain", url: "/admin/domain" }],
      },
      {
        key: "unpublished_drafts_count",
        title: "Unpublished drafts",
        value: 4,
        status: "warn",
        summary: "Draft inventory is small enough to clear in a single publish pass.",
        actions: [{ label: "Open layout", url: "/admin/layout" }],
      },
      {
        key: "recent_leads_inquiries",
        title: "Recent leads / inquiries",
        value: inquiries.length,
        status: "ok",
        summary: "Latest captured inquiries are visible.",
        actions: [{ label: "Open CRM", url: "/admin/inquiries" }],
      },
      {
        key: "review_video_source_verification_pending",
        title: "Video source verification",
        value: 2,
        status: "warn",
        summary: "Two source-rights checks still need review before publish approval.",
        actions: [{ label: "Open videos", url: "/admin/videos" }],
      },
      {
        key: "last_import_mirror_status",
        title: "Import / mirror health",
        value: "Attention",
        status: "warn",
        summary: "Import completed with warnings while mirror stayed healthy.",
        actions: [{ label: "Open imports", url: "/admin/imports" }],
      },
      {
        key: "last_deploy_health_status",
        title: "Deploy health",
        value: "Healthy",
        status: "ok",
        summary: "Last deploy and health checks look normal.",
        actions: [{ label: "Open SEO", url: "/admin/seo" }],
      },
    ],
    trend_series: {
      "7d": Array.from({ length: 7 }).map((_, index) => ({
        bucket_date: new Date(baseTimestamp - (6 - index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        count: trend7dCounts[index],
      })),
      "30d": Array.from({ length: 30 }).map((_, index) => ({
        bucket_date: new Date(baseTimestamp - (29 - index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        count: trend30dCounts[index],
      })),
    },
    recent_inquiries: inquiries.slice(0, 10),
    incomplete_widget_count: 2,
    warnings: ["Smoke warning check"],
  };
}

function buildInquiriesListPayload(pageNumber, limit = 10) {
  const summary = buildDashboardSmokePayload();
  const remainingInquiriesCount = Math.max(
    0,
    summary.raw_metrics.recent_inquiries.count - summary.recent_inquiries.length,
  );
  const inquiries = summary.recent_inquiries.concat(
    Array.from({ length: remainingInquiriesCount }).map((_, index) => ({
      id: `smoke-inquiry-${summary.recent_inquiries.length + index + 1}`,
      created_at: new Date(
        Date.parse(summary.generated_at) - (summary.recent_inquiries.length + index) * 60 * 1000,
      ).toISOString(),
      name: `Smoke Inquiry ${summary.recent_inquiries.length + index + 1}`,
      email: `smoke-${summary.recent_inquiries.length + index + 1}@example.com`,
      phone: null,
      status: (summary.recent_inquiries.length + index) % 2 === 0 ? "new" : "contacted",
      intent: "general",
      source_page: (summary.recent_inquiries.length + index) % 2 === 0 ? "/en/contact" : "/th/contact",
    })),
  );
  const start = Math.max(0, (pageNumber - 1) * limit);
  return {
    data: inquiries.slice(start, start + limit),
    meta: {
      page: pageNumber,
      limit,
      total: inquiries.length,
    },
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
  const rawMetrics = ensureRecord(summary.raw_metrics, "raw_metrics");
  const recentInquiryMetrics = ensureRecord(rawMetrics.recent_inquiries, 'raw_metrics["recent_inquiries"]');

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
    recentInquiryTotal:
      typeof recentInquiryMetrics.count === "number" ? recentInquiryMetrics.count : recentInquiries.length,
    recentInquiryTotalPages:
      recentInquiries.length > 0 && typeof recentInquiryMetrics.count === "number"
        ? Math.max(1, Math.ceil(recentInquiryMetrics.count / recentInquiries.length))
        : 1,
    warningCount: warnings.length,
    incompleteWidgetCount: summary.incomplete_widget_count,
    firstWidgetKey: widgets.find((item) => item.key.trim())?.key ?? null,
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

async function waitForVisibleTextMatch(page, values) {
  const candidates = values.filter((value) => typeof value === "string" && value.trim());
  if (!candidates.length) return;
  const pattern = new RegExp(candidates.map((value) => escapeRegExp(value)).join("|"), "i");
  await page.getByText(pattern).first().waitFor({ timeout: 10000 });
}

async function verifyDashboardUi(page, contractSummary, options = {}) {
  const { smokeMode = "mocked", getCurrentRecentInquiriesRequestCount = () => 0 } = options;
  await page.getByRole("button", { name: /sign out|ออกจากระบบ/i }).waitFor({ timeout: 10000 });
  await page
    .getByRole("button", { name: /refresh dashboard|refresh operations hub|รีเฟรชแดชบอร์ด|รีเฟรชศูนย์ปฏิบัติการ/i })
    .first()
    .waitFor({ timeout: 10000 });
  await waitForVisibleTextMatch(page, [
    "Operations Hub",
    "ศูนย์ปฏิบัติการ",
    "Dashboard",
    "แดชบอร์ด",
  ]);
  await page
    .getByRole("heading", { name: /System health \/ QA overview|Health widgets|ภาพรวมสุขภาพระบบ|วิดเจ็ตสุขภาพระบบ/i })
    .first()
    .waitFor({ timeout: 10000 });
  await page
    .getByRole("heading", { name: /Activity metrics|Lead activity trend|แนวโน้มกิจกรรมของลีด|แนวโน้ม activity ของลีด/i })
    .first()
    .waitFor({ timeout: 10000 });
  await page
    .getByRole("heading", { name: /Logs|Recent leads\/inquiries|บันทึกเหตุการณ์|ลีด\/อินไควรีล่าสุด/i })
    .first()
    .waitFor({ timeout: 10000 });
  await page
    .getByPlaceholder(
      /Filter inquiries|กรอง inquiry|Search name, contact, status, intent, or source|ค้นหาชื่อ ช่องทางติดต่อ สถานะ เป้าหมาย หรือหน้าต้นทาง/i,
    )
    .waitFor({ timeout: 10000 });

  if (contractSummary.widgetCount > 0) {
    await waitForVisibleTextMatch(page, [
      getVisibleWidgetTitle(contractSummary.firstWidgetKey, contractSummary.firstWidgetTitle),
      contractSummary.firstWidgetTitle,
    ]);
  } else {
    await page.getByText(/No widgets returned|ยังไม่มีวิดเจ็ต/i).first().waitFor({ timeout: 10000 });
  }

  if (contractSummary.recentInquiryCount > 0) {
    await waitForVisibleText(page, contractSummary.firstInquiryText);
  } else {
    await page.getByText(/No recent inquiries|ยังไม่มีอินไควรีล่าสุด/i).first().waitFor({ timeout: 10000 });
  }

  if (contractSummary.recentInquiryTotal > contractSummary.recentInquiryCount) {
    const requestsBeforePagination = getCurrentRecentInquiriesRequestCount();
    await page.locator(".dashboard-table-pagination").getByRole("button", { name: /Next|ถัดไป/i }).click();
    await page
      .getByText(new RegExp(`Page\\s+2\\s*\\/\\s*${contractSummary.recentInquiryTotalPages}|หน้า\\s+2\\s*\\/\\s*${contractSummary.recentInquiryTotalPages}`, "i"))
      .first()
      .waitFor({ timeout: 10000 });
    if (smokeMode === "mocked" && getCurrentRecentInquiriesRequestCount() <= requestsBeforePagination) {
      throw new Error("admin smoke failed: inquiries pagination did not trigger a page 2 refresh request");
    }
  }

  if (contractSummary.warningCount > 0) {
    await waitForVisibleText(page, contractSummary.firstWarning);
  } else {
    await page
      .getByText(
        /No warnings reported|The current snapshot did not report any warning conditions|รอบนี้ไม่มีคำเตือนที่ระบบรายงาน|สแนปช็อตปัจจุบันไม่พบคำเตือนที่ต้องติดตามต่อ/i,
      )
      .first()
      .waitFor({ timeout: 10000 });
  }
}

async function run() {
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });

  const credentials = getSmokeCredentials();
  const projectFileSnapshot = await snapshotProjectFiles();
  let managedServer = null;
  let runtimeStarted = false;
  let browser = null;
  let context = null;
  let page = null;

  let loginRequests = 0;
  const loginStatuses = [];
  let healthSummaryRequests = 0;
  const healthSummaryStatuses = [];
  let recentInquiriesRequests = 0;
  const recentInquiriesStatuses = [];
  let healthSummaryContract = null;

  try {
    const runtime = await prepareAdminRuntime();
    activeBaseUrl = runtime.baseUrl;
    managedServer = runtime.child;
    runtimeStarted = runtime.started;

    browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage"] });
    context = await browser.newContext({ viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT } });
    await context.addInitScript(
      ({ authSessionStorageKey, legacyTokenStorageKey }) => {
        try {
          window.sessionStorage.removeItem(authSessionStorageKey);
          window.localStorage.removeItem(legacyTokenStorageKey);
        } catch {
          // Storage may be unavailable for some environments.
        }
      },
      {
        authSessionStorageKey: AUTH_SESSION_STORAGE_KEY,
        legacyTokenStorageKey: LEGACY_TOKEN_STORAGE_KEY,
      },
    );
    page = await context.newPage();

    if (SMOKE_MODE === "live") {
      page.on("response", (response) => {
        const responseUrl = response.url();
        const method = response.request().method();

        if (responseUrl.includes("/api/v1/auth/login") && method === "POST") {
          loginRequests += 1;
          loginStatuses.push(response.status());
          return;
        }

        if (responseUrl.includes("/api/admin/dashboard/health-summary")) {
          healthSummaryRequests += 1;
          healthSummaryStatuses.push(response.status());
          return;
        }

        if (responseUrl.includes("/api/admin/inquiries")) {
          recentInquiriesRequests += 1;
          recentInquiriesStatuses.push(response.status());
        }
      });
    }

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

      await page.route("**/api/admin/inquiries**", async (route) => {
        const authHeader = route.request().headers().authorization || "";
        if (!/^Bearer\s+\S+$/i.test(authHeader)) {
          throw new Error("admin smoke failed: inquiries page request missing Authorization bearer token");
        }

        const requestUrl = new URL(route.request().url());
        const pageNumber = Number(requestUrl.searchParams.get("page") || "1");
        const limit = Number(requestUrl.searchParams.get("limit") || "10");
        recentInquiriesRequests += 1;
        recentInquiriesStatuses.push(200);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(buildInquiriesListPayload(pageNumber, limit)),
        });
      });
    }

    await page.goto(buildAdminUrl("/admin/dashboard"), { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForURL("**/admin/dashboard*", { timeout: 10000 });
    await page.locator('html[data-admin-dashboard-hydrated="true"]').waitFor({ timeout: 10000 });

    await page.fill("#dashboard-login-email", credentials.email);
    if (SMOKE_MODE === "mocked") {
      const failedLoginResponse = page.waitForResponse(
        (response) => response.url().includes("/api/v1/auth/login") && response.request().method() === "POST",
      );
      await page.fill("#dashboard-login-password", "wrong-password");
      await page.getByRole("button", { name: /sign in|เข้าสู่ระบบ/i }).click();
      const invalidLoginResponse = await failedLoginResponse;
      if (invalidLoginResponse.status() !== 401) {
        throw new Error(`admin smoke failed: expected mocked invalid login status 401 (got ${invalidLoginResponse.status() ?? "missing"})`);
      }
      await page.getByText(/Invalid credentials|ข้อมูลเข้าสู่ระบบไม่ถูกต้อง/).first().waitFor({ timeout: 10000 });
    }

    await page.fill("#dashboard-login-password", credentials.password);
    const loginRequest = page.waitForRequest(
      (request) => request.url().includes("/api/v1/auth/login") && request.method() === "POST",
    );
    const loginResponse = page.waitForResponse(
      (response) => response.url().includes("/api/v1/auth/login") && response.request().method() === "POST",
    );
    const healthSummaryRequest = page.waitForRequest((request) =>
      request.url().includes("/api/admin/dashboard/health-summary"),
    );
    const healthSummaryResponse = page.waitForResponse((response) =>
      response.url().includes("/api/admin/dashboard/health-summary"),
    );

    await page.getByRole("button", { name: /sign in|เข้าสู่ระบบ/i }).click();
    await loginRequest;
    const loginResult = await loginResponse;
    const summaryRequest = await healthSummaryRequest;
    const summaryResponse = await healthSummaryResponse;

    const lastLoginStatus = loginResult.status();
    if (typeof lastLoginStatus !== "number" || lastLoginStatus < 200 || lastLoginStatus >= 300) {
      throw new Error(`admin smoke failed: login did not succeed (got ${lastLoginStatus ?? "missing"})`);
    }
    const lastHealthSummaryStatus = summaryResponse.status();
    if (typeof lastHealthSummaryStatus !== "number" || lastHealthSummaryStatus < 200 || lastHealthSummaryStatus >= 300) {
      throw new Error(`admin smoke failed: dashboard summary did not succeed (got ${lastHealthSummaryStatus ?? "missing"})`);
    }
    const authHeader = summaryRequest.headers().authorization || "";
    if (!/^Bearer\s+\S+$/i.test(authHeader)) {
      throw new Error("admin smoke failed: dashboard summary request missing Authorization bearer token");
    }
    if (SMOKE_MODE === "live") {
      loginRequests = Math.max(loginRequests, 1);
      if (!loginStatuses.length) loginStatuses.push(lastLoginStatus);
      healthSummaryRequests = Math.max(healthSummaryRequests, 1);
      if (!healthSummaryStatuses.length) healthSummaryStatuses.push(lastHealthSummaryStatus);
      healthSummaryContract = inspectDashboardSummary(await summaryResponse.json());
    }

    await verifyDashboardUi(page, healthSummaryContract, {
      smokeMode: SMOKE_MODE,
      getCurrentRecentInquiriesRequestCount: () => recentInquiriesRequests,
    });
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
          locale: SMOKE_LOCALE,
          baseUrl: activeBaseUrl,
          runtimeStarted,
          viewport: {
            width: VIEWPORT_WIDTH,
            height: VIEWPORT_HEIGHT,
          },
          loginRequests,
          loginStatuses,
          healthSummaryRequests,
          healthSummaryStatuses,
          recentInquiriesRequests,
          recentInquiriesStatuses,
          healthSummaryContract,
          mockedRoutes:
            SMOKE_MODE === "mocked"
              ? ["/api/v1/auth/login", "/api/admin/dashboard/health-summary", "/api/admin/inquiries"]
              : [],
          finalUrl: page.url(),
        },
        null,
        2,
      ),
      "utf-8",
    );
  } catch (error) {
    await page?.screenshot({ path: path.join(ARTIFACT_DIR, "admin-dashboard-failure.png"), fullPage: true }).catch(() => {});
    throw error;
  } finally {
    await context?.close().catch(() => {});
    await browser?.close().catch(() => {});
    await stopServer(managedServer).catch(() => {});
    await restoreProjectFiles(projectFileSnapshot).catch(() => {});
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
