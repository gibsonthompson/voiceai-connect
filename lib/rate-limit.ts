/* ═══════════════════════════════════════════════════════════════════════════
   Rate limiter — in-memory sliding window per IP
   Usage: if (rateLimiter.isLimited(ip)) return 429;
   ═══════════════════════════════════════════════════════════════════════════ */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20; // 20 requests per minute per IP
const CLEANUP_INTERVAL = 5 * 60 * 1000; // clean stale entries every 5 min

// Periodic cleanup to prevent memory leak
if (typeof globalThis !== 'undefined') {
  const key = '__widget_rate_limit_cleanup__';
  if (!(globalThis as Record<string, unknown>)[key]) {
    (globalThis as Record<string, unknown>)[key] = true;
    setInterval(() => {
      const now = Date.now();
      for (const [ip, entry] of store.entries()) {
        entry.timestamps = entry.timestamps.filter(t => now - t < WINDOW_MS);
        if (entry.timestamps.length === 0) store.delete(ip);
      }
    }, CLEANUP_INTERVAL);
  }
}

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  let entry = store.get(ip);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(ip, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(t => now - t < WINDOW_MS);

  if (entry.timestamps.length >= MAX_REQUESTS) {
    return true;
  }

  entry.timestamps.push(now);
  return false;
}

export function getRemainingRequests(ip: string): number {
  const now = Date.now();
  const entry = store.get(ip);
  if (!entry) return MAX_REQUESTS;
  const recent = entry.timestamps.filter(t => now - t < WINDOW_MS);
  return Math.max(0, MAX_REQUESTS - recent.length);
}