import type { AdminRoleName } from "@rvcc/schemas";
import { canSeeConfidentialTarget } from "@rvcc/schemas";

/**
 * Strip confidential target pricing unless the caller is allowed to see it.
 * Invited vendors always see the auction / target amount so they can bid against it.
 */
export function redactTargetPrice<T extends Record<string, unknown>>(
  payload: T,
  role: AdminRoleName | "VENDOR" | null,
  status: string,
  _revealTargetPrice = false
): T {
  if (role === "VENDOR") {
    return payload;
  }
  if (role && canSeeConfidentialTarget(role, status)) return payload;
  return { ...payload, targetPrice: null, sellingPrice: null };
}

export function decimalToString(value: unknown): string | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n.toFixed(2);
}
