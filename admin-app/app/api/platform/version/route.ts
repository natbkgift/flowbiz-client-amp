import { readFile } from 'node:fs/promises';

import { NextResponse } from 'next/server';

type DeployTelemetry = {
  generated_at?: string | null;
  deployed_at?: string | null;
  deploy_status?: string | null;
  smoke_passed?: boolean | null;
  build_sha?: string | null;
  target_sha?: string | null;
  source?: string | null;
  validation_mode?: string | null;
  active_repo?: {
    sync_status?: string | null;
    sync_detail?: string | null;
    sha?: string | null;
    branch?: string | null;
    upstream?: string | null;
    aligned?: boolean | null;
  } | null;
};

const DEFAULT_TELEMETRY_PATH = '/app/ops/logs/deploy_telemetry.json';

function buildVersionPayload(telemetry: DeployTelemetry | null) {
  return {
    ok: true,
    generated_at: telemetry?.generated_at ?? null,
    deployed_at: telemetry?.deployed_at ?? null,
    deploy_status: telemetry?.deploy_status ?? 'unknown',
    smoke_passed: telemetry?.smoke_passed ?? null,
    build_sha:
      telemetry?.build_sha ?? process.env.FLOWBIZ_BUILD_SHA ?? process.env.BUILD_SHA ?? null,
    target_sha: telemetry?.target_sha ?? process.env.FLOWBIZ_TARGET_SHA ?? null,
    source: telemetry?.source ?? 'runtime',
    validation_mode: telemetry?.validation_mode ?? null,
    active_repo: telemetry?.active_repo ?? null,
    node_env: process.env.NODE_ENV ?? 'unknown',
  };
}

async function readDeployTelemetry(): Promise<DeployTelemetry | null> {
  const telemetryPath = process.env.FLOWBIZ_DEPLOY_TELEMETRY_PATH ?? DEFAULT_TELEMETRY_PATH;

  try {
    const payload = await readFile(telemetryPath, 'utf-8');
    const parsed = JSON.parse(payload);
    return parsed && typeof parsed === 'object' ? (parsed as DeployTelemetry) : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const telemetry = await readDeployTelemetry();

  return NextResponse.json(buildVersionPayload(telemetry), {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}