import { NextResponse } from 'next/server';
import { buildVersionPayload, readDeployTelemetry } from '@/app/api/platform/_lib/deploy-telemetry';

export async function GET() {
  const telemetry = await readDeployTelemetry();

  return NextResponse.json(buildVersionPayload(telemetry), {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
