import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

import { chromium } from "playwright";

const BASE_URL = process.env.PUBLIC_VISUAL_BASE_URL || "http://127.0.0.1:3000";
const READY_PATH = process.env.PUBLIC_VISUAL_READY_PATH || "/api/health";
const DIST_DIR = process.env.PUBLIC_VISUAL_DIST_DIR || ".next_public_visual";
const ARTIFACT_ROOT = path.resolve(
  process.cwd(),
  process.env.PUBLIC_VISUAL_ARTIFACT_DIR || path.join("artifacts", "public-visual-qa"),
);
const ROUTES = parseRoutes(process.env.PUBLIC_VISUAL_ROUTES) || [
  "/th",
  "/th/smart-finder",
  "/th/compare",
  "/th/contact",
  "/th/projects",
];
const BREAKPOINTS = parseBreakpoints(process.env.PUBLIC_VISUAL_BREAKPOINTS) || [768, 1366, 1440, 1920];
const RUN_DIR = process.env.PUBLIC_VISUAL_RUN_DIR
  ? path.resolve(process.cwd(), process.env.PUBLIC_VISUAL_RUN_DIR)
  : path.join(ARTIFACT_ROOT, `run-${formatTimestamp(new Date())}`);
const ITERATION_DIR = path.join(RUN_DIR, "iteration-01");
const CAPTURE_DIR = path.join(ITERATION_DIR, "after");
const SUMMARY_PATH = path.join(RUN_DIR, "summary.json");
const METRICS_PATH = path.join(ITERATION_DIR, "metrics.json");
const CONSOLE_PATH = path.join(ITERATION_DIR, "console.json");
const NETWORK_PATH = path.join(ITERATION_DIR, "network-failures.json");
const PREWARM_ROUTES = String(process.env.PUBLIC_VISUAL_PREWARM || "1") !== "0";

function parseRoutes(raw) {
  const source = String(raw || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => (value.startsWith("/") ? value : `/${value}`));
  return source.length ? [...new Set(source)] : null;
}

function parseBreakpoints(raw) {
  const source = String(raw || "")
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value) && value >= 320);
  return source.length ? [...new Set(source)] : null;
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

function wait(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function ensureBaseUrl(url) {
  const readyUrl = new URL(READY_PATH, url).toString();
  if (await checkUrlReady(readyUrl)) {
    return { started: false, child: null, logs: [] };
  }

  const startupAttempts = Number.parseInt(process.env.PUBLIC_VISUAL_STARTUP_ATTEMPTS || "120", 10) || 120;
  const nextCommand = process.platform === "win32"
    ? path.join(process.cwd(), "node_modules", ".bin", "next.cmd")
    : path.join(process.cwd(), "node_modules", ".bin", "next");
  const port = new URL(url).port || "3000";
  const logs = [];
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

  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));

  for (let attempt = 0; attempt < startupAttempts; attempt += 1) {
    if (await checkUrlReady(readyUrl)) {
      return { started: true, child, logs };
    }
    await wait(1000);
  }

  throw new Error(`public visual qa failed: unable to reach ${readyUrl}\n${logs.join("")}`);
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

async function captureRoute(page, route, width, consoleLog, networkLog) {
  const perCaptureConsoleStart = consoleLog.length;
  const perCaptureNetworkStart = networkLog.length;

  await page.setViewportSize({ width, height: 960 });
  const response = await page.goto(new URL(route, BASE_URL).toString(), { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(900);
  await page.locator("main").first().waitFor({ timeout: 10000 }).catch(() => {});
  await page.waitForFunction(
    () => !document.querySelector('main[aria-busy="true"]'),
    {},
    { timeout: 15000 },
  ).catch(() => {});
  await page.locator("main h1").first().waitFor({ timeout: 15000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

  const metrics = await page.evaluate(() => {
    const heading = document.querySelector("main h1");
    const links = Array.from(document.querySelectorAll("main a, main button")).filter((element) => {
      if (!(element instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });
    return {
      headingText: heading?.textContent?.trim() || null,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      ctaCount: links.length,
    };
  });

  const screenshotPath = path.join(CAPTURE_DIR, `${sanitizeRouteForFile(route)}__${width}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  return {
    route,
    width,
    screenshotPath,
    httpStatus: response?.status() ?? 0,
    headingText: metrics.headingText,
    overflowX: metrics.overflowX,
    ctaCount: metrics.ctaCount,
    consoleMessages: consoleLog.slice(perCaptureConsoleStart),
    networkFailures: networkLog.slice(perCaptureNetworkStart),
  };
}

async function prewarmRoute(page, route) {
  const url = new URL(route, BASE_URL).toString();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(500);
}

function scoreCapture(capture) {
  let score = 100;
  if (capture.httpStatus !== 200) score -= 45;
  if (!capture.headingText) score -= 20;
  if (capture.overflowX) score -= 20;
  if (capture.ctaCount < 2) score -= 10;
  const consoleErrors = capture.consoleMessages.filter((item) => item.type === "error").length;
  if (consoleErrors > 0) score -= Math.min(15, consoleErrors * 5);
  const networkErrors = capture.networkFailures.filter((item) => !String(item.url || "").includes("webpack")).length;
  if (networkErrors.length > 0) score -= Math.min(10, networkErrors.length * 3);
  return Math.max(0, score);
}

async function main() {
  await fs.mkdir(CAPTURE_DIR, { recursive: true });
  const ensured = await ensureBaseUrl(BASE_URL);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleLog = [];
  const networkLog = [];

  page.on("console", (message) => {
    consoleLog.push({
      type: message.type(),
      text: message.text(),
      location: message.location(),
    });
  });

  page.on("requestfailed", (request) => {
    networkLog.push({
      url: request.url(),
      method: request.method(),
      errorText: request.failure()?.errorText ?? "request failed",
    });
  });

  const captures = [];
  try {
    if (PREWARM_ROUTES) {
      for (const route of ROUTES) {
        await prewarmRoute(page, route);
      }
    }

    for (const route of ROUTES) {
      for (const width of BREAKPOINTS) {
        captures.push(await captureRoute(page, route, width, consoleLog, networkLog));
      }
    }
  } finally {
    await browser.close();
    if (ensured.started) {
      await stopServer(ensured.child);
    }
  }

  const metrics = captures.map((capture) => ({
    route: capture.route,
    width: capture.width,
    httpStatus: capture.httpStatus,
    headingText: capture.headingText,
    overflowX: capture.overflowX,
    ctaCount: capture.ctaCount,
    score: scoreCapture(capture),
  }));
  const summary = {
    baseUrl: BASE_URL,
    routes: ROUTES,
    breakpoints: BREAKPOINTS,
    score: Math.round(metrics.reduce((sum, item) => sum + item.score, 0) / Math.max(metrics.length, 1)),
    captures: metrics,
    criticalFindings: metrics.filter((item) => item.httpStatus !== 200 || item.overflowX || !item.headingText),
  };

  await writeJson(SUMMARY_PATH, summary);
  await writeJson(METRICS_PATH, metrics);
  await writeJson(CONSOLE_PATH, consoleLog);
  await writeJson(NETWORK_PATH, networkLog);

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});
