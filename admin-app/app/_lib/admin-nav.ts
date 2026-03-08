import type { AdminLocale } from "./admin-i18n";
import type { AdminIconName } from "@/components/admin/AdminIcons";

type AdminNavText = Record<AdminLocale, string>;

export type AdminNavItem = {
  href: string;
  label: AdminNavText;
  description: AdminNavText;
  icon: AdminIconName;
};

export type AdminNavGroup = {
  key: "dashboard" | "data" | "projects" | "content" | "system";
  label: AdminNavText;
  items: AdminNavItem[];
};

const DASHBOARD_NAV: AdminNavItem = {
  href: "/admin/dashboard",
  icon: "dashboard",
  label: { en: "Dashboard", th: "แดชบอร์ด" },
  description: { en: "Health + QA overview", th: "ภาพรวมสุขภาพระบบ + QA" },
};

const USERS_NAV: AdminNavItem = {
  href: "/admin/users",
  icon: "users",
  label: { en: "Users & Roles", th: "ผู้ใช้และสิทธิ์" },
  description: { en: "User accounts and role assignments", th: "บัญชีผู้ใช้และการกำหนดบทบาท" },
};

const CRM_NAV: AdminNavItem = {
  href: "/admin/inquiries",
  icon: "message",
  label: { en: "CRM", th: "CRM" },
  description: { en: "Leads and inquiries workflow", th: "เวิร์กโฟลว์ลีดและลูกค้าสนใจ" },
};

const PROJECTS_NAV: AdminNavItem = {
  href: "/admin/projects",
  icon: "projects",
  label: { en: "Projects", th: "โครงการ" },
  description: { en: "Project CMS workspace", th: "จัดการข้อมูลโครงการ" },
};

const PROPERTIES_NAV: AdminNavItem = {
  href: "/admin/properties",
  icon: "properties",
  label: { en: "Properties", th: "ทรัพย์" },
  description: { en: "Property CMS workspace", th: "จัดการข้อมูลทรัพย์" },
};

const AREAS_NAV: AdminNavItem = {
  href: "/admin/areas",
  icon: "areas",
  label: { en: "Areas", th: "โซน/พื้นที่" },
  description: { en: "Area CMS workspace", th: "จัดการข้อมูลพื้นที่" },
};

const DEVELOPERS_NAV: AdminNavItem = {
  href: "/admin/developers",
  icon: "developers",
  label: { en: "Developers", th: "ผู้พัฒนา" },
  description: { en: "Developer CMS workspace", th: "จัดการข้อมูลผู้พัฒนา" },
};

const COMPANY_NAV: AdminNavItem = {
  href: "/admin/company",
  icon: "company",
  label: { en: "Company", th: "บริษัท" },
  description: { en: "Company content records", th: "เนื้อหาและข้อมูลบริษัท" },
};

const TESTIMONIALS_NAV: AdminNavItem = {
  href: "/admin/testimonials",
  icon: "testimonials",
  label: { en: "Testimonials", th: "รีวิวลูกค้า" },
  description: { en: "Testimonials records", th: "จัดการรีวิวและคำรับรอง" },
};

const BLOG_NAV: AdminNavItem = {
  href: "/admin/blog",
  icon: "blog",
  label: { en: "Blog", th: "บทความ" },
  description: { en: "Blog full CRUD workspace", th: "จัดการบทความแบบครบวงจร" },
};

const REVIEW_QUEUE_NAV: AdminNavItem = {
  href: "/admin/review-queue",
  icon: "review",
  label: { en: "Review Queue", th: "คิวรีวิว" },
  description: { en: "Pending editorial approvals", th: "รายการรออนุมัติเนื้อหา" },
};

const VIDEOS_NAV: AdminNavItem = {
  href: "/admin/videos",
  icon: "videos",
  label: { en: "Videos", th: "วิดีโอ" },
  description: { en: "Video CMS workspace", th: "จัดการวิดีโอ" },
};

