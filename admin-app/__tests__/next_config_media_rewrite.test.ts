import path from 'node:path';
import { createRequire } from 'node:module';

import { afterEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const configPath = path.join(process.cwd(), 'next.config.js');

function loadNextConfig() {
  delete require.cache[require.resolve(configPath)];
  return require(configPath);
}

function restoreEnv(snapshot: NodeJS.ProcessEnv) {
  for (const key of Object.keys(process.env)) {
    if (!(key in snapshot)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, snapshot);
}

describe('next.config media rewrite', () => {
  const envSnapshot = { ...process.env };

  afterEach(() => {
    restoreEnv(envSnapshot);
    delete require.cache[require.resolve(configPath)];
  });

  it('derives /media rewrites from an absolute NEXT_PUBLIC_API_BASE during standalone QA', async () => {
    delete process.env.NEXT_LOCAL_CONFIG_MINIMAL;
    delete process.env.LOCAL_API_ORIGIN;
    delete process.env.LOCAL_MEDIA_ORIGIN;
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_API_BASE = 'https://amppattaya.com/api';

    const nextConfig = loadNextConfig();
    const rewrites = await nextConfig.rewrites();

    expect(rewrites.afterFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: '/api/:path((?!platform/version(?:/)?$|platform/deploy-history(?:/)?$|media(?:/|$)).*)',
          destination: 'https://amppattaya.com/api/:path',
        }),
      ]),
    );
    expect(rewrites.beforeFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: '/media/:path*',
          destination: 'https://amppattaya.com/media/:path*',
        }),
      ]),
    );
  });

  it('allows the image quality values used by public homepage surfaces', () => {
    delete process.env.NEXT_LOCAL_CONFIG_MINIMAL;

    const nextConfig = loadNextConfig();

    expect(nextConfig.images?.qualities).toEqual(
      expect.arrayContaining([60, 72, 75, 76]),
    );
  });

  it('still supports media-only rewrites when LOCAL_MEDIA_ORIGIN is set explicitly', async () => {
    delete process.env.NEXT_LOCAL_CONFIG_MINIMAL;
    delete process.env.LOCAL_API_ORIGIN;
    delete process.env.NEXT_PUBLIC_API_BASE;
    process.env.NODE_ENV = 'production';
    process.env.LOCAL_MEDIA_ORIGIN = 'https://cdn.example.com';

    const nextConfig = loadNextConfig();
    const rewrites = await nextConfig.rewrites();

    expect(rewrites.beforeFiles).toEqual([
      {
        source: '/media/:path*',
        destination: 'https://cdn.example.com/media/:path*',
      },
    ]);
  });
});
