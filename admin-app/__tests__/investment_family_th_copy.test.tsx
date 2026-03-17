import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import InvestPage from '@/app/(site)/[locale]/invest/page';
import InvestmentPage from '@/app/(site)/[locale]/investment/page';
import InvestorPage from '@/app/(site)/[locale]/investor/page';

describe('investment family Thai copy', () => {
  it('keeps the invest hero free of leftover English decision jargon on the Thai route', async () => {
    render(
      await InvestPage({
        params: Promise.resolve({ locale: 'th' }),
      }),
    );

    expect(screen.getByText('นักลงทุนที่ต้องการอ่านตลาดแบบไม่ขายฝันเกินจริง')).toBeTruthy();
    expect(screen.getByText('ขอแผนลงทุนก่อนเลือกโครงการ')).toBeTruthy();
    expect(screen.queryByText(/overclaim/i)).toBeNull();
    expect(screen.queryByText(/investment plan/i)).toBeNull();
    expect(screen.queryByText(/trade-offs/i)).toBeNull();
  });

  it('keeps investment route trust copy and ownership comparison labels localized in Thai', async () => {
    render(
      await InvestmentPage({
        params: Promise.resolve({ locale: 'th' }),
      }),
    );

    expect(screen.getByText('ผู้ซื้อที่ต้องการเข้าใจผลตอบแทนและโครงสร้างการถือครอง')).toBeTruthy();
    expect(screen.getByText('มีทั้งความรู้เรื่องการถือครองและการปิดดีล')).toBeTruthy();
    expect(screen.getAllByText('จุดเด่น').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ข้อควรระวัง').length).toBeGreaterThan(0);
    expect(screen.queryByText(/^Pros$/)).toBeNull();
    expect(screen.queryByText(/^Cons$/)).toBeNull();
    expect(screen.queryByText(/ROI/)).toBeNull();
    expect(screen.queryByText(/ownership/i)).toBeNull();
  });

  it('keeps investor decision framing localized in Thai', async () => {
    render(
      await InvestorPage({
        params: Promise.resolve({ locale: 'th' }),
      }),
    );

    expect(screen.getByText('เหมาะกับผู้ที่ต้องการมองความเหมาะกับพอร์ต ระดับผลตอบแทน และจังหวะเข้าซื้อให้เป็นภาพเดียวกัน')).toBeTruthy();
    expect(screen.getByText('เราแปลข้อมูลโครงการและดีมานด์ให้เป็นขั้นตอนถัดไป ไม่ใช่แค่สรุปตัวเลข')).toBeTruthy();
    expect(screen.queryByText(/portfolio fit/i)).toBeNull();
    expect(screen.queryByText(/yield positioning/i)).toBeNull();
    expect(screen.queryByText(/next action/i)).toBeNull();
  });
});