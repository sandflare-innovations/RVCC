> **SUPERSEDED, 2026-08-16.** "Agent" at RVCC means vendor. There is no separate agent audience,
> so this entire plan built something unnecessary. `apps/agent`, `workers/agent-api` and the
> `Agent*` tables have been removed. Kept only as a record of what was tried and why it was undone.

# Agent Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give field agents their own portal — admin creates the account, the agent signs in with a six-digit emailed code, and lands on a protected shell ready for the quote screens in Plan 3.

**Architecture:** Follows `main`'s backend-for-frontend split. A new `workers/agent-api` owns agent authentication and all database access via raw `postgres.js`; a new `apps/agent` is a thin Next.js front-end whose API routes forward the session cookie. SMTP stays exclusively on `workers/enquire-api`, which already owns it — `agent-api` asks it to send codes, exactly as `admin-api` does for decisions.

**Tech Stack:** TypeScript, Next.js 16.2.4 (App Router, React 19), Prisma 5.22 + PostgreSQL, Cloudflare Workers, Tailwind 4, Vitest 3, npm workspaces + Turborepo.

**Spec:** `docs/superpowers/specs/2026-08-15-requirement-quote-workflow-design.md`

**Predecessor:** `docs/superpowers/plans/2026-08-15-foundation-and-accounts.md` (Plan 1). Its "Changes made during execution" section records five things this plan depends on.

## Global Constraints

- **Base branch:** Plan 1's branch (`feat/foundation-and-accounts`) or a branch from it. Never `prod` — a diverged lineage with an incompatible schema.
- **Blocked until resolved by the user:** `main` and `prod` carry incompatible schemas against what looks like the same `DATABASE_URL`. Every migration step below targets the **local** `rvcc_main_test` database only.
- **This project uses `prisma db push`, not migrations.** There is no `migrations/` directory; `prisma migrate --name` would introduce one and change the convention.
- **`workers/*` are not npm workspaces.** Their dependencies install separately (`cd workers/agent-api && npm install`), and any module a root-level test imports must not transitively import `postgres`. Keep pure logic in its own file.
- **Wrangler requires Node ≥ 22**; the default here is 20.20.1. Run workers with `export PATH="$HOME/.nvm/versions/node/v24.14.0/bin:$PATH"`.
- **SMTP credentials live only on `workers/enquire-api`.** No other Worker sends mail directly.
- **Never return a plaintext OTP in an HTTP response.** It leaves only via SMTP.
- **The stale-cookie fix ships from the start** in `apps/agent` (see Task 5) — both existing portals needed it retrofitted.
- **Server Components by default.** `"use client"` only for genuine interaction.
- **Privileged actions write to `AuditLog`** (`action`, `entityType`, `entityId`, `metadata`).
- Commit after every task. Never `git commit --no-verify`.
- **Ports:** web 3000, admin 3001, vendor 3002, **agent 3003**; workers admin-api 8788, vendor-api 8789, **agent-api 8790**.

---

### Task 1: Agent models

Three models ported from the `feat/agent-portal` lineage, plus the `Industry.agents` side that Plan 1 deliberately deferred because `Agent` did not yet exist.

**Files:**

- Modify: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/agent.test.ts`

**Interfaces:**

- Consumes: `resetTestDatabase`, `testPrisma` from `packages/db/src/test-support.ts` (Plan 1, Task 1).
- Produces: `Agent`, `AgentOtp`, `AgentSession` tables, and `Industry.agents` — a second implicit many-to-many that Prisma names `_AgentToIndustry`.

- [ ] **Step 1: Write the failing test**

Create `packages/db/src/agent.test.ts`:

```ts
import { beforeEach, expect, test } from "vitest";

import { resetTestDatabase, testPrisma } from "./test-support";

beforeEach(async () => {
  await resetTestDatabase();
});

test("an agent can belong to several industries", async () => {
  const agent = await testPrisma.agent.create({
    data: {
      email: "agent@field.com",
      name: "Field Agent",
      industries: {
        create: [
          { name: "Civil Works", slug: "civil-works" },
          { name: "MEP", slug: "mep" },
        ],
      },
    },
    include: { industries: true },
  });

  expect(agent.industries.map((i) => i.slug).sort()).toEqual(["civil-works", "mep"]);
});

test("agent emails are unique", async () => {
  await testPrisma.agent.create({ data: { email: "dup@field.com" } });

  await expect(testPrisma.agent.create({ data: { email: "dup@field.com" } })).rejects.toThrow();
});

