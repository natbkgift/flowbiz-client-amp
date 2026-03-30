import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/platform/deploy-history/route';

describe('/api/platform/deploy-history route', () => {
  it('does not expose deploy history over the public HTTP surface', async () => {
    const response = await GET(
      new Request('http://localhost/api/platform/deploy-history?limit=1') as never,
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(body).toMatchObject({ detail: 'Not Found' });
  });
});
