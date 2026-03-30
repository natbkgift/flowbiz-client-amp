/* eslint-disable @next/next/no-img-element */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HomeHero } from '@/components/home/HomeHero';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const {
      alt,
      fill: _fill,
      priority: _priority,
      fetchPriority: _fetchPriority,
      unoptimized: _unoptimized,
      loader: _loader,
      sizes: _sizes,
      ...rest
    } = props;
    return <img alt={String(alt ?? '')} {...rest} />;
  },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
}));

vi.mock('@/components/home/HeroOverlay', () => ({
  HeroOverlay: () => null,
}));

describe('HomeHero CTA hierarchy', () => {
  it('keeps only two button CTAs in the main hero row and allows the hard-reset hero to run with WhatsApp only', () => {
    const dict = {
      home: {
        heroTitle: 'Find the right Pattaya property path',
        heroSubtitle: 'Structured guidance for buying, investing, and relocating.',
      },
      advisory: {
        heroEyebrow: 'AMP Pattaya',
      },
      guided: {
        heroTrigger: 'Let us guide you',
      },
      cta: {
        whatsapp: 'WhatsApp',
      },
    };

    const { container } = render(
      <HomeHero
        dict={dict}
        locale="en"
        composer={{
          primary_cta_label: 'View Available Units',
          secondary_cta_label: 'Get Price & Floor Plan',
          primary_cta_url: '/en/projects?source=home_hero_primary',
          secondary_cta_url: '/en/contact?topic=price_floor_plan&source=home_hero_secondary',
        }}
      />,
    );

    expect(container.querySelectorAll('.hero-cta-row .btn')).toHaveLength(2);
    expect(container.querySelector('.hero-support-row .hero-whatsapp-link')).not.toBeNull();
    expect(container.querySelector('.hero-support-row .hero-whatsapp-link')).not.toHaveClass('btn');
    expect(container.querySelector('.hero-support-row .hero-guided-trigger')).toBeNull();

    expect(screen.getByRole('link', { name: 'View Available Units' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Get Price & Floor Plan' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Available Units' })).toHaveAttribute('href', '/en/projects?source=home_hero_primary');
    expect(screen.getByRole('link', { name: 'Get Price & Floor Plan' })).toHaveAttribute('href', '/en/contact?topic=price_floor_plan&source=home_hero_secondary');
    expect(screen.getByAltText('AMP Pattaya Real Estate')).toHaveAttribute(
      'src',
      '/images/hero-banner-20260318.webp',
    );
  });

  it('keeps a configured local media hero image when composer provides one', () => {
    const dict = {
      home: {
        heroTitle: 'Find the right Pattaya property path',
        heroSubtitle: 'Structured guidance for buying, investing, and relocating.',
      },
      advisory: {
        heroEyebrow: 'AMP Pattaya',
      },
      guided: {
        heroTrigger: 'Let us guide you',
      },
      cta: {
        whatsapp: 'WhatsApp',
      },
    };

    render(
      <HomeHero
        dict={dict}
        locale="en"
        composer={{ hero_image: '/media/library/hero.webp' }}
      />,
    );

    expect(screen.getByAltText('AMP Pattaya Real Estate')).toHaveAttribute('src', '/media/library/hero.webp');
  });
});
