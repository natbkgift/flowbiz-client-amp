import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ComparePage from '@/app/(site)/[locale]/compare/page';

vi.mock('@/app/_lib/public-api-server', async () => {
  const actual = await vi.importActual<typeof import('@/app/_lib/public-api-server')>('@/app/_lib/public-api-server');
  return {
    ...actual,
    fetchProjectEvaluation: vi.fn(async (projectId: string) => {
      if (projectId === 'project-1') {
        return {
          evaluation_version: 'v1',
          project: {
            id: 'project-1',
            slug: 'alpha-residence',
            name: 'Alpha Residence',
            area_id: 'area-1',
            status: 'published',
            created_at: '2026-03-16T00:00:00Z',
            updated_at: '2026-03-16T00:00:00Z',
          },
          area_statistics: {
            area_id: 'area-1',
            avg_price_sqm: '120000',
            avg_rent_monthly: '28000',
            avg_roi_percent: '5.8',
            total_projects: 12,
            total_units: 1800,
            as_of_date: '2026-03-01',
            avg_price: 'THB 5.2M',
            avg_rent: 'THB 28K',
            roi_percent: '5.8%',
            as_of: '2026-03-01',
          },
          badges: [{ key: 'area_stats_available', label: 'Area stats available' }],
        };
      }

      return {
        evaluation_version: 'v1',
        project: {
          id: 'project-2',
          slug: 'beta-bay',
          name: 'Beta Bay',
          area_id: 'area-2',
          status: 'published',
          created_at: '2026-03-16T00:00:00Z',
          updated_at: '2026-03-16T00:00:00Z',
        },
        area_statistics: {
          area_id: 'area-2',
          avg_price_sqm: '98000',
          avg_rent_monthly: '24000',
          avg_roi_percent: '6.4',
          total_projects: 9,
          total_units: 1400,
          as_of_date: '2026-03-01',
          avg_price: 'THB 4.6M',
          avg_rent: 'THB 24K',
          roi_percent: '6.4%',
          as_of: '2026-03-01',
        },
        badges: [{ key: 'roi_snapshot', label: 'ROI snapshot' }],
      };
    }),
    fetchProjectBySlug: vi.fn(async (slug: string) => {
      if (slug === 'alpha-residence') {
        return {
          id: 'project-1',
          slug,
          name: 'Alpha Residence',
          status: 'published',
          property_type: 'condo',
          summary: { en: 'Summary', th: 'สรุป' },
          description: { en: 'Description', th: 'รายละเอียด' },
          amenities: [],
          investment_snapshot: null,
          location: null,
          area: { id: 'area-1', slug: 'jomtien', name: 'Jomtien' },
          created_at: '2026-03-16T00:00:00Z',
          updated_at: '2026-03-16T00:00:00Z',
        };
      }

      return {
        id: 'project-2',
        slug,
        name: 'Beta Bay',
        status: 'published',
        property_type: 'condo',
        summary: { en: 'Summary', th: 'สรุป' },
        description: { en: 'Description', th: 'รายละเอียด' },
        amenities: [],
        investment_snapshot: null,
        location: null,
        area: { id: 'area-2', slug: 'pratumnak', name: 'Pratumnak' },
        created_at: '2026-03-16T00:00:00Z',
        updated_at: '2026-03-16T00:00:00Z',
      };
    }),
  };
});

describe('compare area surface', () => {
  it('renders an area comparison read when compared projects resolve to different areas', async () => {
    const { container } = render(
      await ComparePage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({ ids: 'project-1,project-2' }),
      }),
    );

    expect(container.querySelector('#compare-area-context')).not.toBeNull();
    expect(container.querySelector('#compare_consultation_hero')).toHaveAttribute('href', '/en/contact?intent=consultation&source=compare_hero');
    expect(container.querySelector('#compare_open_smart_finder')).toHaveAttribute('href', '/en/smart-finder');
    expect(screen.getByRole('heading', { name: /area comparison read/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Jomtien' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Pratumnak' })).toBeTruthy();
    expect(screen.getByText(/currently represented by alpha residence/i)).toBeTruthy();
    expect(screen.getByText(/currently represented by beta bay/i)).toBeTruthy();
    expect(screen.getAllByText('THB 5.2M')[0]).toBeTruthy();
    expect(screen.getAllByText('THB 4.6M')[0]).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /open area brief/i }).map((link) => link.getAttribute('href'))).toEqual([
      '/en/areas/jomtien',
      '/en/areas/pratumnak',
    ]);
  });
});