import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const BASE_URL = process.env.A1_BASE_URL || 'http://127.0.0.1:3000';
const BREAKPOINTS = [360, 768, 1024, 1440, 1920, 2560];
const LOCALES = ['en', 'th'];

const repoRoot = process.cwd();
const siteRoot = path.join(repoRoot, 'app', '(site)', '[locale]');
const outputDir = path.join(repoRoot, '..', 'docs', 'qa');
const artifactsDir = path.join(outputDir, 'artifacts', 'a1-matrix');

function toPosix(value) {
  return value.replace(/\\/g, '/');
}

function stripRouteGroup(segment) {
  return segment.startsWith('(') && segment.endsWith(')');
}

function normalizeRouteSegments(routePath) {
  if (!routePath || routePath === '.') return [];
  return routePath
    .split('/')
    .filter(Boolean)
    .filter((segment) => !stripRouteGroup(segment))
    .filter((segment) => !segment.startsWith('_'))
    .filter((segment) => !segment.startsWith('@'));
}

function sanitizeRouteForFile(route) {
  return route
    .replace(/^\//, '')
    .replace(/\//g, '__')
    .replace(/[^a-zA-Z0-9_\-\[\]]/g, '-')
    .slice(0, 180);
}

function isBrowserClosedError(error) {
  const msg = error instanceof Error ? error.message : String(error);
  return /Target page, context or browser has been closed|Browser has been closed|browser\.newContext|Protocol error/i.test(msg);
}

async function launchBrowser() {
  return chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage'],
  });
}

async function walkPages(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkPages(full)));
      continue;
    }
    if (entry.isFile() && entry.name === 'page.tsx') {
      out.push(full);
    }
  }
  return out;
}

function toRouteTemplate(pageFile) {
  const rel = toPosix(path.relative(siteRoot, pageFile));
  if (rel === 'page.tsx') return '/';
  const routeDir = toPosix(path.dirname(rel));
  const route = normalizeRouteSegments(routeDir).join('/');
  return route === '' ? '/' : `/${route}`;
}

function normalizeRouteTemplate(routeTemplate) {
  if (typeof routeTemplate !== 'string') return null;
  const trimmed = routeTemplate.trim();
  if (!trimmed) return null;

  const noQuery = trimmed.split('?')[0].split('#')[0];
  if (!noQuery) return null;
  if (/page\.(t|j)sx?$/i.test(noQuery)) return null;

  const unwrapped = noQuery.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!unwrapped) return '/';

  const segments = normalizeRouteSegments(unwrapped);
  if (!segments.length) return '/';
  if (segments.some((segment) => /\.[a-z0-9]+$/i.test(segment))) return null;

  return `/${segments.join('/')}`;
}

function hasFocusVisibleRule(cssText) {
  return cssText.includes(':focus-visible');
}

async function fetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function buildDynamicSamples() {
  const samples = {
    projectSlug: null,
    propertySlug: null,
    blogSlug: null,
    guideSlug: null,
    areaSlug: null,
    developerSlug: null,
    areaGuideSlug: 'jomtien',
  };

  const projects = await fetchJson(`${BASE_URL}/api/v1/projects?limit=1&page=1`);
  samples.projectSlug = projects?.data?.[0]?.slug ?? null;

  const properties = await fetchJson(`${BASE_URL}/api/v1/properties?limit=1&page=1`);
  samples.propertySlug = properties?.data?.[0]?.slug ?? null;

  const blogs = await fetchJson(`${BASE_URL}/api/v1/content/blog-posts/`);
  samples.blogSlug = Array.isArray(blogs) && blogs.length ? blogs[0].slug : null;

  const guides = await fetchJson(`${BASE_URL}/api/v1/content/guides/`);
  samples.guideSlug = Array.isArray(guides) && guides.length ? guides[0].slug : null;

  const areas = await fetchJson(`${BASE_URL}/api/v1/areas`);
  samples.areaSlug = Array.isArray(areas) && areas.length ? areas[0].slug : null;

  const devs = await fetchJson(`${BASE_URL}/api/v1/developers`);
  samples.developerSlug = Array.isArray(devs) && devs.length ? devs[0].slug : null;

  return samples;
}

