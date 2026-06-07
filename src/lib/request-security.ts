import { createHash } from "crypto";

type RateBucket = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __shipcheckRateBuckets?: Map<string, RateBucket>;
};

function rateBuckets() {
  if (!globalForRateLimit.__shipcheckRateBuckets) {
    globalForRateLimit.__shipcheckRateBuckets = new Map();
  }

  return globalForRateLimit.__shipcheckRateBuckets;
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
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
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
