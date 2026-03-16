'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { withLocale } from '@/app/_lib/i18n/routing';
import {
  DEFAULT_BUYING_COST_ASSUMPTION_SET_ID,
  DEFAULT_BUYING_COST_ASSUMPTION_SET_VERSION,
  requestBuyingCostEstimate,
  type BuyingCostEstimateResponse,
} from '@/lib/buying-cost-estimator';

type Locale = 'en' | 'th';

type PurchaseContext = 'thai_local' | 'foreign';
type OwnershipType = 'freehold' | 'leasehold' | 'company_hold';
type TransferSplit = 'buyer_pays' | 'split_equally' | 'seller_pays';
type FinancingMode = 'cash' | 'financing';

type Labels = ReturnType<typeof getShellCopy>;

function parsePositiveNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatCurrency(locale: Locale, value: number | null): string {
  if (value == null) {
    return locale === 'th' ? 'รอข้อมูลราคา' : 'Waiting for a valid price';
  }

  return new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(value);
}

function getOwnershipOptions(locale: Locale) {
  return locale === 'th'
    ? [
        { value: 'freehold', label: 'Freehold / foreign quota' },
        { value: 'leasehold', label: 'Leasehold' },
        { value: 'company_hold', label: 'Thai company hold' },
      ]
    : [
        { value: 'freehold', label: 'Freehold / foreign quota' },
        { value: 'leasehold', label: 'Leasehold' },
        { value: 'company_hold', label: 'Thai company hold' },
      ];
}

function getTransferSplitOptions(locale: Locale) {
  return locale === 'th'
    ? [
        { value: 'buyer_pays', label: 'ผู้ซื้อรับภาระหลัก' },
        { value: 'split_equally', label: 'แบ่งกันคนละครึ่ง' },
        { value: 'seller_pays', label: 'ผู้ขายรับภาระหลัก' },
      ]
    : [
        { value: 'buyer_pays', label: 'Buyer-led split' },
        { value: 'split_equally', label: 'Split equally' },
        { value: 'seller_pays', label: 'Seller-led split' },
      ];
}

function getFinancingOptions(locale: Locale) {
  return locale === 'th'
    ? [
        { value: 'cash', label: 'Cash purchase' },
        { value: 'financing', label: 'Financing scenario' },
      ]
    : [
        { value: 'cash', label: 'Cash purchase' },
        { value: 'financing', label: 'Financing scenario' },
      ];
}

function buildUnresolvedItems(
  locale: Locale,
  purchaseContext: PurchaseContext,
  ownershipType: OwnershipType,
  financingMode: FinancingMode,
): string[] {
  const items = locale === 'th'
    ? [
        'ภาษีหรือค่าใช้จ่ายที่ยังขึ้นกับข้อเท็จจริงเฉพาะเคสจะยังไม่ถูกรวมใน total',
      ]
    : [
        'Case-specific taxes or fees stay outside the deterministic total until the governed formula slice lands.',
      ];

  if (purchaseContext === 'foreign') {
    items.push(
      locale === 'th'
        ? 'ค่าโอนเงินระหว่างประเทศและ FX impact ยังต้องดูตามวันที่ทำรายการจริง'
        : 'International transfer cost and FX impact still need live review at transaction time.',
    );
  }

  if (ownershipType === 'company_hold') {
    items.push(
      locale === 'th'
        ? 'โครงสร้าง company hold ยังต้องให้ advisor และกฎหมายตรวจความเหมาะสมก่อนสรุปค่าใช้จ่าย'
        : 'Company-hold structures still require advisor and legal review before costs are treated as settled.',
    );
  }

  if (financingMode === 'financing') {
    items.push(
      locale === 'th'
        ? 'ค่าจดจำนองหรือค่าใช้จ่ายฝั่งสินเชื่อยังไม่ถูกคำนวณจนกว่า formula contract จะเปิดใช้'
        : 'Mortgage-registration or loan-side fees are not calculated until the formula contract is active.',
    );
  }

  return items;
}

