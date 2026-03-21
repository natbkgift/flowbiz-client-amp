'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { withLocale } from '@/app/_lib/i18n/routing';
import { buildBuyingCostAdvisorQuery, withLocaleQuery } from '@/app/_lib/public-advisory';
import { trackEvent } from '@/lib/analytics';
import {
  buildBuyingCostShareQuery,
  DEFAULT_BUYING_COST_ASSUMPTION_SET_ID,
  DEFAULT_BUYING_COST_ASSUMPTION_SET_VERSION,
  parseBuyingCostShareQuery,
  requestBuyingCostEstimate,
  stripBuyingCostShareQuery,
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
        'ภาษีหรือค่าใช้จ่ายที่ยังขึ้นกับข้อเท็จจริงเฉพาะเคสจะยังไม่ถูกรวมในยอดประมาณการนี้',
      ]
    : [
        'Case-specific taxes or fees stay outside this estimate until the transaction facts are confirmed.',
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
        ? 'ค่าจดจำนองหรือค่าใช้จ่ายฝั่งสินเชื่อยังไม่ถูกรวมจนกว่าจะยืนยันเงื่อนไขสินเชื่อจริง'
        : 'Mortgage-registration or loan-side fees stay outside this estimate until financing terms are confirmed.',
    );
  }

  return items;
}

