/**
 * Creates or updates an admin account (direct SQL — no Prisma in apps/admin).
 *
 *   DATABASE_URL=... npm run create-admin -- <email> <password> [name] [role]
 *
 * role: SUPER_ADMIN | ADMIN | REVIEWER   (default SUPER_ADMIN)
 */
import { randomBytes } from "node:crypto";
import postgres from "postgres";

import { hashPassword } from "../src/lib/password";

function cuid(): string {
  const bytes = randomBytes(16);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const [email, password, name = "", roleArg] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: DATABASE_URL=... npm run create-admin -- <email> <password> [name] [role]");
  process.exit(1);
}
if (password.length < 12) {
  console.error("Password must be at least 12 characters.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("Set DATABASE_URL in the environment (API DB only — not needed for the Next app).");
  process.exit(1);
}

const VALID_ROLES = ["SUPER_ADMIN", "ADMIN", "REVIEWER"] as const;
const role = roleArg ?? "SUPER_ADMIN";
if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
  console.error(`Invalid role "${role}". Expected one of: ${VALID_ROLES.join(", ")}`);
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

try {
  const normalized = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);
  const id = cuid();

  const [admin] = await sql`
    INSERT INTO "AdminUser" (
      id, email, name, "passwordHash", role, "isActive",
      "failedAttempts", "lockedUntil", "createdAt", "updatedAt"
    )
    VALUES (
      ${id}, ${normalized}, ${name}, ${passwordHash}, ${role}::"AdminRole", true,
      0, NULL, NOW(), NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
      "passwordHash" = EXCLUDED."passwordHash",
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      "isActive" = true,
      "failedAttempts" = 0,
      "lockedUntil" = NULL,
      "updatedAt" = NOW()
    RETURNING email, role
  `;

  console.log(`\n  ${admin.email}  (${admin.role})  — ready.\n  Sign in at /login\n`);
} catch (err) {
  console.error("Failed:", (err as Error).message);
  process.exit(1);
} finally {
  await sql.end({ timeout: 2 });
}
