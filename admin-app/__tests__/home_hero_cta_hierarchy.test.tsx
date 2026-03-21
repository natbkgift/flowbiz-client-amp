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
  it('keeps only two button CTAs in the main hero row and demotes WhatsApp to a support link', () => {
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
        guidedHref="/en?guided=1"
        composer={{
          primary_cta_url: '/en/contact?intent=project_consultation&source=home_hero_primary',
          secondary_cta_url: '/en/projects?source=home_hero_secondary',
        }}
        supportLinks={[
          { label: 'View saved shortlist', href: '/en/shortlist?source=home_hero_support' },
        ]}
      />,
    );

    expect(container.querySelectorAll('.hero-cta-row .btn')).toHaveLength(2);
    expect(container.querySelector('.hero-support-row .hero-whatsapp-link')).not.toBeNull();
    expect(container.querySelector('.hero-support-row .hero-whatsapp-link')).not.toHaveClass('btn');

    expect(screen.getByRole('link', { name: 'Request Consultation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse Projects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Let us guide you' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request Consultation' })).toHaveAttribute('href', '/en/contact?intent=project_consultation&source=home_hero_primary');
    expect(screen.getByRole('link', { name: 'Browse Projects' })).toHaveAttribute('href', '/en/projects?source=home_hero_secondary');
    expect(screen.getByRole('link', { name: 'View saved shortlist' })).toHaveAttribute('href', '/en/shortlist?source=home_hero_support');
    expect(container.querySelector('.hero-support-row .hero-support-link')).not.toHaveClass('btn');
    expect(screen.getByAltText('AMP Pattaya Real Estate')).toHaveAttribute(
      'src',
      '/images/hero-banner.webp?v=20260318',
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
        guidedHref="/en?guided=1"
        composer={{ hero_image: '/media/library/hero.webp' }}
      />,
    );

    expect(screen.getByAltText('AMP Pattaya Real Estate')).toHaveAttribute('src', '/media/library/hero.webp');
  });
});
