import type { AIChatResponse, AILeadProfile, AIRuntimeContext, AIRecentAction, AISessionMemory } from './ai-runtime';

const AI_SESSION_MEMORY_KEY = 'amp_ai_session_memory_v2';

export type AIPersistedSession = {
  ai_session_id: string | null;
  memory: AISessionMemory;
};

function safeWindow(): Window | null {
  return typeof window === 'undefined' ? null : window;
}

function normalizeText(value: string | null | undefined): string | null {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  return normalized || null;
}

function emptyLeadProfile(): AILeadProfile {
  return {};
}

export function emptyAiSessionMemory(): AISessionMemory {
  return {
    lead_profile: emptyLeadProfile(),
    viewed_property_ids: [],
    viewed_project_ids: [],
    viewed_area_ids: [],
    recent_paths: [],
    recent_actions: [],
    asked_question_keys: [],
    last_recommendation_slugs: [],
    conversation_outcome: null,
    message_count: 0,
    last_updated_at: null,
  };
}

export function emptyAiPersistedSession(): AIPersistedSession {
  return {
    ai_session_id: null,
    memory: emptyAiSessionMemory(),
  };
}

function storageKey(analyticsSessionId: string, locale: 'en' | 'th'): string {
  return `${AI_SESSION_MEMORY_KEY}:${analyticsSessionId}:${locale}`;
}

function takeUnique(values: Array<string | null | undefined>, limit: number): string[] {
  const items: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const value = normalizeText(raw);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    items.push(value);
    if (items.length >= limit) break;
  }
  return items;
}

function takeUniqueActions(values: Array<AIRecentAction | null | undefined>, limit: number): AIRecentAction[] {
  const items: AIRecentAction[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    if (!raw?.action) continue;
    const key = [raw.action, raw.page_type ?? '', raw.source_route ?? '', raw.entity_id ?? ''].join(':');
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(raw);
    if (items.length >= limit) break;
  }
  return items;
}

function sanitizeLeadProfile(profile: AILeadProfile | null | undefined): AILeadProfile {
  return {
    intent: normalizeText(profile?.intent),
    buyer_type: normalizeText(profile?.buyer_type),
    budget_range: normalizeText(profile?.budget_range),
    timeframe: normalizeText(profile?.timeframe),
    preferred_area: normalizeText(profile?.preferred_area),
    property_type: normalizeText(profile?.property_type),
    nationality: normalizeText(profile?.nationality),
    contact_preference: normalizeText(profile?.contact_preference),
  };
}

function normalizeMemory(memory: Partial<AISessionMemory> | null | undefined): AISessionMemory {
  return {
    lead_profile: sanitizeLeadProfile(memory?.lead_profile),
    viewed_property_ids: takeUnique(memory?.viewed_property_ids ?? [], 12),
    viewed_project_ids: takeUnique(memory?.viewed_project_ids ?? [], 12),
    viewed_area_ids: takeUnique(memory?.viewed_area_ids ?? [], 12),
    recent_paths: takeUnique(memory?.recent_paths ?? [], 8),
    recent_actions: takeUniqueActions(memory?.recent_actions ?? [], 12),
    asked_question_keys: takeUnique(memory?.asked_question_keys ?? [], 12),
    last_recommendation_slugs: takeUnique(memory?.last_recommendation_slugs ?? [], 6),
    conversation_outcome: memory?.conversation_outcome ?? null,
    message_count: Math.max(0, Math.min(Number(memory?.message_count ?? 0) || 0, 100)),
    last_updated_at: normalizeText(memory?.last_updated_at),
  };
}

function mergeLeadProfile(base: AILeadProfile, next: AILeadProfile): AILeadProfile {
  const merged: AILeadProfile = { ...base };
  for (const [key, raw] of Object.entries(next) as Array<[keyof AILeadProfile, string | null | undefined]>) {
    const value = normalizeText(raw);
    if (!value) continue;
    merged[key] = value;
  }
  return sanitizeLeadProfile(merged);
}

function actionFromContext(action: string, runtimeContext: AIRuntimeContext): AIRecentAction {
  return {
    action,
    page_type: runtimeContext.pageContext.page_type,
    source_route: runtimeContext.pageContext.source_route,
    entity_type: runtimeContext.pageContext.entity_type ?? null,
    entity_id: runtimeContext.pageContext.entity_id ?? null,
    created_at: new Date().toISOString(),
  };
}

