import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ProjectDetailPage from '@/app/(site)/[locale]/projects/[slug]/page';

vi.mock('next/image', () => ({
  default: ({ fill, unoptimized, priority, ...props }: any) => <img {...props} alt={props.alt ?? ''} />,
}));

vi.mock('@/components/shortlist/ShortlistSaveButton', () => ({
  ShortlistSaveButton: () => <button type="button">Save shortlist</button>,
}));

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
      hero_image_url: '/images/alpha-residence-hero.jpg',
      cover_image_url: '/images/alpha-residence-cover.jpg',
      images: ['/images/alpha-residence-lobby.jpg', '/images/alpha-residence-pool.jpg'],
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
        excerpt: { en: 'Jomtien context for shortlist decisions.', th: 'บริบท Jomtien สำหรับการคัดรายการ' },
      },
    ])),
    fetchProperties: vi.fn(async () => ({
      data: [
        {
          id: 'property-1',
          source_id: 'source-1',
          slug: 'alpha-residence-1br',
          title: 'Alpha Residence 1BR',
          type: 'resale',
          property_type: 'condo',
          price: 5900000,
          bedrooms: 1,
          bathrooms: 1,
          size_sqm: 47,
          address: 'Alpha Residence, Jomtien',
          city: 'Pattaya',
          images: [],
          local_images: [],
          cover_image: '/images/alpha-1br.jpg',
          status: 'published',
        },
        {
          id: 'property-2',
          source_id: 'source-2',
          slug: 'alpha-residence-2br',
          title: 'Alpha Residence 2BR',
          type: 'resale',
          property_type: 'condo',
          price: 8200000,
          bedrooms: 2,
          bathrooms: 2,
          size_sqm: 82,
          address: 'Alpha Residence, Jomtien',
          city: 'Pattaya',
          images: [],
          local_images: [],
          cover_image: '/images/alpha-2br.jpg',
          status: 'published',
        },
      ],
      meta: { page: 1, limit: 6, total: 2 },
    })),
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
      '/en/contact?intent=project_consultation&source=project_investment_check&project=alpha-residence&projects=alpha-residence&buyer_fit=investor_compare&signal_level=high&msg=I+am+reviewing+Alpha+Residence+and+want+to+compare+its+price%2C+rent%2C+and+investment+context+against+nearby+alternatives.',
    );
    expect(container.querySelector('#project_self_serve_secondary')).toHaveAttribute('href', '/en/compare');
    expect(container.textContent ?? '').toContain('Market snapshot available');
    expect(container.querySelector('#project-confidence-pack')).not.toBeNull();
    expect(container.querySelector('#project-gallery-section')).not.toBeNull();
    expect(container.querySelector('#project-gallery-status')).not.toBeNull();
    expect(container.querySelectorAll('#project-gallery-section [data-media-kind="local"]')).toHaveLength(4);
    expect(container.textContent ?? '').toContain('4 published local-media project visuals are confirmed on this route.');
    expect(container.querySelector('#project-brief-section')).not.toBeNull();
    expect(container.querySelector('#project-why-framework')).not.toBeNull();
    expect(container.querySelector('#project-unit-inventory')).not.toBeNull();
    expect(container.querySelector('#project-decision-lens')).not.toBeNull();
    expect(container.querySelector('#project-related-reads')).not.toBeNull();
    expect(container.querySelector('#project-trust-grid')).not.toBeNull();
    expect(container.querySelector('#project-location-context')).not.toBeNull();
    expect(container.querySelector('#project-advisor-brief')).not.toBeNull();
    expect(container.querySelector('#project-mobile-cta')).not.toBeNull();
    expect(container.querySelector('.public-hero__content.public-surface-card')).not.toBeNull();
    expect(container.querySelector('.public-hero__actions .btn.btn-primary')).not.toBeNull();
    expect(container.querySelector('.project-unit-inventory-grid .property-card')).not.toBeNull();
    expect(container.querySelector('#project_unit_summary_primary')).toHaveAttribute('href', '/en/contact?intent=project_consultation&source=project_investment_check&project=alpha-residence&projects=alpha-residence&buyer_fit=investor_compare&signal_level=high&msg=I+am+reviewing+Alpha+Residence+and+want+to+compare+its+price%2C+rent%2C+and+investment+context+against+nearby+alternatives.');
    expect(container.querySelector('#project_unit_summary_inventory_secondary')).toHaveAttribute('href', '/en/buy');
    expect(container.querySelector('#project_decision_secondary')).toHaveAttribute('href', '/en/compare');
    expect(container.querySelector('#project_next_steps_utility')).toHaveAttribute('href', '/en/buy');
    expect(container.textContent ?? '').toContain('Browse shortlist-ready listings');
    expect(container.textContent ?? '').toContain('Keep this project in the shortlist when the');
    expect(container.textContent ?? '').toContain('Jomtien snapshot still carry more weight than nearby alternatives.');
    expect(container.textContent ?? '').toContain('District: Jomtien');
    expect(container.textContent ?? '').toContain('Read Alpha Residence inside the Jomtien district context first');
    expect(container.querySelectorAll('#project-next-steps a')).toHaveLength(3);
    expect((container.querySelector('#lead-purpose') as HTMLSelectElement | null)?.value).toBe('invest');
  });

  it('keeps Thai project detail copy free from shortlist and brief drift', async () => {
    const { container } = render(
      await ProjectDetailPage({
        params: Promise.resolve({ locale: 'th', slug: 'alpha-residence' }),
      }),
    );

    const markup = container.textContent ?? '';

    expect(markup).toContain('สรุปโครงการเพื่อใช้คัดรายการ');
    expect(markup).toContain('เหตุผลที่โครงการนี้ควรอยู่ต่อใน shortlist');
    expect(markup).toContain('ให้โครงการนี้อยู่ต่อใน shortlist');
    expect(markup).toContain('อ่าน Alpha Residence ในบริบทของย่าน Jomtien ก่อน');
    expect(markup).toContain('ขยับจากการอ่านโครงการไปสู่การดูยูนิตที่ยัง active');
    expect(markup).toContain('ขั้นตอนถัดไปกับทีมที่ปรึกษา');
    expect(markup).toContain('สถานะภาพโครงการที่ยืนยันได้');
    expect(markup).toContain('ส่งบรีฟโครงการให้ที่ปรึกษา');
    expect(markup).toContain('ขอเทียบโครงการนี้กับตัวเลือกใกล้เคียง');
    expect(markup).toContain('จังหวะถัดไปจากหน้าโครงการนี้');
    expect(markup).toContain('ดูรายการที่พร้อมคัดต่อ');
    expect(markup).toContain('การส่งต่อจากหน้านี้จะพกชื่อโครงการ ทำเล และจังหวะถัดไปของการตัดสินใจไปใน inquiry เดียวกัน');
    expect(markup).not.toContain('listing brief');
    expect(markup).not.toContain('inventory');
    expect(markup).not.toContain('area guide');
    expect(markup).not.toContain('next step');
  });
});
