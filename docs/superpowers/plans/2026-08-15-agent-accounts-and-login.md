# Agent Accounts and Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admins can add and deactivate field agents. Agents sign in with a one-time code sent to their email and reach a `/portal` area nobody else can open.

**Architecture:** All portal code lives in `apps/web` (Next.js App Router) and talks to Postgres through Prisma, mirroring the admin auth built in Plan 1. Agent sessions use the same design as admin sessions — a random 32-byte token in an httpOnly cookie, with only its SHA-256 hash stored. One-time codes are hashed at rest, expire in 15 minutes, are rate-limited per email, and are invalidated after 5 wrong guesses. Email is sent by the existing Cloudflare Worker, never from Next.js.

**Tech Stack:** Next.js 16.2.4, React 19.2.8, Prisma 5.22, PostgreSQL, Vitest 3, TypeScript 5, Cloudflare Workers (email only).

This is **Plan 2 of 3**. Plan 1 (`2026-08-13-admin-authentication.md`) is complete and must be merged or present on the branch before starting. Plan 3 covers requirements, invites, quotes, ranking, expiry, and notification email. Source spec: `docs/superpowers/specs/2026-08-13-vendor-agent-portal-design.md`.

## Global Constraints

- **Commits:** Muhammad commits his own work. Every "stage and hand off" step means stage the listed files and print the suggested message for him — do NOT run `git commit`. **Exception:** if this plan is being executed by subagent-driven-development inside an isolated git worktree, commits are pre-approved there and each step should commit normally. The controller states which mode applies when dispatching.
- Agent session lifetime: **24 hours**. Cookie name: `rvcc_agent_session`. Flags: `httpOnly`, `Secure` (except in development), `SameSite=Lax`, `path=/`.
- One-time code: **6 digits**, valid **15 minutes**, stored as a **SHA-256 hash**, single use.
- Code requests: **maximum 5 per email per hour**.
- Code verification: **maximum 5 wrong guesses per code**, after which that code is dead and a new one must be requested.
- A code is issued only to an email present in the `Agent` table with `isActive = true`. The response is **identical either way**: `"If your email is registered, a code is on the way."`
- Session tokens are stored as their **SHA-256 hash**, never raw.
- Agent-side queries filter by the agent id **taken from the session**, never from a URL or request body. This rule is what enforces sealed bidding in Plan 3 — establish it here.
- SMTP credentials live only on the Cloudflare Worker. Next.js must never import nodemailer or hold SMTP secrets.
- Import alias `@/*` maps to `apps/web/src/*`.
- Prettier: 2-space indent, 100-character lines, sorted imports. Run `npx prettier --write` on touched files before staging.
- All commands run from `apps/web` unless stated otherwise.
- Tests run against the `rvcc_test` database via `TEST_DATABASE_URL` in `apps/web/.env.test`. `npm run test:db:push` pushes schema there; it binds `DATABASE_URL` explicitly and fails loudly if `TEST_DATABASE_URL` is unset.

## What Plan 1 left you

Read these before starting; do not reimplement them.

| Thing              | Location                                 | Notes                                                                                                         |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `hashToken(token)` | `src/lib/auth/admin-session.ts`          | SHA-256 → hex. Task 2 extracts this for shared use.                                                           |
| Session pattern    | `src/lib/auth/admin-session.ts`          | create / find / revoke, each taking `prisma` first. Mirror it.                                                |
| Guard pattern      | `src/lib/auth/admin-guard.ts`            | `getAdminFromCookies` + `requireAdmin`, with `import "server-only"`. Mirror it.                               |
| Auth constants     | `src/lib/auth/constants.ts`              | Add agent constants to this same file.                                                                        |
| Route group gate   | `src/app/admin/(protected)/`             | Guarded pages live in a `(protected)` group; the login page sits outside it. Repeat this shape for `/portal`. |
| Test harness       | `vitest.config.ts`, `src/lib/test/db.ts` | `testPrisma` + `resetAdminTables()`. Task 1 adds an agent equivalent.                                         |
| Worker mail        | `workers/enquire-api/src/mail.ts`        | `sendMail`, `smtpConfigured`, and an HTML `shell()` template to reuse.                                        |
| Worker auth        | `src/lib/enquire-worker.ts`              | `enquireWorkerFetch(path, init)` sends `Authorization: Bearer $ENQUIRE_API_SECRET`.                           |

**Known follow-ups from Plan 1's final review that this plan must respect:**

- `requireAdmin()` returns the full `AdminUser` row including `passwordHash`. **Never pass it into a client component.** Task 9 adds an admin screen — pass only the fields it needs.
- `(protected)` is an opt-in gate, not a perimeter. Any new page must be created inside the group. Task 8 adds a test that proves the portal gate holds.

## File Structure

| File                                            | Responsibility                                            |
| ----------------------------------------------- | --------------------------------------------------------- |
| `src/lib/auth/token.ts`                         | Shared `hashToken`, used by both admin and agent sessions |
| `src/lib/auth/agent-session.ts`                 | Create, look up, revoke agent sessions                    |
| `src/lib/auth/agent-otp.ts`                     | Issue, rate-limit, and verify one-time codes              |
| `src/lib/auth/agent-guard.ts`                   | `requireAgent()` for portal pages                         |
| `src/lib/mail-client.ts`                        | Next → Worker mail calls. No SMTP here.                   |
| `workers/enquire-api/src/agent-mail.ts`         | Agent OTP email template                                  |
| `src/app/api/portal/auth/request-code/route.ts` | POST — request a code                                     |
| `src/app/api/portal/auth/verify/route.ts`       | POST — exchange code for a session                        |
| `src/app/api/portal/auth/logout/route.ts`       | POST — revoke session                                     |
| `src/app/portal/login/page.tsx`                 | Two-step login form                                       |
| `src/app/portal/(protected)/layout.tsx`         | Portal gate                                               |
| `src/app/portal/(protected)/page.tsx`           | Portal home (empty until Plan 3)                          |
| `src/app/admin/(protected)/agents/page.tsx`     | Admin screen listing agents                               |
| `src/app/api/admin/agents/route.ts`             | POST create agent, PATCH activate/deactivate              |

---

### Task 1: Agent models, constants, and test helper

**Files:**

