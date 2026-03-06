import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";

const DEVELOPER_CREATE_TEMPLATE = JSON.stringify(
  {
    name: "Sample Developer",
    slug: "sample-developer-cms",
    status: "inactive",
    profile: { en: "Profile", th: "โปรไฟล์" },
    summary: { en: "Summary", th: "สรุป" },
    source_note: "owner approved",
    trust_proof: {
      en: "Registered developer profile verified by legal team.",
      th: "โปรไฟล์ผู้พัฒนาได้รับการตรวจสอบโดยทีมกฎหมายแล้ว",
      approval_status: "approved",
      legal_approved: true,
    },
  },
  null,
  2
);

const DEVELOPER_PATCH_TEMPLATE = JSON.stringify({ name: "Updated Developer Name" }, null, 2);

const DEVELOPER_CREATE_FIELDS = [
  { name: "name", label: "Name", type: "text", required: true, placeholder: "Sample Developer" },
  { name: "slug", label: "Slug", type: "text", required: true, placeholder: "sample-developer-cms" },
  {
    name: "status",
    label: "Status",
    type: "status",
    required: true,
    options: ["inactive", "active"],
  },
  { name: "website", label: "Website", type: "text", placeholder: "https://developer.example" },
  { name: "logo_url", label: "Logo image", type: "media", placeholder: "/media/library/logo.jpg" },
  { name: "cover_image_url", label: "Cover image", type: "media", placeholder: "/media/library/cover.jpg" },
  { name: "profile.en", label: "Profile (EN)", type: "textarea", rows: 3, required: true },
  { name: "profile.th", label: "Profile (TH)", type: "textarea", rows: 3, required: true },
  { name: "summary.en", label: "Summary (EN)", type: "textarea", rows: 3 },
  { name: "summary.th", label: "Summary (TH)", type: "textarea", rows: 3 },
  { name: "source_note", label: "Source note", type: "textarea", rows: 2, required: true },
  {
    name: "trust_proof",
    label: "Trust proof (JSON: include en/th + approval)",
    type: "json",
    required: true,
    placeholder:
      '{"en":"Legal profile verification complete.","th":"ตรวจสอบเอกสารทางกฎหมายเรียบร้อยแล้ว","approval_status":"approved","legal_approved":true}',
    rows: 4,
  },
] as const;

const DEVELOPER_PATCH_FIELDS = [
  { name: "name", label: "Name", type: "text" },
  { name: "slug", label: "Slug", type: "text" },
  { name: "status", label: "Status", type: "status", options: ["inactive", "active"] },
  { name: "website", label: "Website", type: "text", placeholder: "https://developer.example" },
  { name: "logo_url", label: "Logo image", type: "media", placeholder: "/media/library/logo.jpg" },
  { name: "cover_image_url", label: "Cover image", type: "media", placeholder: "/media/library/cover.jpg" },
  { name: "profile.en", label: "Profile (EN)", type: "textarea", rows: 3 },
  { name: "profile.th", label: "Profile (TH)", type: "textarea", rows: 3 },
  { name: "summary.en", label: "Summary (EN)", type: "textarea", rows: 3 },
  { name: "summary.th", label: "Summary (TH)", type: "textarea", rows: 3 },
  { name: "source_note", label: "Source note", type: "textarea", rows: 2 },
  {
    name: "trust_proof",
    label: "Trust proof (JSON: include en/th + approval)",
    type: "json",
    placeholder:
      '{"en":"Legal profile verification complete.","th":"ตรวจสอบเอกสารทางกฎหมายเรียบร้อยแล้ว","approval_status":"approved","legal_approved":true}',
    rows: 4,
  },
] as const;

export default function AdminDevelopersCmsPage() {
  return (
    <AdminJsonCrudWorkspace
      config={{
        title: "Developers CMS",
        subtitle:
          "Form-first editor for localized profiles and trust/legal metadata. Use readiness before publish to verify policy checks.",
        identifierLabel: "Developer ID",
        identifierPlaceholder: "developer UUID",
        identifierField: "id",
        listPath: "/admin/developers",
        getPath: "/admin/developers/{id}",
        readinessPath: "/admin/developers/{id}/publish-readiness",
        createPath: "/admin/developers",
        patchPath: "/admin/developers/{id}",
        publishPath: "/admin/developers/{id}/publish",
        unpublishPath: "/admin/developers/{id}/unpublish",
        deletePath: "/admin/developers/{id}",
        defaultListQuery: "limit=40",
        defaultCreatePayload: DEVELOPER_CREATE_TEMPLATE,
        defaultPatchPayload: DEVELOPER_PATCH_TEMPLATE,
        createFormFields: [...DEVELOPER_CREATE_FIELDS],
        patchFormFields: [...DEVELOPER_PATCH_FIELDS],
        queryHelp: "Supported: limit. Publish flow: Check readiness → Publish → Unpublish when needed.",
      }}
    />
  );
}
