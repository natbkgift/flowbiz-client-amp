import { buildWhatsAppUrl } from '@/app/_lib/public-cta';
import { localeFromPathname } from '@/app/_lib/i18n/routing';
import { inferSourceRouteFromPath } from '@/lib/conversion';
import type { ShortlistDetail } from '@/lib/shortlist';

export type AIWidgetMessageRole = 'user' | 'assistant';

export type AIWidgetMessage = {
  id: string;
  role: AIWidgetMessageRole;
  content: string;
};

export type AILeadProfile = {
  intent?: string | null;
  buyer_type?: string | null;
  budget_range?: string | null;
  timeframe?: string | null;
  preferred_area?: string | null;
  property_type?: string | null;
  nationality?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  contact_preference?: string | null;
};

export type AIRecentAction = {
  action: string;
  page_type?: string | null;
  source_route?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  created_at?: string | null;
};

export type AISessionMemory = {
  lead_profile: AILeadProfile;
  viewed_property_ids: string[];
  viewed_project_ids: string[];
  viewed_area_ids: string[];
  recent_paths: string[];
  recent_actions: AIRecentAction[];
  asked_question_keys: string[];
  last_recommendation_slugs: string[];
  conversation_outcome?: 'active' | 'converted' | 'dropped' | 'unqualified' | null;
  message_count: number;
  last_updated_at?: string | null;
};

export type AIPageContext = {
  locale: 'en' | 'th';
  page_type: string;
  source_page: string;
  source_route: string;
  entity_type?: string | null;
  entity_id?: string | null;
  entity_slug?: string | null;
  entity_name?: string | null;
  property_id?: string | null;
  project_id?: string | null;
  area_id?: string | null;
  shortlist_property_ids: string[];
  shortlist_project_ids: string[];
  compare_property_ids: string[];
  compare_project_ids: string[];
  smart_finder_answers?: Record<string, string> | null;
  metadata: Record<string, string>;
};

export type AIRecommendationItem = {
  property_id: string;
  slug: string;
  title: string;
  href: string;
  source: string;
  score: number;
  reasons: string[];
  project?: string | null;
  area?: string | null;
  price_text?: string | null;
  image?: string | null;
};

export type AIRecommendationPreview = {
  strategy: string;
  matching_mode: 'weighted' | 'strict';
  purpose?: string | null;
  budget_range?: string | null;
  timeframe?: string | null;
  preferred_area?: string | null;
  items: AIRecommendationItem[];
};

export type AIConversionSignal = {
  tier: 'hot' | 'warm' | 'cool';
  is_high_intent: boolean;
  should_prompt_contact_capture: boolean;
  signals: string[];
  recommended_ctas: string[];
  summary: string;
};

export type AIHandoffPreview = {
  recommended_intent: string;
  missing_fields: string[];
  recommended_contact_fields: string[];
  summary_lines: string[];
  tags: string[];
  sales_automation?: {
    confirmation_title?: string;
    confirmation_body?: string;
    auto_response_message?: string;
  } | null;
};

export type AISuggestedAction = {
  type: string;
  label: string;
  href?: string | null;
  intent?: string | null;
};

export type AIChatResponse = {
  session_id: string;
  agent_id: string;
  locale: 'en' | 'th';
  status: string;
  reply: string;
  lead_profile: AILeadProfile;
  session_memory: AISessionMemory;
  captured_fields: string[];
  conversion_signal: AIConversionSignal;
  recommendation_preview?: AIRecommendationPreview | null;
  missing_fields: string[];
  next_question_key?: string | null;
  handoff_preview: AIHandoffPreview;
  optimization_summary?: {
    lookback_days: number;
    funnel: {
      conversations: number;
      leads: number;
      booked_viewings: number;
    };
    outcome_counts: {
      active: number;
      converted: number;
      dropped: number;
      unqualified: number;
    };
    drop_off_stage: string;
    chat_to_lead_rate?: number | null;
    lead_to_viewing_rate?: number | null;
    tuning: {
      cta_mode: 'balanced' | 'assertive' | 'viewing_first';
      recommendation_limit: number;
      question_budget: number;
      force_cta_after_recommendation: boolean;
      fallback_mode: 'inventory_first' | 'advisor_handoff';
    };
  } | null;
  suggested_actions: AISuggestedAction[];
};

