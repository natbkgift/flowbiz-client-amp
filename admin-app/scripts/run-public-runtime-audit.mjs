import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { chromium } from "playwright";

const BASE_URL = process.env.PUBLIC_RUNTIME_AUDIT_BASE_URL || "https://amppattaya.com";
const LOCALE = process.env.PUBLIC_RUNTIME_AUDIT_LOCALE === "th" ? "th" : "en";
const ROUTE_LIMIT_PER_FAMILY = Number.parseInt(process.env.PUBLIC_RUNTIME_AUDIT_ROUTE_LIMIT || "3", 10) || 3;
const VIEWPORTS = parseViewports(process.env.PUBLIC_RUNTIME_AUDIT_VIEWPORTS) || [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1366, height: 960 },
];
const EXPLICIT_ROUTES = parseRoutes(process.env.PUBLIC_RUNTIME_AUDIT_ROUTES);
const ARTIFACT_ROOT = path.resolve(
  process.cwd(),
  process.env.PUBLIC_RUNTIME_AUDIT_ARTIFACT_DIR || path.join("artifacts", "public-runtime-audit"),
);
const RUN_DIR = path.join(ARTIFACT_ROOT, `run-${formatTimestamp(new Date())}`);
const SUMMARY_PATH = path.join(RUN_DIR, "summary.json");
const DETAILS_PATH = path.join(RUN_DIR, "details.json");

function parseRoutes(raw) {
  const values = String(raw || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => (value.startsWith("/") ? value : `/${value}`));
  return values.length ? [...new Set(values)] : null;
}

function parseViewports(raw) {
  const values = String(raw || "")
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [name, width, height] = chunk.split(":");
      const parsedWidth = Number.parseInt(width, 10);
      const parsedHeight = Number.parseInt(height, 10);
      if (!name || !Number.isFinite(parsedWidth) || !Number.isFinite(parsedHeight)) return null;
      return { name, width: parsedWidth, height: parsedHeight };
    })
    .filter(Boolean);
  return values.length ? values : null;
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

function sanitizeRoute(route) {
  return route.replace(/^\//, "").replace(/\//g, "__").replace(/[^a-zA-Z0-9_-]/g, "-") || "root";
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`request failed ${response.status}: ${url}`);
  }
  return response.json();
}

async function discoverRoutes() {
  if (EXPLICIT_ROUTES?.length) {
    return EXPLICIT_ROUTES.map((route) => ({ route, family: "explicit" }));
  }

  const discovered = [
    { route: `/${LOCALE}`, family: "home" },
    { route: `/${LOCALE}/buy`, family: "buy" },
    { route: `/${LOCALE}/developers`, family: "developers" },
  ];

  try {
    const projectsPayload = await fetchJson(new URL(`/api/v1/projects?limit=12`, BASE_URL).toString());
    const projects = Array.isArray(projectsPayload)
      ? projectsPayload
      : Array.isArray(projectsPayload?.data)
        ? projectsPayload.data
        : Array.isArray(projectsPayload?.items)
          ? projectsPayload.items
          : [];
    for (const project of projects.slice(0, ROUTE_LIMIT_PER_FAMILY)) {
      if (typeof project?.slug === "string" && project.slug.trim()) {
        discovered.push({ route: `/${LOCALE}/projects/${encodeURIComponent(project.slug.trim())}`, family: "projects" });
      }
    }
  } catch {}

  try {
    const areasPayload = await fetchJson(new URL(`/api/v1/areas`, BASE_URL).toString());
    const areas = Array.isArray(areasPayload)
      ? areasPayload
      : Array.isArray(areasPayload?.data)
        ? areasPayload.data
        : [];
    for (const area of areas.slice(0, ROUTE_LIMIT_PER_FAMILY)) {
      if (typeof area?.slug === "string" && area.slug.trim()) {
        discovered.push({ route: `/${LOCALE}/areas/${encodeURIComponent(area.slug.trim())}`, family: "areas" });
      }
    }
  } catch {}

  try {
    const propertiesPayload = await fetchJson(
      new URL(`/api/v1/properties/?limit=6&sort=newest&type=resale&locale=${LOCALE}`, BASE_URL).toString(),
    );
    const properties = Array.isArray(propertiesPayload?.data) ? propertiesPayload.data : [];
    for (const property of properties) {
      if (typeof property?.slug === "string" && property.slug.trim()) {
        discovered.push({ route: `/${LOCALE}/property/${encodeURIComponent(property.slug.trim())}`, family: "property" });
        break;
      }
    }
  } catch {}

  return discovered.filter(
    (item, index, source) => source.findIndex((entry) => entry.route === item.route) === index,
  );
}

