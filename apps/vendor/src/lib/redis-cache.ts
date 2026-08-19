import "server-only";

const TTL_SECONDS = 45;

function configured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function redisCommand<T>(command: string[]): Promise<T | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const res = await fetch(`${url}/${command.map(encodeURIComponent).join("/")}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: T };
    return data.result ?? null;
  } catch (err) {
    console.error("[redis-cache]", err);
    return null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!configured()) return null;
  const raw = await redisCommand<string>(["GET", key]);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = TTL_SECONDS): Promise<void> {
  if (!configured()) return;
  await redisCommand<string>(["SET", key, JSON.stringify(value), "EX", String(ttlSeconds)]);
}

export async function cacheDel(key: string): Promise<void> {
  if (!configured()) return;
  await redisCommand<number>(["DEL", key]);
}

export function redisCacheEnabled(): boolean {
  return configured();
}