- Modify: `apps/web/prisma/schema.prisma` (append)
- Modify: `apps/web/src/lib/auth/constants.ts`
- Modify: `apps/web/src/lib/test/db.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: models `Agent`, `AgentOtp`, `AgentSession`; constants `AGENT_COOKIE`, `AGENT_SESSION_MS`, `OTP_TTL_MS`, `OTP_MAX_PER_HOUR`, `OTP_MAX_ATTEMPTS`; helper `resetAgentTables()`.

- [ ] **Step 1: Append the models**

Add to the end of `apps/web/prisma/schema.prisma`:

```prisma
model Agent {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String   @default("")
  company   String   @default("")
  phone     String   @default("")
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sessions AgentSession[]
}

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
  id        String   @id @default(cuid())
  agentId   String
  agent     Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  tokenHash String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([agentId])
}
```

`AgentOtp` is separate from the existing `RegistrationOtp`, which belongs to supplier registration. The `attempts` column is what makes a 6-digit code safe: without it, a code is brute-forceable.

- [ ] **Step 2: Add the constants**

Append to `apps/web/src/lib/auth/constants.ts`:

```ts
export const AGENT_COOKIE = "rvcc_agent_session";
export const AGENT_SESSION_MS = 24 * 60 * 60 * 1000;
export const OTP_TTL_MS = 15 * 60 * 1000;
export const OTP_MAX_PER_HOUR = 5;
export const OTP_MAX_ATTEMPTS = 5;
```

- [ ] **Step 3: Add the test reset helper**

In `apps/web/src/lib/test/db.ts`, add below the existing `resetAdminTables`:

```ts
/** Clears agent tables between tests. Sessions cascade from agents. */
export async function resetAgentTables(): Promise<void> {
  await testPrisma.$executeRawUnsafe('TRUNCATE "AgentSession", "AgentOtp", "Agent" CASCADE');
}
```

- [ ] **Step 4: Push to both databases**

```bash
npx prisma db push
npm run test:db:push
```

Expected: both report the schema is in sync.

- [ ] **Step 5: Verify the tables exist in both databases**

```bash
/opt/homebrew/opt/postgresql@17/bin/psql "$(grep DATABASE_URL .env | cut -d'"' -f2)" -c '\d "AgentOtp"' | head -14
/opt/homebrew/opt/postgresql@17/bin/psql "$(grep TEST_DATABASE_URL .env.test | cut -d'"' -f2)" -c '\d "AgentSession"' | head -14
```

Expected: both print column listings, including `attempts` on `AgentOtp` and `tokenHash` on `AgentSession`.

- [ ] **Step 6: Confirm nothing broke**

Run: `npm test`
Expected: 31 tests pass, exit 0 (Plan 1's suite, unchanged).

- [ ] **Step 7: Stage and hand off**

```bash
npx prettier --write src/lib/auth/constants.ts src/lib/test/db.ts
git add apps/web/prisma/schema.prisma apps/web/src/lib/auth/constants.ts apps/web/src/lib/test/db.ts
```

Suggested message: `feat(portal): add Agent, AgentOtp, AgentSession models`

---

### Task 2: Extract the shared token hasher

**Files:**

- Create: `apps/web/src/lib/auth/token.ts`
- Modify: `apps/web/src/lib/auth/admin-session.ts`
- Test: `apps/web/src/lib/auth/token.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `hashToken(token: string): Promise<string>` and `randomToken(): string`.

Plan 1 defined `hashToken` inside `admin-session.ts`. Agent sessions need the identical function. Copying it would create exactly the drift hazard Plan 1's Task 8 had to retrofit a test for — so extract it once, now, before there is a second copy.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/auth/token.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { hashToken, randomToken } from "@/lib/auth/token";

