# Requirements and Quotes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An admin posts a requirement with a closing time and an invite list; invited suppliers and agents each submit a price and remarks in their own portal without seeing anyone else's; the admin compares every submitted quote in one ranked table.

**Architecture:** Follows `main`'s backend-for-frontend split. `workers/admin-api` owns admin writes, `workers/vendor-api` and `workers/agent-api` own participant reads and writes, all in raw `postgres.js`. A new `packages/rfq` holds the one rule that makes bidding sealed, so it exists in exactly one place. The Next apps stay thin.

**Tech Stack:** TypeScript, Next.js 16.2.4 (App Router, React 19), Prisma 5.22 + PostgreSQL, Cloudflare Workers, Tailwind 4, Vitest 3, npm workspaces + Turborepo.

**Spec:** `docs/superpowers/specs/2026-08-15-requirement-quote-workflow-design.md`

**Predecessors:** Plans 1 and 2 (`2026-08-15-foundation-and-accounts.md`, `2026-08-15-agent-portal.md`). Their "Changes made during execution" sections record conventions this plan assumes.

## Global Constraints

- **Base branch:** `feat/foundation-and-accounts`, continuing from Plan 2.
- **Unresolved and deliberately not forced by this plan:** which lineage owns the production database. Every migration step targets the **local** `rvcc_main_test` database only. This plan adds five tables and one check constraint; do not run any of it against production until ownership is settled.
- **This project uses `prisma db push`, not migrations.**
- **Prisma cannot express CHECK constraints**, and `db push` will not create them. Task 1 adds an idempotent `constraints.sql` applied by its own script, and the invariant is additionally enforced in application code and covered by a test. Belt and braces, because the constraint is what makes a malformed quote unrepresentable.
- **Money is `Decimal(14,2)`, never `Float`.** Floating point loses precision on currency.
- **`sellingPrice` is admin-only.** Participant queries must use an explicit column list that omits it — never `SELECT *` then filter in the UI.
- **The sealed-bidding rule:** every participant query filters by the id returned from the session, never from a URL parameter or request body.
- **`workers/*` are not npm workspaces.** Pure logic goes in its own module so root-level tests can import it without resolving `postgres`.
- **Wrangler requires Node ≥ 22:** `export PATH="$HOME/.nvm/versions/node/v24.14.0/bin:$PATH"`.
- **New env vars must be added to `turbo.json` `globalEnv`**, or `turbo/no-undeclared-env-vars` fails the lint.
- **Ports:** web 3000, admin 3001, vendor 3002, agent 3003; workers admin-api 8788, vendor-api 8789, agent-api 8790.
- Commit after every task. Never `git commit --no-verify`.

---

### Task 1: Requirement and invite models

The polymorphic participant is two nullable foreign keys with a check that exactly one is set. Postgres allows multiple NULLs in a unique index, so the two unique constraints prevent duplicate invites within each audience independently.

**Files:**

- Modify: `packages/db/prisma/schema.prisma`
- Create: `packages/db/prisma/constraints.sql`
- Modify: `packages/db/package.json` (add the `constraints` script)
- Create: `packages/db/src/requirement.test.ts`

**Interfaces:**

- Consumes: `resetTestDatabase`, `testPrisma` from `packages/db/src/test-support.ts`.
- Produces: `Requirement`, `RequirementInvite` tables; `npm run -w @repo/db constraints`.

- [ ] **Step 1: Write the failing test**

Create `packages/db/src/requirement.test.ts`:

```ts
import { beforeEach, expect, test } from "vitest";

import { resetTestDatabase, testPrisma } from "./test-support";

beforeEach(async () => {
  await resetTestDatabase();
});

async function anAdmin() {
  return testPrisma.adminUser.create({
    data: { email: `admin-${Date.now()}@rvcc.com`, passwordHash: "x" },
  });
}

test("a requirement stores money as Decimal, not float", async () => {
  const admin = await anAdmin();
  const requirement = await testPrisma.requirement.create({
    data: {
      scopeOfWork: "Retaining wall",
      project: "Riyadh Plot 12",
      sellingPrice: "1234567.89",
      closesAt: new Date(Date.now() + 86_400_000),
      createdByAdminId: admin.id,
    },
  });

  // A float would come back as 1234567.8899999999.
  expect(requirement.sellingPrice?.toString()).toBe("1234567.89");
});

test("an invite may name an agent or a vendor, but not both", async () => {
  const admin = await anAdmin();
  const requirement = await testPrisma.requirement.create({
    data: {
      scopeOfWork: "S",
      project: "P",
      closesAt: new Date(Date.now() + 86_400_000),
      createdByAdminId: admin.id,
    },
  });
  const agent = await testPrisma.agent.create({ data: { email: "a@field.com" } });
  const vendor = await testPrisma.vendorUser.create({
    data: { email: "v@supplier.com", passwordHash: "x" },
  });

  await testPrisma.requirementInvite.create({
    data: { requirementId: requirement.id, agentId: agent.id },
  });

  await expect(
    testPrisma.requirementInvite.create({
      data: { requirementId: requirement.id, agentId: agent.id, vendorUserId: vendor.id },
    })
  ).rejects.toThrow();

  await expect(
    testPrisma.requirementInvite.create({ data: { requirementId: requirement.id } })
  ).rejects.toThrow();
});

test("the same agent cannot be invited twice, but a vendor still can be", async () => {
  const admin = await anAdmin();
  const requirement = await testPrisma.requirement.create({
    data: {
      scopeOfWork: "S",
      project: "P",
      closesAt: new Date(Date.now() + 86_400_000),
      createdByAdminId: admin.id,
    },
  });
  const agent = await testPrisma.agent.create({ data: { email: "dup@field.com" } });
  const vendor = await testPrisma.vendorUser.create({
    data: { email: "dup@supplier.com", passwordHash: "x" },
  });

  await testPrisma.requirementInvite.create({
    data: { requirementId: requirement.id, agentId: agent.id },
  });

  await expect(
    testPrisma.requirementInvite.create({
      data: { requirementId: requirement.id, agentId: agent.id },
    })
  ).rejects.toThrow();

  // NULLs do not collide in a unique index, so the vendor side is unaffected.
  const ok = await testPrisma.requirementInvite.create({
    data: { requirementId: requirement.id, vendorUserId: vendor.id },
  });
  expect(ok.vendorUserId).toBe(vendor.id);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- requirement`
