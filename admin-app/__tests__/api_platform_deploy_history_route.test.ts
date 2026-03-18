import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import { GET } from '@/app/api/platform/deploy-history/route';

let tempDir: string | null = null;

afterEach(() => {
  delete process.env.FLOWBIZ_DEPLOY_HISTORY_DIR;

  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

describe('/api/platform/deploy-history route', () => {
  it('returns the latest deploy runs ordered from newest to oldest', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'flowbiz-platform-history-'));
    const historyDir = join(tempDir, 'deploy-history');
    const olderRun = join(historyDir, 'run-20260318T001000Z-abc12345');
    const newerRun = join(historyDir, 'run-20260318T002000Z-def67890');

    mkdirSync(olderRun, { recursive: true });
    mkdirSync(newerRun, { recursive: true });

    writeFileSync(
      join(olderRun, 'telemetry.json'),
      JSON.stringify({
        deployed_at: '2026-03-18T00:10:00Z',
        deploy_status: 'ok',
        build_sha: 'abc1234',
        target_sha: 'abc12345',
        duration_seconds: 320,
      }),
      'utf-8',
    );
    writeFileSync(
      join(newerRun, 'telemetry.json'),
      JSON.stringify({
        deployed_at: '2026-03-18T00:20:00Z',
        deploy_status: 'ok',
        build_sha: 'def6789',
        target_sha: 'def67890',
        duration_seconds: 410,
      }),
      'utf-8',
    );

    process.env.FLOWBIZ_DEPLOY_HISTORY_DIR = historyDir;

    const response = await GET(
      new Request('http://localhost/api/platform/deploy-history?limit=1') as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(body).toMatchObject({
      ok: true,
      limit: 1,
      count: 1,
      history_dir: historyDir,
    });
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({
      target_sha: 'def67890',
      build_sha: 'def6789',
      duration_seconds: 410,
      history_id: 'run-20260318T002000Z-def67890',
      log_path: join(newerRun, 'deploy.log'),
      lifecycle_log_path: join(newerRun, 'lifecycle.log'),
    });
  });

  it('returns an empty history when the history directory is missing', async () => {
    process.env.FLOWBIZ_DEPLOY_HISTORY_DIR = join(tmpdir(), 'missing-flowbiz-platform-history');

    const response = await GET(
      new Request('http://localhost/api/platform/deploy-history') as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      count: 0,
      items: [],
    });
  });

  it('normalizes a run directory env value back to the deploy-history root', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'flowbiz-platform-history-normalized-'));
    const historyDir = join(tempDir, 'deploy-history');
    const olderRun = join(historyDir, 'run-20260318T001000Z-abc12345');
    const newerRun = join(historyDir, 'run-20260318T002000Z-def67890');

    mkdirSync(olderRun, { recursive: true });
    mkdirSync(newerRun, { recursive: true });

    writeFileSync(join(olderRun, 'telemetry.json'), JSON.stringify({ target_sha: 'abc12345' }), 'utf-8');
    writeFileSync(join(newerRun, 'telemetry.json'), JSON.stringify({ target_sha: 'def67890' }), 'utf-8');

    process.env.FLOWBIZ_DEPLOY_HISTORY_DIR = newerRun;

    const response = await GET(
      new Request('http://localhost/api/platform/deploy-history?limit=5') as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      count: 2,
      history_dir: historyDir,
    });
    expect(body.items[0]).toMatchObject({ target_sha: 'def67890' });
    expect(body.items[1]).toMatchObject({ target_sha: 'abc12345' });
  });
});
