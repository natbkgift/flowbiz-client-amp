import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/layout/Container';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale } from '@/app/_lib/i18n/routing';
import { fetchProjectEvaluation, type ProjectEvaluationResponse } from '@/app/_lib/public-api-server';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const canonical = `/${locale}/compare`;
  return {
    title: `${dict.brand.name} | Compare`,
    description: 'Compare 2–3 projects side by side (read-only).',
    alternates: {
      canonical,
      languages: {
        en: '/en/compare',
        th: '/th/compare',
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${dict.brand.name} | Compare`,
      description: 'Compare 2–3 projects side by side (read-only).',
      siteName: dict.brand.name,
      locale: locale === 'th' ? 'th_TH' : 'en_US',
    },
  };
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

function riskLevel(ev: ProjectEvaluationResponse): string {
  const roi = ev.area_statistics?.roi_percent;
  const avgPrice = ev.area_statistics?.avg_price;
  const avgRent = ev.area_statistics?.avg_rent;

  if (roi) return 'Low';
  if (avgPrice || avgRent) return 'Medium';
  return 'High';
}

function strengths(ev: ProjectEvaluationResponse): string[] {
  const keys = new Set(ev.badges.map((b) => b.key));
  const out: string[] = [];
  if (keys.has('roi_snapshot')) out.push('ROI snapshot available');
  if (keys.has('area_stats_available')) out.push('Area statistics available');
  if (keys.has('has_cover_image')) out.push('Cover image available');
  if (!out.length) out.push('Limited snapshot data');
  return out;
}

function weaknesses(ev: ProjectEvaluationResponse): string[] {
  const keys = new Set(ev.badges.map((b) => b.key));
  const out: string[] = [];
  if (!keys.has('area_stats_available')) out.push('Area statistics missing');
  if (!keys.has('roi_snapshot')) out.push('ROI snapshot missing');
  if (!keys.has('has_cover_image')) out.push('Cover image missing');
  if (!out.length) out.push('—');
  return out;
}

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const locale = normalizeLocale(params.locale);

  const rawIds = pickParam(searchParams?.ids);
  const ids = parseIds(rawIds);

  if (ids.length < 2) {
    return (
      <main id="main-content">
        <section className="hero hero--page">
          <Container>
            <h1 className="headline">{locale === 'th' ? 'เปรียบเทียบโครงการ' : 'Compare Projects'}</h1>
            <p className="subhead">
              {locale === 'th'
                ? 'ต้องมีอย่างน้อย 2 โครงการ เช่น /compare?ids=&lt;id1&gt;,&lt;id2&gt;'
                : 'Requires at least 2 projects, e.g. /compare?ids=<id1>,<id2>'}
            </p>
          </Container>
        </section>

        <section className="section">
          <Container>
            <div className="card reveal">
              <h2 className="card-title">{locale === 'th' ? 'เริ่มต้น' : 'Get started'}</h2>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'ไปหน้า Smart Finder เพื่อเลือก top projects แล้วกด Compare'
                  : 'Use Smart Finder to generate top projects and click Compare.'}
              </p>
              <div className="cta-row">
                <Link className="btn btn-cta" href={withLocale(locale, '/smart-finder')}>
                  {locale === 'th' ? 'ไป Smart Finder' : 'Go to Smart Finder'}
                </Link>
                <Link className="btn btn-secondary" href={withLocale(locale, '/projects')}>
                  {locale === 'th' ? 'ดู Projects' : 'Browse Projects'}
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
          <h1 className="headline">{locale === 'th' ? 'เปรียบเทียบโครงการ' : 'Compare Projects'}</h1>
          <p className="subhead">
            {locale === 'th'
              ? 'ตารางนี้อ่านอย่างเดียว และอ้างอิงจาก dataset ปัจจุบัน'
              : 'Read-only table based on current dataset snapshots.'}
          </p>
        </Container>
      </section>

      <section className="section">
        <Container>
          {missing.length ? (
            <div className="trust-box" style={{ marginBottom: 16 }}>
              <h2 className="trust-box__title">{locale === 'th' ? 'บางโครงการไม่พบ' : 'Some projects not found'}</h2>
              <p className="section-subtitle">ids: {missing.join(', ')}</p>
            </div>
          ) : null}

          <div className="card reveal">
            <h2 className="card-title">{locale === 'th' ? 'ตารางเปรียบเทียบ' : 'Comparison table'}</h2>
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>{locale === 'th' ? 'หัวข้อ' : 'Field'}</th>
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
                    <td>{locale === 'th' ? 'Price range' : 'Price range'}</td>
                    {items.map((ev) => (
                      <td key={ev.project.id + ':price'}>{ev.area_statistics?.avg_price ?? '—'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>{locale === 'th' ? 'Expected yield' : 'Expected yield'}</td>
                    {items.map((ev) => (
                      <td key={ev.project.id + ':yield'}>{ev.area_statistics?.roi_percent ?? '—'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>{locale === 'th' ? 'Completion year' : 'Completion year'}</td>
                    {items.map((ev) => (
                      <td key={ev.project.id + ':completion'}>—</td>
                    ))}
                  </tr>
                  <tr>
                    <td>{locale === 'th' ? 'Strength' : 'Strength'}</td>
                    {items.map((ev) => (
                      <td key={ev.project.id + ':strength'}>
                        <ul className="bullet-list">
                          {strengths(ev).map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>{locale === 'th' ? 'Weakness' : 'Weakness'}</td>
                    {items.map((ev) => (
                      <td key={ev.project.id + ':weakness'}>
                        <ul className="bullet-list">
                          {weaknesses(ev).map((w) => (
                            <li key={w}>{w}</li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>{locale === 'th' ? 'Risk level' : 'Risk level'}</td>
                    {items.map((ev) => (
                      <td key={ev.project.id + ':risk'}>{riskLevel(ev)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="cta-row" style={{ marginTop: 16 }}>
              <Link className="btn btn-secondary" href={withLocale(locale, '/smart-finder')}>
                {locale === 'th' ? 'กลับไป Smart Finder' : 'Back to Smart Finder'}
              </Link>
              <Link className="btn btn-cta" href={withLocale(locale, '/contact?topic=investment_plan')}>
                {locale === 'th' ? 'ขอแผนการลงทุน' : 'Get Investment Plan'}
              </Link>
            </div>

            <p className="guided-dialog__step" style={{ marginTop: 10 }}>
              {locale === 'th'
                ? 'หมายเหตุ: completion year ยังไม่มีใน dataset (แสดงเป็น —)'
                : 'Note: completion year is not yet in the dataset (shown as —).'}
            </p>
          </div>
        </Container>
      </section>
    </main>
  );
}
