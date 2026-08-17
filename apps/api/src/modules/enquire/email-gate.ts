import { createHmac, timingSafeEqual } from "node:crypto";

import type { Env } from "../../config/env";

const GATE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30d

function gateSecret(env: Env): string {
  return process.env.EMAIL_GATE_SECRET?.trim() || env.DATABASE_URL;
}

/** Opaque proof that this email passed OTP — not a DB draft session. */
export function issueEmailGate(env: Env, email: string): string {
  const exp = Date.now() + GATE_TTL_MS;
  const payload = `${email.toLowerCase()}|${exp}`;
  const sig = createHmac("sha256", gateSecret(env)).update(payload).digest("hex");
  return Buffer.from(`${payload}|${sig}`).toString("base64url");
}

export function readEmailGate(env: Env, token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split("|");
    if (parts.length !== 3) return null;
    const [email, expStr, sig] = parts;
    if (!email || !expStr || !sig) return null;
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || exp < Date.now()) return null;
    const payload = `${email}|${expStr}`;
    const expected = createHmac("sha256", gateSecret(env)).update(payload).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return email.toLowerCase();
  } catch {
    return null;
  }
}
