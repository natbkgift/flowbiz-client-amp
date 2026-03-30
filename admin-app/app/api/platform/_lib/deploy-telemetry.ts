import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export type DeployTelemetry = {
  generated_at?: string | null;
  deployed_at?: string | null;
  deploy_status?: string | null;
  smoke_passed?: boolean | null;
  build_sha?: string | null;
  target_sha?: string | null;
  source?: string | null;
  validation_mode?: string | null;
  duration_seconds?: number | null;
  history_id?: string | null;
  history_dir?: string | null;
  log_path?: string | null;
  lifecycle_log_path?: string | null;
  state_dir?: string | null;
  current_phase?: string | null;
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
const DEFAULT_HISTORY_DIR = '/app/ops/logs/deploy-history';
const MAX_HISTORY_LIMIT = 50;

export function getDeployTelemetryPath() {
  return process.env.FLOWBIZ_DEPLOY_TELEMETRY_PATH ?? DEFAULT_TELEMETRY_PATH;
}

function normalizeHistoryDir(candidate: string) {
  const normalized = candidate.replace(/\\/g, '/');

  if (normalized.endsWith('/deploy_telemetry.json')) {
    return join(dirname(candidate), 'deploy-history');
  }

  if (/\/deploy-history\/run-[^/]+$/.test(normalized)) {
    return dirname(candidate);
  }

  return candidate;
}

export function getDeployHistoryDir() {
  const configured = process.env.FLOWBIZ_DEPLOY_HISTORY_DIR;
  if (configured) return normalizeHistoryDir(configured);

  const telemetryPath = getDeployTelemetryPath();
  if (telemetryPath !== DEFAULT_TELEMETRY_PATH) {
    return normalizeHistoryDir(join(dirname(telemetryPath), 'deploy-history'));
  }

  return DEFAULT_HISTORY_DIR;
}

export function buildVersionPayload(telemetry: DeployTelemetry | null) {
  return {
    ok: true,
    deployed_at: telemetry?.deployed_at ?? null,
    deploy_status: telemetry?.deploy_status ?? 'unknown',
    smoke_passed: telemetry?.smoke_passed ?? null,
    build_sha:
      telemetry?.build_sha ?? process.env.FLOWBIZ_BUILD_SHA ?? process.env.BUILD_SHA ?? null,
  };
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const payload = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(payload);
    return parsed && typeof parsed === 'object' ? (parsed as T) : null;
  } catch {
    return null;
  }
}

export async function readDeployTelemetry(): Promise<DeployTelemetry | null> {
  return readJsonFile<DeployTelemetry>(getDeployTelemetryPath());
}

export function parseHistoryLimit(rawLimit: string | null, fallback = 10) {
  const parsed = Number.parseInt(rawLimit ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), MAX_HISTORY_LIMIT);
}

export async function readDeployHistory(limit = 10): Promise<DeployTelemetry[]> {
  const historyDir = getDeployHistoryDir();

  try {
    const entries = await readdir(historyDir, { withFileTypes: true });
    const sortedDirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((left, right) => right.localeCompare(left));

    const history: DeployTelemetry[] = [];
    for (const dirName of sortedDirs) {
      if (history.length >= limit) break;

      const telemetry = await readJsonFile<DeployTelemetry>(join(historyDir, dirName, 'telemetry.json'));
      if (!telemetry) continue;

      history.push({
        ...telemetry,
        history_id: telemetry.history_id ?? dirName,
        history_dir: telemetry.history_dir ?? join(historyDir, dirName),
        log_path: telemetry.log_path ?? join(historyDir, dirName, 'deploy.log'),
        lifecycle_log_path:
          telemetry.lifecycle_log_path ?? join(historyDir, dirName, 'lifecycle.log'),
      });
    }

    return history;
  } catch {
    return [];
  }
}