function getShellCopy(locale: Locale) {
  if (locale === 'th') {
    return {
      introTitle: 'Estimator UI สำหรับผู้ซื้อที่ต้องการเห็น cash-needed picture ก่อน',
      introBody:
        'หน้าใหม่นี้เป็น owner route ของเครื่องมือคำนวณค่าโอนและค่าใช้จ่ายปิดการซื้อ โดย slice นี้เปิด form contract และ result structure ก่อนเชื่อม formula ฝั่ง server',
      toolTitle: 'Live estimator form',
      toolLead:
        'โครงสร้างผลลัพธ์จะแยก deterministic line items ออกจาก unresolved items อย่างชัดเจน เพื่อไม่ให้ตัวเลขดูเหมือนข้อสรุปทางกฎหมายหรือการเงิน',
      plannedInputsTitle: 'Primary inputs',
      plannedInputs: [
        'ราคาทรัพย์',
        'purchase context',
        'ownership type',
        'transfer split',
        'financing mode',
      ],
      advancedTitle: 'Advanced assumptions',
      advancedBody: 'สมมติฐานที่แก้ไขได้จะถูกแยกจากค่าใช้จ่ายภาครัฐเสมอ และเปิดใช้เป็น section รองบน mobile',
      plannedOutputsTitle: 'Result summary structure',
      plannedOutputs: [
        'purchase price',
        'government fees',
        'estimated closing cost',
        'total cash needed',
      ],
      statusTitle: 'Current slice status',
      statusBody:
        'Slice 2 เปิดเฉพาะ UI contract และ live form state เท่านั้น สูตรคำนวณ authoritative, share state, และ contact payload จะตามมาใน slices ถัดไป.',
      assumptionsTitle: 'Assumption discipline',
      assumptions: [
        'ค่าใช้จ่ายที่มี source ชัดเจนเท่านั้นที่จะถูกใส่ใน deterministic total',
        'รายการที่ยังมี legal/commercial ambiguity จะถูกแสดงแยกเป็น unresolved items',
        'route นี้ยังไม่แทน advisor review และยังไม่แก้ไข contact payload เดิมใน slice นี้',
      ],
      propertyPrice: 'Property price',
      purchaseContextLabel: 'Purchase context',
      thaiLocalLabel: 'Thai / local purchase context',
      foreignLabel: 'Foreign purchase context',
      ownershipTypeLabel: 'Ownership type',
      transferSplitLabel: 'Transfer split',
      financingModeLabel: 'Financing mode',
      advancedToggle: 'เปิด advanced assumptions',
      agentFee: 'Agent fee assumption',
      lawyerFee: 'Lawyer fee assumption',
      bankTransferCost: 'Bank transfer cost assumption',
      fxEstimate: 'FX estimate',
      invalidPrice: 'กรุณากรอกราคาทรัพย์เป็นตัวเลขมากกว่า 0',
      previewStateTitle: 'Live UI preview',
      previewReady: 'form state พร้อมสำหรับ formula slice',
      previewPending: 'กรอกราคาทรัพย์ก่อนเพื่อเปิด deterministic preview path',
      governmentFeesLabel: 'Government fees',
      closingCostLabel: 'Estimated closing cost',
      totalCashNeededLabel: 'Total cash needed',
      resultPending: 'จะแสดงเมื่อ formula slice เชื่อมต่อแล้ว',
      resultConditional: 'ขึ้นกับ purchase context และ assumptions ที่เลือก',
      resultLive: 'UI นี้อัปเดตทันที แต่ total จริงยังต้องมาจาก authoritative formula',
      resultLoading: 'กำลังอัปเดต estimate จาก authoritative formula',
      resultError: 'estimate ล่าสุดโหลดไม่สำเร็จ จึงคงผลลัพธ์ก่อนหน้าไว้ถ้ามี',
      activeAssumptionsTitle: 'Applied assumptions visible in this scenario',
      unresolvedTitle: 'Unresolved items kept outside deterministic totals',
      lineItemsTitle: 'Deterministic line items returned by formula',
      nextStepTitle: 'Next-step region',
      nextStepBody:
        'หากต้องการคุยภาพรวมการซื้อก่อน formula และ handoff slice จะเสร็จ คุณยังใช้ contact route และ investment calculator เดิมได้ตามปกติ',
      contactLabel: 'ไปหน้า contact เดิม',
      calculatorLabel: 'เปิด investment calculator',
      milestoneTitle: 'What lands next',
      milestones: [
        'server-authoritative formula boundary',
        'share-result reopen state on this same route',
        'advisor handoff payload on the existing contact route',
      ],
      disclaimerTitle: 'Important note',
      disclaimerBody:
        'ตัวเลขจริงยังไม่ถูกคำนวณในหน้านี้จนกว่า formula slice จะถูก merge และ validate ตาม gate และ estimator summary ตอนนี้เป็น UI contract preview เท่านั้น.',
    };
  }

  return {
    introTitle: 'Estimator UI for buyers who need a cash-needed picture first',
    introBody:
      'This route is the approved owner for transfer-fee and closing-cost estimation, and this slice now opens the live UI contract before the server-authoritative formula is connected.',
    toolTitle: 'Live estimator form',
    toolLead:
      'Deterministic line items and unresolved items stay visibly separate so the output does not read like legal or financial certainty.',
    plannedInputsTitle: 'Primary inputs',
    plannedInputs: [
      'property price',
      'purchase context',
      'ownership type',
      'transfer split',
      'financing mode',
    ],
    advancedTitle: 'Advanced assumptions',
    advancedBody: 'Editable assumptions remain separate from government-fee items and sit in a secondary section for mobile clarity.',
    plannedOutputsTitle: 'Result summary structure',
    plannedOutputs: [
      'purchase price',
      'government fees',
      'estimated closing cost',
      'total cash needed',
    ],
    statusTitle: 'Current slice status',
    statusBody:
      'Slice 2 opens only the UI contract and live form state. The authoritative formula, share state, and contact payload arrive in later slices.',
    assumptionsTitle: 'Assumption discipline',
    assumptions: [
      'Only governed fee inputs may enter the deterministic total.',
      'Legal or commercial ambiguity stays visible as unresolved items.',
      'This route does not replace advisor review or change the current contact payload in this slice.',
    ],
    propertyPrice: 'Property price',
    purchaseContextLabel: 'Purchase context',
    thaiLocalLabel: 'Thai / local purchase context',
    foreignLabel: 'Foreign purchase context',
    ownershipTypeLabel: 'Ownership type',
    transferSplitLabel: 'Transfer split',
    financingModeLabel: 'Financing mode',
    advancedToggle: 'Open advanced assumptions',
    agentFee: 'Agent fee assumption',
    lawyerFee: 'Lawyer fee assumption',
    bankTransferCost: 'Bank transfer cost assumption',
    fxEstimate: 'FX estimate',
    invalidPrice: 'Enter a property price greater than 0.',
    previewStateTitle: 'Live UI preview',
    previewReady: 'form state is ready for the formula slice',
    previewPending: 'enter a property price to open the deterministic preview path',
    governmentFeesLabel: 'Government fees',
    closingCostLabel: 'Estimated closing cost',
    totalCashNeededLabel: 'Total cash needed',
    resultPending: 'Available once the formula slice is connected',
    resultConditional: 'Depends on the selected purchase context and assumptions',
    resultLive: 'This UI updates immediately, but real totals still come from the authoritative formula slice.',
    resultLoading: 'Updating estimate from the authoritative formula',
    resultError: 'The latest estimate request failed, so the last good result stays visible when available.',
    activeAssumptionsTitle: 'Applied assumptions visible in this scenario',
    unresolvedTitle: 'Unresolved items kept outside deterministic totals',
    lineItemsTitle: 'Deterministic line items returned by the formula',
    nextStepTitle: 'Next-step region',
    nextStepBody:
      'If you need to discuss the purchase context before the formula and handoff slices land, the existing contact route and investment calculator stay available unchanged.',
    contactLabel: 'Open the current contact route',
    calculatorLabel: 'Open investment calculator',
    milestoneTitle: 'What lands next',
    milestones: [
      'server-authoritative formula boundary',
      'share-result reopen state on this same route',
      'advisor handoff payload on the existing contact route',
    ],
    disclaimerTitle: 'Important note',
    disclaimerBody:
      'No live totals are calculated on this page until the formula slice is merged and validated under the gate, so the summary currently acts as a UI contract preview only.',
  };
}

