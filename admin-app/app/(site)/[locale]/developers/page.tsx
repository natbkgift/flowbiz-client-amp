import type { Metadata } from 'next';

import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { fetchDevelopers } from '@/app/_lib/public-api-server';
import { Container } from '@/components/layout/Container';
import { PAGE_REVALIDATE_SECONDS } from '@/app/_lib/constants';

export const revalidate = PAGE_REVALIDATE_SECONDS;

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

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const copy = pageCopy(locale);
  return makePageMetadata(locale, 'developers', copy.title, copy.description, dict.brand.name);
}

export default async function DevelopersPage({ params }: { params: { locale: string } }) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const copy = pageCopy(locale);

  const developers = await fetchDevelopers().catch(() => []);
  const rows = [...developers].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="section" id="main-content">
      <Container>
        <div className="section-header mb-6">
          <h1 className="section-title">{copy.title}</h1>
          <p className="section-subtitle">{copy.subtitle}</p>
        </div>

        {rows.length ? (
          <div className="grid grid-3">
            {rows.map((developer) => (
              <article key={developer.id} className="card">
                <h2 className="card-title">{developer.name}</h2>
                <p className="card-subtitle">
                  {developer.tier?.trim() || (locale === 'th' ? 'ยังไม่ระบุระดับ' : 'Tier not specified')}
                </p>
                {developer.website ? (
                  <p className="card-subtitle">
                    <a href={developer.website} rel="noopener noreferrer" target="_blank">
                      {developer.website}
                    </a>
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p>{dict.listing.noProperties}</p>
        )}
      </Container>
    </main>
  );
}
