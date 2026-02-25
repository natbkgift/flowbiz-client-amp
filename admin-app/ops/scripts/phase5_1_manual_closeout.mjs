import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const OUT_DIR = path.join('ops', 'logs', 'phase5_1');
const SHOTS_DIR = path.join(OUT_DIR, 'screenshots');

const LOCALES = ['en', 'th'];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ensureDir() {
  await fs.mkdir(SHOTS_DIR, { recursive: true });
}

async function launchBrowser() {
  if (process.env.HEADLESS === '1') {
    const browser = await chromium.launch({ headless: true });
    return { browser, mode: 'headless_forced' };
  }

  try {
    const browser = await chromium.launch({ headless: false, slowMo: 25 });
    return { browser, mode: 'headed' };
  } catch (error) {
    const browser = await chromium.launch({ headless: true });
    return { browser, mode: 'headless_fallback', launchError: String(error?.message || error) };
  }
}

async function loadHomeAndWait(page, locale) {
  const consoleErrors = [];
  const pageErrors = [];
  const seenRequests = [];
  const seenResponses = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/v1/events') || url.includes('/api/v1/inquiries')) {
      seenRequests.push({ method: req.method(), url, postData: req.postData() || null });
    }
  });
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/v1/events') || url.includes('/api/v1/inquiries')) {
      let body = null;
      try { body = await res.text(); } catch {}
      seenResponses.push({ status: res.status(), url, body });
    }
  });

  await page.goto(`${BASE}/${locale}/`, { waitUntil: 'networkidle', timeout: 120000 });

  return { consoleErrors, pageErrors, seenRequests, seenResponses };
}

async function waitForLeadForm(page) {
  for (let i = 0; i < 18; i++) {
    try {
      if (await page.locator('#lead-name').count()) return true;
      await page.evaluate(() => window.scrollBy(0, Math.max(620, window.innerHeight * 0.9)));
      await sleep(450);
    } catch {
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
      await sleep(300);
    }
  }
  try {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  } catch {
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
  }
  await sleep(2000);
  return (await page.locator('#lead-name').count()) > 0;
}

async function fillRequiredForm(page, locale) {
  await page.fill('#lead-name', locale === 'th' ? 'ผู้ทดสอบ' : 'QA Tester');
  await page.fill('#lead-email', 'qa@example.com');
  await page.fill('#lead-phone', '+66000000000');
  await page.selectOption('#lead-budget', { index: 1 });
  await page.selectOption('#lead-purpose', 'invest');
  await page.check('.form-consent input[type="checkbox"]');
}

function parseEventRequest(req) {
  try {
    if (!req.postData) return null;
    const parsed = JSON.parse(req.postData);
    return {
      event_type: parsed.event_type,
      page: parsed.page,
      payload: parsed.payload,
    };
  } catch {
    return null;
  }
}

async function runLeadFormQA(browser, report) {
  for (const locale of LOCALES) {
    // Error state via API intercept
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await context.route('**/api/v1/inquiries', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: locale === 'th' ? 'จำลองข้อผิดพลาด' : 'Simulated API error' }),
        });
      });
      const page = await context.newPage();
      const net = await loadHomeAndWait(page, locale);
      const hasForm = await waitForLeadForm(page);

      const result = {
        locale,
        mode: 'error',
        hasForm,
        screenshot: null,
        request: null,
        response: null,
        ui: null,
        consoleErrors: net.consoleErrors,
        pageErrors: net.pageErrors,
      };

      if (hasForm) {
        const submit = page.locator('button[aria-describedby="lead-form-status"]');
        const statusBefore = await page.locator('#lead-form-status').innerText();
        const submitDisabledBefore = await submit.isDisabled();
        await fillRequiredForm(page, locale);
        const submitDisabledAfter = await submit.isDisabled();
        await submit.click();
        await sleep(700);

        const errorCount = await page.locator('.form-error').count();
        const errorText = errorCount ? await page.locator('.form-error').innerText() : null;
        const shot = path.join(SHOTS_DIR, `${locale}_form_error.png`);
        await page.screenshot({ path: shot, fullPage: true });

        const inquiryReq = net.seenRequests.find((r) => r.url.includes('/api/v1/inquiries'));
        const inquiryRes = net.seenResponses.find((r) => r.url.includes('/api/v1/inquiries'));

        result.screenshot = shot;
        result.request = inquiryReq ? { method: inquiryReq.method, url: inquiryReq.url } : null;
        result.response = inquiryRes ? { status: inquiryRes.status, url: inquiryRes.url } : null;
        result.ui = {
          statusBefore,
          submitDisabledBefore,
          submitDisabledAfter,
          errorVisible: errorCount > 0,
          errorText,
        };
      }

      report.leadForm.push(result);
      await context.close();
    }

    // Success state via API intercept
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await context.route('**/api/v1/inquiries', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: `qa-${locale}-ok` }),
        });
      });
      const page = await context.newPage();
      const net = await loadHomeAndWait(page, locale);
      const hasForm = await waitForLeadForm(page);

      const result = {
        locale,
        mode: 'success',
        hasForm,
        screenshot: null,
        request: null,
        response: null,
        ui: null,
        consoleErrors: net.consoleErrors,
        pageErrors: net.pageErrors,
      };

      if (hasForm) {
        const submit = page.locator('button[aria-describedby="lead-form-status"]');
        await fillRequiredForm(page, locale);
        await submit.click();
        await sleep(700);

        const successCount = await page.locator('.form-success').count();
        const successText = successCount ? await page.locator('.form-success').innerText() : null;
        const stillFilled = {
          name: await page.locator('#lead-name').inputValue(),
          email: await page.locator('#lead-email').inputValue(),
          phone: await page.locator('#lead-phone').inputValue(),
        };

        const shot = path.join(SHOTS_DIR, `${locale}_form_success.png`);
        await page.screenshot({ path: shot, fullPage: true });

        const inquiryReq = net.seenRequests.find((r) => r.url.includes('/api/v1/inquiries'));
        const inquiryRes = net.seenResponses.find((r) => r.url.includes('/api/v1/inquiries'));

        result.screenshot = shot;
        result.request = inquiryReq ? { method: inquiryReq.method, url: inquiryReq.url } : null;
        result.response = inquiryRes ? { status: inquiryRes.status, url: inquiryRes.url } : null;
        result.ui = {
          successVisible: successCount > 0,
          successText,
          fieldStateAfterSubmit: stillFilled,
        };
      }

      report.leadForm.push(result);
      await context.close();
    }
  }
}

