'use client';

import Link from 'next/link';
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import {
  clearAuthSession,
  LEGACY_TOKEN_STORAGE_KEY,
  loginAdmin,
  persistAuthSession,
  readAuthSession,
} from '@/app/_lib/admin-auth';
import { detectAdminLocale, persistAdminLocale, withAdminLocale } from '@/app/_lib/admin-i18n';
import {
  SITE_LAYOUT_CMS_SLUG,
  SITE_LAYOUT_CMS_TEMPLATE,
  type LayoutCmsDocument,
  type LayoutCmsLink,
} from '@/app/_lib/layout-cms';
import {
  ActionCard,
  AdminAccessGate,
  AdminBadge,
  AdminButton,
  AdminInput,
  AdminPage,
  AdminPageBody,
  AdminPageHeader,
  AdminPrimaryActionBar,
  AdminRepeaterEditor,
} from '@/components/admin/AdminPrimitives';

type LocaleCode = 'en' | 'th';
type AuthSession = { token: string; email: string };
type CompanyInfoItem = { id: string; slug?: string | null; name?: string | null; content?: string | null };
type EditableLink = { href: string; labelEn: string; labelTh: string; enabled: boolean };
type EditableLayoutDraft = {
  headerPrimaryLinks: EditableLink[];
  headerContactCta: EditableLink;
  footerQuickLinks: EditableLink[];
  footerLegalLinks: EditableLink[];
  footerEmail: string;
  footerFacebookUrl: string;
  footerFacebookLabelEn: string;
  footerFacebookLabelTh: string;
};

const API_PREFIX = '/api';

