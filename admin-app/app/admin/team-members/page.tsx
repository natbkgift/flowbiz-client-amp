import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";
import { detectAdminLocale } from "@/app/_lib/admin-i18n";

const TEAM_MEMBER_CREATE_TEMPLATE = JSON.stringify(
  {
    name: "Sample Advisor",
    role_title: "Senior Advisor",
    status: "draft",
    display_order: 0,
    photo_url: "/media/library/team-advisor.jpg",
    bio: {
      en: "Published team bio in English",
      th: "โปรไฟล์ทีมภาษาไทย",
    },
    languages: ["English", "Thai"],
    specialties: ["Investment", "Shortlist strategy"],
  },
  null,
  2,
);

const TEAM_MEMBER_PATCH_TEMPLATE = JSON.stringify(
  {
    role_title: "Lead Advisor",
    status: "active",
  },
  null,
  2,
);

const TEAM_MEMBER_CREATE_FIELDS = [
  { name: "name", label: "Name", type: "text", required: true, placeholder: "Sample Advisor" },
  { name: "role_title", label: "Role title", type: "text", required: true, placeholder: "Senior Advisor" },
  { name: "status", label: "Status", type: "status", required: true, options: ["draft", "active"] },
  { name: "display_order", label: "Display order", type: "number", placeholder: "0" },
  { name: "photo_url", label: "Photo", type: "media", placeholder: "/media/library/team-advisor.jpg" },
  { name: "bio.en", label: "Bio (EN)", type: "textarea", rows: 3, required: true },
  { name: "bio.th", label: "Bio (TH)", type: "textarea", rows: 3 },
  { name: "languages", label: "Languages", type: "chips", rows: 2, placeholder: "English, Thai" },
  { name: "specialties", label: "Specialties", type: "chips", rows: 2, placeholder: "Investment, Shortlist strategy" },
] as const;

const TEAM_MEMBER_PATCH_FIELDS = [
  { name: "name", label: "Name", type: "text" },
  { name: "role_title", label: "Role title", type: "text" },
  { name: "status", label: "Status", type: "status", options: ["draft", "active"] },
  { name: "display_order", label: "Display order", type: "number", placeholder: "0" },
  { name: "photo_url", label: "Photo", type: "media", placeholder: "/media/library/team-advisor.jpg" },
  { name: "bio.en", label: "Bio (EN)", type: "textarea", rows: 3 },
  { name: "bio.th", label: "Bio (TH)", type: "textarea", rows: 3 },
  { name: "languages", label: "Languages", type: "chips", rows: 2, placeholder: "English, Thai" },
  { name: "specialties", label: "Specialties", type: "chips", rows: 2, placeholder: "Investment, Shortlist strategy" },
] as const;

export default function AdminTeamMembersPage() {
  const locale = detectAdminLocale();
  const isThai = locale === "th";

  return (
    <AdminJsonCrudWorkspace
      config={{
        title: isThai ? "จัดการทีมที่เผยแพร่" : "Team Members CMS",
        subtitle: isThai
          ? "จัดการโปรไฟล์ทีมที่ใช้กับหน้า public โดยตรง ทั้งรายการ รายละเอียด และรูปภาพ"
          : "Manage published public-team profiles, bios, and photos from one workspace.",
        followUpLinks: [
          {
            href: "/admin/company",
            label: isThai ? "เปิด Company" : "Open company",
            description: isThai
              ? "ตรวจข้อความบริษัทและ how-we-work ที่แสดงคู่กับทีมในหน้า public"
              : "Review company and how-we-work copy displayed alongside the public team surface.",
          },
          {
            href: "/admin/testimonials",
            label: isThai ? "เปิด Testimonials" : "Open testimonials",
            description: isThai
              ? "ตรวจ social proof ที่แสดงร่วมกับทีมในหน้า about"
              : "Check the social proof blocks displayed with the team on the about page.",
          },
          {
            href: "/admin/dashboard",
            label: isThai ? "เปิดแดชบอร์ด" : "Open dashboard",
            description: isThai
              ? "กลับไปดูภาพรวมสถานะหลังอัปเดตทีม"
              : "Review the operational overview after changing public team content.",
          },
        ],
        prerequisiteHints: {
          authSignedOut: isThai
            ? "เข้าสู่ระบบก่อน แล้วตรวจว่ามีรูปและ bio ที่พร้อมเผยแพร่จริงก่อนสร้างหรือแก้ไข profile ทีม"
            : "Sign in first, then confirm the live-ready photo and bio before creating or editing a team profile.",
          authSignedIn: isThai
            ? "ยืนยันลำดับการแสดง รูปโปรไฟล์ และข้อความสองภาษาก่อน publish ทีมขึ้นหน้า public"
            : "Confirm display order, photo path, and bilingual bio copy before publishing a team member to public pages.",
          query: isThai
            ? "โหลดรายการทีมก่อน แล้วค่อยเลือกระเบียนที่ต้องแก้จาก UUID จริง"
            : "Load the team roster first, then work from the live UUID you want to patch.",
        },
        identifierLabel: isThai ? "รหัสทีม" : "Team member ID",
        identifierPlaceholder: "team member UUID",
        identifierField: "id",
        listPath: "/admin/team-members",
        getPath: "/admin/team-members/{id}",
        createPath: "/admin/team-members",
        patchPath: "/admin/team-members/{id}",
        publishPath: "/admin/team-members/{id}/publish",
        unpublishPath: "/admin/team-members/{id}/unpublish",
        deletePath: "/admin/team-members/{id}",
        defaultListQuery: "limit=40",
        defaultCreatePayload: TEAM_MEMBER_CREATE_TEMPLATE,
        defaultPatchPayload: TEAM_MEMBER_PATCH_TEMPLATE,
        createFormFields: [...TEAM_MEMBER_CREATE_FIELDS],
        patchFormFields: [...TEAM_MEMBER_PATCH_FIELDS],
      }}
    />
  );
}
