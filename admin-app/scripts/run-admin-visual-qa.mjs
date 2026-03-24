import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

import { chromium } from "playwright";

const BASE_URL = process.env.ADMIN_VISUAL_BASE_URL || "http://127.0.0.1:3000";
const READY_PATH = process.env.ADMIN_VISUAL_READY_PATH || "/api/health";
const DIST_DIR = process.env.ADMIN_VISUAL_DIST_DIR || ".next_visual_qa";
const ARTIFACT_ROOT = path.resolve(
  process.cwd(),
  process.env.ADMIN_VISUAL_ARTIFACT_DIR || path.join("artifacts", "admin-visual-qa"),
);
const DEFAULT_ROUTES = [
  "/admin/dashboard",
  "/admin/domain",
  "/admin/projects",
  "/admin/properties",
  "/admin/areas",
  "/admin/developers",
  "/admin/company",
  "/admin/testimonials",
  "/admin/blog",
  "/admin/review-queue",
  "/admin/videos",
  "/admin/taxonomy",
  "/admin/media",
  "/admin/inquiries",
  "/admin/imports",
  "/admin/users",
  "/admin/seo",
  "/admin/home-composer",
  "/admin/layout",
];
const DEFAULT_LOCALES = ["en", "th"];
const ROUTES = parseRoutes(process.env.ADMIN_VISUAL_ROUTES) || DEFAULT_ROUTES;
const LOCALES = parseLocales(process.env.ADMIN_VISUAL_LOCALES) || DEFAULT_LOCALES;
const BREAKPOINTS = parseBreakpoints(process.env.ADMIN_VISUAL_BREAKPOINTS) || [768, 1024, 1366, 1440];
const VISUAL_EMAIL = process.env.ADMIN_VISUAL_EMAIL || process.env.ADMIN_SMOKE_EMAIL || "";
const VISUAL_PASSWORD = process.env.ADMIN_VISUAL_PASSWORD || process.env.ADMIN_SMOKE_PASSWORD || "";
const RUN_DIR = process.env.ADMIN_VISUAL_RUN_DIR
  ? path.resolve(process.cwd(), process.env.ADMIN_VISUAL_RUN_DIR)
  : path.join(ARTIFACT_ROOT, `run-${formatTimestamp(new Date())}`);
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
const PROJECT_FILES_TO_RESTORE = ["next-env.d.ts", "tsconfig.json"];

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

function parseLocales(raw) {
  const source = String(raw || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value === "en" || value === "th");
  return source.length ? [...new Set(source)] : null;
}

function normalizePhase(value) {
  return value === "after" ? "after" : "before";
}

