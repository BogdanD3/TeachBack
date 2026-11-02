// Simple in-memory sliding-window rate limit (single Node process is enough for the demo).

const buckets = new Map<string, number[]>();

export type RateLimitResult = { ok: boolean; retryAfterSec: number };

export function rateLimit(key: string, limit = 10, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfterSec: 0 };
}

/** Rate limit for AI routes: max 10 requests per minute per user. */
export const aiRateLimit = (userId: string) => rateLimit(`ai:${userId}`, 10, 60_000);
