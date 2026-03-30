import { NextRequest, NextResponse } from 'next/server';
import { buildVersionPayload, readDeployTelemetry } from '../platform/_lib/deploy-telemetry';

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

function isPlatformVersionRoute(path: string[]) {
  return path.length === 2 && path[0] === 'platform' && path[1] === 'version';
}

function isPlatformDeployHistoryRoute(path: string[]) {
  return path.length === 2 && path[0] === 'platform' && path[1] === 'deploy-history';
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

  if (isPlatformVersionRoute(path)) {
    const telemetry = await readDeployTelemetry();
    return NextResponse.json(buildVersionPayload(telemetry), {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }

  if (isPlatformDeployHistoryRoute(path)) {
    return NextResponse.json(
      { detail: 'Not Found' },
      {
        status: 404,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
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
