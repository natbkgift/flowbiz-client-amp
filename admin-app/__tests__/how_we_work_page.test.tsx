import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import HowWeWorkPage from '@/app/(site)/[locale]/how-we-work/page';

vi.mock('@/app/_lib/public-api-server', async () => {
  const actual = await vi.importActual<typeof import('@/app/_lib/public-api-server')>('@/app/_lib/public-api-server');
  return {
    ...actual,
    fetchCompanyInfoBySlug: vi.fn(async (slug: string) => {
      if (slug !== 'how-we-work') return null;
      return {
        id: 'how-we-work',
        slug: 'how-we-work',
        title: 'How we work',
        meta_title: 'How we work',
        meta_description: 'How AMP Pattaya handles a live buyer brief.',
        content: {
          en: 'Every engagement starts with a clear brief.\n\nThen the team narrows the field and moves into the next real step.',
          th: 'ทุก engagement เริ่มจาก brief ที่ชัดเจน\n\nจากนั้นทีมจะคัดตัวเลือกและพาไปยังขั้นตอนถัดไปที่ทำได้จริง',
        },
        updated_at: '2026-03-20T00:00:00Z',
      };
    }),
    fetchPublishedTeamMembers: vi.fn(async () => ([
      {
        id: 'team-1',
        name: 'Nina Advisor',
        role_title: 'Senior Advisor',
        bio: { en: 'Helps international buyers narrow live briefs.', th: 'ช่วยผู้ซื้อชาวต่างชาติคัด brief ที่ใช้งานได้จริง' },
        photo_url: null,
        languages: ['English', 'Thai'],
        specialties: ['Condos'],
      },
    ])),
  };
});

describe('how we work page', () => {
  it('adds explicit pre-inquiry process confidence surfaces', async () => {
    const { container } = render(
      await HowWeWorkPage({
        params: Promise.resolve({ locale: 'en' }),
      }),
    );

    expect(container.querySelector('#how-we-work-confidence-grid')).not.toBeNull();
    expect(screen.getByRole('heading', { name: /what gets clarified before the shortlist moves/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /what the reply should feel like/i })).toBeTruthy();
    expect(screen.getByText(/one brief should carry the same context forward across channels/i)).toBeTruthy();
  });

  it('keeps the Thai process-confidence copy localized', async () => {
    render(
      await HowWeWorkPage({
        params: Promise.resolve({ locale: 'th' }),
      }),
    );

    expect(screen.getByRole('heading', { name: /อะไรควรถูกเคลียร์ก่อน shortlist จะขยับต่อ/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /คำตอบกลับที่ดีควรให้ความรู้สึกแบบไหน/i })).toBeTruthy();
  });
});