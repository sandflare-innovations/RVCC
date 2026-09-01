import type { Env } from "../config/env";
import { loadEnv } from "../config/env";

export async function redisPublish(channel: string, message: unknown, env?: Env): Promise<boolean> {
  const activeEnv = env || loadEnv();
  const url = activeEnv.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = activeEnv.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;

  try {
    const payload = typeof message === "string" ? message : JSON.stringify(message);
    const res = await fetch(`${url}/PUBLISH/${encodeURIComponent(channel)}/${encodeURIComponent(payload)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return res.ok;
  } catch (err) {
    console.warn("[redisPublish] non-fatal publish error", err);
    return false;
  }
}

export async function redisGet<T>(key: string, env?: Env): Promise<T | null> {
  const activeEnv = env || loadEnv();
  const url = activeEnv.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = activeEnv.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const res = await fetch(`${url}/GET/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: string };
    if (!data.result) return null;
    return JSON.parse(data.result) as T;
  } catch {
    return null;
  }
}

export async function redisSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
  env?: Env
): Promise<boolean> {
  const activeEnv = env || loadEnv();
  const url = activeEnv.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = activeEnv.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;

  try {
    const payload = JSON.stringify(value);
    const res = await fetch(
      `${url}/SET/${encodeURIComponent(key)}/${encodeURIComponent(payload)}/EX/${ttlSeconds}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function redisIncr(key: string, ttlSeconds: number, env?: Env): Promise<number | null> {
  const activeEnv = env || loadEnv();
  const url = activeEnv.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = activeEnv.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    // Pipeline INCR and EXPIRE
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, ttlSeconds],
      ]),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ result?: number }>;
    return data[0]?.result ?? null;
  } catch {
    return null;
  }
}
