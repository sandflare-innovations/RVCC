# Foundation and Admin-Created Accounts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin create supplier accounts directly — no public registration — categorise them by industry, and have them log in and set their own password, on a codebase that can run tests.

**Architecture:** `main` uses a backend-for-frontend split. `workers/admin-api` and `workers/vendor-api` own auth, password hashing, and database access; `apps/admin` and `apps/vendor` are thin Next.js front-ends whose API routes forward to the Worker with the session cookie. New server logic goes in the Workers, new screens in the Next apps, and the one shared Prisma schema in `packages/db`.

**Tech Stack:** TypeScript, Next.js 16.2.4 (App Router, React 19), Prisma 5.22 + PostgreSQL, Cloudflare Workers, Tailwind 4, Vitest 3 (added by this plan), npm workspaces + Turborepo.

**Spec:** `docs/superpowers/specs/2026-08-15-requirement-quote-workflow-design.md`

## Global Constraints

- **Base branch:** `main` at `1890240` or later. Do **not** branch from `prod` — it is a diverged lineage with an incompatible schema.
- **Blocked until resolved by the user:** `main` and `prod` carry incompatible Prisma schemas against what appears to be the same `DATABASE_URL`. Task 3 onward applies migrations. Do not run a migration against the production database until ownership is settled. Every migration step below targets a **local** database.
- **Money is `Decimal`, never `Float`.** Not used in this plan, but holds for the schema.
- **Passwords** are hashed only through `@repo/auth-password` (scrypt, `scrypt$N$r$p$salt$hash`). Never add a second hashing scheme to `main`.
- **A temporary password is returned to the admin exactly once, in the create response.** It is never stored in plaintext, never emailed, never logged.
- **Server Components by default.** Add `"use client"` only for genuine interaction.
- **Every list that grows without bound is paginated**, default 25 per page.
- **Privileged actions write to `AuditLog`** (`action`, `entityType`, `entityId`, `metadata`).
- Commit after every task. Never use `git commit --no-verify`; husky + lint-staged run Prettier and ESLint.

---

### Task 1: Test harness

`main` has no test tooling — no vitest config, no `test` script in any workspace. Every later task in this plan is TDD, so nothing else can start until `npm test` runs.

Tests that touch the database run against a **real local Postgres**, per the spec. Pure functions are tested without one.

**Files:**

- Create: `vitest.config.ts` (repo root)
- Create: `packages/db/src/test-support.ts`
- Create: `packages/db/src/test-support.test.ts`
- Modify: `package.json` (root — add `test` script and devDependencies)
- Modify: `turbo.json` (add a `test` task)
- Modify: `.env.example` files to document `DATABASE_URL_TEST`

**Interfaces:**

- Consumes: nothing.
- Produces: `npm test` at the repo root; `resetTestDatabase(): Promise<void>` and `testPrisma: PrismaClient` from `@repo/db/test-support`, used by every database test in later tasks.

- [ ] **Step 1: Add the dependencies**

```bash
npm install -D vitest@^3.2.4 dotenv@^16.4.5
```

Run from the repo root with no `-w` flag — the root is not itself a workspace, so `-w .` fails with
"No workspaces found".

- [ ] **Step 2: Add the root test script**

In root `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create the vitest config**

Create `vitest.config.ts`:

```ts
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Database tests use DATABASE_URL_TEST so a stray run can never touch real data.
config({ path: ".env.test", quiet: true });

