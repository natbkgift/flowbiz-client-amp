import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ProjectDeepReview } from '@/components/projects/ProjectDeepReview';

describe('ProjectDeepReview', () => {
  it('renders snapshot explanation blocks with descriptive guardrails', () => {
    render(
      <ProjectDeepReview
        locale="en"
        evaluation={{
          evaluation_version: 'v1',
          project: {
            id: 'project-1',
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
            { key: 'area_stats_available', label: 'Area stats available' },
          ],
        }}
      />,
    );

    expect(screen.getByLabelText(/how to read this snapshot/i)).toBeTruthy();
    expect(screen.getByText(/not a promised return for alpha residence/i)).toBeTruthy();
    expect(screen.getByText(/side-by-side comparison context, not as forward-looking projections/i)).toBeTruthy();
    expect(screen.getByText(/anchored to 2026-03-01/i)).toBeTruthy();
  });
});