function mergeMemory(base: AISessionMemory, patch: Partial<AISessionMemory>): AISessionMemory {
  return normalizeMemory({
    ...base,
    ...patch,
    lead_profile: mergeLeadProfile(base.lead_profile, sanitizeLeadProfile(patch.lead_profile)),
    viewed_property_ids: takeUnique([
      ...(patch.viewed_property_ids ?? []),
      ...base.viewed_property_ids,
    ], 12),
    viewed_project_ids: takeUnique([
      ...(patch.viewed_project_ids ?? []),
      ...base.viewed_project_ids,
    ], 12),
    viewed_area_ids: takeUnique([
      ...(patch.viewed_area_ids ?? []),
      ...base.viewed_area_ids,
    ], 12),
    recent_paths: takeUnique([
      ...(patch.recent_paths ?? []),
      ...base.recent_paths,
    ], 8),
    recent_actions: takeUniqueActions([
      ...(patch.recent_actions ?? []),
      ...base.recent_actions,
    ], 12),
    asked_question_keys: takeUnique([
      ...(patch.asked_question_keys ?? []),
      ...base.asked_question_keys,
    ], 12),
    last_recommendation_slugs: takeUnique([
      ...(patch.last_recommendation_slugs ?? []),
      ...base.last_recommendation_slugs,
    ], 6),
  });
}

function memoryPatchFromContext(runtimeContext: AIRuntimeContext): Partial<AISessionMemory> {
  const propertyId = normalizeText(runtimeContext.pageContext.property_id ?? runtimeContext.crmContext.propertyId);
  const projectId = normalizeText(runtimeContext.pageContext.project_id ?? runtimeContext.crmContext.projectId);
  const areaId = normalizeText(runtimeContext.pageContext.area_id ?? runtimeContext.crmContext.areaId);
  const sourcePage = normalizeText(runtimeContext.pageContext.source_page);
  const pageAction = runtimeContext.pageContext.page_type === 'property'
    ? 'view_property'
    : runtimeContext.pageContext.page_type === 'project'
      ? 'view_project'
      : `view_${runtimeContext.pageContext.page_type}`;

  return {
    viewed_property_ids: propertyId ? [propertyId] : [],
    viewed_project_ids: projectId ? [projectId] : [],
    viewed_area_ids: areaId ? [areaId] : [],
    recent_paths: sourcePage ? [sourcePage] : [],
    recent_actions: [actionFromContext(pageAction, runtimeContext)],
    last_updated_at: new Date().toISOString(),
  };
}

export function readAiPersistedSession(
  analyticsSessionId: string,
  locale: 'en' | 'th',
): AIPersistedSession | null {
  const w = safeWindow();
  if (!w) return null;
  try {
    const raw = w.localStorage.getItem(storageKey(analyticsSessionId, locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AIPersistedSession>;
    return {
      ai_session_id: normalizeText(parsed.ai_session_id) ?? null,
      memory: normalizeMemory(parsed.memory),
    };
  } catch {
    return null;
  }
}

export function writeAiPersistedSession(
  analyticsSessionId: string,
  locale: 'en' | 'th',
  session: AIPersistedSession,
): void {
  const w = safeWindow();
  if (!w) return;
  try {
    w.localStorage.setItem(storageKey(analyticsSessionId, locale), JSON.stringify({
      ai_session_id: normalizeText(session.ai_session_id),
      memory: normalizeMemory(session.memory),
    }));
  } catch {
    // Ignore localStorage failures.
  }
}

export function hydrateAiPersistedSession(
  current: AIPersistedSession | null,
  runtimeContext: AIRuntimeContext,
): AIPersistedSession {
  const base = current ?? emptyAiPersistedSession();
  return {
    ai_session_id: normalizeText(base.ai_session_id) ?? null,
    memory: mergeMemory(base.memory, memoryPatchFromContext(runtimeContext)),
  };
}

export function rememberAiAction(
  current: AIPersistedSession,
  runtimeContext: AIRuntimeContext,
  action: string,
): AIPersistedSession {
  return {
    ai_session_id: current.ai_session_id,
    memory: mergeMemory(current.memory, {
      recent_actions: [actionFromContext(action, runtimeContext)],
      last_updated_at: new Date().toISOString(),
    }),
  };
}

export function rememberAiResponse(
  current: AIPersistedSession,
  runtimeContext: AIRuntimeContext,
  response: AIChatResponse,
): AIPersistedSession {
  return {
    ai_session_id: normalizeText(response.session_id) ?? current.ai_session_id,
    memory: mergeMemory(
      current.memory,
      mergeMemory(normalizeMemory(response.session_memory), memoryPatchFromContext(runtimeContext)),
    ),
  };
}

export function markAiConversationOutcome(
  current: AIPersistedSession,
  outcome: NonNullable<AISessionMemory['conversation_outcome']>,
): AIPersistedSession {
  return {
    ai_session_id: current.ai_session_id,
    memory: mergeMemory(current.memory, {
      conversation_outcome: outcome,
      last_updated_at: new Date().toISOString(),
    }),
  };
}