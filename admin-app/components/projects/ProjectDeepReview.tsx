import Link from 'next/link';

import type { ProjectEvaluationResponse } from '@/app/_lib/public-api-server';
import { withLocale } from '@/app/_lib/i18n/routing';
import type { Dictionary } from '@/app/_lib/i18n/types';
import { getDictionary } from '@/app/_lib/i18n/get-dictionary';

type DeepReviewFallbackContext = {
  projectName: string;
  areaName?: string | null;
  developerName?: string | null;
  startingPriceLabel?: string | null;
  deliveryLabel?: string | null;
  hasDescription: boolean;
  hasLocationFacts: boolean;
  hasInvestmentFacts: boolean;
};

type NormalizedDeepReview = {
  verified_now: string[];
  gaps_to_confirm: string[];
  is_low_signal: boolean;
};

type DeepReviewCtaPlan = {
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
};

function riskScore(ev: ProjectEvaluationResponse): number {
  let score = 0;

  // Missing snapshots => higher risk.
  if (!ev.area_statistics) score += 50;
  if (ev.area_statistics && !ev.area_statistics.roi_percent) score += 15;
  if (ev.area_statistics && !ev.area_statistics.avg_price) score += 10;
  if (ev.area_statistics && !ev.area_statistics.avg_rent) score += 10;

  const badgeKeys = new Set(ev.badges.map((b) => b.key));
  if (!badgeKeys.has('has_cover_image')) score += 5;

  return Math.min(100, Math.max(0, score));
}

function uniqueLines(lines: string[]): string[] {
  return [...new Set(lines.map((line) => line.trim()).filter(Boolean))];
}

function isLowSignalState(
  ev: ProjectEvaluationResponse,
  verifiedSignals: string[],
  fallbackContext: DeepReviewFallbackContext,
): boolean {
  const hasSnapshotMetrics = Boolean(
    ev.area_statistics?.avg_price
    || ev.area_statistics?.avg_rent
    || ev.area_statistics?.roi_percent,
  );
  const hasCoverageBadges = ev.badges.some((badge) => (
    badge.key === 'roi_snapshot'
    || badge.key === 'area_stats_available'
    || badge.key === 'has_cover_image'
  ));
  const contextStrength = verifiedSignals.length
    + (fallbackContext.hasDescription ? 1 : 0)
    + (fallbackContext.hasLocationFacts ? 1 : 0)
    + (fallbackContext.hasInvestmentFacts ? 1 : 0);

  return !hasSnapshotMetrics && !hasCoverageBadges && contextStrength <= 4;
}

function localeSafeFallback(dict: Dictionary): string {
  return dict.deepReview.verifiedNow === 'ยืนยันได้ตอนนี้'
    ? 'หน้านี้ยังยึดกับข้อมูลโครงการที่ยืนยันได้จากเส้นทางสาธารณะ'
    : 'This page stays grounded in verified project context from the public route.';
}

function buildLowSignalGapLines(
  locale: 'en' | 'th',
  fallbackContext: DeepReviewFallbackContext,
): string[] {
  const areaLabel = fallbackContext.areaName ?? (locale === 'th' ? 'ทำเลของโครงการนี้' : 'this area');
  const developerLabel = fallbackContext.developerName ?? fallbackContext.projectName;

  return [
    locale === 'th'
      ? `ยืนยันดีมานด์เช่าและกลุ่มผู้ซื้อจริงใน ${areaLabel} ก่อนใช้โครงการนี้เป็นตัวแทนการตัดสินใจ`
      : `Confirm current rental demand and buyer fit around ${areaLabel} before using this project as decision evidence.`,
    locale === 'th'
      ? `ยืนยันยูนิตที่ยัง available และช่วงราคาที่ยังเปิดอยู่สำหรับ ${fallbackContext.projectName}`
      : `Confirm which unit mix and active availability still match ${fallbackContext.projectName}.`,
    locale === 'th'
      ? `ยืนยันสภาพคล่องการขายต่อและแรงซื้อรอบโครงการของ ${developerLabel}`
      : `Confirm resale liquidity and current buyer demand around ${developerLabel}.`,
    fallbackContext.deliveryLabel
      ? (locale === 'th'
        ? `ยืนยันว่ากำหนดส่งมอบที่เผยแพร่ (${fallbackContext.deliveryLabel}) ยังใช้ได้กับยูนิตที่คุณจะเปรียบเทียบ`
        : `Confirm whether the published delivery timing (${fallbackContext.deliveryLabel}) still holds for the units you would compare.`)
      : (locale === 'th'
        ? 'ยืนยันไทม์ไลน์ส่งมอบ เงื่อนไข handover และ inventory ล่าสุดก่อนลด shortlist ให้แคบลง'
        : 'Confirm delivery timing, handover assumptions, and near-term inventory changes before narrowing the shortlist.'),
  ];
}

