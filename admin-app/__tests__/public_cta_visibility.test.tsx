import { act, fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FloatingWhatsAppCTA } from '@/components/ux/FloatingWhatsAppCTA';
import { StickyMobileCTA } from '@/components/ux/StickyMobileCTA';

let mockedPathname = '/en';
let mockedSearch = '';

vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
  useSearchParams: () => new URLSearchParams(mockedSearch),
}));

describe('public CTA visibility', () => {
  function setScrollY(value: number) {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      writable: true,
      value,
    });
  }

  it('keeps the sticky mobile CTA hidden on the localized home route until the visitor scrolls past the hero', () => {
    mockedPathname = '/en';
    mockedSearch = '';
    setScrollY(0);

    const { container } = render(<StickyMobileCTA />);
    const region = container.querySelector('.mobile-cta');

    expect(region).not.toBeNull();
    expect(region).not.toHaveClass('mobile-cta--visible');

    act(() => {
      setScrollY(180);
      fireEvent.scroll(window);
    });

    expect(region).toHaveClass('mobile-cta--visible');
  });

  it('suppresses the sticky mobile CTA while the guided overlay is open on the home route', () => {
    mockedPathname = '/en';
    mockedSearch = 'guided=1';
    setScrollY(500);

    const { container } = render(<StickyMobileCTA />);
    const region = container.querySelector('.mobile-cta');

    expect(region).not.toBeNull();
    expect(region).not.toHaveClass('mobile-cta--visible');
  });

  it('shows the sticky mobile CTA immediately on inner public routes', () => {
    mockedPathname = '/en/projects';
    mockedSearch = '';
    setScrollY(0);

    const { container } = render(<StickyMobileCTA />);
    const region = container.querySelector('.mobile-cta');

    expect(region).toHaveClass('mobile-cta--visible');
  });

  it('does not render the sticky mobile CTA on routes that already own the primary conversion path', () => {
    mockedPathname = '/en/property/azure-condo';
    mockedSearch = '';
    setScrollY(0);

    const { container } = render(<StickyMobileCTA />);

    expect(container.querySelector('.mobile-cta')).toBeNull();
  });

  it('does not render the sticky mobile CTA on compare and smart finder routes', () => {
    mockedSearch = '';
    setScrollY(0);

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
    mockedSearch = '';

    const { container } = render(<FloatingWhatsAppCTA />);

    expect(container.querySelector('.floating-cta')).toBeNull();
  });

  it('renders the floating WhatsApp CTA on inner public routes', () => {
    mockedPathname = '/en/projects';
    mockedSearch = '';

    const { container } = render(<FloatingWhatsAppCTA />);
    const link = container.querySelector('.floating-cta');

    expect(link).not.toBeNull();
    expect(link).toHaveAttribute('href', 'https://wa.me/66634533526');
  });

  it('does not render the floating WhatsApp CTA on page-owned conversion routes', () => {
    mockedPathname = '/en/contact';
    mockedSearch = '';

    const { container } = render(<FloatingWhatsAppCTA />);

    expect(container.querySelector('.floating-cta')).toBeNull();
  });

  it('does not render the floating WhatsApp CTA on compare and smart finder routes', () => {
    mockedSearch = '';

    mockedPathname = '/en/compare';
    const compareRender = render(<FloatingWhatsAppCTA />);
    expect(compareRender.container.querySelector('.floating-cta')).toBeNull();
    compareRender.unmount();

    mockedPathname = '/en/smart-finder';
    const finderRender = render(<FloatingWhatsAppCTA />);
    expect(finderRender.container.querySelector('.floating-cta')).toBeNull();
  });

  it('does not render floating or sticky takeover CTAs on other page-owned advisory routes', () => {
    mockedSearch = '';
    setScrollY(0);

    const pageOwnedRoutes = [
      '/en/areas/jomtien',
      '/en/blog/pattaya-yields',
      '/en/invest',
      '/en/investment',
      '/en/investor',
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
    mockedPathname = '/en/projects';
    mockedSearch = '';
    setScrollY(0);

    const { container } = render(<StickyMobileCTA />);

    expect(container.querySelectorAll('.mobile-cta__primary a')).toHaveLength(1);
    expect(container.querySelectorAll('.mobile-cta__secondary a')).toHaveLength(1);
  });
});
