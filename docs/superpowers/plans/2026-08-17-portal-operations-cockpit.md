# Portal Operations Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the RVCC admin and vendor portals as action-first operations cockpits that load inside a defined latency budget.

**Architecture:** Pure derivation logic moves into `@repo/rfq` as plain TypeScript so it is unit-testable (the Vitest include glob covers `*.test.ts` only — never `.tsx`, so no component is tested directly). Data access narrows to what each screen paints, with server-side pagination and three new indexes. Each data region streams behind its own `Suspense` boundary so the chrome never waits on the slowest query. The visual layer is rebuilt last, on top of data that is already fast.

**Tech Stack:** Next.js 16 (App Router, React 19), Prisma 5 against PostgreSQL, Cloudflare Workers with `postgres` + Hyperdrive, Tailwind CSS 4, Vitest, Turborepo.

**Spec:** `docs/superpowers/specs/2026-08-17-portal-operations-cockpit-design.md`

## Global Constraints

- **Palette is brand-only.** `--color-brand-blue: #0073bc`, `--color-brand-black: #000000`, `--color-brand-white: #ffffff`, `--color-brand-grey: #a6a6a6`, already defined in both `globals.css` files. Zinc greys already in use may stay. Introduce no new hue — no amber, green, or navy. Existing `text-red-700` on the performance table and `bg-red-600` on the notification badge are the only permitted exceptions and must not spread.
- **Status is never colour-only.** Every state carries text or an icon.
- **Sealed-quote rule.** Every participant-facing query filters by the vendor id taken from the session, never from a URL or body. `sellingPrice` is never selected by a vendor-facing query.
- **Page size is 25** for every paginated list.
- **Latency budget:** shell < 300 ms, dashboard content < 800 ms, list first row < 800 ms, detail < 1000 ms, ≤ 4 DB round-trips per render.
- **Touch targets** are at least 44px high; every interactive element has a visible focus ring and an accessible name.
- **Schema changes** go into `packages/db/prisma/schema.prisma` _and_ a dated additive SQL file in `packages/db/prisma/upgrades/`, following the audit-header convention of `2026-08-16-requirements-and-quotes.sql`. Additive only — no `DROP`, `TRUNCATE`, or `DELETE`.
- **Test command** is `npm test` from the repo root (Vitest, `fileParallelism: false`). Database tests need `DATABASE_URL_TEST` in `.env.test`.
- **Do not touch** `apps/admin/src/lib/session.ts` or `apps/vendor/src/lib/session.ts`. The React `cache` + 45s TTL design is correct and is not a bottleneck.
- **Commit after every task.** Never run `git commit` on the user's behalf outside the steps written here.

---

## File Structure

**Created:**

- `packages/rfq/src/pagination.ts` — page-number parsing and page-count maths, shared by every list.
- `packages/rfq/src/pagination.test.ts`
- `packages/rfq/src/vendor-dashboard.ts` — turns raw vendor counts and requirement rows into the overview view-model.
- `packages/rfq/src/vendor-dashboard.test.ts`
- `packages/rfq/src/deadline.ts` — one deadline formatter, replacing the copies in the vendor requirements page and elsewhere.
- `packages/rfq/src/deadline.test.ts`
- `packages/db/prisma/upgrades/2026-08-17-portal-performance-indexes.sql`
- `packages/ui/src/pagination.tsx` — shared `<Pagination>` control (Task 2), consumed by Tasks 5-8.
- `packages/ui/src/kpi-card.tsx` — shared KPI tile (Task 2), consumed by Tasks 9 and 10.
- `packages/ui/src/skeleton.tsx` — shared skeleton primitives (Task 9).
- `apps/admin/src/sections/DashboardKpis.tsx`, `DashboardQueue.tsx`, `DashboardActivity.tsx` — the three streamed admin regions.
- `apps/admin/src/app/(protected)/vendors/performance/page.tsx` — supplier performance, moved off the dashboard.
- `apps/vendor/src/sections/OverviewNextActions.tsx`

**Modified:**

- `packages/db/prisma/schema.prisma` — three indexes.
- `packages/rfq/src/index.ts` — export the new modules.
- `packages/ui/src/index.ts` — export the new components.
- `workers/vendor-api/src/handlers.ts:147-207` — extend `handleDashboard`.
- `workers/vendor-api/src/requirements.ts` — add the counts query.
- `apps/admin/src/app/(protected)/page.tsx` — slim to a streamed cockpit.
- `apps/admin/src/app/(protected)/registrations/page.tsx` — paginate and narrow.
- `apps/admin/src/app/(protected)/vendors/page.tsx` — paginate and parallelise.
- `apps/admin/src/app/(protected)/requirements/page.tsx` — narrow.
- `apps/admin/src/sections/AdminChrome.tsx` — mobile drawer.
- `apps/vendor/src/app/(protected)/page.tsx` — rebuild on the worker payload.
- `apps/vendor/src/app/(protected)/requirements/page.tsx` — card/table hybrid.
- `apps/vendor/src/sections/VendorChrome.tsx` — add Requirements to nav.

---

## Phase 1 — Data foundation

### Task 1: Add the three missing indexes

**Files:**

- Modify: `packages/db/prisma/schema.prisma:425-426`, `:209-210`, `:394-395`
- Create: `packages/db/prisma/upgrades/2026-08-17-portal-performance-indexes.sql`

**Interfaces:**

- Consumes: nothing.
- Produces: index coverage that Tasks 3, 5, 6 depend on. No code symbols.

`Quote` currently carries `@@unique([requirementId, vendorUserId])` and `@@index([requirementId, status])`. Neither serves a lookup that leads with `vendorUserId`, so every per-vendor quote count scans the table. That is the single highest-value index here.

- [ ] **Step 1: Add the indexes to the Prisma schema**

In `model Quote`, alongside the existing `@@index([requirementId, status])`:

```prisma
  @@index([vendorUserId, status])
```

In `model SupplierRegistration`, alongside `@@index([status])`:

```prisma
  @@index([status, submittedAt])
```

In `model RequirementInvite`, replacing `@@index([vendorUserId])` (the new composite serves every query the old one did, because `vendorUserId` leads it):

```prisma
  @@index([vendorUserId, createdAt])
```

- [ ] **Step 2: Regenerate the client and confirm the schema is valid**

Run: `cd packages/db && npx prisma validate --schema=prisma/schema.prisma && npm run generate`
Expected: "The schema at prisma/schema.prisma is valid" then a successful generate.

- [ ] **Step 3: Write the production upgrade file**

Create `packages/db/prisma/upgrades/2026-08-17-portal-performance-indexes.sql`:

```sql
-- ============================================================================
-- Production upgrade: portal performance indexes
--
-- Generated 2026-08-17 for the portal operations cockpit work.
--
-- SAFETY: additive only. Three CREATE INDEX statements and one DROP INDEX.
-- There is no DROP TABLE, DROP COLUMN, TRUNCATE or DELETE in this file.
--
-- The one DROP is "RequirementInvite_vendorUserId_idx", replaced on the line
-- above it by a composite that leads with the same column. Any query the old
-- index served, the new one serves too; nothing loses coverage.
--
-- CONCURRENTLY keeps writes flowing while these build. Each statement must be
-- run outside a transaction block — psql does that by default, so run this
-- file with:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f <this file>
-- ============================================================================

-- Serves the per-vendor quote counts on both dashboards.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Quote_vendorUserId_status_idx"
  ON "Quote" ("vendorUserId", "status");

-- Serves the registrations list: filter by status, sort by submittedAt desc.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "SupplierRegistration_status_submittedAt_idx"
  ON "SupplierRegistration" ("status", "submittedAt");

-- Serves the 90-day invite window on the supplier performance report.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "RequirementInvite_vendorUserId_createdAt_idx"
  ON "RequirementInvite" ("vendorUserId", "createdAt");

DROP INDEX CONCURRENTLY IF EXISTS "RequirementInvite_vendorUserId_idx";
```

- [ ] **Step 4: Apply to the local database and confirm the planner uses them**

Run: `cd packages/db && npm run push`

Then, against the local database, confirm the `Quote` index is chosen rather than a sequential scan:

```sql
EXPLAIN ANALYZE
SELECT count(*) FROM "Quote"
WHERE "vendorUserId" = '<any real vendor id>' AND "status" = 'SUBMITTED';
```

Expected: the plan names `Quote_vendorUserId_status_idx`. If it reports `Seq Scan`, the local table is too small for the planner to bother — repeat against a table with at least a few thousand rows before accepting this task. Do not assume the index is used because it exists.

- [ ] **Step 5: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/upgrades/2026-08-17-portal-performance-indexes.sql
git commit -m "perf: index Quote by vendor, registrations by status+date, invites by vendor+date"
```

---

### Task 2: Shared pagination, deadline, and UI primitives

**Files:**

- Create: `packages/rfq/src/pagination.ts`, `packages/rfq/src/pagination.test.ts`
- Create: `packages/rfq/src/deadline.ts`, `packages/rfq/src/deadline.test.ts`
- Create: `packages/ui/src/pagination.tsx`, `packages/ui/src/kpi-card.tsx`
- Modify: `packages/rfq/src/index.ts`, `packages/ui/src/index.ts`

**Interfaces:**

- Consumes: nothing.
- Produces, from `@repo/ui`:
  - `<Pagination page pages total noun href />` where `href: (page: number) => string`.
  - `<KpiCard label value href? />`.
- Produces, from `@repo/rfq`:
  - `PAGE_SIZE: 25`
  - `parsePage(raw: string | undefined): number` — 1-based, never below 1, never `NaN`.
  - `pageWindow(page: number): { skip: number; take: number }` — feeds Prisma directly.
  - `pageCount(total: number, size?: number): number` — at least 1, so an empty list still reads "Page 1 of 1".
  - `describeDeadline(closesAt: Date | string, now?: Date): { label: string; urgent: boolean; closed: boolean }` — `urgent` is true within 48 hours.

- [ ] **Step 1: Write the failing pagination test**

Create `packages/rfq/src/pagination.test.ts`:

```ts
import { expect, test } from "vitest";

