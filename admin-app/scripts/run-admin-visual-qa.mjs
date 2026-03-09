import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

import { chromium } from "playwright";

const BASE_URL = process.env.ADMIN_VISUAL_BASE_URL || "http://127.0.0.1:3000";
const ARTIFACT_ROOT = path.resolve(
  process.cwd(),
  process.env.ADMIN_VISUAL_ARTIFACT_DIR || path.join("artifacts", "admin-visual-qa"),
);
const DEFAULT_ROUTES = [
  "/admin/dashboard",
  "/admin/projects",
  "/admin/properties",
  "/admin/media",
  "/admin/inquiries",
  "/admin/imports",
  "/admin/users",
  "/admin/seo",
  "/admin/home-composer",
  "/admin/layout",
];
const ROUTES = parseRoutes(process.env.ADMIN_VISUAL_ROUTES) || DEFAULT_ROUTES;
const BREAKPOINTS = parseBreakpoints(process.env.ADMIN_VISUAL_BREAKPOINTS) || [768, 1024, 1366, 1440];
const VISUAL_EMAIL = process.env.ADMIN_VISUAL_EMAIL || process.env.ADMIN_SMOKE_EMAIL || "";
const VISUAL_PASSWORD = process.env.ADMIN_VISUAL_PASSWORD || process.env.ADMIN_SMOKE_PASSWORD || "";
const RUN_DIR = process.env.ADMIN_VISUAL_RUN_DIR
  ? path.resolve(process.cwd(), process.env.ADMIN_VISUAL_RUN_DIR)
  : path.join(ARTIFACT_ROOT, `run-${timestampStamp(new Date())}`);
const ITERATION_NUMBER = Number.parseInt(process.env.ADMIN_VISUAL_ITERATION || "1", 10) || 1;
const ITERATION_KEY = `iteration-${String(ITERATION_NUMBER).padStart(2, "0")}`;
const PHASE = normalizePhase(process.env.ADMIN_VISUAL_PHASE);
const ITERATION_DIR = path.join(RUN_DIR, ITERATION_KEY);
const CAPTURE_DIR = path.join(ITERATION_DIR, PHASE);
const SUMMARY_PATH = path.join(RUN_DIR, "summary.json");
const FINDINGS_PATH = path.join(RUN_DIR, "findings.md");
const CONSOLE_PATH = path.join(ITERATION_DIR, "console.json");
const NETWORK_PATH = path.join(ITERATION_DIR, "network-failures.json");
const METRICS_PATH = path.join(ITERATION_DIR, "metrics.json");

function parseBreakpoints(raw) {
  const source = String(raw || "")
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value) && value >= 320);
  return source.length ? [...new Set(source)] : null;
}

function parseRoutes(raw) {
  const source = String(raw || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => (value.startsWith("/") ? value : `/${value}`));
  return source.length ? [...new Set(source)] : null;
}

function normalizePhase(value) {
  return value === "after" ? "after" : "before";
}

