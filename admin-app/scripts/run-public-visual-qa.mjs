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
  "/en",
  "/en/projects",
  "/en/buy",
  "/en/contact",
  "/en/smart-finder",
  "/en/compare",
  "/th",
  "/th/projects",
  "/th/buy",
  "/th/contact",
  "/th/smart-finder",
  "/th/compare",
];
const BREAKPOINTS = parseBreakpoints(process.env.PUBLIC_VISUAL_BREAKPOINTS) || [390, 430, 768, 1366, 1440];
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
const INCLUDE_DETAIL_ROUTES = String(process.env.PUBLIC_VISUAL_INCLUDE_DETAIL_ROUTES || "1") !== "0";
const PROJECT_SLUG_OVERRIDE = normalizeSlug(process.env.PUBLIC_VISUAL_PROJECT_SLUG);
const PROPERTY_SLUG_OVERRIDE = normalizeSlug(process.env.PUBLIC_VISUAL_PROPERTY_SLUG);
const PROJECT_SLUG_FALLBACK = normalizeSlug(process.env.PUBLIC_VISUAL_PROJECT_FALLBACK_SLUG) || "visual-qa-project";
const PROPERTY_SLUG_FALLBACK = normalizeSlug(process.env.PUBLIC_VISUAL_PROPERTY_FALLBACK_SLUG) || "visual-qa-property";
const SCREENSHOT_REVIEW_FILE = process.env.PUBLIC_VISUAL_REVIEW_FILE
  ? path.resolve(process.cwd(), process.env.PUBLIC_VISUAL_REVIEW_FILE)
  : null;
const PROJECT_FILES_TO_RESTORE = ["next-env.d.ts", "tsconfig.json"];
const SCORE_MODEL_VERSION = "public-visual-qa-v3";
const SCORE_DIMENSIONS = [
  { key: "runtimeHealth", label: "Runtime Health", weight: 14 },
  { key: "layoutIntegrity", label: "Layout Integrity", weight: 10 },
  { key: "semanticsAndLandmarks", label: "Semantics And Landmarks", weight: 7 },
  { key: "interactionReadiness", label: "Interaction Readiness", weight: 7 },
  { key: "mobileSafety", label: "Mobile Safety", weight: 10 },
  { key: "mediaStability", label: "Media Stability", weight: 8 },
  { key: "contentClarity", label: "Content Clarity", weight: 7 },
  { key: "localeIntegrity", label: "Locale Integrity", weight: 5 },
  { key: "typographyMetrics", label: "Typography Metrics", weight: 10 },
  { key: "spacingRhythm", label: "Spacing Rhythm", weight: 8 },
  { key: "ctaHierarchy", label: "CTA Hierarchy", weight: 7 },
  { key: "sectionAwareHomepage", label: "Section Aware Homepage", weight: 7 },
];
const SCORE_THRESHOLDS = {
  elite: 97,
  strong: 92,
  passing: 85,
  watch: 75,
};

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

function normalizeSlug(value) {
  const normalized = String(value || "").trim();
  return normalized.length > 0 ? normalized : null;
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

function uniqueRoutes(routes) {
  return [...new Set(routes.filter(Boolean))];
}

function sanitizeRouteForFile(route) {
  return route.replace(/^\//, "").replace(/\//g, "__").replace(/[^a-zA-Z0-9_-]/g, "-");
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) return null;
  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) return null;
  return response.json();
}

function extractFirstRoute(markup, expression) {
  const match = String(markup || "").match(expression);
  if (!match?.[0]) return null;
  return match[0].replace(/&amp;/g, "&");
}

function pickFirstProjectSlug(payload) {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
        ? payload.items
        : [];
  const item = items.find((entry) => typeof entry?.slug === "string" && entry.slug.trim());
  return item?.slug ? String(item.slug).trim() : null;
}

function pickFirstPropertySlug(payload) {
  const items = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : [];
  const item = items.find((entry) => typeof entry?.slug === "string" && entry.slug.trim());
  return item?.slug ? String(item.slug).trim() : null;
}

