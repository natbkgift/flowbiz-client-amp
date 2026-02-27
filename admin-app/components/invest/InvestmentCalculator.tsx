'use client';

import { useState, useMemo } from 'react';

interface CalcInputs {
  purchasePrice: number;
  monthlyRent: number;
  occupancyRate: number;
  managementFee: number;
  maintenanceCost: number;
  transferCost: number;
  annualAppreciation: number;
}

const defaults: CalcInputs = {
  purchasePrice: 4500000,
  monthlyRent: 25000,
  occupancyRate: 75,
  managementFee: 10,
  maintenanceCost: 5,
  transferCost: 6,
  annualAppreciation: 3,
};

function fmt(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function pct(n: number): string {
  return n.toFixed(2) + '%';
}

export function InvestmentCalculator({ locale }: { locale: string }) {
  const th = locale === 'th';
  const [inputs, setInputs] = useState<CalcInputs>(defaults);

  const update = (key: keyof CalcInputs, raw: string) => {
    const val = parseFloat(raw) || 0;
    setInputs((prev) => ({ ...prev, [key]: val }));
  };

  const results = useMemo(() => {
    const {
      purchasePrice,
      monthlyRent,
      occupancyRate,
      managementFee,
      maintenanceCost,
      transferCost,
      annualAppreciation,
    } = inputs;

    if (purchasePrice <= 0) return null;

    const annualGrossRent = monthlyRent * 12 * (occupancyRate / 100);
    const annualExpenses = annualGrossRent * ((managementFee + maintenanceCost) / 100);
    const annualNetRent = annualGrossRent - annualExpenses;
    const totalInvestment = purchasePrice * (1 + transferCost / 100);
    const grossYield = (annualGrossRent / purchasePrice) * 100;
    const netYield = (annualNetRent / purchasePrice) * 100;
    const appreciation = purchasePrice * (annualAppreciation / 100);
    const totalReturn = annualNetRent + appreciation;
    const totalROI = (totalReturn / totalInvestment) * 100;
    const cashOnCash = (annualNetRent / totalInvestment) * 100;
    const breakEvenYears = annualNetRent > 0 ? totalInvestment / annualNetRent : Infinity;
    const value5yr = purchasePrice * Math.pow(1 + annualAppreciation / 100, 5);
    const totalRent5yr = annualNetRent * 5;
    const totalProfit5yr = (value5yr - purchasePrice) + totalRent5yr;

    return {
      annualGrossRent,
      annualNetRent,
      totalInvestment,
      grossYield,
      netYield,
      totalROI,
      cashOnCash,
      breakEvenYears,
      value5yr,
      totalRent5yr,
      totalProfit5yr,
    };
  }, [inputs]);

  const fields: { key: keyof CalcInputs; label: string; suffix: string; step: number }[] = [
    { key: 'purchasePrice', label: th ? 'ราคาซื้อ (฿)' : 'Purchase Price (THB)', suffix: '฿', step: 100000 },
    { key: 'monthlyRent', label: th ? 'ค่าเช่า/เดือน (฿)' : 'Monthly Rent (THB)', suffix: '฿', step: 1000 },
    { key: 'occupancyRate', label: th ? 'อัตราเข้าพัก (%)' : 'Occupancy Rate (%)', suffix: '%', step: 5 },
    { key: 'managementFee', label: th ? 'ค่าบริหารจัดการ (%)' : 'Management Fee (%)', suffix: '%', step: 1 },
    { key: 'maintenanceCost', label: th ? 'ค่าบำรุงรักษา (%)' : 'Maintenance Cost (%)', suffix: '%', step: 1 },
    { key: 'transferCost', label: th ? 'ค่าโอน+ปิดดีล (%)' : 'Transfer & Closing (%)', suffix: '%', step: 1 },
    { key: 'annualAppreciation', label: th ? 'มูลค่าเพิ่ม/ปี (%)' : 'Annual Appreciation (%)', suffix: '%', step: 0.5 },
  ];

  return (
    <div className="grid grid-2" style={{ gap: 'var(--spacing-lg)' }}>
      {/* Inputs */}
      <div className="card">
        <h3 className="card-title">{th ? 'ตัวแปร' : 'Inputs'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {fields.map((f) => (
            <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{f.label}</span>
              <input
                type="number"
                className="form-input"
                value={inputs[f.key]}
                step={f.step}
                min={0}
                onChange={(e) => update(f.key, e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  width: '100%',
                }}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="card" style={{ background: 'var(--color-surface-alt, var(--color-bg-alt, #f8f9fa))' }}>
        <h3 className="card-title">{th ? 'ผลลัพธ์' : 'Results'}</h3>
        {results ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                {th ? 'ผลตอบแทนขั้นต้น (Gross Yield)' : 'Gross Rental Yield'}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {pct(results.grossYield)}
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                {th ? 'ผลตอบแทนสุทธิ (Net Yield)' : 'Net Rental Yield'}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {pct(results.netYield)}
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                {th ? 'ROI รวม (รายได้ + มูลค่าเพิ่ม)' : 'Total ROI (Rental + Appreciation)'}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {pct(results.totalROI)}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
              <div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                  {th ? 'Cash-on-Cash' : 'Cash-on-Cash'}
                </div>
                <div style={{ fontWeight: 600 }}>{pct(results.cashOnCash)}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                  {th ? 'คืนทุน (ปี)' : 'Break-even (yrs)'}
                </div>
                <div style={{ fontWeight: 600 }}>
                  {results.breakEvenYears === Infinity ? '—' : results.breakEvenYears.toFixed(1)}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                  {th ? 'เงินลงทุนรวม' : 'Total Investment'}
                </div>
                <div style={{ fontWeight: 600 }}>฿{fmt(results.totalInvestment)}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                  {th ? 'รายได้เช่าสุทธิ/ปี' : 'Net Rent / Year'}
                </div>
                <div style={{ fontWeight: 600 }}>฿{fmt(results.annualNetRent)}</div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

            <div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>
                {th ? 'ประมาณการ 5 ปี' : '5-Year Projection'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)', marginTop: '8px' }}>
                <div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                    {th ? 'มูลค่าทรัพย์สินปีที่ 5' : 'Property Value (Yr 5)'}
                  </div>
                  <div style={{ fontWeight: 600 }}>฿{fmt(results.value5yr)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                    {th ? 'รายได้เช่ารวม 5 ปี' : 'Total Rent (5 yrs)'}
                  </div>
                  <div style={{ fontWeight: 600 }}>฿{fmt(results.totalRent5yr)}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                    {th ? 'กำไรรวมประมาณการ 5 ปี' : 'Estimated Total Profit (5 yrs)'}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: results.totalProfit5yr >= 0 ? 'var(--color-success, #16a34a)' : 'var(--color-error, #dc2626)' }}>
                    ฿{fmt(results.totalProfit5yr)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {th ? 'กรุณาระบุราคาซื้อ' : 'Enter a purchase price to see results.'}
          </p>
        )}
      </div>
    </div>
  );
}
