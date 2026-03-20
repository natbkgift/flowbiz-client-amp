
import { Container } from '@/components/layout/Container';

import { LeadForm } from '@/components/forms/LeadForm';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { fetchAreas } from '@/app/_lib/public-api-server';
import { buildLeadCaptureQuery, withLocaleQuery } from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';

export const revalidate = 300;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'area-guide', dict.nav.areaGuide, dict.areaGuide.subtitle, dict.brand.name);
}

type AreaGuideCard = {
  slug: string;
  title: string;
  lifestyle: string;
  investment: string;
  city: string | null;
};

function buildFallbackAreaCards(locale: 'en' | 'th', dict: ReturnType<typeof getDictionary>): AreaGuideCard[] {
  return [
    {
      slug: 'central',
      title: dict.areaGuide.centralTitle,
      lifestyle: dict.areaGuide.centralLifestyle,
      investment: dict.areaGuide.centralInvestment,
      city: locale === 'th' ? 'พัทยา' : 'Pattaya',
    },
    {
      slug: 'jomtien',
      title: dict.areaGuide.jomtienTitle,
      lifestyle: dict.areaGuide.jomtienLifestyle,
      investment: dict.areaGuide.jomtienInvestment,
      city: locale === 'th' ? 'พัทยา' : 'Pattaya',
    },
    {
      slug: 'pratumnak',
      title: dict.areaGuide.pratumnakTitle,
      lifestyle: dict.areaGuide.pratumnakLifestyle,
      investment: dict.areaGuide.pratumnakInvestment,
      city: locale === 'th' ? 'พัทยา' : 'Pattaya',
    },
    {
      slug: 'wongamat',
      title: locale === 'th' ? 'วงศ์อมาตย์' : 'Wongamat',
      lifestyle: locale === 'th' ? 'เหมาะกับผู้ซื้อที่มองหาบรรยากาศพรีเมียมและภาพรวมทำเลริมทะเล' : 'Best for buyers who want a premium beach-adjacent location read before narrowing projects.',
      investment: locale === 'th' ? 'ใช้เพื่อแยกทำเลคุณภาพสูงออกจากทำเลที่เน้นความคึกคักหรือความคุ้มค่า' : 'Useful when the decision is between premium positioning and more convenience-led or value-led zones.',
      city: locale === 'th' ? 'พัทยา' : 'Pattaya',
    },
  ];
}

async function buildAreaGuideCards(locale: 'en' | 'th', dict: ReturnType<typeof getDictionary>): Promise<AreaGuideCard[]> {
  try {
    const areas = await fetchAreas();
    if (!areas.length) {
      return buildFallbackAreaCards(locale, dict);
    }

    return areas
      .filter((area) => area.status !== 'draft')
      .slice(0, 8)
      .map((area) => ({
        slug: area.slug,
        title: area.name,
        city: area.city,
        lifestyle: locale === 'th'
          ? `${area.name} เหมาะกับผู้ซื้อที่ต้องการอ่านบริบทของทำเลก่อนคัดโครงการแบบจริงจัง`
          : `${area.name} works best for buyers who want the location context before making a real project shortlist.`,
        investment: locale === 'th'
          ? 'ใช้หน้า area brief เพื่อแยกความต่างของทำเลก่อนส่งต่อไป Smart Finder, compare, หรือ advisor review'
          : 'Use the area brief to separate location trade-offs before moving into Smart Finder, compare, or an advisor review.',
      }));
  } catch {
    return buildFallbackAreaCards(locale, dict);
  }
}

