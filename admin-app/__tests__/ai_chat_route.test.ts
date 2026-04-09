import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/ai/chat/route';

function restoreEnv(snapshot: NodeJS.ProcessEnv) {
  for (const key of Object.keys(process.env)) {
    if (!(key in snapshot)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, snapshot);
}

describe('ai chat route', () => {
  const envSnapshot = { ...process.env };

  afterEach(() => {
    restoreEnv(envSnapshot);
    vi.restoreAllMocks();
  });

  it('prefers LOCAL_API_ORIGIN for the AI upstream in containerized runtime', async () => {
    process.env.LOCAL_API_ORIGIN = 'http://api:8000';
    process.env.NEXT_PUBLIC_API_BASE = 'https://amppattaya.com/api';

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    const request = new NextRequest('https://amppattaya.com/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ locale: 'en', message: 'hello' }),
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await POST(request);

    expect(fetchSpy).toHaveBeenCalledWith(
      new URL('http://api:8000/v1/agents/sales_agent_v1/chat'),
      expect.objectContaining({
        method: 'POST',
        cache: 'no-store',
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });

  it('falls back to same-origin API routing when no upstream env is configured', async () => {
    delete process.env.LOCAL_API_ORIGIN;
    delete process.env.NEXT_PUBLIC_API_BASE;

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    const request = new NextRequest('http://127.0.0.1:3215/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ locale: 'en', message: 'hello' }),
      headers: {
        'content-type': 'application/json',
      },
    });

    await POST(request);

    const [upstream, init] = fetchSpy.mock.calls[0] ?? [];
    expect(String(upstream)).toContain('/api/v1/agents/sales_agent_v1/chat');
    expect(init).toEqual(expect.objectContaining({
      method: 'POST',
      cache: 'no-store',
    }));
  });
});