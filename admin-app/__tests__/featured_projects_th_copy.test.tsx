import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FeaturedProjects } from '@/components/home/FeaturedProjects';

vi.mock('next/image', () => ({
  default: ({
    alt,
    className,
    src,
    style,
  }: any) => (
    <div
      role="img"
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
    expect(container.querySelector('article.public-project-card.public-card-foundation')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Alpha Residence' })).toBeInTheDocument();
    expect(screen.getByText('จอมเทียน')).toBeInTheDocument();
    expect(screen.getByText('เริ่มต้น ฿6,900,000')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Alpha Residence' })).toHaveAttribute(
      'href',
      '/th/projects/alpha-residence',
    );
    expect(screen.getByRole('link', { name: 'ดูสรุปโครงการ' })).toHaveAttribute(
      'href',
      '/th/projects/alpha-residence',
    );
    expect(screen.queryByText(/shortlist/i)).toBeNull();
    expect(container.querySelector('.premium-project-card')).toBeNull();
    expect(container.querySelector('.premium-project-card__fact-label')).toBeNull();
    expect(container.textContent).not.toContain('undefined');
    expect(container.textContent).not.toContain('null');
  });

  it('keeps sparse home project data renderable through the public card mapper', () => {
    const { container } = render(
      <FeaturedProjects
        locale="en"
        title="Featured projects"
        subtitle="Curated for Pattaya buyers"
        projects={[
          {
            id: 'project-2',
            slug: 'minimal-project',
            name: 'Minimal Pattaya Project',
            status: 'published',
            cover_image_url: null,
            starting_price: null,
            summary: null,
            description: null,
            area: null,
            created_at: null,
            updated_at: null,
          },
        ]}
      />,
    );

    const card = container.querySelector('article.public-project-card.public-card-foundation');
    expect(card).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Minimal Pattaya Project' })).toBeInTheDocument();
    expect(screen.getByText('Pattaya')).toBeInTheDocument();
    expect(screen.getByText('Price on request')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Minimal Pattaya Project' })).toHaveAttribute(
      'href',
      '/en/projects/minimal-project',
    );
    expect(container.textContent).not.toContain('undefined');
    expect(container.textContent).not.toContain('null');
  });
});
