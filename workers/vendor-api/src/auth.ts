import { LOCKOUT_MS, MAX_FAILED_ATTEMPTS, VENDOR_SESSION_TTL_MS } from "./constants";
import { type Sql, cuid, hashSha256 } from "./db";
import { hashPassword, verifyPassword } from "./password";

export type VendorLoginResult =
  | { ok: true; vendorId: string; mustChangePassword: boolean }
  | { ok: false; reason: "invalid" | "locked" | "disabled"; retryAfterMs?: number };

export type VendorIdentity = {
  id: string;
  email: string;
  name: string;
  mustChangePassword: boolean;
  registrationId: string;
};

/** Same shape and same anti-enumeration behaviour as the admin login. */
export async function attemptVendorLogin(
  sql: Sql,
  email: string,
  password: string
): Promise<VendorLoginResult> {
  const normalized = email.trim().toLowerCase();
  const [vendor] = await sql`
    SELECT * FROM "VendorUser" WHERE email = ${normalized} LIMIT 1
  `;

  if (!vendor) {
    await hashPassword(password); // equalise timing
    return { ok: false, reason: "invalid" };
  }

  if (vendor.lockedUntil && new Date(vendor.lockedUntil as string | Date) > new Date()) {
    return {
      ok: false,
      reason: "locked",
      retryAfterMs: new Date(vendor.lockedUntil as string | Date).getTime() - Date.now(),
    };
  }

  if (!vendor.isActive) return { ok: false, reason: "disabled" };

  if (!(await verifyPassword(password, String(vendor.passwordHash)))) {
    const failedAttempts = Number(vendor.failedAttempts) + 1;
    const lock = failedAttempts >= MAX_FAILED_ATTEMPTS;
    await sql`
      UPDATE "VendorUser"
      SET "failedAttempts" = ${lock ? 0 : failedAttempts},
          "lockedUntil" = ${lock ? new Date(Date.now() + LOCKOUT_MS) : null},
          "updatedAt" = NOW()
      WHERE id = ${vendor.id}
    `;
    return lock
      ? { ok: false, reason: "locked", retryAfterMs: LOCKOUT_MS }
      : { ok: false, reason: "invalid" };
  }

  await sql`
    UPDATE "VendorUser"
    SET "failedAttempts" = 0,
        "lockedUntil" = NULL,
        "lastLoginAt" = NOW(),
        "updatedAt" = NOW()
    WHERE id = ${vendor.id}
  `;

  return {
    ok: true,
    vendorId: String(vendor.id),
    mustChangePassword: Boolean(vendor.mustChangePassword),
  };
}

export async function createVendorSession(
  sql: Sql,
  vendorId: string,
  userAgent = ""
): Promise<string> {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
  const tokenHash = await hashSha256(token);
  const expiresAt = new Date(Date.now() + VENDOR_SESSION_TTL_MS);

  await sql`
    INSERT INTO "VendorSession" (id, "tokenHash", "vendorId", "userAgent", "expiresAt", "createdAt")
    VALUES (
      ${cuid()},
      ${tokenHash},
      ${vendorId},
      ${userAgent.slice(0, 255)},
      ${expiresAt},
      NOW()
    )
  `;

  return token;
}

/**
 * Authoritative vendor session check.
 *
 * Only `X-Vendor-Session` is accepted — never `X-Admin-Session`. Vendor and
 * admin sessions live in separate tables on purpose.
 */
export async function getVendorFromSession(
  sql: Sql,
  token: string | null | undefined
): Promise<VendorIdentity | null> {
  if (!token) return null;

  const tokenHash = await hashSha256(token);
  const [row] = await sql`
    SELECT
      v.id,
      v.email,
      v.name,
      v."mustChangePassword",
      v."registrationId",
      v."isActive",
      s."revokedAt",
      s."expiresAt"
    FROM "VendorSession" s
    INNER JOIN "VendorUser" v ON v.id = s."vendorId"
    WHERE s."tokenHash" = ${tokenHash}
    LIMIT 1
  `;

  if (!row) return null;
  if (row.revokedAt) return null;
  if (new Date(row.expiresAt as string | Date) < new Date()) return null;
  if (!row.isActive) return null;

  // Sliding expiry so active vendors are not kicked after a fixed wall-clock.
  const tokenHashForTouch = tokenHash;
  void sql`
    UPDATE "VendorSession"
    SET "expiresAt" = ${new Date(Date.now() + VENDOR_SESSION_TTL_MS)}
    WHERE "tokenHash" = ${tokenHashForTouch} AND "revokedAt" IS NULL
  `.catch(() => {
    /* non-fatal */
  });

  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name ?? ""),
    mustChangePassword: Boolean(row.mustChangePassword),
    registrationId: String(row.registrationId),
  };
}

export async function revokeVendorSession(
  sql: Sql,
  token: string | null | undefined
): Promise<void> {
  if (!token) return;
  const tokenHash = await hashSha256(token);
  await sql`
    UPDATE "VendorSession"
    SET "revokedAt" = NOW()
    WHERE "tokenHash" = ${tokenHash} AND "revokedAt" IS NULL
  `;
}

/** Used after a password change so other devices are signed out. */
export async function revokeAllVendorSessions(
  sql: Sql,
  vendorId: string,
  exceptToken?: string | null
): Promise<void> {
  if (exceptToken) {
    const exceptHash = await hashSha256(exceptToken);
    await sql`
      UPDATE "VendorSession"
      SET "revokedAt" = NOW()
      WHERE "vendorId" = ${vendorId}
        AND "revokedAt" IS NULL
        AND "tokenHash" <> ${exceptHash}
    `;
    return;
  }

  await sql`
    UPDATE "VendorSession"
    SET "revokedAt" = NOW()
    WHERE "vendorId" = ${vendorId} AND "revokedAt" IS NULL
  `;
}

/** Raw session token from X-Vendor-Session only — never X-Admin-Session. */
export function vendorSessionFrom(request: Request): string | null {
  return request.headers.get("X-Vendor-Session");
}
