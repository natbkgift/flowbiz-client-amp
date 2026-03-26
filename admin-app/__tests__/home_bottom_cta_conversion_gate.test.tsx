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
        heading="Get current pricing and the shortlist worth seeing now"
        subheading="Share your budget, preferred area, and timing, and the team will reply with live units."
        benefits={[
          'Current pricing from genuinely available units.',
          'Best-fit units for your budget and buying goal.',
          'A tighter shortlist that tells you what to open first.',
        ]}
        primaryLabel="Get Pricing & Shortlist"
        primaryUrl="#home-consultation-form"
        secondaryLabel="View Available Units"
        secondaryUrl="/en/projects?source=home_bottom_secondary"
        trustNote="No pressure and no spam. You get live availability, current pricing, and the clearest next step."
        conversionNote="Use one short brief to get current pricing, the best available units, and a shortlist matched to your goal."
        sectionId="home-consultation-section"
        formSlot={(
          <LeadForm
            formId="home-consultation-form"
            heading="Request Current Pricing and the Best Available Units"
            description="Complete the short form and the team will reply with available units, current pricing, and a shortlist matched to your budget and goal."
          />
        )}
      />,
    );

    expect(screen.getByRole('link', { name: 'Get Pricing & Shortlist' })).toHaveAttribute('href', '#home-consultation-form');
    expect(container.querySelector('section#home-consultation-section')).not.toBeNull();
    expect(container.querySelector('section#home-consultation-section')?.getAttribute('aria-labelledby')).toBe('home-consultation-section-title');
    expect(screen.getByRole('heading', { name: 'Request Current Pricing and the Best Available Units' })).toBeInTheDocument();
    expect(screen.getByText('Complete the short form and the team will reply with available units, current pricing, and a shortlist matched to your budget and goal.')).toBeInTheDocument();
    expect(screen.getByText('Use one short brief to get current pricing, the best available units, and a shortlist matched to your goal.')).toBeInTheDocument();
    expect(screen.getByText('Current pricing from genuinely available units.')).toBeInTheDocument();
    expect(container.querySelectorAll('form#home-consultation-form')).toHaveLength(1);
    expect(container.querySelectorAll('.bg-white h3')).toHaveLength(1);
  });
});
