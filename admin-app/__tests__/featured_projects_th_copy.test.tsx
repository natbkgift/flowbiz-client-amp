import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FeaturedProjects } from '@/components/home/FeaturedProjects';

describe('FeaturedProjects Thai copy', () => {
  it('keeps the empty-state handoff localized without shortlist jargon', () => {
    render(
      <FeaturedProjects
        projects={[]}
        locale="th"
        title="โครงการแนะนำ"
        subtitle="คัดสรรตามเป้าหมาย"
      />,
    );

    expect(screen.getByText('ให้ทีมช่วยคัดรายการล่าสุดให้คุณ')).toBeInTheDocument();
    expect(screen.queryByText(/shortlist/i)).toBeNull();
  });

  it('keeps the Thai curated label localized on populated cards', () => {
    render(
      <FeaturedProjects
        locale="th"
        title="โครงการแนะนำ"
        subtitle="คัดสรรตามเป้าหมาย"
        projects={[
          {
            id: 'project-1',
            slug: 'alpha-residence',
            name: 'Alpha Residence',
            status: 'published',
            cover_image_url: null,
            starting_price: 6900000,
          } as never,
        ]}
      />,
    );

    expect(screen.getByText('โครงการคัดสรรของ AMP')).toBeInTheDocument();
    expect(screen.queryByText(/shortlist/i)).toBeNull();
  });
});