const COPY = {
  en: {
    eyebrow: 'Navigation and footer',
    title: 'Site Chrome',
    description: 'Manage the public header and footer without editing raw JSON.',
    loginTitle: 'Admin sign in',
    loginDescription: 'Use the same admin account that manages the rest of the admin workspace.',
    sessionTitle: 'Site Chrome session',
    sessionDescription: 'Header and footer content is ready to edit.',
    adminEmail: 'Admin email',
    password: 'Password',
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    signOut: 'Sign out',
    refresh: 'Refresh',
    reset: 'Reset',
    save: 'Save site chrome',
    saving: 'Saving…',
    openCompany: 'Open company records',
    openLandingBuilder: 'Open Landing Builder',
    publishState: 'Content source',
    publishStateValue: 'site-layout',
    previewTitle: 'Live summary',
    previewDescription: 'Quick check before you save.',
    headerTitle: 'Header navigation',
    headerDescription: 'Primary links and contact call-to-action shown in the public header.',
    footerTitle: 'Footer links',
    footerDescription: 'Quick links, legal links, and footer contact details.',
    addPrimaryLink: 'Add header link',
    addQuickLink: 'Add quick link',
    addLegalLink: 'Add legal link',
    emptyPrimaryTitle: 'No header links yet',
    emptyQuickTitle: 'No quick links yet',
    emptyLegalTitle: 'No legal links yet',
    emptyDescription: 'Add links to build the public navigation.',
    linkLabelEn: 'Label (EN)',
    linkLabelTh: 'Label (TH)',
    linkHref: 'Link path',
    linkEnabled: 'Visible',
    contactCtaTitle: 'Header contact CTA',
    email: 'Footer email',
    facebookUrl: 'Facebook URL',
    facebookLabelEn: 'Facebook label (EN)',
    facebookLabelTh: 'Facebook label (TH)',
    statusReady: 'Ready to review',
    statusSaved: 'Saved',
    loadError: 'Unable to load Site Chrome right now.',
    saveError: 'Unable to save Site Chrome right now.',
    authError: 'Sign-in failed. Check the admin email and password.',
    successTitle: 'Site Chrome saved',
    successBody: 'Header and footer changes are stored in the existing site-layout record.',
    contactCtaDescription: 'This button appears on the right side of the public header.',
  },
  th: {
    eyebrow: 'ส่วนหัวและส่วนท้าย',
    title: 'Site Chrome',
    description: 'จัดการเมนูส่วนหัวและส่วนท้ายของเว็บโดยไม่ต้องแก้ JSON ตรง ๆ',
    loginTitle: 'เข้าสู่ระบบผู้ดูแล',
    loginDescription: 'ใช้บัญชีผู้ดูแลชุดเดียวกับหน้า admin อื่น',
    sessionTitle: 'พร้อมแก้ไข Site Chrome',
    sessionDescription: 'ข้อมูล header และ footer พร้อมใช้งาน',
    adminEmail: 'อีเมลผู้ดูแล',
    password: 'รหัสผ่าน',
    signIn: 'เข้าสู่ระบบ',
    signingIn: 'กำลังเข้าสู่ระบบ…',
    signOut: 'ออกจากระบบ',
    refresh: 'รีเฟรช',
    reset: 'รีเซ็ต',
    save: 'บันทึก Site Chrome',
    saving: 'กำลังบันทึก…',
    openCompany: 'เปิดข้อมูลบริษัท',
    openLandingBuilder: 'เปิด Landing Builder',
    publishState: 'แหล่งข้อมูล',
    publishStateValue: 'site-layout',
    previewTitle: 'สรุปก่อนบันทึก',
    previewDescription: 'ตรวจดูจำนวนลิงก์และข้อมูลติดต่อแบบย่อ',
    headerTitle: 'เมนูส่วนหัว',
    headerDescription: 'ลิงก์หลักและปุ่มติดต่อที่แสดงบน header ของเว็บ',
    footerTitle: 'ลิงก์ส่วนท้าย',
    footerDescription: 'ลิงก์ด่วน ลิงก์กฎหมาย และข้อมูลติดต่อใน footer',
    addPrimaryLink: 'เพิ่มลิงก์ส่วนหัว',
    addQuickLink: 'เพิ่มลิงก์ด่วน',
    addLegalLink: 'เพิ่มลิงก์กฎหมาย',
    emptyPrimaryTitle: 'ยังไม่มีลิงก์ส่วนหัว',
    emptyQuickTitle: 'ยังไม่มีลิงก์ด่วน',
    emptyLegalTitle: 'ยังไม่มีลิงก์กฎหมาย',
    emptyDescription: 'เพิ่มลิงก์เพื่อจัดโครงสร้าง navigation หน้าเว็บ',
    linkLabelEn: 'ชื่อปุ่ม (EN)',
    linkLabelTh: 'ชื่อปุ่ม (TH)',
    linkHref: 'พาธลิงก์',
    linkEnabled: 'แสดงผล',
    contactCtaTitle: 'ปุ่มติดต่อบน header',
    email: 'อีเมล footer',
    facebookUrl: 'ลิงก์ Facebook',
    facebookLabelEn: 'ข้อความ Facebook (EN)',
    facebookLabelTh: 'ข้อความ Facebook (TH)',
    statusReady: 'พร้อมตรวจทาน',
    statusSaved: 'บันทึกแล้ว',
    loadError: 'ยังโหลด Site Chrome ไม่สำเร็จในตอนนี้',
    saveError: 'ยังบันทึก Site Chrome ไม่สำเร็จในตอนนี้',
    authError: 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน',
    successTitle: 'บันทึก Site Chrome แล้ว',
    successBody: 'การเปลี่ยนแปลง header และ footer ถูกเก็บใน record site-layout เดิม',
    contactCtaDescription: 'ปุ่มนี้จะอยู่ด้านขวาของ header บนเว็บสาธารณะ',
  },
} as const;

function parseLink(raw?: LayoutCmsLink | null): EditableLink {
  const label = raw?.label;
  return {
    href: String(raw?.href || '').trim(),
    labelEn: typeof label === 'string' ? label : String(label?.en || '').trim(),
    labelTh: typeof label === 'string' ? label : String(label?.th || '').trim(),
    enabled: raw?.enabled !== false,
  };
}

function parseDocument(content: string | null | undefined): LayoutCmsDocument {
  try {
    const parsed = JSON.parse(String(content || SITE_LAYOUT_CMS_TEMPLATE)) as LayoutCmsDocument;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return JSON.parse(SITE_LAYOUT_CMS_TEMPLATE) as LayoutCmsDocument;
  }
}

