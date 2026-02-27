import { staticPages, urlsetResponse } from '@/app/_lib/sitemap-xml';

export const dynamic = 'force-static';
export const revalidate = 3600; // 1 hour

export function GET(): Response {
  return urlsetResponse(staticPages());
}
