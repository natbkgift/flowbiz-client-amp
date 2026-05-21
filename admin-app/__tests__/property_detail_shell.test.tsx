import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PropertyPage from '@/app/(site)/[locale]/property/[slug]/page';

const propertyState = vi.hoisted(() => ({
  mode: 'strong' as 'strong' | 'thin' | 'missing' | 'noMedia' | 'manyImages' | 'rent',
}));

vi.mock('next/image', () => ({
  default: ({ fill, unoptimized, priority, fetchPriority, loader, ...props }: any) => <img {...props} alt={props.alt ?? ''} />,
}));

vi.mock('@/components/analytics/EntityViewTracker', () => ({
  EntityViewTracker: ({ eventType, entityId, pathname }: { eventType: string; entityId: string; pathname: string }) => (
    <div data-testid="entity-view-tracker" data-event-type={eventType} data-entity-id={entityId} data-pathname={pathname} />
  ),
}));

vi.mock('@/components/shortlist/ShortlistSaveButton', () => ({
  ShortlistSaveButton: () => <button type="button">Save shortlist</button>,
}));

vi.mock('@/app/_lib/public-api-server', async () => {
  const actual = await vi.importActual<typeof import('@/app/_lib/public-api-server')>('@/app/_lib/public-api-server');
  return {
    ...actual,
    fetchPropertyBySlug: vi.fn(async () => {
      if (propertyState.mode === 'rent') {
        return {
          id: 'property-rent',
          slug: 'central-rent-ready',
          title: 'Central Rent Ready 1BR',
          address: 'Central Pattaya',
          city: 'Pattaya',
          price: 45000,
          bedrooms: 1,
          bathrooms: 1,
          size: 42,
          type: 'rent',
          description: 'Complete rent condo fixture for property detail QA.',
          cover_image: '/images/property-interior.png',
          local_images: ['/images/property-interior.png'],
          images: ['/images/condo-view.png'],
        };
      }

      if (propertyState.mode === 'manyImages') {
        return {
          id: 'property-many-images',
          slug: 'gallery-condo',
          title: 'Gallery Condo With Many Images',
          address: 'Wongamat',
          city: 'Pattaya',
          price: 24500000,
          bedrooms: 3,
          bathrooms: 3,
          size: 142,
          type: 'resale',
          description: 'Sale condo fixture with a larger media set.',
          cover_image: '/images/condo-view.png',
          local_images: [
            '/images/property-interior.png',
            '/images/property-exterior.png',
            '/images/property-pool.png',
            '/images/project-overview.png',
            '/images/area-guide-pattaya.png',
            '/images/hero-banner.png',
            '/images/villa-garden.png',
          ],
          images: [],
        };
      }

      if (propertyState.mode === 'missing') {
        return {
          id: 'property-missing',
          slug: 'missing-optional-condo',
          title: 'Missing Optional Condo',
          address: 'Pratumnak Hill',
          city: 'Pattaya',
          price: 7200000,
          bedrooms: null,
          bathrooms: null,
          size: null,
          type: 'resale',
          description: null,
          cover_image: null,
          local_images: [],
          images: ['/images/area-guide-pattaya.png'],
        };
      }

      if (propertyState.mode === 'noMedia') {
        return {
          id: 'property-no-media',
          slug: 'no-media-condo',
          title: 'No Media Condo',
          address: 'Naklua',
          city: 'Pattaya',
          price: 3300000,
          bedrooms: 1,
          bathrooms: 1,
          size: 31,
          type: 'resale',
          description: 'Fallback media fixture.',
          cover_image: null,
          local_images: null,
          images: null,
        };
      }

      if (propertyState.mode === 'thin') {
        return {
          id: 'property-thin',
          slug: 'azure-condo',
          title: 'Azure Condo',
          address: '123 Beach Road',
          city: 'Pattaya',
          price: 4500000,
          bedrooms: 2,
          bathrooms: 2,
          size: 68,
          type: 'resale',
          description: '—',
          cover_image: '/images/property-cover.jpg',
          local_images: [],
          images: [],
        };
      }

      return {
        id: 'property-1',
        slug: 'azure-condo',
        title: 'Azure Condo',
        address: '123 Beach Road',
        city: 'Pattaya',
        price: 4500000,
        bedrooms: 2,
        bathrooms: 2,
        size: 68,
        type: 'resale',
        description: 'Well-kept resale unit close to the beach.',
        cover_image: '/images/property-cover.jpg',
        local_images: ['/images/property-cover.jpg'],
        images: [],
      };
    }),
    fetchProperties: vi.fn(async () => ({
      data: [
        {
          id: 'property-2',
          slug: 'nearby-condo',
          title: 'Nearby Condo',
          city: 'Pattaya',
          type: 'resale',
          price: 4200000,
          cover_image: '/images/nearby.jpg',
          local_images: [],
          images: [],
        },
      ],
      meta: { page: 1, limit: 12, total: 1 },
    })),
  };
});

