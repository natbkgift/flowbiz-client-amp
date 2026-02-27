import { blogEntries, urlsetResponse } from '@/app/_lib/sitemap-xml';

export const dynamic = 'force-static';
export const revalidate = 86400; // 24 hours

export async function GET(): Promise<Response> {
  return urlsetResponse(await blogEntries());
}