function getShellCopy(locale: Locale) {
  if (locale === 'th') {
    return {
      introTitle: 'ประมาณการค่าใช้จ่ายสำหรับผู้ซื้อที่ต้องการเห็นภาพเงินสดที่ต้องเตรียม',
      introBody:
        'ใช้หน้านี้เพื่อดูภาพรวมค่าโอน ค่าใช้จ่ายวันปิดการซื้อ และยอดเงินสดที่ควรเตรียมก่อนคุยรายละเอียดต่อกับ advisor.',
      toolTitle: 'แบบฟอร์มประเมินค่าใช้จ่าย',
      toolLead:
        'ผลลัพธ์จะแยกรายการที่ประเมินได้ชัดเจนออกจากประเด็นที่ยังต้องยืนยันเพิ่ม เพื่อให้ตัวเลขอ่านง่ายแต่ไม่เกินข้อเท็จจริง.',
      plannedInputsTitle: 'ข้อมูลหลักที่ใช้ประเมิน',
      plannedInputs: [
        'ราคาทรัพย์',
        'purchase context',
        'ownership type',
        'transfer split',
        'financing mode',
      ],
      advancedTitle: 'สมมติฐานเพิ่มเติม',
      advancedBody: 'สมมติฐานที่ปรับได้จะถูกแยกจากค่าธรรมเนียมภาครัฐอย่างชัดเจน เพื่อให้ตรวจสอบต้นทางของตัวเลขได้ง่าย.',
      plannedOutputsTitle: 'สิ่งที่สรุปให้ในหน้านี้',
      plannedOutputs: [
        'purchase price',
        'government fees',
        'estimated closing cost',
        'total cash needed',
      ],
      statusTitle: 'วิธีใช้ผลลัพธ์นี้',
      statusBody:
        'หน้านี้สรุปค่าธรรมเนียมหลัก ยอดประมาณการปิดการซื้อ และรายการที่ยังต้องถามต่อ เพื่อช่วยให้คุยกับทีมได้ตรงประเด็นขึ้น.',
      assumptionsTitle: 'วิธีอ่านประมาณการนี้',
      assumptions: [
        'ค่าใช้จ่ายที่มีต้นทางชัดเจนเท่านั้นที่จะถูกรวมในยอดประมาณการหลักของหน้านี้',
        'รายการที่ยังมีความไม่ชัดด้านกฎหมายหรือเงื่อนไขการค้า จะถูกแยกไว้ให้ถามต่อ',
        'หน้านี้ใช้เพื่อเตรียมคำถามและบริบทก่อนคุยกับ advisor ต่อ',
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
      previewStateTitle: 'ผลประเมินล่าสุด',
      previewReady: 'ผลประเมินพร้อมแล้วและอ้างอิงจากข้อมูลที่เลือกอยู่ตอนนี้',
      previewPending: 'กรอกราคาทรัพย์ก่อนเพื่อดูผลประเมินเบื้องต้น',
      governmentFeesLabel: 'Government fees',
      closingCostLabel: 'Estimated closing cost',
      totalCashNeededLabel: 'Total cash needed',
      resultPending: 'รอผลประเมินจากข้อมูลล่าสุด',
      resultConditional: 'ผลลัพธ์ขึ้นกับ purchase context และ assumptions ที่เลือก',
      resultLive: 'ตัวเลขจะอัปเดตตามข้อมูลที่เลือก และควรใช้คู่กับการตรวจเอกสารและเงื่อนไขจริงก่อนตัดสินใจ',
      resultLoading: 'กำลังอัปเดตผลประเมินล่าสุด',
      resultError: 'estimate ล่าสุดโหลดไม่สำเร็จ จึงคงผลลัพธ์ก่อนหน้าไว้ถ้ามี',
      activeAssumptionsTitle: 'Applied assumptions visible in this scenario',
      unresolvedTitle: 'Items still outside the current estimate',
      lineItemsTitle: 'รายการที่รวมอยู่ในประมาณการนี้',
      nextStepTitle: 'คุยต่อจากประมาณการนี้',
      nextStepBody:
        'หากต้องการตรวจต่อเรื่อง quota, fee split หรือเอกสารที่ต้องใช้ คุณสามารถส่งบริบทชุดนี้ต่อให้ advisor ได้ทันที.',
      shareTitle: 'แชร์ประมาณการนี้',
      shareBody: 'ลิงก์นี้จะเปิดกลับมาที่หน้าประมาณการเดิมพร้อม assumptions และ unresolved items ล่าสุด',
      shareLinkLabel: 'ลิงก์สำหรับแชร์ประมาณการ',
      shareReady: 'ลิงก์พร้อมใช้งานและเปิดกลับมาที่ประมาณการเดิมได้',
      versionMismatchTitle: 'Assumption version review',
      versionMismatchBody: 'ลิงก์ที่เปิดอยู่มาจาก assumption version อื่น จึงยังไม่รีคำนวณอัตโนมัติภายใต้ version ปัจจุบันจนกว่าจะกดยืนยัน refresh',
      refreshAssumptionsLabel: 'Refresh under current assumptions',
      contactLabel: 'คุยกับ advisor เกี่ยวกับประมาณการนี้',
      calculatorLabel: 'เปิด investment calculator',
      milestoneTitle: 'ประมาณการนี้ช่วยตัดสินใจอะไรได้บ้าง',
      milestones: [
        'ดูภาพรวมค่าโอนและเงินสดที่ควรเตรียมก่อน shortlist',
        'แยกค่าใช้จ่ายที่ชัดเจนออกจากประเด็นที่ยังต้องถามต่อ',
        'ส่งต่อบริบทเดิมให้ advisor โดยไม่ต้องอธิบายใหม่ทั้งหมด',
      ],
      disclaimerTitle: 'Important note',
      disclaimerBody:
        'ผลลัพธ์นี้เป็นประมาณการจากข้อมูลที่เลือกอยู่ตอนนี้ และลิงก์แชร์จะพกเฉพาะบริบทที่จำเป็นเพื่อกลับมาอ่านหน้าชุดเดิมได้ต่อเนื่อง.',
    };
  }

  return {
    introTitle: 'A buyer-focused estimate for transfer fees and cash needed',
    introBody:
      'Use this page to review transfer fees, closing costs, and the cash you may need before moving into advisor review.',
    toolTitle: 'Cost estimate form',
    toolLead:
      'Clear line items stay separate from unresolved questions so the estimate remains useful without overstating certainty.',
    plannedInputsTitle: 'Core inputs',
    plannedInputs: [
      'property price',
      'purchase context',
      'ownership type',
      'transfer split',
      'financing mode',
    ],
    advancedTitle: 'Optional assumptions',
    advancedBody: 'Editable assumptions stay separate from government fees so it is always clear which figures are fixed and which still need confirmation.',
    plannedOutputsTitle: 'What this page summarizes',
    plannedOutputs: [
      'purchase price',
      'government fees',
      'estimated closing cost',
      'total cash needed',
    ],
    statusTitle: 'How to use this estimate',
    statusBody:
      'This page gives you the current fee picture, a practical cash-needed view, and the follow-up questions worth raising with an advisor.',
    assumptionsTitle: 'How to read this estimate',
    assumptions: [
      'Only fee inputs with a clear basis are included in the main estimate shown on this page.',
      'Legal or commercial ambiguity stays visible as follow-up items instead of being hidden inside the total.',
      'Use this page to prepare the advisor conversation, not to replace document or legal review.',
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
    previewStateTitle: 'Current estimate',
    previewReady: 'The estimate is ready for the details selected above.',
    previewPending: 'Enter a property price to see the estimate update.',
    governmentFeesLabel: 'Government fees',
    closingCostLabel: 'Estimated closing cost',
    totalCashNeededLabel: 'Total cash needed',
    resultPending: 'Waiting for the current estimate.',
    resultConditional: 'Depends on the selected purchase context and assumptions',
    resultLive: 'The estimate updates with your selected inputs and should be checked against live transaction terms before you commit.',
    resultLoading: 'Updating the latest estimate',
    resultError: 'The latest estimate request failed, so the last good result stays visible when available.',
    activeAssumptionsTitle: 'Applied assumptions visible in this scenario',
    unresolvedTitle: 'Items still outside the current estimate',
    lineItemsTitle: 'Included line items',
    nextStepTitle: 'Talk through this estimate',
    nextStepBody:
      'If you want to confirm quota, fee split, or document readiness, send this exact context to an advisor and continue from the same assumptions.',
    shareTitle: 'Share this estimate',
    shareBody: 'This URL reopens the same estimate with the current assumptions, version details, and unresolved items intact.',
    shareLinkLabel: 'Shareable estimate URL',
    shareReady: 'The share link is ready and reopens this same estimate view.',
    versionMismatchTitle: 'Assumption version review',
    versionMismatchBody: 'This shared link references a different assumption version, so the page will not silently recompute under the current version until you confirm a refresh.',
    refreshAssumptionsLabel: 'Refresh under current assumptions',
    contactLabel: 'Discuss this estimate with an advisor',
    calculatorLabel: 'Open investment calculator',
    milestoneTitle: 'What this estimate helps you decide',
    milestones: [
      'How much cash you may need before the shortlist narrows',
      'Which fees are already clear and which still need confirmation',
      'What context to carry into the advisor conversation without restating everything',
    ],
    disclaimerTitle: 'Important note',
    disclaimerBody:
      'This estimate reflects the inputs currently selected on the page, and the share URL only carries the context needed to reopen the same scenario cleanly.',
  };
}

export function BuyingCostEstimatorShell({ locale }: { locale: Locale }) {
  const copy = getShellCopy(locale);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [versionMismatch, setVersionMismatch] = useState<{ assumptionSetId: string; assumptionSetVersion: string } | null>(null);
  const [sharedUnresolvedItems, setSharedUnresolvedItems] = useState<string[]>([]);
  const [parsedQueryKey, setParsedQueryKey] = useState<string | null>(null);
  const [shareStateReady, setShareStateReady] = useState(false);
  const [openedFromSharedLink, setOpenedFromSharedLink] = useState(false);

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
    const nextQueryKey = searchParams?.toString() ?? '';
    if (parsedQueryKey !== null && nextQueryKey === parsedQueryKey) {
      return;
    }

    setParsedQueryKey(nextQueryKey);

    if (!searchParams) {
      setShareStateReady(true);
      return;
    }

    const parsedShareState = parseBuyingCostShareQuery(searchParams);
    if (!parsedShareState.has_share_state) {
      if (parsedQueryKey === null) {
        setOpenedFromSharedLink(false);
      }
      setVersionMismatch(null);
      setSharedUnresolvedItems([]);
      setShareStateReady(true);
      return;
    }

    if (parsedQueryKey === null) {
      setOpenedFromSharedLink(true);
    }

    if (parsedShareState.property_price) setPropertyPrice(String(parsedShareState.property_price));
    if (parsedShareState.purchase_context) setPurchaseContext(parsedShareState.purchase_context);
    if (parsedShareState.ownership_type) setOwnershipType(parsedShareState.ownership_type);
    if (parsedShareState.transfer_split) setTransferSplit(parsedShareState.transfer_split);
    if (parsedShareState.financing_mode) setFinancingMode(parsedShareState.financing_mode);
    setAgentFee(String(parsedShareState.agent_fee ?? 0));
    setLawyerFee(String(parsedShareState.lawyer_fee ?? 20000));
    setBankTransferCost(String(parsedShareState.bank_transfer_cost ?? 15000));
    setFxEstimate(String(parsedShareState.fx_estimate ?? 25000));
    setSharedUnresolvedItems(parsedShareState.unresolved_items ?? []);

    const hasMismatch = Boolean(
      parsedShareState.assumption_set_id
      && parsedShareState.assumption_set_version
      && (
        parsedShareState.assumption_set_id !== DEFAULT_BUYING_COST_ASSUMPTION_SET_ID
        || parsedShareState.assumption_set_version !== DEFAULT_BUYING_COST_ASSUMPTION_SET_VERSION
      ),
    );

    setVersionMismatch(
      hasMismatch
        ? {
            assumptionSetId: parsedShareState.assumption_set_id ?? DEFAULT_BUYING_COST_ASSUMPTION_SET_ID,
            assumptionSetVersion: parsedShareState.assumption_set_version ?? DEFAULT_BUYING_COST_ASSUMPTION_SET_VERSION,
          }
        : null,
    );
    setShareStateReady(true);
  }, [parsedQueryKey, searchParams]);

  useEffect(() => {
    if (!shareStateReady) {
      return;
    }

    if (parsedPrice == null || versionMismatch) {
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
        setSharedUnresolvedItems(response.unresolved_items);
      })
      .catch(() => {
        if (!active) return;
        setEstimateStatus('error');
      });

    return () => {
      active = false;
    };
  }, [agentFee, bankTransferCost, financingMode, fxEstimate, lawyerFee, ownershipType, parsedPrice, purchaseContext, shareStateReady, transferSplit, versionMismatch]);

  const shareQuery = useMemo(() => {
    if (parsedPrice == null || !estimate || versionMismatch) {
      return null;
    }

    return buildBuyingCostShareQuery({
      purchase_context: purchaseContext,
      property_price: parsedPrice,
      ownership_type: ownershipType,
      transfer_split: transferSplit,
      financing_mode: financingMode,
      assumption_set_id: estimate.assumption_set_id,
      assumption_set_version: estimate.assumption_set_version,
      agent_fee: Number(agentFee) > 0 ? Number(agentFee) : undefined,
      lawyer_fee: purchaseContext === 'foreign' && Number(lawyerFee) > 0 ? Number(lawyerFee) : undefined,
      bank_transfer_cost: purchaseContext === 'foreign' && Number(bankTransferCost) > 0 ? Number(bankTransferCost) : undefined,
      fx_estimate: purchaseContext === 'foreign' && Number(fxEstimate) > 0 ? Number(fxEstimate) : undefined,
      disclaimer_key: estimate.disclaimer_key,
      unresolved_items: estimate.unresolved_items,
    });
  }, [agentFee, bankTransferCost, estimate, fxEstimate, lawyerFee, ownershipType, parsedPrice, purchaseContext, transferSplit, financingMode, versionMismatch]);

  useEffect(() => {
    if (!pathname || !searchParams || !shareStateReady || versionMismatch) {
      return;
    }

    const nextParams = stripBuyingCostShareQuery(new URLSearchParams(searchParams.toString()));

    if (shareQuery) {
      Object.entries(shareQuery).forEach(([key, value]) => {
        nextParams.set(key, value);
      });
    }

    const currentQuery = searchParams.toString();
    const nextQuery = nextParams.toString();
    if (currentQuery === nextQuery) {
      return;
    }

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, shareQuery, shareStateReady, versionMismatch]);

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

  const renderedUnresolvedItems = versionMismatch && sharedUnresolvedItems.length
    ? sharedUnresolvedItems
    : estimate?.unresolved_items?.length
      ? estimate.unresolved_items
      : unresolvedItems;

  const shareUrl = useMemo(() => {
    if (!pathname || !shareQuery || typeof window === 'undefined') {
      return '';
    }

    const params = stripBuyingCostShareQuery(new URLSearchParams(searchParams?.toString() ?? ''));
    Object.entries(shareQuery).forEach(([key, value]) => {
      params.set(key, value);
    });

    return `${window.location.origin}${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
  }, [pathname, searchParams, shareQuery]);

  const contactHref = useMemo(() => {
    if (!estimate || versionMismatch || parsedPrice == null) {
      return withLocale(locale, '/contact');
    }

    return withLocaleQuery(locale, '/contact', buildBuyingCostAdvisorQuery({
      intent: 'buying_cost_review',
      source: openedFromSharedLink ? 'buying_cost_share' : 'buying_cost_estimator',
      tool: 'buying_cost_estimator',
      propertyPrice: parsedPrice,
      purchaseContext: purchaseContext,
      ownershipType: ownershipType,
      transferSplit: transferSplit,
      financingMode: financingMode,
      assumptionSetId: estimate.assumption_set_id,
      assumptionVersion: estimate.assumption_set_version,
      governmentFees: estimate.government_fees,
      closingCost: estimate.closing_cost,
      totalCashNeeded: estimate.total_cash_needed,
      agentFee: Number(agentFee) > 0 ? Number(agentFee) : undefined,
      lawyerFee: purchaseContext === 'foreign' && Number(lawyerFee) > 0 ? Number(lawyerFee) : undefined,
      bankTransferCost: purchaseContext === 'foreign' && Number(bankTransferCost) > 0 ? Number(bankTransferCost) : undefined,
      fxEstimate: purchaseContext === 'foreign' && Number(fxEstimate) > 0 ? Number(fxEstimate) : undefined,
      unresolvedItems: estimate.unresolved_items,
      disclaimerKey: estimate.disclaimer_key,
    }));
  }, [agentFee, bankTransferCost, estimate, financingMode, fxEstimate, lawyerFee, locale, openedFromSharedLink, ownershipType, parsedPrice, purchaseContext, transferSplit, versionMismatch]);

  function formatResultAmount(value: number | null | undefined): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return copy.resultPending;
    }

    return formatCurrency(locale, value);
  }

  return (
    <div className="detail-layout advisory-detail-layout mt-4 decision-estimator-layout">
      <div className="detail-stack">
        <section className="authority-card decision-estimator-intro" aria-labelledby="buying-cost-estimator-shell-title">
          <h2 className="sr-only" id="buying-cost-estimator-shell-title">{copy.introTitle}</h2>
          <p className="guided-dialog__step mb-4">{copy.introBody}</p>
          <div className="grid grid-2">
            <div className="authority-card decision-mini-card">
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

            <div className="authority-card decision-mini-card">
              <h3 className="card-title">{copy.plannedOutputsTitle}</h3>
              <p className="card-subtitle">{copy.statusBody}</p>
              <ul className="bullet-list mt-4">
                {copy.plannedOutputs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <details className="authority-card decision-mini-card mt-6" open={purchaseContext === 'foreign'}>
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

        <section className="authority-card decision-mini-card" aria-labelledby="buying-cost-estimator-boundary-title">
          <h2 className="card-title" id="buying-cost-estimator-boundary-title">{copy.assumptionsTitle}</h2>
          <ul className="bullet-list mt-4">
            {copy.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="authority-card decision-mini-card" aria-labelledby="buying-cost-estimator-disclaimer-title">
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
          <h2 className="card-title">{copy.nextStepTitle}</h2>
          <p className="card-subtitle">{copy.nextStepBody}</p>
          <div className="cta-row mt-4">
            <Link
              className="btn btn-cta"
              href={contactHref}
              onClick={() => {
                trackEvent('cta_click', pathname ?? withLocale(locale, '/buying-cost-estimator'), {
                  source_route: 'estimator',
                  cta_type: 'primary',
                  cta_label: copy.contactLabel,
                  entity_type: 'estimate',
                  entity_name: 'buying_cost_estimate',
                  user_intent: 'buy',
                  context: {
                    estimator_result: {
                      property_price: parsedPrice ?? '',
                      government_fees: estimate?.government_fees ?? '',
                      closing_cost: estimate?.closing_cost ?? '',
                      total_cash_needed: estimate?.total_cash_needed ?? '',
                    },
                  },
                });
              }}
            >
              {copy.contactLabel}
            </Link>
            <Link
              className="btn btn-secondary"
              href={withLocale(locale, '/calculator')}
              onClick={() => {
                trackEvent('cta_click', pathname ?? withLocale(locale, '/buying-cost-estimator'), {
                  source_route: 'estimator',
                  cta_type: 'secondary',
                  cta_label: copy.calculatorLabel,
                  entity_type: 'route',
                  entity_name: 'calculator',
                  user_intent: 'invest',
                  context: {
                    estimator_result: {
                      property_price: parsedPrice ?? '',
                      total_cash_needed: estimate?.total_cash_needed ?? '',
                    },
                  },
                });
              }}
            >
              {copy.calculatorLabel}
            </Link>
          </div>
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
          <h2 className="card-title">{copy.shareTitle}</h2>
          <p className="card-subtitle">{copy.shareBody}</p>
          {versionMismatch ? (
            <div className="mt-4">
              <p className="text-caption text-danger">{copy.versionMismatchTitle}</p>
              <p className="text-caption mt-2">{`${copy.versionMismatchBody} (${versionMismatch.assumptionSetId} / ${versionMismatch.assumptionSetVersion})`}</p>
              <button className="btn btn-secondary mt-4" onClick={() => setVersionMismatch(null)} type="button">
                {copy.refreshAssumptionsLabel}
              </button>
            </div>
          ) : shareUrl ? (
            <div className="mt-4">
              <p className="text-caption">{copy.shareReady}</p>
              <label className="form-label mt-4">
                {copy.shareLinkLabel}
                <input className="form-input" readOnly value={shareUrl} />
              </label>
            </div>
          ) : (
            <p className="text-caption mt-4">{copy.resultConditional}</p>
          )}
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
