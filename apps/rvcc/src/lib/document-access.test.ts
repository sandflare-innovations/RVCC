import { expect, test } from "vitest";

import {
  DOC_UNLOCK_TTL_MS,
  mintUnlockToken,
  pinMatches,
  rateLimitUnlock,
  unlockTokenValid,
} from "./document-unlock";

test("accepts only the configured 4-digit pin", () => {
  expect(pinMatches("4821", "4821")).toBe(true);
  expect(pinMatches("4821", "4822")).toBe(false);
  expect(pinMatches("4821", "482")).toBe(false);
});

test("unlock token is valid until expiry and rejects tampering", () => {
  const secret = "4821";
  const token = mintUnlockToken(secret, 1_000_000);
  expect(unlockTokenValid(secret, token, 1_000_000)).toBe(true);
  expect(unlockTokenValid(secret, token, 1_000_000 + DOC_UNLOCK_TTL_MS + 1)).toBe(false);
  expect(unlockTokenValid("9999", token, 1_000_000)).toBe(false);
  const [exp, sig] = token.split(".");
  expect(unlockTokenValid(secret, `${exp}.${sig?.slice(0, -1)}a`, 1_000_000)).toBe(false);
});

test("rate-limits repeated unlock attempts from one key", () => {
  const key = `test-${Math.random()}`;
  for (let i = 0; i < 8; i++) expect(rateLimitUnlock(key, 50)).toBe(true);
  expect(rateLimitUnlock(key, 50)).toBe(false);
});
