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
  key: "operations" | "records" | "publishing" | "system";
  label: AdminNavText;
  description: AdminNavText;
  items: AdminNavItem[];
};

const DASHBOARD_NAV: AdminNavItem = {
  href: "/admin/dashboard",
  icon: "dashboard",
  label: { en: "Operations Hub", th: "ศูนย์ปฏิบัติการ" },
  description: { en: "Health + QA overview", th: "ภาพรวมสุขภาพระบบและ QA" },
};

const USERS_NAV: AdminNavItem = {
  href: "/admin/users",
  icon: "users",
  label: { en: "People & Roles", th: "ทีมและสิทธิ์" },
  description: { en: "People access and role assignments", th: "สิทธิ์การเข้าถึงและบทบาทของทีม" },
};

const CRM_NAV: AdminNavItem = {
  href: "/admin/inquiries",
  icon: "message",
  label: { en: "Lead Inbox", th: "กล่องลีด" },
  description: { en: "Lead queue and next actions", th: "คิวลีดและงานถัดไป" },
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

const TEAM_MEMBERS_NAV: AdminNavItem = {
  href: "/admin/team-members",
  icon: "users",
  label: { en: "Team Members", th: "ทีมงาน" },
  description: { en: "Team profiles and bios", th: "จัดการโปรไฟล์และประวัติทีมงาน" },
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
  description: { en: "Local upload, rights, replace", th: "อัปโหลดไฟล์โลคัล ตรวจสิทธิ์ และแทนที่" },
};

const IMPORTS_NAV: AdminNavItem = {
  href: "/admin/imports",
  icon: "imports",
  label: { en: "Import Monitor", th: "ติดตามการนำเข้า" },
  description: { en: "Run imports and monitor health", th: "รันงานนำเข้าและติดตามสถานะ" },
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
  label: { en: "Site Chrome", th: "ส่วนหัวและส่วนท้าย" },
  description: { en: "Header and footer experience", th: "จัดการประสบการณ์ส่วนหัวและส่วนท้าย" },
};

const HOME_COMPOSER_NAV: AdminNavItem = {
  href: "/admin/home-composer",
  icon: "spark",
  label: { en: "Landing Builder", th: "ตัวจัดหน้าแลนดิ้ง" },
  description: { en: "Homepage story and sections", th: "เรื่องราวและส่วนประกอบหน้าแรก" },
};

const SEO_NAV: AdminNavItem = {
  href: "/admin/seo",
  icon: "globe",
  label: { en: "Search Visibility", th: "การมองเห็นบน Search" },
  description: { en: "Search metadata, redirects, broken links", th: "เมทาดาทา การส่งต่อ และลิงก์เสีย" },
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    key: "operations",
    label: { en: "Operations", th: "ปฏิบัติการ" },
    description: {
      en: "Handle queue health, lead follow-up, approvals, and import exceptions.",
      th: "จัดการสุขภาพคิว งานติดตามลีด การอนุมัติ และความผิดปกติของการนำเข้า",
    },
    items: [DASHBOARD_NAV, CRM_NAV, REVIEW_QUEUE_NAV, IMPORTS_NAV],
  },
  {
    key: "records",
    label: { en: "Core Records", th: "ข้อมูลหลัก" },
    description: {
      en: "Edit projects, listings, and supporting records before they move into publish review.",
      th: "แก้โครงการ รายการทรัพย์ และข้อมูลประกอบก่อนส่งต่อไปขั้นตอนตรวจเผยแพร่",
    },
    items: [
      PROJECTS_NAV,
      PROPERTIES_NAV,
      AREAS_NAV,
      DEVELOPERS_NAV,
      COMPANY_NAV,
      TEAM_MEMBERS_NAV,
      TESTIMONIALS_NAV,
      BLOG_NAV,
      VIDEOS_NAV,
      TAXONOMY_NAV,
    ],
  },
  {
    key: "publishing",
    label: { en: "Publishing", th: "การเผยแพร่" },
    description: {
      en: "Manage media, page composition, and search visibility for go-live readiness.",
      th: "จัดการสื่อ องค์ประกอบหน้า และความพร้อมด้านการค้นหาก่อนขึ้นใช้งานจริง",
    },
    items: [
      MEDIA_NAV,
      LAYOUT_NAV,
      HOME_COMPOSER_NAV,
      SEO_NAV,
    ],
  },
  {
    key: "system",
    label: { en: "System", th: "ระบบ" },
    description: {
      en: "Session, access, and operator account controls.",
      th: "ควบคุมเซสชัน สิทธิ์ และบัญชีผู้ปฏิบัติงาน",
    },
    items: [USERS_NAV],
  },
];

function flattenAdminNavItems(groupKeys: AdminNavGroup["key"][]): AdminNavItem[] {
  return ADMIN_NAV_GROUPS.flatMap((group) => (groupKeys.includes(group.key) ? group.items : []));
}

export const ADMIN_PRIMARY_NAV: AdminNavItem[] = flattenAdminNavItems(["operations", "records"]);

export const ADMIN_SECONDARY_NAV: AdminNavItem[] = flattenAdminNavItems(["publishing", "system"]);

export function getAdminNavText(value: AdminNavText, locale: AdminLocale): string {
  return value[locale] || value.en;
}

export function isActiveAdminNav(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