const TAXONOMY_NAV: AdminNavItem = {
  href: "/admin/taxonomy",
  icon: "taxonomy",
  label: { en: "Taxonomy", th: "หมวดหมู่กลาง" },
  description: { en: "Shared tags/topics registry", th: "แท็กและหัวข้อกลางที่ใช้ร่วมกัน" },
};

const MEDIA_NAV: AdminNavItem = {
  href: "/admin/media",
  icon: "media",
  label: { en: "Media Library", th: "คลังสื่อ" },
  description: { en: "Upload, integrity, replace", th: "อัปโหลด ตรวจสอบ และแทนที่ไฟล์" },
};

const IMPORTS_NAV: AdminNavItem = {
  href: "/admin/imports",
  icon: "imports",
  label: { en: "Imports", th: "นำเข้าข้อมูล" },
  description: { en: "Import + mirror operations", th: "งานนำเข้าและ mirror" },
};

const DOMAIN_NAV: AdminNavItem = {
  href: "/admin/domain",
  icon: "domain",
  label: { en: "Domain Ops", th: "งานโดเมน" },
  description: { en: "Legacy domain workspace", th: "หน้าจัดการโดเมนแบบเดิม" },
};

const LAYOUT_NAV: AdminNavItem = {
  href: "/admin/layout",
  icon: "layout",
  label: { en: "Header/Footer", th: "หัวเว็บ/ท้ายเว็บ" },
  description: { en: "Layout CMS config", th: "ตั้งค่าเลย์เอาต์เว็บไซต์" },
};

const HOME_COMPOSER_NAV: AdminNavItem = {
  href: "/admin/home-composer",
  icon: "spark",
  label: { en: "Home Composer", th: "คอมโพสหน้าแรก" },
  description: { en: "Hero and sections", th: "ฮีโร่และส่วนประกอบหน้าแรก" },
};

const SEO_NAV: AdminNavItem = {
  href: "/admin/seo",
  icon: "globe",
  label: { en: "SEO", th: "SEO" },
  description: { en: "Overrides, redirects, schema", th: "จัดการ override, redirect และ schema" },
};

export const ADMIN_PRIMARY_NAV: AdminNavItem[] = [
  DASHBOARD_NAV,
  USERS_NAV,
  CRM_NAV,
  PROJECTS_NAV,
  PROPERTIES_NAV,
  AREAS_NAV,
  DEVELOPERS_NAV,
  COMPANY_NAV,
  TESTIMONIALS_NAV,
  BLOG_NAV,
  REVIEW_QUEUE_NAV,
  VIDEOS_NAV,
  TAXONOMY_NAV,
  MEDIA_NAV,
  IMPORTS_NAV,
];

export const ADMIN_SECONDARY_NAV: AdminNavItem[] = [
  DOMAIN_NAV,
  LAYOUT_NAV,
  HOME_COMPOSER_NAV,
  SEO_NAV,
];

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    key: "dashboard",
    label: { en: "Dashboard", th: "แดชบอร์ด" },
    items: [DASHBOARD_NAV],
  },
  {
    key: "data",
    label: { en: "Data", th: "ข้อมูล" },
    items: [IMPORTS_NAV, MEDIA_NAV, CRM_NAV],
  },
  {
    key: "projects",
    label: { en: "Projects", th: "โครงการ" },
    items: [PROJECTS_NAV, PROPERTIES_NAV],
  },
  {
    key: "content",
    label: { en: "Content", th: "เนื้อหา" },
    items: [
      AREAS_NAV,
      DEVELOPERS_NAV,
      COMPANY_NAV,
      TESTIMONIALS_NAV,
      BLOG_NAV,
      REVIEW_QUEUE_NAV,
      VIDEOS_NAV,
      TAXONOMY_NAV,
      LAYOUT_NAV,
      HOME_COMPOSER_NAV,
    ],
  },
  {
    key: "system",
    label: { en: "System", th: "ระบบ" },
    items: [USERS_NAV, SEO_NAV, DOMAIN_NAV],
  },
];

export function getAdminNavText(value: AdminNavText, locale: AdminLocale): string {
  return value[locale] || value.en;
}

export function isActiveAdminNav(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
