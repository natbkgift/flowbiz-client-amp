import { NextRequest, NextResponse } from 'next/server';
import { buildApiUpstreamUrl } from '@/app/api/_lib/upstream-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid AI chat payload' }, { status: 400 });
  }

  try {
    const upstream = buildApiUpstreamUrl(['v1', 'agents', 'sales_agent_v1', 'chat'])
      ?? new URL('/api/v1/agents/sales_agent_v1/chat', request.nextUrl.origin);
    const response = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ detail: 'AI service unavailable' }, { status: 502 });
  }
}