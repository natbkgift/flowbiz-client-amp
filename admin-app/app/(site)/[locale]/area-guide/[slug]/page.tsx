import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { LeadForm } from '@/components/forms/LeadForm';
import { MapView } from '@/components/media/MapView';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { breadcrumbSchema, placeSchema } from '@/app/_lib/schema-markup';

export const revalidate = 300;

const areaData: Record<string, { nameEn: string; nameTh: string; lat: number; lng: number; descEn: string; descTh: string }> = {
  jomtien: {
    nameEn: 'Jomtien',
    nameTh: 'จอมเทียน',
    lat: 12.8891,
    lng: 100.8730,
    descEn: 'Jomtien is a popular beachfront area known for family-friendly condos, great restaurants, and a relaxed atmosphere. Properties here offer strong rental yields from both short-term and long-term tenants.',
    descTh: 'จอมเทียนเป็นพื้นที่ริมหาดยอดนิยม มีคอนโดที่เหมาะกับครอบครัว ร้านอาหารดีๆ และบรรยากาศสบายๆ อสังหาริมทรัพย์ที่นี่มีผลตอบแทนให้เช่าที่ดี',
  },
  pratumnak: {
    nameEn: 'Pratumnak Hill',
    nameTh: 'เขาพระตำหนัก',
    lat: 12.9140,
    lng: 100.8650,
    descEn: 'Pratumnak Hill is considered the most prestigious address in Pattaya, offering quiet luxury between Central Pattaya and Jomtien. Premium condos and sea-view villas define this neighborhood.',
    descTh: 'เขาพระตำหนักถือเป็นทำเลที่มีเกียรติที่สุดในพัทยา อยู่ระหว่างพัทยากลางและจอมเทียน มีคอนโดระดับพรีเมียมและวิลล่าวิวทะเล',
  },
  wongamat: {
    nameEn: 'Wongamat Beach',
    nameTh: 'หาดวงศ์อมาตย์',
    lat: 12.9660,
    lng: 100.8870,
    descEn: 'Wongamat Beach is home to North Pattaya\'s finest high-rise condominiums. Known for its clean beach and luxury developments, it attracts discerning investors and long-stay residents.',
    descTh: 'หาดวงศ์อมาตย์เป็นที่ตั้งของคอนโดสูงระดับพรีเมียมในพัทยาเหนือ มีชื่อเสียงด้านหาดสะอาดและโครงการหรูหรา ดึงดูดนักลงทุนและผู้พำนักระยะยาว',
  },
  central: {
    nameEn: 'Central Pattaya',
    nameTh: 'พัทยากลาง',
    lat: 12.9345,
    lng: 100.8825,
    descEn: 'Central Pattaya is the commercial heart of the city, offering the widest selection of condos, excellent transport links, and proximity to shopping, entertainment, and nightlife.',
    descTh: 'พัทยากลางเป็นศูนย์กลางธุรกิจของเมือง มีคอนโดให้เลือกมากที่สุด การเดินทางสะดวก ใกล้ศูนย์การค้า สถานบันเทิง และแหล่งท่องเที่ยวยามราตรี',
  },
  'na-jomtien': {
    nameEn: 'Na Jomtien',
    nameTh: 'นาจอมเทียน',
    lat: 12.8460,
    lng: 100.8820,
    descEn: 'Na Jomtien is an emerging area south of Jomtien offering larger plots, new resort-style developments, and significantly lower prices per sqm. Ideal for long-term capital appreciation.',
    descTh: 'นาจอมเทียนเป็นพื้นที่กำลังพัฒนาทางใต้ของจอมเทียน มีที่ดินขนาดใหญ่ โครงการรีสอร์ทใหม่ๆ และราคาต่อตารางเมตรต่ำกว่ามาก เหมาะสำหรับการเพิ่มมูลค่าระยะยาว',
  },
  'bang-saray': {
    nameEn: 'Bang Saray',
    nameTh: 'บางเสร่',
    lat: 12.7920,
    lng: 100.9040,
    descEn: 'Bang Saray is a charming fishing village south of Pattaya, popular with expats seeking a quieter lifestyle. Villas and townhouses dominate this area, with a growing number of boutique developments.',
    descTh: 'บางเสร่เป็นหมู่บ้านชาวประมงที่มีเสน่ห์ทางใต้ของพัทยา เป็นที่นิยมของชาวต่างชาติที่ต้องการวิถีชีวิตที่เงียบสงบ มีวิลล่าและทาวน์เฮาส์เป็นหลัก',
  },
};

