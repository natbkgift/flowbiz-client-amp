import { describe, expect, it } from 'vitest';

import { th } from '@/app/_lib/i18n/th';

describe('Thai dictionary public copy regression', () => {
  it('keeps shared advisory copy free from next-step and brief drift', () => {
    expect(th.advisory.teamCtaBody).not.toContain('next step');
    expect(th.advisory.noPublishedDataTitle).not.toContain('next step');
    expect(th.advisory.noPublishedDataBody).not.toContain('brief');
    expect(th.advisory.noPublishedDataBody).not.toContain('inventory');
    expect(th.advisory.noPublishedDataBody).not.toContain('market context');
    expect(th.advisory.noPublishedDataBody).not.toContain('developer options');
  });

  it('keeps compare and property labels in Thai', () => {
    expect(th.smartFinder.goToProjects).toBe('ไปหน้าโครงการ');
    expect(th.compare.browseProjects).toBe('ดูโครงการ');
    expect(th.compare.priceRange).toBe('ช่วงราคา');
    expect(th.compare.expectedYield).toBe('ผลตอบแทนที่คาดได้');
    expect(th.property.similarComingSoonText).not.toContain('brief');
    expect(th.common.leadForm.detailsHeading).toBe('บรีฟสำหรับรายการคัดไว้');
  });
});