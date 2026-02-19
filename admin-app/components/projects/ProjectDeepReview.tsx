import Link from 'next/link';

import type { ProjectEvaluationResponse } from '@/app/_lib/public-api-server';
import { withLocale } from '@/app/_lib/i18n/routing';
import type { Dictionary } from '@/app/_lib/i18n/types';
import { getDictionary } from '@/app/_lib/i18n/get-dictionary';

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

function prosCons(ev: ProjectEvaluationResponse, dict: Dictionary): { pros: string[]; cons: string[] } {
  const keys = new Set(ev.badges.map((b) => b.key));

  const pros: string[] = [];
  const cons: string[] = [];

  if (keys.has('roi_snapshot')) pros.push(dict.compare.roiAvailable);
  else cons.push(dict.compare.roiMissing);

  if (keys.has('area_stats_available')) pros.push(dict.compare.areaStatsAvailable);
  else cons.push(dict.compare.areaStatsMissing);

  if (keys.has('has_cover_image')) pros.push(dict.compare.coverImageAvailable);
  else cons.push(dict.compare.coverImageMissing);

  // Keep output deterministic even if all are present.
  if (!cons.length) cons.push('—');

  return { pros, cons };
}

export function ProjectDeepReview({
  locale,
  evaluation,
}: {
  locale: 'en' | 'th';
  evaluation: ProjectEvaluationResponse;
}) {
  const dict = getDictionary(locale);
  const { pros, cons } = prosCons(evaluation, dict);
  const score = riskScore(evaluation);

  const invLines: string[] = [];
  if (evaluation.area_statistics?.avg_price) invLines.push(`${dict.deepReview.avgPriceSnapshot}: ${evaluation.area_statistics.avg_price}`);
  if (evaluation.area_statistics?.avg_rent) invLines.push(`${dict.deepReview.avgRentSnapshot}: ${evaluation.area_statistics.avg_rent}`);
  if (evaluation.area_statistics?.roi_percent) invLines.push(`${dict.deepReview.roiPercentSnapshot}: ${evaluation.area_statistics.roi_percent}`);
  if (evaluation.area_statistics?.as_of) invLines.push(`${dict.deepReview.asOfLabel}: ${evaluation.area_statistics.as_of}`);
  if (!invLines.length) invLines.push(dict.deepReview.noSnapshots);

  const riskLabel = score >= 70 ? dict.compare.riskHigh : score >= 35 ? dict.compare.riskMedium : dict.compare.riskLow;

  return (
    <section className="section section--alt">
      <div className="section-header">
        <h2 className="section-title">{dict.deepReview.title}</h2>
        <p className="section-subtitle">{dict.deepReview.subtitle}</p>
      </div>

      <div className="grid grid-3">
        <div className="card reveal">
          <h3 className="card-title">{dict.deepReview.pros}</h3>
          <ul className="bullet-list mt-3">
            {pros.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        <div className="card reveal">
          <h3 className="card-title">{dict.deepReview.cons}</h3>
          <ul className="bullet-list mt-3">
            {cons.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        <div className="card reveal">
          <h3 className="card-title">{dict.deepReview.riskScore}</h3>
          <p className="card-subtitle">{dict.deepReview.riskExplain}</p>
          <div className="mt-3 font-bold text-xl">{score}/100 ({riskLabel})</div>
        </div>
      </div>

      <div className="card reveal mt-4">
        <h3 className="card-title">{dict.deepReview.investTitle}</h3>
        <p className="card-subtitle">{dict.deepReview.investSubtitle}</p>
        <ul className="bullet-list mt-3">
          {invLines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>

        <div className="cta-row mt-3">
          <Link className="btn btn-cta" href={withLocale(locale, '/contact?topic=investment_plan')}>
            {dict.deepReview.getInvestmentPlan}
          </Link>
          <Link className="btn btn-secondary" href={withLocale(locale, '/compare')}>
            {dict.deepReview.goToCompare}
          </Link>
        </div>
      </div>
    </section>
  );
}
