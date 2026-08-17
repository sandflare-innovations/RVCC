/**
 * Creates or updates an admin account (direct SQL — no Prisma in apps/admin).
 *
 *   DATABASE_URL=... npm run create-admin -- <email> <password> [name] [role]
 *
 * role: SUPER_ADMIN | ADMIN | REVIEWER   (default SUPER_ADMIN)
 *
 * Hash params must stay in sync with @repo/auth-password.
 */
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const postgres = require("postgres");

function scrypt(password, salt, keylen, options) {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (err, derived) =>
      err ? reject(err) : resolve(derived)
    );
  });
}

const N = 16384;
const r = 8;
const p = 1;
const KEYLEN = 64;

async function hashPassword(plain) {
  const salt = randomBytes(16);
  const derived = await scrypt(plain.normalize("NFKC"), salt, KEYLEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

function cuid() {
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

const VALID_ROLES = ["SUPER_ADMIN", "ADMIN", "REVIEWER"];
const role = roleArg ?? "SUPER_ADMIN";
if (!VALID_ROLES.includes(role)) {
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
  console.error("Failed:", err.message);
  process.exit(1);
} finally {
  await sql.end({ timeout: 2 });
}