async function runKeyboardCheck(browser, report) {
  const focusTargets = [
    '/projects',
    '/buy',
    '/invest',
    '/rent',
    '/sell',
    '/about',
    '/area-guide',
    '/contact',
  ];

  for (const locale of LOCALES) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await loadHomeAndWait(page, locale);

    const tabStops = [];
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press('Tab');
      const row = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        const style = window.getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          className: (el.getAttribute('class') || '').slice(0, 120),
          text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90),
          href: el instanceof HTMLAnchorElement ? el.getAttribute('href') : null,
          outlineWidth: style.outlineWidth,
          outlineStyle: style.outlineStyle,
        };
      });
      if (row) tabStops.push(row);
    }

    const hit = Object.fromEntries(
      focusTargets.map((target) => [target, tabStops.some((t) => (t.href || '').includes(target))])
    );
    const focusVisibleCount = tabStops.filter((t) => t.outlineStyle !== 'none' && t.outlineWidth !== '0px').length;

    report.keyboard.push({ locale, focusVisibleCount, hit, sample: tabStops.slice(0, 35) });
    await context.close();
  }
}

async function runScrollDepthAndAnalyticsCheck(browser, report) {
  for (const locale of LOCALES) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    const requests = [];
    const responses = [];

    page.on('request', (req) => {
      if (req.url().includes('/api/v1/events')) {
        requests.push({ url: req.url(), method: req.method(), postData: req.postData() || null });
      }
    });

    page.on('response', async (res) => {
      if (res.url().includes('/api/v1/events')) {
        let body = null;
        try { body = await res.text(); } catch {}
        responses.push({ url: res.url(), status: res.status(), body });
      }
    });

    await page.goto(`${BASE}/${locale}/`, { waitUntil: 'networkidle', timeout: 120000 });
    await sleep(16500);

    // Scroll down/up in same page multiple times
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => window.scrollBy(0, Math.max(window.innerHeight * 0.9, 700)));
      await sleep(180);
    }
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.scrollBy(0, -Math.max(window.innerHeight * 0.9, 700)));
      await sleep(180);
    }
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => window.scrollBy(0, Math.max(window.innerHeight * 0.9, 700)));
      await sleep(180);
    }

    // Refresh and re-scroll
    await page.reload({ waitUntil: 'networkidle', timeout: 120000 });
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, Math.max(window.innerHeight * 0.9, 700)));
      await sleep(180);
    }

    const allParsedEvents = requests
      .map(parseEventRequest)
      .filter(Boolean);

    const parsedEvents = allParsedEvents.filter((event) => event.event_type === 'scroll_depth');

    const depthValues = parsedEvents
      .map((e) => Number(e.payload?.depth_percent))
      .filter((n) => Number.isFinite(n));

    const dedupePerPageLoad = (() => {
      // Approximation from sequence: if duplicates appear in immediate sequence before reload it's bad.
      // Here we check whether there are >1 of same threshold across all requests in this locale scenario.
      const counts = { 25: 0, 50: 0, 75: 0 };
      for (const value of depthValues) {
        if (value in counts) counts[value] += 1;
      }
      return counts;
    })();

    report.scrollDepth.push({
      locale,
      scrollDepthEvents: parsedEvents,
      observedEventTypes: allParsedEvents.map((event) => event.event_type),
      depthCounts: dedupePerPageLoad,
      eventResponseStatuses: responses.map((r) => r.status),
      sampleRequestShape: parsedEvents[0] || null,
    });

    await context.close();
  }
}

async function main() {
  await ensureDir();
  const runtime = {
    startedAt: new Date().toISOString(),
    base: BASE,
  };

  const launch = await launchBrowser();
  runtime.browserMode = launch.mode;
  if (launch.launchError) runtime.launchError = launch.launchError;

  const report = {
    runtime,
    leadForm: [],
    keyboard: [],
    scrollDepth: [],
    analyticsAcceptance: {
      endpoint: '/api/v1/events',
      notes: [],
    },
  };

  try {
    await runLeadFormQA(launch.browser, report);
    await runKeyboardCheck(launch.browser, report);
    await runScrollDepthAndAnalyticsCheck(launch.browser, report);

    const statuses = report.scrollDepth.flatMap((r) => r.eventResponseStatuses || []);
    report.analyticsAcceptance.notes.push({
      observedResponseStatuses: statuses,
      hasNon2xx: statuses.some((s) => s < 200 || s >= 300),
    });
  } finally {
    await launch.browser.close();
  }

  const outFile = path.join(OUT_DIR, 'phase5_1_manual_closeout_report.json');
  await fs.writeFile(outFile, JSON.stringify(report, null, 2), 'utf8');
  console.log(`WROTE ${outFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
