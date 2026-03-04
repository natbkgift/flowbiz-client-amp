import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import type { Dictionary } from '@/app/_lib/i18n/types';
import { fetchProjectEvaluation, type ProjectEvaluationResponse } from '@/app/_lib/public-api-server';

export const revalidate = 300;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'compare', dict.compare.title, dict.compare.metaDescription, dict.brand.name);
}

function pickParam(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return null;
}

function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Preserve input order but de-dupe deterministically.
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }

  return out.slice(0, 3);
}

function riskLevel(ev: ProjectEvaluationResponse, dict: Dictionary): string {
  const roi = ev.area_statistics?.roi_percent;
  const avgPrice = ev.area_statistics?.avg_price;
  const avgRent = ev.area_statistics?.avg_rent;

  if (roi) return dict.compare.riskLow;
  if (avgPrice || avgRent) return dict.compare.riskMedium;
  return dict.compare.riskHigh;
}

function strengths(ev: ProjectEvaluationResponse, dict: Dictionary): string[] {
  const keys = new Set(ev.badges.map((b) => b.key));
  const out: string[] = [];
  if (keys.has('roi_snapshot')) out.push(dict.compare.roiAvailable);
  if (keys.has('area_stats_available')) out.push(dict.compare.areaStatsAvailable);
  if (keys.has('has_cover_image')) out.push(dict.compare.coverImageAvailable);
  if (!out.length) out.push(dict.compare.limitedData);
  return out;
}

function weaknesses(ev: ProjectEvaluationResponse, dict: Dictionary): string[] {
  const keys = new Set(ev.badges.map((b) => b.key));
  const out: string[] = [];
  if (!keys.has('area_stats_available')) out.push(dict.compare.areaStatsMissing);
  if (!keys.has('roi_snapshot')) out.push(dict.compare.roiMissing);
  if (!keys.has('has_cover_image')) out.push(dict.compare.coverImageMissing);
  if (!out.length) out.push('—');
  return out;
}

export default async function ComparePage(
  props: {
    params: Promise<{ locale: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

  const rawIds = pickParam(searchParams?.ids);
  const ids = parseIds(rawIds);

  if (ids.length < 2) {
    return (
      <main id="main-content">
        <section className="hero hero--page">
          <Container>
            <h1 className="headline">{dict.compare.title}</h1>
            <p className="subhead">
              {dict.compare.requiresTwo}
            </p>
          </Container>
        </section>

        <section className="section">
          <Container>
            <div className="card reveal">
              <h2 className="card-title">{dict.compare.getStarted}</h2>
              <p className="card-subtitle">
                {dict.compare.getStartedDesc}
              </p>
              <div className="cta-row">
                <Link className="btn btn-cta" href={withLocale(locale, '/smart-finder')}>
                  {dict.compare.goToSmartFinder}
                </Link>
                <Link className="btn btn-secondary" href={withLocale(locale, '/projects')}>
                  {dict.compare.browseProjects}
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>
    );
  }

  const evals = await Promise.all(ids.map((id) => fetchProjectEvaluation(id)));
  const missing = ids.filter((_, idx) => evals[idx] == null);
  const items = evals.filter(Boolean) as ProjectEvaluationResponse[];

  return (
    <main id="main-content">
      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{dict.compare.title}</h1>
          <p className="subhead">
            {dict.compare.readOnlyDesc}
          </p>
        </Container>
      </section>

      <section className="section">
        <Container>
          {missing.length ? (
            <div className="trust-box mb-4">
              <h2 className="trust-box__title">{dict.compare.someNotFound}</h2>
              <p className="section-subtitle">ids: {missing.join(', ')}</p>
            </div>
          ) : null}

          <div className="card reveal">
            <h2 className="card-title">{dict.compare.comparisonTable}</h2>
            <div className="overflow-x-auto mt-3">
              <table className="compare-table" aria-label={dict.compare.comparisonTable}>
                <caption className="sr-only">{dict.compare.comparisonTable}</caption>
                <thead>
                  <tr>
                    <th>{dict.compare.field}</th>
                    {items.map((ev) => (
                      <th key={ev.project.id}>
                        <Link href={withLocale(locale, `/projects/${encodeURIComponent(ev.project.slug)}`)}>
                          {ev.project.name}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{dict.compare.priceRange}</td>
                    {items.map((ev) => (
                      <td key={ev.project.id + ':price'}>{ev.area_statistics?.avg_price ?? '—'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>{dict.compare.expectedYield}</td>
                    {items.map((ev) => (
                      <td key={ev.project.id + ':yield'}>{ev.area_statistics?.roi_percent ?? '—'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>{dict.compare.completionYear}</td>
                    {items.map((ev) => (
                      <td key={ev.project.id + ':completion'}>—</td>
                    ))}
                  </tr>
                  <tr>
                    <td>{dict.compare.strength}</td>
                    {items.map((ev) => (
                      <td key={ev.project.id + ':strength'}>
                        <ul className="bullet-list">
                          {strengths(ev, dict).map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>{dict.compare.weakness}</td>
                    {items.map((ev) => (
                      <td key={ev.project.id + ':weakness'}>
                        <ul className="bullet-list">
                          {weaknesses(ev, dict).map((w) => (
                            <li key={w}>{w}</li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>{dict.compare.riskLevel}</td>
                    {items.map((ev) => (
                      <td key={ev.project.id + ':risk'}>{riskLevel(ev, dict)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="cta-row mt-4">
              <Link className="btn btn-secondary" href={withLocale(locale, '/smart-finder')}>
                {dict.compare.backToSmartFinder}
              </Link>
              <Link className="btn btn-cta" href={withLocale(locale, '/contact?topic=investment_plan')}>
                {dict.compare.getInvestmentPlan}
              </Link>
            </div>

            <p className="guided-dialog__step mt-2.5">
              {dict.compare.completionNote}
            </p>
          </div>
        </Container>
      </section>
    </main>
  );
}