import { PAGE_SIZE, pageCount, pageWindow, parsePage } from "./pagination";

test("a missing or junk page parameter reads as page one", () => {
  // A hand-edited URL must never produce a NaN skip, which Prisma rejects.
  expect(parsePage(undefined)).toBe(1);
  expect(parsePage("")).toBe(1);
  expect(parsePage("banana")).toBe(1);
  expect(parsePage("0")).toBe(1);
  expect(parsePage("-4")).toBe(1);
});

test("a valid page parameter is honoured", () => {
  expect(parsePage("3")).toBe(3);
});

test("the page window feeds Prisma skip and take", () => {
  expect(pageWindow(1)).toEqual({ skip: 0, take: PAGE_SIZE });
  expect(pageWindow(3)).toEqual({ skip: PAGE_SIZE * 2, take: PAGE_SIZE });
});

test("an empty list still has one page", () => {
  // "Page 1 of 0" would be nonsense on screen.
  expect(pageCount(0)).toBe(1);
});

test("a partial final page counts", () => {
  expect(pageCount(PAGE_SIZE)).toBe(1);
  expect(pageCount(PAGE_SIZE + 1)).toBe(2);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run packages/rfq/src/pagination.test.ts`
Expected: FAIL — cannot resolve `./pagination`.

- [ ] **Step 3: Implement pagination**

Create `packages/rfq/src/pagination.ts`:

```ts
/**
 * One page size for every list in both portals. Twenty-five fits a laptop
 * screen without scrolling the header away, and keeps a list render inside
 * the 800ms budget on the heaviest table we have.
 */
export const PAGE_SIZE = 25;

/**
 * Page numbers arrive from the URL, so they arrive untrusted. Anything that is
 * not a positive integer reads as page one rather than throwing: a hand-edited
 * URL should show the first page, not an error screen.
 */
export function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** Takes an already-parsed page number. Call parsePage on the URL value first. */
export function pageWindow(page: number): { skip: number; take: number } {
  return { skip: (Math.max(1, page) - 1) * PAGE_SIZE, take: PAGE_SIZE };
}

/** At least one, so an empty list reads "Page 1 of 1" rather than "of 0". */
export function pageCount(total: number, size: number = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / size));
}
```

- [ ] **Step 4: Run the pagination test**

Run: `npx vitest run packages/rfq/src/pagination.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write the failing deadline test**

Create `packages/rfq/src/deadline.test.ts`:

```ts
import { expect, test } from "vitest";

import { describeDeadline } from "./deadline";

const NOW = new Date("2026-08-17T12:00:00Z");

function inHours(h: number) {
  return new Date(NOW.getTime() + h * 3_600_000);
}

test("a deadline inside 48 hours is urgent", () => {
  const d = describeDeadline(inHours(18), NOW);
  expect(d.label).toBe("18h left");
  expect(d.urgent).toBe(true);
  expect(d.closed).toBe(false);
});

test("a deadline beyond 48 hours reads in days and is not urgent", () => {
  const d = describeDeadline(inHours(72), NOW);
  expect(d.label).toBe("3d left");
  expect(d.urgent).toBe(false);
});

test("exactly 48 hours is still urgent", () => {
  // The boundary decides whether a supplier sees the warning at all, so it is
  // pinned rather than left to whichever comparison someone types next.
  expect(describeDeadline(inHours(48), NOW).urgent).toBe(true);
});

test("a passed deadline reads as closed, not as negative time", () => {
  const d = describeDeadline(inHours(-3), NOW);
  expect(d.label).toBe("Closed");
  expect(d.closed).toBe(true);
  expect(d.urgent).toBe(false);
});

test("an ISO string is accepted, because worker payloads are JSON", () => {
  expect(describeDeadline(inHours(5).toISOString(), NOW).label).toBe("5h left");
});
```

- [ ] **Step 6: Run it to make sure it fails**

Run: `npx vitest run packages/rfq/src/deadline.test.ts`
Expected: FAIL — cannot resolve `./deadline`.

- [ ] **Step 7: Implement the deadline formatter**

Create `packages/rfq/src/deadline.ts`:

```ts
/** Two days. The window in which a supplier still has time to act. */
const URGENT_MS = 48 * 3_600_000;

export type Deadline = { label: string; urgent: boolean; closed: boolean };

/**
 * One deadline vocabulary for both portals. Staff and suppliers reading the
 * same requirement should read the same words for how long is left.
 *
 * `now` is a parameter rather than a call to Date.now() so the behaviour at
 * the 48-hour boundary can be tested without freezing the clock.
 */
export function describeDeadline(closesAt: Date | string, now: Date = new Date()): Deadline {
  const ms = new Date(closesAt).getTime() - now.getTime();
  if (ms <= 0) return { label: "Closed", urgent: false, closed: true };

  const hours = Math.floor(ms / 3_600_000);
  const label = hours < 24 ? `${hours}h left` : `${Math.floor(hours / 24)}d left`;
  return { label, urgent: ms <= URGENT_MS, closed: false };
}
```

- [ ] **Step 8: Run the deadline test**

Run: `npx vitest run packages/rfq/src/deadline.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 9: Export both from the package**

In `packages/rfq/src/index.ts`, add above the existing `Participant` type:

```ts
export { PAGE_SIZE, pageCount, pageWindow, parsePage } from "./pagination";
export { describeDeadline, type Deadline } from "./deadline";
```

- [ ] **Step 10: Create the shared pagination control**

Four list pages need this control. Writing it once here is what stops Tasks 5-8 from carrying four copies of the same markup.

Create `packages/ui/src/pagination.tsx`:

```tsx
import Link from "next/link";

/**
 * Server-rendered paging. Takes a href builder rather than a base path so each
 * list can preserve its own filters — paging must never silently drop the
 * search the user just typed.
 */
export function Pagination({
  page,
  pages,
  total,
  noun,
  href,
}: {
  page: number;
  pages: number;
  total: number;
  noun: string;
  href: (page: number) => string;
}) {
  const base =
    "focus-visible:ring-brand-blue inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-4 font-semibold text-zinc-700 transition-colors hover:border-zinc-400 focus-visible:ring-2 focus-visible:outline-none aria-disabled:pointer-events-none aria-disabled:opacity-50";

  return (
    <nav className="flex flex-wrap items-center gap-3 text-sm" aria-label="Pagination">
      <Link href={href(Math.max(1, page - 1))} aria-disabled={page <= 1} className={base}>
        Previous
      </Link>
      <span className="text-zinc-600 tabular-nums" aria-live="polite">
        Page {page} of {pages} · {total} {noun}
      </span>
      <Link href={href(Math.min(pages, page + 1))} aria-disabled={page >= pages} className={base}>
        Next
      </Link>
    </nav>
  );
}
```

- [ ] **Step 11: Create the shared KPI tile**

Both dashboards render the same tile. `href` is optional — the vendor tiles do not link anywhere.

Create `packages/ui/src/kpi-card.tsx`:

```tsx
import Link from "next/link";

export function KpiCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const body = (
    <>
      <p className="text-xs font-semibold tracking-[0.12em] text-zinc-600 uppercase">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-950 tabular-nums">{value}</p>
    </>
  );

  const shell = "rounded-lg border border-zinc-200 bg-white p-5";

  if (!href) return <div className={shell}>{body}</div>;

  return (
    <Link
      href={href}
      className={`${shell} hover:border-brand-blue focus-visible:ring-brand-blue block transition-colors focus-visible:ring-2 focus-visible:outline-none`}
    >
      {body}
    </Link>
  );
}
```

Add both to `packages/ui/src/index.ts`:

```ts
export * from "./pagination";
export * from "./kpi-card";
```

- [ ] **Step 12: Run the full suite and commit**

Run: `npm test`
Expected: PASS — all pre-existing tests still green.

Run: `cd packages/ui && npx tsc --noEmit`
Expected: no errors. (The components have no unit tests: the Vitest glob covers `.ts` only, and these are pure markup with no logic to assert. Their behaviour is verified in the pages that consume them.)

```bash
git add packages/rfq/src/pagination.ts packages/rfq/src/pagination.test.ts packages/rfq/src/deadline.ts packages/rfq/src/deadline.test.ts packages/rfq/src/index.ts packages/ui/src/pagination.tsx packages/ui/src/kpi-card.tsx packages/ui/src/index.ts
git commit -m "feat: shared pagination, deadline, and KPI primitives"
```

---

### Task 3: Vendor overview view-model

**Files:**

- Create: `packages/rfq/src/vendor-dashboard.ts`, `packages/rfq/src/vendor-dashboard.test.ts`
- Modify: `packages/rfq/src/index.ts`

**Interfaces:**

- Consumes: `describeDeadline` from Task 2.
- Produces:
  - `type VendorDashboardInput = { requirements: VendorRequirementRow[]; now?: Date }`
  - `type VendorRequirementRow = { id: string; referenceNumber: string | null; project: string; closesAt: string; quoteStatus: "DRAFT" | "SUBMITTED" | null }`
  - `summariseVendorDashboard(input: VendorDashboardInput): { counts: { open: number; dueSoon: number; submitted: number; drafts: number }; nextActions: VendorNextAction[] }`
  - `type VendorNextAction = { id: string; referenceNumber: string | null; project: string; deadline: Deadline; action: "SUBMIT" | "CONTINUE" | "VIEW"; actionLabel: string }`

This is the logic Task 4's worker endpoint and Task 10's page both rely on. It lives in `@repo/rfq` because the Vitest glob only picks up `.ts`, so this is the only place the behaviour can be tested at all.

- [ ] **Step 1: Write the failing test**

Create `packages/rfq/src/vendor-dashboard.test.ts`:

```ts
import { expect, test } from "vitest";

