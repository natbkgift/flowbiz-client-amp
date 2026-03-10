import { redirect } from "next/navigation";

import { type AdminLocale, ADMIN_LOCALE_QUERY_KEY } from "@/app/_lib/admin-i18n";

function resolveLocale(value: string | string[] | undefined): AdminLocale | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "th" || candidate === "en" ? candidate : null;
}

export default async function AdminIndexPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const locale = resolveLocale(searchParams?.[ADMIN_LOCALE_QUERY_KEY]);

  if (locale) {
    redirect(`/admin/dashboard?${ADMIN_LOCALE_QUERY_KEY}=${locale}`);
  }

  redirect("/admin/dashboard");
}