test("deleting an agent removes its sessions and leaves no orphans", async () => {
  const agent = await testPrisma.agent.create({ data: { email: "gone@field.com" } });
  await testPrisma.agentSession.create({
    data: {
      agentId: agent.id,
      tokenHash: "hash-1",
      expiresAt: new Date(Date.now() + 60_000),
    },
  });

  await testPrisma.agent.delete({ where: { id: agent.id } });

  expect(await testPrisma.agentSession.count()).toBe(0);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- agent`
Expected: FAIL — `testPrisma.agent` is undefined.

- [ ] **Step 3: Add the models**

Append to `packages/db/prisma/schema.prisma`:

```prisma
/// Field agents who quote on requirements. Deliberately separate from
/// VendorUser: agents authenticate by emailed code and have no password, and a
/// supplier must never be able to act as an agent.
model Agent {
  id       String  @id @default(cuid())
  email    String  @unique
  name     String  @default("")
  company  String  @default("")
  phone    String  @default("")
  isActive Boolean @default(true)

  lastLoginAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  sessions   AgentSession[]
  industries Industry[]

  @@index([email])
  @@index([isActive])
}

/// Single-use six-digit codes. Separate from RegistrationOtp, which belongs to
/// supplier registration — mixing two logins into one table would make both
/// harder to reason about.
model AgentOtp {
  id         String    @id @default(cuid())
  email      String
  codeHash   String
  attempts   Int       @default(0)
  expiresAt  DateTime
  consumedAt DateTime?
  createdAt  DateTime  @default(now())

  @@index([email])
  @@index([email, createdAt])
}

model AgentSession {
  id        String    @id @default(cuid())
  agentId   String
  agent     Agent     @relation(fields: [agentId], references: [id], onDelete: Cascade)
  tokenHash String    @unique
  userAgent String    @default("")
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())

  @@index([agentId])
}
```

and add to `model Industry`:

```prisma
  agents Agent[]
```

- [ ] **Step 4: Push and regenerate**

```bash
export $(grep DATABASE_URL_TEST .env.test | xargs)
DATABASE_URL="$DATABASE_URL_TEST" npx prisma db push \
  --schema=packages/db/prisma/schema.prisma --skip-generate --accept-data-loss
npx prisma generate --schema=packages/db/prisma/schema.prisma
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `npm test -- agent`
Expected: PASS, all three tests.

- [ ] **Step 6: Record the join-table name for Task 6**

```bash
psql "$DATABASE_URL_TEST" -c '\d "_AgentToIndustry"'
```

Prisma names implicit relation tables `_<ModelA>To<ModelB>` alphabetically, so `A` references `Agent` and `B` references `Industry` — the **opposite order** from `_IndustryToVendorUser`, where Industry is `A`. Use whatever the database reports; do not assume.

- [ ] **Step 7: Commit**

```bash
git add packages/db
git commit -m "feat(db): add Agent, AgentOtp and AgentSession"
```

---

### Task 2: Agent OTP logic, as a pure module

The code generation and verification rules go in their own file with no database or Worker imports, so they are testable from the repo root — `workers/*` are not npm workspaces and cannot resolve `postgres` there.

Two rules here deliberately **improve on** the existing `handleOtpRequest` in `workers/enquire-api`, which should not be copied as-is:

- It generates codes with `Math.random()`. That is not a CSPRNG and its output is predictable. Use `crypto.getRandomValues`.
- It enforces no attempts cap on verify, leaving a six-digit code open to brute force. Cap attempts.

**Files:**

- Create: `workers/agent-api/src/otp.ts`
- Create: `workers/agent-api/src/otp.test.ts`
- Create: `workers/agent-api/package.json`, `tsconfig.json`, `wrangler.toml`

**Interfaces:**

- Consumes: nothing.
- Produces: `generateOtpCode(): string`, `isWellFormedCode(code: string): boolean`, `normaliseEmail(email: string): string`, and the constants `OTP_TTL_MS`, `OTP_MAX_PER_HOUR`, `OTP_MAX_ATTEMPTS`.

- [ ] **Step 1: Scaffold the Worker**

Copy `workers/vendor-api/{package.json,tsconfig.json,wrangler.toml}` to `workers/agent-api/` and change the name to `rvcc-agent-api` in both `package.json` and `wrangler.toml`. In `wrangler.toml`, add `http://localhost:3003` to `ALLOWED_ORIGINS` and document the secrets it needs:

```
# Secrets (wrangler secret put …):
#   API_SECRET          — shared with apps/agent AGENT_API_SECRET
#   DATABASE_URL        — only if not using Hyperdrive yet
#   ENQUIRE_API_SECRET  — shared with enquire Worker API_SECRET (for OTP mail)
#   ENQUIRE_WORKER_URL  — https://rvcc-enquire-api.rvcc.workers.dev
```

Then install: `cd workers/agent-api && npm install`

- [ ] **Step 2: Write the failing test**

Create `workers/agent-api/src/otp.test.ts`:

```ts
import { expect, test } from "vitest";

import { OTP_MAX_ATTEMPTS, generateOtpCode, isWellFormedCode, normaliseEmail } from "./otp";

test("generates a six-digit code", () => {
  for (let i = 0; i < 200; i++) {
    expect(generateOtpCode()).toMatch(/^\d{6}$/);
  }
});

test("generated codes are not all identical", () => {
  const seen = new Set(Array.from({ length: 50 }, () => generateOtpCode()));
  // A constant or badly seeded generator collapses to one value.
  expect(seen.size).toBeGreaterThan(1);
});

test("rejects malformed codes", () => {
  expect(isWellFormedCode("123456")).toBe(true);
  expect(isWellFormedCode("12345")).toBe(false);
  expect(isWellFormedCode("1234567")).toBe(false);
  expect(isWellFormedCode("12345a")).toBe(false);
  expect(isWellFormedCode(" 123456 ")).toBe(false);
  expect(isWellFormedCode("")).toBe(false);
});

test("normalises email casing and whitespace", () => {
  expect(normaliseEmail("  Agent@Field.COM ")).toBe("agent@field.com");
});

test("the attempts cap is small enough to matter", () => {
  // A six-digit code has a 1-in-a-million guess rate; an uncapped or generous
  // cap turns that into a feasible brute force.
  expect(OTP_MAX_ATTEMPTS).toBeLessThanOrEqual(5);
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npm test -- otp`
Expected: FAIL — cannot resolve `./otp`.

- [ ] **Step 4: Write the implementation**

Create `workers/agent-api/src/otp.ts`:

```ts
/** 15 minutes, matching the supplier registration code. */
export const OTP_TTL_MS = 15 * 60 * 1000;
export const OTP_MAX_PER_HOUR = 5;
export const OTP_MAX_ATTEMPTS = 5;

/**
 * Six digits from a CSPRNG.
 *
 * Deliberately not Math.random(), which workers/enquire-api still uses for the
 * registration code: it is not cryptographically secure, so an attacker who
 * observes a few codes can predict later ones.
 *
 * The modulo is very slightly biased over 2^32, but 2^32 is not a multiple of
 * 1e6 by a margin far too small to help a guesser.
 */
export function generateOtpCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0] % 1_000_000).padStart(6, "0");
}

export function isWellFormedCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

export function normaliseEmail(email: string): string {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `npm test -- otp`
Expected: PASS, all five tests.

- [ ] **Step 6: Commit**

```bash
git add workers/agent-api
git commit -m "feat(agent-api): scaffold worker with CSPRNG OTP helpers"
```

---

### Task 3: Agent authentication in the Worker

Session handling mirrors `workers/vendor-api/src/auth.ts`: 32 random bytes as the cookie value, only the SHA-256 hash stored, so a database dump yields no live sessions.

**Files:**

- Create: `workers/agent-api/src/db.ts`, `src/cors.ts`, `src/auth.ts`, `src/handlers.ts`, `src/index.ts`

**Interfaces:**

- Consumes: `generateOtpCode`, `isWellFormedCode`, `normaliseEmail`, `OTP_*` from `./otp`.
- Produces: `POST /auth/request-code`, `POST /auth/verify`, `POST /auth/logout`, `GET /auth/me`; and `getAgentFromSession(sql, token)` returning `{ id, email, name } | null`.

- [ ] **Step 1: Copy the infrastructure files**

`src/db.ts` and `src/cors.ts` are the same shape as `workers/vendor-api/src/{db,cors}.ts`. Copy them and change only the error message in `createSql` to name the agent Worker. Both export `cuid()` and `hashSha256()`, which the rest of this task uses.

- [ ] **Step 2: Write the session helpers**

Create `workers/agent-api/src/auth.ts`, mirroring `workers/vendor-api/src/auth.ts`:

```ts
import { type Sql, cuid, hashSha256 } from "./db";

/** Agents work in the field and re-authenticate by email; 24h keeps that tolerable. */
const AGENT_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export type AgentIdentity = { id: string; email: string; name: string };

export async function createAgentSession(
  sql: Sql,
  agentId: string,
  userAgent = ""
): Promise<string> {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");

  // Only the hash is stored, so a database dump yields no live sessions.
  await sql`
    INSERT INTO "AgentSession" (id, "tokenHash", "agentId", "userAgent", "expiresAt", "createdAt")
    VALUES (
      ${cuid()},
      ${await hashSha256(token)},
      ${agentId},
      ${userAgent.slice(0, 255)},
      ${new Date(Date.now() + AGENT_SESSION_TTL_MS)},
      NOW()
    )
  `;

  return token;
}

export async function getAgentFromSession(
  sql: Sql,
  token: string | null
): Promise<AgentIdentity | null> {
  if (!token) return null;

  const [row] = await sql`
    SELECT a.id, a.email, a.name
    FROM "AgentSession" s
    JOIN "Agent" a ON a.id = s."agentId"
    WHERE s."tokenHash" = ${await hashSha256(token)}
      AND s."revokedAt" IS NULL
      AND s."expiresAt" > NOW()
      AND a."isActive" = true
    LIMIT 1
  `;
  if (!row) return null;

  return { id: String(row.id), email: String(row.email), name: String(row.name ?? "") };
}

export async function revokeAgentSession(sql: Sql, token: string | null): Promise<void> {
  if (!token) return;
  await sql`
    UPDATE "AgentSession" SET "revokedAt" = NOW()
    WHERE "tokenHash" = ${await hashSha256(token)} AND "revokedAt" IS NULL
  `;
}

export function agentSessionFrom(request: Request): string | null {
  return request.headers.get("X-Agent-Session");
}
```

- [ ] **Step 3: Write the OTP handlers**

Create `workers/agent-api/src/handlers.ts`. The structure follows `handleOtpRequest` / `handleOtpVerify` in `workers/enquire-api/src/handlers.ts`, with the two security corrections noted in Task 2:

```ts
import {
  agentSessionFrom,
  createAgentSession,
  getAgentFromSession,
  revokeAgentSession,
} from "./auth";
import { type Env, json } from "./cors";
import { type Sql, cuid, hashSha256 } from "./db";
import { sendAgentCode } from "./notify";
import {
  OTP_MAX_ATTEMPTS,
  OTP_MAX_PER_HOUR,
  OTP_TTL_MS,
  generateOtpCode,
  isWellFormedCode,
  normaliseEmail,
} from "./otp";

/**
 * Identical response whether or not the email belongs to an active agent.
 * Distinguishing them would let anyone enumerate which agents RVCC works with.
 */
const NEUTRAL = { ok: true, expiresInMinutes: OTP_TTL_MS / 60000 };

export async function handleRequestCode(
  sql: Sql,
  env: Env,
  request: Request,
  ctx: ExecutionContext
): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = normaliseEmail(body.email ?? "");
  if (!email.includes("@")) {
    return json(env, request, { error: "Valid email is required." }, 400);
  }

  const [agent] = await sql`
    SELECT id FROM "Agent" WHERE email = ${email} AND "isActive" = true LIMIT 1
  `;

  // Rate limit before the existence check so a limited and an unknown address
  // are indistinguishable from the outside.
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM "AgentOtp"
    WHERE email = ${email} AND "createdAt" > NOW() - INTERVAL '1 hour'
  `;
  if (Number(count) >= OTP_MAX_PER_HOUR || !agent) {
    return json(env, request, NEUTRAL);
  }

  // Supersede any unconsumed code so "newest unconsumed" is a real invariant,
  // rather than an accident of ordering that revives an older code.
  await sql`
    UPDATE "AgentOtp" SET "consumedAt" = NOW()
    WHERE email = ${email} AND "consumedAt" IS NULL
  `;

  const code = generateOtpCode();
  await sql`
    INSERT INTO "AgentOtp" (id, email, "codeHash", "expiresAt", "createdAt")
    VALUES (${cuid()}, ${email}, ${await hashSha256(code)}, ${new Date(Date.now() + OTP_TTL_MS)}, NOW())
  `;

  // Background so a slow SMTP server cannot stall the response.
  ctx.waitUntil(
    sendAgentCode(env, email, code, OTP_TTL_MS / 60000).catch((err) => {
      console.error("[agent-api] OTP mail failed", err);
    })
  );

  // The plaintext code is never in this response; it leaves only via SMTP.
  return json(env, request, NEUTRAL);
}

export async function handleVerify(sql: Sql, env: Env, request: Request): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { email?: string; code?: string };
  const email = normaliseEmail(body.email ?? "");
  const code = String(body.code ?? "");

  const invalid = () =>
    json(env, request, { error: "That code is invalid or has expired. Request a new one." }, 401);

  if (!email || !isWellFormedCode(code)) return invalid();

  const [otp] = await sql`
    SELECT id, "codeHash" FROM "AgentOtp"
    WHERE email = ${email} AND "consumedAt" IS NULL AND "expiresAt" > NOW()
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;
  if (!otp) return invalid();

  // Atomically claim an attempt. A count of 0 means the cap is already reached,
  // which closes the race a read-then-check would leave open.
  const claimed = await sql`
    UPDATE "AgentOtp" SET attempts = attempts + 1
    WHERE id = ${otp.id} AND "consumedAt" IS NULL AND attempts < ${OTP_MAX_ATTEMPTS}
    RETURNING id
  `;
  if (claimed.length === 0) return invalid();

  if (String(otp.codeHash) !== (await hashSha256(code))) return invalid();

  const [agent] = await sql`
    SELECT id, email, name FROM "Agent"
    WHERE email = ${email} AND "isActive" = true LIMIT 1
  `;
  if (!agent) return invalid();

  await sql`UPDATE "AgentOtp" SET "consumedAt" = NOW() WHERE id = ${otp.id}`;
  await sql`UPDATE "Agent" SET "lastLoginAt" = NOW() WHERE id = ${agent.id}`;

  const token = await createAgentSession(
    sql,
    String(agent.id),
    request.headers.get("User-Agent") ?? ""
  );

  return json(env, request, {
    ok: true,
    token,
    agent: { id: agent.id, email: agent.email, name: agent.name ?? "" },
  });
}