Expected: FAIL — `testPrisma.requirement` is undefined.

- [ ] **Step 3: Add the models**

Append to `packages/db/prisma/schema.prisma`:

```prisma
enum RequirementStatus {
  DRAFT
  OPEN
  CANCELLED
  AWARDED
}

enum InviteEmailStatus {
  PENDING
  SENT
  FAILED
}

/// Work put out to quote. Closed is not a status: it means closesAt < now(),
/// and storing it as well would let the flag and the clock disagree.
/// CANCELLED and AWARDED are stored because the clock cannot express them.
model Requirement {
  id              String  @id @default(cuid())
  referenceNumber String? @unique

  scopeOfWork String
  project     String
  /// Admin reference only — never selected by a participant query.
  sellingPrice Decimal? @db.Decimal(14, 2)
  currency     String   @default("SAR")

  closesAt DateTime
  status   RequirementStatus @default(DRAFT)

  createdByAdminId String
  createdByAdmin   AdminUser @relation("RequirementAuthor", fields: [createdByAdminId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  invites RequirementInvite[]
  quotes  Quote[]

  @@index([status, closesAt])
}

/// Exactly one of agentId / vendorUserId is set — enforced by a CHECK in
/// prisma/constraints.sql, which Prisma itself cannot express.
model RequirementInvite {
  id            String      @id @default(cuid())
  requirementId String
  requirement   Requirement @relation(fields: [requirementId], references: [id], onDelete: Cascade)

  agentId String?
  agent   Agent?  @relation(fields: [agentId], references: [id], onDelete: Cascade)

  vendorUserId String?
  vendorUser   VendorUser? @relation(fields: [vendorUserId], references: [id], onDelete: Cascade)

  emailStatus InviteEmailStatus @default(PENDING)
  emailError  String?
  emailedAt   DateTime?

  createdAt DateTime @default(now())

  @@unique([requirementId, agentId])
  @@unique([requirementId, vendorUserId])
  @@index([agentId])
  @@index([vendorUserId])
}
```

and add the back-relations:

```prisma
// on model AdminUser
  requirements Requirement[] @relation("RequirementAuthor")

// on model Agent
  invites RequirementInvite[]

// on model VendorUser
  invites RequirementInvite[]
```

- [ ] **Step 4: Write the constraints file**

Create `packages/db/prisma/constraints.sql`:

```sql
-- Constraints Prisma cannot express. Idempotent: safe to run after every
-- `prisma db push`, which does not create or preserve these itself.

-- Exactly one participant per invite. Without this, a row naming both an agent
-- and a vendor — or neither — is representable, and every consumer downstream
-- has to defend against it.
ALTER TABLE "RequirementInvite" DROP CONSTRAINT IF EXISTS "RequirementInvite_one_participant";
ALTER TABLE "RequirementInvite" ADD CONSTRAINT "RequirementInvite_one_participant"
  CHECK ((("agentId" IS NOT NULL)::int + ("vendorUserId" IS NOT NULL)::int) = 1);
```

- [ ] **Step 5: Add the script**

In `packages/db/package.json`, add to `"scripts"`:

```json
"constraints": "psql \"$DATABASE_URL\" -v ON_ERROR_STOP=1 -f prisma/constraints.sql"
```

- [ ] **Step 6: Push, generate, and apply constraints**

```bash
export $(grep DATABASE_URL_TEST .env.test | xargs)
DATABASE_URL="$DATABASE_URL_TEST" npx prisma db push \
  --schema=packages/db/prisma/schema.prisma --skip-generate --accept-data-loss
npx prisma generate --schema=packages/db/prisma/schema.prisma
DATABASE_URL="$DATABASE_URL_TEST" npm run -w @repo/db constraints
```

The constraints step must run **after** every push, or the check silently disappears.

- [ ] **Step 7: Run the test to confirm it passes**

Run: `npm test -- requirement`
Expected: PASS, all three tests.

- [ ] **Step 8: Commit**

```bash
git add packages/db
git commit -m "feat(db): add Requirement and RequirementInvite with a one-participant check"
```

---

### Task 2: Quote model

Same participant shape as the invite. A `SUBMITTED` quote with no price must not be representable.

**Files:**

- Modify: `packages/db/prisma/schema.prisma`, `packages/db/prisma/constraints.sql`
- Create: `packages/db/src/quote.test.ts`

**Interfaces:**

- Consumes: `Requirement` from Task 1.
- Produces: the `Quote` table and two more check constraints.

- [ ] **Step 1: Write the failing test**

Create `packages/db/src/quote.test.ts`:

```ts
import { beforeEach, expect, test } from "vitest";

import { resetTestDatabase, testPrisma } from "./test-support";

beforeEach(async () => {
  await resetTestDatabase();
});

async function aRequirement() {
  const admin = await testPrisma.adminUser.create({
    data: { email: `admin-${Date.now()}@rvcc.com`, passwordHash: "x" },
  });
  return testPrisma.requirement.create({
    data: {
      scopeOfWork: "S",
      project: "P",
      closesAt: new Date(Date.now() + 86_400_000),
      createdByAdminId: admin.id,
      status: "OPEN",
    },
  });
}

test("a submitted quote must carry a positive price", async () => {
  const requirement = await aRequirement();
  const agent = await testPrisma.agent.create({ data: { email: "a@field.com" } });

  await expect(
    testPrisma.quote.create({
      data: { requirementId: requirement.id, agentId: agent.id, status: "SUBMITTED" },
    })
  ).rejects.toThrow();

  await expect(
    testPrisma.quote.create({
      data: {
        requirementId: requirement.id,
        agentId: agent.id,
        status: "SUBMITTED",
        newPrice: "0",
      },
    })
  ).rejects.toThrow();
});

test("a draft quote may have no price yet", async () => {
  const requirement = await aRequirement();
  const agent = await testPrisma.agent.create({ data: { email: "draft@field.com" } });

  const quote = await testPrisma.quote.create({
    data: { requirementId: requirement.id, agentId: agent.id },
  });

  expect(quote.status).toBe("DRAFT");
  expect(quote.newPrice).toBeNull();
});

test("one quote per participant per requirement", async () => {
  const requirement = await aRequirement();
  const agent = await testPrisma.agent.create({ data: { email: "one@field.com" } });

  await testPrisma.quote.create({ data: { requirementId: requirement.id, agentId: agent.id } });

  // The unique constraint is what makes a double-clicked submit an upsert
  // rather than two competing quotes.
  await expect(
    testPrisma.quote.create({ data: { requirementId: requirement.id, agentId: agent.id } })
  ).rejects.toThrow();
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- quote`
Expected: FAIL — `testPrisma.quote` is undefined.

- [ ] **Step 3: Add the model**

Append to `packages/db/prisma/schema.prisma`:

```prisma
enum QuoteStatus {
  DRAFT
  SUBMITTED
}

/// One participant's price for one requirement. Rank is never stored: it is
/// computed when the admin opens the comparison, because a stored rank goes
/// stale the moment someone edits their price.
model Quote {
  id            String      @id @default(cuid())
  requirementId String
  requirement   Requirement @relation(fields: [requirementId], references: [id], onDelete: Cascade)

  agentId String?
  agent   Agent?  @relation(fields: [agentId], references: [id], onDelete: Cascade)

  vendorUserId String?
  vendorUser   VendorUser? @relation(fields: [vendorUserId], references: [id], onDelete: Cascade)

  newPrice Decimal? @db.Decimal(14, 2)
  remarks  String   @default("")

  status      QuoteStatus @default(DRAFT)
  submittedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([requirementId, agentId])
  @@unique([requirementId, vendorUserId])
  @@index([requirementId, status])
}
```

and add `quotes Quote[]` to both `Agent` and `VendorUser`.

- [ ] **Step 4: Add the constraints**

Append to `packages/db/prisma/constraints.sql`:

```sql
ALTER TABLE "Quote" DROP CONSTRAINT IF EXISTS "Quote_one_participant";
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_one_participant"
  CHECK ((("agentId" IS NOT NULL)::int + ("vendorUserId" IS NOT NULL)::int) = 1);

-- A submitted quote without a positive price is not a quote. Enforcing it here
-- means no code path can create one, however the submit endpoint changes later.
ALTER TABLE "Quote" DROP CONSTRAINT IF EXISTS "Quote_submitted_needs_price";
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_submitted_needs_price"
  CHECK (status <> 'SUBMITTED' OR ("newPrice" IS NOT NULL AND "newPrice" > 0));
```

- [ ] **Step 5: Push, generate, apply constraints, and test**

```bash
export $(grep DATABASE_URL_TEST .env.test | xargs)
DATABASE_URL="$DATABASE_URL_TEST" npx prisma db push \
  --schema=packages/db/prisma/schema.prisma --skip-generate --accept-data-loss
npx prisma generate --schema=packages/db/prisma/schema.prisma
DATABASE_URL="$DATABASE_URL_TEST" npm run -w @repo/db constraints
npm test -- quote
```

Expected: PASS, all three tests.

- [ ] **Step 6: Commit**

```bash
git add packages/db
git commit -m "feat(db): add Quote with submitted-needs-price constraint"
```

---

### Task 3: The ranking rule and the participant type

Two pieces of pure logic that several places depend on, kept in one importable module with no database dependency.

**Files:**

- Create: `packages/rfq/package.json`, `packages/rfq/src/index.ts`, `packages/rfq/src/rank.ts`, `packages/rfq/src/rank.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `type Participant = { kind: "AGENT" | "SUPPLIER"; id: string }`, and `rankQuotes<T extends { newPrice: string | number }>(quotes: T[]): Array<T & { rank: number }>`.

- [ ] **Step 1: Create the package**

`packages/rfq/package.json`:

```json
{
  "name": "@repo/rfq",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "lint": "eslint" },
  "devDependencies": { "typescript": "^5" }
}
```

Then `npm install` from the repo root to link the workspace.

- [ ] **Step 2: Write the failing test**

Create `packages/rfq/src/rank.test.ts`:

```ts
import { expect, test } from "vitest";

import { rankQuotes } from "./rank";