function createDraft(content: string | null | undefined): EditableLayoutDraft {
  const doc = parseDocument(content);
  return {
    headerPrimaryLinks: Array.isArray(doc.header?.primary_links) ? doc.header!.primary_links!.map(parseLink) : [],
    headerContactCta: parseLink(doc.header?.contact_cta),
    footerQuickLinks: Array.isArray(doc.footer?.quick_links) ? doc.footer!.quick_links!.map(parseLink) : [],
    footerLegalLinks: Array.isArray(doc.footer?.legal_links) ? doc.footer!.legal_links!.map(parseLink) : [],
    footerEmail: String(doc.footer?.contact?.email || '').trim(),
    footerFacebookUrl: String(doc.footer?.contact?.facebook_url || '').trim(),
    footerFacebookLabelEn:
      typeof doc.footer?.contact?.facebook_label === 'string'
        ? String(doc.footer.contact.facebook_label || '').trim()
        : String(doc.footer?.contact?.facebook_label?.en || '').trim(),
    footerFacebookLabelTh:
      typeof doc.footer?.contact?.facebook_label === 'string'
        ? String(doc.footer.contact.facebook_label || '').trim()
        : String(doc.footer?.contact?.facebook_label?.th || '').trim(),
  };
}

function serializeLink(link: EditableLink): LayoutCmsLink {
  return {
    href: link.href.trim(),
    enabled: link.enabled,
    label: { en: link.labelEn.trim(), th: link.labelTh.trim() },
  };
}

function toLayoutDocument(draft: EditableLayoutDraft): LayoutCmsDocument {
  return {
    header: {
      primary_links: draft.headerPrimaryLinks.map(serializeLink),
      contact_cta: serializeLink(draft.headerContactCta),
    },
    footer: {
      quick_links: draft.footerQuickLinks.map(serializeLink),
      legal_links: draft.footerLegalLinks.map(serializeLink),
      contact: {
        email: draft.footerEmail.trim(),
        facebook_url: draft.footerFacebookUrl.trim(),
        facebook_label: {
          en: draft.footerFacebookLabelEn.trim(),
          th: draft.footerFacebookLabelTh.trim(),
        },
      },
    },
  };
}

function emptyLink(): EditableLink {
  return { href: '', labelEn: '', labelTh: '', enabled: true };
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const copy = items.slice();
  const [item] = copy.splice(index, 1);
  copy.splice(target, 0, item);
  return copy;
}

function updateLink(items: EditableLink[], index: number, patch: Partial<EditableLink>): EditableLink[] {
  return items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
}

function LinkFields({
  item,
  onChange,
  copy,
}: {
  item: EditableLink;
  onChange: (patch: Partial<EditableLink>) => void;
  copy: (typeof COPY)[LocaleCode];
}) {
  return (
    <div className="admin-field-grid">
      <AdminInput label={copy.linkLabelEn}>
        <input value={item.labelEn} onChange={(event) => onChange({ labelEn: event.target.value })} />
      </AdminInput>
      <AdminInput label={copy.linkLabelTh}>
        <input value={item.labelTh} onChange={(event) => onChange({ labelTh: event.target.value })} />
      </AdminInput>
      <AdminInput label={copy.linkHref}>
        <input value={item.href} onChange={(event) => onChange({ href: event.target.value })} />
      </AdminInput>
      <label className="admin-switch-field">
        <span>{copy.linkEnabled}</span>
        <input type="checkbox" checked={item.enabled} onChange={(event) => onChange({ enabled: event.target.checked })} />
      </label>
    </div>
  );
}

