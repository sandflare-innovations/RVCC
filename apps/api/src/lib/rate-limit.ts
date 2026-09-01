import type { Env } from "../config/env";
import { json } from "./http";
import { redisIncr } from "./redis";

interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

// In-memory fallback token bucket for local dev / when Redis is unreachable
const localBuckets = new Map<string, { count: number; resetAt: number }>();

function checkLocalRateLimit(key: string, limit: number, windowSeconds: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = localBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    localBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

/**
 * Checks sliding-window rate limit using Redis (with in-memory fallback).
 * Returns null if allowed, or standard 429 Response if rate limit exceeded.
 */
export async function enforceRateLimit(
  request: Request,
  env: Env,
  actionKey: string,
  config: RateLimitConfig
): Promise<Response | null> {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const key = `ratelimit:${actionKey}:${ip}`;

  let allowed = true;

  // Try Redis atomic INCR + EXPIRE
  const count = await redisIncr(key, config.windowSeconds, env);

  if (count !== null) {
    if (count > config.limit) {
      allowed = false;
    }
  } else {
    // Fallback to in-memory rate limiting
    const local = checkLocalRateLimit(key, config.limit, config.windowSeconds);
    allowed = local.allowed;
  }

  if (!allowed) {
    return json(
      env,
      request,
      {
        error: "Too many requests. Please slow down and try again later.",
        code: "RATE_LIMIT_EXCEEDED",
      },
      429,
      {
        "Retry-After": String(config.windowSeconds),
        "X-RateLimit-Limit": String(config.limit),
        "X-RateLimit-Remaining": "0",
      }
    );
  }

  return null;
}
