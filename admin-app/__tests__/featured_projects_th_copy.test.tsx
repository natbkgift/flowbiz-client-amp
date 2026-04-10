import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FeaturedProjects } from '@/components/home/FeaturedProjects';

vi.mock('next/image', () => ({
  default: ({
    alt,
    className,
    fill,
    loader,
    priority,
    src,
    style,
    unoptimized,
    fetchPriority,
  }: any) => (
    <div
      aria-label={alt ?? ''}
      className={className}
      data-next-image={typeof src === 'string' ? src : ''}
      style={style}
    />
  ),
}));

describe('FeaturedProjects Thai copy', () => {
  it('omits the section entirely when no publish-ready projects are available', () => {
    const { container } = render(
      <FeaturedProjects
        projects={[]}
        locale="th"
        title="โครงการแนะนำ"
        subtitle="คัดสรรตามเป้าหมาย"
      />,
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText(/shortlist/i)).toBeNull();
  });

  it('keeps populated project cards localized without shortlist jargon', () => {
    const { container } = render(
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
            summary: { th: 'คอนโดทำเลจอมเทียนที่มีข้อมูลโครงการเผยแพร่ชัดเจน' },
            area: { id: 'area-1', slug: 'jomtien', name: 'Jomtien' },
            property_type: 'condo',
          } as never,
        ]}
      />,
    );

    expect(screen.getByText('โครงการแนะนำ')).toBeInTheDocument();
    expect(screen.getByText('ดูสรุปโครงการ')).toBeInTheDocument();
    expect(screen.queryByText(/shortlist/i)).toBeNull();
    expect(container.querySelector('.premium-project-card__fact-label')).toBeNull();
  });
});