export default function AdminLayoutCmsPage() {
  const [locale, setLocale] = useState<LocaleCode>('en');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [draft, setDraft] = useState<EditableLayoutDraft>(() => createDraft(SITE_LAYOUT_CMS_TEMPLATE));
  const [baseline, setBaseline] = useState<EditableLayoutDraft>(() => createDraft(SITE_LAYOUT_CMS_TEMPLATE));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState('');
  const [successTitle, setSuccessTitle] = useState('');
  const t = COPY[locale];

  useEffect(() => {
    const detected = detectAdminLocale();
    setLocale(detected);
    setSession(readAuthSession());
  }, []);

  const loadWorkspace = useCallback(async (activeSession: AuthSession) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_PREFIX}/admin/company/${SITE_LAYOUT_CMS_SLUG}`, {
        headers: { Authorization: `Bearer ${activeSession.token}` },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`load_failed:${response.status}`);
      const item = (await response.json()) as CompanyInfoItem;
      const nextDraft = createDraft(item.content);
      setDraft(nextDraft);
      setBaseline(nextDraft);
    } catch {
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  }, [t.loadError]);

  useEffect(() => {
    if (session) void loadWorkspace(session);
  }, [loadWorkspace, session]);

  const changed = useMemo(() => JSON.stringify(draft) !== JSON.stringify(baseline), [baseline, draft]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError('');
    const result = await loginAdmin(email, password);
    if (!result.ok) {
      setAuthError(t.authError);
      return;
    }
    persistAuthSession(result.accessToken, email);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LEGACY_TOKEN_STORAGE_KEY, result.accessToken);
    }
    const nextSession = { token: result.accessToken, email };
    setSession(nextSession);
  }

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    setError('');
    setSuccessTitle('');
    try {
      const body = {
        slug: SITE_LAYOUT_CMS_SLUG,
        name: 'site-layout JSON',
        content: JSON.stringify(toLayoutDocument(draft), null, 2),
      };
      const response = await fetch(`${API_PREFIX}/admin/company`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`save_failed:${response.status}`);
      setBaseline(draft);
      setSuccessTitle(t.successTitle);
    } catch {
      setError(t.saveError);
    } finally {
      setSaving(false);
    }
  }

  function handleLocaleChange(nextLocale: LocaleCode) {
    setLocale(nextLocale);
    persistAdminLocale(nextLocale);
  }

  function handleSignOut() {
    clearAuthSession();
    setSession(null);
    setSuccessTitle('');
  }

  return (
    <AdminPage>
      <AdminPageHeader eyebrow={t.eyebrow} title={t.title} description={t.description} />
      <AdminPageBody>
        <AdminAccessGate
          isAuthenticated={Boolean(session)}
          authTitle={t.loginTitle}
          authDescription={t.loginDescription}
          sessionTitle={t.sessionTitle}
          sessionDescription={t.sessionDescription}
          authContent={
            <form className="admin-form-stack" onSubmit={handleLogin}>
              <AdminInput label={t.adminEmail}>
                <input
                  name="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </AdminInput>
              <AdminInput label={t.password}>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </AdminInput>
              {authError ? <p className="state-error">{authError}</p> : null}
              <AdminButton type="submit">{t.signIn}</AdminButton>
            </form>
          }
          sessionContent={session ? <AdminBadge tone="ok">{session.email || t.statusReady}</AdminBadge> : null}
        >
          <AdminPrimaryActionBar
            title={t.title}
            description={t.description}
            primaryAction={{ label: saving ? t.saving : t.save, onClick: handleSave, disabled: saving || !changed || loading }}
            secondaryActions={[
              { label: t.refresh, onClick: () => session && loadWorkspace(session), disabled: loading },
              { label: t.reset, onClick: () => setDraft(baseline), disabled: !changed || saving },
              { label: t.signOut, onClick: handleSignOut },
            ]}
            meta={
              <>
                <AdminBadge tone={changed ? 'warn' : 'ok'}>{changed ? t.statusReady : t.statusSaved}</AdminBadge>
                <span>{t.publishState}: {t.publishStateValue}</span>
              </>
            }
            mobileBottom
          />

          <div className="admin-toolbar-inline">
            <label className="admin-inline-select">
              <span>Locale</span>
              <select value={locale} onChange={(event) => handleLocaleChange(event.target.value as LocaleCode)}>
                <option value="en">EN</option>
                <option value="th">TH</option>
              </select>
            </label>
            <Link href={withAdminLocale('/admin/company', locale)}>{t.openCompany}</Link>
            <Link href={withAdminLocale('/admin/home-composer', locale)}>{t.openLandingBuilder}</Link>
          </div>

          {error ? <p className="state-error">{error}</p> : null}
          {successTitle ? (
            <div className="admin-workspace-success-handoff">
              <strong>{successTitle}</strong>
              <p>{t.successBody}</p>
            </div>
          ) : null}

          <div className="admin-grid-layout admin-grid-layout--two">
            <ActionCard title={t.headerTitle} description={t.headerDescription}>
              <AdminRepeaterEditor
                items={draft.headerPrimaryLinks}
                addLabel={t.addPrimaryLink}
                emptyTitle={t.emptyPrimaryTitle}
                emptyDescription={t.emptyDescription}
                onAdd={() => setDraft((current) => ({ ...current, headerPrimaryLinks: [...current.headerPrimaryLinks, emptyLink()] }))}
                onRemove={(index) => setDraft((current) => ({ ...current, headerPrimaryLinks: current.headerPrimaryLinks.filter((_, itemIndex) => itemIndex !== index) }))}
                onMove={(index, direction) => setDraft((current) => ({ ...current, headerPrimaryLinks: moveItem(current.headerPrimaryLinks, index, direction) }))}
                getKey={(_, index) => `header-${index}`}
                getItemLabel={(_, index) => `Link ${index + 1}`}
                renderItem={(item, index) => <LinkFields item={item} copy={t} onChange={(patch) => setDraft((current) => ({ ...current, headerPrimaryLinks: updateLink(current.headerPrimaryLinks, index, patch) }))} />}
              />
              <ActionCard title={t.contactCtaTitle} description={t.contactCtaDescription}>
                <LinkFields item={draft.headerContactCta} copy={t} onChange={(patch) => setDraft((current) => ({ ...current, headerContactCta: { ...current.headerContactCta, ...patch } }))} />
              </ActionCard>
            </ActionCard>

            <ActionCard title={t.previewTitle} description={t.previewDescription}>
              <div className="admin-keyvalue-list">
                <div><span>Header</span><strong>{draft.headerPrimaryLinks.filter((item) => item.enabled).length} links</strong></div>
                <div><span>Quick</span><strong>{draft.footerQuickLinks.filter((item) => item.enabled).length} links</strong></div>
                <div><span>Legal</span><strong>{draft.footerLegalLinks.filter((item) => item.enabled).length} links</strong></div>
                <div><span>Email</span><strong>{draft.footerEmail || 'N/A'}</strong></div>
              </div>
            </ActionCard>
          </div>

          <ActionCard title={t.footerTitle} description={t.footerDescription}>
            <div className="admin-grid-layout admin-grid-layout--two">
              <AdminRepeaterEditor
                items={draft.footerQuickLinks}
                addLabel={t.addQuickLink}
                emptyTitle={t.emptyQuickTitle}
                emptyDescription={t.emptyDescription}
                onAdd={() => setDraft((current) => ({ ...current, footerQuickLinks: [...current.footerQuickLinks, emptyLink()] }))}
                onRemove={(index) => setDraft((current) => ({ ...current, footerQuickLinks: current.footerQuickLinks.filter((_, itemIndex) => itemIndex !== index) }))}
                onMove={(index, direction) => setDraft((current) => ({ ...current, footerQuickLinks: moveItem(current.footerQuickLinks, index, direction) }))}
                getKey={(_, index) => `quick-${index}`}
                getItemLabel={(_, index) => `Quick link ${index + 1}`}
                renderItem={(item, index) => <LinkFields item={item} copy={t} onChange={(patch) => setDraft((current) => ({ ...current, footerQuickLinks: updateLink(current.footerQuickLinks, index, patch) }))} />}
              />
              <AdminRepeaterEditor
                items={draft.footerLegalLinks}
                addLabel={t.addLegalLink}
                emptyTitle={t.emptyLegalTitle}
                emptyDescription={t.emptyDescription}
                onAdd={() => setDraft((current) => ({ ...current, footerLegalLinks: [...current.footerLegalLinks, emptyLink()] }))}
                onRemove={(index) => setDraft((current) => ({ ...current, footerLegalLinks: current.footerLegalLinks.filter((_, itemIndex) => itemIndex !== index) }))}
                onMove={(index, direction) => setDraft((current) => ({ ...current, footerLegalLinks: moveItem(current.footerLegalLinks, index, direction) }))}
                getKey={(_, index) => `legal-${index}`}
                getItemLabel={(_, index) => `Legal link ${index + 1}`}
                renderItem={(item, index) => <LinkFields item={item} copy={t} onChange={(patch) => setDraft((current) => ({ ...current, footerLegalLinks: updateLink(current.footerLegalLinks, index, patch) }))} />}
              />
            </div>
            <div className="admin-field-grid">
              <AdminInput label={t.email}>
                <input value={draft.footerEmail} onChange={(event) => setDraft((current) => ({ ...current, footerEmail: event.target.value }))} />
              </AdminInput>
              <AdminInput label={t.facebookUrl}>
                <input value={draft.footerFacebookUrl} onChange={(event) => setDraft((current) => ({ ...current, footerFacebookUrl: event.target.value }))} />
              </AdminInput>
              <AdminInput label={t.facebookLabelEn}>
                <input value={draft.footerFacebookLabelEn} onChange={(event) => setDraft((current) => ({ ...current, footerFacebookLabelEn: event.target.value }))} />
              </AdminInput>
              <AdminInput label={t.facebookLabelTh}>
                <input value={draft.footerFacebookLabelTh} onChange={(event) => setDraft((current) => ({ ...current, footerFacebookLabelTh: event.target.value }))} />
              </AdminInput>
            </div>
          </ActionCard>
        </AdminAccessGate>
      </AdminPageBody>
    </AdminPage>
  );
}