export function BuyingCostEstimatorShell({ locale }: { locale: Locale }) {
  const copy = getShellCopy(locale);
  const [propertyPrice, setPropertyPrice] = useState('6000000');
  const [purchaseContext, setPurchaseContext] = useState<PurchaseContext>('thai_local');
  const [ownershipType, setOwnershipType] = useState<OwnershipType>('freehold');
  const [transferSplit, setTransferSplit] = useState<TransferSplit>('split_equally');
  const [financingMode, setFinancingMode] = useState<FinancingMode>('cash');
  const [agentFee, setAgentFee] = useState('0');
  const [lawyerFee, setLawyerFee] = useState('20000');
  const [bankTransferCost, setBankTransferCost] = useState('15000');
  const [fxEstimate, setFxEstimate] = useState('25000');
  const [estimate, setEstimate] = useState<BuyingCostEstimateResponse | null>(null);
  const [estimateStatus, setEstimateStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const ownershipOptions = useMemo(() => getOwnershipOptions(locale), [locale]);
  const transferSplitOptions = useMemo(() => getTransferSplitOptions(locale), [locale]);
  const financingOptions = useMemo(() => getFinancingOptions(locale), [locale]);

  const parsedPrice = parsePositiveNumber(propertyPrice);
  const priceError = propertyPrice.trim().length > 0 && parsedPrice == null ? copy.invalidPrice : null;
  const unresolvedItems = useMemo(
    () => buildUnresolvedItems(locale, purchaseContext, ownershipType, financingMode),
    [financingMode, locale, ownershipType, purchaseContext],
  );

  useEffect(() => {
    if (parsedPrice == null) {
      setEstimate(null);
      setEstimateStatus('idle');
      return;
    }

    let active = true;
    setEstimateStatus('loading');

    const request = {
      purchase_context: purchaseContext,
      property_price: parsedPrice,
      ownership_type: ownershipType,
      transfer_split: transferSplit,
      financing_mode: financingMode,
      assumption_set_id: DEFAULT_BUYING_COST_ASSUMPTION_SET_ID,
      assumption_set_version: DEFAULT_BUYING_COST_ASSUMPTION_SET_VERSION,
      agent_fee: Number(agentFee) > 0 ? Number(agentFee) : undefined,
      lawyer_fee: purchaseContext === 'foreign' && Number(lawyerFee) > 0 ? Number(lawyerFee) : undefined,
      bank_transfer_cost: purchaseContext === 'foreign' && Number(bankTransferCost) > 0 ? Number(bankTransferCost) : undefined,
      fx_estimate: purchaseContext === 'foreign' && Number(fxEstimate) > 0 ? Number(fxEstimate) : undefined,
    };

    requestBuyingCostEstimate(request)
      .then((response) => {
        if (!active) return;
        setEstimate(response);
        setEstimateStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setEstimateStatus('error');
      });

    return () => {
      active = false;
    };
  }, [agentFee, bankTransferCost, financingMode, fxEstimate, lawyerFee, ownershipType, parsedPrice, purchaseContext, transferSplit]);

  const appliedAssumptions = useMemo(() => {
    const items = [
      `${copy.propertyPrice}: ${formatCurrency(locale, parsedPrice)}`,
      `${copy.purchaseContextLabel}: ${purchaseContext === 'foreign' ? copy.foreignLabel : copy.thaiLocalLabel}`,
      `${copy.ownershipTypeLabel}: ${ownershipOptions.find((item) => item.value === ownershipType)?.label}`,
      `${copy.transferSplitLabel}: ${transferSplitOptions.find((item) => item.value === transferSplit)?.label}`,
      `${copy.financingModeLabel}: ${financingOptions.find((item) => item.value === financingMode)?.label}`,
    ];

    if (Number(agentFee) > 0) items.push(`${copy.agentFee}: ${formatCurrency(locale, Number(agentFee))}`);
    if (purchaseContext === 'foreign' && Number(lawyerFee) > 0) items.push(`${copy.lawyerFee}: ${formatCurrency(locale, Number(lawyerFee))}`);
    if (purchaseContext === 'foreign' && Number(bankTransferCost) > 0) items.push(`${copy.bankTransferCost}: ${formatCurrency(locale, Number(bankTransferCost))}`);
    if (purchaseContext === 'foreign' && Number(fxEstimate) > 0) items.push(`${copy.fxEstimate}: ${formatCurrency(locale, Number(fxEstimate))}`);

    return items.filter(Boolean) as string[];
  }, [agentFee, bankTransferCost, copy.agentFee, copy.bankTransferCost, copy.financingModeLabel, copy.foreignLabel, copy.fxEstimate, copy.lawyerFee, copy.ownershipTypeLabel, copy.propertyPrice, copy.purchaseContextLabel, copy.thaiLocalLabel, copy.transferSplitLabel, financingMode, financingOptions, fxEstimate, lawyerFee, locale, ownershipOptions, ownershipType, parsedPrice, purchaseContext, transferSplit, transferSplitOptions]);

  const renderedUnresolvedItems = estimate?.unresolved_items?.length ? estimate.unresolved_items : unresolvedItems;

  function formatResultAmount(value: number | null | undefined): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return copy.resultPending;
    }

    return formatCurrency(locale, value);
  }

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
              <div className="form-grid-2 mt-4">
                <label className="form-label">
                  {copy.propertyPrice}
                  <input
                    aria-invalid={priceError ? 'true' : 'false'}
                    className="form-input"
                    inputMode="numeric"
                    onChange={(event) => setPropertyPrice(event.target.value)}
                    value={propertyPrice}
                  />
                  {priceError ? <span className="text-caption text-danger">{priceError}</span> : null}
                </label>

                <fieldset className="form-label">
                  <legend>{copy.purchaseContextLabel}</legend>
                  <div className="cta-row mt-2" role="radiogroup" aria-label={copy.purchaseContextLabel}>
                    <label className="chip-option">
                      <input
                        checked={purchaseContext === 'thai_local'}
                        name="purchase-context"
                        onChange={() => setPurchaseContext('thai_local')}
                        type="radio"
                      />
                      <span>{copy.thaiLocalLabel}</span>
                    </label>
                    <label className="chip-option">
                      <input
                        checked={purchaseContext === 'foreign'}
                        name="purchase-context"
                        onChange={() => setPurchaseContext('foreign')}
                        type="radio"
                      />
                      <span>{copy.foreignLabel}</span>
                    </label>
                  </div>
                </fieldset>

                <label className="form-label">
                  {copy.ownershipTypeLabel}
                  <select className="form-input" onChange={(event) => setOwnershipType(event.target.value as OwnershipType)} value={ownershipType}>
                    {ownershipOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="form-label">
                  {copy.transferSplitLabel}
                  <select className="form-input" onChange={(event) => setTransferSplit(event.target.value as TransferSplit)} value={transferSplit}>
                    {transferSplitOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="form-label form-grid-2__full">
                  {copy.financingModeLabel}
                  <select className="form-input" onChange={(event) => setFinancingMode(event.target.value as FinancingMode)} value={financingMode}>
                    {financingOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
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

          <details className="card mt-6" open={purchaseContext === 'foreign'}>
            <summary className="card-title">{copy.advancedToggle}</summary>
            <p className="card-subtitle mt-3">{copy.advancedBody}</p>
            <div className="form-grid-2 mt-4">
              <label className="form-label">
                {copy.agentFee}
                <input className="form-input" inputMode="numeric" onChange={(event) => setAgentFee(event.target.value)} value={agentFee} />
              </label>

              {purchaseContext === 'foreign' ? (
                <>
                  <label className="form-label">
                    {copy.lawyerFee}
                    <input className="form-input" inputMode="numeric" onChange={(event) => setLawyerFee(event.target.value)} value={lawyerFee} />
                  </label>

                  <label className="form-label">
                    {copy.bankTransferCost}
                    <input className="form-input" inputMode="numeric" onChange={(event) => setBankTransferCost(event.target.value)} value={bankTransferCost} />
                  </label>

                  <label className="form-label">
                    {copy.fxEstimate}
                    <input className="form-input" inputMode="numeric" onChange={(event) => setFxEstimate(event.target.value)} value={fxEstimate} />
                  </label>
                </>
              ) : null}
            </div>
          </details>
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
          <h2 className="card-title">{copy.previewStateTitle}</h2>
          <p className="card-subtitle">
            {parsedPrice == null
              ? copy.previewPending
              : estimateStatus === 'loading'
                ? copy.resultLoading
                : estimateStatus === 'error'
                  ? copy.resultError
                  : copy.previewReady}
          </p>
          <div className="insight-list mt-4">
            <div className="insight-list__item">
              <span className="insight-list__title">{copy.propertyPrice}</span>
              <span className="insight-list__body">{formatCurrency(locale, parsedPrice)}</span>
            </div>
            <div className="insight-list__item">
              <span className="insight-list__title">{copy.governmentFeesLabel}</span>
              <span className="insight-list__body">{formatResultAmount(estimate?.government_fees)}</span>
            </div>
            <div className="insight-list__item">
              <span className="insight-list__title">{copy.closingCostLabel}</span>
              <span className="insight-list__body">{formatResultAmount(estimate?.closing_cost)}</span>
            </div>
            <div className="insight-list__item">
              <span className="insight-list__title">{copy.totalCashNeededLabel}</span>
              <span className="insight-list__body">{formatResultAmount(estimate?.total_cash_needed)}</span>
            </div>
          </div>
          <p className="text-caption mt-4">{copy.resultLive}</p>
        </div>

        <div className="page-rail-card mt-4">
          <h2 className="card-title">{copy.lineItemsTitle}</h2>
          <ul className="bullet-list mt-4">
            {(estimate?.line_items ?? []).map((item) => (
              <li key={item.key}>{`${item.label_key}: ${formatCurrency(locale, item.amount)}`}</li>
            ))}
            {!estimate?.line_items?.length ? <li>{copy.resultConditional}</li> : null}
          </ul>
        </div>

        <div className="page-rail-card mt-4">
          <h2 className="card-title">{copy.activeAssumptionsTitle}</h2>
          <ul className="bullet-list mt-4">
            {appliedAssumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="page-rail-card mt-4">
          <h2 className="card-title">{copy.unresolvedTitle}</h2>
          <ul className="bullet-list mt-4">
            {renderedUnresolvedItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="page-rail-card mt-4">
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