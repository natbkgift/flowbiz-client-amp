import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import CalculatorPage from '@/app/(site)/[locale]/calculator/page';

describe('calculator shell', () => {
  it('renders Thai calculator handoff labels and stable CTA ids', async () => {
    const { container } = render(
      await CalculatorPage({
        params: Promise.resolve({ locale: 'th' }),
      }),
    );

    expect(screen.getByRole('heading', { name: 'เครื่องมือคำนวณผลตอบแทนการลงทุน' })).toBeTruthy();
    expect(container.querySelector('#calculator-results-card')).not.toBeNull();
    expect(container.querySelector('#calculator-brief-summary')).not.toBeNull();
    expect(screen.getByText('อัตราผลตอบแทนขั้นต้น')).toBeTruthy();
    expect(screen.getByText('อัตราผลตอบแทนสุทธิ')).toBeTruthy();
    expect(screen.getByText('ระยะเวลาคืนทุน (ปี)')).toBeTruthy();
    expect(container.querySelector('#calculator-compare-cta')?.getAttribute('href')).toContain('/th/compare?');
    expect(container.querySelector('#calculator-contact-cta')?.getAttribute('href')).toContain('/th/contact?');
  });
});