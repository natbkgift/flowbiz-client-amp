import { blogEntries, urlsetResponse } from '@/app/_lib/sitemap-xml';

export const dynamic = 'force-static';
export const revalidate = 86400; // 24 hours

export function GET(): Response {
  return urlsetResponse(blogEntries());
}
