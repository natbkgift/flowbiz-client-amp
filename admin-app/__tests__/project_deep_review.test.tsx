import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ProjectDeepReview } from '@/components/projects/ProjectDeepReview';

const defaultBuyerFitSignals = [
  'Project-first buyers who want Jomtien context before going into unit-level review.',
  'Investors comparing visible price, rent, and ROI signals before moving deeper.',
  'Buyers who need live confirmation on price bands or delivery timing before narrowing the shortlist.',
];

const defaultCtaPlan = {
  title: 'Turn this snapshot into a sharper decision',
  body: 'Use the visible price, rent, and ROI context to test whether this project still belongs in your shortlist against nearby alternatives.',
  primaryHref: '/en/contact?intent=project_consultation&source=project_investment_check&project=alpha-residence&projects=alpha-residence&buyer_fit=investor_compare&signal_level=high&msg=I%20am%20reviewing%20Alpha%20Residence%20and%20want%20to%20compare%20its%20price%2C%20rent%2C%20and%20investment%20context%20against%20nearby%20alternatives.',
  primaryLabel: 'Pressure-test this project',
  secondaryHref: '/en/compare',
  secondaryLabel: 'Compare nearby options',
};

describe('ProjectDeepReview', () => {
  it('renders snapshot explanation blocks with descriptive guardrails', () => {
    render(
      <ProjectDeepReview
        locale="en"
        verifiedSignals={[
          'Area context: Jomtien',
          'Published developer: AMP Developments',
        ]}
        fallbackContext={{
          projectName: 'Alpha Residence',
          areaName: 'Jomtien',
          developerName: 'AMP Developments',
          startingPriceLabel: 'THB 5,200,000',
          deliveryLabel: 'Mar 2027',
          hasDescription: true,
          hasLocationFacts: true,
          hasInvestmentFacts: true,
        }}
        buyerFitSignals={defaultBuyerFitSignals}
        ctaPlan={defaultCtaPlan}
        evaluation={{
          evaluation_version: 'v1',
          project: {
            id: 'project-1',
            slug: 'alpha-residence',
            name: 'Alpha Residence',
            status: 'published',
            created_at: '2026-03-16T00:00:00Z',
            updated_at: '2026-03-16T00:00:00Z',
          },
          area_statistics: {
            area_id: 'area-1',
            avg_price_sqm: '120000',
            avg_rent_monthly: '28000',
            avg_roi_percent: '5.8',
            total_projects: 12,
            total_units: 1800,
            as_of_date: '2026-03-01',
            avg_price: 'THB 5.2M',
            avg_rent: 'THB 28K',
            roi_percent: '5.8%',
            as_of: '2026-03-01',
          },
          badges: [
            { key: 'roi_snapshot', label: 'ROI snapshot available' },
            { key: 'area_stats_available', label: 'Area stats available' },
          ],
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Verified now' })).toBeTruthy();
  expect(screen.getByText(/area context: jomtien/i)).toBeTruthy();
  expect(screen.getByText(/market snapshot: avg price thb 5.2m/i)).toBeTruthy();
    expect(screen.getByLabelText(/how to read this snapshot/i)).toBeTruthy();
  expect(screen.getByText(/best fit for this page/i)).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Pressure-test this project' }).getAttribute('href')).toBe('/en/contact?intent=project_consultation&source=project_investment_check&project=alpha-residence&projects=alpha-residence&buyer_fit=investor_compare&signal_level=high&msg=I%20am%20reviewing%20Alpha%20Residence%20and%20want%20to%20compare%20its%20price%2C%20rent%2C%20and%20investment%20context%20against%20nearby%20alternatives.');
    expect(screen.getByText(/not a promised return for alpha residence/i)).toBeTruthy();
    expect(screen.getByText(/side-by-side comparison context, not as forward-looking projections/i)).toBeTruthy();
    expect(screen.getByText(/anchored to 2026-03-01/i)).toBeTruthy();
  });

  it('localizes deep review framing on the Thai route', () => {
    render(
      <ProjectDeepReview
        locale="th"
        verifiedSignals={['บริบทหลักของโครงการอยู่ในทำเล Jomtien']}
        fallbackContext={{
          projectName: 'Alpha Residence',
          areaName: 'Jomtien',
          developerName: 'AMP Developments',
          startingPriceLabel: 'THB 5,200,000',
          deliveryLabel: 'มี.ค. 2027',
          hasDescription: true,
          hasLocationFacts: true,
          hasInvestmentFacts: true,
        }}
        buyerFitSignals={[
          'ผู้ซื้อที่เริ่มจากโครงการก่อน แล้วต้องการดูบริบทของ Jomtien ก่อนลงลึกถึงระดับยูนิต',
        ]}
        ctaPlan={{
          title: 'ต่อยอดจาก snapshot นี้เป็นการตัดสินใจที่คมขึ้น',
          body: 'ใช้ราคา ค่าเช่า และ ROI ที่มีตอนนี้เพื่อตรวจว่าโครงการนี้ยังน่าอยู่ใน shortlist เมื่อเทียบกับตัวเลือกใกล้เคียงหรือไม่',
          primaryHref: '/th/contact?intent=project_consultation&source=project_investment_check&project=alpha-residence&projects=alpha-residence&buyer_fit=investor_compare&signal_level=high&msg=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%88%20Alpha%20Residence%20%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%95%E0%B9%89%E0%B8%AD%E0%B8%87%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B9%80%E0%B8%97%E0%B8%B5%E0%B8%A2%E0%B8%9A%E0%B8%A3%E0%B8%B2%E0%B8%84%E0%B8%B2%20%E0%B8%84%E0%B9%88%E0%B8%B2%E0%B9%80%E0%B8%8A%E0%B9%88%E0%B8%B2%20%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%A1%E0%B8%B8%E0%B8%A1%E0%B8%A1%E0%B8%AD%E0%B8%87%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%A5%E0%B8%87%E0%B8%97%E0%B8%B8%E0%B8%99%E0%B8%81%E0%B8%B1%E0%B8%9A%E0%B8%95%E0%B8%B1%E0%B8%A7%E0%B9%80%E0%B8%A5%E0%B8%B7%E0%B8%AD%E0%B8%81%E0%B9%83%E0%B8%81%E0%B8%A5%E0%B9%89%E0%B9%80%E0%B8%84%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B9%83%E0%B8%99%E0%B8%9E%E0%B8%B7%E0%B9%89%E0%B8%99%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B9%80%E0%B8%94%E0%B8%B5%E0%B8%A2%E0%B8%A7%E0%B8%81%E0%B8%B1%E0%B8%99',
          primaryLabel: 'เช็กสมมติฐานลงทุนของโครงการนี้',
          secondaryHref: '/th/compare',
          secondaryLabel: 'เทียบกับโครงการใกล้เคียง',
        }}
        evaluation={{
          evaluation_version: 'v1',
          project: {
            id: 'project-1',
            slug: 'alpha-residence',
            name: 'Alpha Residence',
            status: 'published',
            created_at: '2026-03-16T00:00:00Z',
            updated_at: '2026-03-16T00:00:00Z',
          },
          area_statistics: {
            area_id: 'area-1',
            avg_rent_monthly: '28000',
            avg_roi_percent: '5.8',
            total_projects: 12,
            total_units: 1800,
            as_of_date: '2026-03-01',
            avg_price: 'THB 5.2M',
            avg_rent: 'THB 28K',
            roi_percent: '5.8%',
            as_of: '2026-03-01',
          },
          badges: [
            { key: 'roi_snapshot', label: 'ROI snapshot available' },
            { key: 'area_stats_available', label: 'Area stats available' },
          ],
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'รีวิวเชิงลึก' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'ยืนยันได้ตอนนี้' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'ประเด็นที่ควรยืนยันเพิ่ม' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'ภาพรวมการลงทุนจากข้อมูลล่าสุด' })).toBeTruthy();
    expect(screen.getByText(/เหมาะกับผู้ซื้อแบบไหน/i)).toBeTruthy();
    expect(screen.getByLabelText(/วิธีอ่านข้อมูลชุดนี้/i)).toBeTruthy();
  });

  it('uses verified project context when deeper snapshots are still thin', () => {
    render(
      <ProjectDeepReview
        locale="en"
        verifiedSignals={[
          'Area context: Central Pattaya',
          'Entry price: THB 4,500,000',
        ]}
        fallbackContext={{
          projectName: 'Beta Tower',
          areaName: 'Central Pattaya',
          developerName: 'Beta Developments',
          startingPriceLabel: 'THB 4,500,000',
          deliveryLabel: null,
          hasDescription: false,
          hasLocationFacts: false,
          hasInvestmentFacts: false,
        }}
        buyerFitSignals={[
          'Project-first buyers who want Central Pattaya context before going into unit-level review.',
        ]}
        ctaPlan={{
          title: 'Check what is actually live before moving forward',
          body: 'Use the published entry price or delivery timing as the starting point, then verify which units and comparables are genuinely still active.',
          primaryHref: '/en/contact?intent=project_consultation&source=project_availability_check&project=beta-tower&projects=beta-tower&buyer_fit=project_first_buyer&signal_level=medium&msg=I%20am%20interested%20in%20Beta%20Tower%20and%20want%20to%20confirm%20live%20unit%20availability%2C%20price%20bands%2C%20and%20nearby%20alternatives%20still%20open%20now.',
          primaryLabel: 'Check live availability',
          secondaryHref: '/en/buy',
          secondaryLabel: 'Browse shortlist-ready listings',
        }}
        evaluation={{
          evaluation_version: 'v1',
          project: {
            id: 'project-2',
            slug: 'beta-tower',
            name: 'Beta Tower',
            status: 'published',
            created_at: '2026-03-16T00:00:00Z',
            updated_at: '2026-03-16T00:00:00Z',
          },
          area_statistics: null,
          badges: [],
        }}
      />,
    );

    expect(screen.getByText(/entry price: thb 4,500,000/i)).toBeTruthy();
    expect(screen.getByText(/confirm current rental demand and buyer fit around central pattaya/i)).toBeTruthy();
    expect(screen.getByText(/confirm which unit mix and active availability still match beta tower/i)).toBeTruthy();
    expect(screen.getByText(/no snapshots available yet/i)).toBeTruthy();
  });
});