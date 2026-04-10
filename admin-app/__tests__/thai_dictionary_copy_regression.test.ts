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
    expect(th.areaGuide.confidenceTitle).toBe('วิธีใช้คู่มือทำเลแบบมั่นใจกว่าเดิม');
    expect(th.contact.responseTitle).toBe('หลังส่งรายละเอียดแล้วจะเกิดอะไรขึ้น');
    expect(th.buy.route.heroTitle).toBe('รายการซื้อสำหรับผู้ซื้อต่างชาติที่พร้อมไปต่อได้ง่ายขึ้น');
    expect(th.projectsPage.hero.title).toBe('โครงการที่เปิดอยู่');
    expect(th.about.teamSection.title).toBe('ทีมของเรา');
    expect(th.contact.metadata.privateTourTitle).toBe('นัดชมแบบส่วนตัวบนรายการคัดไว้ที่เหมาะก่อน');
    expect(th.contact.handoffLabels.project_timeout).toBe('หน้าสรุปโครงการเมื่อข้อมูลยังไม่ครบ');
    expect(th.shortlist.locationPending).toBe('กำลังยืนยันบริบทโครงการและทำเล');
    expect(th.property.similarComingSoonText).not.toContain('brief');
    expect(th.property.highlightsTitle).toBe('จุดเด่นระดับยูนิต');
    expect(th.property.localContextTitle).toBe('อ่านทำเลนี้อย่างไร');
    expect(th.common.leadForm.detailsHeading).toBe('รายละเอียดสำหรับรายการคัดไว้');
  });

  it('keeps the shared messaging hierarchy localized in Thai', () => {
    expect(th.messaging.ctaLanguage.startShortlist).toBe('เริ่มรายการคัดไว้ของฉัน');
    expect(th.messaging.ctaLanguage.talkToAdvisoryTeam).toBe('คุยกับทีมที่ปรึกษา');
    expect(th.messaging.trustLanguage.summary).not.toContain('verified');
    expect(th.messaging.investmentLanguage.subtitle).not.toContain('ROI-focused');
    expect(th.messaging.investmentLanguage.riskFraming).not.toContain('trade-off');
    expect(th.smartFinder.resultsDescription).not.toContain('dataset');
    expect(th.compare.readOnlyDesc).not.toContain('dataset');
  });
});
