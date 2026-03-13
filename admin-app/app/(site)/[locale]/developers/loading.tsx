'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

function resolveCopy(locale: string) {
  if (locale === 'th') {
    return {
      title: 'ผู้พัฒนาโครงการ',
      subtitle: 'รายชื่อผู้พัฒนาที่เผยแพร่แล้วเพื่อใช้คัด shortlist และเช็กความน่าเชื่อถือของโครงการ',
      contact: 'คุยกับที่ปรึกษา',
      projects: 'ดูโครงการ',
      loading: 'AMP Developer View',
      sampleTitle: 'ผู้พัฒนาที่ควรจับตา',
      sampleBody: 'ใช้ section นี้เพื่อเทียบความน่าเชื่อถือของผู้พัฒนาก่อนลงลึกในแต่ละโครงการ',
      signalOne: 'รายชื่อผู้พัฒนาที่เผยแพร่และพร้อมให้ review',
      signalTwo: 'ข้อมูลที่จะพาไปต่อยัง shortlist ของโครงการ',
      signalThree: 'ทีมยังช่วยคัด developer shortlist ให้ได้ตาม brief ของคุณ',
    };
  }

  return {
    title: 'Developers',
    subtitle: 'Published developers you can use to shortlist trusted brands before reviewing projects.',
    contact: 'Speak to an Advisor',
    projects: 'Browse Projects',
    loading: 'AMP Developer View',
    sampleTitle: 'Developers worth watching',
    sampleBody: 'Use this section to compare developer credibility before moving deeper into individual projects.',
    signalOne: 'Published developers ready for review',
    signalTwo: 'Context that moves into a project shortlist',
    signalThree: 'The team can still curate the developer shortlist from your brief',
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
          <div className="section-header mb-6">
            <h2 className="section-title">{copy.sampleTitle}</h2>
            <p className="section-subtitle">{copy.sampleBody}</p>
          </div>
          <div className="grid grid-3">
            {[copy.signalOne, copy.signalTwo, copy.signalThree].map((item) => (
              <article key={item} className="card catalogue-card">
                <div className="catalogue-card__eyebrow">{copy.loading}</div>
                <div className="h-5 w-2/3 rounded bg-slate-200" />
                <p className="card-subtitle">{item}</p>
                <div className="catalogue-card__meta">
                  <span>{copy.sampleBody}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