test("lowest price ranks first", () => {
  const ranked = rankQuotes([
    { id: "a", newPrice: "100" },
    { id: "b", newPrice: "80" },
    { id: "c", newPrice: "120" },
  ]);

  expect(ranked.map((q) => [q.id, q.rank])).toEqual([
    ["b", 1],
    ["a", 2],
    ["c", 3],
  ]);
});

test("equal prices share a rank, and the next rank skips", () => {
  const ranked = rankQuotes([
    { id: "a", newPrice: "80" },
    { id: "b", newPrice: "80" },
    { id: "c", newPrice: "90" },
  ]);

  // Standard competition ranking: two firsts, then third. Awarding 1, 1, 2
  // would imply the third bidder beat someone.
  expect(ranked.map((q) => q.rank)).toEqual([1, 1, 3]);
});

test("compares decimals numerically, not as strings", () => {
  const ranked = rankQuotes([
    { id: "a", newPrice: "9" },
    { id: "b", newPrice: "100" },
  ]);

  // String comparison would put "100" before "9".
  expect(ranked[0].id).toBe("a");
});

test("keeps precision that a float would lose", () => {
  const ranked = rankQuotes([
    { id: "a", newPrice: "1234567.89" },
    { id: "b", newPrice: "1234567.88" },
  ]);

  expect(ranked[0].id).toBe("b");
  expect(ranked[0].newPrice).toBe("1234567.88");
});

