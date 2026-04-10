'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

function resolveCopy(locale: string) {
  if (locale === 'th') {
    return {
      title: 'ภาพรวมทำเล',
      subtitle: 'บริบทของพื้นที่ สัญญาณราคา และเส้นทางถัดไปสำหรับการเลือกทำเลอย่างมั่นใจ',
      contact: 'คุยกับที่ปรึกษา',
      finder: 'ใช้ตัวช่วยคัดตัวเลือก',
      loading: 'ภาพรวมทำเลจาก AMP',
    };
  }

  return {
    title: 'Area Overview',
    subtitle: 'Area context, pricing signals, and the next advisory path for this neighborhood.',
    contact: 'Speak to an Advisor',
    finder: 'Use Smart Finder',
    loading: 'AMP Area View',
  };
}

export default function AreaLoading() {
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
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-3 h-5 w-2/3 rounded bg-slate-200" />
                <div className="mb-2 h-4 w-full rounded bg-slate-200" />
                <div className="h-4 w-4/5 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
