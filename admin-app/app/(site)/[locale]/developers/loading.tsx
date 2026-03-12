'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

function resolveCopy(locale: string) {
  if (locale === 'th') {
    return {
      title: 'ผู้พัฒนาโครงการ',
      subtitle: 'กำลังโหลดรายชื่อผู้พัฒนาที่เผยแพร่แล้วเพื่อใช้คัด shortlist และเช็กความน่าเชื่อถือของโครงการ',
      contact: 'คุยกับที่ปรึกษา',
      projects: 'ดูโครงการ',
      loading: 'กำลังเตรียมรายชื่อผู้พัฒนา',
    };
  }

  return {
    title: 'Developers',
    subtitle: 'Loading published developers so you can shortlist trusted brands before reviewing projects.',
    contact: 'Speak to an Advisor',
    projects: 'Browse Projects',
    loading: 'Loading published developers',
  };
}

export default function DevelopersLoading() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale === 'th' ? 'th' : 'en';
  const copy = resolveCopy(locale);
  const localePrefix = `/${locale}`;

  return (
    <main id="main-content" aria-busy="true">
      <section className="hero hero--page hero--advisory">
        <div className="container">
          <div className="public-hero">
            <div className="public-hero__content">
              <p className="public-hero__eyebrow">AMP Pattaya Advisory</p>
              <h1 className="headline public-hero__headline">{copy.title}</h1>
              <p className="subhead public-hero__subtitle">{copy.subtitle}</p>
              <div className="public-hero__actions cta-row">
                <Link className="btn btn-cta" href={`${localePrefix}/contact`}>
                  {copy.contact}
                </Link>
                <Link className="btn btn-secondary" href={`${localePrefix}/projects`}>
                  {copy.projects}
                </Link>
              </div>
            </div>
            <aside className="public-hero__rail">
              <article className="public-hero__signal">
                <div className="public-hero__signal-copy">
                  <p className="public-hero__signal-kicker">{copy.loading}</p>
                  <h2>{copy.title}</h2>
                  <p>{copy.subtitle}</p>
                </div>
              </article>
            </aside>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container animate-pulse">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="mb-4 h-32 w-full rounded-lg bg-slate-200" />
                <div className="mb-2 h-5 w-2/3 rounded bg-slate-200" />
                <div className="h-4 w-1/2 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