test("an empty list ranks to an empty list", () => {
  expect(rankQuotes([])).toEqual([]);
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npm test -- rank`
Expected: FAIL — cannot resolve `./rank`.

- [ ] **Step 4: Write the implementation**

Create `packages/rfq/src/rank.ts`:

```ts
/**
 * Standard competition ranking over price, ascending.
 *
 * Never stored: a stored rank goes stale the moment a participant edits their
 * price before the deadline.
 *
 * Prices arrive as strings from Postgres NUMERIC. They are compared as numbers
 * — string order would put "100" before "9" — but the original string is
 * returned untouched so no precision is lost on the way to the screen.
 */
export function rankQuotes<T extends { newPrice: string | number }>(
  quotes: T[]
): Array<T & { rank: number }> {
  const sorted = [...quotes].sort((a, b) => Number(a.newPrice) - Number(b.newPrice));

  let lastPrice: number | null = null;
  let lastRank = 0;

  return sorted.map((quote, index) => {
    const price = Number(quote.newPrice);
    // Ties share a rank; the rank after a tie skips, so two firsts are
    // followed by third rather than second.
    const rank = lastPrice !== null && price === lastPrice ? lastRank : index + 1;
    lastPrice = price;
    lastRank = rank;
    return { ...quote, rank };
  });
}
```

Create `packages/rfq/src/index.ts`:

```ts
export { rankQuotes } from "./rank";

/**
 * Whoever is authenticated in a participant portal.
 *
 * The sealed-bidding rule: every participant query filters by the id in this
 * value, taken from the session — never from a URL parameter or request body.
 * Written that way, one participant cannot load another's quote by guessing an
 * id. A UI that merely hides it is not enforcement.
 */
export type Participant = { kind: "AGENT" | "SUPPLIER"; id: string };
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `npm test -- rank`
Expected: PASS, all five tests.

- [ ] **Step 6: Commit**

```bash
git add packages/rfq package.json package-lock.json
git commit -m "feat(rfq): add shared ranking rule and participant type"
```

---

### Task 4: Admin posts a requirement

**Files:**

- Create: `workers/admin-api/src/requirement-input.ts`, `src/requirement-input.test.ts`
- Modify: `workers/admin-api/src/handlers.ts`, `src/index.ts`
- Create: `apps/admin/src/app/api/requirements/route.ts`
- Create: `apps/admin/src/app/(protected)/requirements/page.tsx`, `apps/admin/src/sections/CreateRequirementForm.tsx`
- Modify: `apps/admin/src/sections/AdminChrome.tsx` (nav link)

**Interfaces:**

- Consumes: `requireAdmin`, `writeAudit`, `json`, `cuid`, `readJson` from the admin Worker.
- Produces: `POST /requirements`, `GET /requirements`; `normaliseRequirementInput(input)` and `makeReferenceNumber(now)`.

- [ ] **Step 1: Write the failing test**

Create `workers/admin-api/src/requirement-input.test.ts`:

```ts
import { expect, test } from "vitest";

import { makeReferenceNumber, normaliseRequirementInput } from "./requirement-input";

const future = new Date(Date.now() + 86_400_000).toISOString();

test("trims text and keeps the price as a string", () => {
  const out = normaliseRequirementInput({
    scopeOfWork: "  Retaining wall  ",
    project: "  Riyadh Plot 12 ",
    sellingPrice: "1234567.89",
    closesAt: future,
    participants: [],
  });

  expect(out.scopeOfWork).toBe("Retaining wall");
  expect(out.project).toBe("Riyadh Plot 12");
  // Kept as a string so NUMERIC precision survives the trip to Postgres.
  expect(out.sellingPrice).toBe("1234567.89");
});

test("rejects a missing scope or project by naming the field", () => {
  const base = { project: "P", closesAt: future, participants: [] };
  expect(() => normaliseRequirementInput({ ...base, scopeOfWork: "  " })).toThrow(/scope/i);
  expect(() =>
    normaliseRequirementInput({
      scopeOfWork: "S",
      project: " ",
      closesAt: future,
      participants: [],
    })
  ).toThrow(/project/i);
});

test("rejects a closing time in the past", () => {
  expect(() =>
    normaliseRequirementInput({
      scopeOfWork: "S",
      project: "P",
      closesAt: new Date(Date.now() - 1000).toISOString(),
      participants: [],
    })
  ).toThrow(/future/i);
});

test("a missing selling price is allowed", () => {
  const out = normaliseRequirementInput({
    scopeOfWork: "S",
    project: "P",
    closesAt: future,
    participants: [],
  });

  expect(out.sellingPrice).toBeNull();
});

test("splits participants into the two id lists", () => {
  const out = normaliseRequirementInput({
    scopeOfWork: "S",
    project: "P",
    closesAt: future,
    participants: [
      { kind: "AGENT", id: "ag1" },
      { kind: "SUPPLIER", id: "vu1" },
      { kind: "AGENT", id: "ag2" },
    ],
  });

  expect(out.agentIds).toEqual(["ag1", "ag2"]);
  expect(out.vendorUserIds).toEqual(["vu1"]);
});

test("reference numbers follow REQ-YYYYMMDD-NNNN", () => {
  expect(makeReferenceNumber(new Date("2026-09-05T10:00:00Z"), 7)).toBe("REQ-20260905-0007");
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- requirement-input`
Expected: FAIL — cannot resolve `./requirement-input`.

- [ ] **Step 3: Write the validator**

Create `workers/admin-api/src/requirement-input.ts`:

```ts
export type ParticipantRef = { kind: "AGENT" | "SUPPLIER"; id: string };

export type CreateRequirementInput = {
  scopeOfWork: string;
  project: string;
  sellingPrice?: string | null;
  currency?: string;
  closesAt: string;
  participants: ParticipantRef[];
};

/**
 * Kept free of database and Worker imports so it is testable from the repo root
 * — workers/ are not npm workspaces and cannot resolve `postgres` there.
 */
export function normaliseRequirementInput(input: CreateRequirementInput) {
  const scopeOfWork = String(input?.scopeOfWork ?? "").trim();
  const project = String(input?.project ?? "").trim();

  if (!scopeOfWork) throw new Error("A scope of work is required.");
  if (!project) throw new Error("A project is required.");

  const closesAt = new Date(input?.closesAt ?? "");
  if (Number.isNaN(closesAt.getTime())) throw new Error("A valid closing time is required.");
  if (closesAt.getTime() <= Date.now()) throw new Error("The closing time must be in the future.");

  // Left as a string: converting to a JS number here would undo the whole point
  // of storing money as NUMERIC.
  const raw = input.sellingPrice == null ? "" : String(input.sellingPrice).trim();
  if (raw && !/^\d+(\.\d{1,2})?$/.test(raw)) {
    throw new Error("The selling price must be a number with at most two decimals.");
  }

  const participants = Array.isArray(input.participants) ? input.participants : [];

  return {
    scopeOfWork,
    project,
    sellingPrice: raw || null,
    currency: String(input.currency ?? "SAR").trim() || "SAR",
    closesAt,
    agentIds: participants.filter((p) => p?.kind === "AGENT").map((p) => p.id),
    vendorUserIds: participants.filter((p) => p?.kind === "SUPPLIER").map((p) => p.id),
  };
}

/** REQ-YYYYMMDD-NNNN, matching makeReferenceNumber in workers/enquire-api. */
export function makeReferenceNumber(now: Date, sequence: number): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `REQ-${y}${m}${d}-${String(sequence).padStart(4, "0")}`;
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test -- requirement-input`
Expected: PASS, all six tests.

- [ ] **Step 5: Write the handlers**

In `workers/admin-api/src/handlers.ts`:

```ts
export async function handleRequirementsList(
  sql: Sql,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const rows = await sql`
    SELECT
      r.id, r."referenceNumber", r."scopeOfWork", r.project, r."sellingPrice",
      r.currency, r."closesAt", r.status, r."createdAt",
      (SELECT COUNT(*)::int FROM "RequirementInvite" i WHERE i."requirementId" = r.id) AS invited,
      (SELECT COUNT(*)::int FROM "Quote" q
        WHERE q."requirementId" = r.id AND q.status = 'SUBMITTED') AS submitted
    FROM "Requirement" r
    ORDER BY
      CASE WHEN r.status = 'OPEN' AND r."closesAt" > NOW() THEN 0 ELSE 1 END,
      r."closesAt" ASC
    LIMIT 100
  `;

  return json(env, request, rows);
}

export async function handleRequirementCreate(
  sql: Sql,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  // readJson consumes the body, so it is called once and both the validated
  // fields and the post flag come out of the same parsed object.
  const body = (await readJson(request)) as CreateRequirementInput & { post?: boolean };

  let input;
  try {
    input = normaliseRequirementInput(body);
  } catch (err) {
    return json(env, request, { error: (err as Error).message }, 400);
  }

  /** Defaults to posting; { post: false } saves a draft instead. */
  const post = body.post !== false;
  const id = cuid();

  await sql.begin(async (tx) => {
    let referenceNumber: string | null = null;

    if (post) {
      // Sequence is per UTC day, matching the REQ-YYYYMMDD-NNNN format.
      const [{ count }] = await tx`
        SELECT COUNT(*)::int AS count FROM "Requirement"
        WHERE "referenceNumber" IS NOT NULL
          AND "createdAt" >= date_trunc('day', NOW() AT TIME ZONE 'UTC')
      `;
      referenceNumber = makeReferenceNumber(new Date(), Number(count) + 1);
    }

    await tx`
      INSERT INTO "Requirement"
        (id, "referenceNumber", "scopeOfWork", project, "sellingPrice", currency,
         "closesAt", status, "createdByAdminId", "createdAt", "updatedAt")
      VALUES
        (${id}, ${referenceNumber}, ${input.scopeOfWork}, ${input.project},
         ${input.sellingPrice}, ${input.currency}, ${input.closesAt},
         ${post ? "OPEN" : "DRAFT"}, ${admin.id}, NOW(), NOW())
    `;

    for (const agentId of input.agentIds) {
      await tx`
        INSERT INTO "RequirementInvite" (id, "requirementId", "agentId", "createdAt")
        VALUES (${cuid()}, ${id}, ${agentId}, NOW())
        ON CONFLICT DO NOTHING
      `;
    }
    for (const vendorUserId of input.vendorUserIds) {
      await tx`
        INSERT INTO "RequirementInvite" (id, "requirementId", "vendorUserId", "createdAt")
        VALUES (${cuid()}, ${id}, ${vendorUserId}, NOW())
        ON CONFLICT DO NOTHING
      `;
    }
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: post ? "requirement.posted" : "requirement.created",
    entityType: "Requirement",
    entityId: id,
    metadata: {
      project: input.project,
      closesAt: input.closesAt.toISOString(),
      invited: input.agentIds.length + input.vendorUserIds.length,
    },
  });

  return json(env, request, { ok: true, requirement: { id } }, 201);
}
```

- [ ] **Step 6: Register the routes**

In `workers/admin-api/src/index.ts`, add `handleRequirementsList` and `handleRequirementCreate` to the imports and register:

```ts
if (path === "/requirements" && request.method === "GET") {
  return await handleRequirementsList(sql, env, request);
}
if (path === "/requirements" && request.method === "POST") {
  return await handleRequirementCreate(sql, env, request);
}
```

- [ ] **Step 7: Write the BFF route and screens**

`apps/admin/src/app/api/requirements/route.ts` is a pass-through following `api/agents/route.ts` exactly.

`apps/admin/src/app/(protected)/requirements/page.tsx` is a Server Component listing requirements — reference, project, scope, closes at, invited count, submitted count, status — with `<CreateRequirementForm agents={…} vendors={…} />` above it. Load active agents and active vendors with one Prisma query each.

`CreateRequirementForm.tsx` is a client component: scope of work (textarea), project, selling price, currency, closing date and time (`datetime-local`), and a checkbox list of agents and suppliers in two labelled groups. Two buttons: **Save draft** posts `{ post: false }`, **Post requirement** posts `{ post: true }`. Disable both while in flight.

Add a **Requirements** nav entry to `AdminChrome.tsx`, above Vendor Accounts.

- [ ] **Step 8: Typecheck, lint, test**

```bash
(cd workers/admin-api && npx tsc --noEmit -p tsconfig.json)
npx tsc --noEmit -p apps/admin/tsconfig.json
(cd apps/admin && npx eslint src)
npm test
```

Expected: all clean.

- [ ] **Step 9: Commit**

```bash
git add workers/admin-api apps/admin
git commit -m "feat(admin): post requirements with an invite list"
```

---

### Task 5: Participants see and quote

The two portal Workers get the same two endpoints, differing only in which session resolves the participant. This is where the sealed-bidding rule is enforced.

**Files:**

- Create: `workers/vendor-api/src/requirements.ts`, `workers/agent-api/src/requirements.ts`
- Modify: both Workers' `handlers.ts` and `index.ts`
- Create: `apps/vendor/src/app/(protected)/requirements/page.tsx` and `[id]/page.tsx`
- Create: `apps/agent/src/app/(protected)/requirements/page.tsx` and `[id]/page.tsx`
- Create: `packages/rfq/src/quote-form.tsx` — the form both apps render
- Create: BFF routes in both apps under `api/requirements/`

**Interfaces:**

- Consumes: `Participant` and `rankQuotes` from `@repo/rfq`; `getVendorFromSession` / `getAgentFromSession` from each Worker's `auth.ts`.
- Produces: `GET /requirements`, `GET /requirements/:id`, `PUT /requirements/:id/quote` on both Workers.

- [ ] **Step 1: Write the shared query builder**

Create `workers/vendor-api/src/requirements.ts` (and the mirror in `agent-api`, with `vendorUserId` swapped for `agentId`):

```ts
import { type Sql } from "./db";

/**
 * Requirements this vendor may see: invited, open, and not past closing.
 *
 * The vendor id comes from the caller's session — never from the request — and
 * "sellingPrice" is absent from the column list on purpose. Selecting it and
 * hiding it in the UI would put RVCC's internal number one view-source away.
 */
export function listOpenForVendor(sql: Sql, vendorUserId: string) {
  return sql`
    SELECT
      r.id, r."referenceNumber", r."scopeOfWork", r.project, r.currency, r."closesAt",
      q.id AS "quoteId", q."newPrice", q.remarks, q.status AS "quoteStatus", q."submittedAt"
    FROM "RequirementInvite" i
    JOIN "Requirement" r ON r.id = i."requirementId"
    LEFT JOIN "Quote" q
      ON q."requirementId" = r.id AND q."vendorUserId" = ${vendorUserId}
    WHERE i."vendorUserId" = ${vendorUserId}
      AND r.status = 'OPEN'
      AND r."closesAt" > NOW()
    ORDER BY r."closesAt" ASC
  `;
}

/** Single requirement, same visibility rule. Returns nothing if not invited. */
export function getOneForVendor(sql: Sql, requirementId: string, vendorUserId: string) {
  return sql`
    SELECT
      r.id, r."referenceNumber", r."scopeOfWork", r.project, r.currency, r."closesAt",
      q.id AS "quoteId", q."newPrice", q.remarks, q.status AS "quoteStatus", q."submittedAt"
    FROM "RequirementInvite" i
    JOIN "Requirement" r ON r.id = i."requirementId"
    LEFT JOIN "Quote" q
      ON q."requirementId" = r.id AND q."vendorUserId" = ${vendorUserId}
    WHERE i."vendorUserId" = ${vendorUserId}
      AND r.id = ${requirementId}
    LIMIT 1
  `;
}
```

- [ ] **Step 2: Write the save-quote handler**

In `workers/vendor-api/src/handlers.ts` (mirror in agent-api):

```ts
export async function handleQuoteSave(
  sql: Sql,
  env: Env,
  request: Request,
  requirementId: string
): Promise<Response> {
  const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

  const body = (await request.json().catch(() => ({}))) as {
    newPrice?: string | null;
    remarks?: string;
    submit?: boolean;
  };

  const submit = body.submit === true;
  const price = body.newPrice == null ? "" : String(body.newPrice).trim();

  if (price && !/^\d+(\.\d{1,2})?$/.test(price)) {
    return json(
      env,
      request,
      { error: "Enter a price as a number with at most two decimals." },
      400
    );
  }
  if (submit && (!price || Number(price) <= 0)) {
    return json(env, request, { error: "Enter a price before submitting." }, 400);
  }

  // Re-check the deadline inside the same statement that writes. The countdown
  // on screen is display only; the browser clock is never trusted.
  const [requirement] = await sql`
    SELECT r.id FROM "Requirement" r
    JOIN "RequirementInvite" i ON i."requirementId" = r.id AND i."vendorUserId" = ${vendor.id}
    WHERE r.id = ${requirementId} AND r.status = 'OPEN' AND r."closesAt" > NOW()
    LIMIT 1
  `;
  if (!requirement) {
    return json(
      env,
      request,
      { error: "This requirement is closed or not available to you." },
      409
    );
  }

  // The unique constraint makes this an upsert, so a double-clicked submit
  // cannot create two quotes.
  const [saved] = await sql`
    INSERT INTO "Quote"
      (id, "requirementId", "vendorUserId", "newPrice", remarks, status, "submittedAt", "createdAt", "updatedAt")
    VALUES
      (${cuid()}, ${requirementId}, ${vendor.id}, ${price || null}, ${String(body.remarks ?? "")},
       ${submit ? "SUBMITTED" : "DRAFT"}, ${submit ? new Date() : null}, NOW(), NOW())
    ON CONFLICT ("requirementId", "vendorUserId") DO UPDATE SET
      "newPrice"    = EXCLUDED."newPrice",
      remarks       = EXCLUDED.remarks,
      status        = EXCLUDED.status,
      "submittedAt" = COALESCE(EXCLUDED."submittedAt", "Quote"."submittedAt"),
      "updatedAt"   = NOW()
    RETURNING id, status
  `;

  return json(env, request, { ok: true, quote: saved });
}
```

- [ ] **Step 3: Register the routes**

On both Workers:

```ts
if (path === "/requirements" && request.method === "GET") {
  return await handleRequirementsList(sql, env, request);
}
const quoteSave = path.match(/^\/requirements\/([^/]+)\/quote$/);
if (quoteSave && request.method === "PUT") {
  return await handleQuoteSave(sql, env, request, quoteSave[1]);
}
const reqOne = path.match(/^\/requirements\/([^/]+)$/);
if (reqOne && request.method === "GET") {
  return await handleRequirementGet(sql, env, request, reqOne[1]);
}
```

Order matters: the `/quote` pattern must be tested before the single-requirement pattern, or `…/quote` is read as a requirement id.

- [ ] **Step 4: Write the shared quote form**

Create `packages/rfq/src/quote-form.tsx` — a client component both portals render, taking `{ requirement, quote, action }` where `action` is the BFF path to PUT to. Fields: price, remarks. Buttons: **Save draft** and **Submit**. After submitting it states plainly: _"Submitted. You can still change this until <closing time>."_

Add `"./quote-form": "./src/quote-form.tsx"` to the package `exports`, and `react` to its dependencies.

- [ ] **Step 5: Write the portal screens and BFF routes**

Both apps get `(protected)/requirements/page.tsx` (list, time remaining) and `(protected)/requirements/[id]/page.tsx` (scope, project, and the shared form). Neither renders a selling price, because the API never sends one.

A requirement opened after closing shows: _"This requirement closed on <date>."_ — not a 404, which reads as a broken system.

- [ ] **Step 6: The test that proves sealed bidding**

This is the one that must never be skipped. With both portals and both Workers running, and two participants each holding a quote on the same requirement:

```bash
# Agent asks for the vendor's quote by id, and vice versa.
curl -s -o /dev/null -w "agent→vendor requirement: %{http_code}\n" \
  -b "rvcc_agent_session=$AGENT_TOKEN" "http://localhost:3003/requirements/$REQ_ID"
curl -s -b "rvcc_agent_session=$AGENT_TOKEN" "http://localhost:3003/api/requirements/$REQ_ID" \
  | grep -c "sellingPrice" || echo "sellingPrice absent ✓"
```

Expected: each participant sees only their own quote, and `sellingPrice` appears in no participant response. Then confirm directly in the database that the other participant's price was never sent.

- [ ] **Step 7: Typecheck, lint, test**

```bash
for w in vendor-api agent-api; do (cd workers/$w && npx tsc --noEmit -p tsconfig.json); done
for a in vendor agent; do npx tsc --noEmit -p apps/$a/tsconfig.json; (cd apps/$a && npx eslint src); done
npm test
```

- [ ] **Step 8: Commit**

```bash
git add workers apps packages
git commit -m "feat(rfq): participants list requirements and submit sealed quotes"
```

---

### Task 6: The comparison table

**Files:**

- Modify: `workers/admin-api/src/handlers.ts`, `src/index.ts`
- Create: `apps/admin/src/app/(protected)/requirements/[id]/page.tsx`

**Interfaces:**

- Consumes: `rankQuotes` from `@repo/rfq`.
- Produces: `GET /requirements/:id` on admin-api, returning the requirement with every submitted quote and its participant.

- [ ] **Step 1: Write the handler**

```ts
export async function handleRequirementGet(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const [requirement] = await sql`
    SELECT id, "referenceNumber", "scopeOfWork", project, "sellingPrice", currency,
           "closesAt", status, "createdAt"
    FROM "Requirement" WHERE id = ${id} LIMIT 1
  `;
  if (!requirement) return json(env, request, { error: "Requirement not found." }, 404);

  // Only SUBMITTED quotes appear: an unsubmitted draft is not a quote.
  // One query with both participant joins, rather than a lookup per row.
  const quotes = await sql`
    SELECT
      q.id, q."newPrice", q.remarks, q."submittedAt",
      COALESCE(a.email, v.email) AS "participantEmail",
      COALESCE(NULLIF(a.name, ''), NULLIF(v.name, ''), '') AS "participantName",
      CASE WHEN q."agentId" IS NOT NULL THEN 'AGENT' ELSE 'SUPPLIER' END AS kind
    FROM "Quote" q
    LEFT JOIN "Agent" a ON a.id = q."agentId"
    LEFT JOIN "VendorUser" v ON v.id = q."vendorUserId"
    WHERE q."requirementId" = ${id} AND q.status = 'SUBMITTED'
  `;

  const invites = await sql`
    SELECT
      COALESCE(a.email, v.email) AS email,
      i."emailStatus",
      CASE WHEN i."agentId" IS NOT NULL THEN 'AGENT' ELSE 'SUPPLIER' END AS kind
    FROM "RequirementInvite" i
    LEFT JOIN "Agent" a ON a.id = i."agentId"
    LEFT JOIN "VendorUser" v ON v.id = i."vendorUserId"
    WHERE i."requirementId" = ${id}
  `;

  return json(env, request, { requirement, quotes, invites });
}
```

- [ ] **Step 2: Register the route**

```ts
const reqOne = path.match(/^\/requirements\/([^/]+)$/);
if (reqOne && request.method === "GET") {
  return await handleRequirementGet(sql, env, request, reqOne[1]);
}
```

- [ ] **Step 3: Write the screen**

`apps/admin/src/app/(protected)/requirements/[id]/page.tsx` renders the requirement header (reference, project, scope, closing time, selling price — admin-only, so it belongs here), then the comparison table sorted by `rankQuotes`: rank, participant, audience, price, remarks, submitted at. Below it, the invite list with `emailStatus`, so failures are visible.

When there are no submitted quotes, say so plainly rather than rendering an empty table.

- [ ] **Step 4: Verify ranking against real rows**

Seed two participants at the same price and one higher, then load the page and confirm the ranks read 1, 1, 3 — matching the unit test in Task 3, but through the real query and screen.

- [ ] **Step 5: Typecheck, lint, test**

```bash
(cd workers/admin-api && npx tsc --noEmit -p tsconfig.json)
npx tsc --noEmit -p apps/admin/tsconfig.json
(cd apps/admin && npx eslint src)
npm test
```

- [ ] **Step 6: Commit**

```bash
git add workers/admin-api apps/admin
git commit -m "feat(admin): compare submitted quotes with computed ranking"
```

---

## What this plan deliberately leaves out

- **Attachments** (`RequirementAttachment`, `QuoteAttachment`, R2 upload and signed links). They need a real R2 bucket and credentials that cannot be exercised locally, so shipping them blind would mean writing code no test here can run. Plan 4.
- **Awarding** — `awardedQuoteId`, the `AWARDED` transition, and the winner's email. Plan 4.
- **Invite email on posting.** The `emailStatus` column and the Resend affordance are built here so the shape is right, but the send itself belongs with awarding, where the same mail plumbing is needed. Until then invites are `PENDING` and the admin tells people directly.
- **The notification bell** and **KPIs**. Plan 4.
- **Deadline extension** and the "all invited participants are emailed about the change" rule. Depends on the same mail path.

## Carried-forward decisions the user still owes

1. **Which lineage owns the production database.** Now eleven tables across three plans, all local-only.
2. **Whether a temporary password may be emailed.**

## Self-review notes

- **Spec coverage:** implements _Data model_ (Requirement, RequirementInvite, Quote), _Participants_, _Sealed pricing_, _Screens_ for admin and both portals, the _rank is never stored_ and _money is Decimal_ decisions, and the deadline-race and double-submit items under _Error handling_.
- **Ordering:** Task 1 before 2 (Quote references Requirement), Task 3 before 5 and 6 (both import `rankQuotes`), Task 4 before 5 (nothing to quote on until a requirement exists).
- **Route-order trap, stated in Task 5 Step 3:** `/requirements/:id/quote` must be matched before `/requirements/:id`, or the literal string `quote` is parsed as a requirement id.
- **Constraint durability:** `prisma db push` does not create or preserve CHECK constraints, so `npm run -w @repo/db constraints` must run after every push. Tasks 1 and 2 both say so, because forgetting it silently removes the guarantee the tests rely on.