function resolveTemplate(template, samples) {
  let route = template;
  const replacements = [
    { token: '[slug]', value: samples.projectSlug ?? 'sample-slug' },
  ];

  if (template.includes('/property/[slug]')) {
    route = template.replace('[slug]', samples.propertySlug ?? 'sample-property');
  } else if (template.includes('/projects/[slug]')) {
    route = template.replace('[slug]', samples.projectSlug ?? 'sample-project');
  } else if (template.includes('/blog/[slug]')) {
    route = template.replace('[slug]', samples.blogSlug ?? 'sample-blog');
  } else if (template.includes('/guides/[slug]')) {
    route = template.replace('[slug]', samples.guideSlug ?? 'sample-guide');
  } else if (template.includes('/area-guide/[slug]')) {
    route = template.replace('[slug]', samples.areaGuideSlug ?? 'jomtien');
  } else if (template.includes('/areas/[slug]')) {
    route = template.replace('[slug]', samples.areaSlug ?? 'sample-area');
  } else if (template.includes('/developers/[slug]')) {
    route = template.replace('[slug]', samples.developerSlug ?? 'sample-developer');
  } else {
    for (const replacement of replacements) {
      route = route.replace(replacement.token, replacement.value);
    }
  }

  return route;
}

function classify(result) {
  if (result.httpStatus >= 400 || !result.hasMain) return 'FAIL';
  const failures = [
    result.overflowX,
    !result.hasH1,
    !result.hasFocusVisibleRule,
    !result.keyboardReachable,
    !result.containerReadable,
    result.hasExternalImageHotlink,
  ].filter(Boolean).length;
  if (failures === 0) return 'PASS';
  return 'PARTIAL';
}

async function discoverRouteTemplates() {
  try {
    const pageFiles = await walkPages(siteRoot);
    if (pageFiles.length) {
      const fromAppTree = [...new Set(pageFiles.map(toRouteTemplate).map(normalizeRouteTemplate).filter(Boolean))].sort();
      if (fromAppTree.length) return fromAppTree;
    }
  } catch {
    // fallback below
  }

  const fallbackPath = path.join(outputDir, 'A1_VALIDATION_MATRIX.json');
  try {
    const raw = await fs.readFile(fallbackPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.routeTemplates) && parsed.routeTemplates.length) {
      const fromFallback = [...new Set(parsed.routeTemplates.map(normalizeRouteTemplate).filter(Boolean))].sort();
      if (fromFallback.length) return fromFallback;
    }
  } catch {
    // no-op
  }

  throw new Error('Unable to discover public route templates from app tree or fallback matrix JSON');
}

function summarizeByStatus(rows) {
  return rows.reduce(
    (acc, row) => {
      acc[row.status] += 1;
      return acc;
    },
    { PASS: 0, PARTIAL: 0, FAIL: 0 },
  );
}

