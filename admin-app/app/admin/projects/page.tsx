"use client";

import { detectAdminLocale } from "@/app/_lib/admin-i18n";
import { AdminEntityWorkspace } from "@/components/admin/domain/entity-workspace/AdminEntityWorkspace";

const PROJECT_CREATE_TEMPLATE = JSON.stringify(
  {
    name: "Sample Project",
    slug: "sample-project-cms",
    status: "draft",
    property_type: "condo",
    starting_price: 3900000,
    cover_image_url: "/media/library/projects/sample-project-cover.webp",
    hero_image_url: "/media/library/projects/sample-project-hero.webp",
    highlights: ["Beach access", "Investor-ready handoff"],
    amenities: ["pool", "gym"],
    investment_snapshot: { source: "Internal Desk", updated_at: "2026-03-01" },
    location: { label: "Central Pattaya", context: "Pattaya, Thailand", lat: 12.9348, lng: 100.8897 },
    summary: { en: "Summary", th: "สรุป" },
  },
  null,
  2
);

const PROJECT_PATCH_TEMPLATE = JSON.stringify(
  {
    name: "Updated Project Name",
    starting_price: 4200000,
    highlights: ["Beach access", "Updated investor handoff"],
  },
  null,
  2
);

const PROJECT_CREATE_FIELDS = [
  { name: "name", label: "Name", type: "text", required: true, placeholder: "Sample Project" },
  { name: "slug", label: "Slug", type: "text", required: true, placeholder: "sample-project-cms" },
  { name: "status", label: "Status", type: "status", required: true, options: ["draft", "inactive", "active"] },
  { name: "property_type", label: "Property type", type: "text", required: true, placeholder: "taxonomy slug from kind=property_type (e.g. condo)" },
  { name: "starting_price", label: "Starting price", type: "number", required: true, placeholder: "3900000" },
  { name: "area_id", label: "Area ID", type: "relation", placeholder: "optional area UUID" },
  { name: "developer_id", label: "Developer ID", type: "relation", placeholder: "optional developer UUID" },
  { name: "location.label", label: "Location label", type: "text", placeholder: "Central Pattaya" },
  { name: "location.context", label: "Location context", type: "text", placeholder: "Pattaya, Thailand" },
  { name: "location.lat", label: "Latitude", type: "number", placeholder: "12.9348" },
  { name: "location.lng", label: "Longitude", type: "number", placeholder: "100.8897" },
  { name: "amenities", label: "Facilities", type: "chips", placeholder: "pool, gym", rows: 3 },
  { name: "highlights", label: "Highlights", type: "chips", placeholder: "beach access, investor-ready handoff", rows: 3 },
  { name: "investment_snapshot.source", label: "Investment source", type: "text", placeholder: "Internal Desk" },
  { name: "investment_snapshot.updated_at", label: "Investment snapshot updated", type: "text", placeholder: "2026-03-01" },
  { name: "cover_image_url", label: "Cover image", type: "media", placeholder: "/media/library/projects/sample-project-cover.webp" },
  { name: "hero_image_url", label: "Hero image", type: "media", placeholder: "/media/library/projects/sample-project-hero.webp" },
  { name: "summary.en", label: "Summary (EN)", type: "textarea", rows: 3 },
  { name: "summary.th", label: "Summary (TH)", type: "textarea", rows: 3 },
] as const;

const PROJECT_PATCH_FIELDS = [
  { name: "name", label: "Name", type: "text" },
  { name: "status", label: "Status", type: "status", options: ["draft", "inactive", "active"] },
  { name: "property_type", label: "Property type", type: "text", placeholder: "e.g. condo" },
  { name: "starting_price", label: "Starting price", type: "number", placeholder: "4200000" },
  { name: "area_id", label: "Area ID", type: "relation", placeholder: "optional area UUID" },
  { name: "developer_id", label: "Developer ID", type: "relation", placeholder: "optional developer UUID" },
  { name: "location.label", label: "Location label", type: "text", placeholder: "Central Pattaya" },
  { name: "location.context", label: "Location context", type: "text", placeholder: "Pattaya, Thailand" },
  { name: "location.lat", label: "Latitude", type: "number", placeholder: "12.9348" },
  { name: "location.lng", label: "Longitude", type: "number", placeholder: "100.8897" },
  { name: "amenities", label: "Facilities", type: "chips", placeholder: "pool, gym", rows: 3 },
  { name: "highlights", label: "Highlights", type: "chips", placeholder: "beach access, investor-ready handoff", rows: 3 },
  { name: "investment_snapshot.source", label: "Investment source", type: "text", placeholder: "Internal Desk" },
  { name: "investment_snapshot.updated_at", label: "Investment snapshot updated", type: "text", placeholder: "2026-03-01" },
  { name: "cover_image_url", label: "Cover image", type: "media", placeholder: "/media/library/projects/sample-project-cover.webp" },
  { name: "hero_image_url", label: "Hero image", type: "media", placeholder: "/media/library/projects/sample-project-hero.webp" },
  { name: "summary.en", label: "Summary (EN)", type: "textarea", rows: 3 },
  { name: "summary.th", label: "Summary (TH)", type: "textarea", rows: 3 },
] as const;

