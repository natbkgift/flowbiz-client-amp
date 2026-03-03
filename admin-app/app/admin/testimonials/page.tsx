import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";

const TESTIMONIAL_CREATE_TEMPLATE = JSON.stringify(
  {
    status: "draft",
    persona: "investor",
    intent: "buy",
    quote: "Sample testimonial quote",
    attribution_name: "Client A",
    context: "Sample context",
    display_order: 0,
  },
  null,
  2
);

const TESTIMONIAL_PATCH_TEMPLATE = JSON.stringify(
  {
    quote: "Updated testimonial quote",
    status: "draft",
  },
  null,
  2
);

export default function AdminTestimonialsCmsPage() {
  return (
    <AdminJsonCrudWorkspace
      config={{
        title: "Testimonials CMS",
        subtitle: "Manage testimonials via existing /admin/testimonials APIs.",
        identifierLabel: "Testimonial ID",
        identifierPlaceholder: "testimonial UUID",
        identifierField: "id",
        listPath: "/admin/testimonials",
        getPath: "/admin/testimonials/{id}",
        createPath: "/admin/testimonials",
        patchPath: "/admin/testimonials/{id}",
        publishPath: "/admin/testimonials/{id}/publish",
        unpublishPath: "/admin/testimonials/{id}/unpublish",
        deletePath: "/admin/testimonials/{id}",
        defaultCreatePayload: TESTIMONIAL_CREATE_TEMPLATE,
        defaultPatchPayload: TESTIMONIAL_PATCH_TEMPLATE,
      }}
    />
  );
}
