import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';
import { buildVersionPayload, readDeployTelemetry } from '../platform/_lib/deploy-telemetry';
import { buildMediaUpstreamUrl } from '@/app/api/_lib/media-proxy';
import { buildApiUpstreamUrl, resolveApiUpstreamBase } from '@/app/api/_lib/upstream-api';

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

const MEDIA_FALLBACK_ASSETS = {
  project: {
    contentType: 'image/png',
    publicPath: ['images', 'project-overview.png'],
  },
  property: {
    contentType: 'image/svg+xml',
    publicPath: ['images', 'property-placeholder.svg'],
  },
} as const;

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

function isMediaRoute(path: string[]) {
  return path[0] === 'media';
}

function pickMediaFallbackAsset(path: string[]) {
  const normalizedSegments = path.map((segment) => String(segment || '').toLowerCase());
  const shouldUseProjectFallback = normalizedSegments.some((segment) => (
    segment.includes('project')
    || segment.includes('developer')
    || segment.includes('area')
    || segment.includes('cover')
    || segment.includes('hero')
  ));
  return shouldUseProjectFallback ? MEDIA_FALLBACK_ASSETS.project : MEDIA_FALLBACK_ASSETS.property;
}

async function buildMediaFallbackResponse(request: NextRequest, mediaPath: string[], upstreamUrl: URL) {
  const asset = pickMediaFallbackAsset(mediaPath);
  const absolutePath = path.join(process.cwd(), 'public', ...asset.publicPath);

  try {
    const body = request.method === 'HEAD' ? null : await readFile(absolutePath);
    return new NextResponse(body, {
      status: 200,
      headers: {
        'cache-control': 'public, max-age=300',
        'content-type': asset.contentType,
        'x-flowbiz-media-fallback': '1',
        'x-flowbiz-media-upstream': upstreamUrl.toString(),
      },
    });
  } catch {
    return null;
  }
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
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

  const upstreamBase = resolveApiUpstreamBase();
  if (!isMediaRoute(path) && !upstreamBase) {
    return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  }

  const upstreamUrl = isMediaRoute(path)
    ? new URL(buildMediaUpstreamUrl(path.slice(1), request.nextUrl.search))
    : buildApiUpstreamUrl(path, request.nextUrl.search)!;
  if (!isMediaRoute(path)) {
    upstreamUrl.search = request.nextUrl.search;
  }

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
    if (isMediaRoute(path) && response.status === 404 && (request.method === 'GET' || request.method === 'HEAD')) {
      const fallbackResponse = await buildMediaFallbackResponse(request, path.slice(1), upstreamUrl);
      if (fallbackResponse) {
        return fallbackResponse;
      }
    }
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