function humanize(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const area = areaData[params.slug];
  const name = area ? (locale === 'th' ? area.nameTh : area.nameEn) : humanize(params.slug);
  const title = locale === 'th' ? `คู่มือทำเล: ${name}` : `Area Guide: ${name}`;
  const desc = area
    ? (locale === 'th' ? area.descTh.slice(0, 160) : area.descEn.slice(0, 160))
    : (locale === 'th' ? 'สรุปภาพรวมทำเล + ข้อควรรู้' : 'Area overview and key information.');
  return makePageMetadata(locale, `area-guide/${params.slug}`, title, desc, dict.brand.name);
}

export default function AreaGuideSlugPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';
  const area = areaData[params.slug];
  const name = area ? (locale === 'th' ? area.nameTh : area.nameEn) : humanize(params.slug);

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: dict.nav.areaGuide, href: `/${locale}/area-guide` },
    { label: name, href: `/${locale}/area-guide/${encodeURIComponent(params.slug)}` },
  ];

  const jsonLd = JSON.stringify([
    breadcrumbSchema(
      breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
    ),
    ...(area
      ? [placeSchema({
          name: area.nameEn,
          description: area.descEn,
          url: `${siteUrl}/${locale}/area-guide/${params.slug}`,
          lat: area.lat,
          lng: area.lng,
        })]
      : []),
  ], null, 0);

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <Breadcrumbs items={breadcrumbItems} />

      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{name}</h1>
          <p className="subhead">
            {area
              ? (locale === 'th' ? area.descTh : area.descEn)
              : (locale === 'th'
                ? 'หน้านี้เป็น template ตาม blueprint (area guide). จะเติมข้อมูลเชิงลึก/แผนที่/คอนเทนต์เมื่อ areas table พร้อม'
                : 'This is a blueprint-driven template (area guide). We will enrich map/content once areas data is populated.')}
          </p>
          <div className="cta-row">
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, '/projects')}>
              {dict.nav.projects}
            </a>
          </div>
        </Container>
      </section>

      {area && (
        <section className="section">
          <Container>
            <div className="section-header">
              <h2 className="section-title">
                {locale === 'th' ? `แผนที่ ${area.nameTh}` : `${area.nameEn} Map`}
              </h2>
              <p className="section-subtitle">
                {locale === 'th'
                  ? 'ดูทำเลบนแผนที่ เพื่อเข้าใจตำแหน่งและความสะดวกในการเดินทาง'
                  : 'View the area on the map to understand location and accessibility.'}
              </p>
            </div>
            <MapView
              center={{ lat: area.lat, lng: area.lng }}
              zoom={14}
              markers={[{ lat: area.lat, lng: area.lng, label: area.nameEn }]}
              height={450}
            />
          </Container>
        </section>
      )}

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{locale === 'th' ? `ขอ shortlist ทำเล${name}` : `Request a ${name} Shortlist`}</h2>
              <p className="cta-body">
                {locale === 'th'
                  ? 'ระบุงบ + ประเภททรัพย์ + เป้าหมาย แล้วเราจะส่งตัวเลือกที่เหมาะกับทำเลนี้'
                  : 'Share budget, property type, and goal. We will reply with options for this area.'}
              </p>
            </div>
            <div className="cta-panel__form">
              <LeadForm defaultMessage={`Area guide: ${params.slug}`} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
