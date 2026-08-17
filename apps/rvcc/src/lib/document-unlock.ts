import { createHmac, timingSafeEqual } from "node:crypto";

export const DOC_UNLOCK_COOKIE = "rvcc_doc_unlock";
export const DOC_UNLOCK_TTL_MS = 1000 * 60 * 60 * 8;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 8;

export function isFourDigitPin(value: string): boolean {
  return /^\d{4}$/.test(value);
}

function hmac(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function equalHex(a: string, b: string): boolean {
  try {
    const left = Buffer.from(a, "hex");
    const right = Buffer.from(b, "hex");
    if (left.length !== right.length || left.length === 0) return false;
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export function mintUnlockToken(secret: string, now = Date.now()): string {
  const exp = String(now + DOC_UNLOCK_TTL_MS);
  return `${exp}.${hmac(secret, `doc-unlock:${exp}`)}`;
}

export function unlockTokenValid(
  secret: string,
  token: string | undefined,
  now = Date.now()
): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(exp) || !/^[0-9a-f]+$/i.test(sig)) return false;
  if (Number(exp) <= now) return false;
  return equalHex(sig, hmac(secret, `doc-unlock:${exp}`));
}

export function pinMatches(secret: string, pin: string): boolean {
  if (!isFourDigitPin(pin) || !isFourDigitPin(secret)) return false;
  return timingSafeEqual(Buffer.from(pin, "utf8"), Buffer.from(secret, "utf8"));
}

type Bucket = { count: number; resetAt: number };
const attempts = new Map<string, Bucket>();

export function rateLimitUnlock(key: string, now = Date.now()): boolean {
  const existing = attempts.get(key);
  if (!existing || existing.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (existing.count >= RATE_MAX) return false;
  existing.count += 1;
  return true;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
