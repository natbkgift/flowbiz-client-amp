require('./process-guard');
const { spawn } = require('child_process');

console.log('[INFO] Starting Next.js Dev Server Wrapper...');

// Spawn the actual dev server utilizing UV_THREADPOOL_SIZE limitation
const dev = spawn('npm', ['run', 'dev:next'], {
    stdio: 'inherit',
    shell: true,
});

// If wrapper exits, kill the child dev server deterministically
process.on('exit', () => {
    console.log('[INFO] Wrapper exiting, killing child dev server...');
    dev.kill('SIGTERM');
});

process.on('SIGINT', () => {
    console.log('[INFO] Wrapper received SIGINT, killing child dev server...');
    dev.kill('SIGTERM');
    process.exit();
});

dev.on('close', (code) => {
    console.log(`[INFO] Child dev server exited with code ${code}`);
    process.exit(code);
});