export default defineConfig({
  test: {
    include: ["{apps,packages,workers}/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/.next/**"],
    environment: "node",
    // Database tests share one Postgres instance; parallel files would race on truncation.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
```

- [ ] **Step 4: Add the turbo task**

In `turbo.json`, add to `"tasks"`:

```json
"test": {
  "dependsOn": ["^build"],
  "cache": false
}
```

- [ ] **Step 5: Write the failing test**

Create `packages/db/src/test-support.test.ts`:

```ts
import { beforeEach, expect, test } from "vitest";

import { resetTestDatabase, testPrisma } from "./test-support";

beforeEach(async () => {
  await resetTestDatabase();
});

test("resetTestDatabase leaves the admin table empty", async () => {
  await testPrisma.adminUser.create({
    data: { email: "a@rvcc.com", passwordHash: "x" },
  });
  await resetTestDatabase();
  expect(await testPrisma.adminUser.count()).toBe(0);
});
```

- [ ] **Step 6: Run it to confirm it fails**

Run: `npm test -- test-support`
Expected: FAIL — cannot resolve `./test-support`.

- [ ] **Step 7: Write the implementation**

Create `packages/db/src/test-support.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL_TEST;

if (!url) {
  throw new Error(
    "DATABASE_URL_TEST is not set. Point it at a local throwaway database — never at production."
  );
}

export const testPrisma = new PrismaClient({ datasources: { db: { url } } });

/**
 * Truncates every application table between tests.
 *
 * Table names come from the live catalogue rather than a hand-maintained list,
 * so a table added in a later migration is cleaned automatically instead of
 * leaking rows into the next test.
 */
export async function resetTestDatabase(): Promise<void> {
  const rows = await testPrisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT LIKE '_prisma%'
  `;
  if (rows.length === 0) return;

  const list = rows.map((r) => `"public"."${r.tablename}"`).join(", ");
  await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}
```

- [ ] **Step 8: Create your local test database and point at it**

```bash
printf '.env.test\n' >> .gitignore
git check-ignore .env.test   # must print .env.test before you write a URL into it

PGUSER=$(psql -d postgres -tAc "SELECT current_user")
createdb rvcc_main_test
printf 'DATABASE_URL_TEST="postgresql://%s@localhost:5432/rvcc_main_test"\n' "$PGUSER" > .env.test

DATABASE_URL="postgresql://$PGUSER@localhost:5432/rvcc_main_test" \
  npx prisma db push --schema=packages/db/prisma/schema.prisma --skip-generate --accept-data-loss
npx prisma generate --schema=packages/db/prisma/schema.prisma
```

Three things this gets right that the obvious version does not:

- **`.gitignore` does not already cover `.env.test`.** It lists `.env`, `.env.local`, and
  `*.env.local`, none of which match. Add it first — a committed database URL is a leak.
- **The database is `rvcc_main_test`, not `rvcc_test`.** A `rvcc_test` database already exists on
  this machine carrying the **`prod`-lineage** schema (`Agent`, `AgentOtp`, no `VendorUser`); it
  belongs to the agent-portal project's tests. Pushing `main`'s schema onto it would break that
  project.
- **The URL needs an explicit user.** `psql` falls back to the OS user, Prisma does not, and a
  userless URL fails with `P1010: User '' was denied access`.

- [ ] **Step 9: Run the test to confirm it passes**

Run: `npm test -- test-support`
Expected: PASS.

- [ ] **Step 10: Document the variable**

Add to `apps/admin/.env.example`, `apps/vendor/.env.example`, and `apps/web/.env.example`:

```
# Local throwaway database used by `npm test`. Never point this at production.
DATABASE_URL_TEST="postgresql://localhost:5432/rvcc_test"
```

- [ ] **Step 11: Commit**

```bash
git add vitest.config.ts package.json package-lock.json turbo.json packages/db/src/test-support.ts packages/db/src/test-support.test.ts apps/*/.env.example
git commit -m "test: add vitest harness with a real-Postgres reset helper"
```

---

### Task 2: Fix the stale-cookie redirect loop

A vendor whose session cookie exists but is no longer valid is locked out with `ERR_TOO_MANY_REDIRECTS` and cannot reach the login form to recover.

`apps/vendor/src/proxy.ts` sees a cookie on `/login` and redirects to the home path. `apps/vendor/src/app/(protected)/layout.tsx` then validates the session for real, finds it dead, and redirects back to `/login`. Neither clears the cookie, so they ping-pong forever.

The fix: when the authoritative check rejects a session, the cookie must be cleared before the
redirect.

**A layout cannot clear it itself.** Next.js only permits cookie writes in a Server Action or Route
Handler; calling `cookies().set()` in a layout throws _"Cookies can only be modified in a Server
Action or Route Handler"_ and returns a 500. So the layout redirects to `/login?expired=1`, and the
proxy — which runs on every request and may set cookies — clears it on seeing that marker. The
marker is what lets the proxy tell "signed in, go home" apart from "cookie is stale, drop it",
which it cannot determine on its own at the edge.

**Files:**

- Create: `apps/vendor/src/app/(protected)/session-expired.test.ts`
- Modify: `apps/vendor/src/app/(protected)/layout.tsx`
- Modify: `apps/vendor/src/lib/constants.ts` (add the clearing helper)

**Interfaces:**

- Consumes: `VENDOR_COOKIE`, `vendorCookieOptions()` from `@/lib/constants`.
- Produces: `expiredCookieOptions()` from `@/lib/constants` — cookie options with `maxAge: 0`, reused by the agent app in a later plan.

- [ ] **Step 1: Write the failing test**

Create `apps/vendor/src/app/(protected)/session-expired.test.ts`:

```ts
import { expect, test } from "vitest";

import { expiredCookieOptions, vendorCookieOptions } from "@/lib/constants";

test("expired options clear the cookie and match the live cookie's scope", () => {
  const live = vendorCookieOptions();
  const dead = expiredCookieOptions();

  // maxAge 0 is what actually removes it from the browser.
  expect(dead.maxAge).toBe(0);

  // A mismatched path or domain writes a second cookie instead of clearing the first.
  expect(dead.path).toBe(live.path);
  expect(dead.httpOnly).toBe(live.httpOnly);
  expect(dead.sameSite).toBe(live.sameSite);
  expect(dead.secure).toBe(live.secure);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- session-expired`
Expected: FAIL — `expiredCookieOptions` is not exported.

- [ ] **Step 3: Add the helper**

In `apps/vendor/src/lib/constants.ts`, below `vendorCookieOptions`:

```ts
/**
 * Options that delete the session cookie. Every field except maxAge must match
 * vendorCookieOptions() — a browser treats a differing path or domain as a
 * different cookie and leaves the original in place.
 */
export function expiredCookieOptions() {
  return { ...vendorCookieOptions(), maxAge: 0 };
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test -- session-expired`
Expected: PASS.

- [ ] **Step 5: Redirect to the expired-login path**

In `apps/vendor/src/app/(protected)/layout.tsx`, replace the rejection branch:

```tsx
import { VENDOR_LOGIN_EXPIRED_PATH } from "@/lib/constants";

if (!vendor) {
  // Redirect to the ?expired= form, which tells the proxy to drop the cookie.
  // A layout cannot clear it itself — Next only allows that in a Server Action
  // or Route Handler — and leaving it set makes the proxy bounce us back here
  // forever.
  redirect(VENDOR_LOGIN_EXPIRED_PATH);
}
```

- [ ] **Step 5b: Clear the cookie in the proxy**

In `apps/vendor/src/proxy.ts`, add the marker branch **before** the existing cookie-present check —
order matters, because the existing branch would otherwise redirect away first:

```ts
if (pathname === VENDOR_LOGIN_PATH) {
  // A server-side guard rejected the session and sent us here. Drop the dead
  // cookie and serve the login form; without this the branch below sees a
  // cookie, bounces to the home path, the guard rejects it again, and the two
  // redirect until the browser gives up with ERR_TOO_MANY_REDIRECTS.
  if (request.nextUrl.searchParams.has(VENDOR_SESSION_EXPIRED_PARAM)) {
    const res = NextResponse.next();
    res.cookies.set(VENDOR_COOKIE, "", expiredCookieOptions());
    return res;
  }
  if (request.cookies.get(VENDOR_COOKIE)?.value) {
    return NextResponse.redirect(new URL(VENDOR_HOME_PATH, request.url));
  }
  return NextResponse.next();
}
```

and add `VENDOR_SESSION_EXPIRED_PARAM` and `expiredCookieOptions` to the import from
`@/lib/constants`.

- [ ] **Step 6: Verify the loop is gone by hand**

```bash
npm run -w vendor dev
```

In another terminal:

```bash
curl -s -D- -o /dev/null -L --max-redirs 8 -b "rvcc_vendor_session=stale-invalid-token" \
  http://localhost:3002/login | grep -iE '^(HTTP|location|set-cookie)'
```

Expected, and confirmed on 2026-08-15:

```
307 → /                        (proxy sees a cookie)
307 → /login?expired=1         (layout rejects the dead session)
200    set-cookie: rvcc_vendor_session=; Max-Age=0
```

Two redirects, then the form, with the cookie cleared. Before the fix this alternates
`/login` ↔ `/` until the browser gives up.

Note: `VENDOR_API_URL` / `VENDOR_API_SECRET` are usually unset locally, which makes `/auth/me`
throw and every session read as invalid. That is convenient here — it is exactly the state being
tested — but it means this check does not also prove the success path.

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/vendor/src/lib/constants.ts "apps/vendor/src/app/(protected)/layout.tsx" "apps/vendor/src/app/(protected)/session-expired.test.ts"
git commit -m "fix(vendor): clear stale session cookie instead of looping to login"
```

---

### Task 3: Allow suppliers with no registration

`VendorUser.registrationId` is a required foreign key with `onDelete: Cascade`, so a supplier who never used the public wizard cannot exist, and deleting a registration silently deletes a working login.

`apps/vendor/src/lib/session.ts` compounds it: `if (!data?.id || !data?.registrationId) return null;` logs out any vendor without a registration. Both must change together, or admin-created vendors are created successfully and then cannot stay signed in.

**Files:**

- Modify: `packages/db/prisma/schema.prisma`
- Modify: `apps/vendor/src/lib/session.ts:47` (the `VendorIdentity` type) and the guard near line 61
- Create: `packages/db/src/vendor-registration.test.ts`

**Interfaces:**

- Consumes: `resetTestDatabase`, `testPrisma` from Task 1.
- Produces: a `VendorUser` row may have `registrationId: null`. `VendorIdentity.registrationId` becomes `string | null`. Later tasks rely on both.

- [ ] **Step 1: Write the failing test**

Create `packages/db/src/vendor-registration.test.ts`:

```ts
import { beforeEach, expect, test } from "vitest";

import { resetTestDatabase, testPrisma } from "./test-support";

beforeEach(async () => {
  await resetTestDatabase();
});

test("a vendor can exist without a supplier registration", async () => {
  const vendor = await testPrisma.vendorUser.create({
    data: { email: "direct@supplier.com", name: "Direct Supplier", passwordHash: "x" },
  });

  expect(vendor.registrationId).toBeNull();
});

test("deleting a registration keeps the vendor login alive", async () => {
  const registration = await testPrisma.supplierRegistration.create({
    data: { email: "reg@supplier.com" },
  });
  const vendor = await testPrisma.vendorUser.create({
    data: {
      email: "reg-login@supplier.com",
      passwordHash: "x",
      registrationId: registration.id,
    },
  });

  await testPrisma.supplierRegistration.delete({ where: { id: registration.id } });

  const after = await testPrisma.vendorUser.findUnique({ where: { id: vendor.id } });
  expect(after).not.toBeNull();
  expect(after?.registrationId).toBeNull();
});
```

Note: if `SupplierRegistration` requires fields beyond `email`, read `packages/db/prisma/schema.prisma` and add the minimum needed to satisfy it — do not make the field optional to suit the test.

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- vendor-registration`
Expected: FAIL — `registrationId` is required.

- [ ] **Step 3: Change the schema**

In `packages/db/prisma/schema.prisma`, in `model VendorUser`:

```prisma
  /// Null for accounts an admin created directly — most RVCC suppliers already
  /// exist as companies and never use the public registration wizard.
  registrationId String?
  registration   SupplierRegistration? @relation(fields: [registrationId], references: [id], onDelete: SetNull)
```

- [ ] **Step 4: Migrate and regenerate**

```bash
npm run -w @repo/db migrate -- --name vendor_registration_optional
npm run -w @repo/db generate
DATABASE_URL="$DATABASE_URL_TEST" npm run -w @repo/db push -- --skip-generate --accept-data-loss
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `npm test -- vendor-registration`
Expected: PASS, both tests.

- [ ] **Step 6: Stop the session guard rejecting these vendors**

In `apps/vendor/src/lib/session.ts`, widen the type:

```ts
export type VendorIdentity = {
  id: string;
  email: string;
  name: string;
  mustChangePassword: boolean;
  registrationId: string | null;
};
```

and fix the guard:

```ts
const data = (await res.json()) as VendorIdentity;
// registrationId is intentionally not checked: admin-created vendors have none.
if (!data?.id) return null;
```

- [ ] **Step 7: Confirm nothing else depends on a non-null registrationId**

Run: `grep -rn "registrationId" apps/vendor/src apps/admin/src workers/vendor-api/src workers/admin-api/src`

Every read must tolerate `null`. Where one does not, guard it. Report anything ambiguous rather than guessing.

- [ ] **Step 8: Typecheck and test**

Run: `npm run -w vendor build && npm test`
Expected: both succeed.

- [ ] **Step 9: Commit**

```bash
git add packages/db apps/vendor/src/lib/session.ts
git commit -m "feat(db): allow vendors created without a supplier registration"
```

---

### Task 4: Industry model

An industry categorises vendors and agents — _Civil Works_, _MEP_, _Landscaping_. Admins assign them at account creation and later use them to pre-select invitees.

**Files:**

- Modify: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/industry.test.ts`

**Interfaces:**

- Consumes: `resetTestDatabase`, `testPrisma` from Task 1.
- Produces: model `Industry { id, name, slug, isActive, vendors, agents }`, with implicit many-to-many `VendorUser.industries`. `Agent` does not exist on `main` yet; its side of the relation is added in the agent-portal plan, so **do not add `agents` to `Industry` in this task** — it would not compile.

- [ ] **Step 1: Write the failing test**

Create `packages/db/src/industry.test.ts`:

```ts
import { beforeEach, expect, test } from "vitest";

import { resetTestDatabase, testPrisma } from "./test-support";

beforeEach(async () => {
  await resetTestDatabase();
});

test("a vendor can belong to several industries", async () => {
  const vendor = await testPrisma.vendorUser.create({
    data: {
      email: "multi@supplier.com",
      passwordHash: "x",
      industries: {
        create: [
          { name: "Civil Works", slug: "civil-works" },
          { name: "MEP", slug: "mep" },
        ],
      },
    },
    include: { industries: true },
  });

  expect(vendor.industries.map((i) => i.slug).sort()).toEqual(["civil-works", "mep"]);
});

test("industry slugs are unique", async () => {
  await testPrisma.industry.create({ data: { name: "Civil Works", slug: "civil-works" } });

  await expect(
    testPrisma.industry.create({ data: { name: "Civil Work", slug: "civil-works" } })
  ).rejects.toThrow();
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- industry`
Expected: FAIL — `testPrisma.industry` is undefined.

- [ ] **Step 3: Add the model**

Append to `packages/db/prisma/schema.prisma`:

```prisma
/// A category of work a supplier or agent can be invited for, e.g. "Civil Works".
/// Plain rows rather than an enum so staff can add one without a migration and redeploy —
/// the same reasoning as JobPosting.department.
model Industry {
  id       String  @id @default(cuid())
  name     String  @unique
  slug     String  @unique
  isActive Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  vendors VendorUser[]

  @@index([isActive])
}
```

and add to `model VendorUser`:

```prisma
  industries Industry[]
```

- [ ] **Step 4: Migrate and regenerate**

```bash
npm run -w @repo/db migrate -- --name add_industry
npm run -w @repo/db generate
DATABASE_URL="$DATABASE_URL_TEST" npm run -w @repo/db push -- --skip-generate --accept-data-loss
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `npm test -- industry`
Expected: PASS, both tests.

- [ ] **Step 6: Commit**

```bash
git add packages/db
git commit -m "feat(db): add Industry and link it to vendors"
```

---

### Task 5: Create-vendor endpoint in the admin worker

The Worker owns database access and password hashing, so account creation belongs here. The generated temporary password is returned once and never stored in plaintext.

**Files:**

- Modify: `workers/admin-api/src/handlers.ts`
- Modify: `workers/admin-api/src/index.ts` (route registration)
- Create: `workers/admin-api/src/create-vendor.test.ts`

**Interfaces:**

- Consumes: `hashPassword`, `generateTempPassword`, `verifyPassword` from `./password`; `Sql`, `cuid` from `./db`; `requireAdmin`, `writeAudit`, `json`, `Env` as already imported in `handlers.ts`; the nullable `registrationId` from Task 3; the `Industry` table and its Prisma join table from Task 4.
- Produces: `POST /vendors` accepting `{ email, name, company?, phone?, industryIds?: string[] }` and returning `201 { ok: true, vendor: { id, email, name }, tempPassword }`. `normaliseVendorInput(input)` is exported for testing.

**This Worker does not use Prisma.** It queries Postgres directly with `postgres.js` tagged templates via `createSql(env)`. Follow `handleVendorResetPassword` in the same file as the reference implementation — it already does the generate-hash-store-audit sequence. The response field is `tempPassword`, matching that handler; do not invent a second name.

- [ ] **Step 1: Write the failing test**

Create `workers/admin-api/src/create-vendor.test.ts`:

```ts
import { expect, test } from "vitest";

import { normaliseVendorInput } from "./handlers";
import { hashPassword, verifyPassword } from "./password";

test("normalises email casing and whitespace", () => {
  const out = normaliseVendorInput({ email: "  New@Supplier.COM ", name: "  New Supplier  " });

  // Without this, "New@..." becomes a second account alongside "new@...".
  expect(out.email).toBe("new@supplier.com");
  expect(out.name).toBe("New Supplier");
});

test("rejects a missing email by naming the field", () => {
  expect(() => normaliseVendorInput({ email: "   ", name: "X" })).toThrow(/email/i);
});

test("rejects a missing name by naming the field", () => {
  expect(() => normaliseVendorInput({ email: "a@b.com", name: "  " })).toThrow(/name/i);
});

test("a generated temporary password verifies against its own hash", async () => {
  const { generateTempPassword } = await import("./password");
  const temp = generateTempPassword();

  expect(await verifyPassword(temp, await hashPassword(temp))).toBe(true);
});
```

These are pure-function tests and need no database. The end-to-end path — account created, industries attached, first login forced — is verified by hand in Task 6, Step 4.

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- create-vendor`
Expected: FAIL — `normaliseVendorInput` is not exported.

- [ ] **Step 3: Implement the validator**

In `workers/admin-api/src/handlers.ts`:

```ts
export type CreateVendorInput = {
  email: string;
  name: string;
  company?: string;
  phone?: string;
  industryIds?: string[];
};

/**
 * Trims and lower-cases the identifying fields, and rejects the empty cases by
 * name so the admin sees which field is wrong.
 *
 * Split out from the handler so these rules are testable without standing up a
 * Worker request or a database.
 */
export function normaliseVendorInput(input: CreateVendorInput) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  if (!email) throw new Error("An email is required.");
  if (!name) throw new Error("A name is required.");

  return {
    email,
    name,
    company: input.company?.trim() ?? "",
    phone: input.phone?.trim() ?? "",
    industryIds: input.industryIds ?? [],
  };
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test -- create-vendor`
Expected: PASS, all four tests.

- [ ] **Step 5: Write the handler**

Still in `handlers.ts`, following `handleVendorResetPassword` directly above it:

```ts
export async function handleVendorCreate(sql: Sql, env: Env, request: Request): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  let input: ReturnType<typeof normaliseVendorInput>;
  try {
    input = normaliseVendorInput((await request.json()) as CreateVendorInput);
  } catch (err) {
    return json(env, request, { error: (err as Error).message }, 400);
  }

  const [existing] = await sql`
    SELECT id FROM "VendorUser" WHERE email = ${input.email} LIMIT 1
  `;
  if (existing) {
    return json(env, request, { error: "An account already exists for that email." }, 409);
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const id = cuid();

  // registrationId is left NULL: this supplier never used the public wizard.
  await sql.begin(async (tx) => {
    await tx`
      INSERT INTO "VendorUser" (id, email, name, "passwordHash", "mustChangePassword", "updatedAt")
      VALUES (${id}, ${input.email}, ${input.name}, ${passwordHash}, true, NOW())
    `;

    for (const industryId of input.industryIds) {
      // Implicit m-n join table generated by Prisma for VendorUser <-> Industry.
      await tx`
        INSERT INTO "_IndustryToVendorUser" ("A", "B") VALUES (${industryId}, ${id})
        ON CONFLICT DO NOTHING
      `;
    }
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "vendor.created",
    entityType: "VendorUser",
    entityId: id,
    // Never the password.
    metadata: { email: input.email, industryIds: input.industryIds },
  });

  return json(
    env,
    request,
    { ok: true, vendor: { id, email: input.email, name: input.name }, tempPassword },
    201
  );
}
```

Before running this, confirm the join-table name and column order that Prisma generated:

```bash
psql "$DATABASE_URL_TEST" -c '\d "_IndustryToVendorUser"'
```

Prisma names implicit relation tables `_<ModelA>To<ModelB>` alphabetically, with `A` referencing the alphabetically-first model. If the real name or column order differs from the code above, use what the database reports — do not rename the table.

- [ ] **Step 6: Register the route**

In `workers/admin-api/src/index.ts`, add `handleVendorCreate` to the import list from `./handlers`, and register it beside the existing `/vendors` routes:

```ts
if (path === "/vendors" && request.method === "POST") {
  return await handleVendorCreate(sql, env, request);
}
```

- [ ] **Step 7: Verify the duplicate-email path**

Run the Worker locally and POST the same email twice.
Expected: first `201`, second `409` with the message above — not a 500 and not a second account.

- [ ] **Step 8: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add workers/admin-api/src
git commit -m "feat(admin-api): create vendor accounts with a one-time temporary password"
```

---

### Task 6: Admin create-vendor screen

The BFF route forwards to the Worker; the screen shows the temporary password once, with a clear warning that it will not be shown again.

**Files:**

- Create: `apps/admin/src/app/api/vendors/route.ts`
- Create: `apps/admin/src/sections/CreateVendorForm.tsx`
- Modify: `apps/admin/src/app/(protected)/vendors/page.tsx`

**Interfaces:**

- Consumes: `POST /vendors` from Task 5; `adminWorkerFetch`, `ADMIN_COOKIE` from `@/lib/*`.
- Produces: a `POST /api/vendors` BFF route and the `<CreateVendorForm />` client component.

- [ ] **Step 1: Add the BFF route**

Create `apps/admin/src/app/api/vendors/route.ts`, following `api/vendors/[id]/reset-password/route.ts` exactly — same cookie read, same pass-through of status and body, same 503 on upstream failure:

```ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const res = await adminWorkerFetch("/vendors", {
      method: "POST",
      sessionToken: token,
      body: await request.text(),
      headers: { "Content-Type": "application/json" },
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (err) {
    console.error("[admin BFF create vendor]", err);
    return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
  }
}
```

Check `adminWorkerFetch`'s signature first; if it does not accept `body`/`headers`, extend it rather than calling `fetch` directly here.

- [ ] **Step 2: Build the form**

Create `apps/admin/src/sections/CreateVendorForm.tsx`:

```tsx
"use client";

import { useState } from "react";

type Industry = { id: string; name: string };
type Created = { email: string; tempPassword: string };

export function CreateVendorForm({ industries }: { industries: Industry[] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        name: form.get("name"),
        company: form.get("company"),
        phone: form.get("phone"),
        industryIds: form.getAll("industryIds"),
      }),
    });

    const body = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setError(body.error ?? "Could not create the account.");
      return;
    }
    setCreated({ email: body.vendor.email, tempPassword: body.tempPassword });
  }

  if (created) {
    return (
      <div className="rounded-md border border-zinc-200 p-4">
        <p className="text-sm font-semibold text-zinc-950">Account created for {created.email}</p>
        <p className="mt-1 text-sm text-amber-700">
          This password is shown once. Copy it now — you cannot see it again.
        </p>
        <code className="mt-3 block rounded bg-zinc-100 px-3 py-2 font-mono text-sm">
          {created.tempPassword}
        </code>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(created.tempPassword)}
            className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white"
          >
            Copy password
          </button>
          <button
            type="button"
            onClick={() => setCreated(null)}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
          >
            Add another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className="w-full rounded border px-3 py-2"
      />
      <input
        name="name"
        required
        placeholder="Contact name"
        className="w-full rounded border px-3 py-2"
      />
      <input name="company" placeholder="Company" className="w-full rounded border px-3 py-2" />
      <input name="phone" placeholder="Phone" className="w-full rounded border px-3 py-2" />

      <fieldset>
        <legend className="text-sm font-medium">Industries</legend>
        {industries.map((industry) => (
          <label key={industry.id} className="mr-4 inline-flex items-center gap-1.5 text-sm">
            <input type="checkbox" name="industryIds" value={industry.id} />
            {industry.name}
          </label>
        ))}
      </fieldset>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {/* Disabled while in flight so a double-click cannot create two accounts. */}
      <button
        type="submit"
        disabled={busy}
        className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
```

Match the surrounding Tailwind conventions in `apps/admin/src/sections/` — if that directory uses shared UI primitives from `@repo/ui`, use them instead of the raw elements above.

- [ ] **Step 3: Mount it on the vendors page**

In `apps/admin/src/app/(protected)/vendors/page.tsx`, load active industries server-side and render `<CreateVendorForm industries={industries} />` above the existing list. The page stays a Server Component; only the form is a client component.

- [ ] **Step 4: Verify the whole path by hand**

```bash
npm run -w admin dev
```

Create a vendor, copy the temporary password, then:

```bash
npm run -w vendor dev
```

Sign in at `http://localhost:3002/login` with that email and password.
Expected: redirected to `/password`, set a new password, land on the portal. This is the acceptance test for Tasks 3, 5, and 6 together — an admin-created supplier with no registration completing first login.

- [ ] **Step 5: Confirm the temporary password is not logged**

Run: `grep -rn "tempPassword" apps/admin/src workers/admin-api/src`

Every hit must be a response body or React state. Any `console.log` of it is a defect — remove it.

- [ ] **Step 6: Run the full suite and lint**

Run: `npm test && npm run lint`
Expected: both pass.

- [ ] **Step 7: Commit**

```bash
git add apps/admin/src
git commit -m "feat(admin): create supplier accounts with industries from the admin portal"
```

---

## Changes made during execution that the plan did not anticipate

Recorded so the follow-on plans start from what is actually true.

1. **The same redirect loop existed in `apps/admin`** and was fixed identically
   (`ADMIN_LOGIN_EXPIRED_PATH`, proxy clears the cookie). Task 2 covered only `apps/vendor`;
   the admin loop blocked the Task 6 acceptance test. Any new portal app must ship this from
   the start.
2. **Five call sites assumed a vendor always has a registration** (Task 3, Step 7). The
   consequential one: `handleVendorsList` used `JOIN "SupplierRegistration"`, which would have
   hidden every admin-created vendor from the admin list. Now a `LEFT JOIN`, with
   `registration: null` in the response and an "Added by RVCC" cell.
3. **`normaliseVendorInput` lives in its own module** (`workers/admin-api/src/vendor-input.ts`),
   not in `handlers.ts`. `workers/*` are not npm workspaces, so a test importing `handlers.ts`
   cannot resolve `postgres`. Keeping the pure validation dependency-free makes it testable from
   the repo root.
4. **The project uses `prisma db push`, not migrations** — there is no `migrations/` directory.
   The plan's `migrate --name` would have introduced one and changed the convention.
5. **`npm run lint` was already broken on `main`** for three unrelated reasons (`.next` not
   ignored outside the root, Node scripts linted with browser globals, and a vendored minified
   `pdf.worker.min.mjs` under `public/`). Fixed; repo-wide problems went 1760 → 50.

Still outstanding and deliberately not fixed: **14 React-hooks errors in `apps/web`**
("Calling setState synchronously within an effect") in `FlipbookReader`, `EnquireContext`, and the
enquire steps. No file under `apps/web/src` is touched by this work, so they predate it. Fixing
them is its own task with real regression risk on the live enquiry flow.

Also worth a decision: `handleRegistrationReview` **emails a temporary password** via
`notifyDecision`, which contradicts the spec's rule that a temporary password is never emailed.
The admin-create path added here does not email it. The two paths should agree.

## What this plan deliberately leaves out

Handled by the follow-on plans, in this order:

1. **Agent portal** — `Agent`/`AgentOtp`/`AgentSession` in `packages/db`, `workers/agent-api`, `apps/agent` with OTP login, `Industry.agents`, and the same cookie-clearing fix from Task 2.
2. **Requirements and quotes** — `Requirement`, `RequirementAttachment`, `RequirementInvite`, `Quote`, `QuoteAttachment`, the admin post screen, the participant quote form, invite email, and the sealed-bidding tests.
3. **Award, notifications, KPIs** — awarding, `Notification` and the bell, and the KPI dashboard.

An industry-management screen (`/industries`) is also outstanding; until it exists, industries are seeded directly in the database.

## Self-review notes

- **Spec coverage:** this plan implements the spec's _Admin-created accounts_ section, the `VendorUser.registrationId` change under _Changed on an existing model_, the `Industry` model, the `vendor.created` audit action, and the stale-cookie rule from _Error handling_. Everything else in the spec is explicitly assigned above.
- **Ordering:** Task 3 must precede Task 5 — creating a vendor without a registration fails until the column is nullable. Task 4 must precede Task 5 for the same reason regarding `industryIds`.
- **Known gap carried forward:** `Industry.agents` cannot be added until `Agent` exists, and is called out in Task 4 so the follow-on plan does not treat it as an oversight.
