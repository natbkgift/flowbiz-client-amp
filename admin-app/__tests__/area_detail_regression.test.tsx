import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import AreaPage from '@/app/(site)/[locale]/areas/[slug]/page';
import { fetchAreaBySlug } from '@/app/_lib/public-api-server';

const flatAreaPayload = {
  id: '2b01c92d-484c-4197-bd1e-52c022e70523',
  slug: 'qa-area-jomtien',
  name: 'Jomtien Advisory Zone',
  city: 'Pattaya',
  status: 'published',
  hero_image_url: null,
  statistics: null,
  content: null,
  map_center: null,
  created_at: '2026-03-13T02:00:22',
  updated_at: '2026-03-13T02:00:22',
};

describe('area detail flat-payload regression', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_API_BASE;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it('normalizes flat payloads from /v1/areas/{slug}', async () => {
    process.env.NEXT_PUBLIC_API_BASE = 'http://area-api.local';

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(flatAreaPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await fetchAreaBySlug(flatAreaPayload.slug);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0] ?? '')).toContain(`/v1/areas/${flatAreaPayload.slug}`);
    expect(result).toEqual({
      area: {
        id: flatAreaPayload.id,
        slug: flatAreaPayload.slug,
        name: flatAreaPayload.name,
        city: flatAreaPayload.city,
        status: flatAreaPayload.status,
        hero_image_url: null,
        created_at: flatAreaPayload.created_at,
        updated_at: flatAreaPayload.updated_at,
      },
      statistics: null,
      content: null,
      map_center: null,
    });
  });

  it('renders the advisory page instead of the not-found state for published dynamic slugs', async () => {
    process.env.NEXT_PUBLIC_API_BASE = 'http://area-api.local';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes(`/v1/areas/${flatAreaPayload.slug}`)) {
        return new Response(JSON.stringify(flatAreaPayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Unexpected fetch in area detail regression test: ${url}`);
    });

    const markup = renderToStaticMarkup(
      await AreaPage({
        params: Promise.resolve({ locale: 'th', slug: flatAreaPayload.slug }),
      }),
    );

    expect(markup).toContain(flatAreaPayload.name);
    expect(markup).not.toContain('ไม่พบพื้นที่');
    expect(markup).toContain('เริ่มจากพื้นที่ก่อนเลือกโครงการ');
    expect(markup).toContain('area_consultation');
    expect(markup).toContain(flatAreaPayload.slug);
    expect(markup).toContain('area_consultation_primary');
    expect(markup).toContain('area-authority-snapshot');
    expect(markup).toContain('สรุปข้อมูลทำเล');
    expect(markup).not.toContain('btn btn-tertiary');
  });
});