describe("token", () => {
  it("hashes to 64 hex characters", async () => {
    const hash = await hashToken("some-token");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic", async () => {
    expect(await hashToken("same")).toBe(await hashToken("same"));
  });

  it("differs for different input", async () => {
    expect(await hashToken("a")).not.toBe(await hashToken("b"));
  });

  it("generates 64 hex characters of randomness", () => {
    expect(randomToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("does not repeat", () => {
    expect(randomToken()).not.toBe(randomToken());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/auth/token.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/token`.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/lib/auth/token.ts`:

```ts
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** 32 bytes of CSPRNG output, hex encoded. Use for session tokens. */
export function randomToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

/** SHA-256 of a token, hex encoded. Only the hash is ever stored. */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return toHex(new Uint8Array(digest));
}
```

- [ ] **Step 4: Point admin-session at the shared module**

In `apps/web/src/lib/auth/admin-session.ts`, delete its local `toHex` and `hashToken` definitions and the inline token generation, then import from the new module:

```ts
import { hashToken, randomToken } from "@/lib/auth/token";
```

Re-export `hashToken` so existing importers keep working:

```ts
export { hashToken };
```

Replace the body of the token generation in `createAdminSession` with `const token = randomToken();`.

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: 36 tests pass, exit 0 (31 from Plan 1 + 5 new). **Plan 1's `admin-session.test.ts` must still pass unchanged** — it imports `hashToken` from `admin-session`, which is why the re-export matters. If those tests fail, the refactor broke a public interface; fix it rather than editing Plan 1's tests.

- [ ] **Step 6: Stage and hand off**

```bash
npx prettier --write src/lib/auth/token.ts src/lib/auth/token.test.ts src/lib/auth/admin-session.ts
git add apps/web/src/lib/auth/token.ts apps/web/src/lib/auth/token.test.ts apps/web/src/lib/auth/admin-session.ts
```

Suggested message: `refactor(auth): extract shared token hashing`

---

### Task 3: Agent sessions

**Files:**

- Create: `apps/web/src/lib/auth/agent-session.ts`
- Test: `apps/web/src/lib/auth/agent-session.test.ts`

**Interfaces:**

- Consumes: `hashToken`, `randomToken` (Task 2); `AGENT_SESSION_MS` (Task 1); `testPrisma`, `resetAgentTables` (Task 1).
- Produces:
  - `createAgentSession(prisma: PrismaClient, agentId: string): Promise<string>`
  - `findAgentBySessionToken(prisma: PrismaClient, token: string): Promise<Agent | null>`
  - `revokeAgentSession(prisma: PrismaClient, token: string): Promise<void>`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/lib/auth/agent-session.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";

import {
  createAgentSession,
  findAgentBySessionToken,
  revokeAgentSession,
} from "@/lib/auth/agent-session";
import { hashToken } from "@/lib/auth/token";
import { resetAgentTables, testPrisma } from "@/lib/test/db";

async function makeAgent(overrides: Record<string, unknown> = {}) {
  return testPrisma.agent.create({
    data: { email: "agent@example.com", name: "Agent", ...overrides },
  });
}

describe("agent sessions", () => {
  beforeEach(async () => {
    await resetAgentTables();
  });

  it("finds the agent from a fresh token", async () => {
    const agent = await makeAgent();
    const token = await createAgentSession(testPrisma, agent.id);
    expect((await findAgentBySessionToken(testPrisma, token))?.id).toBe(agent.id);
  });

  it("stores the hash, never the raw token", async () => {
    const agent = await makeAgent();
    const token = await createAgentSession(testPrisma, agent.id);
    const row = await testPrisma.agentSession.findFirst();
    expect(row?.tokenHash).toBe(await hashToken(token));
    expect(row?.tokenHash).not.toBe(token);
  });

  it("rejects an unknown token", async () => {
    expect(await findAgentBySessionToken(testPrisma, "made-up")).toBeNull();
  });

  it("rejects an empty token without querying", async () => {
    expect(await findAgentBySessionToken(testPrisma, "")).toBeNull();
  });

  it("rejects an expired session", async () => {
    const agent = await makeAgent();
    const token = await createAgentSession(testPrisma, agent.id);
    await testPrisma.agentSession.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await findAgentBySessionToken(testPrisma, token)).toBeNull();
  });

  it("rejects a session belonging to a deactivated agent", async () => {
    const agent = await makeAgent();
    const token = await createAgentSession(testPrisma, agent.id);
    await testPrisma.agent.update({ where: { id: agent.id }, data: { isActive: false } });
    expect(await findAgentBySessionToken(testPrisma, token)).toBeNull();
  });

  it("stops working after revoke", async () => {
    const agent = await makeAgent();
    const token = await createAgentSession(testPrisma, agent.id);
    await revokeAgentSession(testPrisma, token);
    expect(await findAgentBySessionToken(testPrisma, token)).toBeNull();
  });

  it("revoking one agent's session leaves another's intact", async () => {
    const a = await makeAgent({ email: "a@example.com" });
    const b = await makeAgent({ email: "b@example.com" });
    const tokenA = await createAgentSession(testPrisma, a.id);
    const tokenB = await createAgentSession(testPrisma, b.id);
    await revokeAgentSession(testPrisma, tokenA);
    expect(await findAgentBySessionToken(testPrisma, tokenA)).toBeNull();
    expect((await findAgentBySessionToken(testPrisma, tokenB))?.id).toBe(b.id);
  });
});
```

The last test is one Plan 1's review flagged as missing for admin sessions. Include it here.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/auth/agent-session.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/agent-session`.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/lib/auth/agent-session.ts`:

```ts
import type { Agent, PrismaClient } from "@prisma/client";

import { AGENT_SESSION_MS } from "@/lib/auth/constants";
import { hashToken, randomToken } from "@/lib/auth/token";

export async function createAgentSession(prisma: PrismaClient, agentId: string): Promise<string> {
  const token = randomToken();
  await prisma.agentSession.create({
    data: {
      agentId,
      tokenHash: await hashToken(token),
      expiresAt: new Date(Date.now() + AGENT_SESSION_MS),
    },
  });
  return token;
}

export async function findAgentBySessionToken(
  prisma: PrismaClient,
  token: string
): Promise<Agent | null> {
  if (!token) return null;
  const session = await prisma.agentSession.findUnique({
    where: { tokenHash: await hashToken(token) },
    include: { agent: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;
  if (!session.agent.isActive) return null;
  return session.agent;
}

export async function revokeAgentSession(prisma: PrismaClient, token: string): Promise<void> {
  if (!token) return;
  await prisma.agentSession.deleteMany({ where: { tokenHash: await hashToken(token) } });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: 44 tests pass, exit 0 (36 + 8 new).

- [ ] **Step 5: Stage and hand off**

```bash
npx prettier --write src/lib/auth/agent-session.ts src/lib/auth/agent-session.test.ts
git add apps/web/src/lib/auth/agent-session.ts apps/web/src/lib/auth/agent-session.test.ts
```

Suggested message: `feat(portal): add agent session create, lookup, revoke`

---

### Task 4: One-time codes

**Files:**

- Create: `apps/web/src/lib/auth/agent-otp.ts`
- Test: `apps/web/src/lib/auth/agent-otp.test.ts`

**Interfaces:**

- Consumes: `OTP_TTL_MS`, `OTP_MAX_PER_HOUR`, `OTP_MAX_ATTEMPTS` (Task 1); `hashToken` (Task 2).
- Produces:
  - `issueAgentOtp(prisma, email): Promise<{ issued: boolean; code?: string }>` — `issued: false` when the email is unknown/inactive or the hourly limit is hit. The caller must return the same response either way.
  - `verifyAgentOtp(prisma, email, code): Promise<{ ok: true; agent: Agent } | { ok: false }>`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/lib/auth/agent-otp.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";

import { issueAgentOtp, verifyAgentOtp } from "@/lib/auth/agent-otp";
import { OTP_MAX_ATTEMPTS, OTP_MAX_PER_HOUR } from "@/lib/auth/constants";
import { resetAgentTables, testPrisma } from "@/lib/test/db";

const EMAIL = "agent@example.com";

async function makeAgent(overrides: Record<string, unknown> = {}) {
  return testPrisma.agent.create({ data: { email: EMAIL, name: "Agent", ...overrides } });
}

describe("agent one-time codes", () => {
  beforeEach(async () => {
    await resetAgentTables();
  });

  it("issues a 6-digit code to a known active agent", async () => {
    await makeAgent();
    const result = await issueAgentOtp(testPrisma, EMAIL);
    expect(result.issued).toBe(true);
    expect(result.code).toMatch(/^\d{6}$/);
  });

  it("does not issue to an unknown email", async () => {
    expect((await issueAgentOtp(testPrisma, "nobody@example.com")).issued).toBe(false);
  });

  it("does not issue to a deactivated agent", async () => {
    await makeAgent({ isActive: false });
    expect((await issueAgentOtp(testPrisma, EMAIL)).issued).toBe(false);
  });

  it("never writes the raw code to the database", async () => {
    await makeAgent();
    const { code } = await issueAgentOtp(testPrisma, EMAIL);
    const row = await testPrisma.agentOtp.findFirst();
    expect(row?.codeHash).not.toBe(code);
  });

  it("is case-insensitive on email", async () => {
    await makeAgent();
    expect((await issueAgentOtp(testPrisma, "AGENT@EXAMPLE.COM")).issued).toBe(true);
  });

  it("stops issuing after the hourly limit", async () => {
    await makeAgent();
    for (let i = 0; i < OTP_MAX_PER_HOUR; i++) {
      expect((await issueAgentOtp(testPrisma, EMAIL)).issued).toBe(true);
    }
    expect((await issueAgentOtp(testPrisma, EMAIL)).issued).toBe(false);
  });

  it("verifies a correct code and returns the agent", async () => {
    const agent = await makeAgent();
    const { code } = await issueAgentOtp(testPrisma, EMAIL);
    const result = await verifyAgentOtp(testPrisma, EMAIL, code!);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.agent.id).toBe(agent.id);
  });

  it("rejects a wrong code", async () => {
    await makeAgent();
    await issueAgentOtp(testPrisma, EMAIL);
    expect((await verifyAgentOtp(testPrisma, EMAIL, "000000")).ok).toBe(false);
  });

  it("consumes the code so it cannot be reused", async () => {
    await makeAgent();
    const { code } = await issueAgentOtp(testPrisma, EMAIL);
    expect((await verifyAgentOtp(testPrisma, EMAIL, code!)).ok).toBe(true);
    expect((await verifyAgentOtp(testPrisma, EMAIL, code!)).ok).toBe(false);
  });

  it("rejects an expired code", async () => {
    await makeAgent();
    const { code } = await issueAgentOtp(testPrisma, EMAIL);
    await testPrisma.agentOtp.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await verifyAgentOtp(testPrisma, EMAIL, code!)).ok).toBe(false);
  });

  it("kills the code after too many wrong guesses, even if the right one follows", async () => {
    await makeAgent();
    const { code } = await issueAgentOtp(testPrisma, EMAIL);
    for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) {
      expect((await verifyAgentOtp(testPrisma, EMAIL, "000000")).ok).toBe(false);
    }
    expect((await verifyAgentOtp(testPrisma, EMAIL, code!)).ok).toBe(false);
  });

  it("only accepts the newest code when several were issued", async () => {
    await makeAgent();
    const first = await issueAgentOtp(testPrisma, EMAIL);
    const second = await issueAgentOtp(testPrisma, EMAIL);
    expect((await verifyAgentOtp(testPrisma, EMAIL, first.code!)).ok).toBe(false);
    expect((await verifyAgentOtp(testPrisma, EMAIL, second.code!)).ok).toBe(true);
  });
});
```

The brute-force test is the important one. A 6-digit code has a million combinations; without the attempt cap an attacker exhausts it in minutes.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/auth/agent-otp.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/agent-otp`.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/lib/auth/agent-otp.ts`:

```ts
import type { Agent, PrismaClient } from "@prisma/client";

import { OTP_MAX_ATTEMPTS, OTP_MAX_PER_HOUR, OTP_TTL_MS } from "@/lib/auth/constants";
import { hashToken } from "@/lib/auth/token";

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

/** Six digits, uniformly distributed, from a CSPRNG. */
function generateCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0] % 1_000_000).padStart(6, "0");
}

export async function issueAgentOtp(
  prisma: PrismaClient,
  email: string
): Promise<{ issued: boolean; code?: string }> {
  const normalized = normalize(email);

  const agent = await prisma.agent.findUnique({ where: { email: normalized } });
  if (!agent || !agent.isActive) return { issued: false };

  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.agentOtp.count({
    where: { email: normalized, createdAt: { gt: since } },
  });
  if (recent >= OTP_MAX_PER_HOUR) return { issued: false };

  const code = generateCode();
  await prisma.agentOtp.create({
    data: {
      email: normalized,
      codeHash: await hashToken(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  return { issued: true, code };
}

export async function verifyAgentOtp(
  prisma: PrismaClient,
  email: string,
  code: string
): Promise<{ ok: true; agent: Agent } | { ok: false }> {
  const normalized = normalize(email);
  if (!/^\d{6}$/.test(code)) return { ok: false };

  const otp = await prisma.agentOtp.findFirst({
    where: { email: normalized, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return { ok: false };
  if (otp.expiresAt.getTime() <= Date.now()) return { ok: false };
  if (otp.attempts >= OTP_MAX_ATTEMPTS) return { ok: false };

  if (otp.codeHash !== (await hashToken(code))) {
    await prisma.agentOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false };
  }

  const agent = await prisma.agent.findUnique({ where: { email: normalized } });
  if (!agent || !agent.isActive) return { ok: false };

  await prisma.agentOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
  return { ok: true, agent };
}
```

Comparing hashes with `!==` is safe here: both sides are SHA-256 digests of the submitted value, so a timing difference reveals nothing about the secret. The attempt cap, not constant-time comparison, is what defends the code.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: 56 tests pass, exit 0 (44 + 12 new).

- [ ] **Step 5: Stage and hand off**

```bash
npx prettier --write src/lib/auth/agent-otp.ts src/lib/auth/agent-otp.test.ts
git add apps/web/src/lib/auth/agent-otp.ts apps/web/src/lib/auth/agent-otp.test.ts
```

Suggested message: `feat(portal): add agent one-time codes with rate and attempt limits`

---

### Task 5: Worker mail endpoint

**Files:**

- Create: `workers/enquire-api/src/agent-mail.ts`
- Modify: `workers/enquire-api/src/index.ts`

**Interfaces:**

- Consumes: `sendMail`, `smtpConfigured` from `workers/enquire-api/src/mail.ts`.
- Produces: `POST /mail/agent-otp` on the Worker, body `{ to: string; code: string; expiresMinutes: number }`, requiring the existing `Authorization: Bearer <API_SECRET>` header.

SMTP credentials stay on the Worker. Next.js calls this endpoint rather than sending mail itself.

- [ ] **Step 1: Export the shared HTML wrapper**

`workers/enquire-api/src/mail.ts` defines `shell()` and a `BRAND` colour constant, but **neither is exported** — they are module-private. Reusing them requires exporting them first.

In `workers/enquire-api/src/mail.ts`, add `export` to both declarations:

```ts
export const BRAND = /* existing value, unchanged */;

export function shell(opts: { preheader: string; title: string; bodyHtml: string }): string {
```

Change nothing else in that file. Do not alter `otpEmailHtml`, `submittedEmailHtml`, `sendMail`, or `smtpConfigured`.

- [ ] **Step 2: Write the template and handler**

Create `workers/enquire-api/src/agent-mail.ts`:

```ts
import { type Env, json } from "./cors";
import { BRAND, sendMail, shell, smtpConfigured } from "./mail";

function agentOtpEmail(code: string, expiresMinutes: number) {
  const subject = "RVCC Agent Portal — Access Code";
  const html = shell({
    preheader: `Your RVCC portal access code is ${code}`,
    title: "Access Code",
    bodyHtml: `
      <p style="margin:0 0 16px;">Use this one-time code to sign in to the RVCC agent portal.</p>
      <div style="margin:24px 0;padding:20px;border:2px solid ${BRAND};text-align:center;">
        <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#a1a1aa;font-weight:700;">One-time code</p>
        <p style="margin:0;font-size:32px;letter-spacing:0.25em;font-weight:800;color:${BRAND};font-family:ui-monospace,Menlo,Consolas,monospace;">${code}</p>
      </div>
      <p style="margin:0;color:#71717a;font-size:13px;">Expires in <strong>${expiresMinutes} minutes</strong>. Do not share this code.</p>
    `,
  });
  const text = `RVCC Agent Portal\n\nYour one-time access code is ${code}.\nIt expires in ${expiresMinutes} minutes.\n\n— RVCC Procurement`;
  return { subject, html, text };
}

export async function handleAgentOtpMail(env: Env, request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as {
    to?: string;
    code?: string;
    expiresMinutes?: number;
  } | null;

  const to = body?.to?.trim();
  const code = body?.code?.trim();
  const expiresMinutes = body?.expiresMinutes ?? 15;

  if (!to || !code || !/^\d{6}$/.test(code)) {
    return json(env, request, { error: "to and a 6-digit code are required" }, 400);
  }

  if (!smtpConfigured(env)) {
    console.error("[agent-mail] SMTP is not configured");
    return json(env, request, { error: "Mail is not configured" }, 503);
  }

  const { subject, text, html } = agentOtpEmail(code, expiresMinutes);
  await sendMail(env, { to, subject, html, text });
  return json(env, request, { ok: true });
}
```

Wrap the body in `shell()` if `mail.ts` exports it in a form that takes `{ preheader, title, bodyHtml }` — check the actual signature before using it, and match how `otpEmailHtml` calls it.

- [ ] **Step 3: Route it**

In `workers/enquire-api/src/index.ts`, add alongside the existing route checks (after the `assertApiSecret` gate, so the endpoint is authenticated):

```ts
if (url.pathname === "/mail/agent-otp" && request.method === "POST") {
  return await handleAgentOtpMail(env, request);
}
```

Import `handleAgentOtpMail` from `./agent-mail`.

**Note:** the Worker creates and closes its Postgres pool per request. This handler touches no database — do not add DB access to it.

- [ ] **Step 4: Typecheck and build**

From `workers/enquire-api`:

```bash
npx tsc --noEmit
export PATH="$HOME/.nvm/versions/node/v24.14.0/bin:$PATH" && npx wrangler deploy --dry-run --outdir /tmp/wr-plan2
```

Expected: `tsc` clean, and the dry-run reports a total upload size with no errors. Wrangler requires Node 22+; the default local Node is 20, hence the PATH line.

- [ ] **Step 5: Stage and hand off**

```bash
npx prettier --write src/agent-mail.ts src/index.ts
git add workers/enquire-api/src/agent-mail.ts workers/enquire-api/src/index.ts
```

Suggested message: `feat(worker): add authenticated agent OTP mail endpoint`

---

### Task 6: Mail client on the Next side

**Files:**

- Create: `apps/web/src/lib/mail-client.ts`

**Interfaces:**

- Consumes: `enquireWorkerFetch`, `workerConfigured` from `@/lib/enquire-worker`.
- Produces: `sendAgentOtpEmail(to: string, code: string): Promise<{ sent: boolean; error?: string }>`.

- [ ] **Step 1: Read the worker client**

Read `apps/web/src/lib/enquire-worker.ts`. `enquireWorkerFetch(path, init)` attaches `Authorization: Bearer $ENQUIRE_API_SECRET` and, by default, the enquire session cookie. **You must pass `sessionToken: null`** for this call — an agent OTP request has no enquire session, and letting it attach one would send an unrelated cookie to the Worker.

- [ ] **Step 2: Write the client**

Create `apps/web/src/lib/mail-client.ts`:

```ts
import "server-only";

import { OTP_TTL_MS } from "@/lib/auth/constants";
import { enquireWorkerFetch, workerConfigured } from "@/lib/enquire-worker";

/**
 * Sends an agent access code by asking the Cloudflare Worker to mail it.
 * SMTP credentials live only on the Worker and must never reach this app.
 * Never returns the code, and never logs it.
 */
export async function sendAgentOtpEmail(
  to: string,
  code: string
): Promise<{ sent: boolean; error?: string }> {
  if (!workerConfigured()) {
    return { sent: false, error: "Mail worker is not configured" };
  }

  try {
    const res = await enquireWorkerFetch("/mail/agent-otp", {
      method: "POST",
      sessionToken: null,
      body: { to, code, expiresMinutes: Math.round(OTP_TTL_MS / 60000) },
    });
    if (!res.ok) {
      return { sent: false, error: `Mail worker returned ${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error("[mail-client] agent OTP send failed", err);
    return { sent: false, error: "Mail worker unreachable" };
  }
}
```

The `catch` logs the error object but never the code — check that nothing you add logs `code`.

- [ ] **Step 3: Confirm the suite still passes**

Run: `npm test`
Expected: 56 tests pass, exit 0. This module has no unit test; it is exercised end to end in Task 7.

- [ ] **Step 4: Stage and hand off**

```bash
npx prettier --write src/lib/mail-client.ts
git add apps/web/src/lib/mail-client.ts
```

Suggested message: `feat(portal): add worker-backed agent OTP mail client`

---

### Task 7: Portal auth routes

**Files:**

- Create: `apps/web/src/app/api/portal/auth/request-code/route.ts`
- Create: `apps/web/src/app/api/portal/auth/verify/route.ts`
- Create: `apps/web/src/app/api/portal/auth/logout/route.ts`

**Interfaces:**

- Consumes: `issueAgentOtp`, `verifyAgentOtp` (Task 4); `createAgentSession`, `revokeAgentSession` (Task 3); `sendAgentOtpEmail` (Task 6); `AGENT_COOKIE`, `AGENT_SESSION_MS` (Task 1); `prisma` from `@/lib/db`.
- Produces: three POST endpoints under `/api/portal/auth/`.

- [ ] **Step 1: Write the request-code route**

Create `apps/web/src/app/api/portal/auth/request-code/route.ts`:

```ts
import { NextResponse } from "next/server";

import { z } from "zod";

import { issueAgentOtp } from "@/lib/auth/agent-otp";
import { prisma } from "@/lib/db";
import { sendAgentOtpEmail } from "@/lib/mail-client";

const schema = z.object({ email: z.string().email() });

/** Identical for every outcome, so nobody can probe which emails are registered. */
const GENERIC = "If your email is registered, a code is on the way.";

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const result = await issueAgentOtp(prisma, parsed.data.email);

  if (result.issued && result.code) {
    const mail = await sendAgentOtpEmail(parsed.data.email, result.code);
    if (!mail.sent) {
      // Log for operators; the caller still gets the generic message so a mail
      // outage does not become an account-existence oracle.
      console.error("[portal/request-code] mail failed:", mail.error);
    }
  }

  return NextResponse.json({ message: GENERIC });
}
```

Both the unknown-email case and the rate-limited case fall through to the same response. Do not add a "too many requests" status — that would reveal the email is real.

- [ ] **Step 2: Write the verify route**

Create `apps/web/src/app/api/portal/auth/verify/route.ts`:

```ts
import { NextResponse } from "next/server";

import { z } from "zod";

import { verifyAgentOtp } from "@/lib/auth/agent-otp";
import { createAgentSession } from "@/lib/auth/agent-session";
import { AGENT_COOKIE, AGENT_SESSION_MS } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
});

const GENERIC = "That code is invalid or has expired. Request a new one.";

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC }, { status: 400 });
  }

  const result = await verifyAgentOtp(prisma, parsed.data.email, parsed.data.code);
  if (!result.ok) {
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  const token = await createAgentSession(prisma, result.agent.id);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AGENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: AGENT_SESSION_MS / 1000,
  });
  return response;
}
```

The response body is `{ ok: true }` only. Do not include the agent record.

- [ ] **Step 3: Write the logout route**

Create `apps/web/src/app/api/portal/auth/logout/route.ts`:

```ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { revokeAgentSession } from "@/lib/auth/agent-session";
import { AGENT_COOKIE } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(AGENT_COOKIE)?.value;
  if (token) {
    await revokeAgentSession(prisma, token);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AGENT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
```

- [ ] **Step 4: Create a test agent and verify by hand**

Create one agent directly, from `apps/web`:

```bash
node --env-file=.env -e "
const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  await p.agent.upsert({
    where: { email: 'agent@example.com' },
    update: { isActive: true },
    create: { email: 'agent@example.com', name: 'Test Agent', company: 'ACME' },
  });
  console.log('agent ready');
  await p.\$disconnect();
})();
"
```

Start `npm run dev`, then:

```bash
curl -s -X POST http://localhost:3000/api/portal/auth/request-code \
  -H "Content-Type: application/json" -d '{"email":"agent@example.com"}' -w "\n%{http_code}\n"

curl -s -X POST http://localhost:3000/api/portal/auth/request-code \
  -H "Content-Type: application/json" -d '{"email":"nobody@example.com"}' -w "\n%{http_code}\n"
```

Expected: **both** return `200` with the identical `"If your email is registered, a code is on the way."` If they differ in body or status, the enumeration defence is broken — fix it before continuing.

The Worker may not be configured locally, in which case mail will fail and log — that is fine and must not change the response.

Only the code's hash is stored, so you cannot read a real code back out. **Do not add a temporary log line that prints the code** — a debug line that leaks a credential is exactly the kind of thing that survives into a commit. Instead, write a row with a code you already know:

```bash
node --env-file=.env -e "
const { PrismaClient } = require('@prisma/client');
const { webcrypto } = require('node:crypto');
(async () => {
  const code = '123456';
  const digest = await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  const codeHash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('');
  const p = new PrismaClient();
  await p.agentOtp.deleteMany({ where: { email: 'agent@example.com' } });
  await p.agentOtp.create({
    data: {
      email: 'agent@example.com',
      codeHash,
      expiresAt: new Date(Date.now() + 15*60*1000),
    },
  });
  console.log('planted code 123456');
  await p.\$disconnect();
})();
"
```

This mirrors exactly how `hashToken` hashes the code, so the planted row is indistinguishable from a real one. Now exercise verify:

```bash
curl -s -X POST http://localhost:3000/api/portal/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@example.com","code":"000000"}' -w "\n%{http_code}\n"

curl -s -X POST http://localhost:3000/api/portal/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@example.com","code":"123456"}' \
  -c /tmp/agent-cookie.txt -w "\n%{http_code}\n"
```

Expected: the wrong code gives `401` with the generic message; the planted code gives `200 {"ok":true}` and writes `rvcc_agent_session` into `/tmp/agent-cookie.txt` with `HttpOnly`. Keep that cookie file — Task 8 needs it.

Finally, confirm the code is single-use by replaying the successful call: expected `401`.

- [ ] **Step 5: Run the suite**

Run: `npm test`
Expected: 56 tests pass, exit 0.

- [ ] **Step 6: Stage and hand off**

```bash
npx prettier --write src/app/api/portal/auth/request-code/route.ts src/app/api/portal/auth/verify/route.ts src/app/api/portal/auth/logout/route.ts
git add apps/web/src/app/api/portal/auth
```

Suggested message: `feat(portal): add agent request-code, verify, and logout routes`

---

### Task 8: Portal guard and pages

**Files:**

- Create: `apps/web/src/lib/auth/agent-guard.ts`
- Create: `apps/web/src/app/portal/(protected)/layout.tsx`
- Create: `apps/web/src/app/portal/(protected)/page.tsx`
- Create: `apps/web/src/app/portal/login/page.tsx`
- Create: `apps/web/src/app/portal/login/layout.tsx`
- Create: `apps/web/src/app/portal/(protected)/PortalSignOutButton.tsx`

**Interfaces:**

- Consumes: `findAgentBySessionToken` (Task 3); `AGENT_COOKIE` (Task 1).
- Produces: `getAgentFromCookies(): Promise<Agent | null>` and `requireAgent(): Promise<Agent>`.

**Placement rule, repeated because it is the highest-risk part:** the login page must be a **sibling** of `(protected)`, never inside it. Inside the group, a logged-out agent is redirected to a page that redirects again — an infinite loop. Plan 1 hit exactly this and the route group is what prevents it.

- [ ] **Step 1: Write the guard**

Create `apps/web/src/lib/auth/agent-guard.ts`:

```ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Agent } from "@prisma/client";
import "server-only";

import { findAgentBySessionToken } from "@/lib/auth/agent-session";
import { AGENT_COOKIE } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

export async function getAgentFromCookies(): Promise<Agent | null> {
  const jar = await cookies();
  const token = jar.get(AGENT_COOKIE)?.value;
  if (!token) return null;
  return findAgentBySessionToken(prisma, token);
}

export async function requireAgent(): Promise<Agent> {
  const agent = await getAgentFromCookies();
  if (!agent) redirect("/portal/login");
  return agent;
}
```

- [ ] **Step 2: Write the protected layout and page**

Create `apps/web/src/app/portal/(protected)/layout.tsx`:

```tsx
import { requireAgent } from "@/lib/auth/agent-guard";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await requireAgent();
  return <div className="min-h-screen bg-neutral-50">{children}</div>;
}
```

Create `apps/web/src/app/portal/(protected)/page.tsx`:

```tsx
import { requireAgent } from "@/lib/auth/agent-guard";

import { PortalSignOutButton } from "./PortalSignOutButton";

export default async function PortalHome() {
  const agent = await requireAgent();
  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Portal</h1>
          <p className="mt-2 text-neutral-600">Signed in as {agent.email}</p>
        </div>
        <PortalSignOutButton />
      </div>
      <p className="mt-8 text-neutral-600">
        You have no open requirements right now. You will get an email when one is sent to you.
      </p>
    </main>
  );
}
```

`PortalSignOutButton` takes **no props**. Never pass the `agent` object into a client component.

- [ ] **Step 3: Write the sign-out button**

Create `apps/web/src/app/portal/(protected)/PortalSignOutButton.tsx`:

```tsx
"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

export function PortalSignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        setError("Could not sign out. Try again.");
        return;
      }
      router.replace("/portal/login");
      router.refresh();
    } catch {
      setError("Could not sign out. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="rounded border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-60"
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Write the login page**

Create `apps/web/src/app/portal/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

export default function PortalLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Enter a valid email address.");
        return;
      }
      setNotice(data.message);
      setStep("code");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "That code is invalid or has expired. Request a new one.");
        return;
      }
      router.replace("/portal");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <form
        onSubmit={step === "email" ? requestCode : submitCode}
        className="w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-semibold">Agent sign in</h1>

        <label className="block">
          <span className="text-sm text-neutral-700">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            disabled={step === "code"}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 disabled:bg-neutral-100"
          />
        </label>

        {step === "code" && (
          <label className="block">
            <span className="text-sm text-neutral-700">6-digit code</span>
            <input
              type="text"
              required
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 tracking-widest"
            />
          </label>
        )}

        {notice && <p className="text-sm text-neutral-600">{notice}</p>}
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
          {busy ? "Working…" : step === "email" ? "Send me a code" : "Sign in"}
        </button>

        {step === "code" && (
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setNotice(null);
              setError(null);
            }}
            className="w-full text-sm text-neutral-600 underline"
          >
            Use a different email
          </button>
        )}
      </form>
    </main>
  );
}
```

`autoComplete="one-time-code"` lets phones offer the code from the SMS/email notification.

- [ ] **Step 5: Redirect a signed-in agent away from login**

Create `apps/web/src/app/portal/login/layout.tsx`:

```tsx
import { redirect } from "next/navigation";

import { getAgentFromCookies } from "@/lib/auth/agent-guard";

export default async function PortalLoginLayout({ children }: { children: React.ReactNode }) {
  const agent = await getAgentFromCookies();
  if (agent) redirect("/portal");
  return <>{children}</>;
}
```

- [ ] **Step 6: Verify the gate and the absence of a redirect loop**

With `npm run dev` running:

```bash
curl -s -o /dev/null -w "no cookie -> /portal: %{http_code} %{redirect_url}\n" http://localhost:3000/portal
curl -s -o /dev/null -w "no cookie -> /portal/login: %{http_code}\n" http://localhost:3000/portal/login
```

Expected: `/portal` gives `307` to `/portal/login`; `/portal/login` gives `200`.

Then obtain a session by completing the code flow from Task 7, save the cookie, and:

```bash
curl -s -o /dev/null -w "with cookie -> /portal: %{http_code}\n" -b /tmp/agent-cookie.txt http://localhost:3000/portal
curl -s -o /dev/null -w "with cookie -> /portal/login: %{http_code} %{redirect_url}\n" -b /tmp/agent-cookie.txt http://localhost:3000/portal/login
```

Expected: `/portal` gives `200`; `/portal/login` gives `307` to `/portal` — **once**, not repeatedly.

Also confirm an admin cookie does not open the portal:

```bash
curl -s -o /dev/null -w "admin cookie -> /portal: %{http_code} %{redirect_url}\n" -b /tmp/admin-cookie.txt http://localhost:3000/portal
```

Expected: `307` to `/portal/login`. The two cookie names are distinct, so an admin session must not authenticate an agent.

- [ ] **Step 7: Run the suite and build**

```bash
npm test
npm run build
```

Expected: 56 tests pass exit 0; build succeeds.

- [ ] **Step 8: Stage and hand off**

```bash
npx prettier --write src/lib/auth/agent-guard.ts "src/app/portal/(protected)/layout.tsx" "src/app/portal/(protected)/page.tsx" "src/app/portal/(protected)/PortalSignOutButton.tsx" src/app/portal/login/page.tsx src/app/portal/login/layout.tsx
git add apps/web/src/lib/auth/agent-guard.ts apps/web/src/app/portal
```

Suggested message: `feat(portal): add agent guard, portal shell, and login page`

---

### Task 9: Admin screen for managing agents

**Files:**

- Create: `apps/web/src/app/api/admin/agents/route.ts`
- Create: `apps/web/src/app/admin/(protected)/agents/page.tsx`
- Create: `apps/web/src/app/admin/(protected)/agents/AgentForm.tsx`
- Create: `apps/web/src/app/admin/(protected)/agents/AgentToggle.tsx`

**Interfaces:**

- Consumes: `requireAdmin` (Plan 1, `@/lib/auth/admin-guard`); `prisma` from `@/lib/db`.
- Produces: `POST /api/admin/agents` (create) and `PATCH /api/admin/agents` (activate/deactivate), plus the `/admin/agents` screen.

- [ ] **Step 1: Write the API route**

Create `apps/web/src/app/api/admin/agents/route.ts`:

```ts
import { NextResponse } from "next/server";

import { z } from "zod";

import { getAdminFromCookies } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
});

const patchSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
});

/**
 * API routes cannot use requireAdmin() — it redirects, which is meaningless for
 * a fetch. Return 401 instead.
 */
async function guard(): Promise<NextResponse | null> {
  const admin = await getAdminFromCookies();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return null;
}

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.agent.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An agent with that email already exists." },
      { status: 409 }
    );
  }

  await prisma.agent.create({
    data: {
      email,
      name: parsed.data.name ?? "",
      company: parsed.data.company ?? "",
      phone: parsed.data.phone ?? "",
    },
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  await prisma.agent.update({
    where: { id: parsed.data.id },
    data: { isActive: parsed.data.isActive },
  });

  // Deactivating must end any live session immediately, not at expiry.
  if (!parsed.data.isActive) {
    await prisma.agentSession.deleteMany({ where: { agentId: parsed.data.id } });
  }

  return NextResponse.json({ ok: true });
}
```

The session deletion on deactivate matters: `findAgentBySessionToken` already rejects inactive agents, so this is belt and braces, but it also frees the rows and makes the intent explicit.

- [ ] **Step 2: Write the page**

Create `apps/web/src/app/admin/(protected)/agents/page.tsx`:

```tsx
import { requireAdmin } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db";

import { AgentForm } from "./AgentForm";
import { AgentToggle } from "./AgentToggle";

export default async function AgentsPage() {
  await requireAdmin();

  const agents = await prisma.agent.findMany({
    orderBy: [{ isActive: "desc" }, { email: "asc" }],
    select: { id: true, email: true, name: true, company: true, isActive: true },
  });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Agents</h1>
      <p className="mt-2 text-neutral-600">
        Only agents listed here can sign in to the portal and receive requirements.
      </p>

      <AgentForm />

      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-300">
            <th className="py-2">Email</th>
            <th className="py-2">Name</th>
            <th className="py-2">Company</th>
            <th className="py-2">Status</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent.id} className="border-b border-neutral-200">
              <td className="py-2">{agent.email}</td>
              <td className="py-2">{agent.name}</td>
              <td className="py-2">{agent.company}</td>
              <td className="py-2">{agent.isActive ? "Active" : "Inactive"}</td>
              <td className="py-2 text-right">
                <AgentToggle id={agent.id} isActive={agent.isActive} />
              </td>
            </tr>
          ))}
          {agents.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-neutral-500">
                No agents yet. Add the first one above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
```

Note the explicit `select`. `requireAdmin()` returns the full admin row including `passwordHash`, and the agent rows are passed to client components — take only the fields the UI renders.

- [ ] **Step 3: Write the form**

Create `apps/web/src/app/admin/(protected)/agents/AgentForm.tsx`:

```tsx
"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

export function AgentForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, company }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not add that agent.");
        return;
      }
      setEmail("");
      setName("");
      setCompany("");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-wrap items-end gap-3">
      <label className="block">
        <span className="text-sm text-neutral-700">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm text-neutral-700">Name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-sm text-neutral-700">Company</span>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="mt-1 rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-60"
      >
        {busy ? "Adding…" : "Add agent"}
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 4: Write the toggle**

