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
  it('keeps only two button CTAs in the main hero row and keeps WhatsApp as a text link', () => {
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
    expect(container.querySelector('.home-hero-slider__support .hero-whatsapp-link')).not.toBeNull();
    expect(container.querySelector('.home-hero-slider__support .hero-whatsapp-link')).not.toHaveClass('btn');
    expect(container.querySelector('.home-hero-slider__controls')).toBeNull();

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

  it('keeps a configured local media hero image and renders controls when multiple slides exist', () => {
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
        slides={[
          {
            key: 'custom-slide',
            eyebrow: 'Wongamat',
            heading: 'Open a sharper coastal route',
            subheading: 'One calmer slide for the premium Pattaya route.',
            imageSrc: '/media/library/hero.webp',
          },
          {
            key: 'custom-slide-2',
            eyebrow: 'Jomtien',
            heading: 'Second slide',
            subheading: 'Used to verify controls render when multiple slides are present.',
            imageSrc: '/media/library/hero-2.webp',
          },
        ]}
      />,
    );

    const images = screen.getAllByAltText('AMP Pattaya Real Estate');
    expect(images[0]).toHaveAttribute('src', '/media/library/hero.webp');
    expect(screen.getByRole('heading', { name: 'Find the right Pattaya property path' })).toBeInTheDocument();
    expect(screen.getByText('Open a sharper coastal route')).toBeInTheDocument();
    expect(screen.getByLabelText('Hero slide controls')).toBeInTheDocument();
  });
});
