import crypto from "crypto";
import { getDb, admin } from "./firebaseAdmin.js";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec?: number;
}

export async function checkRateLimit(
  identifier: string,
  limit = 20,
  windowMs = 60 * 1000
): Promise<RateLimitResult> {
  const now = Date.now();
  const expireSec = Math.ceil(windowMs / 1000);

  // 1. Upstash Redis / Vercel KV - primeira opção distribuída
  const upstashUrl =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;

  const upstashToken =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      const key = `rl:${identifier}`;

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

      console.warn(
        "[UPSTASH_RATE_LIMIT_HTTP_ERROR]",
        res.status,
        res.statusText
      );
    } catch (error) {
      console.warn("[UPSTASH_RATE_LIMIT_ERROR]", error);
    }
  }

  // 2. Firestore - fallback distribuído seguro para Vercel
  try {
    const db = getDb();

    const identifierHash = crypto
      .createHash("sha256")
      .update(identifier)
      .digest("hex");

    const rateRef = db
      .collection("rate_limits")
      .doc(identifierHash);

    return await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(rateRef);
      const data = snapshot.exists ? snapshot.data() || {} : {};

      const windowStart = Number(data.windowStart || 0);
      const count = Number(data.count || 0);

      const windowExpired =
        !windowStart || now - windowStart >= windowMs;

      if (windowExpired) {
        transaction.set(
          rateRef,
          {
            count: 1,
            windowStart: now,
            expiresAt: admin.firestore.Timestamp.fromMillis(now + windowMs),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        return {
          allowed: true,
          remaining: Math.max(0, limit - 1),
        };
      }

      if (count >= limit) {
        const retryAfterSec = Math.max(
          1,
          Math.ceil((windowStart + windowMs - now) / 1000)
        );

        return {
          allowed: false,
          remaining: 0,
          retryAfterSec,
        };
      }

      const newCount = count + 1;

      transaction.set(
        rateRef,
        {
          count: newCount,
          windowStart,
          expiresAt: admin.firestore.Timestamp.fromMillis(
            windowStart + windowMs
          ),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        allowed: true,
        remaining: Math.max(0, limit - newCount),
      };
    });
  } catch (error) {
    console.error("[RATE_LIMIT_BACKEND_ERROR]", error);

    // Fail closed em produção:
    // se nenhum mecanismo distribuído funcionar, bloqueia a requisição.
    if (process.env.NODE_ENV === "production") {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSec: 60,
      };
    }

    // Desenvolvimento local: permite continuar para não bloquear testes/dev.
    return {
      allowed: true,
      remaining: limit,
    };
  }
}

export function getClientIp(req: any): string {
  const forwarded = req.headers?.["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || req.ip || "unknown";
}