Create `apps/web/src/app/admin/(protected)/agents/AgentToggle.tsx`:

```tsx
"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

export function AgentToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      await fetch("/api/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="rounded border border-neutral-300 px-3 py-1 text-sm disabled:opacity-60"
    >
      {isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
```

- [ ] **Step 5: Verify end to end**

With `npm run dev` running and an admin cookie saved at `/tmp/admin-cookie.txt`:

```bash
curl -s -X POST http://localhost:3000/api/admin/agents \
  -H "Content-Type: application/json" -b /tmp/admin-cookie.txt \
  -d '{"email":"newagent@example.com","name":"New","company":"ACME"}' -w "\n%{http_code}\n"
```

Expected: `200 {"ok":true}`. Repeat the same call — expected `409` with the duplicate message.

Then the authorization check, which matters most:

```bash
curl -s -X POST http://localhost:3000/api/admin/agents \
  -H "Content-Type: application/json" \
  -d '{"email":"sneaky@example.com"}' -w "\n%{http_code}\n"
```

Expected: `401 {"error":"Not authenticated"}` — **not** a redirect, and no agent created. Confirm with a database query that `sneaky@example.com` does not exist.

Also confirm an **agent** cookie cannot reach the admin API:

```bash
curl -s -X POST http://localhost:3000/api/admin/agents \
  -H "Content-Type: application/json" -b /tmp/agent-cookie.txt \
  -d '{"email":"sneaky2@example.com"}' -w "\n%{http_code}\n"
```

