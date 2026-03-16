'use client';

import Link from 'next/link';

import { withLocale } from '@/app/_lib/i18n/routing';

type Locale = 'en' | 'th';

function getShellCopy(locale: Locale) {
  if (locale === 'th') {
    return {
      introTitle: 'Estimator shell สำหรับผู้ซื้อที่ต้องการเห็น cash-needed picture ก่อน',
      introBody:
        'หน้าใหม่นี้ถูกเปิดเพื่อเป็น owner route ของเครื่องมือคำนวณค่าโอนและค่าใช้จ่ายปิดการซื้อ โดยยังไม่เปิดสูตรคำนวณจริงใน slice นี้',
      toolTitle: 'สิ่งที่จะอยู่ใน estimator นี้',
      toolLead:
        'สรุป deterministic line items และรายการที่ยังต้องให้ advisor ตรวจยืนยันจะแยกกันชัดเจน เพื่อไม่ให้ตัวเลขดูเหมือนข้อสรุปทางกฎหมายหรือการเงิน',
      plannedInputsTitle: 'Planned input groups',
      plannedInputs: [
        'ราคาทรัพย์, purchase context, ownership type',
        'transfer split และ financing mode',
        'editable assumptions เช่น agent fee, lawyer fee, bank transfer cost, FX estimate',
      ],
      plannedOutputsTitle: 'Planned result blocks',
      plannedOutputs: [
        'government fees subtotal',
        'closing-cost subtotal',
        'total cash needed',
        'unresolved items ที่ยังไม่รวมใน total',
      ],
      statusTitle: 'Current slice status',
      statusBody:
        'Slice 1 เปิดเฉพาะ route owner, metadata, และ page composition เท่านั้น สูตรคำนวณฝั่ง server และ share state จะตามมาใน slices ถัดไป.',
      assumptionsTitle: 'Assumption discipline',
      assumptions: [
        'ค่าใช้จ่ายที่มี source ชัดเจนเท่านั้นที่จะถูกใส่ใน deterministic total',
        'รายการที่ยังมี legal/commercial ambiguity จะถูกแสดงแยกเป็น unresolved items',
        'route นี้ไม่แทน advisor review และไม่แก้ไข contact flow เดิมใน slice นี้',
      ],
      nextStepTitle: 'Next-step region',
      nextStepBody:
        'หากต้องการคุยภาพรวมการซื้อก่อน estimator คิดเลขจริง คุณยังใช้ contact route และ investment calculator เดิมได้ตามปกติ',
      contactLabel: 'คุยกับ advisor',
      calculatorLabel: 'เปิด investment calculator',
      milestoneTitle: 'What lands next',
      milestones: [
        'client estimator UI contract',
        'server-authoritative formula boundary',
        'share-result reopen state on this same route',
      ],
      disclaimerTitle: 'Important note',
      disclaimerBody:
        'ตัวเลขจริงยังไม่ถูกคำนวณในหน้านี้จนกว่า formula slice จะถูก merge และ validate ตาม gate.',
    };
  }

  return {
    introTitle: 'Estimator shell for buyers who need a cash-needed picture first',
    introBody:
      'This new route is the approved owner for transfer-fee and closing-cost estimation, but the calculation engine is intentionally not active in this slice.',
    toolTitle: 'What this estimator will hold',
    toolLead:
      'Deterministic line items and unresolved items will stay visibly separate so the output does not read like legal or financial certainty.',
    plannedInputsTitle: 'Planned input groups',
    plannedInputs: [
      'property price, purchase context, and ownership type',
      'transfer split and financing mode',
      'editable assumptions such as agent fee, lawyer fee, bank transfer cost, and FX estimate',
    ],
    plannedOutputsTitle: 'Planned result blocks',
    plannedOutputs: [
      'government fees subtotal',
      'closing-cost subtotal',
      'total cash needed',
      'unresolved items kept outside the total',
    ],
    statusTitle: 'Current slice status',
    statusBody:
      'Slice 1 opens only the route owner, metadata, and page composition. The server formula boundary and share state arrive in later slices.',
    assumptionsTitle: 'Assumption discipline',
    assumptions: [
      'Only governed fee inputs may enter the deterministic total.',
      'Legal or commercial ambiguity stays visible as unresolved items.',
      'This route does not replace advisor review or change the current contact flow in this slice.',
    ],
    nextStepTitle: 'Next-step region',
    nextStepBody:
      'If you need to discuss the purchase context before the estimator goes live, the existing contact route and investment calculator stay available unchanged.',
    contactLabel: 'Speak to an advisor',
    calculatorLabel: 'Open investment calculator',
    milestoneTitle: 'What lands next',
    milestones: [
      'client estimator UI contract',
      'server-authoritative formula boundary',
      'share-result reopen state on this same route',
    ],
    disclaimerTitle: 'Important note',
    disclaimerBody:
      'No live totals are calculated on this page until the formula slice is merged and validated under the gate.',
  };
}

export function BuyingCostEstimatorShell({ locale }: { locale: Locale }) {
  const copy = getShellCopy(locale);

  return (
    <div className="detail-layout advisory-detail-layout mt-6">
      <div className="detail-stack">
        <section className="authority-card" aria-labelledby="buying-cost-estimator-shell-title">
          <div className="section-header section-header--left">
            <h2 className="section-title" id="buying-cost-estimator-shell-title">{copy.introTitle}</h2>
            <p className="section-subtitle">{copy.introBody}</p>
          </div>

          <div className="grid grid-2 mt-6">
            <div className="card">
              <h3 className="card-title">{copy.plannedInputsTitle}</h3>
              <p className="card-subtitle">{copy.toolLead}</p>
              <ul className="bullet-list mt-4">
                {copy.plannedInputs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3 className="card-title">{copy.plannedOutputsTitle}</h3>
              <p className="card-subtitle">{copy.statusBody}</p>
              <ul className="bullet-list mt-4">
                {copy.plannedOutputs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="card" aria-labelledby="buying-cost-estimator-boundary-title">
          <h2 className="card-title" id="buying-cost-estimator-boundary-title">{copy.assumptionsTitle}</h2>
          <ul className="bullet-list mt-4">
            {copy.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="card" aria-labelledby="buying-cost-estimator-disclaimer-title">
          <h2 className="card-title" id="buying-cost-estimator-disclaimer-title">{copy.disclaimerTitle}</h2>
          <p className="card-subtitle">{copy.disclaimerBody}</p>
        </section>
      </div>

      <aside className="page-rail">
        <div className="page-rail-card">
          <h2 className="card-title">{copy.nextStepTitle}</h2>
          <p className="card-subtitle">{copy.nextStepBody}</p>
          <div className="cta-row mt-4">
            <Link className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {copy.contactLabel}
            </Link>
            <Link className="btn btn-secondary" href={withLocale(locale, '/calculator')}>
              {copy.calculatorLabel}
            </Link>
          </div>
        </div>

        <div className="page-rail-card mt-4">
          <h2 className="card-title">{copy.milestoneTitle}</h2>
          <ul className="bullet-list mt-4">
            {copy.milestones.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}