function classifyMismatch(label, href) {
  const safeLabel = String(label || "").trim();
  const safeHref = String(href || "").trim();
  if (!safeLabel || !safeHref) return null;

  const isContactLabel = /(advisor|consult|private tour|speak|contact|brief|talk|whatsapp|line|call|ปรึกษา|ติดต่อ|นัดชม|โทร)/i.test(safeLabel);
  const isBrowseLabel = /(view|browse|inventory|details|project|listing|shortlist|ดู|รายการ|รายละเอียด|โครงการ)/i.test(safeLabel);
  const isContactHref = /^#/.test(safeHref)
    || /^tel:/i.test(safeHref)
    || /wa\.me|line\.me/i.test(safeHref)
    || /\/contact\b/i.test(safeHref);
  const isBrowseHref = /\/(buy|rent|projects|property|areas|developers)\b/i.test(safeHref);

  if (isContactLabel && !isContactHref) {
    return `contact-label-mismatch:${safeHref}`;
  }
  if (isBrowseLabel && !isBrowseHref && !safeHref.startsWith("#")) {
    return `browse-label-mismatch:${safeHref}`;
  }
  return null;
}

async function inspectRoute(page, route, viewport) {
  const routeUrl = new URL(route, BASE_URL).toString();
  const responseFailures = [];
  const requestFailures = [];
  const origin = new URL(BASE_URL).origin;

  const onResponse = (response) => {
    try {
      const url = response.url();
      if (!url.startsWith(origin)) return;
      if (response.status() < 400) return;
      responseFailures.push({
        url,
        status: response.status(),
        resourceType: response.request().resourceType(),
      });
    } catch {}
  };
  const onRequestFailed = (request) => {
    const url = request.url();
    if (!url.startsWith(origin)) return;
    const errorText = request.failure()?.errorText ?? "request failed";
    if (errorText === "net::ERR_ABORTED") return;
    requestFailures.push({
      url,
      method: request.method(),
      errorText,
    });
  };

  page.on("response", onResponse);
  page.on("requestfailed", onRequestFailed);
  try {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const response = await page.goto(routeUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.locator("main").first().waitFor({ timeout: 15000 }).catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 7000 }).catch(() => {});
    await page.waitForTimeout(700);

    const snapshot = await page.evaluate(() => {
      const isVisible = (element) => {
        if (!(element instanceof HTMLElement)) return false;
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      };
      const normalizeLabel = (element) =>
        (element.getAttribute("aria-label") || element.textContent || "").replace(/\s+/g, " ").trim();
      const classifyRegion = (element) => {
        if (element.closest("header")) return "header";
        if (element.closest("footer")) return "footer";
        if (element.closest("main")) return "main";
        return "other";
      };
      const ctas = Array.from(document.querySelectorAll("a, button"))
        .filter(isVisible)
        .map((element) => {
          const html = element;
          const className = html.className || "";
          const style = window.getComputedStyle(html);
          const rect = html.getBoundingClientRect();
          const href = html instanceof HTMLAnchorElement ? html.href || html.getAttribute("href") || "" : "";
          const label = normalizeLabel(html);
          const primary = /btn-primary|btn-cta/.test(className);
          const secondary = /btn-secondary|btn-tertiary/.test(className);
          return {
            label,
            href,
            className,
            primary,
            secondary,
            position: style.position,
            region: classifyRegion(html),
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
          };
        })
        .filter((item) => item.label.length > 0 || item.href.length > 0);

      const majorSections = Array.from(document.querySelectorAll("main section, main article"))
        .filter(isVisible)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const text = (element.textContent || "").replace(/\s+/g, " ").trim();
          const mediaCount = element.querySelectorAll("img, picture, svg, video").length;
          const actionCount = element.querySelectorAll("a, button").length;
          return {
            height: Math.round(rect.height),
            textLength: text.length,
            mediaCount,
            actionCount,
          };
        })
        .filter((item) => item.height >= 180);

      const blankSections = majorSections.filter((item) => item.textLength < 24 && item.mediaCount === 0 && item.actionCount === 0);
      const primaryCtas = ctas.filter((item) => item.primary);
      const stickyPrimaryCtas = primaryCtas.filter((item) => item.position === "fixed" || item.position === "sticky");
      const secondaryCtas = ctas.filter((item) => item.secondary);

      return {
        title: document.title,
        headingText: document.querySelector("main h1")?.textContent?.replace(/\s+/g, " ").trim() || null,
        ctas,
        primaryCtas,
        secondaryCtas,
        blankSectionCount: blankSections.length,
        majorSectionCount: majorSections.length,
        stickyPrimaryCount: stickyPrimaryCtas.length,
        headerPrimaryCount: primaryCtas.filter((item) => item.region === "header").length,
        footerPrimaryCount: primaryCtas.filter((item) => item.region === "footer").length,
      };
    });

    const primaryCta = snapshot.primaryCtas[0] || snapshot.ctas.find((item) => item.secondary) || null;
    const clickCheck = {
      label: primaryCta?.label || null,
      href: primaryCta?.href || null,
      status: null,
      finalUrl: null,
      deadClick: false,
      mismatch: primaryCta ? classifyMismatch(primaryCta.label, primaryCta.href) : null,
    };

    if (primaryCta?.href) {
      const href = String(primaryCta.href).trim();
      if (href.startsWith("#")) {
        clickCheck.finalUrl = new URL(page.url()).toString();
        clickCheck.deadClick = !(await page.locator(href).first().count());
      } else if (/^(tel:|mailto:)/i.test(href) || /wa\.me|line\.me/i.test(href)) {
        clickCheck.status = 200;
        clickCheck.finalUrl = href;
      } else {
        const targetPage = await page.context().newPage();
        try {
          const targetResponse = await targetPage.goto(new URL(href, page.url()).toString(), {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });
          await targetPage.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
          clickCheck.status = targetResponse?.status() ?? 0;
          clickCheck.finalUrl = targetPage.url();
          clickCheck.deadClick = !clickCheck.status || clickCheck.status >= 400;
        } finally {
          await targetPage.close();
        }
      }
    }

    const sameOriginFailures = [...responseFailures, ...requestFailures];
    const issues = [];
    if ((response?.status() ?? 0) >= 400 || !response) issues.push(`route-status:${response?.status() ?? 0}`);
    if (!snapshot.headingText) issues.push("missing-heading");
    if (snapshot.blankSectionCount > 0) issues.push(`blank-sections:${snapshot.blankSectionCount}`);
    if (snapshot.stickyPrimaryCount > 1) issues.push(`mobile-sticky-collision:${snapshot.stickyPrimaryCount}`);
    if (clickCheck.deadClick) issues.push(`dead-click:${clickCheck.href || "missing"}`);
    if (clickCheck.mismatch) issues.push(clickCheck.mismatch);
    if (sameOriginFailures.length > 0) {
      issues.push(`same-origin-failures:${sameOriginFailures.length}`);
    }

    return {
      route,
      viewport: viewport.name,
      url: routeUrl,
      httpStatus: response?.status() ?? 0,
      title: snapshot.title,
      headingText: snapshot.headingText,
      primaryCtas: snapshot.primaryCtas,
      secondaryCtas: snapshot.secondaryCtas,
      blankSectionCount: snapshot.blankSectionCount,
      majorSectionCount: snapshot.majorSectionCount,
      headerPrimaryCount: snapshot.headerPrimaryCount,
      footerPrimaryCount: snapshot.footerPrimaryCount,
      stickyPrimaryCount: snapshot.stickyPrimaryCount,
      clickCheck,
      sameOriginFailures,
      issues,
      pass: issues.length === 0,
    };
  } finally {
    page.off("response", onResponse);
    page.off("requestfailed", onRequestFailed);
  }
}

async function main() {
  const routes = await discoverRoutes();
  await fs.mkdir(RUN_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ ignoreHTTPSErrors: false });
    const page = await context.newPage();
    const details = [];

    for (const route of routes) {
      for (const viewport of VIEWPORTS) {
        details.push(await inspectRoute(page, route.route, viewport));
      }
    }

    const summary = {
      baseUrl: BASE_URL,
      locale: LOCALE,
      routes,
      viewports: VIEWPORTS,
      totalChecks: details.length,
      passedChecks: details.filter((item) => item.pass).length,
      failedChecks: details.filter((item) => !item.pass).length,
      sameOriginFailureCount: details.reduce((sum, item) => sum + item.sameOriginFailures.length, 0),
      issueCount: details.reduce((sum, item) => sum + item.issues.length, 0),
    };

    await writeJson(DETAILS_PATH, details);
    await writeJson(SUMMARY_PATH, summary);
    process.stdout.write(`${JSON.stringify({ summary, details }, null, 2)}\n`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});
