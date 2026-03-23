"use client";

import { detectAdminLocale } from "@/app/_lib/admin-i18n";
import { AdminEntityWorkspace } from "@/components/admin/domain/entity-workspace/AdminEntityWorkspace";

const PROJECT_CREATE_TEMPLATE = JSON.stringify(
  {
    name: "Sample Project",
    slug: "sample-project-cms",
    status: "draft",
    property_type: "condo",
    summary: { en: "Summary", th: "สรุป" },
  },
  null,
  2
);

const PROJECT_PATCH_TEMPLATE = JSON.stringify({ name: "Updated Project Name" }, null, 2);

const PROJECT_CREATE_FIELDS = [
  { name: "name", label: "Name", type: "text", required: true, placeholder: "Sample Project" },
  { name: "slug", label: "Slug", type: "text", required: true, placeholder: "sample-project-cms" },
  { name: "status", label: "Status", type: "status", required: true, options: ["draft", "inactive", "active"] },
  { name: "property_type", label: "Property type", type: "text", required: true, placeholder: "taxonomy slug from kind=property_type (e.g. condo)" },
  { name: "area_id", label: "Area ID", type: "relation", placeholder: "optional area UUID" },
  { name: "developer_id", label: "Developer ID", type: "relation", placeholder: "optional developer UUID" },
  { name: "amenities", label: "Facilities", type: "chips", placeholder: "pool, gym", rows: 3 },
  { name: "investment_snapshot", label: "Investment snapshot (JSON)", type: "json", placeholder: "{\"source\":\"Internal Desk\",\"updated_at\":\"2026-03-01\"}", rows: 4 },
  { name: "hero_media_id", label: "Hero media", type: "media", placeholder: "optional media ID/path" },
  { name: "summary.en", label: "Summary (EN)", type: "textarea", rows: 3 },
  { name: "summary.th", label: "Summary (TH)", type: "textarea", rows: 3 },
] as const;

const PROJECT_PATCH_FIELDS = [
  { name: "name", label: "Name", type: "text" },
  { name: "status", label: "Status", type: "status", options: ["draft", "inactive", "active"] },
  { name: "property_type", label: "Property type", type: "text", placeholder: "e.g. condo" },
  { name: "area_id", label: "Area ID", type: "relation", placeholder: "optional area UUID" },
  { name: "developer_id", label: "Developer ID", type: "relation", placeholder: "optional developer UUID" },
  { name: "amenities", label: "Facilities", type: "chips", placeholder: "pool, gym", rows: 3 },
  { name: "investment_snapshot", label: "Investment snapshot (JSON)", type: "json", placeholder: "{\"source\":\"Internal Desk\",\"updated_at\":\"2026-03-01\"}", rows: 4 },
  { name: "hero_media_id", label: "Hero media", type: "media", placeholder: "optional media ID/path" },
] as const;

export default function AdminProjectsCmsPage() {
  const locale = detectAdminLocale();
  const isThai = locale === "th";

  return (
    <AdminEntityWorkspace
      locale={locale}
      config={{
        title: isThai ? "จัดการโครงการ" : "Projects CMS",
        subtitle: isThai
          ? "หาโครงการที่ถูกต้อง ตรวจสรุปสำคัญ แล้วแก้หรือเผยแพร่จาก detail pane เดียว"
          : "Find the right project, review key context, then update or publish from one detail pane.",
        icon: "projects",
        eyebrow: isThai ? "พื้นที่จัดการโครงการ" : "Project operations",
        listPath: "/admin/projects",
        getPath: "/admin/projects/{id}",
        createPath: "/admin/projects",
        patchPath: "/admin/projects/{id}",
        publishPath: "/admin/projects/{id}/publish",
        deletePath: "/admin/projects/{id}",
        baseListQuery: "limit=40",
        identifierField: "id",
        identifierLabel: isThai ? "รหัสโครงการ" : "Project ID",
        titlePaths: ["name", "slug"],
        metaPaths: ["property_type"],
        statusPath: "status",
        detailSummaryPaths: [
          { label: isThai ? "Slug" : "Slug", path: "slug" },
          { label: isThai ? "ประเภททรัพย์" : "Property type", path: "property_type" },
          { label: isThai ? "สรุป EN" : "Summary EN", path: "summary.en" },
          { label: isThai ? "สรุป TH" : "Summary TH", path: "summary.th" },
        ],
        createFormFields: [...PROJECT_CREATE_FIELDS],
        patchFormFields: [...PROJECT_PATCH_FIELDS],
        defaultCreatePayload: PROJECT_CREATE_TEMPLATE,
        defaultPatchPayload: PROJECT_PATCH_TEMPLATE,
        followUpLinks: [
          { href: "/admin/properties", label: isThai ? "เปิดทรัพย์" : "Open properties" },
          { href: "/admin/media", label: isThai ? "เปิดคลังสื่อ" : "Open media" },
          { href: "/admin/dashboard", label: isThai ? "เปิดแดชบอร์ด" : "Open dashboard" },
        ],
        listEmpty: isThai ? "ยังไม่พบโครงการในรายการนี้" : "No projects found in this queue.",
        listHint: isThai
          ? "เลือกโครงการจากคิว แล้วตรวจสถานะ ประเภททรัพย์ และสรุปก่อนแก้ไข"
          : "Select a project from the queue, then review status, property type, and summary before editing.",
        createHint: isThai
          ? "สร้างโครงการใหม่พร้อม slug, status และสรุปหลายภาษา โดยยังใช้ payload เดิมของระบบ"
          : "Create a new project with slug, status, and localized summary while keeping the existing API payload shape.",
        detailHint: isThai
          ? "แก้โครงการที่เลือกใน pane เดียว แล้วเผยแพร่เมื่อพร้อม"
          : "Update the selected project in one detail pane, then publish when it is ready.",
        reviewHint: isThai
          ? "ตรวจผลล่าสุดแล้วข้ามไปที่ Properties, Media หรือ Dashboard เพื่อตามงานต่อ"
          : "Review the latest result, then move into Properties, Media, or the dashboard for the next handoff.",
        createLabel: isThai ? "สร้างโครงการ" : "Create project",
        saveLabel: isThai ? "บันทึกโครงการ" : "Save project",
        publishLabel: isThai ? "เผยแพร่โครงการ" : "Publish project",
        deleteLabel: isThai ? "ลบโครงการ" : "Delete project",
        searchPlaceholder: isThai ? "ค้นหาจากชื่อ slug หรือประเภททรัพย์" : "Search by name, slug, or property type",
      }}
    />
  );
}
