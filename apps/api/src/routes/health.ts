import type { Env } from "../config/env";
import { json } from "../lib/http";
import { prisma } from "../lib/prisma";
import { redisGet } from "../lib/redis";

/**
 * Enterprise Production Health & Diagnostics Endpoint
 * GET /health
 */
export async function handleHealthCheck(request: Request, env: Env): Promise<Response> {
  const health: {
    status: "healthy" | "degraded" | "unhealthy";
    uptimeSeconds: number;
    timestamp: string;
    services: {
      database: { status: "ok" | "error"; latencyMs?: number; error?: string };
      redis: { status: "ok" | "unconfigured" | "error"; latencyMs?: number };
      memory: { rssMb: number; heapUsedMb: number };
    };
  } = {
    status: "healthy",
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    timestamp: new Date().toISOString(),
    services: {
      database: { status: "ok" },
      redis: { status: "unconfigured" },
      memory: {
        rssMb: typeof process.memoryUsage === "function" ? Math.round(process.memoryUsage().rss / 1024 / 1024) : 0,
        heapUsedMb: typeof process.memoryUsage === "function" ? Math.round(process.memoryUsage().heapUsed / 1024 / 1024) : 0,
      },
    },
  };

  // 1. Check PostgreSQL Database Connectivity
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.database.latencyMs = Date.now() - dbStart;
  } catch (err) {
    health.status = "unhealthy";
    health.services.database = {
      status: "error",
      error: (err as Error).message,
    };
  }

  // 2. Check Upstash Redis Connectivity (if configured)
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    const redisStart = Date.now();
    try {
      await redisGet("health:ping", env);
      health.services.redis = {
        status: "ok",
        latencyMs: Date.now() - redisStart,
      };
    } catch {
      health.services.redis = { status: "error" };
      if (health.status !== "unhealthy") health.status = "degraded";
    }
  }

  const httpStatus = health.status === "unhealthy" ? 503 : 200;
  return json(env, request, health, httpStatus);
}
