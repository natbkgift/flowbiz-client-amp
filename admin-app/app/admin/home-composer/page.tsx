'use client';

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  clearAuthSession,
  LEGACY_TOKEN_STORAGE_KEY,
  loginAdmin,
  persistAuthSession,
  readAuthSession,
} from '@/app/_lib/admin-auth';
import { detectAdminLocale, persistAdminLocale } from '@/app/_lib/admin-i18n';
import { normalizeLocalMediaPath } from '@/app/_lib/local-media';
import { ActionCard, AdminButton, AdminPage, AdminPageBody, AdminPageHeader, LogCard } from '@/components/admin/AdminPrimitives';
import { apiRequest } from '../../../lib/api';
import { getToken, setToken } from '../../../lib/auth-store';

type LocaleCode = 'en' | 'th';

type GovernanceMessage = {
  level: string;
  path: string;
  detail: string;
};

type ValidationResult = {
  errors: string[];
  warnings: string[];
  media_warnings: GovernanceMessage[];
};

type ComposerItem = {
  id: string;
  page_key: string;
  locale: LocaleCode;
  status: string;
  version: number;
  config: Record<string, unknown>;
  updated_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type ComposerBundle = {
  page_key: string;
  locale: LocaleCode;
  draft: ComposerItem | null;
  published: ComposerItem | null;
};

type SaveResponse = {
  item: ComposerItem;
  validation: ValidationResult;
};

type SeededAuthSession = {
  token: string;
  email: string;
};

type CandidateProject = {
  id: string;
  slug: string;
  name: string;
  status: string;
  cover_image_url: string | null;
};

type CandidateProperty = {
  id: string;
  source_id: string;
  slug: string | null;
  title: string;
  type: string;
  status: string;
  cover_image: string | null;
};

type MediaAsset = {
  id: string;
  storage_path: string;
  rights_status: string | null;
  approval_status: string | null;
  is_exception: boolean;
};

type MediaWorkspaceItem = {
  id: string;
  storage_path: string;
  rights_status: string | null;
  approval_status: string | null;
  is_exception?: boolean | null;
  kind?: string | null;
  status?: string | null;
};

type MediaWorkspaceListResponse = {
  items?: MediaWorkspaceItem[];
};

const HOME_COMPOSER_COPY = {
  en: {
    eyebrow: 'Content orchestration',
    pageTitle: 'Home Composer',
    pageDescription: 'Compose Home sections, hero copy/media, and featured entity selections with governance-aware publish checks.',
    localeLabel: 'Locale',
    refresh: 'Refresh',
    refreshing: 'Refreshing…',
    saveDraft: 'Save Draft',
    saving: 'Saving…',
    publish: 'Publish',
    publishing: 'Publishing…',
    signOut: 'Sign out',
    loginTitle: 'Admin sign in',
    loginSubtitle: 'Use the same admin credentials as /api/v1/auth/login.',
    adminEmail: 'Admin email',
    password: 'Password',
    signIn: 'Sign in',
    signingIn: 'Signing in',
    signedInFallback: 'Signed in session',
    signedInAs: 'Signed in as',
    signedInDescription: 'Active home composer session.',
    signInRequired: 'Sign in to manage home composer.',
    validationTitle: 'Validation panel',
    validationDescription: 'Draft validation and governance feedback before publishing.',
    loadingComposer: 'Loading composer configuration…',
    sectionControlsTitle: 'Section controls',
    sectionControlsDescription: 'Enable sections and control the order they render on the homepage.',
    enabled: 'Enabled',
    up: 'Up',
    down: 'Down',
    heroTitle: 'Hero',
    heroDescription: 'Main heading, CTAs, trust strip, and hero image selection.',
    heading: 'Heading',
    subheading: 'Subheading',
    primaryCtaLabel: 'Primary CTA label',
    primaryCtaUrl: 'Primary CTA URL',
    secondaryCtaLabel: 'Secondary CTA label',
    secondaryCtaUrl: 'Secondary CTA URL',
    heroImageLabel: 'Hero image (`/media/...` only)',
    chooseMedia: 'Choose media',
    chooseHeroImageMedia: 'Choose hero image media',
    heroImagePickerTitle: 'Hero image media picker',
    heroImagePickerDescription: 'Select a media asset for the hero image.',
    close: 'Close',
    noMediaItems: 'No media items available.',
    trustItemsLabel: 'Trust micro-strip items (one per line)',
    pathSelectorTitle: 'Path selector',
    pathSelectorDescription: 'Configure enabled journeys, labels, descriptions, and destination URLs.',
    label: 'Label',
    descriptionLabel: 'Description',
    url: 'URL',
    featuredProjectsTitle: 'Featured Projects',
    featuredProjectsDescription: 'Choose project selection mode, copy, and manual featured items.',
    featuredPropertiesTitle: 'Featured Properties',
    featuredPropertiesDescription: 'Choose property selection mode, copy, and manual featured items.',
    mode: 'Mode',
    fallbackRule: 'Fallback rule',
    subcopy: 'Subcopy',
    proofTrustTitle: 'Proof & trust',
    proofTrustDescription: 'Edit metrics, trust proofs, and process timeline blocks for the homepage.',
    whyPattayaMetricsJson: 'Why Pattaya metrics JSON',
    trustProofsJson: 'Trust proofs JSON',
    processTimelineJson: 'Process timeline JSON',
    supportingSectionsTitle: 'Supporting sections',
    supportingSectionsDescription: 'Configure supporting market, review, and video sections below the hero.',
    bottomCtaTitle: 'Bottom CTA',
    bottomCtaDescription: 'Final call-to-action content shown near the end of the homepage.',
    trustNote: 'Trust note',
    primaryLabel: 'Primary label',
    primaryUrl: 'Primary URL',
    secondaryLabel: 'Secondary label',
    secondaryUrl: 'Secondary URL',
    candidatePanelTitle: 'Media and entity candidates',
    candidatePanelDescription: 'Search media candidates and assign a local hero image.',
    searchPlaceholder: 'Search projects/properties/media',
    workspaceStatusTitle: 'Workspace status',
    workspaceStatusDescription: 'Current draft and publish status for the home composer page.',
    pageKey: 'Page key',
    draftVersion: 'Draft version',
    publishedVersion: 'Published version',
    publishedAt: 'Published at',
    notAvailable: 'N/A',
    rights: 'rights',
    approval: 'approval',
    signedInSessionActive: 'Signed in session active.',
    supportingEditorTitle: 'Market Insights / Reviews / Videos / Bottom CTA',
    supportingEditorDescription: 'Configure supporting sections and final CTA content in one editor block.',
    mediaPickerTitle: 'Media picker',
    mediaPickerDescription: 'Search media candidates and assign a local hero image.',
    composerStatusTitle: 'Composer status',
    composerStatusDescription: 'Current bundle metadata for draft and published variants.',
    selectProject: 'Select project',
    selectProperty: 'Select property',
    selectHeroImage: 'Select hero image',
    closeHeroImagePicker: 'Close hero image media picker',
    mustBeValidJsonArray: 'must be valid JSON array',
    mustBeJsonArray: 'must be a JSON array',
    sessionExpired: 'Session expired. Please sign in again.',
    loadComposerError: 'Unable to load home composer',
    loadComposerStateDescription: 'Reconnect and load the composer bundle before editing this page.',
    loadCandidatesError: 'Unable to load candidates',
    loginMissing: 'Email and password are required.',
    loginInvalid: 'Invalid credentials.',
    loginError: 'Unable to sign in right now.',
    draftSaved: 'Draft saved',
    publishedNotice: 'Published',
    saveDraftError: 'Unable to save draft',
    publishError: 'Unable to publish',
    heroImageLocalOnlyError: 'Hero image must use local media only.',
    rightsUnknown: 'unknown',
    approvalUnknown: 'unknown',
    auto: 'auto',
    manual: 'manual',
  },
  th: {
    eyebrow: 'จัดวางคอนเทนต์หน้าแรก',
    pageTitle: 'คอมโพสหน้าแรก',
    pageDescription: 'จัดการส่วนประกอบหน้าแรก ข้อความฮีโร่ สื่อหลัก และรายการแนะนำ พร้อมตรวจสอบก่อนเผยแพร่',
    localeLabel: 'ภาษา',
    refresh: 'รีเฟรช',
    refreshing: 'กำลังรีเฟรช…',
    saveDraft: 'บันทึกร่าง',
    saving: 'กำลังบันทึก…',
    publish: 'เผยแพร่',
    publishing: 'กำลังเผยแพร่…',
    signOut: 'ออกจากระบบ',
    loginTitle: 'เข้าสู่ระบบแอดมิน',
    loginSubtitle: 'ใช้บัญชีแอดมินเดียวกับ /api/v1/auth/login',
    adminEmail: 'อีเมลแอดมิน',
    password: 'รหัสผ่าน',
    signIn: 'เข้าสู่ระบบ',
    signingIn: 'กำลังเข้าสู่ระบบ',
    signedInFallback: 'มีเซสชันที่เข้าสู่ระบบอยู่',
    signedInAs: 'เข้าสู่ระบบเป็น',
    signedInDescription: 'เซสชันของหน้าคอมโพสหน้าแรกที่กำลังใช้งานอยู่',
    signInRequired: 'เข้าสู่ระบบก่อนจัดการคอมโพสหน้าแรก',
    validationTitle: 'แผงตรวจสอบก่อนเผยแพร่',
    validationDescription: 'สรุปข้อผิดพลาด คำเตือน และเงื่อนไขกำกับดูแลก่อนเผยแพร่หน้าแรก',
    loadingComposer: 'กำลังโหลดคอนฟิกของคอมโพสหน้าแรก…',
    sectionControlsTitle: 'จัดการลำดับส่วนแสดงผล',
    sectionControlsDescription: 'เปิดหรือปิดแต่ละส่วน และกำหนดลำดับการแสดงบนหน้าแรก',
    enabled: 'เปิดใช้งาน',
    up: 'เลื่อนขึ้น',
    down: 'เลื่อนลง',
    heroTitle: 'ฮีโร่หลัก',
    heroDescription: 'กำหนดข้อความหลัก ปุ่ม CTA แถบความน่าเชื่อถือ และภาพฮีโร่ของหน้าแรก',
    heading: 'หัวข้อหลัก',
    subheading: 'หัวข้อรอง',
    primaryCtaLabel: 'ข้อความปุ่มหลัก',
    primaryCtaUrl: 'ลิงก์ปุ่มหลัก',
    secondaryCtaLabel: 'ข้อความปุ่มรอง',
    secondaryCtaUrl: 'ลิงก์ปุ่มรอง',
    heroImageLabel: 'ภาพฮีโร่ (`/media/...` เท่านั้น)',
    chooseMedia: 'เลือกสื่อ',
    chooseHeroImageMedia: 'เลือกสื่อสำหรับภาพฮีโร่',
    heroImagePickerTitle: 'ตัวเลือกสื่อภาพฮีโร่',
    heroImagePickerDescription: 'เลือกไฟล์สื่อภายในระบบเพื่อใช้เป็นภาพหลักของหน้าแรก',
    close: 'ปิด',
    noMediaItems: 'ยังไม่มีรายการสื่อให้เลือก',
    trustItemsLabel: 'รายการข้อความความน่าเชื่อถือแบบสั้น (หนึ่งบรรทัดต่อหนึ่งรายการ)',
    pathSelectorTitle: 'ตัวเลือกเส้นทางผู้ใช้',
    pathSelectorDescription: 'ตั้งค่าชุดเส้นทางหลัก ข้อความอธิบาย และ URL ที่ใช้บนหน้าแรก',
    label: 'ข้อความป้าย',
    descriptionLabel: 'คำอธิบาย',
    url: 'URL',
    featuredProjectsTitle: 'โครงการแนะนำ',
    featuredProjectsDescription: 'เลือกโหมดการดึงโครงการ ข้อความประกอบ และรายการที่ต้องการปักหมุด',
    featuredPropertiesTitle: 'ทรัพย์แนะนำ',
    featuredPropertiesDescription: 'เลือกโหมดการดึงทรัพย์ ข้อความประกอบ และรายการที่ต้องการปักหมุด',
    mode: 'โหมด',
    fallbackRule: 'กติกา fallback',
    subcopy: 'ข้อความรอง',
    proofTrustTitle: 'ส่วนสร้างความน่าเชื่อถือ',
    proofTrustDescription: 'จัดการข้อมูลตัวเลขยืนยันความน่าสนใจ หลักฐานความน่าเชื่อถือ และลำดับขั้นการทำงานของหน้าแรก',
    whyPattayaMetricsJson: 'JSON ตัวเลข Why Pattaya',
    trustProofsJson: 'JSON หลักฐานความน่าเชื่อถือ',
    processTimelineJson: 'JSON ลำดับขั้นการทำงาน',
    supportingSectionsTitle: 'ส่วนสนับสนุน',
    supportingSectionsDescription: 'ตั้งค่าบล็อกข้อมูลตลาด รีวิว และวิดีโอที่อยู่ถัดจากส่วนหลัก',
    bottomCtaTitle: 'CTA ท้ายหน้า',
    bottomCtaDescription: 'กำหนดข้อความและปุ่มกระตุ้นการตัดสินใจช่วงท้ายของหน้าแรก',
    trustNote: 'ข้อความสร้างความมั่นใจ',
    primaryLabel: 'ข้อความปุ่มหลัก',
    primaryUrl: 'URL ปุ่มหลัก',
    secondaryLabel: 'ข้อความปุ่มรอง',
    secondaryUrl: 'URL ปุ่มรอง',
    candidatePanelTitle: 'ตัวเลือกสื่อและรายการอ้างอิง',
    candidatePanelDescription: 'ค้นหาสื่อ โครงการ และทรัพย์ที่พร้อมนำมาใช้กับภาพฮีโร่',
    searchPlaceholder: 'ค้นหาโครงการ ทรัพย์ หรือสื่อ',
    workspaceStatusTitle: 'สถานะพื้นที่ทำงาน',
    workspaceStatusDescription: 'สรุปสถานะร่างและเวอร์ชันที่เผยแพร่แล้วของคอมโพสหน้าแรก',
    pageKey: 'รหัสเพจ',
    draftVersion: 'เวอร์ชันร่าง',
    publishedVersion: 'เวอร์ชันที่เผยแพร่',
    publishedAt: 'เผยแพร่เมื่อ',
    notAvailable: 'ไม่มี',
    rights: 'สิทธิ์',
    approval: 'อนุมัติ',
    signedInSessionActive: 'มีเซสชันที่เข้าสู่ระบบอยู่',
    supportingEditorTitle: 'ส่วนข้อมูลตลาด รีวิว วิดีโอ และ CTA ท้ายหน้า',
    supportingEditorDescription: 'ตั้งค่าบล็อกสนับสนุนและข้อความปิดการขายในพื้นที่เดียว',
    mediaPickerTitle: 'ตัวเลือกสื่อ',
    mediaPickerDescription: 'ค้นหาสื่อที่ใช้ได้และนำมาใช้กับภาพฮีโร่ของหน้าแรก',
    composerStatusTitle: 'สถานะคอมโพส',
    composerStatusDescription: 'สรุปข้อมูลร่างและเวอร์ชันที่เผยแพร่แล้วของหน้าแรก',
    selectProject: 'เลือกโครงการ',
    selectProperty: 'เลือกทรัพย์',
    selectHeroImage: 'เลือกภาพฮีโร่',
    closeHeroImagePicker: 'ปิดตัวเลือกสื่อภาพฮีโร่',
    mustBeValidJsonArray: 'ต้องเป็น JSON array ที่ถูกต้อง',
    mustBeJsonArray: 'ต้องเป็น JSON array',
    sessionExpired: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
    loadComposerError: 'ไม่สามารถโหลดคอมโพสหน้าแรกได้',
    loadComposerStateDescription: 'เชื่อมต่อและโหลดข้อมูลคอมโพสให้สำเร็จก่อนเริ่มแก้ไขหน้านี้',
    loadCandidatesError: 'ไม่สามารถโหลดรายการตัวเลือกได้',
    loginMissing: 'ต้องกรอกอีเมลและรหัสผ่าน',
    loginInvalid: 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง',
    loginError: 'ไม่สามารถเข้าสู่ระบบได้ในขณะนี้',
    draftSaved: 'บันทึกร่างแล้ว',
    publishedNotice: 'เผยแพร่แล้ว',
    saveDraftError: 'ไม่สามารถบันทึกร่างได้',
    publishError: 'ไม่สามารถเผยแพร่ได้',
    heroImageLocalOnlyError: 'ภาพฮีโร่ต้องใช้ไฟล์สื่อภายในระบบเท่านั้น',
    rightsUnknown: 'ไม่ทราบสถานะ',
    approvalUnknown: 'ไม่ทราบการอนุมัติ',
    auto: 'อัตโนมัติ',
    manual: 'เลือกเอง',
  },
} as const;

type HomeComposerCopy = Record<keyof typeof HOME_COMPOSER_COPY.en, string>;

const SECTION_LABELS: Record<SectionKey, Record<LocaleCode, string>> = {
  hero: { en: 'hero', th: 'ฮีโร่หลัก' },
  path_selector: { en: 'path selector', th: 'ตัวเลือกเส้นทาง' },
  featured_projects: { en: 'featured projects', th: 'โครงการแนะนำ' },
  featured_properties: { en: 'featured properties', th: 'ทรัพย์แนะนำ' },
  proof_trust: { en: 'proof & trust', th: 'ส่วนสร้างความน่าเชื่อถือ' },
  market_insights: { en: 'market insights', th: 'ข้อมูลตลาด' },
  reviews: { en: 'reviews', th: 'รีวิว' },
  videos: { en: 'videos', th: 'วิดีโอ' },
  bottom_cta: { en: 'bottom cta', th: 'CTA ท้ายหน้า' },
};

const PATH_KEY_LABELS: Record<string, Record<LocaleCode, string>> = {
  buy: { en: 'buy', th: 'ซื้อ' },
  invest: { en: 'invest', th: 'ลงทุน' },
  rent: { en: 'rent', th: 'เช่า' },
  sell: { en: 'sell', th: 'ขาย' },
};

const SECTION_KEYS = [
  'hero',
  'path_selector',
  'featured_projects',
  'featured_properties',
  'proof_trust',
  'market_insights',
  'reviews',
  'videos',
  'bottom_cta',
] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

type HomeComposerConfig = {
  enabled_sections: SectionKey[];
  section_order: SectionKey[];
  hero: {
    heading?: string;
    subheading?: string;
    primary_cta_label?: string;
    primary_cta_url?: string;
    secondary_cta_label?: string;
    secondary_cta_url?: string;
    trust_items?: string[];
    hero_image?: string | null;
  };
  path_selector: {
    enabled?: boolean;
    paths?: Array<{ key: string; label?: string; description?: string; url?: string }>;
  };
  featured_projects: {
    enabled?: boolean;
    mode?: 'manual' | 'auto';
    selected_project_ids?: string[];
    selected_project_slugs?: string[];
    heading?: string;
    subcopy?: string;
    fallback_rule?: string;
  };
  featured_properties: {
    enabled?: boolean;
    mode?: 'manual' | 'auto';
    selected_property_ids?: string[];
    selected_source_ids?: string[];
    heading?: string;
    subcopy?: string;
    fallback_rule?: string;
  };
  proof_trust: {
    enabled?: boolean;
    why_pattaya_metrics?: Array<Record<string, unknown>>;
    trust_proofs?: Array<Record<string, unknown>>;
    process_timeline?: Array<Record<string, unknown>>;
  };
  market_insights: { enabled?: boolean; heading?: string; subcopy?: string; mode?: string };
  reviews: { enabled?: boolean; heading?: string; subcopy?: string; mode?: string };
  videos: { enabled?: boolean; heading?: string; subcopy?: string; mode?: string };
  bottom_cta: {
    enabled?: boolean;
    heading?: string;
    subheading?: string;
    trust_note?: string;
    primary_cta_label?: string;
    primary_cta_url?: string;
    secondary_cta_label?: string;
    secondary_cta_url?: string;
  };
};

function defaultConfig(): HomeComposerConfig {
  return {
    enabled_sections: [...SECTION_KEYS],
    section_order: [...SECTION_KEYS],
    hero: {
      heading: '',
      subheading: '',
      primary_cta_label: '',
      primary_cta_url: '/contact',
      secondary_cta_label: '',
      secondary_cta_url: '/projects',
      trust_items: [],
      hero_image: null,
    },
    path_selector: {
      enabled: true,
      paths: [
        { key: 'buy', label: '', description: '', url: '/buy' },
        { key: 'invest', label: '', description: '', url: '/invest' },
        { key: 'rent', label: '', description: '', url: '/rent' },
        { key: 'sell', label: '', description: '', url: '/sell' },
      ],
    },
    featured_projects: {
      enabled: true,
      mode: 'auto',
      selected_project_ids: [],
      selected_project_slugs: [],
      heading: '',
      subcopy: '',
      fallback_rule: 'priority_recent',
    },
    featured_properties: {
      enabled: true,
      mode: 'auto',
      selected_property_ids: [],
      selected_source_ids: [],
      heading: '',
      subcopy: '',
      fallback_rule: 'mixed_recent',
    },
    proof_trust: {
      enabled: true,
      why_pattaya_metrics: [],
      trust_proofs: [],
      process_timeline: [],
    },
    market_insights: { enabled: true, heading: '', subcopy: '', mode: 'fallback' },
    reviews: { enabled: true, heading: '', subcopy: '', mode: 'fallback' },
    videos: { enabled: true, heading: '', subcopy: '', mode: 'fallback' },
    bottom_cta: {
      enabled: true,
      heading: '',
      subheading: '',
      trust_note: '',
      primary_cta_label: '',
      primary_cta_url: '/contact',
      secondary_cta_label: '',
      secondary_cta_url: '/invest',
    },
  };
}

function normalizeConfig(input: Record<string, unknown> | null | undefined): HomeComposerConfig {
  const base = defaultConfig();
  if (!input || typeof input !== 'object') return base;
  return {
    ...base,
    ...input,
    hero: { ...base.hero, ...(input.hero as Record<string, unknown> ?? {}) },
    path_selector: { ...base.path_selector, ...(input.path_selector as Record<string, unknown> ?? {}) },
    featured_projects: { ...base.featured_projects, ...(input.featured_projects as Record<string, unknown> ?? {}) },
    featured_properties: { ...base.featured_properties, ...(input.featured_properties as Record<string, unknown> ?? {}) },
    proof_trust: { ...base.proof_trust, ...(input.proof_trust as Record<string, unknown> ?? {}) },
    market_insights: { ...base.market_insights, ...(input.market_insights as Record<string, unknown> ?? {}) },
    reviews: { ...base.reviews, ...(input.reviews as Record<string, unknown> ?? {}) },
    videos: { ...base.videos, ...(input.videos as Record<string, unknown> ?? {}) },
    bottom_cta: { ...base.bottom_cta, ...(input.bottom_cta as Record<string, unknown> ?? {}) },
  } as HomeComposerConfig;
}

function detectLocale(): LocaleCode {
  return detectAdminLocale();
}

function parseJsonArray(text: string, fieldName: string, t: HomeComposerCopy): Array<Record<string, unknown>> {
  const raw = text.trim();
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${fieldName} ${t.mustBeValidJsonArray}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`${fieldName} ${t.mustBeJsonArray}`);
  }
  return parsed as Array<Record<string, unknown>>;
}

