process.env.FLOWBIZ_LOCAL_SAFE_BUILD = process.env.FLOWBIZ_LOCAL_SAFE_BUILD || '1';
await import('./run-build.mjs');
