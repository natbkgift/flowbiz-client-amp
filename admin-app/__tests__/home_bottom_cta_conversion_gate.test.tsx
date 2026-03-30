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
        heading="Get current pricing, availability, and the clearest next step"
        subheading="Share your budget, preferred area, and goal, and the team will reply with the projects or units worth opening first."
        benefits={[
          'Current pricing from genuinely available stock.',
          'The first projects or units worth opening.',
          'Clear steps on viewing, paperwork, and transfer fit.',
        ]}
        primaryLabel="Get Pricing & Next Step"
        primaryUrl="#home-consultation-form"
        secondaryLabel="Explore Current Opportunities"
        secondaryUrl="/en/projects?source=home_bottom_secondary"
        trustNote="No spam and no listing dump. You get relevant availability, current pricing, and the clearest next action."
        conversionNote="Send one brief and get current availability, pricing, and the clearest next step from the team."
        sectionId="home-consultation-section"
        formSlot={(
          <LeadForm
            formId="home-consultation-form"
            heading="Send your brief to the Pattaya advisory team"
            description="Complete the short form and the team will reply with current availability, pricing, and the first projects or units worth opening."
          />
        )}
      />,
    );

    expect(screen.getByRole('link', { name: 'Get Pricing & Next Step' })).toHaveAttribute('href', '#home-consultation-form');
    expect(container.querySelector('section#home-consultation-section')).not.toBeNull();
    expect(container.querySelector('section#home-consultation-section')?.getAttribute('aria-labelledby')).toBe('home-consultation-section-title');
    expect(screen.getByRole('heading', { name: 'Send your brief to the Pattaya advisory team' })).toBeInTheDocument();
    expect(screen.getByText('Complete the short form and the team will reply with current availability, pricing, and the first projects or units worth opening.')).toBeInTheDocument();
    expect(screen.getByText('Send one brief and get current availability, pricing, and the clearest next step from the team.')).toBeInTheDocument();
    expect(screen.getByText('Current pricing from genuinely available stock.')).toBeInTheDocument();
    expect(container.querySelectorAll('form#home-consultation-form')).toHaveLength(1);
    expect(container.querySelectorAll('.bg-white h3')).toHaveLength(1);
  });
});
