'use client';

import { useMemo, useState } from 'react';

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
        grossYield: 'Gross yield',
        netYield: 'Net yield',
        paybackYears: 'Payback (ปี)',
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
      };

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
        <div className="page-rail-card">
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
              <span className="insight-list__body">{result.paybackYears ? result.paybackYears.toFixed(1) : (locale === 'th' ? 'คำนวณไม่ได้' : 'Not available')}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}