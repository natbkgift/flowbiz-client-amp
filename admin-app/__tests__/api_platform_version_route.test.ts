import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import { GET } from '@/app/api/platform/version/route';

let tempDir: string | null = null;

afterEach(() => {
  delete process.env.FLOWBIZ_DEPLOY_TELEMETRY_PATH;
  delete process.env.FLOWBIZ_BUILD_SHA;
  delete process.env.FLOWBIZ_TARGET_SHA;

  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

describe('/api/platform/version route', () => {
  it('returns deploy telemetry when a telemetry file is available', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'flowbiz-platform-version-'));
    const telemetryPath = join(tempDir, 'deploy_telemetry.json');

    writeFileSync(
      telemetryPath,
      JSON.stringify({
        generated_at: '2026-03-16T12:00:00Z',
        deployed_at: '2026-03-16T12:01:00Z',
        deploy_status: 'ok',
        smoke_passed: true,
        build_sha: 'abc1234',
        target_sha: 'abcdef1234567890',
        source: 'tests',
        validation_mode: 'owner-aligned',
        active_repo: {
          sync_status: 'ok',
          sha: 'abcdef1234567890',
          branch: 'main',
          upstream: 'origin/main',
          aligned: true,
        },
      }),
      'utf-8',
    );

    process.env.FLOWBIZ_DEPLOY_TELEMETRY_PATH = telemetryPath;

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(body).toMatchObject({
      ok: true,
      deployed_at: '2026-03-16T12:01:00Z',
      deploy_status: 'ok',
      smoke_passed: true,
      build_sha: 'abc1234',
    });
    expect(body).not.toHaveProperty('target_sha');
    expect(body).not.toHaveProperty('active_repo');
    expect(body).not.toHaveProperty('history_dir');
    expect(body).not.toHaveProperty('log_path');
  });

  it('falls back to runtime environment values when telemetry is missing', async () => {
    process.env.FLOWBIZ_BUILD_SHA = 'build999';
    process.env.FLOWBIZ_TARGET_SHA = 'target999';
    process.env.FLOWBIZ_DEPLOY_TELEMETRY_PATH = join(tmpdir(), 'missing-deploy-telemetry.json');

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      deploy_status: 'unknown',
      build_sha: 'build999',
    });
    expect(body.deployed_at).toBeNull();
    expect(body).not.toHaveProperty('target_sha');
  });
});
