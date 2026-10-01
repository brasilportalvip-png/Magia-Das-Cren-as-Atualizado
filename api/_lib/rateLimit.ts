import { getDb, admin } from "./firebaseAdmin";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec?: number;
}

// In-memory cache for fast hot-path, lazy-pruned per call (NO setInterval in serverless)
const memoryCache = new Map<string, number[]>();

export async function checkRateLimit(
  identifier: string,
  limit = 20,
  windowMs = 60 * 1000
): Promise<RateLimitResult> {
  const now = Date.now();

  // 1. Upstash Redis / Vercel KV (Distributed)
  const upstashUrl =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const upstashToken =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      const key = `rl:${identifier}`;
      const expireSec = Math.ceil(windowMs / 1000);

      // Multi-exec pipeline: INCR and EXPIRE
      const res = await fetch(`${upstashUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, expireSec],
        ]),
      });

      if (res.ok) {
        const data: any = await res.json();
        const count = Number(data?.[0]?.result || 1);
        if (count > limit) {
          return {
            allowed: false,
            remaining: 0,
            retryAfterSec: expireSec,
          };
        }
        return {
          allowed: true,
          remaining: Math.max(0, limit - count),
        };
      }
    } catch (e) {
      console.warn("[UPSTASH_RATE_LIMIT_FALLBACK]", e);
    }
  }

  // 2. In-memory sliding window fallback (Lazy-cleaned, NO setInterval)
  let timestamps = memoryCache.get(identifier) || [];
  timestamps = timestamps.filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    const oldest = timestamps[0];
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    memoryCache.set(identifier, timestamps);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec,
    };
  }

  timestamps.push(now);
  memoryCache.set(identifier, timestamps);

  // Lazy clean cache if it grows too large
  if (memoryCache.size > 2000) {
    for (const [k, v] of memoryCache.entries()) {
      if (v.length === 0 || now - v[v.length - 1] > windowMs) {
        memoryCache.delete(k);
      }
    }
  }

  return {
    allowed: true,
    remaining: limit - timestamps.length,
  };
}

export function getClientIp(req: any): string {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "unknown";
}
