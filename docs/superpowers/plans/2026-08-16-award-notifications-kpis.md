# Awarding, Notifications and KPIs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the loop on the requirement workflow — the admin awards a requirement to one submitted quote, the winning supplier is told by email and in the portal, staff are told too, every step is recorded, and the dashboard shows what is waiting on whom.

**Architecture:** Follows `main`'s backend-for-frontend split. `workers/admin-api` owns the award write and the KPI queries; `workers/vendor-api` owns the supplier's notification reads. SMTP stays exclusively on `workers/enquire-api` — both other Workers ask it to send, as they already do for approval decisions and would for invites.

**Tech Stack:** TypeScript, Next.js 16.2.4 (App Router, React 19), Prisma 5.22 + PostgreSQL, Cloudflare Workers, Tailwind 4, Vitest 3, npm workspaces + Turborepo.

**Spec:** `docs/superpowers/specs/2026-08-15-requirement-quote-workflow-design.md` — read its _Correction, 2026-08-16_ section first. There is one audience: vendors. "Agent" means vendor.

**Predecessors:** Plans 1 and 3. Plan 2 is superseded and its output has been removed.

## Global Constraints

- **Base branch:** `feat/foundation-and-accounts`.
- **There is one participant type: the vendor.** No agents, no polymorphic owner, no audience column.
- **Production has not been upgraded yet.** Every migration step targets the local `rvcc_main_test` database. When this plan's schema changes are ready, regenerate `packages/db/prisma/upgrades/` rather than editing the existing upgrade file, which is already rehearsed.
- **This project uses `prisma db push`, not migrations**, and `npm run -w @repo/db constraints` must run after every push.
- **Money is `Decimal(14,2)`.** Compare and rank as numbers, store and display as strings.
- **`sellingPrice` never reaches a participant**, including in any notification body.
- **`workers/*` are not npm workspaces.** Pure logic goes in its own module so root tests can import it without resolving `postgres`.
- **Wrangler requires Node ≥ 22:** `export PATH="$HOME/.nvm/versions/node/v24.14.0/bin:$PATH"`.
- **New env vars go in `turbo.json` `globalEnv`**, or lint fails.
- **Privileged actions write to `AuditLog`.**
- Commit after every task.

---

### Task 1: Award fields and the Notification model

**Files:**

- Modify: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/award.test.ts`

**Interfaces:**

- Consumes: `resetTestDatabase`, `testPrisma`.
- Produces: `Requirement.awardedQuoteId / awardedAt / awardedByAdminId`, status `AWARDED`, and the `Notification` table.

- [ ] **Step 1: Write the failing test**

Create `packages/db/src/award.test.ts`:

```ts
import { beforeEach, expect, test } from "vitest";

import { resetTestDatabase, testPrisma } from "./test-support";

beforeEach(async () => {
  await resetTestDatabase();
});

