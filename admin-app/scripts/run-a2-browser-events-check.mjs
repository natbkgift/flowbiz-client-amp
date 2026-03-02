import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const API_HOST = '127.0.0.1';
const API_PORT = 8011;
const BASE = `http://${API_HOST}:${API_PORT}`;
const repoRoot = path.resolve(process.cwd(), '..');
const pythonExe = path.join(repoRoot, '.venv', 'Scripts', 'python.exe');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth() {
  for (let i = 0; i < 120; i += 1) {
    try {
      const res = await fetch(`${BASE}/healthz`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await sleep(250);
  }
  throw new Error('API server was not ready in time');
}

function clickWithoutNavigation(locator) {
  return locator.evaluate((el) => {
    el.addEventListener('click', (event) => event.preventDefault(), { once: true });
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

async function run() {
  const server = spawn(pythonExe, ['-m', 'uvicorn', 'apps.api.main:app', '--host', API_HOST, '--port', String(API_PORT)], {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  let browser;
  try {
    await waitForHealth();
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    const tracked = [];
    const inquiries = [];

    await page.route('**/telemetry', async (route) => {
      const payload = route.request().postDataJSON();
      tracked.push(payload);
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, endpoint: '/telemetry' }),
      });
    });

    await page.route('**/v1/inquiries', async (route) => {
      inquiries.push(route.request().postDataJSON());
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'inq_test' }),
      });
    });

    await page.goto(`${BASE}/en`, { waitUntil: 'domcontentloaded' });

    await clickWithoutNavigation(page.locator('[data-cta-id="hero_primary"]').first());
    await clickWithoutNavigation(page.locator('[data-cta-id="hero_secondary"]').first());
    await clickWithoutNavigation(page.locator('[data-event="home_browse_projects_click"][data-placement="featured_footer"]').first());
    await clickWithoutNavigation(page.locator('[data-event="home_investment_pick_click"]').first());
    await clickWithoutNavigation(page.locator('[data-event="home_whatsapp_click"]').first());

    await page.fill('#name', 'Test User');
    await page.fill('#contact', 'test@example.com');
    await page.selectOption('#budget', '3m_6m');
    await page.selectOption('#purpose', 'invest');
    await page.selectOption('#timeline', '3_6m');
    await page.locator('#consult-submit').click();

    await page.goto(`${BASE}/en/projects`, { waitUntil: 'domcontentloaded' });
    await page.goto(`${BASE}/en/contact`, { waitUntil: 'domcontentloaded' });

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight * 0.95);
      window.dispatchEvent(new Event('scroll'));
    });
    await sleep(200);

    const byName = new Map();
    for (const event of tracked) {
      if (!event?.event) continue;
      if (!byName.has(event.event)) byName.set(event.event, []);
      byName.get(event.event).push(event);
    }

    for (const eventName of [
      'home_hero_primary_click',
      'home_hero_secondary_click',
      'home_whatsapp_click',
      'home_browse_projects_click',
      'home_investment_pick_click',
      'home_form_submit',
      'home_scroll_depth',
    ]) {
      assert.ok(byName.has(eventName), `missing tracked event: ${eventName}`);
    }

    const heroPrimary = byName.get('home_hero_primary_click')[0];
    assert.equal(heroPrimary.locale, 'en');
    assert.equal(heroPrimary.path, '/en');
    assert.ok(typeof heroPrimary.label === 'string' && heroPrimary.label.length > 0);

    const heroSecondary = byName.get('home_hero_secondary_click')[0];
    assert.equal(heroSecondary.locale, 'en');
    assert.equal(heroSecondary.path, '/en');
    assert.ok(typeof heroSecondary.label === 'string' && heroSecondary.label.length > 0);

    const whatsapp = byName.get('home_whatsapp_click')[0];
    assert.equal(whatsapp.locale, 'en');
    assert.equal(whatsapp.placement, 'bottom_form');

    const browse = byName.get('home_browse_projects_click')[0];
    assert.equal(browse.locale, 'en');
    assert.ok(typeof browse.placement === 'string' && browse.placement.length > 0);

    const pick = byName.get('home_investment_pick_click')[0];
    assert.equal(pick.locale, 'en');
    assert.ok(typeof pick.item_id === 'string' && pick.item_id.length > 0);

    const formSubmit = byName.get('home_form_submit')[0];
    assert.equal(formSubmit.locale, 'en');
    assert.equal(formSubmit.intent, 'invest');
    assert.ok(Array.isArray(formSubmit.fields_present) && formSubmit.fields_present.length >= 5);

    assert.equal(inquiries.length, 1);
    assert.equal(inquiries[0].budget_band, '3m_6m');
    assert.equal(inquiries[0].timeline, '3_6m');
    assert.equal(inquiries[0].intent, 'invest');

    const scrollDepth = byName.get('home_scroll_depth')[0];
    assert.equal(scrollDepth.locale, 'en');
    assert.ok([25, 50, 75, 90].includes(Number(scrollDepth.depth)));

    console.log(`A2 browser events check passed with ${tracked.length} captured events`);
    await context.close();
  } finally {
    if (browser) {
      await browser.close();
    }
    server.kill('SIGTERM');
    await sleep(300);
    if (!server.killed) server.kill('SIGKILL');
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
