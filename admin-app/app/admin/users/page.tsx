import { AdminJsonCrudWorkspace } from "@/components/admin/AdminJsonCrudWorkspace";
import { detectAdminLocale } from "@/app/_lib/admin-i18n";

const USER_CREATE_TEMPLATE = JSON.stringify(
  {
    email: "",
    password: "",
    role: "editor",
    role_ids: [],
  },
  null,
  2
);

const USER_PATCH_TEMPLATE = JSON.stringify(
  {
    role: "editor",
    role_ids: [],
  },
  null,
  2
);

const USER_CREATE_FIELDS = [
  { name: "email", label: "Work email", type: "text", required: true, placeholder: "user@example.com" },
  { name: "password", label: "Temporary password", type: "password", required: true, placeholder: "minimum 6 characters" },
  { name: "role", label: "Primary access role", type: "text", required: true, placeholder: "admin/editor/ops" },
  {
    name: "role_ids",
    label: "Additional access roles",
    type: "json",
    placeholder: '["role-uuid-1"]',
    rows: 3,
  },
] as const;

const USER_PATCH_FIELDS = [
  { name: "email", label: "Work email", type: "text", placeholder: "user@example.com" },
  { name: "password", label: "Temporary password", type: "password", placeholder: "minimum 6 characters" },
  { name: "role", label: "Primary access role", type: "text", placeholder: "admin/editor/ops" },
  {
    name: "role_ids",
    label: "Additional access roles",
    type: "json",
    placeholder: '["role-uuid-1"]',
    rows: 3,
  },
] as const;

export default function AdminUsersPage() {
  const locale = detectAdminLocale();
  const isThai = locale === "th";

  return (
    <AdminJsonCrudWorkspace
      config={{
        title: isThai ? "ทีมและสิทธิ์" : "People & Roles",
        subtitle: isThai
          ? "จัดการการเข้าถึงของทีม สร้างผู้ใช้ใหม่ และอัปเดตสิทธิ์จากหน้าเดียว โดยระบบยังป้องกันการแก้สิทธิ์ของบัญชีตัวเองไว้เพื่อความปลอดภัย"
          : "Manage team access, create people records, and update role assignments from one page. Self permission changes remain blocked for safety.",
        followUpLinks: [
          {
            href: "/admin/dashboard",
            label: isThai ? "เปิดแดชบอร์ด" : "Open dashboard",
            description: isThai
              ? "กลับไปตรวจสถานะระบบหลังปรับสิทธิ์ของทีม"
              : "Review the operational dashboard after changing team access.",
          },
          {
            href: "/admin/inquiries",
            label: isThai ? "เปิด Lead Inbox" : "Open Lead Inbox",
            description: isThai
              ? "ยืนยัน workflow ของทีมขายหรือทีมตอบลีดหลังแก้สิทธิ์"
              : "Verify lead workflows after changing sales or operator access.",
          },
          {
            href: "/admin/imports",
            label: isThai ? "ดู Import Monitor" : "Open Import Monitor",
            description: isThai
              ? "ตรวจว่าผู้ใช้งานฝั่ง operations ยังเข้าถึง import workflow ได้ตามคาด"
              : "Confirm operations users can still access import workflows as expected.",
          },
        ],
        prerequisiteHints: {
          authSignedOut: isThai
            ? "เข้าสู่ระบบก่อน แล้วระบุให้ชัดว่าการเปลี่ยนสิทธิ์รอบนี้กระทบทีมไหนและงานใดบ้าง"
            : "Sign in first, then identify which team workflows this access change will affect before editing permissions.",
          authSignedIn: isThai
            ? "ยืนยันบทบาทหลักและบทบาทเสริมก่อนบันทึกสิทธิ์ของคนในทีม"
            : "Confirm the primary and additional role assignments before saving team access.",
          query: isThai
            ? "โหลดรายการผู้ใช้ก่อน แล้วอ้างอิงบทบาทจาก /admin/roles เพื่อหลีกเลี่ยงการแก้สิทธิ์ผิดคน"
            : "Load the people list first, then cross-check roles from /admin/roles so access changes land on the intended person.",
        },
        identifierLabel: isThai ? "รหัสบุคคล" : "Person ID",
        identifierPlaceholder: isThai ? "UUID ของบุคคล" : "person UUID",
        identifierField: "id",
        listPath: "/admin/users",
        getPath: "/admin/users/{id}",
        createPath: "/admin/users",
        patchPath: "/admin/users/{id}",
        defaultListQuery: "limit=100",
        defaultCreatePayload: USER_CREATE_TEMPLATE,
        defaultPatchPayload: USER_PATCH_TEMPLATE,
        createFormFields: [...USER_CREATE_FIELDS],
        patchFormFields: [...USER_PATCH_FIELDS],
        queryHelp: isThai
          ? "เรียกดูบทบาทจาก /admin/roles แล้วใส่รหัสบทบาทเสริมในช่อง Additional access roles"
          : "List roles from /admin/roles, then enter the additional role IDs in the Additional access roles field.",
      }}
    />
  );
}