describe('property detail shell', () => {
  it('renders stable trust and CTA sections for the property detail route', async () => {
    propertyState.mode = 'strong';

    const { container } = render(
      await PropertyPage({
        params: Promise.resolve({ locale: 'en', slug: 'azure-condo' }),
      }),
    );

    expect(container.querySelector('#property-hero')).not.toBeNull();
    expect(container.querySelector('#property-primary-actions')).not.toBeNull();
    expect(container.querySelector('#property_consultation_primary')?.getAttribute('href')).toContain(
      '/en/contact?intent=project_consultation',
    );
    expect(container.querySelector('#property_consultation_primary')?.getAttribute('href')).toContain(
      'entity_type=property',
    );
    expect(container.textContent ?? '').toContain('Speak to an advisor about this unit');
    expect(container.querySelector('#property-confidence-pack')).not.toBeNull();
    expect(container.querySelector('#property-trust-cues')).not.toBeNull();
    expect(container.querySelector('#property-highlights')).not.toBeNull();
    expect(container.querySelector('#property-local-context')).not.toBeNull();
    expect(container.querySelector('#property-shortlist-fit')).not.toBeNull();
    expect(container.querySelector('#property-decision-cues')).not.toBeNull();
    expect(container.querySelector('#property-next-tools')).not.toBeNull();
    expect(container.querySelector('#property-action-note')).not.toBeNull();
    expect(container.querySelector('#property-direct-channels')).not.toBeNull();
    expect(container.querySelector('#property-lead-form')).not.toBeNull();
    expect(container.querySelector('#property-mobile-cta')).not.toBeNull();
    expect(container.querySelector('[data-testid="entity-view-tracker"]')).toHaveAttribute('data-event-type', 'view_property');
    expect(container.querySelector('[data-testid="entity-view-tracker"]')).toHaveAttribute('data-entity-id', 'property-1');
    expect(container.querySelector('[data-testid="entity-view-tracker"]')).toHaveAttribute('data-pathname', '/en/property/azure-condo');
    expect(container.querySelector('#property-hero.public-surface-card')).not.toBeNull();
    expect(container.querySelector('#property-primary-actions.public-action-row')).not.toBeNull();
    expect(container.querySelector('#property-primary-actions .btn.btn-primary')).not.toBeNull();
    expect(container.querySelectorAll('#property-next-steps a')).toHaveLength(3);
    expect((container.querySelector('#lead-purpose') as HTMLSelectElement | null)?.value).toBe('buy');
  });

  it('keeps Thai property detail copy free from listing and compare drift', async () => {
    propertyState.mode = 'strong';

    const { container } = render(
      await PropertyPage({
        params: Promise.resolve({ locale: 'th', slug: 'azure-condo' }),
      }),
    );

    const markup = container.textContent ?? '';

    expect(markup).toContain('สัญญาณช่วยตัดสินใจระดับยูนิต');
    expect(markup).toContain('จุดเด่นระดับยูนิต');
    expect(markup).toContain('อ่านทำเลนี้อย่างไร');
    expect(markup).toContain('เหตุผลที่ยูนิตนี้ควรอยู่ต่อในรายการคัดไว้');
    expect(markup).toContain('เครื่องมือช่วยตัดสินใจและทางไปต่อ');
    expect(markup).toContain('คุยต่อเกี่ยวกับยูนิตนี้');
    expect(markup).toContain('ไปหน้าเปรียบเทียบ');
    expect(markup).toContain('การส่งรายละเอียดจากหน้านี้จะพกชื่อรายการ ราคา และบริบทของยูนิต');
    expect(markup).not.toContain('inventory');
    expect(markup).not.toContain('listing brief');
    expect(markup).not.toContain('เหตุผลที่ยูนิตนี้ควรอยู่ต่อใน shortlist');
    expect(markup).not.toContain('การส่งบรีฟจากหน้านี้');
    expect(markup).not.toContain('next move');
  });

  it('replaces thin description placeholders with a usable fallback and media status guidance', async () => {
    propertyState.mode = 'thin';

    const { container } = render(
      await PropertyPage({
        params: Promise.resolve({ locale: 'en', slug: 'azure-condo' }),
      }),
    );

    expect(container.querySelector('#property-gallery-status')).not.toBeNull();
    expect(container.textContent ?? '').toContain('The photo pack is still limited on this route');
    expect(container.textContent ?? '').toContain('Azure Condo is a 2-bedroom resale unit');
    expect(container.textContent ?? '').toContain('should be read as a unit-level decision point');
    expect(container.textContent ?? '').not.toContain('Description —');
  });

  it('keeps no-media, missing-field, many-image, rent, and sale states renderable', async () => {
    const cases: Array<{
      mode: typeof propertyState.mode;
      locale: 'en' | 'th';
      expectGalleryStatus?: boolean;
      expectManyThumbs?: boolean;
      expectedPurpose?: 'buy' | 'rent';
    }> = [
      { mode: 'strong', locale: 'en', expectedPurpose: 'buy' },
      { mode: 'rent', locale: 'en', expectedPurpose: 'rent' },
      { mode: 'missing', locale: 'th', expectGalleryStatus: true, expectedPurpose: 'buy' },
      { mode: 'noMedia', locale: 'en', expectGalleryStatus: true, expectedPurpose: 'buy' },
      { mode: 'manyImages', locale: 'en', expectManyThumbs: true, expectedPurpose: 'buy' },
    ];

    for (const testCase of cases) {
      propertyState.mode = testCase.mode;
      const { container, unmount } = render(
        await PropertyPage({
          params: Promise.resolve({ locale: testCase.locale, slug: `${testCase.mode}-condo` }),
        }),
      );

      const visibleClone = container.cloneNode(true) as HTMLElement;
      visibleClone.querySelectorAll('script, style').forEach((node) => node.remove());
      const visibleText = visibleClone.textContent ?? '';

      expect(container.querySelector('#property-hero')).not.toBeNull();
      expect(container.querySelector('#property-primary-actions')).not.toBeNull();
      expect(visibleText).not.toMatch(/\b(undefined|null|NaN)\b/);
      if (testCase.expectGalleryStatus) {
        expect(container.querySelector('#property-gallery-status')).not.toBeNull();
      }
      if (testCase.expectManyThumbs) {
        expect(container.querySelectorAll('.property-gallery__thumb').length).toBeGreaterThan(6);
      }
      expect((container.querySelector('#lead-purpose') as HTMLSelectElement | null)?.value).toBe(testCase.expectedPurpose);
      unmount();
    }
  });
});