function toMarkdown({ routes, rows, totals, samples }) {
  const lines = [];
  lines.push('# A1 Validation Matrix');
  lines.push('');
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push(`Base URL: ${BASE_URL}`);
  lines.push(`Breakpoints: ${BREAKPOINTS.join(', ')}`);
  lines.push(`Public routes discovered: ${routes.length}`);
  lines.push(`Rows executed: ${rows.length}`);
  lines.push('');
  lines.push('## Dynamic Samples');
  lines.push(`- project slug: ${samples.projectSlug ?? 'N/A'}`);
  lines.push(`- property slug: ${samples.propertySlug ?? 'N/A'}`);
  lines.push(`- blog slug: ${samples.blogSlug ?? 'N/A'}`);
  lines.push(`- guide slug: ${samples.guideSlug ?? 'N/A'}`);
  lines.push(`- area slug: ${samples.areaSlug ?? 'N/A'}`);
  lines.push(`- developer slug: ${samples.developerSlug ?? 'N/A'}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`- PASS: ${totals.PASS}`);
  lines.push(`- PARTIAL: ${totals.PARTIAL}`);
  lines.push(`- FAIL: ${totals.FAIL}`);
  lines.push('');
  lines.push('## Matrix');
  lines.push('');
  lines.push('| Route | Locale | Breakpoint | Status | Evidence | Issues |');
  lines.push('|---|---|---:|---|---|---|');

  for (const row of rows) {
    const evidence = `status=${row.httpStatus}; main=${row.hasMain}; h1=${row.h1Count}; overflow=${row.overflowX ? 'yes' : 'no'}; focusVisible=${row.hasFocusVisibleRule ? 'yes' : 'no'}; tab=${row.keyboardReachable ? 'yes' : 'no'}; maxMainWidth=${row.maxMainWidth}; hotlink=${row.hasExternalImageHotlink ? 'yes' : 'no'}; screenshot=${row.screenshotPath || 'N/A'}`;
    lines.push(`| ${row.route} | ${row.locale} | ${row.breakpoint} | ${row.status} | ${evidence} | ${row.issueSummary || '-'} |`);
  }

  return `${lines.join('\n')}\n`;
}

function toGapReport(rows, totals) {
  const lines = [];
  lines.push('# A1 Shared UI Gap Report');
  lines.push('');
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push(`PASS=${totals.PASS}, PARTIAL=${totals.PARTIAL}, FAIL=${totals.FAIL}`);
  lines.push('');

  const failing = rows.filter((r) => r.status !== 'PASS');
  if (!failing.length) {
    lines.push('## Result');
    lines.push('- No open A1 gaps from automated matrix checks.');
    return `${lines.join('\n')}\n`;
  }

  lines.push('## Open Issues');
  for (const row of failing) {
    lines.push(`- ${row.status} ${row.locale} ${row.breakpoint}px ${row.route}: ${row.issueSummary || 'unclassified issue'}`);
  }
  return `${lines.join('\n')}\n`;
}

async function run() {
  const routeTemplates = await discoverRouteTemplates();
  const samples = await buildDynamicSamples();

  let browser = await launchBrowser();
  const rows = [];
  await fs.mkdir(artifactsDir, { recursive: true });

  try {
    for (const locale of LOCALES) {
      for (const template of routeTemplates) {
        const resolved = resolveTemplate(template, samples);
        const route = `/${locale}${resolved === '/' ? '' : resolved}`;

        for (const breakpoint of BREAKPOINTS) {
          let rowAdded = false;
          let statusCode = 0;

          for (let attempt = 1; attempt <= 2; attempt += 1) {
            let context = null;
            let page = null;

            try {
              context = await browser.newContext({ viewport: { width: breakpoint, height: 900 } });
              page = await context.newPage();
              const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
              statusCode = response?.status() ?? 0;
              await page.waitForTimeout(150);

              const metrics = await page.evaluate(() => {
                const main = document.querySelector('main');
                const h1Count = document.querySelectorAll('h1').length;
                const maxMainWidth = main ? Math.round((main).getBoundingClientRect().width) : 0;
                const rootOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
                const bodyOverflow = document.body.scrollWidth > window.innerWidth + 1;

                const externalImageNodes = Array.from(document.querySelectorAll('img[src], source[srcset]'));
                const externalImages = externalImageNodes.filter((el) => {
                  const src = (el).getAttribute('src') || (el).getAttribute('srcset') || '';
                  if (!src) return false;
                  const firstSrc = src.split(',')[0]?.trim()?.split(' ')[0] || '';
                  if (!firstSrc) return false;
                  if (firstSrc.startsWith('/media/') || firstSrc.startsWith('/storage/')) return false;
                  return /^https?:\/\//i.test(firstSrc);
                });

                const tabbables = Array.from(
                  document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'),
                ).filter((el) => {
                  const node = el;
                  return !(node).hasAttribute('disabled');
                });

                let hasFocusVisibleRule = false;
                for (const ss of Array.from(document.styleSheets)) {
                  try {
                    const rules = ss.cssRules ? Array.from(ss.cssRules) : [];
                    if (rules.some((rule) => rule.cssText && rule.cssText.includes(':focus-visible'))) {
                      hasFocusVisibleRule = true;
                      break;
                    }
                  } catch {
                    continue;
                  }
                }

                return {
                  hasMain: Boolean(main),
                  h1Count,
                  rootOverflow,
                  bodyOverflow,
                  maxMainWidth,
                  tabbableCount: tabbables.length,
                  hasFocusVisibleRule,
                  externalImageCount: externalImages.length,
                };
              });

              await page.keyboard.press('Tab');
              const keyboardReachable = await page.evaluate(() => {
                const active = document.activeElement;
                if (!active) return false;
                const tag = active.tagName.toLowerCase();
                return tag === 'a' || tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea';
              });

              const screenshotName = `${sanitizeRouteForFile(route) || 'root'}__${breakpoint}.png`;
              const screenshotRel = toPosix(path.relative(outputDir, path.join(artifactsDir, locale, screenshotName)));
              const screenshotAbs = path.join(outputDir, screenshotRel);
              await fs.mkdir(path.dirname(screenshotAbs), { recursive: true });
              await page.screenshot({ path: screenshotAbs, fullPage: false });

              const overflowX = metrics.rootOverflow || metrics.bodyOverflow;
              const containerReadable = breakpoint < 1024 ? metrics.maxMainWidth <= breakpoint : metrics.maxMainWidth <= 1720;
              const hasH1 = metrics.h1Count >= 1;
              const hasExternalImageHotlink = metrics.externalImageCount > 0;

              const row = {
                route,
                locale,
                breakpoint,
                httpStatus: statusCode,
                hasMain: metrics.hasMain,
                h1Count: metrics.h1Count,
                hasH1,
                overflowX,
                hasFocusVisibleRule: metrics.hasFocusVisibleRule,
                keyboardReachable,
                containerReadable,
                maxMainWidth: metrics.maxMainWidth,
                tabbableCount: metrics.tabbableCount,
                hasExternalImageHotlink,
                screenshotPath: screenshotRel,
                issueSummary: [
                  statusCode >= 400 ? `http=${statusCode}` : null,
                  !metrics.hasMain ? 'missing <main>' : null,
                  !hasH1 ? 'missing h1' : null,
                  overflowX ? 'horizontal overflow' : null,
                  !metrics.hasFocusVisibleRule ? 'no :focus-visible rule detected' : null,
                  !keyboardReachable ? 'keyboard tab did not reach interactive element' : null,
                  !containerReadable ? 'container width exceeds readable threshold' : null,
                  hasExternalImageHotlink ? 'external image hotlink detected' : null,
                ].filter(Boolean).join('; '),
              };

              row.status = classify(row);
              rows.push(row);
              rowAdded = true;
              break;
            } catch (error) {
              if (attempt < 2 && isBrowserClosedError(error)) {
                try {
                  await browser.close();
                } catch {
                  // no-op
                }
                browser = await launchBrowser();
                continue;
              }

              rows.push({
                route,
                locale,
                breakpoint,
                httpStatus: statusCode || 0,
                hasMain: false,
                h1Count: 0,
                hasH1: false,
                overflowX: false,
                hasFocusVisibleRule: false,
                keyboardReachable: false,
                containerReadable: false,
                maxMainWidth: 0,
                tabbableCount: 0,
                hasExternalImageHotlink: false,
                screenshotPath: null,
                issueSummary: `runtime error: ${error instanceof Error ? error.message : 'unknown error'}`,
                status: 'FAIL',
              });
              rowAdded = true;
              break;
            } finally {
              if (context) {
                try {
                  await context.close();
                } catch {
                  // no-op: keep matrix run progressing even if browser/context already closed
                }
              }
            }
          }

          if (!rowAdded) {
            rows.push({
              route,
              locale,
              breakpoint,
              httpStatus: statusCode || 0,
              hasMain: false,
              h1Count: 0,
              hasH1: false,
              overflowX: false,
              hasFocusVisibleRule: false,
              keyboardReachable: false,
              containerReadable: false,
              maxMainWidth: 0,
              tabbableCount: 0,
              hasExternalImageHotlink: false,
              screenshotPath: null,
              issueSummary: 'runtime error: probe did not produce a row',
              status: 'FAIL',
            });
          }
        }
      }
    }
  } finally {
    try {
      await browser.close();
    } catch {
      // no-op
    }
  }

  const totals = summarizeByStatus(rows);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, 'A1_VALIDATION_MATRIX.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    breakpoints: BREAKPOINTS,
    locales: LOCALES,
    routeTemplates,
    samples,
    totals,
    rows,
  }, null, 2));

  await fs.writeFile(path.join(outputDir, 'A1_VALIDATION_MATRIX.md'), toMarkdown({
    routes: routeTemplates,
    rows,
    totals,
    samples,
  }));

  await fs.writeFile(path.join(outputDir, 'A1_SHARED_UI_GAP_REPORT.md'), toGapReport(rows, totals));

  console.log(`A1 matrix complete: PASS=${totals.PASS} PARTIAL=${totals.PARTIAL} FAIL=${totals.FAIL}`);
  if (totals.FAIL > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