export type AIPageMarker = {
  pageType?: string | null;
  sourceRoute?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  entitySlug?: string | null;
  entityName?: string | null;
  propertyId?: string | null;
  projectId?: string | null;
  areaId?: string | null;
};

export type AIRuntimeContext = {
  locale: 'en' | 'th';
  title: string;
  subtitle: string;
  intro: string;
  inputPlaceholder: string;
  quickReplies: string[];
  whatsAppMessage: string;
  pageContext: AIPageContext;
  crmContext: {
    propertyId: string | null;
    projectId: string | null;
    areaId: string | null;
  };
};

function normalizeText(value: string | null | undefined): string | null {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  return normalized || null;
}

function stripLocale(pathname: string): string {
  const locale = localeFromPathname(pathname);
  const stripped = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '');
  return stripped || '/';
}

function humanizeSlug(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  return normalized
    .split('-')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

function splitList(value: string | null): string[] {
  return String(value ?? '')
    .split(',')
    .map((item) => decodeURIComponent(item).trim())
    .filter(Boolean)
    .slice(0, 12);
}

function joinPreferences(values: Array<string | null | undefined>): string | undefined {
  const items = values
    .map((item) => normalizeText(item))
    .filter((item): item is string => Boolean(item));
  return items.length ? items.join(', ') : undefined;
}

export function isUuidLike(value: string | null | undefined): value is string {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(value ?? ''),
  );
}

export function readAiPageMarker(root: ParentNode = document): AIPageMarker | null {
  const node = root.querySelector<HTMLElement>('#amp-ai-page-context');
  if (!node) return null;

  return {
    pageType: normalizeText(node.dataset.pageType),
    sourceRoute: normalizeText(node.dataset.sourceRoute),
    entityType: normalizeText(node.dataset.entityType),
    entityId: normalizeText(node.dataset.entityId),
    entitySlug: normalizeText(node.dataset.entitySlug),
    entityName: normalizeText(node.dataset.entityName),
    propertyId: normalizeText(node.dataset.propertyId),
    projectId: normalizeText(node.dataset.projectId),
    areaId: normalizeText(node.dataset.areaId),
  };
}

function baseQuickReplies(locale: 'en' | 'th', pageType: string, entityName: string | null): string[] {
  if (locale === 'th') {
    if (pageType === 'home') {
      return ['อยากซื้ออยู่เอง', 'หาแบบลงทุน', 'ช่วยเริ่มจากทำเลก่อน'];
    }
    if (pageType === 'listing') {
      return ['งบไม่เกิน 6 ล้าน', 'ขอดูตัวเลือกใกล้ทะเล', 'คัดตัวที่เหมาะลงทุน'];
    }
    if (pageType === 'project') {
      return [
        `ช่วยอ่านมุมลงทุนของ ${entityName ?? 'โครงการนี้'}`,
        'ขอดูยูนิตที่ขยับต่อได้',
        'อยากนัดดูโครงการนี้',
      ];
    }
    if (pageType === 'property') {
      return ['ขอราคาล่าสุด', 'อยากนัดดูห้องนี้', 'สรุปค่าใช้จ่ายวันโอน'];
    }
    if (pageType === 'compare') {
      return ['สรุป trade-off ให้หน่อย', 'ตัวไหนเหมาะลงทุนกว่า', 'ควรนัดดูตัวไหนก่อน'];
    }
    if (pageType === 'shortlist') {
      return ['ช่วยตัด shortlist ให้แคบลง', 'ตัวไหนพร้อมคุยต่อสุด', 'เตรียม viewing plan ให้หน่อย'];
    }
    return ['อยากซื้ออยู่เอง', 'หาแบบลงทุน', 'อยากนัดดู'];
  }

  if (pageType === 'home') {
    return ['I want to buy to live', 'Show investment options', 'Start with the right area'];
  }
  if (pageType === 'listing') {
    return ['Keep it under THB 6m', 'Show near-beach options', 'Narrow the investor picks'];
  }
  if (pageType === 'project') {
    return [
      `Pressure-test ${entityName ?? 'this project'} for investment`,
      'Show the units worth moving on',
      'I want to book a viewing here',
    ];
  }
  if (pageType === 'property') {
    return ['What is the latest price?', 'Book a viewing', 'Summarize the closing costs'];
  }
  if (pageType === 'compare') {
    return ['Summarize the trade-offs', 'Which one fits investment?', 'What is the cleanest next step?'];
  }
  if (pageType === 'shortlist') {
    return ['Narrow my shortlist', 'Which one is strongest?', 'Prepare a viewing plan'];
  }
  return ['I want to buy to live', 'Show investment options', 'I want to book a viewing'];
}

