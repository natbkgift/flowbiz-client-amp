import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function resolveUpstreamBase(): string | null {
  const localApiOrigin = process.env.LOCAL_API_ORIGIN?.trim();
  if (localApiOrigin && /^https?:\/\//i.test(localApiOrigin)) {
    return localApiOrigin.replace(/\/+$/, '');
  }

  const publicApiBase = process.env.NEXT_PUBLIC_API_BASE?.trim();
  if (publicApiBase && /^https?:\/\//i.test(publicApiBase)) {
    return publicApiBase.replace(/\/+$/, '');
  }

  return null;
}

function buildUpstreamHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }
  return headers;
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const upstreamBase = resolveUpstreamBase();
  if (!upstreamBase) {
    return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  }

  const { path } = await context.params;
  if (!Array.isArray(path) || path.length === 0) {
    return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  }

  const upstreamUrl = new URL(`${upstreamBase}/${path.map(encodeURIComponent).join('/')}`);
  upstreamUrl.search = request.nextUrl.search;

  const init: RequestInit = {
    method: request.method,
    headers: buildUpstreamHeaders(request),
    redirect: 'manual',
    cache: 'no-store',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(upstreamUrl.toString(), init);
    const headers = new Headers(response.headers);
    for (const header of HOP_BY_HOP_HEADERS) {
      headers.delete(header);
    }
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch {
    return NextResponse.json({ detail: 'Upstream API unavailable' }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function HEAD(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}