import { type VendorRequirementRow, summariseVendorDashboard } from "./vendor-dashboard";

const NOW = new Date("2026-08-17T12:00:00Z");

function row(over: Partial<VendorRequirementRow> = {}): VendorRequirementRow {
  return {
    id: "r1",
    referenceNumber: "REQ-001",
    project: "Site works",
    closesAt: new Date(NOW.getTime() + 240 * 3_600_000).toISOString(),
    quoteStatus: null,
    ...over,
  };
}

test("counts split by quote state", () => {
  const { counts } = summariseVendorDashboard({
    requirements: [
      row({ id: "a", quoteStatus: null }),
      row({ id: "b", quoteStatus: "DRAFT" }),
      row({ id: "c", quoteStatus: "SUBMITTED" }),
      row({ id: "d", quoteStatus: "SUBMITTED" }),
    ],
    now: NOW,
  });

  expect(counts.open).toBe(4);
  expect(counts.drafts).toBe(1);
  expect(counts.submitted).toBe(2);
});

test("due soon counts only unsubmitted work inside 48 hours", () => {
  // A quote already submitted is not work due — counting it would send a
  // supplier back to a form they have already finished.
  const soon = new Date(NOW.getTime() + 10 * 3_600_000).toISOString();
  const { counts } = summariseVendorDashboard({
    requirements: [
      row({ id: "a", closesAt: soon, quoteStatus: null }),
      row({ id: "b", closesAt: soon, quoteStatus: "DRAFT" }),
      row({ id: "c", closesAt: soon, quoteStatus: "SUBMITTED" }),
    ],
    now: NOW,
  });

  expect(counts.dueSoon).toBe(2);
});

test("next actions are the three nearest deadlines, soonest first", () => {
  const at = (h: number) => new Date(NOW.getTime() + h * 3_600_000).toISOString();
  const { nextActions } = summariseVendorDashboard({
    requirements: [
      row({ id: "far", closesAt: at(200) }),
      row({ id: "near", closesAt: at(5) }),
      row({ id: "mid", closesAt: at(50) }),
      row({ id: "furthest", closesAt: at(400) }),
    ],
    now: NOW,
  });

  expect(nextActions.map((a) => a.id)).toEqual(["near", "mid", "far"]);
});

test("the action reflects what the supplier has already done", () => {
  const { nextActions } = summariseVendorDashboard({
    requirements: [
      row({ id: "a", quoteStatus: null }),
      row({ id: "b", quoteStatus: "DRAFT" }),
      row({ id: "c", quoteStatus: "SUBMITTED" }),
    ],
    now: NOW,
  });

  const by = Object.fromEntries(nextActions.map((a) => [a.id, a]));
  expect(by.a!.action).toBe("SUBMIT");
  expect(by.a!.actionLabel).toBe("Submit quote");
  expect(by.b!.action).toBe("CONTINUE");
  expect(by.b!.actionLabel).toBe("Continue draft");
  expect(by.c!.action).toBe("VIEW");
  expect(by.c!.actionLabel).toBe("View quote");
});

