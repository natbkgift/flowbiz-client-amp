// Vitest mock: 'server-only' is a Next.js sentinel that prevents server modules
// from being imported in client bundles. In Vitest (Node environment) it is a
// no-op — just export nothing so the import resolves without errors.
export {};
