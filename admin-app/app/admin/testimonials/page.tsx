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

const TESTIMONIAL_CREATE_FIELDS = [
  { name: "status", label: "Status", type: "status", required: true, options: ["draft", "inactive", "active"] },
  { name: "persona", label: "Persona", type: "text", required: true, placeholder: "investor" },
  { name: "intent", label: "Intent", type: "select", required: true, options: ["buy", "rent", "sell"] },
  { name: "quote", label: "Quote", type: "textarea", required: true, rows: 3 },
  { name: "attribution_name", label: "Attribution name", type: "text", required: true, placeholder: "Client A" },
  { name: "context", label: "Context", type: "text", placeholder: "Sample context" },
  { name: "property_id", label: "Property ID", type: "relation", placeholder: "optional property UUID" },
  { name: "avatar_media_id", label: "Avatar media", type: "media", placeholder: "optional media ID/path" },
] as const;

const TESTIMONIAL_PATCH_FIELDS = [
  { name: "quote", label: "Quote", type: "textarea", rows: 3 },
  { name: "status", label: "Status", type: "status", options: ["draft", "inactive", "active"] },
  { name: "property_id", label: "Property ID", type: "relation", placeholder: "optional property UUID" },
  { name: "avatar_media_id", label: "Avatar media", type: "media", placeholder: "optional media ID/path" },
] as const;

export default function AdminTestimonialsCmsPage() {
  return (
    <AdminJsonCrudWorkspace
      config={{
        title: "Testimonials CMS",
        subtitle: "Manage testimonials via existing /admin/testimonials APIs.",
        followUpLinks: [
          {
            href: "/admin/properties",
            label: "Open properties",
            description: "Confirm the linked property context shown with this testimonial.",
          },
          {
            href: "/admin/media",
            label: "Open media",
            description: "Verify avatar or supporting media assets before publishing testimonial changes.",
          },
          {
            href: "/admin/dashboard",
            label: "Open dashboard",
            description: "Review downstream operational signals after updating testimonial content.",
          },
        ],
        prerequisiteHints: {
          authSignedOut: "Sign in first, then confirm which property context and supporting media should stay aligned with the testimonial before editing it.",
          authSignedIn: "Verify linked property and avatar media dependencies before publishing or unpublishing testimonial changes.",
          query: "Load the testimonial record first, then confirm its property and media references before patching quote, status, or attribution fields.",
        },
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
        createFormFields: [...TESTIMONIAL_CREATE_FIELDS],
        patchFormFields: [...TESTIMONIAL_PATCH_FIELDS],
      }}
    />
  );
}