function buildSnapshotGapLines(
  locale: 'en' | 'th',
  ev: ProjectEvaluationResponse,
  fallbackContext: DeepReviewFallbackContext,
): string[] {
  const keys = new Set(ev.badges.map((b) => b.key));

  const prompts: string[] = [];

  if (!keys.has('roi_snapshot')) {
    prompts.push(
      locale === 'th'
        ? `ยืนยันสมมติฐานรายได้เช่า ค่าใช้จ่ายถือครอง และผลตอบแทนสุทธิของ ${fallbackContext.projectName} อีกครั้งก่อนใช้เป็นข้อสรุปการลงทุน`
        : `Confirm rental-demand assumptions, holding costs, and net-return logic for ${fallbackContext.projectName} before treating returns as settled.`,
    );
  }

  if (!keys.has('area_stats_available')) {
    prompts.push(
      locale === 'th'
        ? `ยืนยัน comparable ล่าสุดใน ${fallbackContext.areaName ?? 'ทำเลของโครงการนี้'} เพื่ออ่านแรงซื้อและสภาพคล่องให้ใกล้เคียงตลาดจริง`
        : `Confirm recent comparables in ${fallbackContext.areaName ?? 'this area'} to read demand and liquidity against current market conditions.`,
    );
  }

  if (!keys.has('has_cover_image')) {
    prompts.push(
      locale === 'th'
        ? 'ขอภาพล่าสุด สภาพส่วนกลาง หรือการอัปเดตหน้างานก่อนนัดดูจริง'
        : 'Confirm the latest visuals, shared-area condition, or site updates before the viewing step.',
    );
  }

  if (!prompts.length) {
    prompts.push(
      locale === 'th'
        ? 'ใช้ snapshot ชุดนี้คู่กับ advisor review, quota check และเอกสารจริงก่อนตัดสินใจขั้นสุดท้าย'
        : 'Carry this live snapshot into advisor review, quota checks, and document review before making a final commitment.',
    );
  }

  return uniqueLines(prompts).slice(0, 4);
}

function buildMarketSnapshotLine(locale: 'en' | 'th', ev: ProjectEvaluationResponse): string | null {
  const marketBits: string[] = [];

  if (ev.area_statistics?.avg_price) {
    marketBits.push(
      locale === 'th'
        ? `ราคาเฉลี่ย ${ev.area_statistics.avg_price}`
        : `Avg price ${ev.area_statistics.avg_price}`,
    );
  }

  if (ev.area_statistics?.avg_rent) {
    marketBits.push(
      locale === 'th'
        ? `ค่าเช่าเฉลี่ย ${ev.area_statistics.avg_rent}`
        : `Avg rent ${ev.area_statistics.avg_rent}`,
    );
  }

  if (ev.area_statistics?.roi_percent) {
    marketBits.push(
      locale === 'th'
        ? `ROI ${ev.area_statistics.roi_percent}`
        : `ROI ${ev.area_statistics.roi_percent}`,
    );
  }

  if (!marketBits.length) return null;

  return locale === 'th'
    ? `ภาพตลาดล่าสุด: ${marketBits.join(' • ')}`
    : `Market snapshot: ${marketBits.join(' • ')}`;
}

function buildCoverageSignal(locale: 'en' | 'th', ev: ProjectEvaluationResponse): string | null {
  const keys = new Set(ev.badges.map((badge) => badge.key));

  if (keys.has('has_cover_image')) {
    return locale === 'th'
      ? 'มีภาพล่าสุดหรือสัญญาณ visual ของโครงการให้ใช้ประกอบการตัดสินใจ'
      : 'Recent project visuals are available for decision support.';
  }

  if (keys.has('area_stats_available') || keys.has('roi_snapshot')) {
    return locale === 'th'
      ? 'มี snapshot ของตลาดหรือผลตอบแทนให้ใช้เป็นบริบทเปรียบเทียบ'
      : 'Area or return snapshots are available for comparison context.';
  }

  return null;
}

