import Link from 'next/link';

import type { ProjectEvaluationResponse } from '@/app/_lib/public-api-server';
import { withLocale } from '@/app/_lib/i18n/routing';

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

function prosCons(ev: ProjectEvaluationResponse): { pros: string[]; cons: string[] } {
  const keys = new Set(ev.badges.map((b) => b.key));

  const pros: string[] = [];
  const cons: string[] = [];

  if (keys.has('roi_snapshot')) pros.push('ROI snapshot available');
  else cons.push('ROI snapshot missing');

  if (keys.has('area_stats_available')) pros.push('Area statistics snapshot available');
  else cons.push('Area statistics snapshot missing');

  if (keys.has('has_cover_image')) pros.push('Cover image available');
  else cons.push('Cover image missing');

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
  const { pros, cons } = prosCons(evaluation);
  const score = riskScore(evaluation);

  const invLines: string[] = [];
  if (evaluation.area_statistics?.avg_price) invLines.push(`avg_price snapshot: ${evaluation.area_statistics.avg_price}`);
  if (evaluation.area_statistics?.avg_rent) invLines.push(`avg_rent snapshot: ${evaluation.area_statistics.avg_rent}`);
  if (evaluation.area_statistics?.roi_percent) invLines.push(`roi_percent snapshot: ${evaluation.area_statistics.roi_percent}`);
  if (evaluation.area_statistics?.as_of) invLines.push(`as_of: ${evaluation.area_statistics.as_of}`);
  if (!invLines.length) invLines.push(locale === 'th' ? 'ยังไม่มี snapshot' : 'No snapshots available yet.');

  const riskLabel = score >= 70 ? 'High' : score >= 35 ? 'Medium' : 'Low';

  return (
    <section className="section section--alt">
      <div className="section-header">
        <h2 className="section-title">{locale === 'th' ? 'Deep review' : 'Deep review'}</h2>
        <p className="section-subtitle">
          {locale === 'th'
            ? 'สรุปแบบ conservative จากข้อมูล snapshot ที่มี (ไม่ใช่คำรับประกันผลตอบแทน)'
            : 'Conservative summary from available snapshots (not a guarantee of returns).'}
        </p>
      </div>

      <div className="grid grid-3">
        <div className="card reveal">
          <h3 className="card-title">{locale === 'th' ? 'Pros' : 'Pros'}</h3>
          <ul className="bullet-list" style={{ marginTop: 12 }}>
            {pros.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        <div className="card reveal">
          <h3 className="card-title">{locale === 'th' ? 'Cons' : 'Cons'}</h3>
          <ul className="bullet-list" style={{ marginTop: 12 }}>
            {cons.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        <div className="card reveal">
          <h3 className="card-title">{locale === 'th' ? 'Risk score' : 'Risk score'}</h3>
          <p className="card-subtitle">
            {locale === 'th' ? 'ยิ่งสูง = ข้อมูลจำกัด/ความไม่แน่นอนมากขึ้น' : 'Higher = more uncertainty / less data.'}
          </p>
          <div style={{ marginTop: 12, fontWeight: 700, fontSize: 20 }}>{score}/100 ({riskLabel})</div>
        </div>
      </div>

      <div className="card reveal" style={{ marginTop: 16 }}>
        <h3 className="card-title">{locale === 'th' ? 'Investment analysis (snapshot)' : 'Investment analysis (snapshot)'}</h3>
        <p className="card-subtitle">
          {locale === 'th'
            ? 'แสดงเฉพาะข้อมูลที่มีในระบบ ณ ตอนนี้'
            : 'Shows only the data currently available in the system.'}
        </p>
        <ul className="bullet-list" style={{ marginTop: 12 }}>
          {invLines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>

        <div className="cta-row" style={{ marginTop: 12 }}>
          <Link className="btn btn-cta" href={withLocale(locale, '/contact?topic=investment_plan')}>
            {locale === 'th' ? 'ขอแผนการลงทุน' : 'Get Investment Plan'}
          </Link>
          <Link className="btn btn-secondary" href={withLocale(locale, '/compare')}>
            {locale === 'th' ? 'ไปหน้า Compare' : 'Go to Compare'}
          </Link>
        </div>
      </div>
    </section>
  );
}
