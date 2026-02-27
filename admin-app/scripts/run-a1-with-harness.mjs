import { spawn, spawnSync } from "node:child_process";
import process from "node:process";

const host = process.env.A1_HOST || "127.0.0.1";
const port = Number(process.env.A1_PORT || 3000);
const baseUrl = `http://${host}:${port}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await fetch(`${baseUrl}/healthz`);
      if (response.ok) return;
    } catch {
      // wait and retry
    }
    await sleep(250);
  }
  throw new Error(`A1 harness server failed health check at ${baseUrl}/healthz`);
}

const server = spawn(process.execPath, ["scripts/a1-public-server.mjs"], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: { ...process.env, A1_HOST: host, A1_PORT: String(port) },
});

let matrixExit = 1;
try {
  await waitForHealth();
  const result = spawnSync(process.execPath, ["scripts/run-a1-validation-matrix.mjs"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: { ...process.env, A1_BASE_URL: baseUrl },
  });
  matrixExit = typeof result.status === "number" ? result.status : 1;
} finally {
  server.kill("SIGTERM");
  await sleep(300);
  if (!server.killed) server.kill("SIGKILL");
}

process.exit(matrixExit);
