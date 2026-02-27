import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf-8');
}

describe('A1 matrix runner hardening guards', () => {
  it('normalizes root page route and filters route-group/private segments', () => {
    const script = read('scripts/run-a1-validation-matrix.mjs');

    expect(script).toContain("if (rel === 'page.tsx') return '/';");
    expect(script).toContain(".filter((segment) => !stripRouteGroup(segment))");
    expect(script).toContain(".filter((segment) => !segment.startsWith('_'))");
    expect(script).toContain('function normalizeRouteTemplate(routeTemplate)');
    expect(script).toContain('/page\\.(t|j)sx?$/i.test(noQuery)');
  });

  it('includes browser crash recovery retry and fallback route discovery', () => {
    const script = read('scripts/run-a1-validation-matrix.mjs');

    expect(script).toContain('async function discoverRouteTemplates()');
    expect(script).toContain('parsed.routeTemplates.map(normalizeRouteTemplate).filter(Boolean)');
    expect(script).toContain('isBrowserClosedError(error)');
    expect(script).toContain('browser = await launchBrowser();');
  });

  it('records screenshot and hotlink evidence per matrix row', () => {
    const script = read('scripts/run-a1-validation-matrix.mjs');

    expect(script).toContain('external image hotlink detected');
    expect(script).toContain('await page.screenshot');
    expect(script).toContain('screenshotPath');
  });
});
