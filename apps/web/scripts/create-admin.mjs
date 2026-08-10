/**
 * Creates or updates an admin account.
 *
 *   node ./scripts/create-admin.mjs <email> <password> [name] [role]
 *
 * role: SUPER_ADMIN | ADMIN | REVIEWER   (default SUPER_ADMIN for the first account)
 *
 * Password hashing is duplicated from src/lib/admin/password.ts because that
 * module imports "server-only" and cannot be loaded from a plain Node script.
 * Keep the parameters below in sync with it.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const N = 16384;
const r = 8;
const p = 1;
const KEYLEN = 64;

async function hashPassword(plain) {
  const salt = randomBytes(16);
  const derived = await scrypt(plain.normalize("NFKC"), salt, KEYLEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

const [email, password, name = "", roleArg] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node ./scripts/create-admin.mjs <email> <password> [name] [role]");
  process.exit(1);
}
if (password.length < 12) {
  console.error("Password must be at least 12 characters.");
  process.exit(1);
}

const VALID_ROLES = ["SUPER_ADMIN", "ADMIN", "REVIEWER"];
const role = roleArg ?? "SUPER_ADMIN";
if (!VALID_ROLES.includes(role)) {
  console.error(`Invalid role "${role}". Expected one of: ${VALID_ROLES.join(", ")}`);
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const normalized = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  const admin = await prisma.adminUser.upsert({
    where: { email: normalized },
    // Reset lockout state so this doubles as a password-recovery path.
    update: { passwordHash, name, role, isActive: true, failedAttempts: 0, lockedUntil: null },
    create: { email: normalized, passwordHash, name, role },
  });

  console.log(`\n  ${admin.email}  (${admin.role})  — ready.\n  Sign in at /admin/login\n`);
} catch (err) {
  console.error("Failed:", err.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
