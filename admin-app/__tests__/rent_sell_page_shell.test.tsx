import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import RentPage from '@/app/(site)/[locale]/rent/page';
import SellPage from '@/app/(site)/[locale]/sell/page';

describe('rent and sell page shell', () => {
  it('keeps the English rent route advisory-led above the fold', async () => {
    render(
      await RentPage({
        params: Promise.resolve({ locale: 'en' }),
      }),
    );

    expect(screen.getByRole('heading', { name: /rent pattaya with a clearer move-in shortlist/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /send rental brief/i }).getAttribute('href')).toBe('#rent-brief');
    expect(screen.getByRole('link', { name: /scan live rentals/i }).getAttribute('href')).toBe('#rent-featured');
    expect(screen.getByRole('heading', { name: /choose the right pattaya zone before booking viewings/i })).toBeTruthy();
  });

  it('keeps the Thai sell route localized around advisory review before listing', async () => {
    render(
      await SellPage({
        params: Promise.resolve({ locale: 'th' }),
      }),
    );

    expect(screen.getByRole('heading', { name: /ส่งอสังหาฯ เข้าตรวจพร้อมบริบทด้านราคาและความพร้อมก่อนลงประกาศ/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /เริ่มส่งรายละเอียดผู้ขาย/i }).getAttribute('href')).toBe('#seller-form');
    expect(screen.getByRole('link', { name: /ดูขั้นตอนหลังส่งข้อมูล/i }).getAttribute('href')).toBe('#seller-process');
    expect(screen.getByRole('heading', { name: /หลังส่งรายละเอียดผู้ขายแล้วจะเกิดอะไรขึ้น/i })).toBeTruthy();
  });
});