Expected: `401`. Confirm no agent was created.

Finally, deactivate an agent that has a live session and confirm their session no longer works:

```bash
curl -s -o /dev/null -w "deactivated agent -> /portal: %{http_code} %{redirect_url}\n" \
  -b /tmp/agent-cookie.txt http://localhost:3000/portal
```

Expected: `307` to `/portal/login`.

- [ ] **Step 6: Run the suite and build**

```bash
npm test
npm run build
```

Expected: 56 tests pass exit 0; build succeeds.

- [ ] **Step 7: Stage and hand off**

```bash
npx prettier --write src/app/api/admin/agents/route.ts "src/app/admin/(protected)/agents/page.tsx" "src/app/admin/(protected)/agents/AgentForm.tsx" "src/app/admin/(protected)/agents/AgentToggle.tsx"
git add apps/web/src/app/api/admin/agents "apps/web/src/app/admin/(protected)/agents"
```

Suggested message: `feat(admin): add agent management screen`

---

## Done when

- An admin can add an agent at `/admin/agents` and deactivate them.
- An agent receives a 6-digit code by email and signs in at `/portal/login`.
- `/portal` redirects to `/portal/login` without a valid agent session.
- An admin cookie cannot open `/portal`, and an agent cookie cannot call `/api/admin/agents`.
- Requesting a code for an unregistered email returns exactly the same response as for a registered one.
- A code dies after 5 wrong guesses, expires after 15 minutes, and cannot be reused.
- No more than 5 codes are issued per email per hour.
- Deactivating an agent ends their live session immediately.
- `npm test` passes (56 tests) and `npm run build` succeeds.

## Not in this plan

Requirements, invites, quotes, ranking, deadlines, and notification email are Plan 3. The portal home deliberately shows an empty state — that is where Plan 3's requirement list will go.

## Carried into Plan 3

- `/api/admin/*` routes need the 401-returning `guard()` pattern from Task 9, not `requireAdmin()`.
- `/api/portal/*` routes need the same treatment against `getAgentFromCookies()`.
- Every agent-side query must filter by the agent id from the session. Plan 3's quote endpoints are where this becomes load-bearing for sealed bidding.
- `/api/portal/auth/request-code` and the admin login route both need per-IP rate limiting before public exposure; per-account limits alone do not stop spraying.
- `.env.example` still needs updating for `TEST_DATABASE_URL` and the now-required `DATABASE_URL`.
