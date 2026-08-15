# Admin Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admins can log in with email and password, stay logged in for 8 hours, and reach protected `/admin` pages that nobody else can open.

**Architecture:** All code lives in `apps/web` (Next.js App Router) and talks to Postgres through Prisma. Passwords are hashed with PBKDF2-SHA256 via WebCrypto. Session tokens are random 32-byte values sent as an httpOnly cookie; the database stores only their SHA-256 hash. Route protection happens server-side in a shared guard, never in client code.

**Tech Stack:** Next.js 16.2.4, React 19.2.8, Prisma 5.22, PostgreSQL, Vitest 3 (added by this plan), TypeScript 5.

This is **Plan 1 of 2**. Plan 2 covers the requirement/quote workflow and depends on the guard built here. Source spec: `docs/superpowers/specs/2026-08-13-vendor-agent-portal-design.md`.

## Global Constraints

- **Commit normally.** This plan executes inside an isolated git worktree on branch `feat/admin-auth`, where Muhammad has approved subagent commits. Every "stage and hand off" step means: stage the listed files and **run `git commit`** with the suggested message. (Outside this worktree Muhammad commits himself; that rule does not apply here.)
- The repository root of this worktree is `~/Developer/rvcc-admin-auth`. Dependencies are already installed.
- Password hashing: **PBKDF2-SHA256, 210,000 iterations, 16-byte random salt**, stored as `pbkdf2$sha256$210000$<salt_b64>$<hash_b64>`.
- Account lockout: **5 consecutive failures, 15-minute lock**. Counter resets on success.
- Admin session lifetime: **8 hours**. Cookie name: `rvcc_admin_session`. Flags: `httpOnly`, `Secure`, `SameSite=Lax`, `path=/`.
- The database stores the **SHA-256 hash** of the session token, never the token.
- There is **no public admin signup route**. The first admin comes from a CLI script.
- Login responses must not reveal whether an email exists. Use one message: `"Email or password is incorrect."`
- Import alias `@/*` maps to `apps/web/src/*`.
- Prettier: 2-space indent, 100-character lines, sorted imports. Run `npx prettier --write` on touched files before staging.
- All commands run from `apps/web` unless stated otherwise.
- Node 20.20.1 is the default local version and is sufficient for every task in this plan.

## File Structure

| File                                     | Responsibility                                |
| ---------------------------------------- | --------------------------------------------- |
| `vitest.config.ts`                       | Test runner config                            |
| `src/lib/test/db.ts`                     | Test Prisma client + table reset helper       |
| `src/lib/auth/password.ts`               | Hash and verify a password. No database.      |
| `src/lib/auth/constants.ts`              | Cookie name, session lifetime, lockout values |
| `src/lib/auth/admin-session.ts`          | Create, look up, and revoke admin sessions    |
| `src/lib/auth/admin-login.ts`            | Verify credentials, apply lockout rules       |
| `src/lib/auth/admin-guard.ts`            | `requireAdmin()` for pages and route handlers |
| `src/app/api/admin/auth/login/route.ts`  | POST login                                    |
| `src/app/api/admin/auth/logout/route.ts` | POST logout                                   |
| `src/app/admin/layout.tsx`               | Server-side gate for every `/admin` page      |
| `src/app/admin/page.tsx`                 | Minimal dashboard proving the gate works      |
| `src/app/admin/login/page.tsx`           | Login form                                    |
| `scripts/create-admin.mjs`               | CLI to create the first admin                 |

Each file has one job. `password.ts` is pure and needs no database, which is why it is tested first and separately.

---

### Task 1: Test harness

**Files:**

- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/src/lib/test/db.ts`
- Modify: `apps/web/package.json` (scripts + devDependencies)

**Interfaces:**

- Consumes: nothing.
- Produces: `testPrisma` (a `PrismaClient` bound to `TEST_DATABASE_URL`) and `resetAdminTables(): Promise<void>`, used by every later database test.

- [ ] **Step 1: Install Vitest**

From `apps/web`:

```bash
npm install --save-dev vitest@^3.0.0 dotenv@^16.4.5
```

- [ ] **Step 2: Add test scripts**

In `apps/web/package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:db:push": "dotenv -e .env.test -- prisma db push --skip-generate"
```

- [ ] **Step 3: Create the test database**

```bash
createdb rvcc_test || true
```

Then create `apps/web/.env.test` containing:

```
TEST_DATABASE_URL="postgresql://postgres@127.0.0.1:5432/rvcc_test"
```

Adjust host, port, and user to match the local PostgreSQL install. Confirm `.env.test` is covered by `.gitignore` — the repo already ignores `.env*` patterns; verify with `git check-ignore apps/web/.env.test` and add the entry if it prints nothing.

- [ ] **Step 4: Write the Vitest config**

Create `apps/web/vitest.config.ts`:

```ts
import { config } from "dotenv";
import path from "node:path";
import { defineConfig } from "vitest/config";

