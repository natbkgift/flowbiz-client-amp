import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";
import { detectAdminLocale } from "@/app/_lib/admin-i18n";

const REVIEW_PATCH_TEMPLATE = JSON.stringify(
  {
    status: "approved",
  },
  null,
  2
);

const REVIEW_PATCH_FIELDS = [
  {
    name: "status",
    label: "Review decision",
    type: "status",
    options: ["approved"],
  },
] as const;

export default function AdminReviewQueuePage() {
  const locale = detectAdminLocale();
  const isThai = locale === "th";

  return (
    <AdminJsonCrudWorkspace
      config={{
        title: isThai ? "คิวตรวจทานบทความ" : "Editorial Review Queue",
        subtitle: isThai
          ? "ตรวจทานและอนุมัติบทความที่อยู่ในสถานะ in_review จากหน้าเดียว"
          : "Review and approve articles waiting in in_review state.",
        identifierLabel: isThai ? "Slug ของบทความ" : "Article slug",
        identifierPlaceholder: "sample-blog-post",
        identifierField: "slug",
        listPath: "/admin/content/articles",
        getPath: "/admin/content/articles/{id}",
        patchPath: "/admin/content/articles/{id}",
        defaultListQuery: "status=in_review&limit=40",
        defaultPatchPayload: REVIEW_PATCH_TEMPLATE,
        patchFormFields: [...REVIEW_PATCH_FIELDS],
        previewConfig: {
          recordPath: "article",
          titlePath: "title",
          excerptPath: "excerpt",
          bodyPath: "body_md",
          locales: ["en", "th"],
        },
        queryHelp: isThai
          ? "ค่าเริ่มต้นจะเปิดคิว review (`status=in_review`) สำหรับงานที่รออนุมัติ และยังปรับ query เพิ่มได้ตามต้องการ"
          : "Defaults to the review queue (`status=in_review`) for pending approvals. You can adjust the query if needed.",
      }}
    />
  );
}