export function quickRepliesForQuestion(
  locale: 'en' | 'th',
  nextQuestionKey: string | null | undefined,
  fallback: string[],
): string[] {
  if (locale === 'th') {
    if (nextQuestionKey === 'intent') return ['ซื้ออยู่เอง', 'ลงทุน', 'อยากเทียบตัวเลือกก่อน'];
    if (nextQuestionKey === 'budget_range') return ['ต่ำกว่า 6 ล้าน', '6-10 ล้าน', 'มากกว่า 10 ล้าน'];
    if (nextQuestionKey === 'timeframe') return ['พร้อมภายในเดือนนี้', '1-3 เดือน', 'ยังหาข้อมูลอยู่'];
    if (nextQuestionKey === 'buyer_type') return ['ซื้ออยู่เอง', 'นักลงทุน', 'ยังไม่ชัด'];
    if (nextQuestionKey === 'preferred_area') return ['จอมเทียน', 'วงศ์อมาตย์', 'พัทยากลาง'];
    if (nextQuestionKey === 'contact_method') return ['ส่งอีเมลได้', 'คุยทาง WhatsApp', 'โทรกลับได้'];
  } else {
    if (nextQuestionKey === 'intent') return ['Buy to live', 'Invest', 'Compare first'];
    if (nextQuestionKey === 'budget_range') return ['Below THB 6m', 'THB 6m-10m', 'Above THB 10m'];
    if (nextQuestionKey === 'timeframe') return ['This month', '1-3 months', 'Still researching'];
    if (nextQuestionKey === 'buyer_type') return ['Owner-occupier', 'Investor', 'Still undecided'];
    if (nextQuestionKey === 'preferred_area') return ['Jomtien', 'Wongamat', 'Central Pattaya'];
    if (nextQuestionKey === 'contact_method') return ['Email works', 'WhatsApp me', 'Call me'];
  }

  return fallback;
}