export async function handleMe(sql: Sql, env: Env, request: Request): Promise<Response> {
  const agent = await getAgentFromSession(sql, agentSessionFrom(request));
  if (!agent) return json(env, request, { error: "Not signed in." }, 401);
  return json(env, request, agent);
}

export async function handleLogout(sql: Sql, env: Env, request: Request): Promise<Response> {
  await revokeAgentSession(sql, agentSessionFrom(request));
  return json(env, request, { ok: true });
}
```

- [ ] **Step 3b: Write the mail client the handlers import**

`handlers.ts` above imports `sendAgentCode` from `./notify`, so this file must exist before the
typecheck in Step 5. Its counterpart endpoint on `enquire-api` is added in Task 4.

Create `workers/agent-api/src/notify.ts`:

```ts
import type { Env } from "./cors";

/**
 * Asks the enquire Worker to send the sign-in code. SMTP credentials live only
 * on that Worker — this one never sends mail itself.
 *
 * Throws on failure so the caller's ctx.waitUntil logs it. The code row is
 * already committed by then, so the agent can simply request another.
 */
export async function sendAgentCode(
  env: Env,
  email: string,
  code: string,
  minutes: number
): Promise<void> {
  const base = (env.ENQUIRE_WORKER_URL || "").replace(/\/$/, "");
  const secret = env.ENQUIRE_API_SECRET;
  if (!base || !secret) {
    throw new Error("ENQUIRE_WORKER_URL and ENQUIRE_API_SECRET must be set on agent-api");
  }

  const res = await fetch(`${base}/notify/agent-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
    body: JSON.stringify({ to: email, code, minutes }),
  });

  if (!res.ok) {
    throw new Error(`enquire-api /notify/agent-code returned ${res.status}`);
  }
}
```

Add `ENQUIRE_WORKER_URL` and `ENQUIRE_API_SECRET` to the `Env` type in
`workers/agent-api/src/cors.ts`.

- [ ] **Step 4: Write the router**

Create `workers/agent-api/src/index.ts`, mirroring `workers/vendor-api/src/index.ts`. Every route except `/health` requires `assertApiSecret`. Register:

```ts
if (path === "/auth/request-code" && request.method === "POST") {
  return await handleRequestCode(sql, env, request, ctx);
}
if (path === "/auth/verify" && request.method === "POST") {
  return await handleVerify(sql, env, request);
}
if (path === "/auth/me" && request.method === "GET") {
  return await handleMe(sql, env, request);
}
if (path === "/auth/logout" && request.method === "POST") {
  return await handleLogout(sql, env, request);
}
```

Note `handleRequestCode` needs `ctx: ExecutionContext`, so the `fetch` signature must accept and pass it — `workers/enquire-api/src/index.ts` shows this.

- [ ] **Step 5: Typecheck**

Run: `cd workers/agent-api && npx tsc --noEmit -p tsconfig.json`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add workers/agent-api
git commit -m "feat(agent-api): OTP request/verify with attempts cap and sealed sessions"
```

---

### Task 4: Send the code by email

SMTP credentials live only on `workers/enquire-api`. This Worker asks it to send, exactly as `workers/admin-api/src/notify.ts` does for approval decisions.

**Files:**

- Modify: `workers/enquire-api/src/index.ts` (new route), `workers/enquire-api/src/handlers.ts` (new handler)

**Interfaces:**

- Consumes: `sendOtpEmail(env, to, code, minutes)` already exported by `workers/enquire-api/src/mail.ts`; `smtpConfigured(env)` from the same file.
- Produces: `POST /notify/agent-code` on enquire-api — the endpoint `sendAgentCode` (written in Task 3, Step 3b) calls.

- [ ] **Step 1: Add the enquire-api handler**

In `workers/enquire-api/src/handlers.ts`, following `handleNotifyDecision`:

```ts
export async function handleNotifyAgentCode(
  env: Env,
  request: Request,
  ctx: ExecutionContext
): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as {
    to?: string;
    code?: string;
    minutes?: number;
  };

  if (!body.to || !body.code) {
    return json(env, request, { error: "to and code are required" }, 400);
  }
  if (!smtpConfigured(env)) {
    return json(env, request, { error: "Mail service unavailable" }, 503);
  }

  ctx.waitUntil(
    sendOtpEmail(env, body.to, body.code, body.minutes ?? 15).catch((err) => {
      console.error("[enquire-api] agent code mail failed", err);
    })
  );

  return json(env, request, { ok: true });
}
```

- [ ] **Step 2: Register the route**

In `workers/enquire-api/src/index.ts`, beside `/notify/decision`:

```ts
if (url.pathname === "/notify/agent-code" && request.method === "POST") {
  return await handleNotifyAgentCode(env, request, ctx);
}
```

- [ ] **Step 3: Verify the code is never in a response body**

```bash
grep -rn "code" workers/agent-api/src/handlers.ts | grep -i "json(env"
```

Expected: no line returns `code`. The only paths a plaintext code takes are the SMTP call and the `AgentOtp.codeHash` column.

- [ ] **Step 4: Typecheck both Workers**

```bash
(cd workers/agent-api && npx tsc --noEmit -p tsconfig.json)
(cd workers/enquire-api && npm install && npx tsc --noEmit -p tsconfig.json)
```

Expected: no output from either.

- [ ] **Step 5: Commit**

```bash
git add workers/agent-api workers/enquire-api
git commit -m "feat(agent-api): send sign-in codes through the enquire Worker's SMTP"
```

---

### Task 5: The agent Next.js app

Mirrors `apps/vendor`, on port 3003. **The stale-cookie fix from Plan 1 Task 2 is built in from the start** — both existing portals had an infinite `ERR_TOO_MANY_REDIRECTS` loop that had to be retrofitted, and this app must not repeat it.

**Files:**

- Create: `apps/agent/{package.json,tsconfig.json,next.config.ts,postcss.config.mjs,.env.example}`
- Create: `apps/agent/src/lib/{constants.ts,agent-api.ts,session.ts,utils.ts}`
- Create: `apps/agent/src/proxy.ts`
- Create: `apps/agent/src/app/{layout.tsx,globals.css}`, `src/app/login/page.tsx`, `src/app/(protected)/{layout.tsx,page.tsx}`
- Create: `apps/agent/src/app/api/auth/{request-code,verify,logout}/route.ts`
- Create: `apps/agent/src/sections/AgentLoginForm.tsx`
- Create: `apps/agent/src/lib/constants.test.ts`

**Interfaces:**

- Consumes: the agent-api routes from Task 3.
- Produces: `AGENT_COOKIE = "rvcc_agent_session"`, `agentCookieOptions()`, `expiredCookieOptions()`, `AGENT_LOGIN_EXPIRED_PATH`, `getAgentFromSession()`.

- [ ] **Step 1: Scaffold from apps/vendor**

Copy `apps/vendor/{package.json,tsconfig.json,next.config.ts,postcss.config.mjs}` to `apps/agent/`, rename the package to `agent`, and change every port from 3002 to **3003** in the `dev` and `start` scripts. Then `npm install` from the repo root so the new workspace links.

- [ ] **Step 2: Write the failing constants test**

Create `apps/agent/src/lib/constants.test.ts` — a relative import, because the root vitest config cannot resolve each app's `@/` alias and three apps share that prefix:

```ts
import { expect, test } from "vitest";

import {
  AGENT_LOGIN_EXPIRED_PATH,
  AGENT_LOGIN_PATH,
  AGENT_SESSION_EXPIRED_PARAM,
  agentCookieOptions,
  expiredCookieOptions,
} from "./constants";

test("expired options clear the cookie and match the live cookie's scope", () => {
  const live = agentCookieOptions();
  const dead = expiredCookieOptions();

  expect(dead.maxAge).toBe(0);
  // A mismatched path or domain writes a second cookie instead of clearing the first.
  expect(dead.path).toBe(live.path);
  expect(dead.httpOnly).toBe(live.httpOnly);
  expect(dead.sameSite).toBe(live.sameSite);
  expect(dead.secure).toBe(live.secure);
});

test("the expired-login path carries the marker the proxy looks for", () => {
  const url = new URL(AGENT_LOGIN_EXPIRED_PATH, "http://localhost");

  expect(url.pathname).toBe(AGENT_LOGIN_PATH);
  // The proxy branches on this parameter; a mismatch silently restores the loop.
  expect(url.searchParams.has(AGENT_SESSION_EXPIRED_PARAM)).toBe(true);
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npm test -- apps/agent`
Expected: FAIL — cannot resolve `./constants`.

- [ ] **Step 4: Write the constants**

Create `apps/agent/src/lib/constants.ts`:

```ts
/** Shared by proxy (edge) and server — Node-API free. */

export const AGENT_COOKIE = "rvcc_agent_session";
/** Matches AGENT_SESSION_TTL_MS in workers/agent-api/src/auth.ts. */
export const AGENT_SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24h
export const AGENT_LOGIN_PATH = "/login";
export const AGENT_HOME_PATH = "/";

/**
 * Where a server-side guard sends a request whose cookie exists but whose
 * session is dead. The marker is what lets the proxy tell "signed in, go home"
 * apart from "cookie is stale, drop it" — it cannot check the session itself.
 */
export const AGENT_SESSION_EXPIRED_PARAM = "expired";
export const AGENT_LOGIN_EXPIRED_PATH = `${AGENT_LOGIN_PATH}?${AGENT_SESSION_EXPIRED_PARAM}=1`;

export function agentCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(AGENT_SESSION_TTL_MS / 1000),
  };
}

/**
 * Options that delete the session cookie. Every field except maxAge must match
 * agentCookieOptions() — a browser treats a differing path or domain as a
 * different cookie and leaves the original in place.
 */
export function expiredCookieOptions() {
  return { ...agentCookieOptions(), maxAge: 0 };
}
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `npm test -- apps/agent`
Expected: PASS, both tests.

- [ ] **Step 6: Write the proxy with the loop fix built in**

Create `apps/agent/src/proxy.ts`, copying `apps/vendor/src/proxy.ts` including its expired-marker branch:

```ts
import { type NextRequest, NextResponse } from "next/server";

import {
  AGENT_COOKIE,
  AGENT_HOME_PATH,
  AGENT_LOGIN_PATH,
  AGENT_SESSION_EXPIRED_PARAM,
  agentCookieOptions,
  expiredCookieOptions,
} from "@/lib/constants";

/** Cheap cookie-presence gate. Real auth is /auth/me via the agent-api worker. */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === AGENT_LOGIN_PATH) {
    // A server-side guard rejected the session and sent us here. Drop the dead
    // cookie and serve the login form; without this the branch below sees a
    // cookie, bounces to the home path, the guard rejects it again, and the two
    // redirect until the browser gives up with ERR_TOO_MANY_REDIRECTS.
    if (request.nextUrl.searchParams.has(AGENT_SESSION_EXPIRED_PARAM)) {
      const res = NextResponse.next();
      res.cookies.set(AGENT_COOKIE, "", expiredCookieOptions());
      return res;
    }
    if (request.cookies.get(AGENT_COOKIE)?.value) {
      return NextResponse.redirect(new URL(AGENT_HOME_PATH, request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) return NextResponse.next();

  const token = request.cookies.get(AGENT_COOKIE)?.value;
  if (!token) {
    const url = new URL(AGENT_LOGIN_PATH, request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.cookies.set(AGENT_COOKIE, token, agentCookieOptions());
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 7: Write session, API client, and the protected layout**

`src/lib/agent-api.ts` mirrors `apps/vendor/src/lib/vendor-api.ts`, reading `AGENT_API_URL` / `AGENT_API_SECRET` and setting the `X-Agent-Session` header.

`src/lib/session.ts` mirrors `apps/vendor/src/lib/session.ts`: `getAgentFromSession()` wrapped in React `cache`, calling `GET /auth/me`, with the same 45-second in-process identity cache.

`src/app/(protected)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";

import { AGENT_LOGIN_EXPIRED_PATH } from "@/lib/constants";
import { getAgentFromSession } from "@/lib/session";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const agent = await getAgentFromSession();

  // The ?expired= form tells the proxy to drop the cookie. A layout cannot clear
  // it itself — Next only allows that in a Server Action or Route Handler — and
  // leaving it set makes the proxy bounce us back here forever.
  if (!agent) redirect(AGENT_LOGIN_EXPIRED_PATH);

  return <>{children}</>;
}
```

- [ ] **Step 8: Write the BFF routes**

Three routes under `src/app/api/auth/`, each following `apps/admin/src/app/api/vendors/route.ts`: read the cookie, forward to the Worker, pass status and body straight back, 503 on upstream failure.

`verify/route.ts` additionally sets the session cookie on success — a Route Handler may do this, unlike a layout:

```ts
const data = (await res.json()) as { ok?: boolean; token?: string };
if (res.ok && data.token) {
  const out = NextResponse.json({ ok: true });
  out.cookies.set(AGENT_COOKIE, data.token, agentCookieOptions());
  return out;
}
```

The token must never reach the browser as JSON — only as an httpOnly cookie.

- [ ] **Step 9: Write the login form**

`src/sections/AgentLoginForm.tsx`, a client component in two stages: email, then the six-digit code. Use `EnquireField` and `enquireInputClass` conventions from the sibling apps rather than raw elements. The code input is `inputMode="numeric"` with `autoComplete="one-time-code"`.

The email stage always advances to the code stage, whatever the server says — the neutral response in Task 3 is pointless if the UI reveals the difference. Error copy on a bad code: _"That code is invalid or has expired. Request a new one."_

- [ ] **Step 10: Verify the loop is gone before it ever ships**

```bash
export PATH="$HOME/.nvm/versions/node/v24.14.0/bin:$PATH"
(cd workers/agent-api && npx wrangler dev --port 8790 &)
npm run -w agent dev &