config({ path: path.resolve(__dirname, ".env.test") });

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
```

`fileParallelism: false` matters: these tests share one database, and parallel files would truncate each other's rows mid-test.

- [ ] **Step 5: Write the test database helper**

Create `apps/web/src/lib/test/db.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const url = process.env.TEST_DATABASE_URL;
if (!url) {
  throw new Error("TEST_DATABASE_URL is not set. Create apps/web/.env.test first.");
}

export const testPrisma = new PrismaClient({ datasources: { db: { url } } });

/** Clears admin tables between tests. Sessions cascade from users. */
export async function resetAdminTables(): Promise<void> {
  await testPrisma.$executeRawUnsafe('TRUNCATE "AdminSession", "AdminUser" CASCADE');
}
```

- [ ] **Step 6: Verify the runner starts**

Run: `npm test`
Expected: Vitest starts and reports "No test files found". That is success for this step — it proves config loads and the alias resolves. `resetAdminTables` will fail until Task 3 creates the tables, which is expected.

- [ ] **Step 7: Stage and hand off**

```bash
npx prettier --write vitest.config.ts src/lib/test/db.ts
git add apps/web/vitest.config.ts apps/web/src/lib/test/db.ts apps/web/package.json apps/web/package-lock.json
```

Do **not** run `git commit`. Tell Muhammad the suggested message:
`test: add vitest harness and test database helper`

---

### Task 2: Password hashing

**Files:**

- Create: `apps/web/src/lib/auth/password.ts`
- Test: `apps/web/src/lib/auth/password.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `hashPassword(plain: string): Promise<string>` — returns the full `pbkdf2$...` string
  - `verifyPassword(plain: string, stored: string): Promise<boolean>`

No database. Pure functions, tested first.

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/lib/auth/password.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password", () => {
  it("verifies a correct password", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(await verifyPassword("correct horse battery", stored)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(await verifyPassword("wrong password", stored)).toBe(false);
  });

  it("produces a different hash each time for the same password", async () => {
    const a = await hashPassword("same password");
    const b = await hashPassword("same password");
    expect(a).not.toBe(b);
  });

  it("uses the documented format", async () => {
    const stored = await hashPassword("whatever");
    expect(stored.startsWith("pbkdf2$sha256$210000$")).toBe(true);
    expect(stored.split("$")).toHaveLength(5);
  });

  it("returns false for a malformed stored value instead of throwing", async () => {
    expect(await verifyPassword("whatever", "not-a-real-hash")).toBe(false);
  });
});
```

The last test matters: a corrupted database row must not crash the login endpoint.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/auth/password.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/password`.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/lib/auth/password.ts`:

```ts
const ITERATIONS = 210_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;
const PREFIX = "pbkdf2$sha256";

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "base64"));
}

async function derive(plain: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(plain),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    KEY_BITS
  );
  return new Uint8Array(bits);
}

