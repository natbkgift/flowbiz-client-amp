// HARD EXIT GUARD
// Prevents zombie processes and unhandled promise crashes

setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024;
    if (used > 500) {
        console.error(`[FATAL] Memory leak detected (${used.toFixed(2)} MB). Exiting...`);
        process.exit(1);
    }
}, 10000);

process.on('unhandledRejection', (err) => {
    console.error('[FATAL] Unhandled Rejection:', err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('[INFO] SIGTERM received. Exiting...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('[INFO] SIGINT received. Exiting...');
    process.exit(0);
});
