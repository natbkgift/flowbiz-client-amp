import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";

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
  return (
    <AdminJsonCrudWorkspace
      config={{
        title: "Editorial Review Queue",
        subtitle: "Review and approve articles waiting in in_review state.",
        identifierLabel: "Article slug",
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
        queryHelp:
          "Defaults to the review queue (`status=in_review`) for pending approvals. You can adjust the query if needed.",
      }}
    />
  );
}
