import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HomeBottomCta } from '@/components/home/HomeBottomCta';
import { LeadForm } from '@/components/forms/LeadForm';

vi.mock('@/components/analytics/TrackedLink', () => ({
  TrackedLink: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
}));

describe('HomeBottomCta conversion gate', () => {
  it('keeps the primary CTA on-page and renders a single form intro via LeadForm props', () => {
    const { container } = render(
      <HomeBottomCta
        heading="Ready to find your property?"
        subheading="Share your budget, target area, and timing, and the team will reply with live options."
        primaryLabel="Talk to an Advisor Now"
        primaryUrl="#home-consultation-form"
        secondaryLabel="View Available Units"
        secondaryUrl="/en/projects?source=home_bottom_secondary"
        trustNote="A local team verifies the shortlist, current pricing, and foreign-buyer guidance in one handoff."
        conversionNote="Use this brief to request the current price pack, floor plan, and shortlist in one reply."
        sectionId="home-consultation-section"
        formSlot={(
          <LeadForm
            formId="home-consultation-form"
            heading="Request Current Pricing and a Shortlist"
            description="Complete the short form and the team will reply with relevant units, current pricing, and a shortlist matched to your budget."
          />
        )}
      />,
    );

    expect(screen.getByRole('link', { name: 'Talk to an Advisor Now' })).toHaveAttribute('href', '#home-consultation-form');
    expect(container.querySelector('section#home-consultation-section')).not.toBeNull();
    expect(container.querySelector('section#home-consultation-section')?.getAttribute('aria-labelledby')).toBe('home-consultation-section-title');
    expect(screen.getByRole('heading', { name: 'Request Current Pricing and a Shortlist' })).toBeInTheDocument();
    expect(screen.getByText('Complete the short form and the team will reply with relevant units, current pricing, and a shortlist matched to your budget.')).toBeInTheDocument();
    expect(screen.getByText('Use this brief to request the current price pack, floor plan, and shortlist in one reply.')).toBeInTheDocument();
    expect(container.querySelectorAll('form#home-consultation-form')).toHaveLength(1);
    expect(container.querySelectorAll('.bg-white h3')).toHaveLength(1);
  });
});
