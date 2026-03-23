"use client";

import { detectAdminLocale } from "@/app/_lib/admin-i18n";
import { AdminEntityWorkspace } from "@/components/admin/domain/entity-workspace/AdminEntityWorkspace";

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
  { name: "role", label: "Primary access role", type: "select", required: true, options: ["admin", "editor", "ops"] },
  { name: "role_ids", label: "Additional access IDs", type: "chips", placeholder: "role-id-1, role-id-2", rows: 3 },
] as const;

const USER_PATCH_FIELDS = [
  { name: "email", label: "Work email", type: "text", placeholder: "user@example.com" },
  { name: "password", label: "Temporary password", type: "password", placeholder: "minimum 6 characters" },
  { name: "role", label: "Primary access role", type: "select", options: ["admin", "editor", "ops"] },
  { name: "role_ids", label: "Additional access IDs", type: "chips", placeholder: "role-id-1, role-id-2", rows: 3 },
] as const;

export default function AdminUsersPage() {
  const locale = detectAdminLocale();
  const isThai = locale === "th";

  return (
    <AdminEntityWorkspace
      locale={locale}
      config={{
        title: isThai ? "ทีมและสิทธิ์" : "People & Roles",
        subtitle: isThai
          ? "ค้นหาคนที่ถูกต้อง แก้สิทธิ์ใน pane เดียว แล้วส่งต่อไปยัง workflow ที่เกี่ยวข้อง"
          : "Find the right teammate, update access in one detail pane, then hand off to the next workflow.",
        icon: "users",
        eyebrow: isThai ? "การเข้าถึงของทีม" : "Team access",
        listPath: "/admin/users",
        getPath: "/admin/users/{id}",
        createPath: "/admin/users",
        patchPath: "/admin/users/{id}",
        baseListQuery: "limit=100",
        identifierField: "id",
        identifierLabel: isThai ? "รหัสบุคคล" : "Person ID",
        titlePaths: ["email", "id"],
        metaPaths: ["role"],
        statusPath: "role",
        detailSummaryPaths: [
          { label: isThai ? "อีเมล" : "Email", path: "email" },
          { label: isThai ? "บทบาทหลัก" : "Primary role", path: "role" },
        ],
        createFormFields: [...USER_CREATE_FIELDS],
        patchFormFields: [...USER_PATCH_FIELDS],
        defaultCreatePayload: USER_CREATE_TEMPLATE,
        defaultPatchPayload: USER_PATCH_TEMPLATE,
        followUpLinks: [
          { href: "/admin/dashboard", label: isThai ? "เปิดแดชบอร์ด" : "Open dashboard" },
          { href: "/admin/inquiries", label: isThai ? "เปิด Lead Inbox" : "Open Lead Inbox" },
          { href: "/admin/imports", label: isThai ? "เปิด Import Monitor" : "Open Import Monitor" },
        ],
        listEmpty: isThai ? "ยังไม่พบผู้ใช้ในรายการนี้" : "No people found in this queue.",
        listHint: isThai
          ? "โหลดรายการผู้ใช้ก่อน แล้วเลือกคนที่ต้องการแก้สิทธิ์จากคิวด้านซ้าย"
          : "Load the people queue first, then open one teammate in the left list to edit access safely.",
        createHint: isThai
          ? "ใช้แท็บนี้เมื่อจำเป็นต้องสร้างผู้ใช้ใหม่พร้อมบทบาทหลักและรหัสสิทธิ์เสริม"
          : "Use this tab when you need to create a new teammate with a primary role and any advanced access IDs.",
        detailHint: isThai
          ? "แก้สิทธิ์ของคนที่เลือกใน pane เดียว แล้วค่อยบันทึกหรือส่งต่องาน"
          : "Update the selected teammate in one detail pane, then save and hand the work off.",
        reviewHint: isThai
          ? "ตรวจผลล่าสุดและเปิด workflow ที่ได้รับผลกระทบจากการเปลี่ยนสิทธิ์"
          : "Review the latest result and jump to the workflow affected by this access change.",
        createLabel: isThai ? "สร้างผู้ใช้" : "Create teammate",
        saveLabel: isThai ? "บันทึกสิทธิ์" : "Save access",
        searchPlaceholder: isThai ? "ค้นหาจากอีเมลหรือบทบาท" : "Search by email or role",
      }}
    />
  );
}
