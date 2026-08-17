import "server-only";

import { DOC_UNLOCK_TTL_MS, isFourDigitPin } from "./document-unlock";

export {
  DOC_UNLOCK_COOKIE,
  DOC_UNLOCK_TTL_MS,
  clientIp,
  mintUnlockToken,
  pinMatches,
  rateLimitUnlock,
  unlockTokenValid,
} from "./document-unlock";

/**
 * Server-only 4-digit download PIN.
 * Never NEXT_PUBLIC_ — that inlined the code into the browser bundle.
 */
export function configuredDocPassword(): string | null {
  const raw = process.env.DOC_PASSWORD?.trim() ?? "";
  if (!isFourDigitPin(raw)) return null;
  return raw;
}

export function docUnlockCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(DOC_UNLOCK_TTL_MS / 1000),
  };
}
