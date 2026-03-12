'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

function resolveCopy(locale: string) {
  if (locale === 'th') {
    return {
      title: 'โครงการ',
      subtitle: 'กำลังโหลดคลังโครงการที่เผยแพร่แล้วสำหรับ shortlist และการเปรียบเทียบ',
      contact: 'คุยกับที่ปรึกษา',
      finder: 'ใช้ Smart Finder',
      loading: 'กำลังเตรียมรายการโครงการ',
      sampleTitle: 'กำลังรวบรวม shortlist เริ่มต้น',
      sampleBody: 'ระบบกำลังดึงโครงการที่เผยแพร่แล้วและเรียงลำดับให้เหมาะกับการเปรียบเทียบต่อ',
      signalOne: 'โครงการที่มีข้อมูลพร้อมสำหรับ review',
      signalTwo: 'รายละเอียดที่จะพาไป compare หรือ consultation ต่อได้',
      signalThree: 'หากโหลดช้า ยังสามารถคุยกับทีมเพื่อขอ shortlist ได้ทันที',
    };
  }

  return {
    title: 'Projects',
    subtitle: 'Loading the published project inventory for shortlist and comparison flows.',
    contact: 'Speak to an Advisor',
    finder: 'Use Smart Finder',
    loading: 'Loading published projects',
    sampleTitle: 'Preparing the starter shortlist',
    sampleBody: 'The page is gathering published projects and arranging them for comparison and advisory review.',
    signalOne: 'Published projects ready for review',
    signalTwo: 'Details that can move into compare or consultation',
    signalThree: 'If loading is slow, the team can still prepare the shortlist directly',
  };
}

export default function ProjectsLoading() {
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
