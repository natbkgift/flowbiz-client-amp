'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { buildInvestorToolQuery, withLocaleQuery } from '@/app/_lib/public-advisory';

export function YieldCalculator({ locale }: { locale: 'en' | 'th' }) {
  const [purchasePrice, setPurchasePrice] = useState('5000000');
  const [monthlyRent, setMonthlyRent] = useState('30000');
  const [occupancyRate, setOccupancyRate] = useState('90');
  const [annualCosts, setAnnualCosts] = useState('120000');

  const currencyFormatter = useMemo(() => new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }), [locale]);

  const result = useMemo(() => {
    const price = Number(purchasePrice) || 0;
    const rent = Number(monthlyRent) || 0;
    const occupancy = Math.max(0, Math.min(Number(occupancyRate) || 0, 100)) / 100;
    const costs = Number(annualCosts) || 0;
    const grossAnnualRent = rent * 12 * occupancy;
    const netAnnualIncome = grossAnnualRent - costs;
    const grossYield = price > 0 ? (grossAnnualRent / price) * 100 : 0;
    const netYield = price > 0 ? (netAnnualIncome / price) * 100 : 0;
    const paybackYears = netAnnualIncome > 0 ? price / netAnnualIncome : null;
    return { grossAnnualRent, netAnnualIncome, grossYield, netYield, paybackYears };
  }, [annualCosts, monthlyRent, occupancyRate, purchasePrice]);

  const labels = locale === 'th'
    ? {
        purchasePrice: 'ราคาซื้อ',
        monthlyRent: 'ค่าเช่าต่อเดือน',
        occupancyRate: 'อัตราปล่อยเช่า (%)',
        annualCosts: 'ต้นทุนต่อปี',
        grossAnnualRent: 'รายได้ค่าเช่าต่อปี',
        netAnnualIncome: 'รายได้สุทธิต่อปี',
        grossYield: 'อัตราผลตอบแทนขั้นต้น',
        netYield: 'อัตราผลตอบแทนสุทธิ',
        paybackYears: 'ระยะเวลาคืนทุน (ปี)',
        summaryTitle: 'ส่งต่อข้อมูลชุดนี้ไปยังหน้าเปรียบเทียบหรือที่ปรึกษา',
        summaryBody: 'ตัวเลขชุดเดียวกันจะถูกพาไปต่อทั้งหน้าเปรียบเทียบและหน้าติดต่อ โดยไม่ต้องกรอกใหม่',
        goToCompare: 'เปิดหน้าเปรียบเทียบพร้อมข้อมูลนี้',
        talkToAdvisor: 'ส่งข้อมูลนี้ให้ที่ปรึกษา',
      }
    : {
        purchasePrice: 'Purchase price',
        monthlyRent: 'Monthly rent',
        occupancyRate: 'Occupancy rate (%)',
        annualCosts: 'Annual costs',
        grossAnnualRent: 'Gross annual rent',
        netAnnualIncome: 'Net annual income',
        grossYield: 'Gross yield',
        netYield: 'Net yield',
        paybackYears: 'Payback (years)',
        summaryTitle: 'Carry this brief into compare or advisor handoff',
        summaryBody: 'The same numbers will move into compare and contact so you do not have to restate them.',
        goToCompare: 'Open compare with this brief',
        talkToAdvisor: 'Send brief to advisor',
      };

  const investorToolQuery = buildInvestorToolQuery({
    purchasePrice: Number(purchasePrice) || 0,
    monthlyRent: Number(monthlyRent) || 0,
    occupancyRate: Number(occupancyRate) || 0,
    annualCosts: Number(annualCosts) || 0,
    grossYield: result.grossYield,
    netYield: result.netYield,
    paybackYears: result.paybackYears,
    intent: 'investment_plan',
    source: 'calculator',
  });

  return (
    <div className="detail-layout advisory-detail-layout mt-6">
      <div className="detail-stack">
        <div className="authority-card">
          <div className="form-grid-2">
            <label className="form-label">
              {labels.purchasePrice}
              <input className="form-input" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} inputMode="numeric" />
            </label>
            <label className="form-label">
              {labels.monthlyRent}
              <input className="form-input" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} inputMode="numeric" />
            </label>
            <label className="form-label">
              {labels.occupancyRate}
              <input className="form-input" value={occupancyRate} onChange={(e) => setOccupancyRate(e.target.value)} inputMode="numeric" />
            </label>
            <label className="form-label">
              {labels.annualCosts}
              <input className="form-input" value={annualCosts} onChange={(e) => setAnnualCosts(e.target.value)} inputMode="numeric" />
            </label>
          </div>
        </div>
      </div>

      <aside className="detail-sidebar detail-stack">
        <div id="calculator-results-card" className="page-rail-card">
          <div className="insight-list">
            <div className="insight-list__item">
              <span className="insight-list__title">{labels.grossAnnualRent}</span>
              <span className="insight-list__body">{currencyFormatter.format(result.grossAnnualRent)}</span>
            </div>
            <div className="insight-list__item">
              <span className="insight-list__title">{labels.netAnnualIncome}</span>
              <span className="insight-list__body">{currencyFormatter.format(result.netAnnualIncome)}</span>
            </div>
            <div className="insight-list__item">
              <span className="insight-list__title">{labels.grossYield}</span>
              <span className="insight-list__body">{result.grossYield.toFixed(2)}%</span>
            </div>
            <div className="insight-list__item">
              <span className="insight-list__title">{labels.netYield}</span>
              <span className="insight-list__body">{result.netYield.toFixed(2)}%</span>
            </div>
            <div className="insight-list__item">
              <span className="insight-list__title">{labels.paybackYears}</span>
              <span className="insight-list__body">{result.paybackYears ? result.paybackYears.toFixed(1) : (locale === 'th' ? 'ควรวิเคราะห์เพิ่มเติม' : 'Needs scenario review')}</span>
            </div>
          </div>
        </div>

        <div id="calculator-brief-summary" className="page-rail-card">
          <h2 className="card-title">{labels.summaryTitle}</h2>
          <p className="card-subtitle">{labels.summaryBody}</p>
          <div className="cta-row mt-4">
            <Link id="calculator-compare-cta" className="btn btn-secondary" href={withLocaleQuery(locale, '/compare', investorToolQuery)}>
              {labels.goToCompare}
            </Link>
            <Link id="calculator-contact-cta" className="btn btn-cta" href={withLocaleQuery(locale, '/contact', investorToolQuery)}>
              {labels.talkToAdvisor}
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