/** Constant-time comparison. Returns false on length mismatch. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a[i] ^ b[i];
  return out === 0;
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(plain, salt, ITERATIONS);
  return `${PREFIX}$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 5) return false;
  const [scheme, algo, iterationsRaw, saltB64, hashB64] = parts;
  if (scheme !== "pbkdf2" || algo !== "sha256") return false;

  const iterations = Number(iterationsRaw);
  if (!Number.isInteger(iterations) || iterations < 1) return false;

  try {
    const salt = fromBase64(saltB64);
    const expected = fromBase64(hashB64);
    const actual = await derive(plain, salt, iterations);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
```

`verifyPassword` reads the iteration count from the stored string rather than the constant, so raising `ITERATIONS` later will not lock out existing admins.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/auth/password.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Stage and hand off**

```bash
npx prettier --write src/lib/auth/password.ts src/lib/auth/password.test.ts
git add apps/web/src/lib/auth/password.ts apps/web/src/lib/auth/password.test.ts
```

Suggested message: `feat(auth): add PBKDF2 password hashing`

---

### Task 3: Admin database models

**Files:**

- Modify: `apps/web/prisma/schema.prisma` (append at end)
- Create: `apps/web/src/lib/auth/constants.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: Prisma models `AdminUser` and `AdminSession`; constants `ADMIN_COOKIE`, `ADMIN_SESSION_MS`, `MAX_FAILED_ATTEMPTS`, `LOCKOUT_MS`.

- [ ] **Step 1: Append the models**

Add to the end of `apps/web/prisma/schema.prisma`:

```prisma
model AdminUser {
  id             String    @id @default(cuid())
  email          String    @unique
  name           String    @default("")
  passwordHash   String
  isActive       Boolean   @default(true)
  failedAttempts Int       @default(0)
  lockedUntil    DateTime?
  lastLoginAt    DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  sessions AdminSession[]
}

model AdminSession {
  id          String   @id @default(cuid())
  adminUserId String
  adminUser   AdminUser @relation(fields: [adminUserId], references: [id], onDelete: Cascade)
  tokenHash   String   @unique
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  @@index([adminUserId])
}
```

- [ ] **Step 2: Write the constants**

Create `apps/web/src/lib/auth/constants.ts`:

```ts
export const ADMIN_COOKIE = "rvcc_admin_session";
export const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;
```

- [ ] **Step 3: Apply to the development database and regenerate the client**

```bash
npx prisma db push
```

Expected: "Your database is now in sync with your Prisma schema", and the client regenerates.

- [ ] **Step 4: Apply to the test database**

```bash
npm run test:db:push
```

Expected: same sync message against `rvcc_test`.

- [ ] **Step 5: Verify both databases have the tables**

```bash
psql "$DATABASE_URL" -c '\d "AdminUser"' | head -12
psql "postgresql://postgres@127.0.0.1:5432/rvcc_test" -c '\d "AdminSession"' | head -12
```

Expected: both print a column listing including `passwordHash` / `tokenHash`. If either errors with "did not find any relation", the corresponding push in Step 3 or 4 did not run.

- [ ] **Step 6: Stage and hand off**

```bash
npx prettier --write src/lib/auth/constants.ts
git add apps/web/prisma/schema.prisma apps/web/src/lib/auth/constants.ts
```

Suggested message: `feat(auth): add AdminUser and AdminSession models`

---

### Task 4: Session create, look up, revoke

**Files:**

- Create: `apps/web/src/lib/auth/admin-session.ts`
- Test: `apps/web/src/lib/auth/admin-session.test.ts`

**Interfaces:**

- Consumes: `testPrisma`, `resetAdminTables` (Task 1); `ADMIN_SESSION_MS` (Task 3).
- Produces:
  - `createAdminSession(prisma: PrismaClient, adminUserId: string): Promise<string>` — returns the raw token
  - `findAdminBySessionToken(prisma: PrismaClient, token: string): Promise<AdminUser | null>`
  - `revokeAdminSession(prisma: PrismaClient, token: string): Promise<void>`
  - `hashToken(token: string): Promise<string>`

Every function takes `prisma` as its first argument so tests can pass `testPrisma` and routes can pass the app client.

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/lib/auth/admin-session.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";

import {
  createAdminSession,
  findAdminBySessionToken,
  hashToken,
  revokeAdminSession,
} from "@/lib/auth/admin-session";
import { resetAdminTables, testPrisma } from "@/lib/test/db";

async function makeAdmin() {
  return testPrisma.adminUser.create({
    data: { email: "a@example.com", name: "A", passwordHash: "x" },
  });
}

describe("admin sessions", () => {
  beforeEach(async () => {
    await resetAdminTables();
  });

  it("finds the admin from a fresh token", async () => {
    const admin = await makeAdmin();
    const token = await createAdminSession(testPrisma, admin.id);
    const found = await findAdminBySessionToken(testPrisma, token);
    expect(found?.id).toBe(admin.id);
  });

  it("stores the hash, never the raw token", async () => {
    const admin = await makeAdmin();
    const token = await createAdminSession(testPrisma, admin.id);
    const row = await testPrisma.adminSession.findFirst();
    expect(row?.tokenHash).toBe(await hashToken(token));
    expect(row?.tokenHash).not.toBe(token);
  });

  it("rejects an unknown token", async () => {
    expect(await findAdminBySessionToken(testPrisma, "made-up")).toBeNull();
  });

  it("rejects an expired session", async () => {
    const admin = await makeAdmin();
    const token = await createAdminSession(testPrisma, admin.id);
    await testPrisma.adminSession.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await findAdminBySessionToken(testPrisma, token)).toBeNull();
  });

  it("rejects a session belonging to a deactivated admin", async () => {
    const admin = await makeAdmin();
    const token = await createAdminSession(testPrisma, admin.id);
    await testPrisma.adminUser.update({ where: { id: admin.id }, data: { isActive: false } });
    expect(await findAdminBySessionToken(testPrisma, token)).toBeNull();
  });

  it("stops working after revoke", async () => {
    const admin = await makeAdmin();
    const token = await createAdminSession(testPrisma, admin.id);
    await revokeAdminSession(testPrisma, token);
    expect(await findAdminBySessionToken(testPrisma, token)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/auth/admin-session.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/admin-session`.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/lib/auth/admin-session.ts`:

```ts
import type { AdminUser, PrismaClient } from "@prisma/client";

import { ADMIN_SESSION_MS } from "@/lib/auth/constants";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return toHex(new Uint8Array(digest));
}

export async function createAdminSession(
  prisma: PrismaClient,
  adminUserId: string
): Promise<string> {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
  await prisma.adminSession.create({
    data: {
      adminUserId,
      tokenHash: await hashToken(token),
      expiresAt: new Date(Date.now() + ADMIN_SESSION_MS),
    },
  });
  return token;
}

export async function findAdminBySessionToken(
  prisma: PrismaClient,
  token: string
): Promise<AdminUser | null> {
  if (!token) return null;
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: await hashToken(token) },
    include: { adminUser: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;
  if (!session.adminUser.isActive) return null;
  return session.adminUser;
}

export async function revokeAdminSession(prisma: PrismaClient, token: string): Promise<void> {
  if (!token) return;
  await prisma.adminSession.deleteMany({ where: { tokenHash: await hashToken(token) } });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/auth/admin-session.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Stage and hand off**

```bash
npx prettier --write src/lib/auth/admin-session.ts src/lib/auth/admin-session.test.ts
git add apps/web/src/lib/auth/admin-session.ts apps/web/src/lib/auth/admin-session.test.ts
```

Suggested message: `feat(auth): add admin session create, lookup, revoke`

---

### Task 5: Credential check with lockout

**Files:**

- Create: `apps/web/src/lib/auth/admin-login.ts`
- Test: `apps/web/src/lib/auth/admin-login.test.ts`

**Interfaces:**

- Consumes: `verifyPassword`, `hashPassword` (Task 2); `MAX_FAILED_ATTEMPTS`, `LOCKOUT_MS` (Task 3).
- Produces: `attemptAdminLogin(prisma: PrismaClient, email: string, password: string): Promise<AdminLoginResult>` where

```ts
type AdminLoginResult =
  { ok: true; admin: AdminUser } | { ok: false; reason: "invalid" | "locked" | "inactive" };
```

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/lib/auth/admin-login.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";

import { attemptAdminLogin } from "@/lib/auth/admin-login";
import { hashPassword } from "@/lib/auth/password";
import { resetAdminTables, testPrisma } from "@/lib/test/db";

const EMAIL = "admin@example.com";
const PASSWORD = "a-good-password";

async function makeAdmin(overrides: Record<string, unknown> = {}) {
  return testPrisma.adminUser.create({
    data: {
      email: EMAIL,
      name: "Admin",
      passwordHash: await hashPassword(PASSWORD),
      ...overrides,
    },
  });
}

describe("attemptAdminLogin", () => {
  beforeEach(async () => {
    await resetAdminTables();
  });

  it("succeeds with the right password", async () => {
    await makeAdmin();
    const result = await attemptAdminLogin(testPrisma, EMAIL, PASSWORD);
    expect(result.ok).toBe(true);
  });

  it("is case-insensitive on email", async () => {
    await makeAdmin();
    const result = await attemptAdminLogin(testPrisma, "ADMIN@EXAMPLE.COM", PASSWORD);
    expect(result.ok).toBe(true);
  });

  it("fails with the wrong password", async () => {
    await makeAdmin();
    const result = await attemptAdminLogin(testPrisma, EMAIL, "nope");
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("fails for an unknown email", async () => {
    const result = await attemptAdminLogin(testPrisma, "ghost@example.com", PASSWORD);
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("counts failures", async () => {
    const admin = await makeAdmin();
    await attemptAdminLogin(testPrisma, EMAIL, "nope");
    await attemptAdminLogin(testPrisma, EMAIL, "nope");
    const row = await testPrisma.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
    expect(row.failedAttempts).toBe(2);
  });

  it("locks after 5 failures and reports locked even with the right password", async () => {
    await makeAdmin();
    for (let i = 0; i < 5; i++) {
      await attemptAdminLogin(testPrisma, EMAIL, "nope");
    }
    const result = await attemptAdminLogin(testPrisma, EMAIL, PASSWORD);
    expect(result).toEqual({ ok: false, reason: "locked" });
  });

  it("allows login again once the lock expires", async () => {
    const admin = await makeAdmin();
    for (let i = 0; i < 5; i++) {
      await attemptAdminLogin(testPrisma, EMAIL, "nope");
    }
    await testPrisma.adminUser.update({
      where: { id: admin.id },
      data: { lockedUntil: new Date(Date.now() - 1000) },
    });
    const result = await attemptAdminLogin(testPrisma, EMAIL, PASSWORD);
    expect(result.ok).toBe(true);
  });

  it("resets the counter after a success", async () => {
    const admin = await makeAdmin();
    await attemptAdminLogin(testPrisma, EMAIL, "nope");
    await attemptAdminLogin(testPrisma, EMAIL, PASSWORD);
    const row = await testPrisma.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
    expect(row.failedAttempts).toBe(0);
    expect(row.lockedUntil).toBeNull();
    expect(row.lastLoginAt).not.toBeNull();
  });

  it("refuses a deactivated admin", async () => {
    await makeAdmin({ isActive: false });
    const result = await attemptAdminLogin(testPrisma, EMAIL, PASSWORD);
    expect(result).toEqual({ ok: false, reason: "inactive" });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/auth/admin-login.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/admin-login`.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/lib/auth/admin-login.ts`:

```ts
import type { AdminUser, PrismaClient } from "@prisma/client";

import { LOCKOUT_MS, MAX_FAILED_ATTEMPTS } from "@/lib/auth/constants";
import { verifyPassword } from "@/lib/auth/password";

export type AdminLoginResult =
  { ok: true; admin: AdminUser } | { ok: false; reason: "invalid" | "locked" | "inactive" };

export async function attemptAdminLogin(
  prisma: PrismaClient,
  email: string,
  password: string
): Promise<AdminLoginResult> {
  const admin = await prisma.adminUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!admin) return { ok: false, reason: "invalid" };
  if (!admin.isActive) return { ok: false, reason: "inactive" };

  if (admin.lockedUntil && admin.lockedUntil.getTime() > Date.now()) {
    return { ok: false, reason: "locked" };
  }

  if (!(await verifyPassword(password, admin.passwordHash))) {
    const failedAttempts = admin.failedAttempts + 1;
    const shouldLock = failedAttempts >= MAX_FAILED_ATTEMPTS;
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        failedAttempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MS) : admin.lockedUntil,
      },
    });
    return { ok: false, reason: shouldLock ? "locked" : "invalid" };
  }

  const updated = await prisma.adminUser.update({
    where: { id: admin.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  return { ok: true, admin: updated };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/auth/admin-login.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Stage and hand off**

```bash
npx prettier --write src/lib/auth/admin-login.ts src/lib/auth/admin-login.test.ts
git add apps/web/src/lib/auth/admin-login.ts apps/web/src/lib/auth/admin-login.test.ts
```

Suggested message: `feat(auth): add admin credential check with lockout`

---

### Task 6: Login and logout routes

**Files:**

- Create: `apps/web/src/app/api/admin/auth/login/route.ts`
- Create: `apps/web/src/app/api/admin/auth/logout/route.ts`

**Interfaces:**

- Consumes: `attemptAdminLogin` (Task 5); `createAdminSession`, `revokeAdminSession` (Task 4); `ADMIN_COOKIE`, `ADMIN_SESSION_MS` (Task 3); `prisma` from `@/lib/db`.
- Produces: `POST /api/admin/auth/login` and `POST /api/admin/auth/logout`.

These are tested by hand in Step 4 because they need a running server. The logic they call is already covered by Tasks 2, 4, and 5.

- [ ] **Step 1: Write the login route**

Create `apps/web/src/app/api/admin/auth/login/route.ts`:

```ts
import { NextResponse } from "next/server";

import { z } from "zod";

import { attemptAdminLogin } from "@/lib/auth/admin-login";
import { createAdminSession } from "@/lib/auth/admin-session";
import { ADMIN_COOKIE, ADMIN_SESSION_MS } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const GENERIC = "Email or password is incorrect.";

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC }, { status: 400 });
  }

  const result = await attemptAdminLogin(prisma, parsed.data.email, parsed.data.password);

  if (!result.ok) {
    if (result.reason === "locked") {
      return NextResponse.json(
        { error: "Too many failed attempts. Try again in 15 minutes." },
        { status: 423 }
      );
    }
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  const token = await createAdminSession(prisma, result.admin.id);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MS / 1000,
  });
  return response;
}
```

`inactive` deliberately returns the same generic message as `invalid` — telling someone their account exists but is disabled is information they have not earned.

- [ ] **Step 2: Write the logout route**

Create `apps/web/src/app/api/admin/auth/logout/route.ts`:

```ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { revokeAdminSession } from "@/lib/auth/admin-session";
import { ADMIN_COOKIE } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) {
    await revokeAdminSession(prisma, token);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
```

- [ ] **Step 3: Create a test admin to log in with**

This task needs an admin row to test against. Create one with a throwaway script — from `apps/web`, write `/tmp/make-admin.mjs`:

```js
import { PrismaClient } from "@prisma/client";

const ITERATIONS = 210_000;
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode("a-long-enough-password"),
  "PBKDF2",
  false,
  ["deriveBits"]
);
const bits = await crypto.subtle.deriveBits(
  { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
  key,
  256
);
const b64 = (bytes) => Buffer.from(bytes).toString("base64");
const passwordHash = `pbkdf2$sha256$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;

const prisma = new PrismaClient();
await prisma.adminUser.create({
  data: { email: "you@example.com", name: "Test Admin", passwordHash },
});
console.log("Created you@example.com with password: a-long-enough-password");
await prisma.$disconnect();
```

Run it, then delete it:

```bash
node /tmp/make-admin.mjs && rm /tmp/make-admin.mjs
```

Expected: `Created you@example.com with password: a-long-enough-password`

This is throwaway scaffolding for testing this task. A proper CLI arrives in Task 8.

- [ ] **Step 4: Verify by hand**

Start the app: `npm run dev`

Wrong password:

```bash
curl -s -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"wrong"}' -w "\n%{http_code}\n"
```

Expected: `{"error":"Email or password is incorrect."}` and `401`.

Right password:

```bash
curl -s -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"YOUR_PASSWORD"}' \
  -c /tmp/admin-cookie.txt -w "\n%{http_code}\n"
```

Expected: `{"ok":true}`, `200`, and `/tmp/admin-cookie.txt` contains `rvcc_admin_session` with `HttpOnly`.

- [ ] **Step 5: Stage and hand off**

```bash
npx prettier --write src/app/api/admin/auth/login/route.ts src/app/api/admin/auth/logout/route.ts
git add apps/web/src/app/api/admin/auth/login/route.ts apps/web/src/app/api/admin/auth/logout/route.ts
```

Suggested message: `feat(auth): add admin login and logout routes`

---

### Task 7: The guard and protected pages

**Files:**

- Create: `apps/web/src/lib/auth/admin-guard.ts`
- Create: `apps/web/src/app/admin/layout.tsx`
- Create: `apps/web/src/app/admin/page.tsx`

**Interfaces:**

- Consumes: `findAdminBySessionToken` (Task 4); `ADMIN_COOKIE` (Task 3).
- Produces:
  - `getAdminFromCookies(): Promise<AdminUser | null>` — no redirect, for optional checks
  - `requireAdmin(): Promise<AdminUser>` — redirects to `/admin/login` when absent

- [ ] **Step 1: Write the guard**

Create `apps/web/src/lib/auth/admin-guard.ts`:

```ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { AdminUser } from "@prisma/client";
import "server-only";

import { findAdminBySessionToken } from "@/lib/auth/admin-session";
import { ADMIN_COOKIE } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

export async function getAdminFromCookies(): Promise<AdminUser | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return findAdminBySessionToken(prisma, token);
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminFromCookies();
  if (!admin) redirect("/admin/login");
  return admin;
}
```

The `server-only` import makes the build fail if this is ever imported into a client component — turning an auth bypass into a compile error.

- [ ] **Step 2: Write the protected layout**

Create `apps/web/src/app/admin/layout.tsx`:

```tsx
import { requireAdmin } from "@/lib/auth/admin-guard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <div className="min-h-screen bg-neutral-50">{children}</div>;
}
```

- [ ] **Step 3: Write the dashboard**

Create `apps/web/src/app/admin/page.tsx`:

```tsx
import { requireAdmin } from "@/lib/auth/admin-guard";

export default async function AdminHome() {
  const admin = await requireAdmin();
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mt-2 text-neutral-600">Signed in as {admin.email}</p>
    </main>
  );
}
```

`requireAdmin()` is called in both the layout and the page on purpose. The layout is the gate; the page needs the admin object anyway, and relying on a parent layout for authorisation is a habit that breaks the moment a route is rendered without it.

- [ ] **Step 4: Move the login page out of the guarded segment**

The login page must not sit inside the guarded layout, or a logged-out admin is redirected to a page that redirects them again. Task 9 creates it at `src/app/admin/login/page.tsx`, which **is** inside this layout — so add a route group now to keep them apart.

Rename the layout file:

```bash
mkdir -p "src/app/admin/(protected)"
git mv src/app/admin/layout.tsx "src/app/admin/(protected)/layout.tsx"
git mv src/app/admin/page.tsx "src/app/admin/(protected)/page.tsx"
```

Route groups in parentheses do not appear in the URL, so `/admin` still resolves to the dashboard, while `/admin/login` sits outside the guard.

- [ ] **Step 5: Verify redirect behaviour**

With `npm run dev` running, first confirm the guard blocks an anonymous request:

```bash
curl -s -o /dev/null -w "no cookie: %{http_code} -> %{redirect_url}\n" http://localhost:3000/admin
```

Expected: `307` redirecting to `/admin/login`.

Now obtain a session cookie and retry. Substitute the admin email and password that exist in your database:

```bash
curl -s -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"a-long-enough-password"}' \
  -c /tmp/admin-cookie.txt -o /dev/null -w "login: %{http_code}\n"

curl -s -o /dev/null -w "with cookie: %{http_code}\n" -b /tmp/admin-cookie.txt http://localhost:3000/admin
```

Expected: `login: 200`, then `with cookie: 200`.

If no admin exists yet, create one with the throwaway script in Task 6, Step 3.

- [ ] **Step 6: Stage and hand off**

```bash
npx prettier --write src/lib/auth/admin-guard.ts "src/app/admin/(protected)/layout.tsx" "src/app/admin/(protected)/page.tsx"
git add apps/web/src/lib/auth/admin-guard.ts "apps/web/src/app/admin/(protected)"
```

Suggested message: `feat(auth): guard /admin behind an admin session`

---

### Task 8: CLI to create the first admin

**Files:**

- Create: `apps/web/scripts/create-admin.mjs`
- Modify: `apps/web/package.json` (add script)

**Interfaces:**

- Consumes: the `pbkdf2$sha256$...` format from Task 2. The hashing is reimplemented here in plain JavaScript because `scripts/` runs as `.mjs` outside the TypeScript build, matching the existing `copy-pdf-worker.mjs` pattern.
- Produces: `npm run admin:create -- <email> <password> [name]`.

- [ ] **Step 1: Write the script**

Create `apps/web/scripts/create-admin.mjs`:

```js
import { PrismaClient } from "@prisma/client";

const ITERATIONS = 210_000;

async function hashPassword(plain) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(plain),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256
  );
  const b64 = (bytes) => Buffer.from(bytes).toString("base64");
  return `pbkdf2$sha256$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

const [email, password, ...nameParts] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: npm run admin:create -- <email> <password> [name]");
  process.exit(1);
}

if (password.length < 12) {
  console.error("Password must be at least 12 characters.");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const admin = await prisma.adminUser.create({
    data: {
      email: email.trim().toLowerCase(),
      name: nameParts.join(" ") || email.split("@")[0],
      passwordHash: await hashPassword(password),
    },
  });
  console.log(`Created admin ${admin.email}`);
} catch (err) {
  if (err.code === "P2002") {
    console.error(`An admin with email ${email} already exists.`);
    process.exit(1);
  }
  throw err;
} finally {
  await prisma.$disconnect();
}
```

- [ ] **Step 2: Add the npm script**

In `apps/web/package.json`, add to `"scripts"`:

```json
"admin:create": "node ./scripts/create-admin.mjs"
```

- [ ] **Step 3: Verify it rejects bad input**

```bash
npm run admin:create -- someone@example.com short
```

Expected: `Password must be at least 12 characters.` and exit code 1.

- [ ] **Step 4: Create a real admin**

```bash
npm run admin:create -- you@example.com "a-long-enough-password" "Your Name"
```

Expected: `Created admin you@example.com`.

Run it a second time with the same email. Expected: `An admin with email you@example.com already exists.` and exit code 1 — not a raw Prisma stack trace.

- [ ] **Step 5: Confirm the hash verifies**

Create a throwaway check and run it:

```bash
npx vitest run src/lib/auth/password.test.ts
```

Expected: PASS. Then confirm the stored row looks right:

```bash
npx prisma studio
```

Expected: the `AdminUser` row's `passwordHash` starts with `pbkdf2$sha256$210000$`.

- [ ] **Step 6: Stage and hand off**

```bash
npx prettier --write scripts/create-admin.mjs
git add apps/web/scripts/create-admin.mjs apps/web/package.json
```

Suggested message: `feat(auth): add CLI to create the first admin`

---

### Task 9: Login page

**Files:**

- Create: `apps/web/src/app/admin/login/page.tsx`

**Interfaces:**

- Consumes: `POST /api/admin/auth/login` (Task 6); `getAdminFromCookies` (Task 7).
- Produces: the `/admin/login` screen. Nothing depends on it.

Sits outside `(protected)`, so it renders without a session.

- [ ] **Step 1: Write the page**

Create `apps/web/src/app/admin/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Email or password is incorrect.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Admin sign in</h1>

        <label className="block">
          <span className="text-sm text-neutral-700">Email</span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm text-neutral-700">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
```

`role="alert"` makes screen readers announce the error. `autoComplete` values let password managers fill the form.

- [ ] **Step 2: Redirect an already-signed-in admin away**

Create `apps/web/src/app/admin/login/layout.tsx`:

```tsx
import { redirect } from "next/navigation";

import { getAdminFromCookies } from "@/lib/auth/admin-guard";

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminFromCookies();
  if (admin) redirect("/admin");
  return <>{children}</>;
}
```

- [ ] **Step 3: Verify the full flow in a browser**

With `npm run dev` running:

1. Open `http://localhost:3000/admin` while logged out → lands on `/admin/login`.
2. Enter a wrong password → "Email or password is incorrect." No redirect.
3. Enter the correct password → lands on `/admin`, showing your email.
4. Open `http://localhost:3000/admin/login` again → bounces straight to `/admin`.
5. Fail the password 5 times with a different browser profile → "Too many failed attempts. Try again in 15 minutes."

- [ ] **Step 4: Run the whole suite**

Run: `npm test`
Expected: PASS — 20 tests across 3 files.

- [ ] **Step 5: Check the build**

Run: `npm run build`
Expected: compiles with no type errors.

- [ ] **Step 6: Stage and hand off**

```bash
npx prettier --write src/app/admin/login/page.tsx src/app/admin/login/layout.tsx
git add apps/web/src/app/admin/login
```

Suggested message: `feat(auth): add admin login page`

---

## Done when

- `npm test` passes, covering password hashing, sessions, and lockout.
- `/admin` redirects to `/admin/login` without a valid session cookie.
- A wrong password never reveals whether the email exists.
- Five failures lock the account for 15 minutes.
- The session cookie is `httpOnly`, and the database holds only its hash.
- `npm run build` succeeds.

## Not in this plan

Agent OTP login, the `Agent` table, requirements, quotes, attachments, ranking, and email all belong to Plan 2. Admin management screens (`/admin/agents`, creating further admins from the UI) also belong to Plan 2, since they are the first real use of this guard.
