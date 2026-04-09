import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { buildMediaUpstreamUrl, resolveMediaUpstreamBase } from '@/app/api/_lib/media-proxy';
import { GET } from '@/app/api/[...path]/route';

function restoreEnv(snapshot: NodeJS.ProcessEnv) {
  for (const key of Object.keys(process.env)) {
    if (!(key in snapshot)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, snapshot);
}

describe('media proxy route', () => {
  const envSnapshot = { ...process.env };

  afterEach(() => {
    restoreEnv(envSnapshot);
    vi.restoreAllMocks();
  });

  it('derives the media upstream origin from an absolute NEXT_PUBLIC_API_BASE', () => {
    delete process.env.LOCAL_MEDIA_ORIGIN;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_API_BASE = 'https://amppattaya.com/api';

    expect(resolveMediaUpstreamBase()).toBe('https://amppattaya.com');
    expect(buildMediaUpstreamUrl(['project-covers', 'hero.webp'], '?v=1')).toBe(
      'https://amppattaya.com/media/project-covers/hero.webp?v=1',
    );
  });

  it('prefers LOCAL_MEDIA_ORIGIN when explicitly provided', () => {
    process.env.LOCAL_MEDIA_ORIGIN = 'https://cdn.example.com/assets';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://amppattaya.com';
    process.env.NEXT_PUBLIC_API_BASE = 'https://amppattaya.com/api';

    expect(resolveMediaUpstreamBase()).toBe('https://cdn.example.com/assets');
    expect(buildMediaUpstreamUrl(['gallery', 'cover image.webp'], '')).toBe(
      'https://cdn.example.com/assets/media/gallery/cover%20image.webp',
    );
  });

  it('proxies GET requests to the resolved upstream media URL', async () => {
    delete process.env.LOCAL_MEDIA_ORIGIN;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_API_BASE = 'https://amppattaya.com/api';

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('image-bytes', {
        status: 200,
        headers: {
          'content-type': 'image/webp',
          'cache-control': 'public, max-age=3600',
        },
      }),
    );

    const request = new NextRequest('http://127.0.0.1:3215/media/project-covers/hero.webp?v=1');
    const response = await GET(request, {
      params: Promise.resolve({ path: ['media', 'project-covers', 'hero.webp'] }),
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://amppattaya.com/media/project-covers/hero.webp?v=1',
      expect.objectContaining({
        method: 'GET',
        redirect: 'manual',
        cache: 'no-store',
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/webp');
    expect(response.headers.get('cache-control')).toBe('public, max-age=3600');
  });

  it('returns a local placeholder when upstream media is missing', async () => {
    delete process.env.LOCAL_MEDIA_ORIGIN;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_API_BASE = 'https://amppattaya.com/api';

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('missing', {
        status: 404,
        headers: {
          'content-type': 'text/plain',
        },
      }),
    );

    const request = new NextRequest('http://127.0.0.1:3215/media/import-assets/units-buy/example/missing.jpg');
    const response = await GET(request, {
      params: Promise.resolve({ path: ['media', 'import-assets', 'units-buy', 'example', 'missing.jpg'] }),
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://amppattaya.com/media/import-assets/units-buy/example/missing.jpg',
      expect.objectContaining({
        method: 'GET',
        redirect: 'manual',
        cache: 'no-store',
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/svg+xml');
    expect(response.headers.get('x-flowbiz-media-fallback')).toBe('1');
    await expect(response.text()).resolves.toContain('<svg');
  });
});