async function resolveLiveDetailRoutes(baseUrl) {
  if (!INCLUDE_DETAIL_ROUTES) {
    return { routes: [], sources: { project: "disabled", property: "disabled" } };
  }

  const locales = ["en", "th"];
  const resolved = [];
  const sources = {
    project: PROJECT_SLUG_OVERRIDE ? "override" : "unavailable",
    property: PROPERTY_SLUG_OVERRIDE ? "override" : "unavailable",
  };
  const projectPayload = await fetchJson(new URL("/api/v1/projects?limit=1&status_filter=published", baseUrl).toString()).catch(() => null);
  const propertyPayload = await fetchJson(new URL("/api/v1/properties/?limit=1&sort=newest", baseUrl).toString()).catch(() => null);
  const apiProjectSlug = pickFirstProjectSlug(projectPayload);
  const apiPropertySlug = pickFirstPropertySlug(propertyPayload);

  for (const locale of locales) {
    let projectSlug = PROJECT_SLUG_OVERRIDE;
    if (!projectSlug && apiProjectSlug) {
      projectSlug = apiProjectSlug;
      sources.project = "resolved";
    }
    if (!projectSlug) {
      const projectRouteFromMarkup = extractFirstRoute(
        await fetchText(new URL(`/${locale}/projects`, baseUrl).toString()).catch(() => null),
        new RegExp(`/${locale}/projects/[a-z0-9%_-]+`, "i"),
      );
      if (projectRouteFromMarkup) {
        projectSlug = String(projectRouteFromMarkup.split("/").pop() || "").trim();
        sources.project = "resolved";
      }
    }
    if (!projectSlug) {
      projectSlug = PROJECT_SLUG_FALLBACK;
      sources.project = "fallback";
    }
    const projectRoute = projectSlug
      ? `/${locale}/projects/${encodeURIComponent(projectSlug)}`
      : null;
    if (projectRoute) {
      resolved.push(projectRoute);
    }

    let propertySlug = PROPERTY_SLUG_OVERRIDE;
    if (!propertySlug && apiPropertySlug) {
      propertySlug = apiPropertySlug;
      sources.property = "resolved";
    }
    if (!propertySlug) {
      for (const sourceRoute of [`/${locale}/buy`, `/${locale}/rent`, `/${locale}`]) {
        const sourceMarkup = await fetchText(new URL(sourceRoute, baseUrl).toString()).catch(() => null);
        const propertyRouteFromMarkup = extractFirstRoute(sourceMarkup, new RegExp(`/${locale}/property/[a-z0-9%_-]+`, "i"));
        if (propertyRouteFromMarkup) {
          propertySlug = String(propertyRouteFromMarkup.split("/").pop() || "").trim();
          sources.property = "resolved";
          break;
        }
      }
    }
    if (!propertySlug) {
      propertySlug = PROPERTY_SLUG_FALLBACK;
      sources.property = "fallback";
    }
    const propertyRoute = propertySlug
      ? `/${locale}/property/${encodeURIComponent(propertySlug)}`
      : null;
    if (propertyRoute) {
      resolved.push(propertyRoute);
    }
  }

  return { routes: uniqueRoutes(resolved), sources };
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function normalizeChecklistStatus(value) {
  if (value === "pass" || value === "warn" || value === "fail") return value;
  return "warn";
}

function normalizeReviewRoute(value) {
  const route = String(value || "").trim();
  if (!route) return null;
  return route.startsWith("/") ? route : `/${route}`;
}

function normalizeReviewWidth(value) {
  if (value == null || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildChecklistItem(id, area, status, message, evidence = {}, meta = {}) {
  return {
    id,
    area,
    status,
    message,
    evidence,
    source: meta.source || "automated",
    reviewer: meta.reviewer || null,
  };
}

function normalizeManualChecklistItem(item, index, reviewer) {
  const normalized = item && typeof item === "object" ? item : {};
  return buildChecklistItem(
    String(normalized.id || `manual_review_${index + 1}`).trim(),
    String(normalized.area || "Manual Review").trim(),
    normalizeChecklistStatus(normalized.status),
    String(normalized.message || "Manual screenshot review note.").trim(),
    normalized.evidence && typeof normalized.evidence === "object" ? normalized.evidence : {},
    { source: "manual", reviewer },
  );
}

async function loadManualScreenshotReviews() {
  if (!SCREENSHOT_REVIEW_FILE) return [];

  let parsed;
  try {
    parsed = JSON.parse(await fs.readFile(SCREENSHOT_REVIEW_FILE, "utf-8"));
  } catch (error) {
    throw new Error(
      `Unable to load manual screenshot review file at ${SCREENSHOT_REVIEW_FILE}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const captures = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.captures)
      ? parsed.captures
      : [];
  const defaultReviewer = typeof parsed?.reviewer === "string" ? parsed.reviewer.trim() : null;

  return captures.flatMap((entry, index) => {
    if (!entry || typeof entry !== "object") return [];
    const route = normalizeReviewRoute(entry.route);
    const width = normalizeReviewWidth(entry.width);
    const reviewer = typeof entry.reviewer === "string" && entry.reviewer.trim() ? entry.reviewer.trim() : defaultReviewer;
    const items = Array.isArray(entry.checklist)
      ? entry.checklist
      : Array.isArray(entry.items)
        ? entry.items
        : [];
    if (!route || items.length === 0) return [];
    return [{
      key: `${route}|${width ?? "all"}|${index}`,
      route,
      width,
      checklist: items.map((item, itemIndex) => normalizeManualChecklistItem(item, itemIndex, reviewer)),
    }];
  });
}

function attachManualChecklist(capture, manualReviews) {
  const matches = manualReviews.filter((entry) => entry.route === capture.route && (entry.width == null || entry.width === capture.width));
  return {
    ...capture,
    manualChecklist: matches.flatMap((entry) => entry.checklist),
    matchedManualReviewKeys: matches.map((entry) => entry.key),
  };
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

async function cleanupVisualDistDir() {
  const absolutePath = path.join(process.cwd(), DIST_DIR);
  await fs.rm(absolutePath, { recursive: true, force: true }).catch(() => undefined);
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

function shouldIgnoreRequestFailure(request) {
  const errorText = request.failure()?.errorText ?? "request failed";
  if (errorText === "net::ERR_ABORTED") return true;
  return false;
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
    const HOMEPAGE_SECTION_DEFS = [
      { key: "hero", selector: ".home-hero-section", anchorSelector: ".home-hero-slider__panel" },
      { key: "pathways", selector: ".home-pathways-section", anchorSelector: ".home-pathways-shell" },
      { key: "trust", selector: ".home-trust-layer-section", anchorSelector: ".home-trust-snapshot" },
      { key: "curated", selector: ".home-curated-opportunities", anchorSelector: ".home-curated-shell" },
      { key: "market", selector: ".home-market-section", anchorSelector: ".home-market-shell" },
      { key: "owner", selector: ".home-owner-section", anchorSelector: ".home-owner-shell" },
      { key: "bottomCta", selector: ".home-bottom-cta", anchorSelector: ".home-bottom-cta__grid" },
    ];

    function parsePx(value, fallback = 0) {
      const parsed = Number.parseFloat(String(value || ""));
      return Number.isFinite(parsed) ? parsed : fallback;
    }

    function isVisible(element) {
      if (!(element instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }

    function isInViewport(element) {
      if (!(element instanceof HTMLElement)) return false;
      const rect = element.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    }

    function toDocumentRect(element) {
      if (!(element instanceof HTMLElement)) return null;
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top + window.scrollY,
        bottom: rect.bottom + window.scrollY,
        width: rect.width,
        height: rect.height,
      };
    }

    function readTextMetrics(element) {
      if (!(element instanceof HTMLElement) || !isVisible(element)) return null;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const fontSize = parsePx(style.fontSize);
      const lineHeight = parsePx(style.lineHeight, fontSize * 1.2);
      const fontWeight = Number.parseInt(style.fontWeight, 10);
      return {
        fontSize,
        lineHeight,
        lineHeightRatio: fontSize > 0 ? lineHeight / fontSize : 0,
        fontWeight: Number.isFinite(fontWeight) ? fontWeight : null,
        width: rect.width,
        height: rect.height,
        measureRatio: fontSize > 0 ? rect.width / fontSize : 0,
      };
    }

    function readPaddingMetrics(selector, limit = 4) {
      return Array.from(document.querySelectorAll(selector))
        .filter(isVisible)
        .slice(0, limit)
        .map((element) => {
          const style = window.getComputedStyle(element);
          return {
            paddingTop: parsePx(style.paddingTop),
            paddingRight: parsePx(style.paddingRight),
            paddingBottom: parsePx(style.paddingBottom),
            paddingLeft: parsePx(style.paddingLeft),
          };
        });
    }

    function readTextMetricSamples(selector, limit = 12) {
      return Array.from(document.querySelectorAll(selector))
        .filter(isVisible)
        .slice(0, limit)
        .map((element) => readTextMetrics(element))
        .filter(Boolean);
    }

    function queryFirstVisible(selectors) {
      for (const selector of selectors) {
        const match = Array.from(document.querySelectorAll(selector)).find(isVisible);
        if (match) return match;
      }
      return null;
    }

    const main = document.querySelector("main");
    const heading = document.querySelector("main h1");
    const headings = Array.from(document.querySelectorAll("main h1, main h2, main h3")).filter(isVisible);
    const interactive = Array.from(document.querySelectorAll("main a, main button, main [role='button']")).filter(isVisible);
    const interactiveInViewport = interactive.filter(isInViewport);
    const smallTapTargets = interactive.filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width < 44 || rect.height < 44;
    });
    const paragraphsInViewport = Array.from(document.querySelectorAll("main p, main li")).filter(isVisible).filter(isInViewport);
    const headingInViewport = heading ? isInViewport(heading) : false;
    const headingsInViewport = headings.filter(isInViewport);
    const visibleImages = Array.from(document.querySelectorAll("main img")).filter((image) => {
      if (!(image instanceof HTMLImageElement)) return false;
      return isVisible(image) && isInViewport(image);
    });
    const visibleBrokenImages = visibleImages.filter((image) => image.complete && image.naturalWidth === 0);
    const visibleIncompleteImages = visibleImages.filter((image) => !image.complete || image.naturalWidth === 0);
    const isHomepage = Boolean(document.querySelector("main.home-page"));
    const heroTitleElement = queryFirstVisible([
      "main .home-hero-slider__title",
      "main .public-hero__headline",
      "main #property-hero h1",
      "main h1",
    ]);
    const heroSubtitleElement = queryFirstVisible([
      "main .home-hero-slider__subtitle",
      "main .public-hero__subtitle",
      "main #property-hero .section-subtitle",
      "main #property-hero .property-location",
      "main .section-subtitle",
      "main p",
    ]);
    const heroTitleMetrics = readTextMetrics(heroTitleElement);
    const heroSubtitleMetrics = readTextMetrics(heroSubtitleElement);
    const sectionTitleMetrics = readTextMetricSamples("main.home-page .section-title", 16);
    const bodyTextMetrics = readTextMetricSamples("main.home-page p", 24);
    const heroPrimary = Array.from(document.querySelectorAll(".home-hero-slider .hero-cta--primary")).filter(isVisible);
    const heroSecondary = Array.from(document.querySelectorAll(".home-hero-slider .hero-cta--secondary")).filter(isVisible);
    const heroActionItems = Array.from(document.querySelectorAll(".home-hero-slider .hero-cta-row a, .home-hero-slider .hero-cta-row button")).filter(isVisible);
    const bottomCtaActions = Array.from(document.querySelectorAll(".home-bottom-cta__actions a, .home-bottom-cta__actions button")).filter(isVisible);
    const homepageSections = HOMEPAGE_SECTION_DEFS
      .map((entry) => {
        const element = document.querySelector(entry.selector);
        if (!(element instanceof HTMLElement) || !isVisible(element)) {
          return { key: entry.key, selector: entry.selector, present: false };
        }
        const anchorCandidate = entry.anchorSelector
          ? element.querySelector(entry.anchorSelector)
          : null;
        const anchor = anchorCandidate instanceof HTMLElement && isVisible(anchorCandidate)
          ? anchorCandidate
          : element;
        const style = window.getComputedStyle(element);
        const rect = toDocumentRect(element);
        const header = element.querySelector(".section-header");
        return {
          key: entry.key,
          selector: entry.selector,
          present: true,
          rect,
          anchorRect: toDocumentRect(anchor),
          sectionPaddingTop: parsePx(style.paddingTop),
          sectionPaddingBottom: parsePx(style.paddingBottom),
          hasSectionHeader: Boolean(header && isVisible(header)),
          inViewport: isInViewport(element),
        };
      });
    const visibleHomepageSections = homepageSections
      .filter((entry) => entry.present && entry.rect)
      .sort((left, right) => (left.anchorRect?.top ?? left.rect.top) - (right.anchorRect?.top ?? right.rect.top));
    const homepageSectionGaps = visibleHomepageSections.slice(1).map((entry, index) => {
      const previous = visibleHomepageSections[index];
      return {
        from: previous.key,
        to: entry.key,
        gap: Math.max(0, (entry.anchorRect?.top ?? entry.rect.top) - (previous.anchorRect?.bottom ?? previous.rect.bottom)),
      };
    });
    const sectionHeaderCoverage = homepageSections.filter((entry) => entry.present && entry.hasSectionHeader).length;
    const cardPaddingSamples = {
      heroPanel: readPaddingMetrics(".home-hero-slider__panel"),
      pathwayCard: readPaddingMetrics(".home-pathway-card"),
      projectCardBody: readPaddingMetrics(".premium-project-card__body"),
      unitCardBody: readPaddingMetrics(".premium-investment-card .card-content"),
      marketCard: readPaddingMetrics(".home-market-card"),
      ownerCard: readPaddingMetrics(".home-owner-card"),
      bottomCtaPanel: readPaddingMetrics(".home-bottom-cta__panel"),
    };

    return {
      htmlLang: document.documentElement.lang?.trim() || null,
      hasMain: Boolean(main),
      headingText: heading?.textContent?.trim() || null,
      headingLength: heading?.textContent?.trim().length || 0,
      headingInViewport,
      h1Count: document.querySelectorAll("main h1").length,
      sectionHeadingCount: headings.filter((node) => node.tagName === "H2" || node.tagName === "H3").length,
      headingsInViewport: headingsInViewport.length,
      paragraphsInViewport: paragraphsInViewport.length,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      ctaCount: interactive.length,
      interactiveCount: interactive.length,
      aboveFoldInteractiveCount: interactiveInViewport.length,
      smallTapTargetCount: smallTapTargets.length,
      visibleImageCount: visibleImages.length,
      visibleBrokenImageCount: visibleBrokenImages.length,
      visibleIncompleteImageCount: visibleIncompleteImages.length,
      isHomepage,
      heroTitleMetrics,
      heroSubtitleMetrics,
      sectionTitleMetrics,
      bodyTextMetrics,
      heroPrimaryCount: heroPrimary.length,
      heroSecondaryCount: heroSecondary.length,
      heroActionCount: heroActionItems.length,
      heroPrimaryInViewport: heroPrimary.some(isInViewport),
      heroSecondaryInViewport: heroSecondary.some(isInViewport),
      heroWhatsAppVisible: Boolean(document.querySelector(".home-hero-slider__support-link")),
      heroMetaBarPresent: Boolean(document.querySelector(".home-hero-slider__meta-bar")),
      bottomCtaActionCount: bottomCtaActions.length,
      bottomCtaFormPanelPresent: Boolean(document.querySelector(".home-bottom-cta__panel")),
      segmentationNotePresent: Boolean(document.querySelector(".home-curated-opportunities .home-segmentation-note")),
      curatedEmptyStatePresent: Boolean(document.querySelector(".home-curated-empty, .home-curated-opportunities .home-project-empty")),
      projectCardCount: document.querySelectorAll(".home-curated-opportunities .premium-project-card").length,
      unitGroupCount: document.querySelectorAll(".home-curated-opportunities .home-unit-group").length,
      ownerCardCount: document.querySelectorAll(".home-owner-card").length,
      homepageSections,
      homepageSectionGaps,
      sectionHeaderCoverage,
      cardPaddingSamples,
    };
  });

  const screenshotPath = path.join(CAPTURE_DIR, `${sanitizeRouteForFile(route)}__${width}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  return {
    route,
    width,
    screenshotPath,
    httpStatus: response?.status() ?? 0,
    htmlLang: metrics.htmlLang,
    hasMain: metrics.hasMain,
    headingText: metrics.headingText,
    headingLength: metrics.headingLength,
    headingInViewport: metrics.headingInViewport,
    h1Count: metrics.h1Count,
    sectionHeadingCount: metrics.sectionHeadingCount,
    headingsInViewport: metrics.headingsInViewport,
    paragraphsInViewport: metrics.paragraphsInViewport,
    overflowX: metrics.overflowX,
    ctaCount: metrics.ctaCount,
    interactiveCount: metrics.interactiveCount,
    aboveFoldInteractiveCount: metrics.aboveFoldInteractiveCount,
    smallTapTargetCount: metrics.smallTapTargetCount,
    visibleImageCount: metrics.visibleImageCount,
    visibleBrokenImageCount: metrics.visibleBrokenImageCount,
    visibleIncompleteImageCount: metrics.visibleIncompleteImageCount,
    isHomepage: metrics.isHomepage,
    heroTitleMetrics: metrics.heroTitleMetrics,
    heroSubtitleMetrics: metrics.heroSubtitleMetrics,
    sectionTitleMetrics: metrics.sectionTitleMetrics,
    bodyTextMetrics: metrics.bodyTextMetrics,
    heroPrimaryCount: metrics.heroPrimaryCount,
    heroSecondaryCount: metrics.heroSecondaryCount,
    heroActionCount: metrics.heroActionCount,
    heroPrimaryInViewport: metrics.heroPrimaryInViewport,
    heroSecondaryInViewport: metrics.heroSecondaryInViewport,
    heroWhatsAppVisible: metrics.heroWhatsAppVisible,
    heroMetaBarPresent: metrics.heroMetaBarPresent,
    bottomCtaActionCount: metrics.bottomCtaActionCount,
    bottomCtaFormPanelPresent: metrics.bottomCtaFormPanelPresent,
    segmentationNotePresent: metrics.segmentationNotePresent,
    curatedEmptyStatePresent: metrics.curatedEmptyStatePresent,
    projectCardCount: metrics.projectCardCount,
    unitGroupCount: metrics.unitGroupCount,
    ownerCardCount: metrics.ownerCardCount,
    homepageSections: metrics.homepageSections,
    homepageSectionGaps: metrics.homepageSectionGaps,
    sectionHeaderCoverage: metrics.sectionHeaderCoverage,
    cardPaddingSamples: metrics.cardPaddingSamples,
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundToTenths(value) {
  return Math.round(value * 10) / 10;
}

function resolveLocaleFromRoute(route) {
  const match = String(route || "").match(/^\/(en|th)(?:\/|$)/i);
  return match?.[1]?.toLowerCase() || null;
}

function resolveScoreRating(score) {
  if (score >= SCORE_THRESHOLDS.elite) return "elite";
  if (score >= SCORE_THRESHOLDS.strong) return "strong";
  if (score >= SCORE_THRESHOLDS.passing) return "passing";
  if (score >= SCORE_THRESHOLDS.watch) return "watch";
  return "failing";
}

function severityRank(severity) {
  if (severity === "critical") return 4;
  if (severity === "major") return 3;
  if (severity === "minor") return 2;
  return 1;
}

function actionableNetworkFailures(capture) {
  return (capture.networkFailures || []).filter((item) => !String(item.url || "").includes("webpack"));
}

function consoleCounts(capture) {
  const messages = capture.consoleMessages || [];
  return {
    error: messages.filter((item) => item.type === "error").length,
    warning: messages.filter((item) => item.type === "warning").length,
  };
}

function average(values) {
  const normalized = values.filter((value) => Number.isFinite(value));
  if (!normalized.length) return 0;
  return normalized.reduce((sum, value) => sum + value, 0) / normalized.length;
}

function median(values) {
  const normalized = values.filter((value) => Number.isFinite(value)).sort((left, right) => left - right);
  if (!normalized.length) return 0;
  const midpoint = Math.floor(normalized.length / 2);
  if (normalized.length % 2 === 0) {
    return (normalized[midpoint - 1] + normalized[midpoint]) / 2;
  }
  return normalized[midpoint];
}

function max(values) {
  const normalized = values.filter((value) => Number.isFinite(value));
  return normalized.length ? Math.max(...normalized) : 0;
}

function min(values) {
  const normalized = values.filter((value) => Number.isFinite(value));
  return normalized.length ? Math.min(...normalized) : 0;
}

function nearestScaleDelta(value) {
  const scale = [8, 12, 16, 24, 32, 48, 64, 80, 96, 112, 128, 160];
  return Math.min(...scale.map((candidate) => Math.abs(candidate - value)));
}

function summarizeTextMetrics(samples) {
  const series = Array.isArray(samples) ? samples : [];
  return {
    fontSizes: series.map((item) => item?.fontSize).filter((value) => Number.isFinite(value)),
    lineHeightRatios: series.map((item) => item?.lineHeightRatio).filter((value) => Number.isFinite(value)),
    measureRatios: series.map((item) => item?.measureRatio).filter((value) => Number.isFinite(value)),
  };
}

function summarizePaddingSamples(sampleGroups) {
  const groups = Object.values(sampleGroups || {}).flatMap((items) => Array.isArray(items) ? items : []);
  const paddingY = groups.flatMap((item) => [item?.paddingTop, item?.paddingBottom]).filter((value) => Number.isFinite(value));
  const paddingX = groups.flatMap((item) => [item?.paddingLeft, item?.paddingRight]).filter((value) => Number.isFinite(value));
  return {
    paddingY,
    paddingX,
  };
}

function buildHomepageChecklist(capture) {
  if (!capture.isHomepage) return [];

  const sectionKeys = (capture.homepageSections || []).filter((item) => item.present).map((item) => item.key);
  const expectedOrder = ["hero", "pathways", "trust", "curated", "market", "owner", "bottomCta"];
  const ordered = expectedOrder.every((key, index) => sectionKeys.indexOf(key) === -1 || sectionKeys.indexOf(key) >= index);
  const ownerGap = (capture.homepageSectionGaps || []).find((item) => item.from === "owner" && item.to === "bottomCta")?.gap ?? null;

  const items = [
    buildChecklistItem(
      "hero_first_viewport",
      "Above The Fold",
      capture.headingInViewport && capture.heroActionCount >= 2 && capture.heroPrimaryInViewport ? "pass" : "fail",
      capture.headingInViewport && capture.heroActionCount >= 2 && capture.heroPrimaryInViewport
        ? "Hero keeps the H1 and primary CTA visible in the first viewport."
        : "Hero does not keep the H1 and CTA hierarchy clear in the first viewport.",
      { headingInViewport: capture.headingInViewport, heroActionCount: capture.heroActionCount, heroPrimaryInViewport: capture.heroPrimaryInViewport },
    ),
    buildChecklistItem(
      "trust_after_hero",
      "Hero To Trust",
      sectionKeys.includes("trust") ? "pass" : "warn",
      sectionKeys.includes("trust")
        ? "Trust snapshot remains present in the early homepage sequence."
        : "Trust snapshot is missing from the homepage sequence.",
      { sections: sectionKeys },
    ),
    buildChecklistItem(
      "section_order",
      "Section Rhythm",
      ordered ? "pass" : "fail",
      ordered
        ? "Homepage sections follow the expected advisory narrative order."
        : "Homepage sections do not follow the expected advisory narrative order.",
      { sections: sectionKeys },
    ),
    buildChecklistItem(
      "curated_split",
      "Curated Stack",
      capture.curatedEmptyStatePresent
        ? "pass"
        : capture.projectCardCount > 0 && capture.unitGroupCount > 0 && capture.segmentationNotePresent
          ? "pass"
          : capture.projectCardCount > 0 || capture.unitGroupCount > 0
            ? "warn"
            : "fail",
      capture.curatedEmptyStatePresent
        ? "Curated section falls back to a single empty-state path without breaking the homepage narrative."
        : capture.projectCardCount > 0 && capture.unitGroupCount > 0 && capture.segmentationNotePresent
        ? "Curated stack separates launches and ready units with a shared transition note."
        : capture.projectCardCount > 0 || capture.unitGroupCount > 0
          ? "Curated stack does not fully express the projects-to-units split."
          : "Curated section is missing both grouped content and the expected empty-state fallback.",
      {
        projectCardCount: capture.projectCardCount,
        unitGroupCount: capture.unitGroupCount,
        segmentationNotePresent: capture.segmentationNotePresent,
        curatedEmptyStatePresent: capture.curatedEmptyStatePresent,
      },
    ),
    buildChecklistItem(
      "owner_bridge",
      "Lower Page Bridge",
      capture.ownerCardCount >= 2 && (ownerGap == null || ownerGap <= 96) ? "pass" : "warn",
      capture.ownerCardCount >= 2 && (ownerGap == null || ownerGap <= 96)
        ? "Owner section bridges cleanly into the final CTA."
        : "Owner section does not bridge into the final CTA as tightly as expected.",
      { ownerCardCount: capture.ownerCardCount, ownerToBottomGap: ownerGap },
    ),
    buildChecklistItem(
      "final_cta_ready",
      "Final CTA",
      capture.bottomCtaActionCount >= 2 && capture.bottomCtaFormPanelPresent ? "pass" : "fail",
      capture.bottomCtaActionCount >= 2 && capture.bottomCtaFormPanelPresent
        ? "Final CTA keeps both actions and form panel ready."
        : "Final CTA is missing either dual actions or the form panel.",
      { bottomCtaActionCount: capture.bottomCtaActionCount, bottomCtaFormPanelPresent: capture.bottomCtaFormPanelPresent },
    ),
  ];

  if (capture.width <= 430) {
    items.push(
      buildChecklistItem(
        "mobile_scan_flow",
        "Mobile Flow",
        capture.headingInViewport && capture.headingsInViewport <= 4 && capture.smallTapTargetCount === 0 ? "pass" : "warn",
        capture.headingInViewport && capture.headingsInViewport <= 4 && capture.smallTapTargetCount === 0
          ? "Mobile first screen keeps scan flow and tap safety under control."
          : "Mobile first screen still shows either density or tap-target debt.",
        { headingsInViewport: capture.headingsInViewport, smallTapTargetCount: capture.smallTapTargetCount },
      ),
    );
  }

  return items;
}

function dimensionWeight(key) {
  return SCORE_DIMENSIONS.find((dimension) => dimension.key === key)?.weight ?? 0;
}

function scoreCapture(capture) {
  const findings = [];
  const localeFromRoute = resolveLocaleFromRoute(capture.route);
  const consoleSummary = consoleCounts(capture);
  const networkFailures = actionableNetworkFailures(capture);
  const heroTitle = capture.heroTitleMetrics || null;
  const heroSubtitle = capture.heroSubtitleMetrics || null;
  const sectionType = summarizeTextMetrics(capture.sectionTitleMetrics);
  const bodyType = summarizeTextMetrics(capture.bodyTextMetrics);
  const spacing = summarizePaddingSamples(capture.cardPaddingSamples);
  const sectionGaps = (capture.homepageSectionGaps || []).map((item) => item.gap).filter((value) => Number.isFinite(value));
  const sectionPaddings = (capture.homepageSections || [])
    .flatMap((item) => [item?.sectionPaddingTop, item?.sectionPaddingBottom])
    .filter((value) => Number.isFinite(value));
  const positiveSectionGaps = sectionGaps.filter((value) => value >= 8);
  const checklist = [...buildHomepageChecklist(capture), ...(Array.isArray(capture.manualChecklist) ? capture.manualChecklist : [])];
  const checklistFailures = checklist.filter((item) => item.status === "fail");
  const checklistWarnings = checklist.filter((item) => item.status === "warn");

  function evaluateDimension(key, ruleSet) {
    const max = dimensionWeight(key);
    const dimensionFindings = [];
    let deduction = 0;

    function addFinding({ severity, code, message, points }) {
      const normalizedPoints = clamp(points, 0, max);
      const finding = {
        severity,
        code,
        message,
        points: normalizedPoints,
        dimension: key,
      };
      dimensionFindings.push(finding);
      findings.push(finding);
      deduction += normalizedPoints;
    }

    ruleSet(addFinding);
    const score = clamp(max - deduction, 0, max);
    return {
      label: SCORE_DIMENSIONS.find((dimension) => dimension.key === key)?.label || key,
      weight: max,
      score,
      deduction: clamp(deduction, 0, max),
      findings: dimensionFindings,
    };
  }

  const dimensionScores = {
    runtimeHealth: evaluateDimension("runtimeHealth", (addFinding) => {
      if (capture.httpStatus !== 200) {
        addFinding({
          severity: "critical",
          code: "runtime-http-status",
          message: `HTTP status returned ${capture.httpStatus || 0} instead of 200.`,
          points: 10,
        });
      }
      if (consoleSummary.error > 0) {
        addFinding({
          severity: "major",
          code: "runtime-console-errors",
          message: `${consoleSummary.error} console error message(s) were captured.`,
          points: Math.min(4, consoleSummary.error * 2),
        });
      }
      if (consoleSummary.warning > 0) {
        addFinding({
          severity: "minor",
          code: "runtime-console-warnings",
          message: `${consoleSummary.warning} console warning message(s) were captured.`,
          points: Math.min(2, consoleSummary.warning),
        });
      }
      if (networkFailures.length > 0) {
        addFinding({
          severity: "major",
          code: "runtime-network-failures",
          message: `${networkFailures.length} actionable network failure(s) were captured.`,
          points: Math.min(4, networkFailures.length * 2),
        });
      }
    }),
    layoutIntegrity: evaluateDimension("layoutIntegrity", (addFinding) => {
      if (capture.overflowX) {
        addFinding({
          severity: "critical",
          code: "layout-overflow-x",
          message: "Horizontal overflow was detected on the page.",
          points: 10,
        });
      }
      if (!capture.headingInViewport) {
        addFinding({
          severity: "major",
          code: "layout-heading-below-fold",
          message: "The main H1 was not visible in the first viewport.",
          points: 4,
        });
      }
      if (capture.headingsInViewport > 4) {
        addFinding({
          severity: "minor",
          code: "layout-heading-density",
          message: `First viewport contains ${capture.headingsInViewport} visible headings, which increases density.`,
          points: 2,
        });
      }
    }),
    semanticsAndLandmarks: evaluateDimension("semanticsAndLandmarks", (addFinding) => {
      if (!capture.hasMain) {
        addFinding({
          severity: "critical",
          code: "semantics-missing-main",
          message: "The page did not expose a main landmark.",
          points: 6,
        });
      }
      if (!capture.headingText) {
        addFinding({
          severity: "critical",
          code: "semantics-missing-h1",
          message: "The page did not expose a main H1 heading.",
          points: 5,
        });
      }
      if (capture.h1Count !== 1) {
        addFinding({
          severity: "major",
          code: "semantics-h1-count",
          message: `Expected exactly 1 H1 but found ${capture.h1Count}.`,
          points: 3,
        });
      }
      if (capture.sectionHeadingCount < 1) {
        addFinding({
          severity: "minor",
          code: "semantics-section-headings",
          message: "The page exposed no visible H2/H3 section headings.",
          points: 2,
        });
      }
    }),
    interactionReadiness: evaluateDimension("interactionReadiness", (addFinding) => {
      if (capture.ctaCount === 0) {
        addFinding({
          severity: "critical",
          code: "interaction-no-actions",
          message: "No interactive links or buttons were found in the main content.",
          points: 6,
        });
      } else if (capture.ctaCount < 2) {
        addFinding({
          severity: "major",
          code: "interaction-low-cta-count",
          message: `Only ${capture.ctaCount} interactive action(s) were found in the main content.`,
          points: 4,
        });
      }
      if (capture.aboveFoldInteractiveCount === 0) {
        addFinding({
          severity: "major",
          code: "interaction-no-above-fold-actions",
          message: "No interactive actions were visible in the first viewport.",
          points: 3,
        });
      }
      if (capture.interactiveCount < 3) {
        addFinding({
          severity: "minor",
          code: "interaction-low-density",
          message: `Only ${capture.interactiveCount} visible interactive element(s) were found.`,
          points: 2,
        });
      }
    }),
    mobileSafety: evaluateDimension("mobileSafety", (addFinding) => {
      if (capture.width <= 430 && capture.smallTapTargetCount > 0) {
        addFinding({
          severity: "major",
          code: "mobile-small-tap-targets-xs",
          message: `${capture.smallTapTargetCount} visible tap target(s) were smaller than 44px on a narrow mobile viewport.`,
          points: Math.min(6, capture.smallTapTargetCount),
        });
      } else if (capture.width <= 768 && capture.smallTapTargetCount > 0) {
        addFinding({
          severity: "minor",
          code: "mobile-small-tap-targets",
          message: `${capture.smallTapTargetCount} visible tap target(s) were smaller than 44px.`,
          points: Math.min(4, capture.smallTapTargetCount),
        });
      }
      if (capture.width <= 430 && !capture.headingInViewport) {
        addFinding({
          severity: "major",
          code: "mobile-heading-below-fold",
          message: "The main H1 did not stay in the first viewport on a narrow mobile viewport.",
          points: 3,
        });
      }
    }),
    mediaStability: evaluateDimension("mediaStability", (addFinding) => {
      if (capture.visibleBrokenImageCount > 0) {
        addFinding({
          severity: "major",
          code: "media-broken-visible-images",
          message: `${capture.visibleBrokenImageCount} visible image(s) rendered broken.`,
          points: Math.min(5, capture.visibleBrokenImageCount * 2),
        });
      }
      if (capture.visibleIncompleteImageCount > 0) {
        addFinding({
          severity: "minor",
          code: "media-incomplete-visible-images",
          message: `${capture.visibleIncompleteImageCount} visible image(s) were incomplete at capture time.`,
          points: Math.min(3, capture.visibleIncompleteImageCount),
        });
      }
    }),
    contentClarity: evaluateDimension("contentClarity", (addFinding) => {
      if (capture.headingLength > 0 && (capture.headingLength < 12 || capture.headingLength > 140)) {
        addFinding({
          severity: "minor",
          code: "content-heading-length",
          message: `Main H1 length is ${capture.headingLength} characters, outside the preferred range.`,
          points: 3,
        });
      }
      if (capture.paragraphsInViewport > 8) {
        addFinding({
          severity: "minor",
          code: "content-above-fold-density",
          message: `First viewport contains ${capture.paragraphsInViewport} visible text blocks, which increases scan load.`,
          points: 3,
        });
      }
      if (capture.sectionHeadingCount < 2) {
        addFinding({
          severity: "minor",
          code: "content-low-section-rhythm",
          message: `Only ${capture.sectionHeadingCount} visible section heading(s) were found.`,
          points: 2,
        });
      }
    }),
    localeIntegrity: evaluateDimension("localeIntegrity", (addFinding) => {
      if (localeFromRoute && !capture.htmlLang) {
        addFinding({
          severity: "major",
          code: "locale-missing-html-lang",
          message: `Expected html lang to match route locale "${localeFromRoute}" but no lang value was present.`,
          points: 4,
        });
      }
      if (localeFromRoute && capture.htmlLang && capture.htmlLang.toLowerCase() !== localeFromRoute) {
        addFinding({
          severity: "major",
          code: "locale-html-lang-mismatch",
          message: `html lang "${capture.htmlLang}" did not match route locale "${localeFromRoute}".`,
          points: 5,
        });
      }
    }),
    typographyMetrics: evaluateDimension("typographyMetrics", (addFinding) => {
      if (!heroTitle) {
        addFinding({
          severity: "major",
          code: "type-missing-hero-title-metrics",
          message: "Hero title typography metrics could not be captured.",
          points: 4,
        });
      } else {
        const minimumHeroTitle = capture.width <= 430 ? 24 : capture.width < 1024 ? 28 : 36;
        if (heroTitle.fontSize < minimumHeroTitle) {
          addFinding({
            severity: "major",
            code: "type-hero-title-too-small",
            message: `Hero title font size is ${roundToTenths(heroTitle.fontSize)}px, below the preferred threshold for this breakpoint.`,
            points: 3,
          });
        }
        if (heroTitle.lineHeightRatio < 0.9 || heroTitle.lineHeightRatio > 1.22) {
          addFinding({
            severity: "minor",
            code: "type-hero-title-line-height",
            message: `Hero title line-height ratio is ${roundToTenths(heroTitle.lineHeightRatio)}, outside the preferred range.`,
            points: 2,
          });
        }
        if (heroTitle.measureRatio > 15) {
          addFinding({
            severity: "minor",
            code: "type-hero-title-measure",
            message: `Hero title measure ratio is ${roundToTenths(heroTitle.measureRatio)}, which risks a loose headline measure.`,
            points: 2,
          });
        }
      }

      const medianSectionTitle = median(sectionType.fontSizes);
      if (medianSectionTitle > 0) {
        const minimumSectionTitle = capture.width <= 430 ? 20 : 24;
        if (medianSectionTitle < minimumSectionTitle) {
          addFinding({
            severity: "minor",
            code: "type-section-title-too-small",
            message: `Median section title size is ${roundToTenths(medianSectionTitle)}px, below the preferred threshold.`,
            points: 2,
          });
        }
      }

      const bodyFont = median(bodyType.fontSizes);
      const bodyLineHeight = average(bodyType.lineHeightRatios);
      if (bodyFont > 0 && bodyFont < 14) {
        addFinding({
          severity: "minor",
          code: "type-body-too-small",
          message: `Median body font size is ${roundToTenths(bodyFont)}px, which is below the preferred reading size.`,
          points: 2,
        });
      }
      if (bodyLineHeight > 0 && (bodyLineHeight < 1.45 || bodyLineHeight > 1.9)) {
        addFinding({
          severity: "minor",
          code: "type-body-line-height",
          message: `Average body line-height ratio is ${roundToTenths(bodyLineHeight)}, outside the preferred reading range.`,
          points: 2,
        });
      }

      if (heroSubtitle && (heroSubtitle.lineHeightRatio < 1.45 || heroSubtitle.lineHeightRatio > 1.9)) {
        addFinding({
          severity: "minor",
          code: "type-hero-subtitle-line-height",
          message: `Hero subtitle line-height ratio is ${roundToTenths(heroSubtitle.lineHeightRatio)}, outside the preferred range.`,
          points: 1,
        });
      }
    }),
    spacingRhythm: evaluateDimension("spacingRhythm", (addFinding) => {
      if (positiveSectionGaps.length >= 2) {
        const offScaleGaps = positiveSectionGaps.filter((gap) => nearestScaleDelta(gap) > 10);
        if (offScaleGaps.length > 0) {
          addFinding({
            severity: "major",
            code: "spacing-section-gaps-off-scale",
            message: `${offScaleGaps.length} section gap(s) sit noticeably off the preferred spacing scale.`,
            points: Math.min(4, offScaleGaps.length),
          });
        }

        const averageGap = average(positiveSectionGaps);
        if (averageGap > 0 && (averageGap < 12 || averageGap > 128)) {
          addFinding({
            severity: "minor",
            code: "spacing-section-gap-range",
            message: `Average section gap is ${roundToTenths(averageGap)}px, outside the preferred rhythm range.`,
            points: 2,
          });
        }
      }

      const irregularSectionPaddings = sectionPaddings.filter((value) => value > 0 && nearestScaleDelta(value) > 6);
      if (irregularSectionPaddings.length > 0) {
        addFinding({
          severity: "minor",
          code: "spacing-section-padding-off-scale",
          message: `${irregularSectionPaddings.length} homepage section padding value(s) sit off the preferred spacing scale.`,
          points: 2,
        });
      }

      const irregularPaddingY = spacing.paddingY.filter((value) => nearestScaleDelta(value) > 6);
      if (irregularPaddingY.length > 0) {
        addFinding({
          severity: "minor",
          code: "spacing-card-padding-off-scale",
          message: `${irregularPaddingY.length} sampled vertical padding value(s) sit off the preferred spacing scale.`,
          points: 2,
        });
      }

      const paddingSpread = max(spacing.paddingY) - min(spacing.paddingY);
      if (paddingSpread > 16) {
        addFinding({
          severity: "minor",
          code: "spacing-card-padding-variance",
          message: `Sampled card vertical padding varies by ${roundToTenths(paddingSpread)}px across homepage surfaces.`,
          points: 2,
        });
      }
    }),
    ctaHierarchy: evaluateDimension("ctaHierarchy", (addFinding) => {
      if (capture.isHomepage) {
        if (capture.heroPrimaryCount !== 1 || capture.heroSecondaryCount < 1 || capture.heroActionCount < 2) {
          addFinding({
            severity: "major",
            code: "cta-hero-hierarchy",
            message: "Hero CTA hierarchy is not keeping exactly one primary plus the expected secondary action set.",
            points: 4,
          });
        }
        if (!capture.heroPrimaryInViewport) {
          addFinding({
            severity: "major",
            code: "cta-hero-primary-below-fold",
            message: "Hero primary CTA is not visible in the first viewport.",
            points: 2,
          });
        }
        if (!capture.heroMetaBarPresent || !capture.heroWhatsAppVisible) {
          addFinding({
            severity: "minor",
            code: "cta-hero-support-missing",
            message: "Hero support row is missing either the meta bar or the WhatsApp support link.",
            points: 1,
          });
        }
        if (capture.bottomCtaActionCount < 2) {
          addFinding({
            severity: "major",
            code: "cta-final-dual-actions",
            message: "Final CTA surface does not expose the expected primary + secondary action pair.",
            points: 2,
          });
        }
      } else if (capture.aboveFoldInteractiveCount === 0) {
        addFinding({
          severity: "minor",
          code: "cta-no-above-fold-actions-generic",
          message: "No visible actions were found above the fold on this route.",
          points: 2,
        });
      }
    }),
    sectionAwareHomepage: evaluateDimension("sectionAwareHomepage", (addFinding) => {
      if (!capture.isHomepage) return;

      if (capture.sectionHeaderCoverage < 4) {
        addFinding({
          severity: "minor",
          code: "homepage-section-header-coverage",
          message: `Only ${capture.sectionHeaderCoverage} key homepage section(s) expose a visible section header.`,
          points: 2,
        });
      }

      for (const item of checklistFailures) {
        addFinding({
          severity: "major",
          code: `homepage-checklist-${item.id}`,
          message: item.message,
          points: 2,
        });
      }

      for (const item of checklistWarnings) {
        addFinding({
          severity: "minor",
          code: `homepage-checklist-${item.id}`,
          message: item.message,
          points: 1,
        });
      }
    }),
  };

  const score = SCORE_DIMENSIONS.reduce((sum, dimension) => sum + (dimensionScores[dimension.key]?.score || 0), 0);
  const sortedFindings = findings.sort((left, right) => {
    const severityDelta = severityRank(right.severity) - severityRank(left.severity);
    if (severityDelta !== 0) return severityDelta;
    return right.points - left.points;
  });

  return {
    score,
    rating: resolveScoreRating(score),
    scoreModelVersion: SCORE_MODEL_VERSION,
    localeFromRoute,
    dimensionScores,
    checklist,
    findings: sortedFindings,
    findingCounts: {
      critical: sortedFindings.filter((item) => item.severity === "critical").length,
      major: sortedFindings.filter((item) => item.severity === "major").length,
      minor: sortedFindings.filter((item) => item.severity === "minor").length,
    },
  };
}

function summarizeDimensionScores(metrics) {
  return Object.fromEntries(SCORE_DIMENSIONS.map((dimension) => {
    const averageScore = metrics.length
      ? metrics.reduce((sum, item) => sum + (item.dimensionScores?.[dimension.key]?.score || 0), 0) / metrics.length
      : 0;
    return [
      dimension.key,
      {
        label: dimension.label,
        weight: dimension.weight,
        averageScore: roundToTenths(averageScore),
        averagePercent: dimension.weight > 0 ? roundToTenths((averageScore / dimension.weight) * 100) : 0,
      },
    ];
  }));
}

function summarizeByGroup(metrics, keyResolver) {
  const groups = new Map();

  for (const item of metrics) {
    const key = keyResolver(item);
    const bucket = groups.get(key) || [];
    bucket.push(item);
    groups.set(key, bucket);
  }

  return Object.fromEntries([...groups.entries()].map(([key, items]) => [
    key,
    {
      score: roundToTenths(items.reduce((sum, item) => sum + item.score, 0) / Math.max(items.length, 1)),
      rating: resolveScoreRating(items.reduce((sum, item) => sum + item.score, 0) / Math.max(items.length, 1)),
      captureCount: items.length,
      dimensionScores: summarizeDimensionScores(items),
      criticalCount: items.reduce((sum, item) => sum + (item.findingCounts?.critical || 0), 0),
      majorCount: items.reduce((sum, item) => sum + (item.findingCounts?.major || 0), 0),
      minorCount: items.reduce((sum, item) => sum + (item.findingCounts?.minor || 0), 0),
      checklist: summarizeChecklist(items),
    },
  ]));
}

function summarizeFindings(metrics) {
  const findings = metrics.flatMap((item) => (item.findings || []).map((finding) => ({
    ...finding,
    route: item.route,
    width: item.width,
  })));
  const aggregate = new Map();

  for (const finding of findings) {
    const key = `${finding.dimension}|${finding.code}|${finding.severity}|${finding.message}`;
    const existing = aggregate.get(key) || {
      dimension: finding.dimension,
      code: finding.code,
      severity: finding.severity,
      message: finding.message,
      count: 0,
      routes: new Set(),
      widths: new Set(),
      totalPoints: 0,
    };
    existing.count += 1;
    existing.routes.add(finding.route);
    existing.widths.add(String(finding.width));
    existing.totalPoints += finding.points;
    aggregate.set(key, existing);
  }

  return [...aggregate.values()]
    .map((item) => ({
      ...item,
      averagePoints: roundToTenths(item.totalPoints / Math.max(item.count, 1)),
      routes: [...item.routes].sort(),
      widths: [...item.widths].sort((left, right) => Number(left) - Number(right)).map((value) => Number(value)),
    }))
    .sort((left, right) => {
      const severityDelta = severityRank(right.severity) - severityRank(left.severity);
      if (severityDelta !== 0) return severityDelta;
      if (right.count !== left.count) return right.count - left.count;
      return right.averagePoints - left.averagePoints;
    });
}

function summarizeChecklist(metrics) {
  const items = metrics.flatMap((item) => (item.checklist || []).map((check) => ({
    ...check,
    route: item.route,
    width: item.width,
  })));
  const aggregate = new Map();

  for (const item of items) {
    const key = `${item.id}|${item.area}`;
    const existing = aggregate.get(key) || {
      id: item.id,
      area: item.area,
      pass: 0,
      warn: 0,
      fail: 0,
      routes: new Set(),
      widths: new Set(),
      sources: new Set(),
      reviewers: new Set(),
      latestMessage: item.message,
    };
    if (item.status === "pass") existing.pass += 1;
    if (item.status === "warn") existing.warn += 1;
    if (item.status === "fail") existing.fail += 1;
    existing.routes.add(item.route);
    existing.widths.add(String(item.width));
    existing.sources.add(item.source || "automated");
    if (item.reviewer) existing.reviewers.add(item.reviewer);
    existing.latestMessage = item.message;
    aggregate.set(key, existing);
  }

  return [...aggregate.values()]
    .map((item) => ({
      id: item.id,
      area: item.area,
      pass: item.pass,
      warn: item.warn,
      fail: item.fail,
      routes: [...item.routes].sort(),
      widths: [...item.widths].sort((left, right) => Number(left) - Number(right)).map((value) => Number(value)),
      sources: [...item.sources].sort(),
      reviewers: [...item.reviewers].sort(),
      latestMessage: item.latestMessage,
      rating: item.fail > 0 ? "fail" : item.warn > 0 ? "warn" : "pass",
    }))
    .sort((left, right) => {
      if (right.fail !== left.fail) return right.fail - left.fail;
      if (right.warn !== left.warn) return right.warn - left.warn;
      return left.id.localeCompare(right.id);
    });
}

async function main() {
  const snapshot = await snapshotProjectFiles();
  let ensured = { started: false, child: null };
  let browser = null;

  try {
    await fs.mkdir(CAPTURE_DIR, { recursive: true });
    ensured = await ensureBaseUrl(BASE_URL);
    const detailResolution = await resolveLiveDetailRoutes(BASE_URL);
    const manualReviews = await loadManualScreenshotReviews();
    const routes = uniqueRoutes([...ROUTES, ...detailResolution.routes]);

    browser = await chromium.launch({ headless: true });
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
      if (shouldIgnoreRequestFailure(request)) return;
      networkLog.push({
        url: request.url(),
        method: request.method(),
        errorText: request.failure()?.errorText ?? "request failed",
      });
    });

    const captures = [];
    if (PREWARM_ROUTES) {
      for (const route of routes) {
        await prewarmRoute(page, route);
      }
    }

    for (const route of routes) {
      for (const width of BREAKPOINTS) {
        const capture = await captureRoute(page, route, width, consoleLog, networkLog);
        captures.push(attachManualChecklist(capture, manualReviews));
      }
    }

    const matchedManualReviewKeys = new Set(captures.flatMap((capture) => capture.matchedManualReviewKeys || []));
    const unmatchedManualReviews = manualReviews
      .filter((entry) => !matchedManualReviewKeys.has(entry.key))
      .map((entry) => ({
        route: entry.route,
        width: entry.width,
        checklistCount: entry.checklist.length,
      }));

    const metrics = captures.map((capture) => {
      const scored = scoreCapture(capture);
      return {
        route: capture.route,
        width: capture.width,
        httpStatus: capture.httpStatus,
        htmlLang: capture.htmlLang,
        hasMain: capture.hasMain,
        headingText: capture.headingText,
        headingLength: capture.headingLength,
        headingInViewport: capture.headingInViewport,
        h1Count: capture.h1Count,
        sectionHeadingCount: capture.sectionHeadingCount,
        headingsInViewport: capture.headingsInViewport,
        paragraphsInViewport: capture.paragraphsInViewport,
        overflowX: capture.overflowX,
        ctaCount: capture.ctaCount,
        interactiveCount: capture.interactiveCount,
        aboveFoldInteractiveCount: capture.aboveFoldInteractiveCount,
        smallTapTargetCount: capture.smallTapTargetCount,
        visibleImageCount: capture.visibleImageCount,
        visibleBrokenImageCount: capture.visibleBrokenImageCount,
        visibleIncompleteImageCount: capture.visibleIncompleteImageCount,
        scoreModelVersion: scored.scoreModelVersion,
        localeFromRoute: scored.localeFromRoute,
        score: scored.score,
        rating: scored.rating,
        dimensionScores: scored.dimensionScores,
        checklist: scored.checklist,
        findings: scored.findings,
        findingCounts: scored.findingCounts,
      };
    });
    const aggregateFindings = summarizeFindings(metrics);
    const aggregateChecklist = summarizeChecklist(metrics);
    const overallScore = metrics.reduce((sum, item) => sum + item.score, 0) / Math.max(metrics.length, 1);
    const summary = {
      baseUrl: BASE_URL,
      routes,
      breakpoints: BREAKPOINTS,
      scoreModelVersion: SCORE_MODEL_VERSION,
      scoreDimensions: SCORE_DIMENSIONS,
      scoreThresholds: SCORE_THRESHOLDS,
      resolvedDetailRoutes: detailResolution.routes,
      detailRouteStatus: detailResolution.sources.project === "fallback" || detailResolution.sources.property === "fallback"
        ? "fallback"
        : detailResolution.sources.project === "override" || detailResolution.sources.property === "override"
          ? "override"
          : detailResolution.routes.length > 0
            ? "resolved"
            : "unavailable",
      detailRouteSources: detailResolution.sources,
      reviewInputs: {
        manualReviewFile: SCREENSHOT_REVIEW_FILE ? path.relative(process.cwd(), SCREENSHOT_REVIEW_FILE) : null,
        matchedCaptures: matchedManualReviewKeys.size,
        unmatchedEntries: unmatchedManualReviews,
      },
      score: roundToTenths(overallScore),
      rating: resolveScoreRating(overallScore),
      dimensionAverages: summarizeDimensionScores(metrics),
      byRoute: summarizeByGroup(metrics, (item) => item.route),
      byLocale: summarizeByGroup(metrics, (item) => item.localeFromRoute || "unknown"),
      byBreakpoint: summarizeByGroup(metrics, (item) => String(item.width)),
      screenshotChecklist: aggregateChecklist,
      checklistSummary: {
        pass: aggregateChecklist.filter((item) => item.rating === "pass").length,
        warn: aggregateChecklist.filter((item) => item.rating === "warn").length,
        fail: aggregateChecklist.filter((item) => item.rating === "fail").length,
      },
      captures: metrics,
      criticalFindings: aggregateFindings.filter((item) => item.severity === "critical"),
      warningFindings: aggregateFindings.filter((item) => item.severity === "major"),
      topFindings: aggregateFindings.slice(0, 10),
      topChecklistConcerns: aggregateChecklist.filter((item) => item.rating !== "pass").slice(0, 10),
    };

    await writeJson(SUMMARY_PATH, summary);
    await writeJson(METRICS_PATH, metrics);
    await writeJson(CONSOLE_PATH, consoleLog);
    await writeJson(NETWORK_PATH, networkLog);

    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } finally {
    if (browser) {
      await browser.close();
    }
    if (ensured.started) {
      await stopServer(ensured.child);
      await cleanupVisualDistDir();
    }
    await restoreProjectFiles(snapshot);
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});
