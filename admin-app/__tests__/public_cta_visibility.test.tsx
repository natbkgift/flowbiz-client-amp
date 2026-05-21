import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FloatingWhatsAppCTA } from '@/components/ux/FloatingWhatsAppCTA';
import { StickyMobileCTA } from '@/components/ux/StickyMobileCTA';

let mockedPathname = '/en';

vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
}));

describe('public CTA visibility', () => {
  it('renders the sticky mobile CTA on the localized home route', () => {
    mockedPathname = '/en';

    const { container } = render(<StickyMobileCTA />);

    expect(container.querySelector('.mobile-cta')).toHaveClass('mobile-cta--visible');
    expect(container.querySelector('.mobile-cta__primary a')).toHaveAttribute(
      'href',
      '/en/contact?topic=consultation&source=home_mobile_sticky_primary',
    );
    expect(container.querySelector('.mobile-cta__secondary a')).toHaveAttribute(
      'href',
      '/en/projects?source=home_mobile_sticky_secondary',
    );
  });

  it('does not render the sticky mobile CTA on the projects listing route', () => {
    mockedPathname = '/en/projects';

    const { container } = render(<StickyMobileCTA />);

    expect(container.querySelector('.mobile-cta')).toBeNull();
  });

  it('does not render sticky or floating takeover CTAs on project detail routes', () => {
    mockedPathname = '/en/projects/sample-project';

    const stickyRender = render(<StickyMobileCTA />);
    expect(stickyRender.container.querySelector('.mobile-cta')).toBeNull();
    stickyRender.unmount();

    const floatingRender = render(<FloatingWhatsAppCTA />);
    expect(floatingRender.container.querySelector('.floating-cta')).toBeNull();
  });

  it('shows the sticky mobile CTA on other inner public routes', () => {
    mockedPathname = '/en/about';

    const { container } = render(<StickyMobileCTA />);

    expect(container.querySelector('.mobile-cta')).toHaveClass('mobile-cta--visible');
  });

  it('does not render the sticky or floating takeover CTAs on catalogue routes that own their CTAs', () => {
    for (const pathname of ['/en/buy', '/en/rent']) {
      mockedPathname = pathname;

      const stickyRender = render(<StickyMobileCTA />);
      expect(stickyRender.container.querySelector('.mobile-cta')).toBeNull();
      stickyRender.unmount();

      const floatingRender = render(<FloatingWhatsAppCTA />);
      expect(floatingRender.container.querySelector('.floating-cta')).toBeNull();
      floatingRender.unmount();
    }
  });

  it('does not render the sticky mobile CTA on compare and smart finder routes', () => {
    mockedPathname = '/en/compare';
    const compareRender = render(<StickyMobileCTA />);
    expect(compareRender.container.querySelector('.mobile-cta')).toBeNull();
    compareRender.unmount();

    mockedPathname = '/en/smart-finder';
    const finderRender = render(<StickyMobileCTA />);
    expect(finderRender.container.querySelector('.mobile-cta')).toBeNull();
  });

  it('does not render the floating WhatsApp CTA on the localized home route', () => {
    mockedPathname = '/th';

    const { container } = render(<FloatingWhatsAppCTA />);

    expect(container.querySelector('.floating-cta')).toBeNull();
  });

  it('does not render the floating WhatsApp CTA on the projects listing route', () => {
    mockedPathname = '/en/projects';

    const { container } = render(<FloatingWhatsAppCTA />);
    expect(container.querySelector('.floating-cta')).toBeNull();
  });

  it('renders the floating WhatsApp CTA on generic inner public routes', () => {
    mockedPathname = '/en/about';

    const { container } = render(<FloatingWhatsAppCTA />);
    const link = container.querySelector('.floating-cta');

    expect(link).not.toBeNull();
    expect(link).toHaveAttribute('href', 'https://wa.me/66634533526');
  });

  it('does not render the floating WhatsApp CTA on page-owned conversion routes', () => {
    mockedPathname = '/en/contact';

    const { container } = render(<FloatingWhatsAppCTA />);

    expect(container.querySelector('.floating-cta')).toBeNull();
  });

  it('does not render the floating WhatsApp CTA on compare and smart finder routes', () => {
    mockedPathname = '/en/compare';
    const compareRender = render(<FloatingWhatsAppCTA />);
    expect(compareRender.container.querySelector('.floating-cta')).toBeNull();
    compareRender.unmount();

    mockedPathname = '/en/smart-finder';
    const finderRender = render(<FloatingWhatsAppCTA />);
    expect(finderRender.container.querySelector('.floating-cta')).toBeNull();
  });

  it('does not render floating or sticky takeover CTAs on other page-owned advisory routes', () => {
    const pageOwnedRoutes = [
      '/en/areas/jomtien',
      '/en/blog/pattaya-yields',
      '/en/invest',
      '/en/investment',
      '/en/investor',
      '/en/property/skyline-ocean-premier-2br-sea-view',
      '/en/sell',
      '/en/shortlist',
      '/en/shortlist/shared/share-token-123',
    ];

    for (const pathname of pageOwnedRoutes) {
      mockedPathname = pathname;

      const stickyRender = render(<StickyMobileCTA />);
      expect(stickyRender.container.querySelector('.mobile-cta')).toBeNull();
      stickyRender.unmount();

      const floatingRender = render(<FloatingWhatsAppCTA />);
      expect(floatingRender.container.querySelector('.floating-cta')).toBeNull();
      floatingRender.unmount();
    }
  });

  it('keeps the sticky mobile tray to one primary and one secondary action', () => {
    mockedPathname = '/en/about';

    const { container } = render(<StickyMobileCTA />);

    expect(container.querySelectorAll('.mobile-cta__primary a')).toHaveLength(1);
    expect(container.querySelectorAll('.mobile-cta__secondary a')).toHaveLength(1);
  });
});