export function buildAiRuntimeContext(
  pathname: string,
  search: string,
  pageMarker: AIPageMarker | null,
  shortlist: ShortlistDetail | null,
): AIRuntimeContext {
  const locale = localeFromPathname(pathname);
  const strippedPath = stripLocale(pathname);
  const searchParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const compareIds = splitList(searchParams.get('ids'));
  const shortlistPropertyIds = shortlist?.items
    ?.map((item) => normalizeText(item.property_id))
    .filter((item): item is string => Boolean(item))
    .slice(0, 12) ?? [];
  const entitySlug = normalizeText(pageMarker?.entitySlug)
    ?? normalizeText(strippedPath.split('/').filter(Boolean).at(-1));
  const entityName = normalizeText(pageMarker?.entityName)
    ?? humanizeSlug(entitySlug);
  const fallbackSourceRoute = inferSourceRouteFromPath(pathname).replace(/-/g, '_');
  const sourceRoute = normalizeText(pageMarker?.sourceRoute)?.replace(/-/g, '_') ?? fallbackSourceRoute;
  const propertyId = isUuidLike(pageMarker?.propertyId)
    ? pageMarker?.propertyId
    : normalizeText(pageMarker?.propertyId);
  const projectId = isUuidLike(pageMarker?.projectId)
    ? pageMarker?.projectId
    : normalizeText(pageMarker?.projectId);
  const areaId = isUuidLike(pageMarker?.areaId)
    ? pageMarker?.areaId
    : normalizeText(pageMarker?.areaId);

  const pageContext: AIPageContext = {
    locale,
    page_type: 'shared',
    source_page: `${pathname}${search}`,
    source_route: sourceRoute,
    entity_type: normalizeText(pageMarker?.entityType),
    entity_id: normalizeText(pageMarker?.entityId),
    entity_slug: entitySlug,
    entity_name: entityName,
    property_id: propertyId,
    project_id: projectId,
    area_id: areaId,
    shortlist_property_ids: shortlistPropertyIds,
    shortlist_project_ids: [],
    compare_property_ids: strippedPath.startsWith('/compare') ? compareIds : [],
    compare_project_ids: [],
    smart_finder_answers: null,
    metadata: {},
  };

  let title = 'AMP AI Sales Agent';
  let subtitle = locale === 'th' ? 'Property assistant' : 'Property assistant';
  let intro = locale === 'th'
    ? 'พิมพ์โจทย์ที่อยากแก้ตอนนี้ เดี๋ยวผมช่วยคัด intent และ next step ให้สั้นและชัด'
    : 'Tell me what you need to solve right now and I will narrow the cleanest next step.';
  let inputPlaceholder = locale === 'th'
    ? 'พิมพ์โจทย์สั้น ๆ เช่น งบ ทำเล หรืออยากนัดดู'
    : 'Ask about budget, area, pricing, or booking a viewing';

  if (strippedPath === '/') {
    pageContext.page_type = 'home';
    pageContext.source_route = 'home';
    pageContext.metadata.mode = 'discovery';
    subtitle = locale === 'th' ? 'Discovery mode' : 'Discovery mode';
    intro = locale === 'th'
      ? 'เริ่มจากเป้าหมายหลักก่อน ผมจะช่วยคัดทางเลือกแรกที่ควรดูต่อให้เร็วขึ้น'
      : 'Start with the main goal and I will narrow the first route worth exploring.';
  } else if (
    strippedPath === '/buy'
    || strippedPath === '/rent'
    || strippedPath === '/projects'
    || strippedPath.startsWith('/buy?')
    || strippedPath.startsWith('/rent?')
    || strippedPath.startsWith('/projects?')
  ) {
    pageContext.page_type = 'listing';
    pageContext.metadata.mode = 'filter_assistant';
    subtitle = locale === 'th' ? 'Filter assistant' : 'Filter assistant';
    intro = locale === 'th'
      ? 'บอกงบ ทำเล หรือประเภทที่อยากได้ แล้วผมจะช่วยบีบตัวเลือกให้แคบลง'
      : 'Give me budget, area, or unit type and I will narrow the filter set quickly.';
    pageContext.smart_finder_answers = {
      ...(searchParams.get('budget') ? { budget: String(searchParams.get('budget')) } : {}),
      ...(searchParams.get('purpose') ? { purpose: String(searchParams.get('purpose')) } : {}),
      ...(searchParams.get('timeline') ? { timeline: String(searchParams.get('timeline')) } : {}),
      ...(searchParams.get('area') ? { area: String(searchParams.get('area')) } : {}),
      ...(searchParams.get('preferred_area') ? { preferred_area: String(searchParams.get('preferred_area')) } : {}),
      ...(joinPreferences([
        searchParams.get('view'),
        searchParams.get('furnishing'),
        searchParams.get('near_beach') === 'true' ? 'near beach' : null,
      ]) ? { preferences: joinPreferences([
        searchParams.get('view'),
        searchParams.get('furnishing'),
        searchParams.get('near_beach') === 'true' ? 'near beach' : null,
      ]) as string } : {}),
    };
  } else if (/^\/projects\/[^/]+$/.test(strippedPath)) {
    pageContext.page_type = 'project';
    pageContext.source_route = 'project';
    pageContext.entity_type = 'project';
    pageContext.entity_slug = entitySlug;
    pageContext.metadata.mode = 'investment_advisor';
    subtitle = locale === 'th' ? 'Investment advisor' : 'Investment advisor';
    intro = locale === 'th'
      ? `ผมช่วยอ่าน fit, upside และ next step ของ ${entityName ?? 'โครงการนี้'} ได้แบบสั้นและตรง`
      : `I can pressure-test fit, upside, and the next step for ${entityName ?? 'this project'}.`;
  } else if (/^\/property\/[^/]+$/.test(strippedPath)) {
    pageContext.page_type = 'property';
    pageContext.source_route = 'property';
    pageContext.entity_type = 'property';
    pageContext.entity_slug = entitySlug;
    pageContext.metadata.mode = 'closing_assistant';
    subtitle = locale === 'th' ? 'Closing assistant' : 'Closing assistant';
    intro = locale === 'th'
      ? `ถ้าห้องนี้ใกล้ตัดสินใจแล้ว ผมช่วยเช็ก price, fit และทางไปสู่นัดดูให้เร็วขึ้นได้`
      : 'If this unit is close to decision, I can tighten price, fit, and the fastest path to viewing.';
  } else if (strippedPath.startsWith('/compare')) {
    pageContext.page_type = 'compare';
    pageContext.source_route = 'compare';
    pageContext.metadata.mode = 'decision_support';
    subtitle = locale === 'th' ? 'Decision support' : 'Decision support';
    intro = locale === 'th'
      ? 'ผมช่วยสรุป trade-off และดันไปยัง next step ที่คมที่สุดให้ได้'
      : 'I can summarize trade-offs and push toward the clearest next step.';
  } else if (strippedPath.startsWith('/shortlist')) {
    pageContext.page_type = 'shortlist';
    pageContext.source_route = 'shortlist';
    pageContext.metadata.mode = 'shortlist_review';
    subtitle = locale === 'th' ? 'Shortlist review' : 'Shortlist review';
    intro = locale === 'th'
      ? 'ผมช่วยตัด shortlist ให้แคบลงหรือเตรียม viewing plan จากรายการที่เซฟไว้ได้'
      : 'I can narrow the shortlist or turn the saved items into a viewing plan.';
  } else if (strippedPath.startsWith('/smart-finder')) {
    pageContext.page_type = 'smart_finder';
    pageContext.source_route = 'smart_finder';
    pageContext.metadata.mode = 'finder_assistant';
    subtitle = locale === 'th' ? 'Finder assistant' : 'Finder assistant';
    intro = locale === 'th'
      ? 'ผมช่วยแปลโจทย์จาก finder ให้เป็น shortlist หรือ next step ที่คุยต่อได้จริง'
      : 'I can turn the finder brief into a shortlist or the next real action.';
  } else if (strippedPath.startsWith('/contact')) {
    pageContext.page_type = 'contact';
    pageContext.source_route = 'contact';
    pageContext.metadata.mode = 'advisor_handoff';
    subtitle = locale === 'th' ? 'Advisor handoff' : 'Advisor handoff';
  }

  const resolvedPropertyId = isUuidLike(propertyId)
    ? propertyId
    : pageContext.entity_type === 'property' && isUuidLike(pageContext.entity_id)
      ? pageContext.entity_id
      : null;
  const resolvedProjectId = isUuidLike(projectId)
    ? projectId
    : pageContext.entity_type === 'project' && isUuidLike(pageContext.entity_id)
      ? pageContext.entity_id
      : null;

  const whatsAppMessage = buildWhatsAppUrl(
    locale === 'th'
      ? `สวัสดี AMP Pattaya ผมอยากคุยต่อเกี่ยวกับ ${entityName ?? 'อสังหาริมทรัพย์ที่กำลังดูอยู่'} และ next step ที่เหมาะที่สุด`
      : `Hi AMP Pattaya, I want to continue on ${entityName ?? 'the property I am reviewing'} and the clearest next step.`,
  );

  return {
    locale,
    title,
    subtitle,
    intro,
    inputPlaceholder,
    quickReplies: baseQuickReplies(locale, pageContext.page_type, entityName),
    whatsAppMessage,
    pageContext,
    crmContext: {
      propertyId: resolvedPropertyId,
      projectId: resolvedProjectId,
      areaId: isUuidLike(areaId) ? areaId : null,
    },
  };
}