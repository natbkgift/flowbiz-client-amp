import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";

const AREA_CREATE_TEMPLATE = JSON.stringify(
  {
    name: "Sample Area",
    slug: "sample-area-cms",
    city: "Pattaya",
    status: "draft",
    summary: { en: "Summary", th: "สรุป" },
    content: {
      en: {
        why_live_invest: "ok",
        transport: "ok",
        lifestyle: "ok",
        beach_proximity: "ok",
        metrics_update_cadence: "monthly",
      },
      th: {
        why_live_invest: "ok",
        transport: "ok",
        lifestyle: "ok",
        beach_proximity: "ok",
        metrics_update_cadence: "monthly",
      },
    },
    source_note: "owner approved",
  },
  null,
  2
);

const AREA_PATCH_TEMPLATE = JSON.stringify({ name: "Updated Area Name" }, null, 2);

const AREA_CREATE_FIELDS = [
  { name: "name", label: "Name", type: "text", required: true, placeholder: "Sample Area" },
  { name: "slug", label: "Slug", type: "text", required: true, placeholder: "sample-area-cms" },
  { name: "city", label: "City", type: "text", required: true, placeholder: "Pattaya" },
  { name: "status", label: "Status", type: "status", required: true, options: ["draft", "published"] },
  { name: "cover_image_url", label: "Cover image", type: "media", placeholder: "/media/library/cover.jpg" },
  { name: "hero_image_url", label: "Hero image", type: "media", placeholder: "/media/library/hero.jpg" },
  { name: "summary.en", label: "Summary (EN)", type: "textarea", rows: 3 },
  { name: "summary.th", label: "Summary (TH)", type: "textarea", rows: 3 },
  { name: "content.en.why_live_invest", label: "Why live/invest (EN)", type: "textarea", rows: 3 },
  { name: "content.en.transport", label: "Transport (EN)", type: "textarea", rows: 3 },
  { name: "content.en.lifestyle", label: "Lifestyle (EN)", type: "textarea", rows: 3 },
  { name: "content.en.beach_proximity", label: "Beach proximity (EN)", type: "textarea", rows: 3 },
  {
    name: "content.en.metrics_update_cadence",
    label: "Metrics update cadence (EN)",
    type: "text",
    placeholder: "Monthly",
  },
  { name: "content.th.why_live_invest", label: "Why live/invest (TH)", type: "textarea", rows: 3 },
  { name: "content.th.transport", label: "Transport (TH)", type: "textarea", rows: 3 },
  { name: "content.th.lifestyle", label: "Lifestyle (TH)", type: "textarea", rows: 3 },
  { name: "content.th.beach_proximity", label: "Beach proximity (TH)", type: "textarea", rows: 3 },
  {
    name: "content.th.metrics_update_cadence",
    label: "Metrics update cadence (TH)",
    type: "text",
    placeholder: "รายเดือน",
  },
  { name: "source_note", label: "Source note", type: "textarea", rows: 2, required: true },
  {
    name: "map_center",
    label: "Map center (JSON)",
    type: "json",
    placeholder: '{"lat":12.9236,"lng":100.8825}',
    rows: 3,
  },
] as const;

const AREA_PATCH_FIELDS = [
  { name: "name", label: "Name", type: "text" },
  { name: "slug", label: "Slug", type: "text" },
  { name: "city", label: "City", type: "text" },
  { name: "status", label: "Status", type: "status", options: ["draft", "published"] },
  { name: "cover_image_url", label: "Cover image", type: "media", placeholder: "/media/library/cover.jpg" },
  { name: "hero_image_url", label: "Hero image", type: "media", placeholder: "/media/library/hero.jpg" },
  { name: "summary.en", label: "Summary (EN)", type: "textarea", rows: 3 },
  { name: "summary.th", label: "Summary (TH)", type: "textarea", rows: 3 },
  { name: "content.en.why_live_invest", label: "Why live/invest (EN)", type: "textarea", rows: 3 },
  { name: "content.en.transport", label: "Transport (EN)", type: "textarea", rows: 3 },
  { name: "content.en.lifestyle", label: "Lifestyle (EN)", type: "textarea", rows: 3 },
  { name: "content.en.beach_proximity", label: "Beach proximity (EN)", type: "textarea", rows: 3 },
  { name: "content.en.metrics_update_cadence", label: "Metrics update cadence (EN)", type: "text" },
  { name: "content.th.why_live_invest", label: "Why live/invest (TH)", type: "textarea", rows: 3 },
  { name: "content.th.transport", label: "Transport (TH)", type: "textarea", rows: 3 },
  { name: "content.th.lifestyle", label: "Lifestyle (TH)", type: "textarea", rows: 3 },
  { name: "content.th.beach_proximity", label: "Beach proximity (TH)", type: "textarea", rows: 3 },
  { name: "content.th.metrics_update_cadence", label: "Metrics update cadence (TH)", type: "text" },
  { name: "source_note", label: "Source note", type: "textarea", rows: 2 },
  {
    name: "map_center",
    label: "Map center (JSON)",
    type: "json",
    placeholder: '{"lat":12.9236,"lng":100.8825}',
    rows: 3,
  },
] as const;

export default function AdminAreasCmsPage() {
  return (
    <AdminJsonCrudWorkspace
      config={{
        title: "Areas CMS",
        subtitle:
          "Form-first editor for EN/TH area guide content. Run readiness before publish to confirm content and statistics requirements.",
        identifierLabel: "Area ID",
        identifierPlaceholder: "area UUID",
        identifierField: "id",
        listPath: "/admin/areas",
        getPath: "/admin/areas/{id}",
        readinessPath: "/admin/areas/{id}/publish-readiness",
        createPath: "/admin/areas",
        patchPath: "/admin/areas/{id}",
        publishPath: "/admin/areas/{id}/publish",
        unpublishPath: "/admin/areas/{id}/unpublish",
        deletePath: "/admin/areas/{id}",
        defaultListQuery: "limit=40",
        defaultCreatePayload: AREA_CREATE_TEMPLATE,
        defaultPatchPayload: AREA_PATCH_TEMPLATE,
        createFormFields: [...AREA_CREATE_FIELDS],
        patchFormFields: [...AREA_PATCH_FIELDS],
        queryHelp: "Supported: limit. Publish flow: Check readiness → Publish → Unpublish when needed.",
      }}
    />
  );
}
