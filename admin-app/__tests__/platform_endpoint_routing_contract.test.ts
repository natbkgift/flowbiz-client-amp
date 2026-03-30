import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('platform endpoint routing contract', () => {
  it('keeps public platform endpoints out of the generic /api upstream rewrite', () => {
    const nextConfig = read('next.config.js');
    const proxyRoute = read('app/api/[...path]/route.ts');

    expect(nextConfig).toContain('platform/version');
    expect(nextConfig).toContain('platform/deploy-history');
    expect(nextConfig).toContain("Keep sanitized public platform endpoints inside Next route handlers.");
    expect(proxyRoute).toContain('isPlatformVersionRoute');
    expect(proxyRoute).toContain('isPlatformDeployHistoryRoute');
    expect(proxyRoute).toContain('buildVersionPayload');
    expect(proxyRoute).toContain("detail: 'Not Found'");
  });
});