function formatTimestamp(value) {
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

function withRouteLocale(route, locale) {
  const targetUrl = new URL(route, BASE_URL);
  targetUrl.searchParams.set("lang", locale);
  return targetUrl.toString();
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

async function snapshotProjectFiles() {
  return Promise.all(
    PROJECT_FILES_TO_RESTORE.map(async (relativePath) => {
      const absolutePath = path.join(process.cwd(), relativePath);
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

async function checkUrlReady(url) {
  try {
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(3000) });
    return response.ok || response.status === 307 || response.status === 308;
  } catch {
    return false;
  }
}

async function ensureBaseUrl(url) {
  const readyUrl = new URL(READY_PATH, url).toString();
  if (await checkUrlReady(readyUrl)) {
    return { started: false, child: null, logs: [] };
  }

  const startLogs = [];
  const startupAttempts = Number.parseInt(process.env.ADMIN_VISUAL_STARTUP_ATTEMPTS || "120", 10) || 120;
  const nextCommand = process.platform === "win32"
    ? path.join(process.cwd(), "node_modules", ".bin", "next.cmd")
    : path.join(process.cwd(), "node_modules", ".bin", "next");
  const port = new URL(url).port || "3000";
  const child = spawn(nextCommand, ["dev", "-p", port], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXT_LOCAL_FONT_FALLBACK: process.env.NEXT_LOCAL_FONT_FALLBACK || "1",
      NEXT_LOCAL_DIST_DIR: process.env.NEXT_LOCAL_DIST_DIR || DIST_DIR,
    },
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => startLogs.push(String(chunk)));
  child.stderr.on("data", (chunk) => startLogs.push(String(chunk)));

  for (let attempt = 0; attempt < startupAttempts; attempt += 1) {
    if (await checkUrlReady(readyUrl)) {
      return { started: true, child, logs: startLogs };
    }
    await wait(1000);
  }

  throw new Error(`admin visual qa failed: unable to reach ${readyUrl}\n${startLogs.join("")}`);
}

function wait(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
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
  if (!child) return;

  if (child.exitCode !== null) {
    return;
  }

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
  if (exitedGracefully || child.exitCode !== null) {
    return;
  }

  try {
    child.kill("SIGKILL");
  } catch {
    return;
  }

  await waitForChildExit(child, 5000);
}

async function tryLogin(page, runMetadata) {
  if (!VISUAL_EMAIL || !VISUAL_PASSWORD) {
    runMetadata.auth = {
      mode: "blocked-no-credentials",
      message: "No admin visual credentials were provided; captures may remain on sign-in states.",
    };
    return;
  }

  await page.goto(withRouteLocale("/admin/dashboard", LOCALES[0] || "en"), {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
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

async function captureRoute(page, route, locale, width, captureLog, networkLog) {
  const targetUrl = withRouteLocale(route, locale);
  const perCaptureConsoleStart = captureLog.length;
  const perCaptureNetworkStart = networkLog.length;

  await page.setViewportSize({ width, height: 960 });
  const response = await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(900);
  await page.locator("main").first().waitFor({ timeout: 10000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready.catch(() => {});
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(250);

  const metrics = await page.evaluate(() => {
    function isVisible(element) {
      if (!(element instanceof HTMLElement)) return false;
      if (element.closest('[aria-hidden="true"]')) return false;
      const style = window.getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }

    function hasStoredSessionToken() {
      try {
        const raw = window.sessionStorage.getItem("flowbiz_admin_auth_session_v1");
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        return typeof parsed?.token === "string" && parsed.token.trim().length > 0;
      } catch {
        return false;
      }
    }

    const body = document.body;
    const main = document.querySelector("main");
    const heading = main?.querySelector("h1") || document.querySelector("h1");
    const interactiveCount = document.querySelectorAll("button, a[href], input, select, textarea").length;
    const hasStoredSession = hasStoredSessionToken();
    const hasVisibleAuthEmail = Array.from(
      document.querySelectorAll("#dashboard-login-email, input[id$='login-email'], input[autocomplete='username']"),
    ).some(isVisible);
    const hasVisibleAuthPassword = Array.from(
      document.querySelectorAll("#dashboard-login-password, input[id$='login-password'], input[autocomplete='current-password']"),
    ).some(isVisible);
    const hasVisibleSignInButton = Array.from(document.querySelectorAll("button, [role='button'], input[type='submit']")).some(
      (element) => {
        if (!(element instanceof HTMLElement) || !isVisible(element)) return false;
        const buttonText =
          "value" in element && typeof element.value === "string" && element.value
            ? element.value
            : element.textContent || "";
        return /sign in|เข้าสู่ระบบ/i.test(buttonText);
      },
    );
    const hasVisibleAuthNotice = Array.from(
      document.querySelectorAll("main [role='status'], main [role='alert'], main p, main strong, main h2, main h3"),
    ).some((element) => {
      if (!(element instanceof HTMLElement) || !isVisible(element)) return false;
      return /sign in is required|admin sign in|กรุณาเข้าสู่ระบบ|ต้องเข้าสู่ระบบ/i.test(element.textContent || "");
    });
    const overflowElements = Array.from(document.querySelectorAll("main *")).filter((element) => {
      if (!(element instanceof HTMLElement) || !isVisible(element)) return false;
      const rect = element.getBoundingClientRect();
      return rect.left < -8 || rect.right > window.innerWidth + 8;
    });
    const authBlocked = (hasVisibleAuthEmail && hasVisibleAuthPassword && hasVisibleSignInButton) || (!hasStoredSession && hasVisibleAuthNotice);
    const emptyStateCount = document.querySelectorAll(
      ".state-empty, .state-loading, .dashboard-section-state, [data-empty-state], [role='status'], [role='alert']",
    ).length;
    return {
      title: document.title || "",
      hasMain: Boolean(main),
      hasH1: Boolean(heading),
      headingText: heading?.textContent?.trim() || null,
      interactiveCount,
      overflowX: overflowElements.length > 0,
      authBlocked,
      emptyStateCount,
    };
  });

  const fileName = `${sanitizeRouteForFile(route)}__${locale}__${width}.png`;
  const screenshotPath = path.join(CAPTURE_DIR, fileName);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  return {
    route,
    locale,
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
  let score = 88;
  score -= metricsRows.filter((row) => row.overflowX).length * 3;
  score -= metricsRows.filter((row) => !row.hasH1).length * 2;
  score -= metricsRows.filter((row) => row.httpStatus && row.httpStatus >= 400).length * 4;
  score -= metricsRows.filter((row) => row.authBlocked).length > 0 ? 2 : 0;
  score -= metricsRows.filter((row) => row.networkFailures?.some((failure) => failure.kind === "http-error")).length * 2;
  score -= metricsRows.filter((row) => (row.consoleMessages || []).some((message) => message.type === "error" || message.type === "warning")).length * 2;

  if (metricsRows.length > 0 && metricsRows.every((row) => row.captureSucceeded)) score += 2;
  if (metricsRows.length > 0 && metricsRows.every((row) => row.httpStatus && row.httpStatus < 400)) score += 2;
  if (metricsRows.length > 0 && metricsRows.every((row) => !row.overflowX)) score += 2;
  if (metricsRows.length > 0 && metricsRows.every((row) => !row.authBlocked)) score += 2;
  if (metricsRows.length > 0 && metricsRows.every((row) => (row.networkFailures || []).filter((failure) => failure.kind === "http-error").length === 0)) score += 1;

  const averageInteractiveCount = metricsRows.length
    ? metricsRows.reduce((sum, row) => sum + (row.interactiveCount || 0), 0) / metricsRows.length
    : 0;
  const averageEmptyStates = metricsRows.length
    ? metricsRows.reduce((sum, row) => sum + (row.emptyStateCount || 0), 0) / metricsRows.length
    : 0;

  if (averageInteractiveCount >= 40) score += 1;
  if (averageEmptyStates <= 4) score += 1;
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
  lines.push(`- Locales: ${LOCALES.join(", ")}`);
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
      `- ${row.route} [${row.locale}] @ ${row.breakpoint}px → ${issues.length ? issues.join(", ") : "no critical heuristic flags"}; screenshot: ${row.screenshotPath}`,
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
  const projectFileSnapshot = await snapshotProjectFiles();

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
    locales: LOCALES,
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
      for (const locale of LOCALES) {
        for (const width of BREAKPOINTS) {
          try {
            metricsRows.push(await captureRoute(page, route, locale, width, captureLog, networkLog));
          } catch (error) {
            metricsRows.push({
              route,
              locale,
              breakpoint: width,
              targetUrl: withRouteLocale(route, locale),
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
      locales: LOCALES,
      breakpoints: BREAKPOINTS,
      iterations: {},
      topFindings: [],
      verificationStatus: "captured",
    });
    summary.routes = ROUTES;
    summary.locales = LOCALES;
    summary.breakpoints = BREAKPOINTS;
    summary.updatedAt = new Date().toISOString();
    summary.iterations[ITERATION_KEY] = summary.iterations[ITERATION_KEY] || {};
    summary.iterations[ITERATION_KEY][PHASE] = {
      score,
      auth: runMetadata.auth,
      captures: metricsRows.map((row) => ({
        route: row.route,
        locale: row.locale,
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
    await stopServer(server.child);
    await restoreProjectFiles(projectFileSnapshot);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
