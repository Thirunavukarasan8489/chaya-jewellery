/**
 * Minimal in-memory, fixed-window rate limiter for proxy.ts.
 *
 * SECURITY: nothing in this codebase throttled login, registration, or the
 * public lead form — credential stuffing and mass spam both worked with no
 * resistance. This is a deliberately simple, dependency-free limiter (no
 * Redis/Upstash is provisioned for this project), so it's per-instance
 * memory, not a distributed store: on a multi-instance/serverless
 * deployment (e.g. Vercel with multiple regions or frequent cold starts),
 * each instance keeps its own counts, so the real effective limit across
 * the whole deployment can be higher than the number below. It still
 * meaningfully raises the bar over having no throttling at all, and is the
 * right scope for a single codebase fix — a properly distributed limiter
 * needs shared infrastructure this project doesn't have configured.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodic cleanup so this Map doesn't grow unbounded on a long-lived
// instance. Edge runtime has no setInterval guarantee, so this piggybacks
// on the check itself instead.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Returns true if the request identified by `key` is within the allowed
 * rate, false if it should be rejected. `key` should already include
 * whatever scoping you want (e.g. `${ip}:${route}`).
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) {
    return false;
  }

  existing.count += 1;
  return true;
}

/** Best-effort client IP from standard proxy headers, falling back to a
 * constant so requests without any forwarded-for header still get bucketed
 * together rather than throwing. */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