curl -s -D- -o /dev/null -L --max-redirs 8 -b "rvcc_agent_session=stale-invalid" \
  http://localhost:3003/login | grep -iE '^(HTTP|location|set-cookie)'
```

Expected: `307 → /`, `307 → /login?expired=1`, then `200` with `set-cookie: rvcc_agent_session=; …; Max-Age=0`. Not an alternating loop.

- [ ] **Step 11: Typecheck, lint, test**

```bash
npx tsc --noEmit -p apps/agent/tsconfig.json
(cd apps/agent && npx eslint src)
npm test
```

Expected: all clean.

- [ ] **Step 12: Commit**

```bash
git add apps/agent package-lock.json
git commit -m "feat(agent): add agent portal with OTP login"
```

---

### Task 6: Admin manages agents

Plan 1 built the equivalent for suppliers. This is the same shape: create with industries, list, deactivate. Agents have no password, so there is no temporary-password panel.

**Files:**

- Create: `workers/admin-api/src/agent-input.ts`, `src/agent-input.test.ts`
- Modify: `workers/admin-api/src/handlers.ts`, `src/index.ts`
- Create: `apps/admin/src/app/api/agents/route.ts`, `apps/admin/src/app/api/agents/[id]/route.ts`
- Create: `apps/admin/src/app/(protected)/agents/page.tsx`, `apps/admin/src/sections/CreateAgentForm.tsx`

**Interfaces:**

- Consumes: `requireAdmin`, `writeAudit`, `json`, `cuid` as in Plan 1 Task 5; the `_AgentToIndustry` join table from Task 1 Step 6.
- Produces: `POST /agents`, `GET /agents`, `PATCH /agents/:id`; `normaliseAgentInput(input)`.

- [ ] **Step 1: Write the failing test**

Create `workers/admin-api/src/agent-input.test.ts`:

```ts
import { expect, test } from "vitest";

