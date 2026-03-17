import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import MarketplacePage from '@/app/(site)/[locale]/marketplace/page';
import ProjectsPage from '@/app/(site)/[locale]/projects/page';

vi.mock('@/app/_lib/public-api-server', async () => {
  const actual = await vi.importActual<typeof import('@/app/_lib/public-api-server')>('@/app/_lib/public-api-server');
  return {
    ...actual,
    fetchMarketplaceCategories: vi.fn(async () => ([
      { id: 'cat-1', title: 'บริการตรวจสอบเอกสาร' },
    ])),
    fetchMarketplaceItems: vi.fn(async () => ([
      {
        id: 'item-1',
        name: 'ผู้ช่วยด้านกฎหมาย',
        summary: 'บริการที่คัดแล้วสำหรับผู้ซื้อชาวต่างชาติ',
        image_url: null,
      },
    ])),
    fetchProjects: vi.fn(async () => ([
      {
        id: 'project-1',
        slug: 'alpha-residence',
        name: 'Alpha Residence',
        status: '',
        starting_price: 5200000,
        created_at: '2026-03-15T00:00:00Z',
        updated_at: '2026-03-15T00:00:00Z',
      },
    ])),
    fetchProperties: vi.fn(async () => ({
      data: [],
      meta: { page: 1, limit: 100, total: 0 },
    })),
  };
});

describe('public Thai catalogue copy', () => {
  it('keeps marketplace Thai copy free from listing drift', async () => {
    const { container } = render(await MarketplacePage({ params: Promise.resolve({ locale: 'th' }) }));
    const markup = container.textContent ?? '';

    expect(markup).toContain('มาร์เก็ตเพลส');
    expect(markup).toContain('บริการแนะนำ');
    expect(markup).not.toContain('featured');
    expect(markup).not.toContain('listings');
  });

  it('keeps projects Thai copy free from inventory and shortlist drift', async () => {
    const { container } = render(await ProjectsPage({ params: Promise.resolve({ locale: 'th' }) }));
    const markup = container.textContent ?? '';

    expect(markup).toContain('ผู้ซื้อที่ต้องการดูโครงการที่ตรวจสอบแล้ว');
    expect(markup).toContain('เริ่มจากดูโครงการ แล้วค่อยคัดรายการ');
    expect(markup).toContain('ดูรายการที่บันทึกเข้ารายการคัดไว้ได้');
    expect(markup).not.toContain('inventory');
    expect(markup).not.toContain('shortlist');
    expect(markup).not.toContain('next move');
  });
});