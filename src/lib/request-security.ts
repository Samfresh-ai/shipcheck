import { createHash } from "crypto";

type RateBucket = {
  count: number;
  resetAt: number;
};

const MAX_RATE_LIMIT_BUCKETS = 2_000;

const globalForRateLimit = globalThis as typeof globalThis & {
  __shipcheckRateBuckets?: Map<string, RateBucket>;
};

function rateBuckets() {
  if (!globalForRateLimit.__shipcheckRateBuckets) {
    globalForRateLimit.__shipcheckRateBuckets = new Map();
  }

  return globalForRateLimit.__shipcheckRateBuckets;
}

function earliestResetSeconds(buckets: Map<string, RateBucket>, now: number): number {
  let earliestResetAt = Infinity;
  for (const bucket of buckets.values()) {
    earliestResetAt = Math.min(earliestResetAt, bucket.resetAt);
  }

  if (!Number.isFinite(earliestResetAt)) return 1;
  return Math.max(1, Math.ceil((earliestResetAt - now) / 1000));
}

function pruneExpiredBuckets(buckets: Map<string, RateBucket>, now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function clientIpFromHeaders(headers: Headers): string | null {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim() || null;
}

export function hashIp(ip: string | null | undefined): string | undefined {
  if (!ip) return undefined;
  return createHash("sha256").update(ip).digest("base64url").slice(0, 32);
}

export function consumeRateLimitSlot(key: string, limit: number, windowMs: number, now = Date.now()) {
  const buckets = rateBuckets();
  pruneExpiredBuckets(buckets, now);
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    if (!current && buckets.size >= MAX_RATE_LIMIT_BUCKETS) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: earliestResetSeconds(buckets, now),
      };
    }

    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: limit - current.count,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}