test("a supplier with nothing open gets empty counts, not a crash", () => {
  const { counts, nextActions } = summariseVendorDashboard({ requirements: [], now: NOW });
  expect(counts).toEqual({ open: 0, dueSoon: 0, submitted: 0, drafts: 0 });
  expect(nextActions).toEqual([]);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run packages/rfq/src/vendor-dashboard.test.ts`
Expected: FAIL — cannot resolve `./vendor-dashboard`.

- [ ] **Step 3: Implement the view-model**

Create `packages/rfq/src/vendor-dashboard.ts`:

```ts
import { type Deadline, describeDeadline } from "./deadline";

export type VendorRequirementRow = {
  id: string;
  referenceNumber: string | null;
  project: string;
  closesAt: string;
  quoteStatus: "DRAFT" | "SUBMITTED" | null;
};

export type VendorDashboardInput = {
  requirements: VendorRequirementRow[];
  now?: Date;
};

export type VendorNextAction = {
  id: string;
  referenceNumber: string | null;
  project: string;
  deadline: Deadline;
  action: "SUBMIT" | "CONTINUE" | "VIEW";
  actionLabel: string;
};

/** Three fits the card without scrolling; the rest live on the list page. */
const NEXT_ACTION_LIMIT = 3;

const ACTION_LABEL = {
  SUBMIT: "Submit quote",
  CONTINUE: "Continue draft",
  VIEW: "View quote",
} as const;

function actionFor(status: VendorRequirementRow["quoteStatus"]): VendorNextAction["action"] {
  if (status === "SUBMITTED") return "VIEW";
  if (status === "DRAFT") return "CONTINUE";
  return "SUBMIT";
}

/**
 * Turns the vendor's open requirements into the overview: four counts and the
 * handful of items worth acting on now.
 *
 * The caller passes only requirements this vendor may see — the worker query
 * has already filtered by the session's vendor id. This function does no
 * access control and must never be handed an unfiltered list.
 */
export function summariseVendorDashboard({ requirements, now = new Date() }: VendorDashboardInput) {
  const counts = {
    open: requirements.length,
    // Work already submitted is not "due": counting it would push a supplier
    // back into a form they have finished.
    dueSoon: requirements.filter(
      (r) => r.quoteStatus !== "SUBMITTED" && describeDeadline(r.closesAt, now).urgent
    ).length,
    submitted: requirements.filter((r) => r.quoteStatus === "SUBMITTED").length,
    drafts: requirements.filter((r) => r.quoteStatus === "DRAFT").length,
  };

  const nextActions: VendorNextAction[] = [...requirements]
    .sort((a, b) => new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime())
    .slice(0, NEXT_ACTION_LIMIT)
    .map((r) => {
      const action = actionFor(r.quoteStatus);
      return {
        id: r.id,
        referenceNumber: r.referenceNumber,
        project: r.project,
        deadline: describeDeadline(r.closesAt, now),
        action,
        actionLabel: ACTION_LABEL[action],
      };
    });

  return { counts, nextActions };
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run packages/rfq/src/vendor-dashboard.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Export and commit**

In `packages/rfq/src/index.ts`, add:

```ts
export {
  summariseVendorDashboard,
  type VendorDashboardInput,
  type VendorNextAction,
  type VendorRequirementRow,
} from "./vendor-dashboard";
```

Run: `npm test`
Expected: PASS.

```bash
git add packages/rfq/src/vendor-dashboard.ts packages/rfq/src/vendor-dashboard.test.ts packages/rfq/src/index.ts
git commit -m "feat: vendor overview view-model with counts and next actions"
```

---

### Task 4: Make the vendor worker `/dashboard` endpoint usable

**Files:**

- Modify: `workers/vendor-api/src/handlers.ts:147-207`
- Modify: `workers/vendor-api/src/requirements.ts`

**Interfaces:**

- Consumes: `VendorRequirementRow` shape from Task 3; `listOpenForVendor` already in `requirements.ts:20`.
- Produces: `GET /dashboard` returning
  `{ vendor: {...}, registration: {...} | null, requirements: VendorRequirementRow[] }`.
  Task 10's page consumes this.

`handleDashboard` already exists but nothing calls it, and it has two defects: it returns 404 when `registrationId` is null (every admin-created vendor), and it returns no requirement data at all. Fix both rather than adding a second endpoint.

- [ ] **Step 1: Add the overview query**

In `workers/vendor-api/src/requirements.ts`, below `listOpenForVendor`:

```ts
/**
 * The same visibility rule as listOpenForVendor, narrowed to the columns the
 * overview paints. Scope of work and currency are omitted: the overview shows
 * a project name and a deadline, and shipping the full scope text for every
 * open requirement is the kind of over-fetch this redesign exists to remove.
 */
export function listOverviewForVendor(sql: Sql, vendorUserId: string) {
  return sql`
    SELECT r.id, r."referenceNumber", r.project, r."closesAt",
           q.status AS "quoteStatus"
    FROM "RequirementInvite" i
    JOIN "Requirement" r ON r.id = i."requirementId"
    LEFT JOIN "Quote" q
      ON q."requirementId" = r.id AND q."vendorUserId" = ${vendorUserId}
    WHERE i."vendorUserId" = ${vendorUserId}
      AND r.status = 'OPEN'
      AND r."closesAt" > NOW()
    ORDER BY r."closesAt" ASC
    LIMIT 100
  `;
}
```

- [ ] **Step 2: Rewrite `handleDashboard`**

Replace the body of `handleDashboard` in `workers/vendor-api/src/handlers.ts` (lines 147-207) with:

```ts
export async function handleDashboard(sql: Sql, env: Env, request: Request): Promise<Response> {
  const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

  // Admin-created suppliers have no registration. Skipping the query rather
  // than passing null into the WHERE is what stops this endpoint 404ing for
  // every account RVCC created directly.
  const registrationQuery = vendor.registrationId
    ? sql`
        SELECT
          r.id, r.status, r."referenceNumber", r."submittedAt",
          r.email, r."businessRelationship", r."productCategories",
          c."legalName" AS "companyLegalName",
          c."dbaName" AS "companyDbaName",
          c.country AS "companyCountry",
          c."organizationType" AS "companyOrganizationType",
          c.website AS "companyWebsite"
        FROM "SupplierRegistration" r
        LEFT JOIN "CompanyProfile" c ON c."registrationId" = r.id
        WHERE r.id = ${vendor.registrationId}
        LIMIT 1
      `
    : Promise.resolve([] as unknown[]);

  const [registrationRows, requirementRows] = await Promise.all([
    registrationQuery,
    listOverviewForVendor(sql, vendor.id),
  ]);

  const registration = (registrationRows as Record<string, unknown>[])[0];

  return json(env, request, {
    vendor: {
      id: vendor.id,
      email: vendor.email,
      name: vendor.name,
      mustChangePassword: vendor.mustChangePassword,
      registrationId: vendor.registrationId,
    },
    // Null rather than 404: a supplier with no registration still has a
    // working portal, and the page says so in words.
    registration: registration
      ? {
          id: String(registration.id),
          status: String(registration.status),
          referenceNumber: registration.referenceNumber as string | null,
          submittedAt: registration.submittedAt as string | null,
          email: String(registration.email ?? ""),
          businessRelationship: String(registration.businessRelationship ?? ""),
          productCategories: (registration.productCategories as string[]) ?? [],
          company: registration.companyLegalName
            ? {
                legalName: String(registration.companyLegalName ?? ""),
                dbaName: String(registration.companyDbaName ?? ""),
                country: String(registration.companyCountry ?? ""),
                organizationType: String(registration.companyOrganizationType ?? ""),
                website: String(registration.companyWebsite ?? ""),
              }
            : null,
        }
      : null,
    requirements: (requirementRows as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      referenceNumber: r.referenceNumber as string | null,
      project: String(r.project ?? ""),
      closesAt: new Date(r.closesAt as string).toISOString(),
      quoteStatus: (r.quoteStatus as "DRAFT" | "SUBMITTED" | null) ?? null,
    })),
  });
}
```

- [ ] **Step 3: Update the import at the top of `handlers.ts`**

Find the existing import from `./requirements` and add `listOverviewForVendor` to it. If `handleDashboard` did not previously import from that module, add:

```ts
import { listOverviewForVendor } from "./requirements";
```

- [ ] **Step 4: Type-check the worker**

Run: `cd workers/vendor-api && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Run the suite**

Run: `npm test`
Expected: PASS — `workers/vendor-api/src/db.test.ts` still green.

- [ ] **Step 6: Commit**

```bash
git add workers/vendor-api/src/handlers.ts workers/vendor-api/src/requirements.ts
git commit -m "fix: vendor /dashboard returns requirements and survives accounts with no registration"
```

---

## Phase 2 — Admin query weight

### Task 5: Move supplier performance off the dashboard

**Files:**

- Create: `apps/admin/src/app/(protected)/vendors/performance/page.tsx`
- Modify: `apps/admin/src/app/(protected)/page.tsx:24-70`

**Interfaces:**

- Consumes: `summariseVendorPerformance` from `@repo/rfq` (unchanged), `pageCount`/`pageWindow`/`parsePage` from Task 2.
- Produces: route `/vendors/performance`. Task 9 streams what remains of the dashboard.

The dashboard's slowest query fetches 100 vendors with two date-filtered relation counts and a nested awarded-quote lookup each, to paint a table below the fold. Moving it means only the person who wants the report pays for it.

**Deliberate deviation from the spec.** The spec's admin KPI row lists "response rate over 90 days". That number cannot be computed without the query this task is removing, so it does not appear on the dashboard — it lives on `/vendors/performance`, one click away, with a link from the dashboard. Restoring it to the KPI row would reintroduce the exact cost this plan exists to remove.

- [ ] **Step 1: Create the performance page**

Create `apps/admin/src/app/(protected)/vendors/performance/page.tsx`. Move the `vendors` query and the whole "Supplier performance" `<section>` out of the dashboard verbatim, then wrap it in a page with paging:

```tsx
import { pageCount, pageWindow, parsePage, summariseVendorPerformance } from "@repo/rfq";
import { Pagination } from "@repo/ui";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Ninety days. An all-time average hides a supplier who has recently stopped replying. */
const WINDOW_DAYS = 90;

export default async function SupplierPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = parsePage(rawPage);
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000);

  const [total, vendors] = await Promise.all([
    prisma.vendorUser.count({ where: { isActive: true } }),
    prisma.vendorUser.findMany({
      where: { isActive: true },
      select: {
        email: true,
        _count: {
          select: {
            invites: { where: { createdAt: { gte: since } } },
            quotes: { where: { status: "SUBMITTED", submittedAt: { gte: since } } },
          },
        },
        quotes: {
          where: { status: "SUBMITTED", awardedFor: { isNot: null } },
          select: { id: true },
        },
      },
      orderBy: { email: "asc" },
      ...pageWindow(page),
    }),
  ]);

  const performance = summariseVendorPerformance(
    vendors.map((v) => ({
      email: v.email,
      invited: v._count.invites,
      submitted: v._count.quotes,
      won: v.quotes.length,
    }))
  );

  const pages = pageCount(total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          Supplier performance
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Response and win rates over the last {WINDOW_DAYS} days.
        </p>
      </div>

      {performance.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
          No active suppliers yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs tracking-wide text-zinc-600 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Supplier</th>
                <th className="px-4 py-3 font-semibold">Invited</th>
                <th className="px-4 py-3 font-semibold">Quoted</th>
                <th className="px-4 py-3 font-semibold">Response</th>
                <th className="px-4 py-3 font-semibold">Won</th>
                <th className="px-4 py-3 font-semibold">Win rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {performance.map((p) => (
                <tr key={p.email} className="transition-colors hover:bg-zinc-50">
                  <td className="px-4 py-3 text-zinc-950">{p.email}</td>
                  <td className="px-4 py-3 text-zinc-700 tabular-nums">{p.invited}</td>
                  <td className="px-4 py-3 text-zinc-700 tabular-nums">{p.submitted}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {/* Never invited reads as a dash: 0% would imply they ignored us. */}
                    <span
                      className={
                        p.invited > 0 && p.responseRate < 50
                          ? "font-semibold text-red-700"
                          : "text-zinc-700"
                      }
                    >
                      {p.invited === 0 ? "—" : `${p.responseRate}%`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 tabular-nums">{p.won}</td>
                  <td className="px-4 py-3 text-zinc-700 tabular-nums">
                    {p.submitted === 0 ? "—" : `${p.winRate}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        pages={pages}
        total={total}
        noun="suppliers"
        href={(n) => `/vendors/performance?page=${n}`}
      />
    </div>
  );
}
```

- [ ] **Step 2: Remove it from the dashboard**

In `apps/admin/src/app/(protected)/page.tsx`: delete the `vendors` entry from the `Promise.all` array (lines 35-51), delete the `performance` calculation (lines 56-63), delete the entire "Supplier performance" `<section>` (lines 123-172), and remove the now-unused `summariseVendorPerformance` import and `WINDOW_DAYS`/`since` constants. Add a link into the vendors section header so staff can still find the report:

```tsx
<Link
  href="/vendors/performance"
  className="text-brand-blue text-sm font-semibold underline-offset-2 hover:underline"
>
  Supplier performance
</Link>
```

- [ ] **Step 3: Verify the dashboard no longer runs the vendor query**

Run: `cd apps/admin && npm run dev`

Load `http://localhost:3001/` and confirm in the terminal that the Prisma query log no longer shows the `VendorUser` findMany with nested counts. Then load `/vendors/performance` and confirm the table renders with working Previous/Next.

- [ ] **Step 4: Type-check, lint, commit**

Run: `cd apps/admin && npx tsc --noEmit && npm run lint`
Expected: no errors.

```bash
git add "apps/admin/src/app/(protected)/page.tsx" "apps/admin/src/app/(protected)/vendors/performance/page.tsx"
git commit -m "perf: move supplier performance report off the admin dashboard"
```

---

### Task 6: Paginate and narrow the registrations list

**Files:**

- Modify: `apps/admin/src/app/(protected)/registrations/page.tsx:43-103`

**Interfaces:**

- Consumes: `pageCount`, `pageWindow`, `parsePage` from Task 2. Import them from `@repo/rfq`.
- Produces: `?page=` on `/registrations`, preserved alongside the existing `?status=` and `?q=`.

This is the heaviest query in the application: 100 registrations, each with company profile, up to 8 contacts, up to 8 addresses, linked vendor accounts, and a bank-account count — roughly 500 correlated subquery results to paint a table that shows none of them.

- [ ] **Step 1: Read the current file end to end**

Run: `cat "apps/admin/src/app/(protected)/registrations/page.tsx"`

Note exactly which fields the table body renders. Only those survive into the new `select`. Everything else moves to the detail page at `registrations/[id]/page.tsx`, which already loads its own data.

- [ ] **Step 2: Replace the query**

Change the `searchParams` type to include `page`, then replace the `Promise.all` block:

```tsx
const { status, q, page: rawPage } = await searchParams;
const page = parsePage(rawPage);

const [total, registrations, admin] = await Promise.all([
  prisma.supplierRegistration.count({ where }),
  prisma.supplierRegistration.findMany({
    where,
    // Only what the table paints. Contacts, addresses, classifications and
    // bank accounts belong to the detail page, which already loads them.
    select: {
      id: true,
      referenceNumber: true,
      status: true,
      email: true,
      submittedAt: true,
      updatedAt: true,
      company: { select: { legalName: true } },
    },
    orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
    ...pageWindow(page),
  }),
  getAdminFromSession(),
]);

const pages = pageCount(total);
```

Keep the existing `where` construction exactly as it is. If any table cell referenced a relation that is no longer selected, replace that cell with the corresponding field from the select above, or drop the column — do not re-add the relation.

- [ ] **Step 3: Add the pagination control**

Below the table, using the same markup as Task 5 but with the filters preserved so paging does not reset the user's search:

Import `Pagination` from `@repo/ui`, then render below the table:

```tsx
<Pagination
  page={page}
  pages={pages}
  total={total}
  noun="registrations"
  href={(n) => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (q) p.set("q", q);
    p.set("page", String(n));
    return `/registrations?${p.toString()}`;
  }}
/>
```

- [ ] **Step 4: Verify behaviour and query weight**

With `npm run dev` in `apps/admin`, confirm:

- `/registrations` shows 25 rows and a correct total.
- `/registrations?status=SUBMITTED&q=test&page=2` keeps both filters on page 2.
- The Prisma log shows one count and one flat findMany — no contact or address subqueries.
- A row still opens its detail page with all information intact.

- [ ] **Step 5: Type-check, lint, commit**

Run: `cd apps/admin && npx tsc --noEmit && npm run lint`

```bash
git add "apps/admin/src/app/(protected)/registrations/page.tsx"
git commit -m "perf: paginate registrations list and drop five unrendered relations"
```

---

### Task 7: Paginate and parallelise the vendors list

**Files:**

- Modify: `apps/admin/src/app/(protected)/vendors/page.tsx:63-85`

**Interfaces:**

- Consumes: `pageCount`, `pageWindow`, `parsePage` from Task 2. Import them from `@repo/rfq`.
- Produces: `?page=` on `/vendors`, preserved alongside `?filter=` and `?q=`.

The page currently awaits industries, then awaits vendors. The two are unrelated, so one of those waits is free to remove.

- [ ] **Step 1: Combine the two awaits and add paging**

Replace the sequential `await prisma.industry.findMany(...)` and `await prisma.vendorUser.findMany(...)` with:

```tsx
const { filter, q, page: rawPage } = await searchParams;
const page = parsePage(rawPage);

const [industries, total, vendors] = await Promise.all([
  prisma.industry.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  }),
  prisma.vendorUser.count({ where }),
  prisma.vendorUser.findMany({
    where,
    include: {
      registration: {
        select: {
          referenceNumber: true,
          status: true,
          company: { select: { legalName: true } },
        },
      },
      _count: {
        select: { sessions: { where: { revokedAt: null, expiresAt: { gt: new Date() } } } },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    ...pageWindow(page),
  }),
]);

const pages = pageCount(total);
```

Keep the existing `where` and `isActive` filter logic unchanged. If the existing `industry.findMany` used a different `where`, keep that one — the only change here is moving it into the `Promise.all`.

- [ ] **Step 2: Add pagination markup**

Import `Pagination` from `@repo/ui`, then render below the table. The filter and search must survive paging — dropping them would silently reset the user's search:

```tsx
<Pagination
  page={page}
  pages={pages}
  total={total}
  noun="vendors"
  href={(n) => {
    const p = new URLSearchParams();
    if (filter) p.set("filter", filter);
    if (q) p.set("q", q);
    p.set("page", String(n));
    return `/vendors?${p.toString()}`;
  }}
/>
```

- [ ] **Step 3: Verify**

With the dev server running, confirm `/vendors` shows 25 rows, the industry filter still populates, `?filter=…&q=…&page=2` preserves both, and row actions still work.

- [ ] **Step 4: Type-check, lint, commit**

Run: `cd apps/admin && npx tsc --noEmit && npm run lint`

```bash
git add "apps/admin/src/app/(protected)/vendors/page.tsx"
git commit -m "perf: paginate vendors list and parallelise its two queries"
```

---

### Task 8: Narrow the requirements list

**Files:**

- Modify: `apps/admin/src/app/(protected)/requirements/page.tsx:25-38`

**Interfaces:**

- Consumes: `pageCount`, `pageWindow`, `parsePage` from Task 2. Import them from `@repo/rfq`.
- Produces: `?page=` on `/requirements`.

The `quotes: { where: { status: "SUBMITTED" }, select: { id: true } }` include exists only so the page can count submitted quotes. A `_count` does that without transferring a row per quote.

- [ ] **Step 1: Replace the include with counts and add paging**

```tsx
const { page: rawPage } = await searchParams;
const page = parsePage(rawPage);

const [total, requirements, vendors] = await Promise.all([
  prisma.requirement.count(),
  prisma.requirement.findMany({
    select: {
      id: true,
      referenceNumber: true,
      project: true,
      status: true,
      closesAt: true,
      awardedQuoteId: true,
      _count: {
        select: {
          invites: true,
          // Counted, not listed: the page renders a number, and shipping one
          // row per quote to produce it is pure waste.
          quotes: { where: { status: "SUBMITTED" } },
        },
      },
    },
    orderBy: [{ closesAt: "asc" }],
    ...pageWindow(page),
  }),
  prisma.vendorUser.findMany({
    where: { isActive: true },
    select: { id: true, email: true, name: true },
    orderBy: { email: "asc" },
  }),
]);
```

Add `searchParams: Promise<{ page?: string }>` to the component props. Then change every `r.quotes.length` in the JSX to `r._count.quotes`.

- [ ] **Step 2: Confirm no other field is missing**

Run: `cd apps/admin && npx tsc --noEmit`

TypeScript will name any field the JSX reads that the new `select` omits. Add only those fields — do not restore the `quotes` include.

- [ ] **Step 3: Add pagination markup**

Import `Pagination` from `@repo/ui`, then render below the table:

```tsx
<Pagination
  page={page}
  pages={pages}
  total={total}
  noun="requirements"
  href={(n) => `/requirements?page=${n}`}
/>
```

- [ ] **Step 4: Verify and commit**

Confirm in the browser that invite and quote counts still show the same numbers as before the change, on a requirement that has both.

Run: `cd apps/admin && npm run lint`

```bash
git add "apps/admin/src/app/(protected)/requirements/page.tsx"
git commit -m "perf: count submitted quotes instead of listing them on requirements list"
```

---

## Phase 3 — Streaming

### Task 9: Stream each region behind its own boundary

**Files:**

- Create: `packages/ui/src/skeleton.tsx`
- Modify: `packages/ui/src/index.ts`
- Create: `apps/admin/src/sections/DashboardKpis.tsx`, `apps/admin/src/sections/DashboardQueue.tsx`, `apps/admin/src/sections/DashboardActivity.tsx`
- Modify: `apps/admin/src/app/(protected)/page.tsx`

**Interfaces:**

- Consumes: nothing from earlier tasks except the slimmed dashboard from Task 5.
- Produces: `<Skeleton>` and `<SkeletonCard>` from `@repo/ui`; three async server components, each owning its own query.

Today every protected route is `force-dynamic` behind a single segment-level `loading.tsx`, so one slow query holds back the sidebar and the navigation the user was reaching for.

- [ ] **Step 1: Create the skeleton primitives**

Create `packages/ui/src/skeleton.tsx`:

```tsx
/**
 * Shapes that match what replaces them. A skeleton of the wrong height moves
 * the page when real content lands, which reads as slower than no skeleton.
 *
 * The pulse is dropped under prefers-reduced-motion; the shape stays, so the
 * layout is still held.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-zinc-200 motion-reduce:animate-none ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-16" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 border-b border-zinc-100 px-4 py-3 last:border-0">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="ml-auto h-4 w-16" />
    </div>
  );
}
```

Add to `packages/ui/src/index.ts`:

```ts
export * from "./skeleton";
```

- [ ] **Step 2: Extract the KPI region into its own async component**

Create `apps/admin/src/sections/DashboardKpis.tsx`, moving the four headline counts and the four registration-status counts out of the page. The component runs its own `Promise.all` — the queries move with it:

```tsx
import { KpiCard } from "@repo/ui";

import { prisma } from "@/lib/db";

const CARDS = [
  { key: "SUBMITTED", label: "Awaiting review", href: "/registrations?status=SUBMITTED" },
  { key: "APPROVED", label: "Approved", href: "/registrations?status=APPROVED" },
  { key: "REJECTED", label: "Rejected", href: "/registrations?status=REJECTED" },
  { key: "DRAFT", label: "In progress", href: "/registrations?status=DRAFT" },
] as const;

export async function DashboardKpis() {
  const now = new Date();
  const in48h = new Date(Date.now() + 48 * 3_600_000);

  const [grouped, activeVendors, openCount, closingSoon, awaitingAward] = await Promise.all([
    prisma.supplierRegistration.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.vendorUser.count({ where: { isActive: true } }),
    prisma.requirement.count({ where: { status: "OPEN", closesAt: { gt: now } } }),
    prisma.requirement.count({ where: { status: "OPEN", closesAt: { gt: now, lte: in48h } } }),
    // Closed but not yet awarded — work waiting on staff rather than suppliers.
    prisma.requirement.count({ where: { status: "OPEN", closesAt: { lte: now } } }),
  ]);

  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));

  const headline = [
    { label: "Active suppliers", value: activeVendors, href: "/vendors" },
    { label: "Open requirements", value: openCount, href: "/requirements" },
    { label: "Closing in 48h", value: closingSoon, href: "/requirements" },
    { label: "Awaiting award", value: awaitingAward, href: "/requirements" },
    ...CARDS.map((c) => ({ label: c.label, value: counts[c.key] ?? 0, href: c.href })),
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {headline.map((c) => (
        <KpiCard key={c.label} label={c.label} value={c.value} href={c.href} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create the priority queue region**

Create `apps/admin/src/sections/DashboardQueue.tsx`. It answers "what needs a person right now" in three bounded lists, five rows each:

```tsx
import Link from "next/link";

import { describeDeadline } from "@repo/rfq";

import { prisma } from "@/lib/db";

const LIMIT = 5;

export async function DashboardQueue() {
  const now = new Date();
  const in48h = new Date(Date.now() + 48 * 3_600_000);

  const [needsReview, closingSoon, awaitingAward] = await Promise.all([
    prisma.supplierRegistration.findMany({
      where: { status: "SUBMITTED" },
      select: { id: true, referenceNumber: true, email: true, submittedAt: true },
      orderBy: { submittedAt: "asc" },
      take: LIMIT,
    }),
    prisma.requirement.findMany({
      where: { status: "OPEN", closesAt: { gt: now, lte: in48h } },
      select: { id: true, project: true, closesAt: true },
      orderBy: { closesAt: "asc" },
      take: LIMIT,
    }),
    prisma.requirement.findMany({
      where: { status: "OPEN", closesAt: { lte: now }, awardedQuoteId: null },
      select: { id: true, project: true, closesAt: true },
      orderBy: { closesAt: "asc" },
      take: LIMIT,
    }),
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <QueueCard title="Needs review" empty="No registrations waiting.">
        {needsReview.map((r) => (
          <QueueRow
            key={r.id}
            href={`/registrations/${r.id}`}
            primary={r.referenceNumber ?? r.email}
            secondary={r.submittedAt?.toLocaleDateString("en-GB") ?? "Not submitted"}
          />
        ))}
      </QueueCard>

      <QueueCard title="Closing soon" empty="Nothing closes in the next 48 hours.">
        {closingSoon.map((r) => (
          <QueueRow
            key={r.id}
            href={`/requirements/${r.id}`}
            primary={r.project}
            secondary={describeDeadline(r.closesAt).label}
            urgent
          />
        ))}
      </QueueCard>

      <QueueCard title="Awaiting award" empty="No closed requirements need a decision.">
        {awaitingAward.map((r) => (
          <QueueRow
            key={r.id}
            href={`/requirements/${r.id}`}
            primary={r.project}
            secondary="Closed — award pending"
          />
        ))}
      </QueueCard>
    </div>
  );
}

function QueueCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const rows = Array.isArray(children) ? children : [children];
  const isEmpty = rows.flat().filter(Boolean).length === 0;

  return (
    <section className="border-brand-blue rounded-lg border border-l-4 border-zinc-200 bg-white">
      <h3 className="border-b border-zinc-200 px-4 py-3 text-xs font-bold tracking-[0.12em] text-zinc-600 uppercase">
        {title}
      </h3>
      {isEmpty ? <p className="px-4 py-4 text-sm text-zinc-600">{empty}</p> : <ul>{children}</ul>}
    </section>
  );
}

function QueueRow({
  href,
  primary,
  secondary,
  urgent = false,
}: {
  href: string;
  primary: string;
  secondary: string;
  urgent?: boolean;
}) {
  return (
    <li className="border-b border-zinc-100 last:border-0">
      <Link
        href={href}
        className="focus-visible:ring-brand-blue flex min-h-11 items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:-outline-offset-2 focus-visible:outline-none"
      >
        <span className="truncate text-sm font-medium text-zinc-950">{primary}</span>
        <span
          className={`shrink-0 text-xs tabular-nums ${urgent ? "font-semibold text-zinc-950" : "text-zinc-600"}`}
        >
          {urgent ? `⏱ ${secondary}` : secondary}
        </span>
      </Link>
    </li>
  );
}
```

- [ ] **Step 4: Create the activity region**

Create `apps/admin/src/sections/DashboardActivity.tsx` with a single bounded query — the ten most recently updated requirements, each linking to its detail page:

```tsx
import Link from "next/link";

import { prisma } from "@/lib/db";

export async function DashboardActivity() {
  const recent = await prisma.requirement.findMany({
    select: {
      id: true,
      project: true,
      referenceNumber: true,
      status: true,
      updatedAt: true,
      awardedQuoteId: true,
      _count: { select: { quotes: { where: { status: "SUBMITTED" } } } },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  if (recent.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
        No sourcing activity yet. Create a requirement to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
      {recent.map((r) => (
        <li key={r.id}>
          <Link
            href={`/requirements/${r.id}`}
            className="focus-visible:ring-brand-blue flex min-h-11 flex-wrap items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:-outline-offset-2 focus-visible:outline-none"
          >
            <span className="text-sm font-medium text-zinc-950">
              {r.project}
              {r.referenceNumber ? (
                <span className="ml-2 text-xs text-zinc-500">{r.referenceNumber}</span>
              ) : null}
            </span>
            <span className="text-xs text-zinc-600 tabular-nums">
              {r.awardedQuoteId ? "Awarded" : `${r._count.quotes} quotes`} ·{" "}
              {r.updatedAt.toLocaleDateString("en-GB")}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 5: Rewrite the dashboard page as boundaries only**

Replace `apps/admin/src/app/(protected)/page.tsx` entirely. It now owns no queries, so it renders instantly:

```tsx
import { Suspense } from "react";

import Link from "next/link";

import { SkeletonCard, SkeletonRow } from "@repo/ui";

import { DashboardActivity } from "@/sections/DashboardActivity";
import { DashboardKpis } from "@/sections/DashboardKpis";
import { DashboardQueue } from "@/sections/DashboardQueue";

export const dynamic = "force-dynamic";

/**
 * The page itself queries nothing, so the header and its actions paint on the
 * first flush. Each region below streams in on its own — a slow activity query
 * no longer holds back the KPI row or the navigation around it.
 */
export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">Sourcing activity and vendor registrations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/requirements"
            className="bg-brand-blue focus-visible:ring-brand-blue inline-flex min-h-11 items-center rounded-md px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Create requirement
          </Link>
          <Link
            href="/vendors"
            className="focus-visible:ring-brand-blue inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400 focus-visible:ring-2 focus-visible:outline-none"
          >
            Add vendor
          </Link>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        }
      >
        <DashboardKpis />
      </Suspense>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-[0.12em] text-zinc-600 uppercase">
          Priority work
        </h2>
        <Suspense
          fallback={
            <div className="grid gap-4 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4">
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ))}
            </div>
          }
        >
          <DashboardQueue />
        </Suspense>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-[0.12em] text-zinc-600 uppercase">
            Recent activity
          </h2>
          <Link
            href="/vendors/performance"
            className="text-brand-blue text-sm font-semibold underline-offset-2 hover:underline"
          >
            Supplier performance
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="rounded-lg border border-zinc-200 bg-white">
              {Array.from({ length: 5 }, (_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          }
        >
          <DashboardActivity />
        </Suspense>
      </section>
    </div>
  );
}
```

- [ ] **Step 6: Verify streaming actually happens**

With the dev server running, open `http://localhost:3001/` with the network throttled to "Slow 3G" in devtools. Confirm the header, both buttons, and the sidebar are visible and clickable while the KPI skeletons are still showing. If everything appears at once, a query is still running in the page component — find it and move it into a region.

- [ ] **Step 7: Type-check, lint, commit**

Run: `cd apps/admin && npx tsc --noEmit && npm run lint`

```bash
git add packages/ui/src/skeleton.tsx packages/ui/src/index.ts apps/admin/src/sections/Dashboard*.tsx "apps/admin/src/app/(protected)/page.tsx"
git commit -m "perf: stream admin dashboard regions behind independent Suspense boundaries"
```

---

## Phase 4 — Interface

### Task 10: Vendor overview rebuilt on the worker payload

**Files:**

- Create: `apps/vendor/src/sections/OverviewNextActions.tsx`
- Modify: `apps/vendor/src/app/(protected)/page.tsx`

**Interfaces:**

- Consumes: `GET /dashboard` from Task 4; `summariseVendorDashboard` from Task 3.
- Produces: nothing later tasks depend on.

The page currently loads the vendor's own filed paperwork via Prisma while showing nothing about quotes due.

- [ ] **Step 1: Replace the page**

Replace `apps/vendor/src/app/(protected)/page.tsx` entirely:

```tsx
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { type VendorRequirementRow, summariseVendorDashboard } from "@repo/rfq";
import { KpiCard, StatusBadge } from "@repo/ui";

import { VENDOR_COOKIE } from "@/lib/constants";
import { getVendorFromSession } from "@/lib/session";
import { vendorWorkerFetch } from "@/lib/vendor-api";
import { OverviewNextActions } from "@/sections/OverviewNextActions";

export const dynamic = "force-dynamic";

type DashboardPayload = {
  registration: {
    status: string;
    referenceNumber: string | null;
    submittedAt: string | null;
    company: { legalName: string } | null;
  } | null;
  requirements: VendorRequirementRow[];
};

export default async function VendorOverview() {
  const vendor = await getVendorFromSession();
  if (!vendor) return null;
  if (vendor.mustChangePassword) redirect("/password");

  const token = (await cookies()).get(VENDOR_COOKIE)?.value;

  let payload: DashboardPayload = { registration: null, requirements: [] };
  try {
    const res = await vendorWorkerFetch("/dashboard", { method: "GET", sessionToken: token });
    if (res.ok) payload = (await res.json()) as DashboardPayload;
  } catch (err) {
    // A failed overview must still render a usable page with working links.
    console.error("[vendor] dashboard fetch failed", err);
  }

  const { counts, nextActions } = summariseVendorDashboard({ requirements: payload.requirements });
  const companyName = payload.registration?.company?.legalName;

  const kpis = [
    { label: "Open invitations", value: counts.open },
    { label: "Due in 48h", value: counts.dueSoon },
    { label: "Submitted", value: counts.submitted },
    { label: "Drafts", value: counts.drafts },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            {companyName || vendor.name || vendor.email}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
            {payload.registration ? (
              <>
                <StatusBadge status={payload.registration.status} />
                {payload.registration.referenceNumber ? (
                  <span>{payload.registration.referenceNumber}</span>
                ) : null}
              </>
            ) : (
              <span>Account set up by RVCC</span>
            )}
          </div>
        </div>
        <Link
          href="/requirements"
          className="bg-brand-blue focus-visible:ring-brand-blue inline-flex min-h-11 items-center rounded-md px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          View requirements
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} />
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-[0.12em] text-zinc-600 uppercase">
          Your next actions
        </h2>
        <OverviewNextActions actions={nextActions} />
      </section>

      <p className="text-sm text-zinc-600">
        To correct your company details, contact RVCC procurement — editing from the portal is not
        yet available.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create the next-actions list**

Create `apps/vendor/src/sections/OverviewNextActions.tsx`:

```tsx
import Link from "next/link";

import type { VendorNextAction } from "@repo/rfq";

export function OverviewNextActions({ actions }: { actions: VendorNextAction[] }) {
  if (actions.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-4 text-sm text-zinc-600">
        No open requirements. RVCC will email you when you are invited to quote.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {actions.map((a) => (
        <li
          key={a.id}
          // The blue rail marks the item worth acting on first. Urgency is also
          // spelled out in the deadline text, so it never depends on the colour.
          className={`rounded-lg border border-zinc-200 bg-white p-4 ${
            a.deadline.urgent ? "border-brand-blue border-l-4" : ""
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-zinc-950">{a.project}</p>
              <p className="mt-0.5 text-sm text-zinc-600">
                {a.referenceNumber ? `${a.referenceNumber} · ` : ""}
                <span className={a.deadline.urgent ? "font-semibold text-zinc-950" : ""}>
                  {a.deadline.urgent ? `Closes soon — ${a.deadline.label}` : a.deadline.label}
                </span>
              </p>
            </div>
            <Link
              href={`/requirements/${a.id}`}
              className="bg-brand-blue focus-visible:ring-brand-blue inline-flex min-h-11 shrink-0 items-center rounded-md px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {a.actionLabel}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Verify against both account types**

Run both the vendor worker and `cd apps/vendor && npm run dev`.

- Sign in as a supplier who registered publicly: header shows company name and status badge, counts are correct, next actions list the nearest deadlines.
- Sign in as an **admin-created** supplier with no registration: the page renders with "Account set up by RVCC" and does **not** error. This is the case the old endpoint 404'd on — confirm it explicitly.
- Confirm the Prisma import is gone from this file; the page now takes one worker call and no direct database access.

- [ ] **Step 4: Type-check, lint, commit**

Run: `cd apps/vendor && npx tsc --noEmit && npm run lint`

```bash
git add "apps/vendor/src/app/(protected)/page.tsx" apps/vendor/src/sections/OverviewNextActions.tsx
git commit -m "feat: vendor overview shows work due instead of filed paperwork"
```

---

### Task 11: Vendor navigation and requirements list

**Files:**

- Modify: `apps/vendor/src/sections/VendorChrome.tsx:14-17`
- Modify: `apps/vendor/src/app/(protected)/requirements/page.tsx`

**Interfaces:**

- Consumes: `describeDeadline` from Task 2.
- Produces: nothing later tasks depend on.

`NAV` currently lists only Overview and Password. Requirements — the reason suppliers log in — is reachable only by typing the URL.

- [ ] **Step 1: Add Requirements to the nav**

In `apps/vendor/src/sections/VendorChrome.tsx`, change the import and the `NAV` array:

```tsx
import { ClipboardList, KeyRound, LayoutDashboard, LogOut } from "lucide-react";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/requirements", label: "Requirements", icon: ClipboardList },
  { href: "/password", label: "Password", icon: KeyRound },
];
```

The existing `useEffect` already prefetches every `NAV` entry, so Requirements is prefetched with no further change.

- [ ] **Step 2: Give nav links a focus ring and a touch target**

In the same file, in the `className` passed to `cn()` for each nav `<Link>`, change `px-3 py-1.5` to `min-h-11 px-4` and append `focus-visible:ring-brand-blue focus-visible:ring-2 focus-visible:outline-none`.

- [ ] **Step 3: Rebuild the requirements list as a card/table hybrid**

In `apps/vendor/src/app/(protected)/requirements/page.tsx`, delete the local `closesIn` function and import the shared one:

```tsx
import { describeDeadline } from "@repo/rfq";
```

Replace the `<ul>` block with cards on narrow screens and a table on wide. Each row gets a visible action rather than relying on the project name being a link:

```tsx
      ) : (
        <>
          {/* Cards below lg; the table below carries the same rows for wide screens. */}
          <ul className="space-y-3 lg:hidden">
            {rows.map((r) => {
              const d = describeDeadline(r.closesAt);
              return (
                <li
                  key={r.id}
                  className={`rounded-lg border border-zinc-200 bg-white p-4 ${
                    d.urgent ? "border-brand-blue border-l-4" : ""
                  }`}
                >
                  <p className="text-base font-semibold text-zinc-950">{r.project}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{r.scopeOfWork}</p>
                  <p className="mt-2 text-xs text-zinc-600">
                    {r.referenceNumber ?? ""} · {quoteLabel(r.quoteStatus)} · {d.label}
                  </p>
                  <Link
                    href={`/requirements/${r.id}`}
                    className="bg-brand-blue focus-visible:ring-brand-blue mt-3 inline-flex min-h-11 items-center rounded-md px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {r.quoteStatus === "SUBMITTED" ? "View quote" : "Open"}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs tracking-wide text-zinc-600 uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Project</th>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Your quote</th>
                  <th className="px-4 py-3 font-semibold">Closes</th>
                  <th className="px-4 py-3 font-semibold">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((r) => {
                  const d = describeDeadline(r.closesAt);
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-950">{r.project}</td>
                      <td className="px-4 py-3 text-zinc-600">{r.referenceNumber ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-700">{quoteLabel(r.quoteStatus)}</td>
                      <td className="px-4 py-3 tabular-nums">
                        <span className={d.urgent ? "font-semibold text-zinc-950" : "text-zinc-700"}>
                          {d.urgent ? `⏱ ${d.label}` : d.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/requirements/${r.id}`}
                          className="focus-visible:ring-brand-blue inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-4 font-semibold text-zinc-700 transition-colors hover:border-zinc-400 focus-visible:ring-2 focus-visible:outline-none"
                        >
                          {r.quoteStatus === "SUBMITTED" ? "View" : "Open"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
```

Add the label helper above the component:

```tsx
function quoteLabel(status: Row["quoteStatus"]) {
  if (status === "SUBMITTED") return "Submitted";
  if (status === "DRAFT") return "Draft saved";
  return "Not quoted yet";
}
```

- [ ] **Step 4: Verify at both breakpoints**

At 375px wide: Requirements is visible in the nav, cards show, every card's button is fully on screen and at least 44px tall. At 1440px: the table shows with the same data. Tab through the page and confirm every link takes a visible blue focus ring.

- [ ] **Step 5: Type-check, lint, commit**

Run: `cd apps/vendor && npx tsc --noEmit && npm run lint`

```bash
git add apps/vendor/src/sections/VendorChrome.tsx "apps/vendor/src/app/(protected)/requirements/page.tsx"
git commit -m "feat: surface Requirements in vendor nav and make the list responsive"
```

---

### Task 12: Requirement detail — deadline and quote state above the form

**Files:**

- Modify: `apps/vendor/src/app/(protected)/requirements/[id]/page.tsx`

**Interfaces:**

- Consumes: `describeDeadline` from Task 2.
- Produces: nothing.

A supplier opening a requirement should know how long they have and whether they have already quoted _before_ they start reading the form — not after scrolling past it.

- [ ] **Step 1: Read the page and locate the quote form**

Run: `cat "apps/vendor/src/app/(protected)/requirements/[id]/page.tsx"`

Note where `QuoteForm` (from `@repo/rfq`) is rendered, what the page already knows about the requirement's `closesAt` and the vendor's quote status, and whether the page shows a closed requirement differently. Do not change any query, any access check, or any field selected — this task is presentation only, and `sellingPrice` must stay unselected.

- [ ] **Step 2: Add a status band directly above the form**

Insert immediately before the form, using values the page already has in scope:

```tsx
{
  (() => {
    const d = describeDeadline(requirement.closesAt);
    const submitted = requirement.quoteStatus === "SUBMITTED";
    return (
      <div
        className={`rounded-lg border border-zinc-200 bg-white p-4 ${
          d.urgent && !submitted ? "border-brand-blue border-l-4" : ""
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-zinc-600 uppercase">
              {d.closed ? "Closed" : "Closes"}
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-950 tabular-nums">
              {d.closed ? "This requirement has closed" : d.label}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold tracking-[0.12em] text-zinc-600 uppercase">
              Your quote
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-950">
              {submitted
                ? "Submitted"
                : requirement.quoteStatus === "DRAFT"
                  ? "Draft saved — not submitted"
                  : "Not started"}
            </p>
          </div>
        </div>
        {d.urgent && !submitted ? (
          <p className="mt-3 text-sm font-semibold text-zinc-950">
            ⏱ Closing soon — submit your price before the deadline.
          </p>
        ) : null}
      </div>
    );
  })();
}
```

If the page's variable is not named `requirement`, or the quote status lives on a separate object, adapt the two field reads to whatever the page already has. Add nothing to the query to satisfy this band.

- [ ] **Step 3: Verify against all three states**

Confirm on a requirement that is: open with no quote (band reads "Not started"), open with a draft ("Draft saved — not submitted"), and already submitted (no urgency prompt, even inside 48 hours). Then confirm a closed requirement still renders the closed message rather than a 404, and that the form is disabled exactly as it was before this change.

- [ ] **Step 4: Type-check, lint, commit**

Run: `cd apps/vendor && npx tsc --noEmit && npm run lint`

```bash
git add "apps/vendor/src/app/(protected)/requirements/[id]/page.tsx"
git commit -m "feat: show deadline and quote state above the vendor quote form"
```

---

### Task 13: Admin chrome — reachable navigation on small screens

**Files:**

- Modify: `apps/admin/src/sections/AdminChrome.tsx`

**Interfaces:**

- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Read the file in full**

Run: `cat apps/admin/src/sections/AdminChrome.tsx`

It is 160 lines using `Sidebar`/`SidebarBody`/`SidebarLink` from `@/components/ui/sidebar`. Read `apps/admin/src/components/ui/sidebar.tsx` too, to find how the mobile branch decides to render and whether a menu control already exists.

- [ ] **Step 2: Ensure a persistent menu control exists below `lg`**

If the mobile branch renders a menu button only inside the drawer, or hides it on scroll, add a header bar that is always visible below `lg`:

```tsx
<div className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
  <button
    type="button"
    onClick={() => setMobileOpen(true)}
    aria-label="Open navigation menu"
    aria-expanded={mobileOpen}
    className="focus-visible:ring-brand-blue inline-flex h-11 w-11 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 focus-visible:ring-2 focus-visible:outline-none"
  >
    <Menu className="h-5 w-5" aria-hidden="true" />
  </button>
  <span className="text-sm font-semibold text-zinc-950">RVCC Administration</span>
  <div className="ml-auto">
    <NotificationBell />
  </div>
</div>
```

Import `Menu` from `lucide-react`. Wire `mobileOpen` to whatever open state the existing `Sidebar` component already exposes rather than adding a second source of truth.

- [ ] **Step 3: Make the drawer dismissible by keyboard**

Confirm the drawer closes on `Escape` and that focus returns to the menu button. If it does not, add:

```tsx
useEffect(() => {
  if (!mobileOpen) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") setMobileOpen(false);
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [mobileOpen]);
```

- [ ] **Step 4: Give every sidebar link a 44px target and focus ring**

In `SidebarContents`, ensure each `SidebarLink` renders with at least `min-h-11` and `focus-visible:ring-brand-blue focus-visible:ring-2 focus-visible:outline-none`.

- [ ] **Step 5: Verify**

At 375px: the menu button is visible on every admin page including mid-scroll; tapping it opens the drawer; every nav item is reachable; `Escape` closes it. At 1440px: the sidebar behaves exactly as it does today — this task must not change desktop behaviour.

- [ ] **Step 6: Type-check, lint, commit**

Run: `cd apps/admin && npx tsc --noEmit && npm run lint`

```bash
git add apps/admin/src/sections/AdminChrome.tsx apps/admin/src/components/ui/sidebar.tsx
git commit -m "fix: keep admin navigation reachable and keyboard-operable on small screens"
```

---

### Task 14: Admin tables — no action off-screen

**Files:**

- Modify: `apps/admin/src/app/(protected)/registrations/page.tsx`
- Modify: `apps/admin/src/app/(protected)/vendors/page.tsx`
- Modify: `apps/admin/src/app/(protected)/requirements/page.tsx`

**Interfaces:**

- Consumes: the narrowed queries from Tasks 6-8.
- Produces: nothing.

- [ ] **Step 1: Wrap each table so the identifying column stays put**

For each of the three list pages, wrap the `<table>` in `<div className="overflow-x-auto">` if it is not already, and make the first column sticky:

```tsx
<th className="sticky left-0 z-10 bg-zinc-50 px-4 py-3 font-semibold">Reference</th>
```

and on the matching body cell:

```tsx
<td className="sticky left-0 z-10 bg-white px-4 py-3 text-zinc-950">{r.referenceNumber ?? "—"}</td>
```

The explicit background on both is required — a transparent sticky cell shows the scrolling content sliding underneath it.

- [ ] **Step 2: Make filter chips scrollable rather than wrapped**

Where a page renders status or industry filters as a row, replace any wrapping container with:

```tsx
<div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
```

and give each chip `min-h-11 shrink-0 px-4` plus `focus-visible:ring-brand-blue focus-visible:ring-2 focus-visible:outline-none`.

- [ ] **Step 3: Give the search input full width on small screens**

Any search `<input>` on these pages gets `w-full min-h-11 sm:w-auto sm:min-w-64`.

- [ ] **Step 4: Confirm every row action is reachable**

At 375px, on each of the three lists, scroll each table horizontally to its right edge and confirm every action button in `RegistrationRowActions`, `VendorRowActions`, and `AwardButton` is fully visible and tappable. Any action that still clips must move into the sticky first column or become an accessible overflow menu — it may not simply be hidden.

- [ ] **Step 5: Type-check, lint, commit**

Run: `cd apps/admin && npx tsc --noEmit && npm run lint`

```bash
git add "apps/admin/src/app/(protected)/registrations/page.tsx" "apps/admin/src/app/(protected)/vendors/page.tsx" "apps/admin/src/app/(protected)/requirements/page.tsx"
git commit -m "fix: sticky key columns, scrollable filters, and no clipped row actions"
```

---

## Phase 5 — Verify and ship

### Task 15: Measure against the budget and deploy the Workers

**Files:**

- Create: `docs/superpowers/plans/2026-08-17-portal-latency.md` (results record)

**Interfaces:**

- Consumes: everything above.
- Produces: the numbers that decide whether this work is finished.

- [ ] **Step 1: Run the whole suite and both type-checks**

```bash
npm test
cd apps/admin && npx tsc --noEmit && npm run lint
cd ../vendor && npx tsc --noEmit && npm run lint
cd ../../workers/admin-api && npx tsc --noEmit
cd ../vendor-api && npx tsc --noEmit
```

Expected: all green. Fix anything that is not before continuing — do not record latency for a build that does not pass.

- [ ] **Step 2: Build both apps**

```bash
npm run build
```

Expected: both Next apps build. A type error that only appears here is a real failure, not a build quirk.

- [ ] **Step 3: Record latency for each route**

With production builds running (`npm run start` in each app), measure server response time five times per route and record the median:

| Route                | Portal | Budget                            |
| -------------------- | ------ | --------------------------------- |
| `/`                  | admin  | shell < 300 ms, complete < 800 ms |
| `/registrations`     | admin  | first row < 800 ms                |
| `/requirements`      | admin  | first row < 800 ms                |
| `/vendors`           | admin  | first row < 800 ms                |
| `/`                  | vendor | < 800 ms                          |
| `/requirements`      | vendor | < 800 ms                          |
| `/requirements/[id]` | vendor | < 1000 ms                         |

Use `curl -o /dev/null -s -w "%{time_starttransfer} %{time_total}\n" <url>` with a valid session cookie. `time_starttransfer` is the shell number; `time_total` is completion.

Write the results into `docs/superpowers/plans/2026-08-17-portal-latency.md` as a table with a "before" column taken from `git stash`-ing the branch, so the improvement is a number rather than an impression.

- [ ] **Step 4: Report any route still over budget**

If a route misses its target, say so plainly with its measured number and the query responsible — found by reading the Prisma log for that request. Do not mark this task complete with an unreported miss.

- [ ] **Step 5: Deploy both Workers**

The Worker client-reuse fix in `workers/admin-api/src/db.ts` and `workers/vendor-api/src/db.ts` is committed but unreleased. Until both are redeployed, production pays connection setup on every authenticated request and none of the above latency work is visible to users.

Confirm Node.js 22 or later (`node --version`), then deploy each Worker with Wrangler. **Ask the user before deploying** — this is an outward-facing action against production.

- [ ] **Step 6: Commit the results**

```bash
git add docs/superpowers/plans/2026-08-17-portal-latency.md
git commit -m "docs: record portal latency before and after the cockpit work"
```

---

## Known follow-up, deliberately out of scope

`workers/enquire-api/src/index.ts:76` still calls `sql.end({ timeout: 2 })` after every request — the same connection-churn bug this plan fixes in the admin and vendor Workers. It serves the public enquiry form, which is outside this scope. It should be the next piece of work.