const PROJECT_CREATE_SECTIONS = [
  {
    title: "Project identity",
    description: "Start with the fields operators use to identify and queue the project correctly.",
    fields: ["name", "slug", "status", "property_type", "starting_price"],
  },
  {
    title: "Publish essentials",
    description: "Complete the summary, highlights, facilities, and investment snapshot before sending the project into publish review.",
    fields: ["summary.en", "summary.th", "highlights", "amenities", "investment_snapshot.source", "investment_snapshot.updated_at"],
  },
  {
    title: "Location and relationships",
    description: "Link the project to its area/developer or fill the location context fields so the readiness guard can clear.",
    fields: ["area_id", "developer_id", "location.label", "location.context", "location.lat", "location.lng"],
  },
  {
    title: "Publish media",
    description: "Attach the local cover and hero assets used downstream before moving into review.",
    fields: ["cover_image_url", "hero_image_url"],
  },
] as const;

const PROJECT_PATCH_SECTIONS = [
  {
    title: "Queue and identity",
    description: "Keep status, type, and naming aligned with the live record before changing publish state.",
    fields: ["name", "status", "property_type", "starting_price"],
  },
  {
    title: "Readiness details",
    description: "Use these fields to close the exact publish blockers surfaced by the readiness contract.",
    fields: ["summary.en", "summary.th", "highlights", "amenities", "investment_snapshot.source", "investment_snapshot.updated_at"],
  },
  {
    title: "Location and linked records",
    description: "Verify the location context and related records before moving to review and publish.",
    fields: ["area_id", "developer_id", "location.label", "location.context", "location.lat", "location.lng"],
  },
  {
    title: "Publish media",
    description: "Confirm the local cover and hero image paths before moving to review or publish.",
    fields: ["cover_image_url", "hero_image_url"],
  },
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
          { label: isThai ? "ราคาเริ่มต้น" : "Starting price", path: "starting_price" },
          { label: isThai ? "Hero image" : "Hero image", path: "hero_image_url" },
          { label: isThai ? "สรุป EN" : "Summary EN", path: "summary.en" },
          { label: isThai ? "สรุป TH" : "Summary TH", path: "summary.th" },
        ],
        previewConfig: {
          titlePath: "summary",
          locales: ["en", "th"],
        },
        publishChecklistConfig: {
          requiredLocales: [],
          warningLocales: ["th"],
          requiredLocalizedFields: [{ path: "summary", label: "Summary" }],
          requiredFieldGroups: [
            { label: "Summary", rules: [{ paths: ["summary"] }] },
            { label: "Highlights", rules: [{ paths: ["highlights"] }] },
            {
              label: "Location",
              rules: [
                { paths: ["area_id", "location.context", "location.label"] },
                { paths: ["location.lat", "location.lng"], mode: "all" },
                { paths: ["location.latitude", "location.longitude"], mode: "all" },
              ],
            },
            { label: "Facilities", rules: [{ paths: ["amenities"] }] },
            { label: "Hero media", rules: [{ paths: ["cover_image_url", "hero_image_url"], localMedia: true }] },
            { label: "Investment source", rules: [{ paths: ["investment_snapshot.source"] }] },
            { label: "Investment snapshot updated", rules: [{ paths: ["investment_snapshot.updated_at"] }] },
          ],
          requiredNumericGreaterThanZeroPaths: ["starting_price"],
        },
        createSections: [...PROJECT_CREATE_SECTIONS],
        patchSections: [...PROJECT_PATCH_SECTIONS],
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
