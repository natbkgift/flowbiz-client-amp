
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

function buildAreaGuideConfidenceLines(locale: 'en' | 'th', areaCount: number): string[] {
  return [
    locale === 'th'
      ? `ตอนนี้มี ${areaCount} ทำเลที่เผยแพร่อยู่บนหน้านี้ ซึ่งเพียงพอให้ตัดสินใจเรื่องโซนก่อนขยับไปที่โครงการ`
      : `There are ${areaCount} published areas on this page right now, enough to decide the zone before you move into projects.`,
    locale === 'th'
      ? 'การเลือกทำเลควรช่วยลดความไม่แน่ใจเรื่องไลฟ์สไตล์ แรงกดดันด้านงบ และประเภท shortlist ที่คุณควรขอต่อ'
      : 'Area choice should reduce uncertainty around lifestyle fit, budget pressure, and the kind of shortlist you should ask for next.',
    locale === 'th'
      ? 'ถ้ายังลังเลระหว่างสองโซน ให้พกทั้งคู่ไปต่อใน Smart Finder แทนการฝืนเลือกโครงการเร็วเกินไป'
      : 'If two zones still feel close, carry both into Smart Finder instead of forcing a project decision too early.',
  ];
}

function buildAreaGuideProcessLines(locale: 'en' | 'th'): string[] {
  return [
    locale === 'th'
      ? 'เปิด area brief ก่อน แล้วค่อยไปต่อที่ projects, compare, หรือ advisor handoff โดยไม่ต้องรีเซ็ตบริบทใหม่'
      : 'Open the area brief first, then move into projects, compare, or an advisor handoff without rebuilding the context.',
    locale === 'th'
      ? 'ใช้หน้านี้เมื่อสิ่งที่ยังบล็อกการตัดสินใจคือโซน ไม่ใช่อาคารหรือยูนิตเฉพาะ'
      : 'Use this page when the blocker is still the zone, not the exact building or unit.',
    locale === 'th'
      ? 'เมื่อโซนเริ่มชัด ขั้นถัดไปควรเป็นรายการโครงการที่แคบลง ไม่ใช่การ browse ที่กว้างขึ้นอีก'
      : 'Once the zone is clearer, the next step should be a shorter project list, not a wider browse again.',
  ];
}

export default async function AreaGuidePage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const areas = await buildAreaGuideCards(locale, dict);
  const confidenceLines = buildAreaGuideConfidenceLines(locale, areas.length);
  const processLines = buildAreaGuideProcessLines(locale);

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
          <div className="signal-grid signal-grid--two-up">
            <section className="authority-card area-guide-guidance reveal">
              <h2 className="card-title">{dict.areaGuide.confidenceTitle}</h2>
              <p className="card-subtitle">{dict.areaGuide.confidenceSubtitle}</p>
              <ul className="bullet-list mt-4">
                {confidenceLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>

            <section className="authority-card area-guide-guidance reveal" id="area-guide-process-read">
              <h2 className="card-title">{dict.areaGuide.processTitle}</h2>
              <p className="card-subtitle">{dict.areaGuide.processSubtitle}</p>
              <ul className="bullet-list mt-4">
                {processLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          </div>
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