function normalizeDeepReview(
  locale: 'en' | 'th',
  ev: ProjectEvaluationResponse,
  dict: Dictionary,
  verifiedSignals: string[],
  fallbackContext: DeepReviewFallbackContext,
): NormalizedDeepReview {
  const isLowSignal = isLowSignalState(ev, verifiedSignals, fallbackContext);

  const verified: string[] = [...verifiedSignals];
  const marketSnapshot = buildMarketSnapshotLine(locale, ev);
  const coverageSignal = buildCoverageSignal(locale, ev);

  if (marketSnapshot) verified.push(marketSnapshot);
  else if (coverageSignal) verified.push(coverageSignal);
  if (!verified.length) verified.push(localeSafeFallback(dict));

  const gaps = isLowSignal
    ? buildLowSignalGapLines(locale, fallbackContext)
    : buildSnapshotGapLines(locale, ev, fallbackContext);

  return {
    verified_now: uniqueLines(verified).slice(0, 5),
    gaps_to_confirm: uniqueLines(gaps).slice(0, 4),
    is_low_signal: isLowSignal,
  };
}

export function ProjectDeepReview({
  locale,
  evaluation,
  verifiedSignals = [],
  fallbackContext,
  buyerFitSignals,
  ctaPlan,
}: {
  locale: 'en' | 'th';
  evaluation: ProjectEvaluationResponse;
  verifiedSignals?: string[];
  fallbackContext: DeepReviewFallbackContext;
  buyerFitSignals: string[];
  ctaPlan: DeepReviewCtaPlan;
}) {
  const dict = getDictionary(locale);
  const normalized = normalizeDeepReview(locale, evaluation, dict, verifiedSignals, fallbackContext);
  const score = riskScore(evaluation);

  const invLines: string[] = [];
  if (evaluation.area_statistics?.avg_price) invLines.push(`${dict.deepReview.avgPriceSnapshot}: ${evaluation.area_statistics.avg_price}`);
  if (evaluation.area_statistics?.avg_rent) invLines.push(`${dict.deepReview.avgRentSnapshot}: ${evaluation.area_statistics.avg_rent}`);
  if (evaluation.area_statistics?.roi_percent) invLines.push(`${dict.deepReview.roiPercentSnapshot}: ${evaluation.area_statistics.roi_percent}`);
  if (evaluation.area_statistics?.as_of) invLines.push(`${dict.deepReview.asOfLabel}: ${evaluation.area_statistics.as_of}`);
  if (!invLines.length) invLines.push(dict.deepReview.noSnapshots);

  const snapshotExplanation = [
    evaluation.area_statistics?.roi_percent
      ? (locale === 'th'
        ? `ค่า ROI ที่เห็นตอนนี้เป็นภาพอ่านจากข้อมูลที่เผยแพร่ในปัจจุบัน ไม่ใช่คำรับประกันผลตอบแทนของโครงการ ${evaluation.project.name}`
          : `The current ROI snapshot is a read of published data in the system, not a promised return for ${evaluation.project.name}.`)
      : (locale === 'th'
        ? 'ถ้ายังไม่มีค่า ROI ให้ใช้บล็อกนี้เพื่อเช็กว่าควรตั้งคำถามอะไรต่อ มากกว่าจะสรุปผลการลงทุนทันที'
          : 'If ROI is still missing, use this block to frame the next questions rather than force an investment conclusion.'),
    evaluation.area_statistics?.avg_price || evaluation.area_statistics?.avg_rent
      ? (locale === 'th'
        ? 'ตัวเลขราคาและค่าเช่าในบล็อกนี้เหมาะกับการเทียบทางเลือกแบบวางคู่กัน มากกว่าการใช้เป็นตัวเลขคาดการณ์ล่วงหน้า'
          : 'The price and rent figures here work best as side-by-side comparison context, not as forward-looking projections.')
      : (locale === 'th'
        ? 'เมื่อราคาและค่าเช่ายังไม่ครบ ให้ถือว่าบล็อกนี้อยู่ในโหมดระมัดระวัง และควรอ่านควบคู่กับหน้าเปรียบเทียบหรือบริบทของทำเล'
          : 'When price and rent data are incomplete, treat this block as conservative context and read it together with compare or area signals.'),
    evaluation.area_statistics?.as_of
      ? (locale === 'th'
        ? `ข้อมูลชุดนี้อิงข้อมูล ณ ${evaluation.area_statistics.as_of} จึงควรใช้เป็นภาพ ณ เวลานั้น ไม่ใช่การันตีว่าตลาดจะเคลื่อนไปทางเดิม`
          : `This snapshot is anchored to ${evaluation.area_statistics.as_of}, so use it as point-in-time evidence rather than assuming the market will keep moving the same way.`)
      : (locale === 'th'
        ? 'หากไม่มีวันที่อัปเดตชัดเจน ให้ยกระดับไปคุยกับทีมตามเส้นทางเดิมก่อนใช้เป็นฐานตัดสินใจขั้นสุดท้าย'
          : 'If the update date is unclear, escalate through the existing advisor path before treating it as final-decision evidence.'),
  ];

  const riskLabel = score >= 70 ? dict.compare.riskHigh : score >= 35 ? dict.compare.riskMedium : dict.compare.riskLow;

  return (
    <section className="section section--alt project-deep-review-section">
      <div className="section-header project-deep-review-header">
        <h2 className="section-title">{dict.deepReview.title}</h2>
        <p className="section-subtitle">{dict.deepReview.subtitle}</p>
      </div>

      <div className="grid grid-3 project-deep-review-grid">
        <div className="card reveal project-deep-review-card project-deep-review-card--verified">
          <h3 className="card-title">{dict.deepReview.verifiedNow}</h3>
          <ul className="bullet-list mt-3" aria-label={dict.deepReview.verifiedNow}>
            {normalized.verified_now.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        <div className="card reveal project-deep-review-card project-deep-review-card--gaps">
          <h3 className="card-title">{dict.deepReview.gapsToConfirm}</h3>
          <ul className="bullet-list mt-3" aria-label={dict.deepReview.gapsToConfirm}>
            {normalized.gaps_to_confirm.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        <div className="card reveal project-deep-review-card project-deep-review-card--risk">
          <h3 className="card-title">{dict.deepReview.riskScore}</h3>
          <p className="card-subtitle">{dict.deepReview.riskExplain}</p>
          <div className="mt-3 font-bold text-xl project-deep-review-risk-score">{score}/100 ({riskLabel})</div>
        </div>
      </div>

      <div className="card reveal mt-4 project-deep-review-summary-card">
        <h3 className="card-title">{dict.deepReview.investTitle}</h3>
        <p className="card-subtitle">{dict.deepReview.investSubtitle}</p>
        <ul className="bullet-list mt-3">
          {invLines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>

        <div className="insight-list mt-4 project-deep-review-summary-list" aria-label={locale === 'th' ? 'วิธีอ่านข้อมูลชุดนี้' : 'How to read this snapshot'}>
          {snapshotExplanation.map((line) => (
            <div key={line} className="insight-list__item">
              <span className="insight-list__body">{line}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 project-deep-review-fit-block">
          <h4 className="card-title">{locale === 'th' ? 'เหมาะกับผู้ซื้อแบบไหน' : 'Best fit for this page'}</h4>
          <p className="card-subtitle">
            {locale === 'th'
              ? 'ใช้ส่วนนี้เพื่อเช็กว่าโครงการนี้ควรถูกส่งต่อไปยังการเปรียบเทียบ การคุยกับทีม หรือการคัดรายการแบบไหน'
              : 'Use this layer to judge which buyer situation this project page helps move forward fastest.'}
          </p>
          <ul className="bullet-list mt-3" aria-label={locale === 'th' ? 'เหมาะกับผู้ซื้อแบบไหน' : 'Best fit for this page'}>
            {buyerFitSignals.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4 project-deep-review-handoff">
          <h4 className="card-title">{ctaPlan.title}</h4>
          <p className="card-subtitle">{ctaPlan.body}</p>
        </div>

        <div className="cta-row mt-3 project-deep-review-actions">
          <Link className="btn btn-cta" href={ctaPlan.primaryHref}>
            {ctaPlan.primaryLabel}
          </Link>
          <Link className="btn btn-secondary" href={ctaPlan.secondaryHref}>
            {ctaPlan.secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
