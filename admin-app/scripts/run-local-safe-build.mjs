import { spawn } from 'node:child_process';

const command = process.platform === 'win32' ? 'npm.cmd run build' : 'npm run build';

const child = spawn(command, {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NEXT_LOCAL_BUILD_STATIC_SAFE: '1',
    NEXT_LOCAL_CONFIG_MINIMAL: '1',
    NEXT_LOCAL_APP_ROOT_MINIMAL: '1',
    NEXT_LOCAL_SITE_LAYOUT_MINIMAL: '1',
    NEXT_LOCAL_PUBLIC_HOME_MINIMAL: '1',
    NEXT_LOCAL_DIST_DIR: '.next_local_safe',
    NEXT_TELEMETRY_DISABLED: '1',
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});