import Link from 'next/link';
import type { Metadata } from 'next';

import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { fetchDevelopers } from '@/app/_lib/public-api-server';
import { Container } from '@/components/layout/Container';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';
import { EmptyStateCard } from '@/components/ui/StateBlocks';

export const revalidate = 300;
const DEVELOPERS_FETCH_TIMEOUT_MS = 8000;

async function withTimeout<T>(task: Promise<T>, fallback: T, timeoutMs = DEVELOPERS_FETCH_TIMEOUT_MS): Promise<T> {
  try {
    return await Promise.race<T>([
      task,
      new Promise<T>((resolve) => {
        setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } catch {
    return fallback;
  }
}

function pageCopy(locale: 'en' | 'th'): { title: string; subtitle: string; description: string } {
  if (locale === 'th') {
    return {
      title: 'ผู้พัฒนาโครงการ',
      subtitle: 'รายชื่อผู้พัฒนาโครงการที่เผยแพร่แล้ว',
      description: 'รายชื่อผู้พัฒนาโครงการอสังหาริมทรัพย์ที่เผยแพร่ในระบบ',
    };
  }

  return {
    title: 'Developers',
    subtitle: 'Published property developers',
    description: 'Published property developers listed on AMP Pattaya.',
  };
}

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const copy = pageCopy(locale);
  return makePageMetadata(locale, 'developers', copy.title, copy.description, dict.brand.name);
}

export default async function DevelopersPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const copy = pageCopy(locale);
  const advisoryLabels = getAdvisoryLabels(locale);
  const advisoryProofs = getAdvisoryProofs(dict);

  const developers = await withTimeout(fetchDevelopers(), []);
  const rows = [...developers].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main id="main-content">
      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={copy.title}
        subtitle={copy.subtitle}
        proofs={advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'ผู้ซื้อที่ต้องการเริ่มจากความน่าเชื่อถือของผู้พัฒนา' : 'Buyers starting from developer credibility',
            body: locale === 'th'
              ? 'ใช้หน้านี้เมื่อต้องการเทียบ developer name, tier, และ published presence ก่อน'
              : 'Use this page when developer brand, tier, and published presence matter before unit-level review.',
            icon: 'building',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'เลือก developer แล้วค่อยไปดู projects' : 'Choose the developer, then move into projects',
            body: locale === 'th'
              ? 'เมื่อเห็นรายชื่อที่ใช่แล้ว ค่อยไล่ต่อไปยัง inventory หรือปรึกษาทีม'
              : 'Once the likely developer is clear, move into inventory or advisory consultation.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'แสดงเฉพาะข้อมูลผู้พัฒนาที่เผยแพร่แล้ว' : 'Only published developer records appear here',
            body: locale === 'th'
              ? 'ถ้ายังไม่มีข้อมูลเผยแพร่ จะขึ้น state ว่างแบบตรงไปตรงมา'
              : 'If no developer records are published, the page falls back to a clear editorial empty state.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'developer_shortlist', source: 'developers_hero' }),
          label: dict.cta.speakToAdvisor,
          eventPayload: { cta: 'developer_shortlist', from: 'developers_hero' },
        }}
        secondaryAction={{
          href: withLocale(locale, '/projects'),
          label: dict.advisory.browseVerifiedInventory,
          eventPayload: { cta: 'browse_verified_inventory', from: 'developers_hero' },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict),
          label: dict.cta.whatsapp,
        }}
      />
      <section className="section">
      <Container>
        <div className="section-header mb-6">
          <h1 className="section-title">{copy.title}</h1>
          <p className="section-subtitle">{copy.subtitle}</p>
        </div>

        {rows.length ? (
          <div className="grid grid-3">
            {rows.map((developer) => (
              <article key={developer.id} className="card catalogue-card">
                <div className="catalogue-card__eyebrow">
                  {locale === 'th' ? 'ผู้พัฒนาที่เผยแพร่แล้ว' : 'Published developer'}
                </div>
                <h2 className="card-title">{developer.name}</h2>
                <p className="card-subtitle">
                  {developer.tier?.trim() || (locale === 'th' ? 'ยังไม่ระบุระดับ' : 'Tier not specified')}
                </p>
                <div className="catalogue-card__meta">
                  <span>
                    {locale === 'th'
                      ? 'ใช้ข้อมูลผู้พัฒนาเป็นจุดเริ่มต้นก่อนขอดู shortlist โครงการที่ตรงกลยุทธ์'
                      : 'Use developer context as the starting point before requesting a project shortlist.'}
                  </span>
                </div>
                {developer.website ? (
                  <p className="card-subtitle">
                    <a href={developer.website} rel="noopener noreferrer" target="_blank">
                      {developer.website}
                    </a>
                  </p>
                ) : null}
                <div className="card-actions">
                  <Link
                    className="btn btn-secondary"
                    href={withLocaleQuery(locale, '/contact', {
                      intent: 'developer_shortlist',
                      source: 'developers_grid',
                      developer: developer.slug,
                    })}
                  >
                    {dict.cta.speakToAdvisor}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyStateCard
            title={dict.advisory.noPublishedDataTitle}
            body={dict.advisory.noPublishedDataBody}
            action={
              <a className="btn btn-secondary" href={withLocale(locale, '/contact')}>
                {dict.cta.speakToAdvisor}
              </a>
            }
          />
        )}
      </Container>
      </section>
    </main>
  );
}