import { normaliseAgentInput } from "./agent-input";

test("normalises email casing and whitespace", () => {
  const out = normaliseAgentInput({ email: "  New@Field.COM ", name: "  Field Agent  " });

  expect(out.email).toBe("new@field.com");
  expect(out.name).toBe("Field Agent");
});

test("rejects a missing email by naming the field", () => {
  expect(() => normaliseAgentInput({ email: "  ", name: "X" })).toThrow(/email/i);
});

test("defaults the optional fields rather than passing undefined to SQL", () => {
  const out = normaliseAgentInput({ email: "a@b.com", name: "A" });

  expect(out.company).toBe("");
  expect(out.phone).toBe("");
  expect(out.industryIds).toEqual([]);
});

test("a name is optional — agents are often known only by email at first", () => {
  expect(() => normaliseAgentInput({ email: "a@b.com", name: "" })).not.toThrow();
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- agent-input`
Expected: FAIL — cannot resolve `./agent-input`.

- [ ] **Step 3: Write the validator**

Create `workers/admin-api/src/agent-input.ts`:

```ts
export type CreateAgentInput = {
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  industryIds?: string[];
};

/**
 * Kept free of database and Worker imports so it is testable from the repo root
 * — workers/ are not npm workspaces and cannot resolve `postgres` there.
 *
 * Unlike a vendor, an agent's name is optional: procurement often has only an
 * email address when the account is first created.
 */
export function normaliseAgentInput(input: CreateAgentInput) {
  const email = String(input?.email ?? "")
    .trim()
    .toLowerCase();

  if (!email) throw new Error("An email is required.");

  return {
    email,
    name: String(input.name ?? "").trim(),
    company: String(input.company ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
    industryIds: Array.isArray(input.industryIds) ? input.industryIds : [],
  };
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm test -- agent-input`
Expected: PASS, all four tests.

- [ ] **Step 5: Write the handlers**

In `workers/admin-api/src/handlers.ts`, add `handleAgentCreate`, `handleAgentsList`, and `handleAgentPatch`, following `handleVendorCreate` from Plan 1. `handleAgentCreate`:

- returns `409 { error: "An agent already exists for that email." }` on a duplicate;
- inserts into `"Agent"`, then into the join table inside the same `sql.begin` transaction — **check the column order recorded in Task 1 Step 6**, which is the reverse of the vendor one;
- writes `AuditLog` with `action: "agent.created"`, `entityType: "Agent"`, `metadata: { email, industryIds }`;
- responds `201 { ok: true, agent: { id, email, name } }` — with **no** password field, because agents have none.

`handleAgentPatch` toggles `isActive` and writes `agent.deactivated` / `agent.reactivated`. Deactivating must also revoke live sessions, or a disabled agent stays signed in until their token expires:

```ts
await sql`
    UPDATE "AgentSession" SET "revokedAt" = NOW()
    WHERE "agentId" = ${id} AND "revokedAt" IS NULL
  `;
```

- [ ] **Step 6: Register the routes**

In `workers/admin-api/src/index.ts`, beside the `/vendors` routes:

```ts
if (path === "/agents" && request.method === "GET") {
  return await handleAgentsList(sql, env, request);
}
if (path === "/agents" && request.method === "POST") {
  return await handleAgentCreate(sql, env, request);
}
const agentPatch = path.match(/^\/agents\/([^/]+)$/);
if (agentPatch && request.method === "PATCH") {
  return await handleAgentPatch(sql, env, request, agentPatch[1]);
}
```

- [ ] **Step 7: Build the admin screens**

`apps/admin/src/app/api/agents/route.ts` and `[id]/route.ts` are BFF pass-throughs following `api/vendors/route.ts` exactly.

`apps/admin/src/app/(protected)/agents/page.tsx` is a Server Component loading agents and active industries with one Prisma query each, rendering `<CreateAgentForm industries={industries} />` above the list. Columns: email, name, company, industries, last sign-in, status.

`CreateAgentForm.tsx` mirrors `CreateVendorForm.tsx` minus the password panel — on success it shows _"Agent added. They can sign in at the portal with a code sent to their email."_

Add an **Agents** link to the admin navigation in `apps/admin/src/sections/AdminChrome.tsx`.

- [ ] **Step 8: Verify end to end**

With `admin-api` on 8788, `agent-api` on 8790, enquire-api running, and the admin app on 3001:

```bash
TOKEN=$(curl -s -X POST http://localhost:8788/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-admin@rvcc.com","password":"TestPass123!"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")

# create through the BFF, exactly as the screen does
curl -s -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" -b "rvcc_admin_session=$TOKEN" \
  -d '{"email":"flow@field.com","name":"Flow Agent"}'

# request a code, then read it from the database — it is never in a response
curl -s -X POST http://localhost:3003/api/auth/request-code \
  -H "Content-Type: application/json" -d '{"email":"flow@field.com"}'

psql "$DATABASE_URL_TEST" -c \
  'SELECT email, attempts, "consumedAt" FROM "AgentOtp" ORDER BY "createdAt" DESC LIMIT 1'
```

Expected: `201` from the create; `{"ok":true,...}` from the code request with **no code in the body**; one unconsumed `AgentOtp` row.

Then confirm the anti-enumeration promise holds — an unknown address must be byte-identical:

```bash
curl -s -X POST http://localhost:3003/api/auth/request-code \
  -H "Content-Type: application/json" -d '{"email":"nobody@nowhere.com"}'
```

Expected: exactly the same JSON as the known address, and **no new `AgentOtp` row**.

Re-seed the admin first if you have run `npm test` since — `resetTestDatabase()` truncates every table, which will delete the account and make login fail with an unhelpful error.

- [ ] **Step 9: Typecheck, lint, test**

```bash
npx tsc --noEmit -p apps/admin/tsconfig.json
(cd workers/admin-api && npx tsc --noEmit -p tsconfig.json)
(cd apps/admin && npx eslint src)
npm test
```

Expected: all clean.

- [ ] **Step 10: Commit**

```bash
git add workers/admin-api apps/admin
git commit -m "feat(admin): create and manage agent accounts"
```

---

## What this plan deliberately leaves out

- **Requirements and quotes** — Plan 3: `Requirement`, `RequirementAttachment`, `RequirementInvite`, `Quote`, `QuoteAttachment`, the admin post screen, the participant quote form shared by `apps/vendor` and `apps/agent`, invite email, and the sealed-bidding tests.
- **Award, notifications, KPIs** — Plan 4.
- **`packages/rfq`**, the shared participant resolver and quote-form components. It has no purpose until there is a quote to render, so it belongs to Plan 3.
- **An industry-management screen.** Industries are still seeded directly in the database; both create forms degrade honestly when the list is empty.

## Carried-forward decisions the user still owes

1. **Which lineage owns the production database.** Unresolved since Plan 1. Task 1 adds three tables.
2. **Whether a temporary password may be emailed.** `handleRegistrationReview` emails one; the spec forbids it; Plan 1's admin-create path does not. Agents are unaffected — they have no password — but the inconsistency remains.

## Self-review notes

- **Spec coverage:** implements the spec's `Agent` half of _Admin-created accounts_, the `Industry.agents` relation deferred by Plan 1 Task 4, the agent side of _Authentication_, and the `agent.created` / `agent.deactivated` audit actions.
- **Ordering:** Task 1 before Task 3 (tables must exist), Task 2 before Task 3 (handlers import the helpers), Task 4 before Task 5's manual check (a login with no mail path cannot be completed by hand), Task 1 Step 6 before Task 6 Step 5 (join-table column order).
- **Known asymmetry, called out twice on purpose:** `_AgentToIndustry` puts `Agent` in column `A`, while `_IndustryToVendorUser` puts `Industry` in `A`. Copying the vendor insert without checking will attach the wrong ids and fail on a foreign key.
- **Deliberate divergence from existing code:** the OTP generator uses a CSPRNG and the verifier caps attempts, neither of which `workers/enquire-api` does today. Its registration OTP has the same two weaknesses and is worth a separate fix.
