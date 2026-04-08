import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProjectDetailPage from '@/app/(site)/[locale]/projects/[slug]/page';

const projectState = vi.hoisted(() => ({
  mode: 'weak' as 'weak' | 'strong',
}));

vi.mock('@/app/_lib/public-api-server', async () => {
  const actual = await vi.importActual<typeof import('@/app/_lib/public-api-server')>('@/app/_lib/public-api-server');

  return {
    ...actual,
    fetchProjectBySlug: vi.fn(async () => {
      if (projectState.mode === 'strong') {
        return {
          id: 'project-strong',
          slug: 'alpha-residence',
          name: 'Alpha Residence',
          status: 'published',
          property_type: 'condo',
          summary: { en: 'Project summary', th: 'สรุปโครงการ' },
          description: { en: 'A richer project description.', th: 'รายละเอียดโครงการที่สมบูรณ์กว่า' },
          amenities: ['Pool', 'Gym'],
          investment_snapshot: { gross_yield: '5.8%', starting_price_band: 'THB 5.2M' },
          location: { district: 'Jomtien' },
          area: { id: 'area-1', slug: 'jomtien', name: 'Jomtien' },
          developer: { id: 'dev-1', slug: 'amp-developments', name: 'AMP Developments' },
          delivery_date: '2027-03-01',
          starting_price: 5200000,
          unit_count: 180,
          floors: 32,
          year_built: 2027,
          created_at: '2026-03-16T00:00:00Z',
          updated_at: '2026-03-16T00:00:00Z',
        };
      }

      return {
        id: 'project-weak',
        slug: 'beta-tower',
        name: 'Beta Tower',
        status: 'published',
        property_type: 'condo',
        summary: { en: 'Project brief only', th: 'สรุปโครงการแบบย่อ' },
        description: null,
        amenities: null,
        investment_snapshot: null,
        location: null,
        area: { id: 'area-2', slug: 'central-pattaya', name: 'Central Pattaya' },
        developer: { id: 'dev-2', slug: 'beta-developments', name: 'Beta Developments' },
        delivery_date: null,
        starting_price: 4500000,
        unit_count: null,
        floors: null,
        year_built: null,
        created_at: '2026-03-16T00:00:00Z',
        updated_at: '2026-03-16T00:00:00Z',
      };
    }),
    fetchProjectEvaluation: vi.fn(async () => {
      if (projectState.mode === 'strong') {
        return {
          evaluation_version: 'v1',
          project: {
            id: 'project-strong',
            slug: 'alpha-residence',
            name: 'Alpha Residence',
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
          badges: [
            { key: 'roi_snapshot', label: 'ROI snapshot available' },
            { key: 'area_stats_available', label: 'Area statistics available' },
            { key: 'has_cover_image', label: 'Cover image available' },
          ],
        };
      }

      return {
        evaluation_version: 'v1',
        project: {
          id: 'project-weak',
          slug: 'beta-tower',
          name: 'Beta Tower',
          status: 'published',
          created_at: '2026-03-16T00:00:00Z',
          updated_at: '2026-03-16T00:00:00Z',
        },
        area_statistics: null,
        badges: [],
      };
    }),
    fetchBlogPosts: vi.fn(async () => []),
    fetchProperties: vi.fn(async () => ({
      data: [],
      meta: { page: 1, limit: 6, total: 0 },
    })),
  };
});

describe('project detail trust integration', () => {
  beforeEach(() => {
    projectState.mode = 'weak';
  });

  it('renders locked trust framing and low-signal fallback on the page', async () => {
    const { container } = render(
      await ProjectDetailPage({
        params: Promise.resolve({ locale: 'en', slug: 'beta-tower' }),
      }),
    );

    expect(screen.getByRole('heading', { name: 'Verified now' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Gaps to confirm' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Pros' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Cons' })).toBeNull();
    expect(screen.getAllByText(/area context: central pattaya/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/published developer: beta developments/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/check live availability around this project/i)).toBeTruthy();
    expect(screen.getByText(/confirm current rental demand and buyer fit around central pattaya/i)).toBeTruthy();
    expect(screen.getByText(/confirm which unit mix and active availability still match beta tower/i)).toBeTruthy();
    expect(container.querySelector('#project_consultation_primary')).toHaveAttribute(
      'href',
      '/en/contact?intent=project_consultation&source=project_availability_check&project=beta-tower&projects=beta-tower&buyer_fit=project_first_buyer&signal_level=medium&msg=I+am+interested+in+Beta+Tower+and+want+to+confirm+live+unit+availability%2C+price+bands%2C+and+nearby+alternatives+still+open+now.',
    );
    expect(container.querySelector('#project_self_serve_secondary')).toHaveAttribute('href', '/en/buy');

    const verifiedList = screen.getByLabelText('Verified now');
    const gapsList = screen.getByLabelText('Gaps to confirm');
    expect(within(verifiedList).getAllByRole('listitem').length).toBeGreaterThan(0);
    expect(within(gapsList).getAllByRole('listitem').length).toBeGreaterThan(0);
    expect(container.textContent ?? '').not.toContain('ROI snapshot missing');
  });

  it('prefers real snapshot signals over fallback prompts when data is stronger', async () => {
    projectState.mode = 'strong';

    const { container } = render(
      await ProjectDetailPage({
        params: Promise.resolve({ locale: 'en', slug: 'alpha-residence' }),
      }),
    );

    expect(screen.getByRole('heading', { name: 'Verified now' })).toBeTruthy();
    const verifiedList = screen.getByLabelText('Verified now');
    expect(within(verifiedList).getByText(/area context: jomtien/i)).toBeTruthy();
    expect(within(verifiedList).getByText(/entry price: thb 5,200,000/i)).toBeTruthy();
    expect(within(verifiedList).getByText(/market snapshot: avg price thb 5.2m • avg rent thb 28k • roi 5.8%/i)).toBeTruthy();
    expect(screen.getByText(/compare this project with nearby options/i)).toBeTruthy();
    expect(container.querySelector('#project_consultation_primary')).toHaveAttribute(
      'href',
      '/en/contact?intent=project_consultation&source=project_investment_check&project=alpha-residence&projects=alpha-residence&buyer_fit=investor_compare&signal_level=high&msg=I+am+reviewing+Alpha+Residence+and+want+to+compare+its+price%2C+rent%2C+and+investment+context+against+nearby+alternatives.',
    );
    expect(container.querySelector('#project_self_serve_secondary')).toHaveAttribute('href', '/en/compare');
    expect(screen.getByText(/market snapshot available/i)).toBeTruthy();
    expect(screen.queryByText(/confirm current rental demand and buyer fit around/i)).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Pros' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Cons' })).toBeNull();
  });
});
