'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

function resolveCopy(locale: string) {
  if (locale === 'th') {
    return {
      title: 'กำลังเตรียมข้อมูลอสังหาฯ รายการนี้',
      subtitle: 'เรากำลังดึงภาพรวม ราคา และบริบทของรายการนี้เพื่อให้คุณตัดสินใจต่อได้เร็วขึ้น',
      contact: 'คุยกับที่ปรึกษา',
      inventory: 'ดูคลังรายการ',
      loading: 'กำลังโหลด snapshot ของรายการ',
    };
  }

  return {
    title: 'Preparing this listing snapshot',
    subtitle: 'We are loading the key facts, pricing, and context for this listing so you can decide on the next step quickly.',
    contact: 'Speak to an Advisor',
    inventory: 'Browse Inventory',
    loading: 'Loading listing snapshot',
  };
}

export default function PropertyDetailLoading() {
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
                <Link className="btn btn-secondary" href={`${localePrefix}/buy`}>
                  {copy.inventory}
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
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.82fr)]">
            <div className="space-y-6">
              <div className="h-56 w-full rounded-xl bg-slate-200" />
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-4 h-8 w-3/5 rounded bg-slate-200" />
                <div className="mb-3 h-4 w-full rounded bg-slate-200" />
                <div className="mb-3 h-4 w-5/6 rounded bg-slate-200" />
                <div className="h-4 w-4/6 rounded bg-slate-200" />
              </div>
              <div className="grid gap-6 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="mb-3 h-5 w-2/3 rounded bg-slate-200" />
                    <div className="h-4 w-1/2 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-3 h-6 w-1/2 rounded bg-slate-200" />
                <div className="mb-3 h-10 w-full rounded bg-slate-200" />
                <div className="h-10 w-full rounded bg-slate-200" />
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-3 h-5 w-2/3 rounded bg-slate-200" />
                <div className="mb-2 h-4 w-full rounded bg-slate-200" />
                <div className="h-4 w-4/5 rounded bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
