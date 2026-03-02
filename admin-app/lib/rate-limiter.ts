/**
 * In-memory sliding-window rate limiter for Edge Middleware.
 *
 * Design constraints:
 * - Works in Edge Runtime (no Node.js APIs beyond standard globals).
 * - Uses in-memory Map — state is per-instance, not shared across workers.
 * - Suitable for single-instance deployments or as a first line of defense
 *   before upstream rate limiting (nginx, CDN).
 * - Automatically evicts expired entries to prevent memory leaks.
 *
 * For production at scale, replace with Redis-backed rate limiting.
 */

interface RateLimitEntry {
  /** Timestamps of requests within the current window. */
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

/** Evict entries older than the window. Runs periodically. */
function evictStale(windowMs: number): void {
  const now = Date.now();
  const cutoff = now - windowMs * 2; // Keep entries for 2× window for safety

  for (const [key, entry] of store) {
    // Remove all timestamps older than window
    entry.timestamps = entry.timestamps.filter((t) => t > now - windowMs);
    if (entry.timestamps.length === 0 && now - (entry.timestamps[0] ?? cutoff) > windowMs) {
      store.delete(key);
    }
  }
}

// Periodic cleanup every 60 seconds
let lastCleanup = Date.now();

/**
 * Check if a request should be rate-limited.
 *
 * @param key - Identifier for the rate limit bucket (e.g., IP address).
 * @param maxRequests - Maximum requests allowed in the window.
 * @param windowMs - Window duration in milliseconds.
 * @returns Object with `allowed` boolean and `remaining` count.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();

  // Periodic cleanup
  if (now - lastCleanup > 60_000) {
    evictStale(windowMs);
    lastCleanup = now;
  }

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => t > now - windowMs);

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0] ?? now;
    const retryAfterMs = oldestInWindow + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(retryAfterMs, 1000),
    };
  }

  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    retryAfterMs: 0,
  };
}
