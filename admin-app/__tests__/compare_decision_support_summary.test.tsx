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
          badges: [{ key: 'roi_snapshot', label: 'ROI snapshot available' }],
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
          avg_roi_percent: null,
          total_projects: 9,
          total_units: 1400,
          as_of_date: '2026-03-01',
          avg_price: 'THB 4.6M',
          avg_rent: 'THB 24K',
          roi_percent: null,
          as_of: '2026-03-01',
        },
        badges: [{ key: 'area_stats_available', label: 'Area stats available' }],
      };
    }),
    fetchProjectBySlug: vi.fn(async (slug: string) => ({
      id: slug === 'alpha-residence' ? 'project-1' : 'project-2',
      slug,
      name: slug === 'alpha-residence' ? 'Alpha Residence' : 'Beta Bay',
      status: 'published',
      property_type: 'condo',
      summary: { en: 'Summary', th: 'สรุป' },
      description: { en: 'Description', th: 'รายละเอียด' },
      amenities: [],
      investment_snapshot: null,
      location: null,
      area: slug === 'alpha-residence'
        ? { id: 'area-1', slug: 'jomtien', name: 'Jomtien' }
        : { id: 'area-2', slug: 'pratumnak', name: 'Pratumnak' },
      created_at: '2026-03-16T00:00:00Z',
      updated_at: '2026-03-16T00:00:00Z',
    })),
  };
});

describe('compare decision support summary', () => {
  it('renders a descriptive summary layer instead of a recommendation', async () => {
    const { container } = render(
      await ComparePage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({ ids: 'project-1,project-2', source: 'shortlist_compare' }),
      }),
    );

    expect(container.querySelector('#compare-decision-summary')).not.toBeNull();
    expect(container.querySelector('#compare_consultation_hero')).toHaveAttribute('href', '/en/contact?ids=project-1%2Cproject-2&source=compare_hero&intent=project_compare&projects=alpha-residence%2Cbeta-bay&buyer_fit=shortlist_narrowing&signal_level=medium');
    expect(container.querySelector('#compare_continue_secondary')).toHaveAttribute('href', '/en/shortlist');
    expect(screen.queryByRole('link', { name: /whatsapp/i })).toBeNull();
    expect(screen.getByRole('heading', { name: /decision support summary/i })).toBeTruthy();
    expect(screen.getByText(/you are currently reading 2 projects in one frame: alpha residence, beta bay/i)).toBeTruthy();
    expect(screen.getByText(/location is still an active decision variable because this set spans 2 different areas/i)).toBeTruthy();
    expect(screen.getByText(/1\/2 projects currently expose ROI snapshots, and 2\/2 projects have enough price or rent context/i)).toBeTruthy();
    expect(screen.getByText(/not to produce an investment verdict/i)).toBeTruthy();
    expect(screen.getByText(/return to the shortlist to remove weaker options/i)).toBeTruthy();
  });
});
