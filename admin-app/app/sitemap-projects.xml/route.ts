import { projectsEntries, urlsetResponse } from '@/app/_lib/sitemap-xml';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hour

export async function GET(): Promise<Response> {
  const entries = await projectsEntries();
  return urlsetResponse(entries);
}