async function setup() {
  const admin = await testPrisma.adminUser.create({
    data: { email: `a-${Date.now()}-${Math.random()}@rvcc.com`, passwordHash: "x" },
  });
  const requirement = await testPrisma.requirement.create({
    data: {
      scopeOfWork: "S",
      project: "P",
      closesAt: new Date(Date.now() + 86_400_000),
      createdByAdminId: admin.id,
      status: "OPEN",
    },
  });
  const vendor = await testPrisma.vendorUser.create({
    data: { email: `v-${Math.random()}@supplier.com`, passwordHash: "x" },
  });
  const quote = await testPrisma.quote.create({
    data: {
      requirementId: requirement.id,
      vendorUserId: vendor.id,
      newPrice: "80",
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });
  return { admin, requirement, vendor, quote };
}

test("a requirement records which quote won, when and by whom", async () => {
  const { admin, requirement, quote } = await setup();

  const awarded = await testPrisma.requirement.update({
    where: { id: requirement.id },
    data: {
      awardedQuoteId: quote.id,
      awardedAt: new Date(),
      awardedByAdminId: admin.id,
      status: "AWARDED",
    },
  });

  expect(awarded.status).toBe("AWARDED");
  expect(awarded.awardedQuoteId).toBe(quote.id);
});

test("one quote cannot win two requirements", async () => {
  const first = await setup();
  const second = await setup();

  await testPrisma.requirement.update({
    where: { id: first.requirement.id },
    data: { awardedQuoteId: first.quote.id },
  });

  // awardedQuoteId is @unique, so a quote is claimable exactly once.
  await expect(
    testPrisma.requirement.update({
      where: { id: second.requirement.id },
      data: { awardedQuoteId: first.quote.id },
    })
  ).rejects.toThrow();
});

test("a notification belongs to a vendor or an admin, and starts unread", async () => {
  const { admin, vendor, requirement } = await setup();

  const forVendor = await testPrisma.notification.create({
    data: {
      vendorUserId: vendor.id,
      type: "QUOTE_AWARDED",
      title: "You won",
      body: "Congratulations",
      linkPath: `/requirements/${requirement.id}`,
    },
  });
  const forAdmin = await testPrisma.notification.create({
    data: {
      adminId: admin.id,
      type: "QUOTE_SUBMITTED",
      title: "New quote",
      body: "A supplier quoted",
      linkPath: `/requirements/${requirement.id}`,
    },
  });

  expect(forVendor.readAt).toBeNull();
  expect(forAdmin.readAt).toBeNull();
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- award`
Expected: FAIL — `awardedQuoteId` and `testPrisma.notification` do not exist.

- [ ] **Step 3: Add the fields and model**

In `model Requirement`, above `createdAt`:

```prisma
  /// The winning quote. @unique so one quote cannot win twice.
  awardedQuoteId   String?  @unique
  awardedQuote     Quote?   @relation("AwardedQuote", fields: [awardedQuoteId], references: [id], onDelete: SetNull)
  awardedAt        DateTime?
  awardedByAdminId String?
  awardedByAdmin   AdminUser? @relation("RequirementAwarder", fields: [awardedByAdminId], references: [id], onDelete: SetNull)
```

In `model Quote`, beside the other relations:

```prisma
  awardedFor Requirement? @relation("AwardedQuote")
```

In `model AdminUser`:

```prisma
  awarded       Requirement[]  @relation("RequirementAwarder")
  notifications Notification[]
```

In `model VendorUser`:

```prisma
  notifications Notification[]
```

Then append:

```prisma
enum NotificationType {
  REQUIREMENT_POSTED
  QUOTE_SUBMITTED
  QUOTE_AWARDED
}

/// In-app bell. Recipient is a vendor or an admin — the two are separate
/// nullable links rather than one polymorphic id, so both stay real foreign
/// keys and a deleted account takes its notifications with it.
model Notification {
  id String @id @default(cuid())

  vendorUserId String?
  vendorUser   VendorUser? @relation(fields: [vendorUserId], references: [id], onDelete: Cascade)

  adminId String?
  admin   AdminUser? @relation(fields: [adminId], references: [id], onDelete: Cascade)

  type     NotificationType
  title    String
  body     String   @default("")
  linkPath String

  readAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([vendorUserId, readAt])
  @@index([adminId, readAt])
}
```

- [ ] **Step 4: Push, generate, constrain, test**

```bash
export $(grep DATABASE_URL_TEST .env.test | xargs)
DATABASE_URL="$DATABASE_URL_TEST" npx prisma db push \
  --schema=packages/db/prisma/schema.prisma --skip-generate --accept-data-loss
npx prisma generate --schema=packages/db/prisma/schema.prisma
DATABASE_URL="$DATABASE_URL_TEST" npm run -w @repo/db constraints
npm test -- award
```

Expected: PASS, all three tests.

- [ ] **Step 5: Commit**

```bash
git add packages/db
git commit -m "feat(db): add award fields and the Notification model"
```

---

### Task 2: Awarding in the admin worker

**Files:**

- Create: `workers/admin-api/src/award.ts`, `src/award.test.ts`
- Modify: `workers/admin-api/src/handlers.ts`, `src/index.ts`

**Interfaces:**

- Consumes: `requireAdmin`, `writeAudit`, `json`, `cuid`, `readJson`.
- Produces: `POST /requirements/:id/award` taking `{ quoteId }`; and `describeAward(...)` for the audit and notification copy.

- [ ] **Step 1: Write the failing test**

Create `workers/admin-api/src/award.test.ts`:

```ts
import { expect, test } from "vitest";

import { describeAward } from "./award";

const quotes = [
  { id: "q1", newPrice: "80.00", vendorEmail: "alpha@supplier.com" },
  { id: "q2", newPrice: "100.00", vendorEmail: "beta@supplier.com" },
  { id: "q3", newPrice: "90.00", vendorEmail: "gamma@supplier.com" },
];

test("records the winning price and every losing price", () => {
  const out = describeAward(quotes, "q1");

  expect(out.winner.vendorEmail).toBe("alpha@supplier.com");
  expect(out.winningPrice).toBe("80.00");
  // The losing prices are captured so the decision can be reconstructed later,
  // even if a supplier edits their quote afterwards.
  expect(out.losingPrices.sort()).toEqual(["100.00", "90.00"]);
});

test("refuses a quote that is not in the list", () => {
  expect(() => describeAward(quotes, "nope")).toThrow(/not a submitted quote/i);
});

test("refuses when there are no quotes at all", () => {
  expect(() => describeAward([], "q1")).toThrow(/not a submitted quote/i);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- workers/admin-api/src/award`
Expected: FAIL — cannot resolve `./award`.

- [ ] **Step 3: Write the module**

Create `workers/admin-api/src/award.ts`:

```ts
export type AwardableQuote = { id: string; newPrice: string; vendorEmail: string };

/**
 * Validates the chosen quote and captures the moment of decision.
 *
 * Kept free of database and Worker imports so it is testable from the repo root
 * — workers/ are not npm workspaces and cannot resolve `postgres` there.
 *
 * The losing prices are recorded deliberately: quotes stay editable until the
 * deadline, so without a snapshot the audit trail could not explain why this
 * one was chosen.
 */
export function describeAward(quotes: AwardableQuote[], quoteId: string) {
  const winner = quotes.find((q) => q.id === quoteId);
  if (!winner) {
    throw new Error("That is not a submitted quote on this requirement.");
  }

  return {
    winner,
    winningPrice: winner.newPrice,
    losingPrices: quotes.filter((q) => q.id !== quoteId).map((q) => q.newPrice),
  };
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test -- workers/admin-api/src/award`
Expected: PASS, all three tests.

- [ ] **Step 5: Write the handler**

In `workers/admin-api/src/handlers.ts`:

```ts
export async function handleRequirementAward(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = (await readJson(request)) as { quoteId?: string } | null;
  const quoteId = String(body?.quoteId ?? "");
  if (!quoteId) return json(env, request, { error: "Choose a quote to award." }, 400);

  const [requirement] = await sql`
    SELECT id, project, "referenceNumber", currency, status
    FROM "Requirement" WHERE id = ${id} LIMIT 1
  `;
  if (!requirement) return json(env, request, { error: "Requirement not found." }, 404);
  if (requirement.status === "CANCELLED") {
    return json(env, request, { error: "This requirement was cancelled." }, 409);
  }

  const quotes = await sql`
    SELECT q.id, q."newPrice", v.email AS "vendorEmail", q."vendorUserId"
    FROM "Quote" q
    JOIN "VendorUser" v ON v.id = q."vendorUserId"
    WHERE q."requirementId" = ${id} AND q.status = 'SUBMITTED'
  `;

  let described;
  try {
    described = describeAward(
      quotes.map((q) => ({
        id: String(q.id),
        newPrice: String(q.newPrice),
        vendorEmail: String(q.vendorEmail),
      })),
      quoteId
    );
  } catch (err) {
    return json(env, request, { error: (err as Error).message }, 400);
  }

  const winnerRow = quotes.find((q) => String(q.id) === quoteId)!;

  await sql.begin(async (tx) => {
    // Awarding closes the requirement early if it was still open. AWARDED is a
    // stored decision the clock cannot express, unlike "closed".
    await tx`
      UPDATE "Requirement"
      SET "awardedQuoteId" = ${quoteId},
          "awardedAt" = NOW(),
          "awardedByAdminId" = ${admin.id},
          status = 'AWARDED',
          "updatedAt" = NOW()
      WHERE id = ${id}
    `;

    // The winner is told. Losing suppliers are deliberately not notified —
    // that is a commercial decision for RVCC, not one this code should make.
    await tx`
      INSERT INTO "Notification" (id, "vendorUserId", type, title, body, "linkPath", "createdAt")
      VALUES (
        ${cuid()}, ${winnerRow.vendorUserId}, 'QUOTE_AWARDED',
        ${"You won " + String(requirement.project)},
        ${"RVCC awarded this work to your quote."},
        ${"/requirements/" + id},
        NOW()
      )
    `;

    // Every admin sees the decision, including staff who did not make it.
    const admins = await tx`SELECT id FROM "AdminUser" WHERE "isActive" = true`;
    for (const a of admins) {
      await tx`
        INSERT INTO "Notification" (id, "adminId", type, title, body, "linkPath", "createdAt")
        VALUES (
          ${cuid()}, ${a.id}, 'QUOTE_AWARDED',
          ${String(requirement.project) + " awarded"},
          ${"Awarded to " + described.winner.vendorEmail + " at " + described.winningPrice},
          ${"/requirements/" + id},
          NOW()
        )
      `;
    }
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "requirement.awarded",
    entityType: "Requirement",
    entityId: id,
    metadata: {
      quoteId,
      winner: described.winner.vendorEmail,
      winningPrice: described.winningPrice,
      losingPrices: described.losingPrices,
    },
  });

  return json(env, request, { ok: true, winner: described.winner.vendorEmail });
}
```

Add `describeAward` to the imports.

- [ ] **Step 6: Register the route**

The `/award` pattern must be matched **before** the bare `/requirements/:id` pattern, or the literal string `award` is read as a requirement id:

```ts
const reqAward = path.match(/^\/requirements\/([^/]+)\/award$/);
if (reqAward && request.method === "POST") {
  return await handleRequirementAward(sql, env, request, decodeURIComponent(reqAward[1]!));
}
```

- [ ] **Step 7: Typecheck and commit**

```bash
(cd workers/admin-api && npx tsc --noEmit -p tsconfig.json)
git add workers/admin-api && git commit -m "feat(admin-api): award a requirement to a submitted quote"
```

---

### Task 3: The award button and notification bell

**Files:**

- Create: `apps/admin/src/app/api/requirements/[id]/award/route.ts`
- Create: `apps/admin/src/sections/AwardButton.tsx`
- Create: `apps/admin/src/sections/NotificationBell.tsx`, `apps/vendor/src/sections/NotificationBell.tsx`
- Create: `apps/admin/src/app/api/notifications/route.ts`, `apps/vendor/src/app/api/notifications/route.ts`
- Modify: the comparison page, `AdminChrome.tsx`, `VendorChrome.tsx`

**Interfaces:**

- Consumes: `POST /requirements/:id/award`; `prisma.notification` for reads.
- Produces: an Award action per row, and a bell showing unread count.

- [ ] **Step 1: BFF route for awarding**

`apps/admin/src/app/api/requirements/[id]/award/route.ts`, a pass-through following `api/agents/[id]/route.ts`'s shape: read the cookie, forward, pass status and body back, 503 on upstream failure.

- [ ] **Step 2: Award button**

`AwardButton.tsx` is a client component taking `{ requirementId, quoteId, vendorLabel, price, currency, disabled }`. Clicking asks for confirmation naming the supplier and price — awarding is a commercial commitment and must not be one misclick away:

> Award **Riyadh Plot 12** to alpha@supplier.com at 80.00 SAR?

If the requirement is still open, the confirmation adds: _"This requirement is still open until 5 Sept, 6:00 PM. Awarding now closes it early."_ On success it calls `router.refresh()`.

- [ ] **Step 3: Show it on the comparison page**

Add an Award column to the ranked table. When the requirement is already awarded, show a "Won" marker on that row instead of buttons on every row, and state who awarded it and when above the table.

- [ ] **Step 4: Notification reads**

Both apps get `api/notifications/route.ts` with `GET` (list the 20 most recent for this session's user) and `POST` (mark all read). Read directly through Prisma in the Next app — these are the current user's own rows, scoped by the session id, and the Worker adds nothing here.

The vendor query filters by the vendor id from the session, never a parameter. The admin query filters by admin id.

- [ ] **Step 5: The bell**

`NotificationBell.tsx`, one per app, a client component: a bell icon, an unread count badge when greater than zero, and a dropdown listing title, body and relative time, each linking to `linkPath`. Opening it marks everything read.

Mount it in `AdminChrome` and `VendorChrome` headers.

- [ ] **Step 6: Verify by hand**

Post a requirement, submit two quotes, award one, and confirm: the winning supplier's bell shows 1 unread, the admin's bell shows 1, the losing supplier's shows 0, and the `AuditLog` row carries both the winning and losing prices.

- [ ] **Step 7: Typecheck, lint, commit**

```bash
npx tsc --noEmit -p apps/admin/tsconfig.json && npx tsc --noEmit -p apps/vendor/tsconfig.json
(cd apps/admin && npx eslint src) && (cd apps/vendor && npx eslint src)
git add apps && git commit -m "feat(admin): award action and notification bell in both portals"
```

---

### Task 4: Email on posting and on award

SMTP lives only on `workers/enquire-api`. `admin-api` asks it to send, as it already does for approval decisions.

**Files:**

- Modify: `workers/enquire-api/src/{handlers,index,mail}.ts`
- Modify: `workers/admin-api/src/{notify,handlers}.ts`

**Interfaces:**

- Produces: `POST /notify/requirement` on enquire-api; `sendRequirementMail(env, kind, recipients, detail)` on admin-api.

- [ ] **Step 1: Add the mail template**

In `workers/enquire-api/src/mail.ts`, add `sendRequirementPostedEmail` and `sendAwardEmail`, reusing the existing HTML wrapper so branding matches. **Neither may include `sellingPrice`** — the posted mail carries scope, project, deadline and a portal link; the award mail carries project and reference only.

- [ ] **Step 2: Add the endpoint**

`handleNotifyRequirement(env, request, ctx)` on enquire-api, following `handleNotifyDecision`: validate recipients, check `smtpConfigured`, send via `ctx.waitUntil`, return `{ ok: true }`. Register at `POST /notify/requirement`.

- [ ] **Step 3: Send on posting**

In `handleRequirementCreate`, after the transaction commits and only when `post` is true, call the mail client and update each invite's `emailStatus` to `SENT` or `FAILED` with `emailError`. **The requirement is committed first and mail sent afterwards** — a slow or failing SMTP server must never roll back a saved requirement, and one bad address must not stop the others.

- [ ] **Step 4: Send on award**

Same pattern in `handleRequirementAward`, to the winner only.

- [ ] **Step 5: Verify**

With SMTP unconfigured locally, posting must still succeed and leave invites at `PENDING` or `FAILED` — never roll back. Confirm the requirement exists and the audit row was written even though mail failed.

- [ ] **Step 6: Commit**

```bash
git add workers && git commit -m "feat(admin-api): email suppliers on posting and on award"
```

---

### Task 5: KPIs on the admin dashboard

**Files:**

- Create: `workers/admin-api/src/kpi.ts`, `src/kpi.test.ts`
- Modify: `apps/admin/src/app/(protected)/page.tsx`

**Interfaces:**

- Produces: `summariseVendorPerformance(rows)` and a dashboard showing headline counts plus per-supplier performance.

- [ ] **Step 1: Write the failing test**

Create `workers/admin-api/src/kpi.test.ts`:

```ts
import { expect, test } from "vitest";

import { summariseVendorPerformance } from "./kpi";

test("response rate is quotes over invitations", () => {
  const [row] = summariseVendorPerformance([
    { email: "a@s.com", invited: 4, submitted: 3, won: 1 },
  ]);

  expect(row.responseRate).toBe(75);
  expect(row.winRate).toBe(33);
});

test("a supplier invited but never quoting scores zero, not NaN", () => {
  const [row] = summariseVendorPerformance([
    { email: "b@s.com", invited: 5, submitted: 0, won: 0 },
  ]);

  // 0/0 would be NaN and render as "NaN%" on the dashboard.
  expect(row.responseRate).toBe(0);
  expect(row.winRate).toBe(0);
});

test("a supplier never invited scores zero rather than dividing by zero", () => {
  const [row] = summariseVendorPerformance([
    { email: "c@s.com", invited: 0, submitted: 0, won: 0 },
  ]);

  expect(row.responseRate).toBe(0);
});

test("worst responders sort first, because they are the ones to chase", () => {
  const rows = summariseVendorPerformance([
    { email: "good@s.com", invited: 4, submitted: 4, won: 2 },
    { email: "bad@s.com", invited: 4, submitted: 1, won: 0 },
  ]);

  expect(rows[0].email).toBe("bad@s.com");
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- kpi`
Expected: FAIL — cannot resolve `./kpi`.

- [ ] **Step 3: Write the module**

Create `workers/admin-api/src/kpi.ts`:

```ts
export type VendorPerformanceRow = {
  email: string;
  invited: number;
  submitted: number;
  won: number;
};

/**
 * Turns raw counts into the two rates staff actually act on.
 *
 * Guards every division: a supplier invited zero times is a real row on this
 * dashboard, and 0/0 would render as "NaN%".
 *
 * Sorted worst-responder first. The point of this table is to find suppliers
 * who are invited constantly and never reply, so they belong at the top.
 */
export function summariseVendorPerformance(rows: VendorPerformanceRow[]) {
  return rows
    .map((r) => ({
      ...r,
      responseRate: r.invited === 0 ? 0 : Math.round((r.submitted / r.invited) * 100),
      winRate: r.submitted === 0 ? 0 : Math.round((r.won / r.submitted) * 100),
    }))
    .sort((a, b) => a.responseRate - b.responseRate || b.invited - a.invited);
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test -- kpi`
Expected: PASS, all four tests.

- [ ] **Step 5: Build the dashboard**

Extend `apps/admin/src/app/(protected)/page.tsx`, keeping the existing registration cards and adding:

**Headline:** active suppliers, open requirements, closing within 48 hours, and **closed but not yet awarded** — the last is the one that represents work waiting on staff, so it links to the requirements list.

**Per-supplier performance:** email, invited, submitted, response rate, won, win rate — via `summariseVendorPerformance`.

Use one grouped query per metric, not a query per supplier. Scope to the last 90 days: an all-time average hides a supplier who was reliable last year and has stopped responding.

- [ ] **Step 6: Verify with real rows**

Seed three suppliers with different invite/quote/win counts, load the dashboard, and confirm the rates match hand calculation and the worst responder is first.

- [ ] **Step 7: Typecheck, lint, test, commit**

```bash
npx tsc --noEmit -p apps/admin/tsconfig.json
(cd apps/admin && npx eslint src)
npm test
git add . && git commit -m "feat(admin): KPI dashboard with supplier response and win rates"
```

---

## What this plan deliberately leaves out

- **Attachments** (`RequirementAttachment`, `QuoteAttachment`, R2 upload, signed links). They need a real R2 bucket and credentials that cannot be exercised locally, so building them here would mean shipping code no test can run. This is the last outstanding item from the original sketch, and it needs either R2 credentials or a decision to use a different store.
- **Notifying losing suppliers.** A "you did not win" email is a commercial choice for RVCC.
- **Deadline extension**, and re-notifying everyone when it changes.
- **WhatsApp/SMS and browser push.**

## Self-review notes

- **Spec coverage:** implements _Awarding_, _Recording_, _KPIs_, the notification half of _Screens_, and the two emails under _Email_.
- **Ordering:** Task 1 before 2 (the columns must exist), Task 2 before 3 (the button needs the endpoint), Task 3 before 4 (mail is additive to a working award).
- **Route-order trap, stated in Task 2 Step 6:** `/requirements/:id/award` must be matched before `/requirements/:id`, the same trap Plan 3 hit with `/quote`.
- **Division guards in Task 5 are the point of that module**, not incidental — three of its four tests are about zero denominators.
