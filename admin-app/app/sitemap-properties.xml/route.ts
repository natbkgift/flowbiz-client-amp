import { propertiesEntries, urlsetResponse } from '@/app/_lib/sitemap-xml';

export const dynamic = 'force-dynamic';
export const revalidate = 900; // 15 minutes — properties change more often

export async function GET(): Promise<Response> {
  const entries = await propertiesEntries();
  return urlsetResponse(entries);
}
