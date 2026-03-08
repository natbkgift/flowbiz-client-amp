import type { AdminLocale } from "./admin-i18n";
import type { AdminIconName } from "@/components/admin/AdminIcons";

type AdminNavText = Record<AdminLocale, string>;

export type AdminNavItem = {
  href: string;
  label: AdminNavText;
  description: AdminNavText;
  icon: AdminIconName;
};

export const ADMIN_PRIMARY_NAV: AdminNavItem[] = [
  { href: "/admin/dashboard", icon: "dashboard", label: { en: "Dashboard", th: "แดชบอร์ด" }, description: { en: "Health + QA overview", th: "ภาพรวมสุขภาพระบบ + QA" } },
  { href: "/admin/users", icon: "users", label: { en: "Users & Roles", th: "ผู้ใช้และสิทธิ์" }, description: { en: "User accounts and role assignments", th: "บัญชีผู้ใช้และการกำหนดบทบาท" } },
  { href: "/admin/inquiries", icon: "message", label: { en: "CRM", th: "CRM" }, description: { en: "Leads and inquiries workflow", th: "เวิร์กโฟลว์ลีดและลูกค้าสนใจ" } },
  { href: "/admin/projects", icon: "projects", label: { en: "Projects", th: "โครงการ" }, description: { en: "Project CMS workspace", th: "จัดการข้อมูลโครงการ" } },
  { href: "/admin/properties", icon: "properties", label: { en: "Properties", th: "ทรัพย์" }, description: { en: "Property CMS workspace", th: "จัดการข้อมูลทรัพย์" } },
  { href: "/admin/areas", icon: "areas", label: { en: "Areas", th: "โซน/พื้นที่" }, description: { en: "Area CMS workspace", th: "จัดการข้อมูลพื้นที่" } },
  { href: "/admin/developers", icon: "developers", label: { en: "Developers", th: "ผู้พัฒนา" }, description: { en: "Developer CMS workspace", th: "จัดการข้อมูลผู้พัฒนา" } },
  { href: "/admin/company", icon: "company", label: { en: "Company", th: "บริษัท" }, description: { en: "Company content records", th: "เนื้อหาและข้อมูลบริษัท" } },
  { href: "/admin/testimonials", icon: "testimonials", label: { en: "Testimonials", th: "รีวิวลูกค้า" }, description: { en: "Testimonials records", th: "จัดการรีวิวและคำรับรอง" } },
  { href: "/admin/blog", icon: "blog", label: { en: "Blog", th: "บทความ" }, description: { en: "Blog full CRUD workspace", th: "จัดการบทความแบบครบวงจร" } },
  { href: "/admin/review-queue", icon: "review", label: { en: "Review Queue", th: "คิวรีวิว" }, description: { en: "Pending editorial approvals", th: "รายการรออนุมัติเนื้อหา" } },
  { href: "/admin/videos", icon: "videos", label: { en: "Videos", th: "วิดีโอ" }, description: { en: "Video CMS workspace", th: "จัดการวิดีโอ" } },
  { href: "/admin/taxonomy", icon: "taxonomy", label: { en: "Taxonomy", th: "หมวดหมู่กลาง" }, description: { en: "Shared tags/topics registry", th: "แท็กและหัวข้อกลางที่ใช้ร่วมกัน" } },
  { href: "/admin/media", icon: "media", label: { en: "Media Library", th: "คลังสื่อ" }, description: { en: "Upload, integrity, replace", th: "อัปโหลด ตรวจสอบ และแทนที่ไฟล์" } },
  { href: "/admin/imports", icon: "imports", label: { en: "Imports", th: "นำเข้าข้อมูล" }, description: { en: "Import + mirror operations", th: "งานนำเข้าและ mirror" } },
];

export const ADMIN_SECONDARY_NAV: AdminNavItem[] = [
  { href: "/admin/domain", icon: "domain", label: { en: "Domain Ops", th: "งานโดเมน" }, description: { en: "Legacy domain workspace", th: "หน้าจัดการโดเมนแบบเดิม" } },
  { href: "/admin/layout", icon: "layout", label: { en: "Header/Footer", th: "หัวเว็บ/ท้ายเว็บ" }, description: { en: "Layout CMS config", th: "ตั้งค่าเลย์เอาต์เว็บไซต์" } },
  { href: "/admin/home-composer", icon: "spark", label: { en: "Home Composer", th: "คอมโพสหน้าแรก" }, description: { en: "Hero and sections", th: "ฮีโร่และส่วนประกอบหน้าแรก" } },
  { href: "/admin/seo", icon: "globe", label: { en: "SEO", th: "SEO" }, description: { en: "Overrides, redirects, schema", th: "จัดการ override, redirect และ schema" } },
];

export function getAdminNavText(value: AdminNavText, locale: AdminLocale): string {
  return value[locale] || value.en;
}

export function isActiveAdminNav(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
