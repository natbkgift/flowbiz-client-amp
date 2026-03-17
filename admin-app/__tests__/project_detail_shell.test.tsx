import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ProjectDetailPage from '@/app/(site)/[locale]/projects/[slug]/page';

vi.mock('@/app/_lib/public-api-server', async () => {
  const actual = await vi.importActual<typeof import('@/app/_lib/public-api-server')>('@/app/_lib/public-api-server');
  return {
    ...actual,
    fetchProjectBySlug: vi.fn(async () => ({
      id: 'project-1',
      slug: 'alpha-residence',
      name: 'Alpha Residence',
      status: 'published',
      property_type: 'condo',
      summary: { en: 'Project summary', th: 'สรุปโครงการ' },
      description: { en: 'Project description', th: 'รายละเอียดโครงการ' },
      amenities: ['Pool', 'Gym'],
      investment_snapshot: { gross_yield: '5.8%', starting_price_band: 'THB 5.2M' },
      location: { district: 'Jomtien' },
      area: { id: 'area-1', slug: 'jomtien', name: 'Jomtien' },
      developer: { name: 'AMP Developments' },
      delivery_date: '2027-03-01',
      starting_price: 5200000,
      unit_count: 180,
      floors: 32,
      year_built: 2027,
      created_at: '2026-03-16T00:00:00Z',
      updated_at: '2026-03-16T00:00:00Z',
    })),
    fetchProjectEvaluation: vi.fn(async () => ({
      evaluation_version: 'v1',
      project: { id: 'project-1', slug: 'alpha-residence', name: 'Alpha Residence' },
      area_statistics: {
        avg_price: 'THB 5.2M',
        avg_rent: 'THB 28K',
        roi_percent: '5.8%',
      },
      badges: [{ key: 'roi_snapshot', label: 'ROI snapshot available' }],
    })),
    fetchBlogPosts: vi.fn(async () => ([
      {
        slug: 'alpha-residence-area-brief',
        title: { en: 'Alpha Residence area brief', th: 'สรุปทำเล Alpha Residence' },
        excerpt: { en: 'Jomtien context for shortlist decisions.', th: 'บริบท Jomtien สำหรับการ shortlist' },
      },
    ])),
  };
});

describe('project detail shell', () => {
  it('renders stable project trust sections and owned CTAs', async () => {
    const { container } = render(
      await ProjectDetailPage({
        params: Promise.resolve({ locale: 'en', slug: 'alpha-residence' }),
      }),
    );

    expect(container.querySelector('#project_consultation_primary')).toHaveAttribute(
      'href',
      '/en/contact?intent=project_consultation&project=alpha-residence',
    );
    expect(container.querySelector('#project_compare_secondary')).toHaveAttribute('href', '/en/compare');
    expect(container.querySelector('#project-brief-section')).not.toBeNull();
    expect(container.querySelector('#project-decision-lens')).not.toBeNull();
    expect(container.querySelector('#project-related-reads')).not.toBeNull();
    expect(container.querySelector('#project-trust-grid')).not.toBeNull();
    expect(container.querySelector('#project-advisor-brief')).not.toBeNull();
  });
});