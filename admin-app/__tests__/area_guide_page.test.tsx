import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AreaGuidePage from '@/app/(site)/[locale]/area-guide/page';

vi.mock('@/app/_lib/public-api-server', async () => {
  const actual = await vi.importActual<typeof import('@/app/_lib/public-api-server')>('@/app/_lib/public-api-server');
  return {
    ...actual,
    fetchAreas: vi.fn(async () => ([
      {
        id: 'area-1',
        slug: 'jomtien',
        name: 'Jomtien',
        city: 'Pattaya',
        status: 'published',
        created_at: '2026-03-20T00:00:00Z',
      },
      {
        id: 'area-2',
        slug: 'wongamat',
        name: 'Wongamat',
        city: 'Pattaya',
        status: 'published',
        created_at: '2026-03-20T00:00:00Z',
      },
    ])),
  };
});

describe('area guide page', () => {
  it('shows a broader published area surface with direct links to area briefs', async () => {
    const { container } = render(
      await AreaGuidePage({
        params: Promise.resolve({ locale: 'en' }),
      }),
    );

    expect(screen.getByRole('heading', { level: 1, name: /area guide/i })).toBeTruthy();
    expect(container.querySelector('#area-guide-confidence-pack')).not.toBeNull();
    expect(container.querySelector('#area-guide-process-read')).not.toBeNull();
    expect(screen.getByRole('heading', { name: /how area choice should lead the next step/i })).toBeTruthy();
    expect(screen.getByText(/there are 2 published areas on this page right now/i)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Jomtien' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Wongamat' })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /open area brief/i }).map((link) => link.getAttribute('href'))).toEqual([
      '/en/areas/jomtien',
      '/en/areas/wongamat',
    ]);
  });
});