function prettyJson(value: unknown): string {
  if (!value || !Array.isArray(value) || value.length === 0) return '[]';
  return JSON.stringify(value, null, 2);
}

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function prettyDate(value: string | null | undefined, locale: LocaleCode, t: HomeComposerCopy): string {
  if (!value) return t.notAvailable;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function syncLegacyTokenFromUnifiedSession(): SeededAuthSession | null {
  if (typeof window === 'undefined') return null;
  const session = readAuthSession();
  if (session) {
    setToken(session.token);
    return session;
  }

  const current = getToken();
  if (current?.trim()) {
    const token = current.trim();
    persistAuthSession(token, '');
    return { token, email: '' };
  }

  const legacy = window.localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY) || '';
  if (legacy.trim()) {
    const token = legacy.trim();
    setToken(token);
    persistAuthSession(token, '');
    window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
    return { token, email: '' };
  }
  return null;
}

export default function HomeComposerPage() {
  const [authToken, setAuthToken] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [locale, setLocale] = useState<LocaleCode>('en');
  const [bundle, setBundle] = useState<ComposerBundle | null>(null);
  const [config, setConfig] = useState<HomeComposerConfig>(defaultConfig());

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const [projectCandidates, setProjectCandidates] = useState<CandidateProject[]>([]);
  const [propertyCandidates, setPropertyCandidates] = useState<CandidateProperty[]>([]);
  const [mediaCandidates, setMediaCandidates] = useState<MediaAsset[]>([]);
  const [candidateSearch, setCandidateSearch] = useState('');

  const [metricsText, setMetricsText] = useState('[]');
  const [trustProofsText, setTrustProofsText] = useState('[]');
  const [processTimelineText, setProcessTimelineText] = useState('[]');
  const [trustItemsText, setTrustItemsText] = useState('');
  const [heroImageError, setHeroImageError] = useState<string | null>(null);
  const [heroMediaModalOpen, setHeroMediaModalOpen] = useState(false);
  const heroMediaCloseButtonRef = useRef<HTMLButtonElement | null>(null);

  const draftId = bundle?.draft?.id ?? null;
  const isAuthenticated = authToken.trim().length > 0;
  const t: HomeComposerCopy = HOME_COMPOSER_COPY[locale];
  const hasComposerData = Boolean(bundle?.draft || bundle?.published);

  const selectedProjectIds = useMemo(() => new Set(config.featured_projects.selected_project_ids || []), [config.featured_projects.selected_project_ids]);
  const selectedPropertyIds = useMemo(() => new Set(config.featured_properties.selected_property_ids || []), [config.featured_properties.selected_property_ids]);

  const clearComposerSession = useCallback((nextAuthError?: string): void => {
    setToken(null);
    clearAuthSession();
    setAuthToken('');
    setAuthEmail('');
    setLoginEmail('');
    setLoginPassword('');
    setBundle(null);
    setProjectCandidates([]);
    setPropertyCandidates([]);
    setMediaCandidates([]);
    setValidation(null);
    setNotice(null);
    setSaving(false);
    setPublishing(false);
    setLoading(false);
    setHeroImageError(null);
    setHeroMediaModalOpen(false);
    if (nextAuthError) {
      setAuthError(nextAuthError);
    }
  }, []);

  const handleComposerUnauthorized = useCallback((err: unknown): boolean => {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      clearComposerSession(t.sessionExpired);
      return true;
    }
    return false;
  }, [clearComposerSession, t.sessionExpired]);

  const loadBundle = useCallback(async (targetLocale: LocaleCode): Promise<void> => {
    const activeToken = getToken();
    if (!activeToken?.trim()) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      let nextBundle: ComposerBundle;
      try {
        nextBundle = await apiRequest<ComposerBundle>(`/admin/home-composer?page_key=home&locale=${targetLocale}`);
      } catch (err) {
        if (handleComposerUnauthorized(err)) return;
        throw err;
      }

      if (!nextBundle.draft) {
        const created = await apiRequest<ComposerItem>('/admin/home-composer', {
          method: 'POST',
          body: JSON.stringify({ page_key: 'home', locale: targetLocale, config: defaultConfig() }),
        });
        nextBundle = { ...nextBundle, draft: created };
      }

      setBundle(nextBundle);
      const rawConfig = normalizeConfig((nextBundle.draft?.config ?? nextBundle.published?.config ?? defaultConfig()) as Record<string, unknown>);
      setConfig(rawConfig);
      setMetricsText(prettyJson(rawConfig.proof_trust.why_pattaya_metrics));
      setTrustProofsText(prettyJson(rawConfig.proof_trust.trust_proofs));
      setProcessTimelineText(prettyJson(rawConfig.proof_trust.process_timeline));
      setTrustItemsText((rawConfig.hero.trust_items || []).join('\n'));
      setValidation(null);
      setHeroImageError(null);
      setHeroMediaModalOpen(false);
    } catch (err) {
      if (handleComposerUnauthorized(err)) return;
      setError(err instanceof Error ? err.message : t.loadComposerError);
    } finally {
      setLoading(false);
    }
  }, [handleComposerUnauthorized, t.loadComposerError]);

  const loadMediaCandidates = useCallback(async (term: string): Promise<MediaAsset[]> => {
    const params = new URLSearchParams();
    params.set('limit', '60');
    if (term.trim()) {
      params.set('q', term.trim());
    }

    const body = await apiRequest<MediaWorkspaceListResponse>(`/admin/media?${params.toString()}`);
    const rows = Array.isArray(body.items) ? body.items : [];

    return rows
      .filter((item) => (item.kind || 'image') === 'image')
      .filter((item) => !item.status || item.status === 'active')
      .map((item) => ({
        id: item.id,
        storage_path: item.storage_path,
        rights_status: item.rights_status ?? null,
        approval_status: item.approval_status ?? null,
        is_exception: Boolean(item.is_exception),
      }));
  }, []);

  const loadCandidates = useCallback(async (term: string): Promise<void> => {
    const activeToken = getToken();
    if (!activeToken?.trim()) return;
    try {
      const query = term.trim() ? `?search=${encodeURIComponent(term.trim())}` : '';
      const [projects, properties, media] = await Promise.allSettled([
        apiRequest<CandidateProject[]>(`/admin/home-composer/candidates/projects${query}`),
        apiRequest<CandidateProperty[]>(`/admin/home-composer/candidates/properties${query}`),
        loadMediaCandidates(term),
      ]);
      const nextProjects = projects.status === 'fulfilled' ? projects.value : [];
      const nextProperties = properties.status === 'fulfilled' ? properties.value : [];
      const nextMedia = media.status === 'fulfilled' ? media.value : [];

      setProjectCandidates(nextProjects);
      setPropertyCandidates(nextProperties);
      setMediaCandidates(nextMedia);

      if (
        projects.status === 'rejected' &&
        properties.status === 'rejected' &&
        media.status === 'rejected'
      ) {
        setError(t.loadCandidatesError);
      } else {
        setError((current) => (current === t.loadCandidatesError ? null : current));
      }
    } catch (err) {
      if (handleComposerUnauthorized(err)) return;
      setError(t.loadCandidatesError);
    }
  }, [handleComposerUnauthorized, loadMediaCandidates, t.loadCandidatesError]);

  useEffect(() => {
    setLocale(detectLocale());
    const seededSession = syncLegacyTokenFromUnifiedSession();
    if (!seededSession) return;
    setAuthToken(seededSession.token);
    setAuthEmail(seededSession.email);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadBundle(locale);
  }, [isAuthenticated, loadBundle, locale]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setTimeout(() => {
      void loadCandidates(candidateSearch);
    }, 250);
    return () => clearTimeout(timer);
  }, [candidateSearch, isAuthenticated, loadCandidates]);

  useEffect(() => {
    if (!heroMediaModalOpen) return;
    heroMediaCloseButtonRef.current?.focus();
  }, [heroMediaModalOpen]);

  useEffect(() => {
    if (!heroMediaModalOpen) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setHeroMediaModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [heroMediaModalOpen]);

  const handleLocaleChange = useCallback((nextLocale: LocaleCode): void => {
    setLocale(nextLocale);
    persistAdminLocale(nextLocale);
    if (typeof window === 'undefined') return;
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('lang', nextLocale);
    window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  }, []);

  async function login(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const email = loginEmail.trim();
    const password = loginPassword;
    if (!email || !password) {
      setAuthError(t.loginMissing);
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = await loginAdmin(email, password);
      if (!result.ok) {
        setAuthError(result.status === 401 ? t.loginInvalid : t.loginError);
        return;
      }
      const token = result.accessToken;
      setToken(token);
      persistAuthSession(token, email);
      setAuthToken(token);
      setAuthEmail(email);
      setLoginPassword('');
      setError(null);
      await Promise.all([loadBundle(locale), loadCandidates(candidateSearch)]);
    } catch {
      setAuthError(t.loginError);
    } finally {
      setAuthLoading(false);
    }
  }

  function logout(): void {
    setAuthError(null);
    setError(null);
    clearComposerSession();
  }

  function updateSectionEnabled(section: SectionKey, enabled: boolean): void {
    const next = new Set(config.enabled_sections || []);
    if (enabled) next.add(section);
    else next.delete(section);
    setConfig((prev) => ({ ...prev, enabled_sections: SECTION_KEYS.filter((key) => next.has(key)) }));
  }

  function moveSection(section: SectionKey, direction: -1 | 1): void {
    const order = [...(config.section_order || SECTION_KEYS)];
    const idx = order.indexOf(section);
    const nextIdx = idx + direction;
    if (idx < 0 || nextIdx < 0 || nextIdx >= order.length) return;
    [order[idx], order[nextIdx]] = [order[nextIdx], order[idx]];
    setConfig((prev) => ({ ...prev, section_order: order }));
  }

  function toggleProjectSelection(id: string): void {
    const current = [...(config.featured_projects.selected_project_ids || [])];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    setConfig((prev) => ({
      ...prev,
      featured_projects: {
        ...prev.featured_projects,
        selected_project_ids: next,
      },
    }));
  }

  function togglePropertySelection(id: string): void {
    const current = [...(config.featured_properties.selected_property_ids || [])];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    setConfig((prev) => ({
      ...prev,
      featured_properties: {
        ...prev.featured_properties,
        selected_property_ids: next,
      },
    }));
  }

  function updateHeroImage(nextValue: string | null): void {
    const raw = nextValue ?? '';
    const trimmed = raw.trim();
    setConfig((prev) => ({ ...prev, hero: { ...prev.hero, hero_image: raw || null } }));
    if (!trimmed) {
      setHeroImageError(null);
      return;
    }
    setHeroImageError(normalizeLocalMediaPath(trimmed) ? null : t.heroImageLocalOnlyError);
  }

  function selectHeroMedia(nextValue: string): void {
    const normalized = normalizeLocalMediaPath(nextValue);
    if (!normalized) {
      setHeroImageError(t.heroImageLocalOnlyError);
      return;
    }
    setHeroImageError(null);
    setConfig((prev) => ({ ...prev, hero: { ...prev.hero, hero_image: normalized } }));
    setHeroMediaModalOpen(false);
  }

  function readConfigForSave(): HomeComposerConfig {
    const heroImageValue = (config.hero.hero_image || '').trim();
    const normalizedHeroImage = heroImageValue ? normalizeLocalMediaPath(heroImageValue) : null;
    if (heroImageValue && !normalizedHeroImage) {
      setHeroImageError(t.heroImageLocalOnlyError);
    }
    const safeHeroImage = heroImageValue && normalizedHeroImage ? normalizedHeroImage : null;
    return {
      ...config,
      hero: {
        ...config.hero,
        hero_image: safeHeroImage,
        trust_items: splitLines(trustItemsText),
      },
      proof_trust: {
        ...config.proof_trust,
        why_pattaya_metrics: parseJsonArray(metricsText, t.whyPattayaMetricsJson, t),
        trust_proofs: parseJsonArray(trustProofsText, t.trustProofsJson, t),
        process_timeline: parseJsonArray(processTimelineText, t.processTimelineJson, t),
      },
    };
  }

  async function saveDraftRequest(showNotice: boolean): Promise<boolean> {
    if (!draftId) return false;
    setSaving(true);
    setError(null);
    if (showNotice) {
      setNotice(null);
    }
    try {
      const payloadConfig = readConfigForSave();
      const res = await apiRequest<SaveResponse>(`/admin/home-composer/${draftId}`, {
        method: 'PATCH',
        body: JSON.stringify({ config: payloadConfig }),
      });
      setValidation(res.validation);
      if (showNotice) {
        setNotice(t.draftSaved);
      }
      setBundle((prev) => prev ? ({ ...prev, draft: res.item }) : prev);
      setConfig(normalizeConfig(res.item.config as Record<string, unknown>));
      return true;
    } catch (err) {
      if (handleComposerUnauthorized(err)) return false;
      setError(err instanceof Error ? err.message : t.saveDraftError);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft(): Promise<void> {
    await saveDraftRequest(true);
  }

  async function handlePublish(): Promise<void> {
    if (!draftId) return;
    setPublishing(true);
    setError(null);
    setNotice(null);
    try {
      const saved = await saveDraftRequest(false);
      if (!saved) return;
      const res = await apiRequest<SaveResponse>(`/admin/home-composer/${draftId}/publish`, {
        method: 'POST',
      });
      setValidation(res.validation);
      setNotice(t.publishedNotice);
      setBundle((prev) => prev ? ({ ...prev, published: res.item }) : prev);
    } catch (err) {
      if (handleComposerUnauthorized(err)) return;
      setError(err instanceof Error ? err.message : t.publishError);
    } finally {
      setPublishing(false);
    }
  }

  const mediaBadgeClass = (asset: MediaAsset): string => {
    const rights = (asset.rights_status || '').toLowerCase();
    const approval = (asset.approval_status || '').toLowerCase();
    if (rights === 'restricted' || rights === 'rejected' || approval === 'rejected') {
      return 'home-composer-media-status home-composer-media-status--error';
    }
    if (rights === 'pending_review' || rights === 'exception_allowed' || approval === 'pending' || asset.is_exception) {
      return 'home-composer-media-status home-composer-media-status--warn';
    }
    return 'home-composer-media-status home-composer-media-status--ok';
  };

  const translateComposerStatus = (value: string | null | undefined): string => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const normalized = raw.toLowerCase();
    if (locale === 'th') {
      if (normalized === 'approved') return 'อนุมัติแล้ว';
      if (normalized === 'active') return 'ใช้งานอยู่';
      if (normalized === 'published') return 'เผยแพร่แล้ว';
      if (normalized === 'pending' || normalized === 'pending_review') return 'รอตรวจสอบ';
      if (normalized === 'draft') return 'ฉบับร่าง';
      if (normalized === 'archived') return 'เก็บเข้าคลัง';
      if (normalized === 'rejected') return 'ไม่อนุมัติ';
      if (normalized === 'blocked') return 'ถูกบล็อก';
      if (normalized === 'restricted') return 'จำกัดสิทธิ์';
      if (normalized === 'exception_allowed') return 'ยกเว้นได้';
      if (normalized === 'inactive') return 'ปิดใช้งาน';
    } else {
      if (normalized === 'pending_review') return 'pending review';
      if (normalized === 'exception_allowed') return 'exception allowed';
    }
    return raw.replace(/_/g, ' ');
  };

  const formatMediaCompliance = (asset: MediaAsset): string => {
    const rights = translateComposerStatus(asset.rights_status) || t.rightsUnknown;
    const approval = translateComposerStatus(asset.approval_status) || t.approvalUnknown;
    return `${t.rights}=${rights} · ${t.approval}=${approval}`;
  };

  const formatCandidateProjectMeta = (item: CandidateProject): string =>
    [item.slug, translateComposerStatus(item.status)].filter(Boolean).join(' · ');

  const formatCandidatePropertyMeta = (item: CandidateProperty): string =>
    [item.source_id, translateComposerStatus(item.status), item.type].filter(Boolean).join(' · ');

  const sectionLabel = (section: SectionKey): string => SECTION_LABELS[section]?.[locale] ?? section;
  const pathKeyLabel = (key: string): string => PATH_KEY_LABELS[key]?.[locale] ?? key;

  return (
    <AdminPage className="home-composer-stack">
      <AdminPageHeader
        title={t.pageTitle}
        description={t.pageDescription}
        icon="spark"
        eyebrow={t.eyebrow}
        actions={
          <div className="home-composer-toolbar">
            <label className="home-composer-form-field home-composer-inline-field">
              {t.localeLabel}
              <select
                value={locale}
                onChange={(e) => handleLocaleChange(e.target.value as LocaleCode)}
                className="home-composer-form-control"
              >
                <option value="en">EN</option>
                <option value="th">TH</option>
              </select>
            </label>
            {isAuthenticated ? (
              <>
                <AdminButton type="button" variant="secondary" icon="refresh" onClick={() => void loadBundle(locale)} disabled={loading}>
                  {loading ? t.refreshing : t.refresh}
                </AdminButton>
                <AdminButton type="button" variant="primary" icon="plus" onClick={() => void handleSaveDraft()} disabled={saving || loading}>
                  {saving ? t.saving : t.saveDraft}
                </AdminButton>
                <AdminButton type="button" variant="secondary" icon="upload" onClick={() => void handlePublish()} disabled={publishing || loading}>
                  {publishing ? t.publishing : t.publish}
                </AdminButton>
                <AdminButton type="button" variant="secondary" icon="x" onClick={logout}>
                  {t.signOut}
                </AdminButton>
              </>
            ) : null}
          </div>
        }
      />

      <ActionCard
        className="dashboard-controls"
        title={isAuthenticated ? (authEmail || t.signedInFallback) : t.loginTitle}
        description={isAuthenticated ? t.signedInDescription : t.loginSubtitle}
        icon={isAuthenticated ? 'profile' : 'home'}
        titleTag="h2"
      >
        {!isAuthenticated ? (
          <form className="crm-login-form" method="post" onSubmit={(event) => void login(event)}>
            <label className="field" htmlFor="home-composer-login-email">
              <span>{t.adminEmail}</span>
              <input
                id="home-composer-login-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
            </label>

            <label className="field" htmlFor="home-composer-login-password">
              <span>{t.password}</span>
              <input
                id="home-composer-login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />
            </label>

            {authError ? <div className="state-error">{authError}</div> : null}

            <div className="card-actions">
              <AdminButton variant="primary" icon="workspace" type="submit" disabled={authLoading}>
                {authLoading ? t.signingIn : t.signIn}
              </AdminButton>
            </div>
          </form>
        ) : (
          <div className="crm-session-panel" role="status" aria-live="polite">
            <p className="locale-safe">{authEmail ? `${t.signedInAs} ${authEmail}` : t.signedInSessionActive}</p>
          </div>
        )}
        {!isAuthenticated ? <div className="state-empty">{t.signInRequired}</div> : null}
      </ActionCard>

      {isAuthenticated ? (
        <AdminPageBody className="home-composer-stack">
          {error && hasComposerData ? <div className="home-composer-banner home-composer-banner--error">{error}</div> : null}
          {notice ? <div className="home-composer-banner home-composer-banner--success">{notice}</div> : null}

          {!loading && !hasComposerData ? (
            <ActionCard
              className="home-composer-card"
              title={t.loadComposerError}
              description={t.loadComposerStateDescription}
              icon="warning"
              titleTag="h2"
            >
              <div className="state-error">{error || t.loadComposerError}</div>
              <div className="card-actions">
                <AdminButton type="button" variant="primary" icon="refresh" onClick={() => void loadBundle(locale)}>
                  {t.refresh}
                </AdminButton>
              </div>
            </ActionCard>
          ) : null}

          {hasComposerData && validation && (validation.errors.length > 0 || validation.warnings.length > 0 || validation.media_warnings.length > 0) ? (
            <ActionCard
              className="home-composer-card home-composer-card--compact"
              title={t.validationTitle}
              description={t.validationDescription}
              icon="warning"
              titleTag="h2"
            >
              {validation.errors.length > 0 ? (
                <ul className="home-composer-validation-list home-composer-validation-list--error">
                  {validation.errors.map((item, index) => <li key={`error-${index}`}>{item}</li>)}
                </ul>
              ) : null}
              {validation.warnings.length > 0 ? (
                <ul className="home-composer-validation-list home-composer-validation-list--warn">
                  {validation.warnings.map((item, index) => <li key={`warn-${index}`}>{item}</li>)}
                </ul>
              ) : null}
              {validation.media_warnings.length > 0 ? (
                <ul className="home-composer-validation-list home-composer-validation-list--warn">
                  {validation.media_warnings.map((item, index) => <li key={`media-${index}`}>{item.path} — {item.detail}</li>)}
                </ul>
              ) : null}
            </ActionCard>
          ) : null}

          {loading ? (
            <div className="home-composer-loading">{t.loadingComposer}</div>
          ) : null}

          {hasComposerData ? (
          <div className="home-composer-split">
          <section className="home-composer-stack">
            <ActionCard
              className="home-composer-card"
              bodyClassName="home-composer-stack"
              title={t.sectionControlsTitle}
              description={t.sectionControlsDescription}
              icon="settings"
              titleTag="h2"
            >
              <div className="home-composer-stack home-composer-stack--compact">
                {(config.section_order || SECTION_KEYS).map((section, idx) => (
                  <div key={section} className="home-composer-config-block home-composer-list-item">
                    <label className="home-composer-toggle-label">
                      <input
                        type="checkbox"
                        checked={(config.enabled_sections || []).includes(section)}
                        onChange={(e) => updateSectionEnabled(section, e.target.checked)}
                      />
                      {sectionLabel(section)}
                    </label>
                    <div className="home-composer-button-group">
                      <AdminButton type="button" variant="secondary" size="sm" onClick={() => moveSection(section, -1)} disabled={idx === 0}>
                        {t.up}
                      </AdminButton>
                      <AdminButton type="button" variant="secondary" size="sm" onClick={() => moveSection(section, 1)} disabled={idx === (config.section_order || SECTION_KEYS).length - 1}>
                        {t.down}
                      </AdminButton>
                    </div>
                  </div>
                ))}
              </div>
            </ActionCard>

            <ActionCard
              className="home-composer-card"
              bodyClassName="home-composer-stack"
              title={t.heroTitle}
              description={t.heroDescription}
              icon="home"
              titleTag="h2"
            >
              <div className="home-composer-dual-grid">
                <label className="home-composer-form-field">{t.heading}<input value={config.hero.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, heading: e.target.value } }))} className="home-composer-form-control" /></label>
                <label className="home-composer-form-field">{t.subheading}<input value={config.hero.subheading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, subheading: e.target.value } }))} className="home-composer-form-control" /></label>
                <label className="home-composer-form-field">{t.primaryCtaLabel}<input value={config.hero.primary_cta_label || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, primary_cta_label: e.target.value } }))} className="home-composer-form-control" /></label>
                <label className="home-composer-form-field">{t.primaryCtaUrl}<input value={config.hero.primary_cta_url || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, primary_cta_url: e.target.value } }))} className="home-composer-form-control" /></label>
                <label className="home-composer-form-field">{t.secondaryCtaLabel}<input value={config.hero.secondary_cta_label || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, secondary_cta_label: e.target.value } }))} className="home-composer-form-control" /></label>
                <label className="home-composer-form-field">{t.secondaryCtaUrl}<input value={config.hero.secondary_cta_url || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, secondary_cta_url: e.target.value } }))} className="home-composer-form-control" /></label>
              </div>
              <label className="home-composer-form-field">{t.heroImageLabel}
                <div className="home-composer-inline-field">
                  <input
                    value={config.hero.hero_image || ''}
                    onChange={(e) => updateHeroImage(e.target.value)}
                    className="home-composer-form-control"
                    aria-invalid={!!heroImageError}
                    aria-describedby={heroImageError ? 'hero-image-error' : undefined}
                  />
                  <AdminButton type="button" variant="secondary" size="sm" aria-label={t.chooseHeroImageMedia} onClick={() => setHeroMediaModalOpen(true)}>
                    {t.chooseMedia}
                  </AdminButton>
                </div>
              </label>
              {heroImageError ? (
                <p id="hero-image-error" className="home-composer-banner home-composer-banner--error" role="alert">
                  {heroImageError}
                </p>
              ) : null}
              {heroMediaModalOpen ? (
                <div
                  className="home-composer-media-dialog"
                  role="dialog"
                  aria-modal="true"
                  aria-label={t.heroImagePickerTitle}
                >
                  <div className="home-composer-dialog-head">
                    <p className="home-composer-note">{t.heroImagePickerDescription}</p>
                    <button ref={heroMediaCloseButtonRef} type="button" aria-label={t.closeHeroImagePicker} className="btn btn-secondary admin-btn-sm" onClick={() => setHeroMediaModalOpen(false)}>
                      {t.close}
                    </button>
                  </div>
                  <div className="home-composer-media-list">
                    {mediaCandidates.length > 0 ? mediaCandidates.map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        aria-label={`${t.selectHeroImage} ${asset.storage_path || asset.id}`}
                        onClick={() => selectHeroMedia(asset.storage_path)}
                        className="home-composer-media-option"
                      >
                        <div className="home-composer-code">{asset.storage_path}</div>
                        <div className={`home-composer-media-status-badge ${mediaBadgeClass(asset)}`}>{formatMediaCompliance(asset)}</div>
                      </button>
                    )) : <div className="home-composer-note">{t.noMediaItems}</div>}
                  </div>
                </div>
              ) : null}
              <label className="home-composer-form-field">{t.trustItemsLabel}
                <textarea value={trustItemsText} onChange={(e) => setTrustItemsText(e.target.value)} rows={4} className="home-composer-form-control" />
              </label>
            </ActionCard>

            <ActionCard
              className="home-composer-card"
              bodyClassName="home-composer-stack"
              title={t.pathSelectorTitle}
              description={t.pathSelectorDescription}
              icon="filter"
              titleTag="h2"
            >
              <label className="home-composer-toggle-label">
                <input type="checkbox" checked={Boolean(config.path_selector.enabled)} onChange={(e) => setConfig((prev) => ({ ...prev, path_selector: { ...prev.path_selector, enabled: e.target.checked } }))} />
                {t.enabled}
              </label>
              {(config.path_selector.paths || []).map((path, idx) => (
                <div key={path.key || idx} className="home-composer-config-block">
                  <div className="home-composer-config-block-kicker">{pathKeyLabel(path.key)}</div>
                  <div className="home-composer-triple-grid">
                    <label className="home-composer-form-field">{t.label}<input value={path.label || ''} onChange={(e) => setConfig((prev) => {
                      const nextPaths = [...(prev.path_selector.paths || [])];
                      nextPaths[idx] = { ...nextPaths[idx], label: e.target.value };
                      return { ...prev, path_selector: { ...prev.path_selector, paths: nextPaths } };
                    })} className="home-composer-form-control" /></label>
                    <label className="home-composer-form-field">{t.descriptionLabel}<input value={path.description || ''} onChange={(e) => setConfig((prev) => {
                      const nextPaths = [...(prev.path_selector.paths || [])];
                      nextPaths[idx] = { ...nextPaths[idx], description: e.target.value };
                      return { ...prev, path_selector: { ...prev.path_selector, paths: nextPaths } };
                    })} className="home-composer-form-control" /></label>
                    <label className="home-composer-form-field">{t.url}<input value={path.url || ''} onChange={(e) => setConfig((prev) => {
                      const nextPaths = [...(prev.path_selector.paths || [])];
                      nextPaths[idx] = { ...nextPaths[idx], url: e.target.value };
                      return { ...prev, path_selector: { ...prev.path_selector, paths: nextPaths } };
                    })} className="home-composer-form-control" /></label>
                  </div>
                </div>
              ))}
            </ActionCard>

            <ActionCard
              className="home-composer-card"
              bodyClassName="home-composer-stack"
              title={t.featuredProjectsTitle}
              description={t.featuredProjectsDescription}
              icon="projects"
              titleTag="h2"
            >
              <div className="home-composer-dual-grid">
                <label className="home-composer-form-field">{t.mode}
                  <select value={config.featured_projects.mode || 'auto'} onChange={(e) => setConfig((prev) => ({ ...prev, featured_projects: { ...prev.featured_projects, mode: e.target.value as 'manual' | 'auto' } }))} className="home-composer-form-control">
                    <option value="auto">{t.auto}</option>
                    <option value="manual">{t.manual}</option>
                  </select>
                </label>
                <label className="home-composer-form-field">{t.fallbackRule}<input value={config.featured_projects.fallback_rule || ''} onChange={(e) => setConfig((prev) => ({ ...prev, featured_projects: { ...prev.featured_projects, fallback_rule: e.target.value } }))} className="home-composer-form-control" /></label>
                <label className="home-composer-form-field">{t.heading}<input value={config.featured_projects.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, featured_projects: { ...prev.featured_projects, heading: e.target.value } }))} className="home-composer-form-control" /></label>
                <label className="home-composer-form-field">{t.subcopy}<input value={config.featured_projects.subcopy || ''} onChange={(e) => setConfig((prev) => ({ ...prev, featured_projects: { ...prev.featured_projects, subcopy: e.target.value } }))} className="home-composer-form-control" /></label>
              </div>
              <div className="home-composer-option-list">
                {projectCandidates.map((item) => (
                  <div key={item.id} className="home-composer-option">
                    <input
                      id={`featured-project-${item.id}`}
                      type="checkbox"
                      checked={selectedProjectIds.has(item.id)}
                      onChange={() => toggleProjectSelection(item.id)}
                      aria-label={`${t.selectProject} ${item.name || item.slug || item.id}`}
                    />
                    <label htmlFor={`featured-project-${item.id}`} className="home-composer-option-label">
                      <span className="home-composer-option-title">{item.name || item.slug || item.id}</span>
                      <span className="home-composer-option-meta">{formatCandidateProjectMeta(item)}</span>
                    </label>
                  </div>
                ))}
              </div>
            </ActionCard>

            <ActionCard
              className="home-composer-card"
              bodyClassName="home-composer-stack"
              title={t.featuredPropertiesTitle}
              description={t.featuredPropertiesDescription}
              icon="properties"
              titleTag="h2"
            >
              <div className="home-composer-dual-grid">
                <label className="home-composer-form-field">{t.mode}
                  <select value={config.featured_properties.mode || 'auto'} onChange={(e) => setConfig((prev) => ({ ...prev, featured_properties: { ...prev.featured_properties, mode: e.target.value as 'manual' | 'auto' } }))} className="home-composer-form-control">
                    <option value="auto">{t.auto}</option>
                    <option value="manual">{t.manual}</option>
                  </select>
                </label>
                <label className="home-composer-form-field">{t.fallbackRule}<input value={config.featured_properties.fallback_rule || ''} onChange={(e) => setConfig((prev) => ({ ...prev, featured_properties: { ...prev.featured_properties, fallback_rule: e.target.value } }))} className="home-composer-form-control" /></label>
                <label className="home-composer-form-field">{t.heading}<input value={config.featured_properties.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, featured_properties: { ...prev.featured_properties, heading: e.target.value } }))} className="home-composer-form-control" /></label>
                <label className="home-composer-form-field">{t.subcopy}<input value={config.featured_properties.subcopy || ''} onChange={(e) => setConfig((prev) => ({ ...prev, featured_properties: { ...prev.featured_properties, subcopy: e.target.value } }))} className="home-composer-form-control" /></label>
              </div>
              <div className="home-composer-option-list">
                {propertyCandidates.map((item) => (
                  <div key={item.id} className="home-composer-option">
                    <input
                      id={`featured-property-${item.id}`}
                      type="checkbox"
                      checked={selectedPropertyIds.has(item.id)}
                      onChange={() => togglePropertySelection(item.id)}
                      aria-label={`${t.selectProperty} ${item.title || item.source_id || item.id}`}
                    />
                    <label htmlFor={`featured-property-${item.id}`} className="home-composer-option-label">
                      <span className="home-composer-option-title">{item.title || item.source_id || item.id}</span>
                      <span className="home-composer-option-meta">{formatCandidatePropertyMeta(item)}</span>
                    </label>
                  </div>
                ))}
              </div>
            </ActionCard>

            <ActionCard
              className="home-composer-card"
              bodyClassName="home-composer-stack"
              title={t.proofTrustTitle}
              description={t.proofTrustDescription}
              icon="success"
              titleTag="h2"
            >
              <label className="home-composer-form-field">{t.whyPattayaMetricsJson}
                <textarea rows={6} value={metricsText} onChange={(e) => setMetricsText(e.target.value)} className="home-composer-form-control home-composer-form-control--mono" />
              </label>
              <label className="home-composer-form-field">{t.trustProofsJson}
                <textarea rows={6} value={trustProofsText} onChange={(e) => setTrustProofsText(e.target.value)} className="home-composer-form-control home-composer-form-control--mono" />
              </label>
              <label className="home-composer-form-field">{t.processTimelineJson}
                <textarea rows={6} value={processTimelineText} onChange={(e) => setProcessTimelineText(e.target.value)} className="home-composer-form-control home-composer-form-control--mono" />
              </label>
            </ActionCard>

            <ActionCard
              className="home-composer-card"
              bodyClassName="home-composer-stack"
              title={t.supportingEditorTitle}
              description={t.supportingEditorDescription}
              icon="dashboard"
              titleTag="h2"
            >
              {(['market_insights', 'reviews', 'videos'] as const).map((section) => (
                <div key={section} className="home-composer-config-block">
                  <div className="home-composer-config-block-kicker">{sectionLabel(section)}</div>
                  <label className="home-composer-toggle-label">
                    <input type="checkbox" checked={Boolean(config[section].enabled)} onChange={(e) => setConfig((prev) => ({ ...prev, [section]: { ...prev[section], enabled: e.target.checked } }))} />
                    {t.enabled}
                  </label>
                  <div className="home-composer-triple-grid">
                    <label className="home-composer-form-field">{t.heading}<input value={config[section].heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, [section]: { ...prev[section], heading: e.target.value } }))} className="home-composer-form-control" /></label>
                    <label className="home-composer-form-field">{t.subcopy}<input value={config[section].subcopy || ''} onChange={(e) => setConfig((prev) => ({ ...prev, [section]: { ...prev[section], subcopy: e.target.value } }))} className="home-composer-form-control" /></label>
                    <label className="home-composer-form-field">{t.mode}<input value={config[section].mode || ''} onChange={(e) => setConfig((prev) => ({ ...prev, [section]: { ...prev[section], mode: e.target.value } }))} className="home-composer-form-control" /></label>
                  </div>
                </div>
              ))}
              <div className="home-composer-config-block">
                <div className="home-composer-config-block-kicker">{sectionLabel('bottom_cta')}</div>
                <label className="home-composer-toggle-label">
                  <input type="checkbox" checked={Boolean(config.bottom_cta.enabled)} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, enabled: e.target.checked } }))} />
                  {t.enabled}
                </label>
                <div className="home-composer-dual-grid">
                  <label className="home-composer-form-field">{t.heading}<input value={config.bottom_cta.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, heading: e.target.value } }))} className="home-composer-form-control" /></label>
                  <label className="home-composer-form-field">{t.subheading}<input value={config.bottom_cta.subheading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, subheading: e.target.value } }))} className="home-composer-form-control" /></label>
                  <label className="home-composer-form-field">{t.trustNote}<input value={config.bottom_cta.trust_note || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, trust_note: e.target.value } }))} className="home-composer-form-control" /></label>
                  <label className="home-composer-form-field">{t.primaryLabel}<input value={config.bottom_cta.primary_cta_label || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, primary_cta_label: e.target.value } }))} className="home-composer-form-control" /></label>
                  <label className="home-composer-form-field">{t.primaryUrl}<input value={config.bottom_cta.primary_cta_url || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, primary_cta_url: e.target.value } }))} className="home-composer-form-control" /></label>
                  <label className="home-composer-form-field">{t.secondaryLabel}<input value={config.bottom_cta.secondary_cta_label || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, secondary_cta_label: e.target.value } }))} className="home-composer-form-control" /></label>
                  <label className="home-composer-form-field">{t.secondaryUrl}<input value={config.bottom_cta.secondary_cta_url || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, secondary_cta_url: e.target.value } }))} className="home-composer-form-control" /></label>
                </div>
              </div>
            </ActionCard>
          </section>

          <aside className="home-composer-stack">
            <LogCard
              className="home-composer-card"
              bodyClassName="home-composer-stack"
              title={t.mediaPickerTitle}
              description={t.mediaPickerDescription}
              icon="media"
              titleTag="h2"
            >
              <input value={candidateSearch} onChange={(e) => setCandidateSearch(e.target.value)} placeholder={t.searchPlaceholder} className="home-composer-search-input" />
              <div className="home-composer-search-results">
                {mediaCandidates.map((asset) => (
                  <button key={asset.id} type="button" onClick={() => selectHeroMedia(asset.storage_path)} className="home-composer-media-option">
                    <div className="home-composer-code">{asset.storage_path}</div>
                    <div className={`home-composer-media-status-badge ${mediaBadgeClass(asset)}`}>{formatMediaCompliance(asset)}</div>
                  </button>
                ))}
              </div>
            </LogCard>

            <LogCard
              className="home-composer-card"
              bodyClassName="home-composer-stack home-composer-status-card"
              title={t.composerStatusTitle}
              description={t.composerStatusDescription}
              icon="info"
              titleTag="h2"
            >
              <ul className="home-composer-status-list">
                <li>{t.pageKey}: {bundle?.page_key || 'home'}</li>
                <li>{t.localeLabel}: {bundle?.locale || locale}</li>
                <li>{t.draftVersion}: {bundle?.draft?.version ?? t.notAvailable}</li>
                <li>{t.publishedVersion}: {bundle?.published?.version ?? t.notAvailable}</li>
                <li>{t.publishedAt}: {prettyDate(bundle?.published?.published_at, locale, t)}</li>
              </ul>
            </LogCard>
          </aside>
        </div>
          ) : null}
        </AdminPageBody>
      ) : null}
    </AdminPage>
  );
}
