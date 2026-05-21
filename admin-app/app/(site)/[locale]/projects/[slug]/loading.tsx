'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

function resolveCopy(locale: string) {
  if (locale === 'th') {
    return {
      title: 'มุมมองโครงการ',
      subtitle: 'บริบทของโครงการ สัญญาณสำหรับรายการคัดไว้ และเส้นทางถัดไปจากทีมที่ปรึกษา',
      contact: 'คุยกับที่ปรึกษา',
      finder: 'ใช้ตัวช่วยคัดตัวเลือก',
      loading: 'AMP Project View',
    };
  }

  return {
    title: 'Project Perspective',
    subtitle: 'Project context, shortlist signals, and the next advisory path.',
    contact: 'Speak to an Advisor',
    finder: 'Use Smart Finder',
    loading: 'AMP Project View',
  };
}

export default function ProjectDetailLoading() {
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
              <p className="headline public-hero__headline" aria-hidden="true">{copy.title}</p>
              <p className="subhead public-hero__subtitle">{copy.subtitle}</p>
              <div className="public-hero__actions cta-row">
                <Link className="btn btn-cta" href={`${localePrefix}/contact`}>
                  {copy.contact}
                </Link>
                <Link className="btn btn-secondary" href={`${localePrefix}/smart-finder`}>
                  {copy.finder}
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
          <div className="mb-6 h-48 w-full rounded-xl bg-slate-200" />
          <div className="mb-4 h-8 w-2/3 rounded bg-slate-200" />
          <div className="mb-6 h-4 w-1/2 rounded bg-slate-200" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-3 h-5 w-2/3 rounded bg-slate-200" />
                <div className="mb-2 h-4 w-full rounded bg-slate-200" />
                <div className="h-4 w-5/6 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