function timestampStamp(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  const seconds = String(value.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function sanitizeRouteForFile(route) {
  return route.replace(/^\//, "").replace(/\//g, "__").replace(/[^a-zA-Z0-9_-]/g, "-");
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

async function checkUrlReady(url) {
  try {
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(3000) });
    return response.ok || response.status === 307 || response.status === 308;
  } catch {
    return false;
  }
}

async function ensureBaseUrl(url) {
  if (await checkUrlReady(url)) {
    return { started: false, child: null, logs: [] };
  }

  const startLogs = [];
  const child = spawn("npm", ["run", "dev"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => startLogs.push(String(chunk)));
  child.stderr.on("data", (chunk) => startLogs.push(String(chunk)));

  for (let attempt = 0; attempt < 45; attempt += 1) {
    if (await checkUrlReady(url)) {
      return { started: true, child, logs: startLogs };
    }
    await wait(1000);
  }

  throw new Error(`admin visual qa failed: unable to reach ${url}\n${startLogs.join("")}`);
}

function wait(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

async function tryLogin(page, runMetadata) {
  if (!VISUAL_EMAIL || !VISUAL_PASSWORD) {
    runMetadata.auth = {
      mode: "blocked-no-credentials",
      message: "No admin visual credentials were provided; captures may remain on sign-in states.",
    };
    return;
  }

  await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(800);
  const emailInput = (await page.locator("#dashboard-login-email").first().isVisible().catch(() => false))
    ? page.locator("#dashboard-login-email").first()
    : page.getByLabel(/admin email|email/i).first();
  const passwordInput = (await page.locator("#dashboard-login-password").first().isVisible().catch(() => false))
    ? page.locator("#dashboard-login-password").first()
    : page.getByLabel(/password/i).first();
  const signOutButton = page.getByRole("button", { name: /sign out|ออกจากระบบ/i }).first();

  if (await signOutButton.isVisible().catch(() => false)) {
    runMetadata.auth = { mode: "live", message: "Admin session was already active for the browser context." };
    return;
  }

  if (!(await emailInput.isVisible().catch(() => false)) || !(await passwordInput.isVisible().catch(() => false))) {
    runMetadata.auth = {
      mode: "live-unverified",
      message: "Credentials were available, but the dashboard login form was not visible for automated verification.",
    };
    return;
  }

  await emailInput.fill(VISUAL_EMAIL);
  await passwordInput.fill(VISUAL_PASSWORD);
  await page.getByRole("button", { name: /sign in|เข้าสู่ระบบ/i }).first().click();
  await page.waitForTimeout(1200);

  if (await signOutButton.isVisible().catch(() => false)) {
    runMetadata.auth = { mode: "live", message: "Logged in through the real dashboard UI." };
    return;
  }

  runMetadata.auth = {
    mode: "live-failed",
    message: "Credentials were supplied, but the dashboard did not reach the signed-in shell state.",
  };
}

async function captureRoute(page, route, width, captureLog, networkLog) {
  const targetUrl = new URL(route, BASE_URL).toString();
  const perCaptureConsoleStart = captureLog.length;
  const perCaptureNetworkStart = networkLog.length;

  await page.setViewportSize({ width, height: 960 });
  const response = await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(900);
  await page.locator("main").first().waitFor({ timeout: 10000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

  const metrics = await page.evaluate(() => {
    const body = document.body;
    const main = document.querySelector("main");
    const heading = main?.querySelector("h1") || document.querySelector("h1");
    const interactiveCount = document.querySelectorAll("button, a[href], input, select, textarea").length;
    const authText = body?.innerText || "";
    const skipLink = document.querySelector('a.sr-only[href="#main-content"]');
    const skipLinkDelta =
      skipLink instanceof HTMLElement && skipLink.scrollWidth > skipLink.clientWidth
        ? skipLink.scrollWidth - skipLink.clientWidth
        : 0;
    const bodyOverflowDelta = body ? Math.max(0, body.scrollWidth - window.innerWidth) : 0;
    const authBlocked =
      /sign in required|admin sign in|เข้าสู่ระบบ|ต้องเข้าสู่ระบบ/i.test(authText) ||
      Boolean(document.querySelector('input[type="password"]'));
    const emptyStateCount = document.querySelectorAll(
      ".state-empty, .state-loading, .dashboard-section-state, [data-empty-state], [role='status'], [role='alert']",
    ).length;
    return {
      title: document.title || "",
      hasMain: Boolean(main),
      hasH1: Boolean(heading),
      headingText: heading?.textContent?.trim() || null,
      interactiveCount,
      overflowX: bodyOverflowDelta > 1 && !(skipLinkDelta > 0 && bodyOverflowDelta <= skipLinkDelta + 8),
      authBlocked,
      emptyStateCount,
    };
  });

  const fileName = `${sanitizeRouteForFile(route)}__${width}.png`;
  const screenshotPath = path.join(CAPTURE_DIR, fileName);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  return {
    route,
    breakpoint: width,
    targetUrl,
    finalUrl: page.url(),
    httpStatus: response?.status() ?? null,
    title: metrics.title,
    hasMain: metrics.hasMain,
    hasH1: metrics.hasH1,
    headingText: metrics.headingText,
    interactiveCount: metrics.interactiveCount,
    overflowX: metrics.overflowX,
    authBlocked: metrics.authBlocked,
    emptyStateCount: metrics.emptyStateCount,
    consoleMessages: captureLog.slice(perCaptureConsoleStart),
    networkFailures: networkLog.slice(perCaptureNetworkStart),
    screenshotPath: path.relative(RUN_DIR, screenshotPath),
    captureSucceeded: true,
  };
}

function summarizeFindings(metricsRows) {
  const overflows = metricsRows.filter((row) => row.overflowX);
  const missingHeadings = metricsRows.filter((row) => !row.hasH1);
  const authBlocked = metricsRows.filter((row) => row.authBlocked);
  const weakInteraction = metricsRows.filter((row) => row.interactiveCount < 3);
  const failedStatuses = metricsRows.filter((row) => row.httpStatus && row.httpStatus >= 400);

  const topFindings = [];
  if (authBlocked.length > 0) {
    topFindings.push(`${authBlocked.length} captures remained in sign-in or auth-blocked states.`);
  }
  if (overflows.length > 0) {
    topFindings.push(`${overflows.length} captures reported horizontal overflow.`);
  }
  if (missingHeadings.length > 0) {
    topFindings.push(`${missingHeadings.length} captures were missing a visible main heading.`);
  }
  if (weakInteraction.length > 0) {
    topFindings.push(`${weakInteraction.length} captures had fewer than three interactive controls.`);
  }
  if (failedStatuses.length > 0) {
    topFindings.push(`${failedStatuses.length} captures returned HTTP status 400+.`);
  }
  if (topFindings.length === 0) {
    topFindings.push("No critical layout heuristics were triggered in this capture pass.");
  }
  return topFindings;
}

function scoreIteration(metricsRows) {
  let score = 92;
  score -= metricsRows.filter((row) => row.overflowX).length * 3;
  score -= metricsRows.filter((row) => !row.hasH1).length * 2;
  score -= metricsRows.filter((row) => row.httpStatus && row.httpStatus >= 400).length * 4;
  score -= metricsRows.filter((row) => row.authBlocked).length > 0 ? 2 : 0;
  return Math.max(0, Math.min(99, score));
}

function findingsMarkdown({ runMetadata, metricsRows, topFindings }) {
  const lines = [];
  lines.push(`## ${ITERATION_KEY} / ${PHASE}`);
  lines.push("");
  lines.push(`- Captured at: ${new Date().toISOString()}`);
  lines.push(`- Base URL: ${BASE_URL}`);
  lines.push(`- Auth mode: ${runMetadata.auth?.mode || "unverified"}`);
  lines.push(`- Auth note: ${runMetadata.auth?.message || "No auth note recorded."}`);
  lines.push(`- Breakpoints: ${BREAKPOINTS.join(", ")}`);
  lines.push(`- Routes: ${ROUTES.join(", ")}`);
  lines.push(`- Score: ${scoreIteration(metricsRows)}/100`);
  lines.push("");
  lines.push("### Top findings");
  for (const finding of topFindings) {
    lines.push(`- ${finding}`);
  }
  lines.push("");
  lines.push("### Per-capture notes");
  for (const row of metricsRows) {
    const issues = [];
    if (row.authBlocked) issues.push("auth-blocked");
    if (row.overflowX) issues.push("overflow-x");
    if (!row.hasH1) issues.push("missing-h1");
    if ((row.httpStatus || 0) >= 400) issues.push(`http-${row.httpStatus}`);
    lines.push(
      `- ${row.route} @ ${row.breakpoint}px → ${issues.length ? issues.join(", ") : "no critical heuristic flags"}; screenshot: ${row.screenshotPath}`,
    );
  }
  lines.push("");
  lines.push("### Self-critique");
  lines.push("- Does this still feel like a generic template admin?");
  lines.push("- Are all cards still too visually equal?");
  lines.push("- Is the dashboard focal point obvious?");
  lines.push("- Does the sidebar feel premium, not merely colored?");
  lines.push("- Is typography truly hierarchical, not just resized?");
  lines.push("- Are icons integrated as a system, not merely added?");
  lines.push("- Does Thai text feel natural and readable?");
  lines.push("- What still feels unfinished?");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function run() {
  await fs.mkdir(CAPTURE_DIR, { recursive: true });

  const server = await ensureBaseUrl(BASE_URL);
  const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage"] });
  const context = await browser.newContext();
  const page = await context.newPage();
  const captureLog = [];
  const networkLog = [];
  const runMetadata = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    routes: ROUTES,
    breakpoints: BREAKPOINTS,
    iteration: ITERATION_KEY,
    phase: PHASE,
    serverStartedByHarness: server.started,
    serverLogs: server.logs || [],
    auth: null,
  };

  page.on("console", (message) => {
    captureLog.push({
      type: message.type(),
      text: message.text(),
      location: message.location(),
      url: page.url(),
    });
  });

  page.on("requestfailed", (request) => {
    networkLog.push({
      kind: "requestfailed",
      method: request.method(),
      url: request.url(),
      failure: request.failure(),
      route: page.url(),
    });
  });

  page.on("response", (response) => {
    if (response.status() < 400) return;
    networkLog.push({
      kind: "http-error",
      method: response.request().method(),
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      route: page.url(),
    });
  });

  try {
    await tryLogin(page, runMetadata);

    const metricsRows = [];
    for (const route of ROUTES) {
      for (const width of BREAKPOINTS) {
        try {
          metricsRows.push(await captureRoute(page, route, width, captureLog, networkLog));
        } catch (error) {
          metricsRows.push({
            route,
            breakpoint: width,
            targetUrl: new URL(route, BASE_URL).toString(),
            finalUrl: page.url(),
            httpStatus: null,
            title: "",
            hasMain: false,
            hasH1: false,
            headingText: null,
            interactiveCount: 0,
            overflowX: false,
            authBlocked: false,
            emptyStateCount: 0,
            consoleMessages: [],
            networkFailures: [],
            screenshotPath: null,
            captureSucceeded: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    const metricsFile = await readJson(METRICS_PATH, {});
    metricsFile[PHASE] = metricsRows;
    await writeJson(METRICS_PATH, metricsFile);

    const consoleFile = await readJson(CONSOLE_PATH, {});
    consoleFile[PHASE] = captureLog;
    await writeJson(CONSOLE_PATH, consoleFile);

    const networkFile = await readJson(NETWORK_PATH, {});
    networkFile[PHASE] = networkLog;
    await writeJson(NETWORK_PATH, networkFile);

    const topFindings = summarizeFindings(metricsRows);
    const score = scoreIteration(metricsRows);
    const summary = await readJson(SUMMARY_PATH, {
      runDir: RUN_DIR,
      baseUrl: BASE_URL,
      routes: ROUTES,
      breakpoints: BREAKPOINTS,
      iterations: {},
      topFindings: [],
      verificationStatus: "captured",
    });
    summary.routes = ROUTES;
    summary.breakpoints = BREAKPOINTS;
    summary.updatedAt = new Date().toISOString();
    summary.iterations[ITERATION_KEY] = summary.iterations[ITERATION_KEY] || {};
    summary.iterations[ITERATION_KEY][PHASE] = {
      score,
      auth: runMetadata.auth,
      captures: metricsRows.map((row) => ({
        route: row.route,
        breakpoint: row.breakpoint,
        screenshotPath: row.screenshotPath,
        captureSucceeded: row.captureSucceeded,
        overflowX: row.overflowX,
        hasH1: row.hasH1,
        authBlocked: row.authBlocked,
      })),
    };
    summary.topFindings = topFindings;
    summary.verificationStatus = metricsRows.every((row) => row.captureSucceeded) ? "captured" : "partial";
    await writeJson(SUMMARY_PATH, summary);

    const previousFindings = await fs.readFile(FINDINGS_PATH, "utf-8").catch(() => "# Admin Visual QA Findings\n\n");
    await fs.writeFile(
      FINDINGS_PATH,
      `${previousFindings.replace(/\s*$/, "\n\n")}${findingsMarkdown({ runMetadata, metricsRows, topFindings })}`,
      "utf-8",
    );

    console.log(
      JSON.stringify(
        {
          runDir: RUN_DIR,
          iteration: ITERATION_KEY,
          phase: PHASE,
          score,
          topFindings,
        },
        null,
        2,
      ),
    );
  } finally {
    await context.close();
    await browser.close();
    if (server.child) {
      server.child.kill("SIGTERM");
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
