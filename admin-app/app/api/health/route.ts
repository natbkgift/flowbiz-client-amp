import { NextResponse } from 'next/server';

const startedAt = Date.now();

/**
 * GET /api/health — Production readiness health-check endpoint.
 *
 * Returns build information, uptime, subsystem status, and API dependency probe.
 * Used by load balancers, monitoring, and the UAAS evolution loop.
 */
export async function GET() {
  const uptimeMs = Date.now() - startedAt;
  const uptimeSeconds = Math.floor(uptimeMs / 1000);

  // Probe backend API dependency (best-effort, with timeout)
  const apiStatus = await probeApi();

  const overallStatus = apiStatus === 'ok' ? 'healthy' : 'degraded';

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptimeSeconds,
        human: formatUptime(uptimeSeconds),
      },
      build: {
        nodeEnv: process.env.NODE_ENV ?? 'unknown',
        nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'not-set',
      },
      checks: {
        runtime: 'ok',
        memory: getMemoryStatus(),
        api: apiStatus,
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function getMemoryStatus(): string {
  try {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const { heapUsed, heapTotal } = process.memoryUsage();
      const pct = Math.round((heapUsed / heapTotal) * 100);
      return pct > 90 ? 'warning' : 'ok';
    }
  } catch {
    // Edge runtime may not support process.memoryUsage
  }
  return 'unknown';
}

/** Best-effort probe of the backend API with a 3-second timeout. */
async function probeApi(): Promise<'ok' | 'unreachable' | 'unknown'> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBase) return 'unknown';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${apiBase}/api/v1/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return res.ok ? 'ok' : 'unreachable';
  } catch {
    return 'unreachable';
  }
}
