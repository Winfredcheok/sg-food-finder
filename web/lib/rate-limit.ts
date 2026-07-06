// Minimal in-memory sliding-window rate limiter for API routes.
// Per serverless instance on Vercel (not shared), which is fine here:
// the goal is stopping hammering, not precise global accounting.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);
  if (timestamps.length >= limit) {
    hits.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  hits.set(key, timestamps);
  // Opportunistic cleanup so the map can't grow unbounded
  if (hits.size > 5000) {
    for (const [k, ts] of hits) {
      if (ts.every((t) => t <= windowStart)) hits.delete(k);
    }
  }
  return true;
}
