export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
};

export const ADMIN_PRIMARY_NAV: AdminNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", description: "Health + QA overview" },
  { href: "/admin/inquiries", label: "CRM", description: "Leads and inquiries workflow" },
  { href: "/admin/projects", label: "Projects", description: "Project CMS workspace" },
  { href: "/admin/properties", label: "Properties", description: "Property CMS workspace" },
  { href: "/admin/areas", label: "Areas", description: "Area CMS workspace" },
  { href: "/admin/developers", label: "Developers", description: "Developer CMS workspace" },
  { href: "/admin/company", label: "Company", description: "Company content records" },
  { href: "/admin/testimonials", label: "Testimonials", description: "Testimonials records" },
  { href: "/admin/media", label: "Media Library", description: "Upload, integrity, replace" },
  { href: "/admin/imports", label: "Imports", description: "Import + mirror operations" },
];

export const ADMIN_SECONDARY_NAV: AdminNavItem[] = [
  { href: "/admin/domain", label: "Domain Ops", description: "Legacy domain workspace" },
  { href: "/admin/layout", label: "Header/Footer", description: "Layout CMS config" },
  { href: "/admin/home-composer", label: "Home Composer", description: "Hero and sections" },
  { href: "/admin/seo", label: "SEO", description: "Overrides, redirects, schema" },
];

export function isActiveAdminNav(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