export default async function AreaGuidePage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const areas = await buildAreaGuideCards(locale, dict);
  const confidenceLines = locale === 'th'
    ? [
        'เริ่มจากการเลือกทำเลที่ใช่ก่อน แล้วค่อยคัดโครงการในพื้นที่นั้น',
        'แต่ละ area brief จะต่อเข้ากับ Smart Finder, compare, และ contact flow เดิมได้โดยไม่เสียบริบท',
        'หน้านี้ควรทำหน้าที่เป็นแผนที่การตัดสินใจ ไม่ใช่แค่รายชื่อทำเลไม่กี่แห่ง',
      ]
    : [
        'Choose the right zone first, then narrow projects inside that area.',
        'Each area brief should hand cleanly into the existing Smart Finder, compare, and contact flows.',
        'This page should work like a decision map, not just a short list of neighborhoods.',
      ];

  return (
    <main id="main-content" className="decision-page decision-page--area-guide">
      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{dict.areaGuide.title}</h1>
          <p className="subhead">{dict.areaGuide.subtitle}</p>
          <div className="cta-row">
            <TrackedLink
              className="btn btn-cta"
              href={withLocaleQuery(locale, '/contact', buildLeadCaptureQuery({
                intent: 'general_inquiry',
                source: 'area_guide',
                sourceRoute: 'area-guide',
                ctaType: 'primary',
                ctaLabel: dict.cta.speakToAdvisor,
                entityType: 'route',
                entityName: 'area-guide',
                userIntent: 'research',
                message: locale === 'th'
                  ? 'ต้องการคุยต่อจากหน้า area guide เพื่อเลือกทำเลที่เหมาะก่อนคัดโครงการ'
                  : 'I want to continue from the area guide to choose the right location before narrowing projects.',
              }))}
              eventType="cta_click"
              eventPayload={{
                source_route: 'area-guide',
                cta_type: 'primary',
                cta_label: dict.cta.speakToAdvisor,
                entity_type: 'route',
                entity_name: 'area-guide',
                user_intent: 'research',
              }}
            >
              {dict.cta.speakToAdvisor}
            </TrackedLink>
            <TrackedLink
              className="btn btn-tertiary"
              href={withLocale(locale, '/invest')}
              eventType="cta_click"
              eventPayload={{
                source_route: 'area-guide',
                cta_type: 'tertiary',
                cta_label: dict.cta.exploreInvestment,
                entity_type: 'route',
                entity_name: 'invest',
                user_intent: 'invest',
              }}
            >
              {dict.cta.exploreInvestment}
            </TrackedLink>
          </div>
        </Container>
      </section>

      <section id="area-guide-confidence-pack" className="section">
        <Container>
          <section className="authority-card area-guide-guidance reveal">
            <h2 className="card-title">{locale === 'th' ? 'วิธีใช้หน้า area guide' : 'How to use this area guide'}</h2>
            <p className="card-subtitle">
              {locale === 'th'
                ? 'อ่านบริบทของทำเลให้ชัดก่อน แล้วค่อยเปิด area brief, compare, หรือคุยกับทีมต่อจากหน้าชุดเดียวกัน'
                : 'Read the location context first, then move into the area brief, compare, or advisor handoff from the same decision path.'}
            </p>
            <ul className="bullet-list mt-4">
              {confidenceLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.areaGuide.areasTitle}</h2>
            <p className="section-subtitle">{dict.areaGuide.areasSubtitle}</p>
          </div>

          <div className="grid grid-3 area-guide-card-grid">
            {areas.map((a) => (
              <div key={a.slug} className="authority-card area-guide-card">
                <h3 className="card-title">{a.title}</h3>
                <p className="text-caption">{a.city ?? (locale === 'th' ? 'พัทยา' : 'Pattaya')}</p>
                <p className="card-subtitle mb-2">{a.lifestyle}</p>
                <p className="text-caption mb-0">{a.investment}</p>
                <div className="card-actions mt-4">
                  <a
                    className="btn btn-secondary"
                    href={withLocale(locale, `/areas/${encodeURIComponent(a.slug)}`)}
                    data-amp-event-type="cta_click"
                    data-amp-event-payload={JSON.stringify({
                      source_route: 'area-guide',
                      cta_type: 'secondary',
                      cta_label: locale === 'th' ? 'เปิด area brief' : 'Open area brief',
                      entity_type: 'area',
                      entity_id: a.slug,
                      entity_name: a.title,
                      user_intent: 'research',
                      context: {
                        area: a.title,
                      },
                    })}
                  >
                    {locale === 'th' ? 'เปิด area brief' : 'Open area brief'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{dict.areaGuide.mapTitle}</h2>
            <p className="section-subtitle">{dict.areaGuide.mapSubtitle}</p>
          </div>

          <div className="map-grid" role="list">
            {areas.map((a) => (
              <div key={a.slug} className="map-item area-guide-map-item" role="listitem">
                <div className="map-item__title">{a.title}</div>
                <div className="map-item__row">
                  <span className="map-item__label">{locale === 'th' ? 'เมือง:' : 'City:'}</span>
                  <span className="map-item__value">{a.city ?? (locale === 'th' ? 'พัทยา' : 'Pattaya')}</span>
                </div>
                <div className="map-item__row">
                  <span className="map-item__label">{`${dict.areaGuide.mapLabels.lifestyle}:`}</span>
                  <span className="map-item__value">{a.lifestyle}</span>
                </div>
                <div className="map-item__row">
                  <span className="map-item__label">{`${dict.areaGuide.mapLabels.investment}:`}</span>
                  <span className="map-item__value">{a.investment}</span>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{dict.contact.advisoryTitle}</h2>
              <p className="cta-body">{dict.contact.advisoryBody}</p>
            </div>
            <div className="cta-panel__form">
              <LeadForm
                defaultMessage={dict.contact.advisoryBody}
                handoff={{
                  sourceRoute: 'area-guide',
                  ctaType: 'primary',
                  ctaLabel: dict.cta.speakToAdvisor,
                  entityType: 'route',
                  entityName: 'area-guide',
                  userIntent: 'research',
                }}
              />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}


