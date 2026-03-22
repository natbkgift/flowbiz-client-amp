'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type Dispatch, type FormEvent, type SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import {
  clearAuthSession,
  LEGACY_TOKEN_STORAGE_KEY,
  loginAdmin,
  persistAuthSession,
  readAuthSession,
} from '@/app/_lib/admin-auth';
import { detectAdminLocale, persistAdminLocale, withAdminLocale } from '@/app/_lib/admin-i18n';
import { normalizeLocalMediaPath } from '@/app/_lib/local-media';
import {
  ActionCard,
  AdminAccessGate,
  AdminBadge,
  AdminButton,
  AdminPage,
  AdminPageBody,
  AdminPageHeader,
  AdminPrimaryActionBar,
  AdminRepeaterEditor,
  AdminSearchablePicker,
  AdminSectionTabs,
  AdminSelectionDrawer,
} from '@/components/admin/AdminPrimitives';
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

type ComposerSuccessKey = 'draft' | 'publish';

const HOME_COMPOSER_COPY = {
  en: {
    eyebrow: 'Homepage workflow',
    pageTitle: 'Landing Builder',
    pageDescription: 'Plan, edit, and publish the homepage narrative for one locale from a guided builder.',
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
    heroEyebrowLabel: 'Hero eyebrow',
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
    mediaCandidatesEmpty: 'No media candidates match the current search.',
    close: 'Close',
    noMediaItems: 'No media items available.',
    trustItemsLabel: 'Trust micro-strip items (one per line)',
    trustStripTitle: 'Trust micro-strip',
    trustStripDescription: 'Configure the short proof band that renders below the home hero.',
    pathSelectorTitle: 'Path selector',
    pathSelectorDescription: 'Configure enabled journeys, labels, descriptions, and destination URLs.',
    eyebrowLabel: 'Eyebrow',
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
    whyPattayaTitle: 'Why Pattaya Right Now',
    whyPattayaDescription: 'Configure market metrics, editorial narrative cards, and the primary CTA for the Pattaya market section.',
    whyPattayaMetricsJson: 'Market metrics',
    whyPattayaNarrativesJson: 'Narrative cards',
    trustProofsJson: 'Trust proof items',
    processTimelineJson: 'Process timeline',
    supportingSectionsTitle: 'Supporting sections',
    supportingSectionsDescription: 'Configure supporting market, review, and video sections below the hero.',
    supportingCardsJson: 'Insight cards',
    reviewItemsJson: 'Review cards',
    videoItemsJson: 'Video cards',
    teamCtaTitle: 'Team / advisory CTA',
    teamCtaDescription: 'Configure the advisory band shown before the final conversion block.',
    bottomCtaTitle: 'Bottom CTA',
    bottomCtaDescription: 'Final call-to-action content shown near the end of the homepage.',
    trustNote: 'Trust note',
    primaryLabel: 'Primary label',
    primaryUrl: 'Primary URL',
    secondaryLabel: 'Secondary label',
    secondaryUrl: 'Secondary URL',
    formHeadingLabel: 'Form heading',
    formBodyLabel: 'Form body',
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
    mustBeValidJsonArray: 'Item list is invalid',
    mustBeJsonArray: 'Item list must be an array',
    sessionExpired: 'Session expired. Please sign in again.',
    loadComposerError: 'Unable to load home composer',
    loadComposerStateDescription: 'Reconnect and load the composer bundle before editing this page.',
    loadCandidatesError: 'Unable to load candidates',
    loginMissing: 'Email and password are required.',
    loginInvalid: 'Invalid credentials.',
    loginError: 'Unable to sign in right now.',
    draftSaved: 'Draft saved',
    publishedNotice: 'Published',
    successTitle: 'Next verification',
    draftSuccessBody: 'Use layout and media to confirm the draft still lines up with the current homepage structure and approved assets before the next edit round.',
    publishSuccessBody: 'Use dashboard and layout to confirm the published homepage is aligned with the current release checklist and downstream content owners.',
    openDashboard: 'Open dashboard',
    openLayout: 'Open layout',
    openMedia: 'Open media',
    saveDraftError: 'Unable to save draft',
    publishError: 'Unable to publish',
    publishConfirm: 'Publish the current draft now? This will update the live home page for the selected locale.',
    unsavedChanges: 'Unsaved changes',
    unsavedChangesDescription: 'Review and save the current draft before switching locale, refreshing, or leaving this editor.',
    unsavedLeaveConfirm: 'You have unsaved changes in the current draft. Continue and discard them?',
    heroImageLocalOnlyError: 'Hero image must use local media only.',
    rightsUnknown: 'unknown',
    approvalUnknown: 'unknown',
    auto: 'auto',
    manual: 'manual',
  },
  th: {
    eyebrow: 'จัดวางคอนเทนต์หน้าแรก',
    pageTitle: 'Landing Builder',
    pageDescription: 'วางแผน แก้ไข และเผยแพร่เรื่องราวของหน้าแรกตามภาษาที่เลือกจาก builder เดียว',
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
    heroEyebrowLabel: 'ข้อความคิ้วของฮีโร่',
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
    mediaCandidatesEmpty: 'ไม่พบไฟล์สื่อที่ตรงกับคำค้นปัจจุบัน',
    close: 'ปิด',
    noMediaItems: 'ยังไม่มีรายการสื่อให้เลือก',
    trustItemsLabel: 'รายการข้อความความน่าเชื่อถือแบบสั้น (หนึ่งบรรทัดต่อหนึ่งรายการ)',
    trustStripTitle: 'แถบข้อความความน่าเชื่อถือ',
    trustStripDescription: 'ตั้งค่าแถบข้อความสั้นที่แสดงถัดจากฮีโร่บนหน้าแรก',
    pathSelectorTitle: 'ตัวเลือกเส้นทางผู้ใช้',
    pathSelectorDescription: 'ตั้งค่าชุดเส้นทางหลัก ข้อความอธิบาย และ URL ที่ใช้บนหน้าแรก',
    eyebrowLabel: 'ข้อความคิ้ว',
    label: 'ข้อความป้าย',
    descriptionLabel: 'คำอธิบาย',
    url: 'URL',
    featuredProjectsTitle: 'โครงการแนะนำ',
    featuredProjectsDescription: 'เลือกโหมดการดึงโครงการ ข้อความประกอบ และรายการที่ต้องการปักหมุด',
    featuredPropertiesTitle: 'ทรัพย์แนะนำ',
    featuredPropertiesDescription: 'เลือกโหมดการดึงทรัพย์ ข้อความประกอบ และรายการที่ต้องการปักหมุด',
    mode: 'โหมด',
    fallbackRule: 'กติกาสำรอง',
    subcopy: 'ข้อความรอง',
    proofTrustTitle: 'ส่วนสร้างความน่าเชื่อถือ',
    proofTrustDescription: 'จัดการข้อมูลตัวเลขยืนยันความน่าสนใจ หลักฐานความน่าเชื่อถือ และลำดับขั้นการทำงานของหน้าแรก',
    whyPattayaTitle: 'Why Pattaya Right Now',
    whyPattayaDescription: 'ตั้งค่าตัวเลขตลาด การ์ดบทบรรณาธิการ และ CTA หลักของส่วนเล่าเรื่องตลาดพัทยา',
    whyPattayaMetricsJson: 'ตัวเลขตลาด',
    whyPattayaNarrativesJson: 'การ์ดเล่าเรื่อง',
    trustProofsJson: 'รายการหลักฐานความน่าเชื่อถือ',
    processTimelineJson: 'ลำดับขั้นการทำงาน',
    supportingSectionsTitle: 'ส่วนสนับสนุน',
    supportingSectionsDescription: 'ตั้งค่าบล็อกข้อมูลตลาด รีวิว และวิดีโอที่อยู่ถัดจากส่วนหลัก',
    supportingCardsJson: 'การ์ดอินไซต์',
    reviewItemsJson: 'การ์ดรีวิว',
    videoItemsJson: 'การ์ดวิดีโอ',
    teamCtaTitle: 'Team / Advisory CTA',
    teamCtaDescription: 'ตั้งค่าบล็อกชวนคุยกับทีมที่ปรึกษาก่อนถึงส่วนปิดการขายท้ายหน้า',
    bottomCtaTitle: 'ปุ่มท้ายหน้า',
    bottomCtaDescription: 'กำหนดข้อความและปุ่มกระตุ้นการตัดสินใจช่วงท้ายของหน้าแรก',
    trustNote: 'ข้อความสร้างความมั่นใจ',
    primaryLabel: 'ข้อความปุ่มหลัก',
    primaryUrl: 'ลิงก์ปุ่มหลัก',
    secondaryLabel: 'ข้อความปุ่มรอง',
    secondaryUrl: 'ลิงก์ปุ่มรอง',
    formHeadingLabel: 'หัวข้อแบบฟอร์ม',
    formBodyLabel: 'ข้อความประกอบแบบฟอร์ม',
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
    supportingEditorTitle: 'ส่วนข้อมูลตลาด รีวิว วิดีโอ และปุ่มท้ายหน้า',
    supportingEditorDescription: 'ตั้งค่าบล็อกสนับสนุนและข้อความปิดการขายในพื้นที่เดียว',
    mediaPickerTitle: 'ตัวเลือกสื่อ',
    mediaPickerDescription: 'ค้นหาสื่อที่ใช้ได้และนำมาใช้กับภาพฮีโร่ของหน้าแรก',
    composerStatusTitle: 'สถานะคอมโพส',
    composerStatusDescription: 'สรุปข้อมูลร่างและเวอร์ชันที่เผยแพร่แล้วของหน้าแรก',
    selectProject: 'เลือกโครงการ',
    selectProperty: 'เลือกทรัพย์',
    selectHeroImage: 'เลือกภาพฮีโร่',
    closeHeroImagePicker: 'ปิดตัวเลือกสื่อภาพฮีโร่',
    mustBeValidJsonArray: 'รายการนี้มีข้อมูลไม่ถูกต้อง',
    mustBeJsonArray: 'รายการนี้ต้องเป็นลิสต์ข้อมูล',
    sessionExpired: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
    loadComposerError: 'ไม่สามารถโหลดคอมโพสหน้าแรกได้',
    loadComposerStateDescription: 'เชื่อมต่อและโหลดข้อมูลคอมโพสให้สำเร็จก่อนเริ่มแก้ไขหน้านี้',
    loadCandidatesError: 'ไม่สามารถโหลดรายการตัวเลือกได้',
    loginMissing: 'ต้องกรอกอีเมลและรหัสผ่าน',
    loginInvalid: 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง',
    loginError: 'ไม่สามารถเข้าสู่ระบบได้ในขณะนี้',
    draftSaved: 'บันทึกร่างแล้ว',
    publishedNotice: 'เผยแพร่แล้ว',
    successTitle: 'จุดตรวจถัดไป',
    draftSuccessBody: 'ใช้ layout และ media เพื่อตรวจว่าร่างล่าสุดยังสอดคล้องกับโครงหน้าแรกและไฟล์ที่อนุมัติแล้วก่อนเริ่มรอบแก้ไขถัดไป',
    publishSuccessBody: 'ใช้ dashboard และ layout เพื่อตรวจว่าหน้าแรกที่เผยแพร่แล้วสอดคล้องกับ release checklist ปัจจุบันและทีมคอนเทนต์ปลายทาง',
    openDashboard: 'ดูแดชบอร์ด',
    openLayout: 'ดู layout',
    openMedia: 'ดู media',
    saveDraftError: 'ไม่สามารถบันทึกร่างได้',
    publishError: 'ไม่สามารถเผยแพร่ได้',
    publishConfirm: 'ต้องการเผยแพร่ร่างปัจจุบันตอนนี้หรือไม่ ระบบจะอัปเดตหน้าแรกที่ใช้งานจริงตามภาษาที่เลือก',
    unsavedChanges: 'มีการแก้ไขที่ยังไม่บันทึก',
    unsavedChangesDescription: 'ควรตรวจและบันทึกร่างปัจจุบันก่อนสลับภาษา รีเฟรช หรือออกจากหน้าแก้ไขนี้',
    unsavedLeaveConfirm: 'มีการแก้ไขที่ยังไม่บันทึกในร่างปัจจุบัน ต้องการออกต่อและทิ้งการแก้ไขหรือไม่',
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
  trust_micro_strip: { en: 'trust micro-strip', th: 'แถบความน่าเชื่อถือ' },
  path_selector: { en: 'path selector', th: 'ตัวเลือกเส้นทาง' },
  featured_projects: { en: 'featured projects', th: 'โครงการแนะนำ' },
  featured_properties: { en: 'featured properties', th: 'ทรัพย์แนะนำ' },
  why_pattaya: { en: 'why pattaya', th: 'Why Pattaya Right Now' },
  proof_trust: { en: 'proof & trust', th: 'ส่วนสร้างความน่าเชื่อถือ' },
  market_insights: { en: 'market insights', th: 'ข้อมูลตลาด' },
  reviews: { en: 'reviews', th: 'รีวิว' },
  videos: { en: 'videos', th: 'วิดีโอ' },
  team_cta: { en: 'team cta', th: 'Team / Advisory CTA' },
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
  'trust_micro_strip',
  'path_selector',
  'featured_projects',
  'featured_properties',
  'why_pattaya',
  'proof_trust',
  'videos',
  'market_insights',
  'reviews',
  'team_cta',
  'bottom_cta',
] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

type BuilderTabKey = 'overview' | 'hero' | 'journeys' | 'featured' | 'market-story' | 'social-proof' | 'conversion';

type HomeComposerConfig = {
  enabled_sections: SectionKey[];
  section_order: SectionKey[];
  trust_micro_strip: Array<{ key: string; text?: string }>;
  hero: {
    eyebrow?: string;
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
    heading?: string;
    subcopy?: string;
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
    heading?: string;
    subcopy?: string;
    primary_cta_label?: string;
    primary_cta_url?: string;
    secondary_cta_label?: string;
    secondary_cta_url?: string;
    why_pattaya_metrics?: Array<Record<string, unknown>>;
    trust_proofs?: Array<Record<string, unknown>>;
    process_timeline?: Array<Record<string, unknown>>;
  };
  why_pattaya: {
    enabled?: boolean;
    heading?: string;
    subcopy?: string;
    primary_cta_label?: string;
    primary_cta_url?: string;
    metrics?: Array<Record<string, unknown>>;
    narrative_cards?: Array<Record<string, unknown>>;
  };
  market_insights: {
    enabled?: boolean;
    heading?: string;
    subcopy?: string;
    mode?: string;
    cards?: Array<Record<string, unknown>>;
  };
  reviews: {
    enabled?: boolean;
    heading?: string;
    subcopy?: string;
    mode?: string;
    items?: Array<Record<string, unknown>>;
  };
  videos: {
    enabled?: boolean;
    heading?: string;
    subcopy?: string;
    mode?: string;
    items?: Array<Record<string, unknown>>;
  };
  team_cta: {
    enabled?: boolean;
    eyebrow?: string;
    heading?: string;
    subheading?: string;
    trust_note?: string;
    primary_cta_label?: string;
    primary_cta_url?: string;
    secondary_cta_label?: string;
    secondary_cta_url?: string;
  };
  bottom_cta: {
    enabled?: boolean;
    heading?: string;
    subheading?: string;
    trust_note?: string;
    form_heading?: string;
    form_body?: string;
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
    trust_micro_strip: [],
    hero: {
      eyebrow: '',
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
      heading: '',
      subcopy: '',
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
      heading: '',
      subcopy: '',
      primary_cta_label: '',
      primary_cta_url: '/about',
      secondary_cta_label: '',
      secondary_cta_url: '/about#how-we-work',
      why_pattaya_metrics: [],
      trust_proofs: [],
      process_timeline: [],
    },
    why_pattaya: {
      enabled: true,
      heading: '',
      subcopy: '',
      primary_cta_label: '',
      primary_cta_url: '/investment',
      metrics: [],
      narrative_cards: [],
    },
    market_insights: { enabled: true, heading: '', subcopy: '', mode: 'fallback', cards: [] },
    reviews: { enabled: true, heading: '', subcopy: '', mode: 'fallback', items: [] },
    videos: { enabled: true, heading: '', subcopy: '', mode: 'fallback', items: [] },
    team_cta: {
      enabled: true,
      eyebrow: '',
      heading: '',
      subheading: '',
      trust_note: '',
      primary_cta_label: '',
      primary_cta_url: '/contact',
      secondary_cta_label: '',
      secondary_cta_url: '/about',
    },
    bottom_cta: {
      enabled: true,
      heading: '',
      subheading: '',
      trust_note: '',
      form_heading: '',
      form_body: '',
      primary_cta_label: '',
      primary_cta_url: '/contact',
      secondary_cta_label: '',
      secondary_cta_url: '/invest',
    },
  };
}

function normalizeTrustMicroStrip(value: unknown, fallbackLines: string[] = []): Array<{ key: string; text?: string }> {
  if (Array.isArray(value)) {
    return value
      .flatMap((item, index) => {
        if (typeof item === 'string') {
          return item.trim() ? [{ key: `trust-${index + 1}`, text: item.trim() }] : [];
        }
        if (!item || typeof item !== 'object') return [];
        const row = item as Record<string, unknown>;
        const localized = row.text;
        const localizedRow = localized && typeof localized === 'object'
          ? localized as Record<string, unknown>
          : null;
        const text = typeof localized === 'string'
          ? localized.trim()
          : [localizedRow?.en, localizedRow?.th]
              .map((candidate) => String(candidate ?? '').trim())
              .find(Boolean) ?? '';
        const key = String(row.key ?? `trust-${index + 1}`).trim() || `trust-${index + 1}`;
        return text ? [{ key, text }] : [];
      });
  }

  return fallbackLines.map((text, index) => ({ key: `trust-${index + 1}`, text }));
}

function normalizeConfig(input: Record<string, unknown> | null | undefined): HomeComposerConfig {
  const base = defaultConfig();
  if (!input || typeof input !== 'object') return base;
  const heroInput = (input.hero as Record<string, unknown> | undefined) ?? {};
  const rawEnabledSections = Array.isArray(input.enabled_sections)
    ? input.enabled_sections.map((item) => String(item)).filter((item): item is SectionKey => SECTION_KEYS.includes(item as SectionKey))
    : base.enabled_sections;
  const rawSectionOrder = Array.isArray(input.section_order)
    ? input.section_order.map((item) => String(item)).filter((item): item is SectionKey => SECTION_KEYS.includes(item as SectionKey))
    : base.section_order;
  const enabled_sections = [...new Set([...rawEnabledSections, ...SECTION_KEYS.filter((key) => base.enabled_sections.includes(key))])];
  const section_order = [...new Set([...rawSectionOrder, ...SECTION_KEYS])];
  const heroTrustFallback = Array.isArray(heroInput.trust_items)
    ? heroInput.trust_items.map((item) => String(item).trim()).filter(Boolean)
    : [];
  return {
    ...base,
    ...input,
    enabled_sections,
    section_order,
    trust_micro_strip: normalizeTrustMicroStrip(input.trust_micro_strip, heroTrustFallback),
    hero: { ...base.hero, ...heroInput },
    path_selector: { ...base.path_selector, ...(input.path_selector as Record<string, unknown> ?? {}) },
    featured_projects: { ...base.featured_projects, ...(input.featured_projects as Record<string, unknown> ?? {}) },
    featured_properties: { ...base.featured_properties, ...(input.featured_properties as Record<string, unknown> ?? {}) },
    proof_trust: { ...base.proof_trust, ...(input.proof_trust as Record<string, unknown> ?? {}) },
    why_pattaya: { ...base.why_pattaya, ...(input.why_pattaya as Record<string, unknown> ?? {}) },
    market_insights: { ...base.market_insights, ...(input.market_insights as Record<string, unknown> ?? {}) },
    reviews: { ...base.reviews, ...(input.reviews as Record<string, unknown> ?? {}) },
    videos: { ...base.videos, ...(input.videos as Record<string, unknown> ?? {}) },
    team_cta: { ...base.team_cta, ...(input.team_cta as Record<string, unknown> ?? {}) },
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

function buildTrustMicroStrip(lines: string[]): Array<{ key: string; text: string }> {
  return lines.map((text, index) => ({
    key: `trust-${index + 1}`,
    text,
  }));
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

function safeParseEditorItems(text: string): Array<Record<string, unknown>> {
  const raw = text.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Array<Record<string, unknown>>) : [];
  } catch {
    return [];
  }
}

function serializeEditorItems(items: Array<Record<string, unknown>>): string {
  if (items.length === 0) return '[]';
  return JSON.stringify(items, null, 2);
}

function coerceEditorValue(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }
  return value;
}

function formatEditorValue(value: unknown): string {
  if (value === null || typeof value === 'undefined') return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function applyEditorUpdate(
  setter: Dispatch<SetStateAction<string>>,
  updater: (items: Array<Record<string, unknown>>) => Array<Record<string, unknown>>,
): void {
  setter((current) => serializeEditorItems(updater(safeParseEditorItems(current))));
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
  const [locale, setLocale] = useState<LocaleCode>(() => detectLocale());
  const [bundle, setBundle] = useState<ComposerBundle | null>(null);
  const [config, setConfig] = useState<HomeComposerConfig>(defaultConfig());

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<ComposerSuccessKey | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const [projectCandidates, setProjectCandidates] = useState<CandidateProject[]>([]);
  const [propertyCandidates, setPropertyCandidates] = useState<CandidateProperty[]>([]);
  const [mediaCandidates, setMediaCandidates] = useState<MediaAsset[]>([]);
  const [candidateSearch, setCandidateSearch] = useState('');

  const [metricsText, setMetricsText] = useState('[]');
  const [whyPattayaNarrativesText, setWhyPattayaNarrativesText] = useState('[]');
  const [trustProofsText, setTrustProofsText] = useState('[]');
  const [processTimelineText, setProcessTimelineText] = useState('[]');
  const [marketInsightsCardsText, setMarketInsightsCardsText] = useState('[]');
  const [reviewItemsText, setReviewItemsText] = useState('[]');
  const [videoItemsText, setVideoItemsText] = useState('[]');
  const [trustItemsText, setTrustItemsText] = useState('');
  const [heroImageError, setHeroImageError] = useState<string | null>(null);
  const [heroMediaModalOpen, setHeroMediaModalOpen] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [propertyPickerOpen, setPropertyPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<BuilderTabKey>('overview');

  const draftId = bundle?.draft?.id ?? null;
  const isAuthenticated = authToken.trim().length > 0;
  const t: HomeComposerCopy = HOME_COMPOSER_COPY[locale];
  const hasComposerBundle = Boolean(bundle);
  const savedDraftConfigSnapshot = useMemo(
    () => JSON.stringify(normalizeConfig((bundle?.draft?.config ?? defaultConfig()) as Record<string, unknown>)),
    [bundle?.draft?.config],
  );
  const currentConfigSnapshot = useMemo(() => JSON.stringify(config), [config]);
  const hasUnsavedChanges = Boolean(draftId) && savedDraftConfigSnapshot !== currentConfigSnapshot;

  const selectedProjectIds = useMemo(() => new Set(config.featured_projects.selected_project_ids || []), [config.featured_projects.selected_project_ids]);
  const selectedPropertyIds = useMemo(() => new Set(config.featured_properties.selected_property_ids || []), [config.featured_properties.selected_property_ids]);
  const trustStripItems = useMemo(
    () => splitLines(trustItemsText).map((text, index) => ({ key: `trust-${index + 1}`, text })),
    [trustItemsText],
  );
  const metricsItems = useMemo(() => safeParseEditorItems(metricsText), [metricsText]);
  const whyPattayaNarrativesItems = useMemo(() => safeParseEditorItems(whyPattayaNarrativesText), [whyPattayaNarrativesText]);
  const trustProofItems = useMemo(() => safeParseEditorItems(trustProofsText), [trustProofsText]);
  const processTimelineItems = useMemo(() => safeParseEditorItems(processTimelineText), [processTimelineText]);
  const marketInsightItems = useMemo(() => safeParseEditorItems(marketInsightsCardsText), [marketInsightsCardsText]);
  const reviewItems = useMemo(() => safeParseEditorItems(reviewItemsText), [reviewItemsText]);
  const videoItems = useMemo(() => safeParseEditorItems(videoItemsText), [videoItemsText]);

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

  const createDraft = useCallback(async (targetLocale: LocaleCode, payloadConfig: HomeComposerConfig): Promise<ComposerItem> => {
    const created = await apiRequest<ComposerItem>('/admin/home-composer', {
      method: 'POST',
      body: JSON.stringify({ page_key: 'home', locale: targetLocale, config: payloadConfig }),
    });
    setBundle((prev) => ({
      page_key: prev?.page_key || 'home',
      locale: targetLocale,
      draft: created,
      published: prev?.published || null,
    }));
    return created;
  }, []);

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

      setBundle(nextBundle);
      const rawConfig = normalizeConfig((nextBundle.draft?.config ?? nextBundle.published?.config ?? defaultConfig()) as Record<string, unknown>);
      setConfig(rawConfig);
      setMetricsText(prettyJson(rawConfig.why_pattaya.metrics?.length ? rawConfig.why_pattaya.metrics : rawConfig.proof_trust.why_pattaya_metrics));
      setWhyPattayaNarrativesText(prettyJson(rawConfig.why_pattaya.narrative_cards));
      setTrustProofsText(prettyJson(rawConfig.proof_trust.trust_proofs));
      setProcessTimelineText(prettyJson(rawConfig.proof_trust.process_timeline));
      setMarketInsightsCardsText(prettyJson(rawConfig.market_insights.cards));
      setReviewItemsText(prettyJson(rawConfig.reviews.items));
      setVideoItemsText(prettyJson(rawConfig.videos.items));
      setTrustItemsText(
        rawConfig.trust_micro_strip.length
          ? rawConfig.trust_micro_strip.map((item) => item.text || '').filter(Boolean).join('\n')
          : (rawConfig.hero.trust_items || []).join('\n'),
      );
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

  const confirmDiscardChanges = useCallback((): boolean => {
    if (!hasUnsavedChanges || typeof window === 'undefined') return true;
    return window.confirm(t.unsavedLeaveConfirm);
  }, [hasUnsavedChanges, t.unsavedLeaveConfirm]);

  const handleLocaleChange = useCallback((nextLocale: LocaleCode): void => {
    if (nextLocale === locale) return;
    if (!confirmDiscardChanges()) return;
    setLocale(nextLocale);
    persistAdminLocale(nextLocale);
    if (typeof window === 'undefined') return;
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('lang', nextLocale);
    window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  }, [confirmDiscardChanges, locale]);

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
    if (!confirmDiscardChanges()) return;
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
    const trustLines = splitLines(trustItemsText);
    if (heroImageValue && !normalizedHeroImage) {
      setHeroImageError(t.heroImageLocalOnlyError);
    }
    const safeHeroImage = heroImageValue && normalizedHeroImage ? normalizedHeroImage : null;
    return {
      ...config,
      trust_micro_strip: buildTrustMicroStrip(trustLines),
      hero: {
        ...config.hero,
        hero_image: safeHeroImage,
        trust_items: trustLines,
      },
      proof_trust: {
        ...config.proof_trust,
        trust_proofs: parseJsonArray(trustProofsText, t.trustProofsJson, t),
        process_timeline: parseJsonArray(processTimelineText, t.processTimelineJson, t),
      },
      why_pattaya: {
        ...config.why_pattaya,
        metrics: parseJsonArray(metricsText, t.whyPattayaMetricsJson, t),
        narrative_cards: parseJsonArray(whyPattayaNarrativesText, t.whyPattayaNarrativesJson, t),
      },
      market_insights: {
        ...config.market_insights,
        cards: parseJsonArray(marketInsightsCardsText, t.supportingCardsJson, t),
      },
      reviews: {
        ...config.reviews,
        items: parseJsonArray(reviewItemsText, t.reviewItemsJson, t),
      },
      videos: {
        ...config.videos,
        items: parseJsonArray(videoItemsText, t.videoItemsJson, t),
      },
    };
  }

  async function saveDraftRequest(showNotice: boolean): Promise<boolean> {
    setSaving(true);
    setError(null);
    if (showNotice) {
      setNotice(null);
      setSuccessKey(null);
    }
    try {
      const payloadConfig = readConfigForSave();
      let savedDraft: ComposerItem;
      let nextValidation: ValidationResult | null = null;
      if (!draftId) {
        savedDraft = await createDraft(locale, payloadConfig);
      } else {
        const res = await apiRequest<SaveResponse>(`/admin/home-composer/${draftId}`, {
          method: 'PATCH',
          body: JSON.stringify({ config: payloadConfig }),
        });
        savedDraft = res.item;
        nextValidation = res.validation;
      }
      setValidation(nextValidation);
      if (showNotice) {
        setNotice(t.draftSaved);
        setSuccessKey('draft');
      }
      setBundle((prev) => prev ? ({ ...prev, draft: savedDraft }) : ({
        page_key: 'home',
        locale,
        draft: savedDraft,
        published: null,
      }));
      setConfig(normalizeConfig(savedDraft.config as Record<string, unknown>));
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
    if (typeof window !== 'undefined' && !window.confirm(t.publishConfirm)) return;
    setPublishing(true);
    setError(null);
    setNotice(null);
    setSuccessKey(null);
    try {
      const saved = await saveDraftRequest(false);
      if (!saved) return;
      const res = await apiRequest<SaveResponse>(`/admin/home-composer/${draftId}/publish`, {
        method: 'POST',
      });
      setValidation(res.validation);
      setNotice(t.publishedNotice);
      setSuccessKey('publish');
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

  const formatCandidatePropertyType = (value: string | null | undefined): string => {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return '';
    if (locale === 'th') {
      if (normalized === 'rent') return 'เช่า';
      if (normalized === 'resale') return 'ขายต่อ';
      if (normalized === 'sale') return 'ขาย';
      if (normalized === 'buy') return 'ซื้อ';
    }
    return normalized.replace(/_/g, ' ');
  };

  const formatCandidatePropertyTitle = (item: CandidateProperty): string => {
    const rawTitle = item.title?.trim();
    if (!rawTitle) return item.source_id || item.id;

    const providerStripped = rawTitle.split(' | ')[0]?.trim() || rawTitle;
    const codeMatch = providerStripped.match(/\s+-\s+(#\S.*)$/);
    if (!codeMatch) return providerStripped;

    const headline = providerStripped.slice(0, codeMatch.index).trim();
    return headline || providerStripped;
  };

  const formatCandidatePropertyMeta = (item: CandidateProperty): string => {
    const rawTitle = item.title?.trim() || '';
    const codeMatch = rawTitle.match(/(#\S+)/);

    return [
      codeMatch?.[1] || item.source_id,
      translateComposerStatus(item.status),
      formatCandidatePropertyType(item.type),
    ].filter(Boolean).join(' · ');
  };

  const sectionLabel = (section: SectionKey): string => SECTION_LABELS[section]?.[locale] ?? section;
  const pathKeyLabel = (key: string): string => PATH_KEY_LABELS[key]?.[locale] ?? key;
  const tabItems = locale === 'th'
    ? [
        { key: 'overview', label: 'ภาพรวม' },
        { key: 'hero', label: 'ฮีโร่' },
        { key: 'journeys', label: 'เส้นทาง' },
        { key: 'featured', label: 'คัดสรร' },
        { key: 'market-story', label: 'เรื่องราวตลาด' },
        { key: 'social-proof', label: 'รีวิวและความน่าเชื่อถือ' },
        { key: 'conversion', label: 'เปลี่ยนเป็นดีล' },
      ]
    : [
        { key: 'overview', label: 'Overview' },
        { key: 'hero', label: 'Hero' },
        { key: 'journeys', label: 'Journeys' },
        { key: 'featured', label: 'Featured' },
        { key: 'market-story', label: 'Market Story' },
        { key: 'social-proof', label: 'Social Proof' },
        { key: 'conversion', label: 'Conversion' },
      ];
  const livePageHref = locale === 'th' ? '/th' : '/en';
  const selectedProjectSummary = projectCandidates.filter((item) => selectedProjectIds.has(item.id));
  const selectedPropertySummary = propertyCandidates.filter((item) => selectedPropertyIds.has(item.id));
  const saveDisabled = saving || loading || Boolean(heroImageError);
  const publishDisabled = publishing || loading || saving || !draftId || Boolean(heroImageError);
  const successBody = successKey === 'publish' ? t.publishSuccessBody : t.draftSuccessBody;

  const editorLabels = locale === 'th'
    ? {
        addItem: 'เพิ่มรายการ',
        addField: 'เพิ่มฟิลด์',
        emptyItem: 'ยังไม่มีรายการ',
        emptyFields: 'เพิ่มรายการแรกเพื่อเริ่มแก้ไข',
        fieldName: 'ชื่อฟิลด์',
        fieldValue: 'ค่า',
        removeField: 'ลบฟิลด์',
        removeItem: 'ลบรายการ',
        chooseItems: 'เลือกรายการ',
        selected: 'เลือกแล้ว',
        selectedCount: 'รายการที่เลือก',
      }
    : {
        addItem: 'Add item',
        addField: 'Add field',
        emptyItem: 'No items yet',
        emptyFields: 'Add the first item to start editing this section.',
        fieldName: 'Field name',
        fieldValue: 'Value',
        removeField: 'Remove field',
        removeItem: 'Remove item',
        chooseItems: 'Choose items',
        selected: 'Selected',
        selectedCount: 'Selected items',
      };

  function updateTrustStripItems(nextItems: Array<{ key: string; text?: string }>): void {
    setTrustItemsText(nextItems.map((item) => item.text?.trim() || '').filter(Boolean).join('\n'));
  }

  function updatePathItem(index: number, key: 'label' | 'description' | 'url', value: string): void {
    setConfig((prev) => {
      const nextPaths = [...(prev.path_selector.paths || [])];
      nextPaths[index] = { ...nextPaths[index], [key]: value };
      return { ...prev, path_selector: { ...prev.path_selector, paths: nextPaths } };
    });
  }

  function addPathItem(): void {
    setConfig((prev) => ({
      ...prev,
      path_selector: {
        ...prev.path_selector,
        paths: [...(prev.path_selector.paths || []), { key: `custom-${(prev.path_selector.paths || []).length + 1}`, label: '', description: '', url: '' }],
      },
    }));
  }

  function removePathItem(index: number): void {
    setConfig((prev) => ({
      ...prev,
      path_selector: {
        ...prev.path_selector,
        paths: (prev.path_selector.paths || []).filter((_, itemIndex) => itemIndex !== index),
      },
    }));
  }

  function movePathItem(index: number, direction: -1 | 1): void {
    setConfig((prev) => {
      const nextPaths = [...(prev.path_selector.paths || [])];
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= nextPaths.length) {
        return prev;
      }
      [nextPaths[index], nextPaths[nextIndex]] = [nextPaths[nextIndex], nextPaths[index]];
      return { ...prev, path_selector: { ...prev.path_selector, paths: nextPaths } };
    });
  }

  function toggleProjectDrawerSelection(id: string): void {
    toggleProjectSelection(id);
  }

  function togglePropertyDrawerSelection(id: string): void {
    togglePropertySelection(id);
  }

  function renderObjectRepeater(
    title: string,
    items: Array<Record<string, unknown>>,
    setter: Dispatch<SetStateAction<string>>,
  ) {
    return (
      <AdminRepeaterEditor
        items={items}
        addLabel={editorLabels.addItem}
        emptyTitle={editorLabels.emptyItem}
        emptyDescription={editorLabels.emptyFields}
        onAdd={() => applyEditorUpdate(setter, (current) => [...current, { label: '', value: '' }])}
        onRemove={(index) => applyEditorUpdate(setter, (current) => current.filter((_, itemIndex) => itemIndex !== index))}
        onMove={(index, direction) =>
          applyEditorUpdate(setter, (current) => {
            const next = [...current];
            const targetIndex = index + direction;
            if (targetIndex < 0 || targetIndex >= next.length) return next;
            [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
            return next;
          })
        }
        getKey={(_item, index) => `${title}-${index}`}
        getItemLabel={(_item, index) => `${title} ${index + 1}`}
        renderItem={(item, index) => (
          <div className="home-composer-record-list">
            {Object.entries(item).map(([fieldKey, fieldValue]) => (
              <div key={`${title}-${index}-${fieldKey}`} className="home-composer-record-row">
                <label className="home-composer-form-field">
                  {editorLabels.fieldName}
                  <input
                    value={fieldKey}
                    onChange={(event) =>
                      applyEditorUpdate(setter, (current) => {
                        const next = [...current];
                        const nextItem = { ...next[index] };
                        const value = nextItem[fieldKey];
                        delete nextItem[fieldKey];
                        nextItem[event.target.value || fieldKey] = value;
                        next[index] = nextItem;
                        return next;
                      })
                    }
                    className="home-composer-form-control"
                  />
                </label>
                <label className="home-composer-form-field">
                  {editorLabels.fieldValue}
                  <input
                    value={formatEditorValue(fieldValue)}
                    onChange={(event) =>
                      applyEditorUpdate(setter, (current) => {
                        const next = [...current];
                        next[index] = { ...next[index], [fieldKey]: coerceEditorValue(event.target.value) };
                        return next;
                      })
                    }
                    className="home-composer-form-control"
                  />
                </label>
                <AdminButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    applyEditorUpdate(setter, (current) => {
                      const next = [...current];
                      const nextItem = { ...next[index] };
                      delete nextItem[fieldKey];
                      next[index] = nextItem;
                      return next;
                    })
                  }
                >
                  {editorLabels.removeField}
                </AdminButton>
              </div>
            ))}
            <div className="home-composer-record-actions">
              <AdminButton
                type="button"
                variant="secondary"
                size="sm"
                icon="plus"
                onClick={() =>
                  applyEditorUpdate(setter, (current) => {
                    const next = [...current];
                    const itemDraft = { ...next[index] };
                    itemDraft[`field_${Object.keys(itemDraft).length + 1}`] = '';
                    next[index] = itemDraft;
                    return next;
                  })
                }
              >
                {editorLabels.addField}
              </AdminButton>
            </div>
          </div>
        )}
      />
    );
  }

  return (
    <AdminPage className="home-composer-stack home-composer-builder-page">
      <AdminPageHeader
        title={t.pageTitle}
        description={t.pageDescription}
        icon="spark"
        eyebrow={t.eyebrow}
        meta={
          <div className="home-composer-header-meta">
            <AdminBadge tone={bundle?.draft ? 'info' : 'neutral'} icon="workspace">
              {locale.toUpperCase()}
            </AdminBadge>
            <AdminBadge tone={bundle?.draft ? 'ok' : 'neutral'} icon="info">
              {`Draft ${bundle?.draft?.version ?? 'N/A'}`}
            </AdminBadge>
            <AdminBadge tone={bundle?.published ? 'ok' : 'neutral'} icon="success">
              {`Published ${bundle?.published?.version ?? 'N/A'}`}
            </AdminBadge>
          </div>
        }
        actions={
          <div className="home-composer-header-actions">
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
            <Link className="admin-button admin-button--secondary" href={livePageHref} target="_blank" rel="noreferrer">
              Open live page
            </Link>
          </div>
        }
      />

      {!isAuthenticated ? (
        <AdminAccessGate
          isAuthenticated={false}
          authTitle={t.loginTitle}
          authDescription={t.loginSubtitle}
          authContent={
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
              <div className="state-empty">{t.signInRequired}</div>
            </form>
          }
        />
      ) : (
        <>
          <AdminPrimaryActionBar
            title={locale === 'th' ? 'พร้อมบันทึกหรือเผยแพร่หน้าแรกของภาษานี้' : 'Keep this locale homepage ready to save or publish'}
            description={authEmail ? `${t.signedInAs} ${authEmail}` : t.signedInDescription}
            mobileBottom
            primaryAction={{
              label: saving ? t.saving : t.saveDraft,
              icon: 'plus',
              onClick: () => void handleSaveDraft(),
              disabled: saveDisabled,
            }}
            secondaryActions={[
              {
                label: publishing ? t.publishing : t.publish,
                icon: 'upload',
                onClick: () => void handlePublish(),
                disabled: publishDisabled,
              },
              {
                label: loading ? t.refreshing : t.refresh,
                icon: 'refresh',
                onClick: () => {
                  if (!confirmDiscardChanges()) return;
                  void loadBundle(locale);
                },
                disabled: loading || saving || publishing,
              },
              {
                label: t.signOut,
                icon: 'x',
                onClick: logout,
                disabled: saving || publishing,
              },
            ]}
            meta={
              <>
                <AdminBadge tone={hasUnsavedChanges ? 'warn' : 'neutral'} icon="info">
                  {hasUnsavedChanges ? t.unsavedChanges : (locale === 'th' ? 'ซิงก์ล่าสุดแล้ว' : 'Synced')}
                </AdminBadge>
                <AdminBadge tone={validation?.errors.length ? 'error' : 'ok'} icon={validation?.errors.length ? 'warning' : 'success'}>
                  {validation?.errors.length
                    ? (locale === 'th' ? `มี ${validation.errors.length} จุดที่ต้องแก้` : `${validation.errors.length} issues to fix`)
                    : (locale === 'th' ? 'พร้อมตรวจทาน' : 'Ready to review')}
                </AdminBadge>
              </>
            }
          />

          <AdminSectionTabs tabs={tabItems} activeTab={activeTab} onChange={(key) => setActiveTab(key as BuilderTabKey)} />

          <AdminPageBody className="home-composer-stack home-composer-tab-panel">
          {error && hasComposerBundle ? <div className="home-composer-banner home-composer-banner--error">{error}</div> : null}
          {notice ? <div className="home-composer-banner home-composer-banner--success">{notice}</div> : null}
          {notice ? <div className="admin-workspace-success-handoff" role="status"><strong>{t.successTitle}</strong><p className="locale-safe">{successBody}</p></div> : null}
          {hasUnsavedChanges ? <div className="home-composer-banner home-composer-banner--warn"><strong>{t.unsavedChanges}</strong> {t.unsavedChangesDescription}</div> : null}

          {!loading && !hasComposerBundle ? (
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

          {hasComposerBundle && validation && (validation.errors.length > 0 || validation.warnings.length > 0 || validation.media_warnings.length > 0) ? (
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

          {hasComposerBundle ? (
            <div className="home-composer-task-layout">
              {activeTab === 'overview' ? (
                <div className="home-composer-overview-grid">
                  <ActionCard className="home-composer-card" bodyClassName="home-composer-stack" title={t.validationTitle} description={t.validationDescription} icon="warning" titleTag="h2">
                    {validation && (validation.errors.length > 0 || validation.warnings.length > 0 || validation.media_warnings.length > 0) ? (
                      <>
                        {validation.errors.length > 0 ? <ul className="home-composer-validation-list home-composer-validation-list--error">{validation.errors.map((item, index) => <li key={`error-${index}`}>{item}</li>)}</ul> : null}
                        {validation.warnings.length > 0 ? <ul className="home-composer-validation-list home-composer-validation-list--warn">{validation.warnings.map((item, index) => <li key={`warn-${index}`}>{item}</li>)}</ul> : null}
                        {validation.media_warnings.length > 0 ? <ul className="home-composer-validation-list home-composer-validation-list--warn">{validation.media_warnings.map((item, index) => <li key={`media-${index}`}>{item.path} - {item.detail}</li>)}</ul> : null}
                      </>
                    ) : <div className="state-success">{locale === 'th' ? 'ยังไม่พบข้อผิดพลาดหรือคำเตือนสำหรับร่างนี้' : 'No draft validation issues are currently blocking review.'}</div>}
                  </ActionCard>
                  <ActionCard className="home-composer-card" bodyClassName="home-composer-stack" title={t.workspaceStatusTitle} description={t.workspaceStatusDescription} icon="info" titleTag="h2">
                    <ul className="home-composer-status-list">
                      <li>{t.pageKey}: {bundle?.page_key || 'home'}</li>
                      <li>{t.localeLabel}: {bundle?.locale || locale}</li>
                      <li>{t.draftVersion}: {bundle?.draft?.version ?? t.notAvailable}</li>
                      <li>{t.publishedVersion}: {bundle?.published?.version ?? t.notAvailable}</li>
                      <li>{t.publishedAt}: {prettyDate(bundle?.published?.published_at, locale, t)}</li>
                    </ul>
                  </ActionCard>
                  <ActionCard className="home-composer-card" bodyClassName="home-composer-stack" title={t.sectionControlsTitle} description={t.sectionControlsDescription} icon="settings" titleTag="h2">
                    <div className="home-composer-section-order">
                      {(config.section_order || SECTION_KEYS).map((section, idx) => (
                        <div key={section} className="home-composer-config-block home-composer-list-item">
                          <label className="home-composer-toggle-label">
                            <input type="checkbox" checked={(config.enabled_sections || []).includes(section)} onChange={(e) => updateSectionEnabled(section, e.target.checked)} />
                            {sectionLabel(section)}
                          </label>
                          <div className="home-composer-button-group">
                            <AdminButton type="button" variant="secondary" size="sm" onClick={() => moveSection(section, -1)} disabled={idx === 0}>{t.up}</AdminButton>
                            <AdminButton type="button" variant="secondary" size="sm" onClick={() => moveSection(section, 1)} disabled={idx === (config.section_order || SECTION_KEYS).length - 1}>{t.down}</AdminButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ActionCard>
                </div>
              ) : null}

              {activeTab === 'hero' ? (
                <div className="home-composer-stack">
                  <ActionCard className="home-composer-card" bodyClassName="home-composer-stack" title={t.heroTitle} description={t.heroDescription} icon="home" titleTag="h2">
                    <div className="home-composer-dual-grid">
                      <label className="home-composer-form-field">{t.heroEyebrowLabel}<input value={config.hero.eyebrow || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, eyebrow: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.heading}<input value={config.hero.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, heading: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.subheading}<input value={config.hero.subheading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, subheading: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.primaryCtaLabel}<input value={config.hero.primary_cta_label || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, primary_cta_label: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.primaryCtaUrl}<input value={config.hero.primary_cta_url || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, primary_cta_url: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.secondaryCtaLabel}<input value={config.hero.secondary_cta_label || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, secondary_cta_label: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.secondaryCtaUrl}<input value={config.hero.secondary_cta_url || ''} onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, secondary_cta_url: e.target.value } }))} className="home-composer-form-control" /></label>
                    </div>
                    <div className="home-composer-hero-media-panel admin-surface-muted">
                      <div className="home-composer-hero-media-copy">
                        <strong>{t.heroImageLabel}</strong>
                        <p className="locale-safe">{config.hero.hero_image || t.noMediaItems}</p>
                      </div>
                      <div className="home-composer-hero-media-actions">
                        <AdminButton type="button" variant="secondary" size="sm" icon="media" onClick={() => setHeroMediaModalOpen(true)}>
                          {t.chooseMedia}
                        </AdminButton>
                      </div>
                      {config.hero.hero_image ? (
                        <Image
                          className="home-composer-hero-media-preview"
                          src={config.hero.hero_image}
                          alt="Hero preview"
                          width={1200}
                          height={675}
                          unoptimized
                        />
                      ) : null}
                      {heroImageError ? <p id="hero-image-error" className="home-composer-banner home-composer-banner--error" role="alert">{heroImageError}</p> : null}
                    </div>
                  </ActionCard>

                  <ActionCard className="home-composer-card" bodyClassName="home-composer-stack" title={t.trustStripTitle} description={t.trustStripDescription} icon="success" titleTag="h2">
                    <AdminRepeaterEditor
                      items={trustStripItems}
                      addLabel={editorLabels.addItem}
                      emptyTitle={editorLabels.emptyItem}
                      emptyDescription={editorLabels.emptyFields}
                      onAdd={() => updateTrustStripItems([...trustStripItems, { key: `trust-${trustStripItems.length + 1}`, text: '' }])}
                      onRemove={(index) => updateTrustStripItems(trustStripItems.filter((_, itemIndex) => itemIndex !== index))}
                      onMove={(index, direction) => {
                        const next = [...trustStripItems];
                        const targetIndex = index + direction;
                        if (targetIndex < 0 || targetIndex >= next.length) return;
                        [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
                        updateTrustStripItems(next);
                      }}
                      getKey={(item, index) => item.key || `trust-${index}`}
                      getItemLabel={(_item, index) => `${t.trustStripTitle} ${index + 1}`}
                      renderItem={(item, index) => (
                        <div className="home-composer-dual-grid">
                          <label className="home-composer-form-field">Key<input value={item.key || ''} onChange={(e) => updateTrustStripItems(trustStripItems.map((row, rowIndex) => rowIndex === index ? { ...row, key: e.target.value } : row))} className="home-composer-form-control" /></label>
                          <label className="home-composer-form-field">{t.label}<input value={item.text || ''} onChange={(e) => updateTrustStripItems(trustStripItems.map((row, rowIndex) => rowIndex === index ? { ...row, text: e.target.value } : row))} className="home-composer-form-control" /></label>
                        </div>
                      )}
                    />
                  </ActionCard>
                </div>
              ) : null}

              {activeTab === 'journeys' ? (
                <ActionCard className="home-composer-card" bodyClassName="home-composer-stack" title={t.pathSelectorTitle} description={t.pathSelectorDescription} icon="filter" titleTag="h2">
                  <label className="home-composer-toggle-label">
                    <input type="checkbox" checked={Boolean(config.path_selector.enabled)} onChange={(e) => setConfig((prev) => ({ ...prev, path_selector: { ...prev.path_selector, enabled: e.target.checked } }))} />
                    {t.enabled}
                  </label>
                  <div className="home-composer-dual-grid">
                    <label className="home-composer-form-field">{t.heading}<input value={config.path_selector.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, path_selector: { ...prev.path_selector, heading: e.target.value } }))} className="home-composer-form-control" /></label>
                    <label className="home-composer-form-field">{t.subcopy}<input value={config.path_selector.subcopy || ''} onChange={(e) => setConfig((prev) => ({ ...prev, path_selector: { ...prev.path_selector, subcopy: e.target.value } }))} className="home-composer-form-control" /></label>
                  </div>
                  <AdminRepeaterEditor
                    items={config.path_selector.paths || []}
                    addLabel={editorLabels.addItem}
                    emptyTitle={editorLabels.emptyItem}
                    emptyDescription={editorLabels.emptyFields}
                    onAdd={addPathItem}
                    onRemove={removePathItem}
                    onMove={movePathItem}
                    getKey={(item, index) => item.key || `path-${index}`}
                    getItemLabel={(item) => pathKeyLabel(item.key || 'path')}
                    renderItem={(item, index) => (
                      <div className="home-composer-triple-grid">
                        <label className="home-composer-form-field">Key<input value={item.key || ''} onChange={(e) => setConfig((prev) => {
                          const nextPaths = [...(prev.path_selector.paths || [])];
                          nextPaths[index] = { ...nextPaths[index], key: e.target.value };
                          return { ...prev, path_selector: { ...prev.path_selector, paths: nextPaths } };
                        })} className="home-composer-form-control" /></label>
                        <label className="home-composer-form-field">{t.label}<input value={item.label || ''} onChange={(e) => updatePathItem(index, 'label', e.target.value)} className="home-composer-form-control" /></label>
                        <label className="home-composer-form-field">{t.descriptionLabel}<input value={item.description || ''} onChange={(e) => updatePathItem(index, 'description', e.target.value)} className="home-composer-form-control" /></label>
                        <label className="home-composer-form-field home-composer-record-row--wide">{t.url}<input value={item.url || ''} onChange={(e) => updatePathItem(index, 'url', e.target.value)} className="home-composer-form-control" /></label>
                      </div>
                    )}
                  />
                </ActionCard>
              ) : null}

              {activeTab === 'featured' ? (
                <div className="home-composer-stack">
                  <ActionCard className="home-composer-card" bodyClassName="home-composer-stack" title={t.featuredProjectsTitle} description={t.featuredProjectsDescription} icon="projects" titleTag="h2">
                    <div className="home-composer-dual-grid">
                      <label className="home-composer-form-field">{t.mode}<select value={config.featured_projects.mode || 'auto'} onChange={(e) => setConfig((prev) => ({ ...prev, featured_projects: { ...prev.featured_projects, mode: e.target.value as 'manual' | 'auto' } }))} className="home-composer-form-control"><option value="auto">{t.auto}</option><option value="manual">{t.manual}</option></select></label>
                      <label className="home-composer-form-field">{t.fallbackRule}<input value={config.featured_projects.fallback_rule || ''} onChange={(e) => setConfig((prev) => ({ ...prev, featured_projects: { ...prev.featured_projects, fallback_rule: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.heading}<input value={config.featured_projects.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, featured_projects: { ...prev.featured_projects, heading: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.subcopy}<input value={config.featured_projects.subcopy || ''} onChange={(e) => setConfig((prev) => ({ ...prev, featured_projects: { ...prev.featured_projects, subcopy: e.target.value } }))} className="home-composer-form-control" /></label>
                    </div>
                    <div className="home-composer-selection-summary">
                      <div>
                        <strong>{editorLabels.selectedCount}</strong>
                        <div className="home-composer-selection-chips">{selectedProjectSummary.length > 0 ? selectedProjectSummary.map((item) => <span key={item.id} className="crm-chip crm-chip-muted">{item.name || item.slug || item.id}</span>) : <span className="crm-chip crm-chip-muted">{t.notAvailable}</span>}</div>
                      </div>
                      <AdminButton type="button" variant="secondary" icon="search" onClick={() => setProjectPickerOpen(true)}>{editorLabels.chooseItems}</AdminButton>
                    </div>
                  </ActionCard>

                  <ActionCard className="home-composer-card" bodyClassName="home-composer-stack" title={t.featuredPropertiesTitle} description={t.featuredPropertiesDescription} icon="properties" titleTag="h2">
                    <div className="home-composer-dual-grid">
                      <label className="home-composer-form-field">{t.mode}<select value={config.featured_properties.mode || 'auto'} onChange={(e) => setConfig((prev) => ({ ...prev, featured_properties: { ...prev.featured_properties, mode: e.target.value as 'manual' | 'auto' } }))} className="home-composer-form-control"><option value="auto">{t.auto}</option><option value="manual">{t.manual}</option></select></label>
                      <label className="home-composer-form-field">{t.fallbackRule}<input value={config.featured_properties.fallback_rule || ''} onChange={(e) => setConfig((prev) => ({ ...prev, featured_properties: { ...prev.featured_properties, fallback_rule: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.heading}<input value={config.featured_properties.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, featured_properties: { ...prev.featured_properties, heading: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.subcopy}<input value={config.featured_properties.subcopy || ''} onChange={(e) => setConfig((prev) => ({ ...prev, featured_properties: { ...prev.featured_properties, subcopy: e.target.value } }))} className="home-composer-form-control" /></label>
                    </div>
                    <div className="home-composer-selection-summary">
                      <div>
                        <strong>{editorLabels.selectedCount}</strong>
                        <div className="home-composer-selection-chips">{selectedPropertySummary.length > 0 ? selectedPropertySummary.map((item) => <span key={item.id} className="crm-chip crm-chip-muted">{formatCandidatePropertyTitle(item)}</span>) : <span className="crm-chip crm-chip-muted">{t.notAvailable}</span>}</div>
                      </div>
                      <AdminButton type="button" variant="secondary" icon="search" onClick={() => setPropertyPickerOpen(true)}>{editorLabels.chooseItems}</AdminButton>
                    </div>
                  </ActionCard>
                </div>
              ) : null}

              {activeTab === 'market-story' ? (
                <div className="home-composer-stack">
                  <ActionCard className="home-composer-card" bodyClassName="home-composer-stack" title={t.whyPattayaTitle} description={t.whyPattayaDescription} icon="dashboard" titleTag="h2">
                    <label className="home-composer-toggle-label"><input type="checkbox" checked={Boolean(config.why_pattaya.enabled)} onChange={(e) => setConfig((prev) => ({ ...prev, why_pattaya: { ...prev.why_pattaya, enabled: e.target.checked } }))} />{t.enabled}</label>
                    <div className="home-composer-dual-grid">
                      <label className="home-composer-form-field">{t.heading}<input value={config.why_pattaya.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, why_pattaya: { ...prev.why_pattaya, heading: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.subcopy}<input value={config.why_pattaya.subcopy || ''} onChange={(e) => setConfig((prev) => ({ ...prev, why_pattaya: { ...prev.why_pattaya, subcopy: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.primaryLabel}<input value={config.why_pattaya.primary_cta_label || ''} onChange={(e) => setConfig((prev) => ({ ...prev, why_pattaya: { ...prev.why_pattaya, primary_cta_label: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.primaryUrl}<input value={config.why_pattaya.primary_cta_url || ''} onChange={(e) => setConfig((prev) => ({ ...prev, why_pattaya: { ...prev.why_pattaya, primary_cta_url: e.target.value } }))} className="home-composer-form-control" /></label>
                    </div>
                    {renderObjectRepeater(t.whyPattayaMetricsJson, metricsItems, setMetricsText)}
                    {renderObjectRepeater(t.whyPattayaNarrativesJson, whyPattayaNarrativesItems, setWhyPattayaNarrativesText)}
                  </ActionCard>
                  <ActionCard className="home-composer-card" bodyClassName="home-composer-stack" title={t.proofTrustTitle} description={t.proofTrustDescription} icon="success" titleTag="h2">
                    <label className="home-composer-toggle-label"><input type="checkbox" checked={Boolean(config.proof_trust.enabled)} onChange={(e) => setConfig((prev) => ({ ...prev, proof_trust: { ...prev.proof_trust, enabled: e.target.checked } }))} />{t.enabled}</label>
                    <div className="home-composer-dual-grid">
                      <label className="home-composer-form-field">{t.heading}<input value={config.proof_trust.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, proof_trust: { ...prev.proof_trust, heading: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.subcopy}<input value={config.proof_trust.subcopy || ''} onChange={(e) => setConfig((prev) => ({ ...prev, proof_trust: { ...prev.proof_trust, subcopy: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.primaryLabel}<input value={config.proof_trust.primary_cta_label || ''} onChange={(e) => setConfig((prev) => ({ ...prev, proof_trust: { ...prev.proof_trust, primary_cta_label: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.primaryUrl}<input value={config.proof_trust.primary_cta_url || ''} onChange={(e) => setConfig((prev) => ({ ...prev, proof_trust: { ...prev.proof_trust, primary_cta_url: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.secondaryLabel}<input value={config.proof_trust.secondary_cta_label || ''} onChange={(e) => setConfig((prev) => ({ ...prev, proof_trust: { ...prev.proof_trust, secondary_cta_label: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.secondaryUrl}<input value={config.proof_trust.secondary_cta_url || ''} onChange={(e) => setConfig((prev) => ({ ...prev, proof_trust: { ...prev.proof_trust, secondary_cta_url: e.target.value } }))} className="home-composer-form-control" /></label>
                    </div>
                    {renderObjectRepeater(t.trustProofsJson, trustProofItems, setTrustProofsText)}
                    {renderObjectRepeater(t.processTimelineJson, processTimelineItems, setProcessTimelineText)}
                  </ActionCard>
                  <ActionCard className="home-composer-card" bodyClassName="home-composer-stack" title={sectionLabel('market_insights')} description={t.supportingEditorDescription} icon="dashboard" titleTag="h2">
                    <label className="home-composer-toggle-label"><input type="checkbox" checked={Boolean(config.market_insights.enabled)} onChange={(e) => setConfig((prev) => ({ ...prev, market_insights: { ...prev.market_insights, enabled: e.target.checked } }))} />{t.enabled}</label>
                    <div className="home-composer-triple-grid">
                      <label className="home-composer-form-field">{t.heading}<input value={config.market_insights.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, market_insights: { ...prev.market_insights, heading: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.subcopy}<input value={config.market_insights.subcopy || ''} onChange={(e) => setConfig((prev) => ({ ...prev, market_insights: { ...prev.market_insights, subcopy: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.mode}<input value={config.market_insights.mode || ''} onChange={(e) => setConfig((prev) => ({ ...prev, market_insights: { ...prev.market_insights, mode: e.target.value } }))} className="home-composer-form-control" /></label>
                    </div>
                    {renderObjectRepeater(t.supportingCardsJson, marketInsightItems, setMarketInsightsCardsText)}
                  </ActionCard>
                </div>
              ) : null}

              {activeTab === 'social-proof' ? (
                <div className="home-composer-stack">
                  <ActionCard className="home-composer-card" bodyClassName="home-composer-stack" title={sectionLabel('reviews')} description={t.supportingSectionsDescription} icon="testimonials" titleTag="h2">
                    <label className="home-composer-toggle-label"><input type="checkbox" checked={Boolean(config.reviews.enabled)} onChange={(e) => setConfig((prev) => ({ ...prev, reviews: { ...prev.reviews, enabled: e.target.checked } }))} />{t.enabled}</label>
                    <div className="home-composer-triple-grid">
                      <label className="home-composer-form-field">{t.heading}<input value={config.reviews.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, reviews: { ...prev.reviews, heading: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.subcopy}<input value={config.reviews.subcopy || ''} onChange={(e) => setConfig((prev) => ({ ...prev, reviews: { ...prev.reviews, subcopy: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.mode}<input value={config.reviews.mode || ''} onChange={(e) => setConfig((prev) => ({ ...prev, reviews: { ...prev.reviews, mode: e.target.value } }))} className="home-composer-form-control" /></label>
                    </div>
                    {renderObjectRepeater(t.reviewItemsJson, reviewItems, setReviewItemsText)}
                  </ActionCard>
                  <ActionCard className="home-composer-card" bodyClassName="home-composer-stack" title={sectionLabel('videos')} description={t.supportingSectionsDescription} icon="videos" titleTag="h2">
                    <label className="home-composer-toggle-label"><input type="checkbox" checked={Boolean(config.videos.enabled)} onChange={(e) => setConfig((prev) => ({ ...prev, videos: { ...prev.videos, enabled: e.target.checked } }))} />{t.enabled}</label>
                    <div className="home-composer-triple-grid">
                      <label className="home-composer-form-field">{t.heading}<input value={config.videos.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, videos: { ...prev.videos, heading: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.subcopy}<input value={config.videos.subcopy || ''} onChange={(e) => setConfig((prev) => ({ ...prev, videos: { ...prev.videos, subcopy: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.mode}<input value={config.videos.mode || ''} onChange={(e) => setConfig((prev) => ({ ...prev, videos: { ...prev.videos, mode: e.target.value } }))} className="home-composer-form-control" /></label>
                    </div>
                    {renderObjectRepeater(t.videoItemsJson, videoItems, setVideoItemsText)}
                  </ActionCard>
                </div>
              ) : null}

              {activeTab === 'conversion' ? (
                <div className="home-composer-stack">
                  <ActionCard className="home-composer-card" bodyClassName="home-composer-stack" title={t.teamCtaTitle} description={t.teamCtaDescription} icon="message" titleTag="h2">
                    <label className="home-composer-toggle-label"><input type="checkbox" checked={Boolean(config.team_cta.enabled)} onChange={(e) => setConfig((prev) => ({ ...prev, team_cta: { ...prev.team_cta, enabled: e.target.checked } }))} />{t.enabled}</label>
                    <div className="home-composer-dual-grid">
                      <label className="home-composer-form-field">{t.eyebrowLabel}<input value={config.team_cta.eyebrow || ''} onChange={(e) => setConfig((prev) => ({ ...prev, team_cta: { ...prev.team_cta, eyebrow: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.heading}<input value={config.team_cta.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, team_cta: { ...prev.team_cta, heading: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.subheading}<input value={config.team_cta.subheading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, team_cta: { ...prev.team_cta, subheading: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.trustNote}<input value={config.team_cta.trust_note || ''} onChange={(e) => setConfig((prev) => ({ ...prev, team_cta: { ...prev.team_cta, trust_note: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.primaryLabel}<input value={config.team_cta.primary_cta_label || ''} onChange={(e) => setConfig((prev) => ({ ...prev, team_cta: { ...prev.team_cta, primary_cta_label: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.primaryUrl}<input value={config.team_cta.primary_cta_url || ''} onChange={(e) => setConfig((prev) => ({ ...prev, team_cta: { ...prev.team_cta, primary_cta_url: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.secondaryLabel}<input value={config.team_cta.secondary_cta_label || ''} onChange={(e) => setConfig((prev) => ({ ...prev, team_cta: { ...prev.team_cta, secondary_cta_label: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.secondaryUrl}<input value={config.team_cta.secondary_cta_url || ''} onChange={(e) => setConfig((prev) => ({ ...prev, team_cta: { ...prev.team_cta, secondary_cta_url: e.target.value } }))} className="home-composer-form-control" /></label>
                    </div>
                  </ActionCard>
                  <ActionCard className="home-composer-card" bodyClassName="home-composer-stack" title={t.bottomCtaTitle} description={t.bottomCtaDescription} icon="upload" titleTag="h2">
                    <label className="home-composer-toggle-label"><input type="checkbox" checked={Boolean(config.bottom_cta.enabled)} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, enabled: e.target.checked } }))} />{t.enabled}</label>
                    <div className="home-composer-dual-grid">
                      <label className="home-composer-form-field">{t.heading}<input value={config.bottom_cta.heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, heading: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.subheading}<input value={config.bottom_cta.subheading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, subheading: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.trustNote}<input value={config.bottom_cta.trust_note || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, trust_note: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.formHeadingLabel}<input value={config.bottom_cta.form_heading || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, form_heading: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.formBodyLabel}<input value={config.bottom_cta.form_body || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, form_body: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.primaryLabel}<input value={config.bottom_cta.primary_cta_label || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, primary_cta_label: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.primaryUrl}<input value={config.bottom_cta.primary_cta_url || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, primary_cta_url: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.secondaryLabel}<input value={config.bottom_cta.secondary_cta_label || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, secondary_cta_label: e.target.value } }))} className="home-composer-form-control" /></label>
                      <label className="home-composer-form-field">{t.secondaryUrl}<input value={config.bottom_cta.secondary_cta_url || ''} onChange={(e) => setConfig((prev) => ({ ...prev, bottom_cta: { ...prev.bottom_cta, secondary_cta_url: e.target.value } }))} className="home-composer-form-control" /></label>
                    </div>
                  </ActionCard>
                </div>
              ) : null}
            </div>
          ) : null}
        </AdminPageBody>

          <AdminSelectionDrawer open={heroMediaModalOpen} title={t.heroImagePickerTitle} description={t.heroImagePickerDescription} onClose={() => setHeroMediaModalOpen(false)} closeLabel={t.close}>
            <AdminSearchablePicker
              query={candidateSearch}
              onQueryChange={setCandidateSearch}
              queryPlaceholder={t.searchPlaceholder}
              items={mediaCandidates}
              getKey={(asset) => asset.id}
              getLabel={(asset) => asset.storage_path}
              getMeta={(asset) => formatMediaCompliance(asset)}
              getBadge={(asset) => <span className={`home-composer-media-status-badge ${mediaBadgeClass(asset)}`}>{formatMediaCompliance(asset)}</span>}
              onSelect={(asset) => selectHeroMedia(asset.storage_path)}
              emptyMessage={t.mediaCandidatesEmpty}
            />
          </AdminSelectionDrawer>

          <AdminSelectionDrawer open={projectPickerOpen} title={t.featuredProjectsTitle} description={t.featuredProjectsDescription} onClose={() => setProjectPickerOpen(false)} closeLabel={t.close}>
            <AdminSearchablePicker
              query={candidateSearch}
              onQueryChange={setCandidateSearch}
              queryPlaceholder={t.searchPlaceholder}
              items={projectCandidates}
              getKey={(item) => item.id}
              getLabel={(item) => item.name || item.slug || item.id}
              getMeta={(item) => formatCandidateProjectMeta(item)}
              getBadge={(item) => selectedProjectIds.has(item.id) ? editorLabels.selected : ''}
              onSelect={(item) => toggleProjectDrawerSelection(item.id)}
              emptyMessage={t.mediaCandidatesEmpty}
            />
          </AdminSelectionDrawer>

          <AdminSelectionDrawer open={propertyPickerOpen} title={t.featuredPropertiesTitle} description={t.featuredPropertiesDescription} onClose={() => setPropertyPickerOpen(false)} closeLabel={t.close}>
            <AdminSearchablePicker
              query={candidateSearch}
              onQueryChange={setCandidateSearch}
              queryPlaceholder={t.searchPlaceholder}
              items={propertyCandidates}
              getKey={(item) => item.id}
              getLabel={(item) => formatCandidatePropertyTitle(item)}
              getMeta={(item) => formatCandidatePropertyMeta(item)}
              getBadge={(item) => selectedPropertyIds.has(item.id) ? editorLabels.selected : ''}
              onSelect={(item) => togglePropertyDrawerSelection(item.id)}
              emptyMessage={t.mediaCandidatesEmpty}
            />
          </AdminSelectionDrawer>
        </>
      )}
    </AdminPage>
  );
}
