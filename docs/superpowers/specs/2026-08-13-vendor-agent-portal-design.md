# Vendor / Agent Portal — Design

**Date:** 2026-08-13
**Status:** Approved, ready for implementation planning

## Purpose

Admins post work requirements with a closing time. Invited field agents log in, enter a
price with remarks and attachments, and submit before the deadline. Agents cannot see one
another's prices. Admin compares all quotes side by side with an automatic ranking.

Invited agents are emailed automatically when a requirement is posted.

## Scope

This spec covers two subsystems, built in this order:

1. **Admin accounts and authentication** — nothing else can be built until admins can log in.
2. **The requirement → quote workflow.**

Out of scope for v1, deliberately:

- Submit-confirmation email to the agent
- Agent self-registration (admins add agents)
- Quote version history (agents edit in place)
- Manual rank override

## Architecture

All portal code lives in `apps/web` (Next.js, App Router) and talks to Postgres through
Prisma directly. The existing Cloudflare Worker is used only for sending email, which it
already does.

Rationale: password hashing, file uploads, and admin tables are straightforward in Node and
awkward at the edge. Portal traffic is a handful of admins and agents, so edge latency is
not the constraint. This keeps one codebase and one auth model.

Rejected alternatives:

- **Proxy everything through the Worker** (mirroring the enquire flow). Keeps DB credentials
  off Vercel, but inherits the per-request Postgres connection cost documented in
  `workers/enquire-api/src/db.ts`, and makes PBKDF2 and multipart uploads harder for no
  benefit at this volume.
- **Extend `workers/enquire-api`.** That Worker's domain is supplier registration. Adding an
  unrelated domain to it makes both harder to reason about.

## Data model

New Prisma models in `apps/web/prisma/schema.prisma`.

### Admin

```
AdminUser
  id, email @unique, name
  passwordHash      String   // pbkdf2$sha256$210000$<salt_b64>$<hash_b64>
  isActive          Boolean  @default(true)
  failedAttempts    Int      @default(0)
  lockedUntil       DateTime?
  lastLoginAt       DateTime?
  createdAt, updatedAt

AdminSession
  id, adminUserId -> AdminUser
  tokenHash         String @unique   // SHA-256 of the cookie value
  expiresAt         DateTime
  createdAt
  @@index([adminUserId])
```

### Agent

```
Agent
  id, email @unique, name, company, phone
  isActive          Boolean @default(true)
  createdAt, updatedAt

AgentOtp
  id, email, codeHash, expiresAt, consumedAt, createdAt
  @@index([email])

AgentSession
  id, agentId -> Agent
  tokenHash         String @unique
  expiresAt         DateTime
  createdAt
  @@index([agentId])
```

`AgentOtp` is separate from the existing `RegistrationOtp`. That table belongs to supplier
registration; mixing two logins into it would make both harder to reason about.

### Work

```
enum RequirementStatus { DRAFT OPEN CANCELLED }
enum InviteEmailStatus { PENDING SENT FAILED }
enum QuoteStatus       { DRAFT SUBMITTED }

Requirement
  id, referenceNumber @unique
  scopeOfWork       String
  project           String
  sellingPrice      Decimal?  @db.Decimal(14,2)   // admin reference, never sent to agents
  currency          String    @default("SAR")
  closesAt          DateTime
  status            RequirementStatus @default(DRAFT)
  createdByAdminId  -> AdminUser
  createdAt, updatedAt
  @@index([status, closesAt])

RequirementInvite
  id, requirementId -> Requirement, agentId -> Agent
  emailStatus       InviteEmailStatus @default(PENDING)
  emailError        String?
  emailedAt         DateTime?
  @@unique([requirementId, agentId])

Quote
  id, requirementId -> Requirement, agentId -> Agent
  newPrice          Decimal?  @db.Decimal(14,2)
  remarks           String    @default("")
  status            QuoteStatus @default(DRAFT)
  submittedAt       DateTime?
  createdAt, updatedAt
  @@unique([requirementId, agentId])

QuoteAttachment
  id, quoteId -> Quote
  fileName, r2Key, mimeType
  sizeBytes         Int
  createdAt
  @@index([quoteId])
```

### Two decisions encoded above

**Ranking is never stored.** It is computed when admin opens the comparison: submitted quotes
sorted by `newPrice` ascending, lowest is rank 1, equal prices share a rank. A stored rank
would go stale the moment an agent edits their price.

**Money is `Decimal`, never `Float`.** Floating point loses precision on currency.

**There is no `CLOSED` status.** Closed means `closesAt < now()`. Storing it as well would let
the flag and the clock disagree. `CANCELLED` is stored because the clock cannot express it.

### Field rules

- `Requirement.referenceNumber` is generated when the requirement moves to `OPEN`, in the
  format `REQ-YYYYMMDD-NNNN`, matching the existing `makeReferenceNumber()` convention in
  `workers/enquire-api/src/db.ts`. Drafts have none.
- `Requirement.sellingPrice` is optional — admin may post without a reference price.
- `Quote.newPrice` is optional while `status = DRAFT`, and **required to move to
  `SUBMITTED`**. The submit endpoint rejects a missing or non-positive price with
  _"Enter a price before submitting."_ A `SUBMITTED` quote with no price must not be
  representable.
- Quotes are always in the requirement's `currency`; agents do not choose one.

## Authentication

### Admin passwords

- PBKDF2-SHA256, 210,000 iterations, 16-byte random salt per user, via WebCrypto (works in
  both Node and Workers; bcrypt does not).
- Stored as one string: `pbkdf2$sha256$210000$<salt_b64>$<hash_b64>`.
- Verification uses a timing-safe comparison.
- No public signup route. The first admin is created by a CLI seed script; further admins are
  created by an existing admin.
- After 5 consecutive failures the account locks for 15 minutes via `failedAttempts` and
  `lockedUntil`. Counters reset on success.

### Agent codes

Reuses the existing OTP pattern. A code is only issued if the email exists in `Agent` and
`isActive` is true.

The response is identical whether or not the email is registered: _"If your email is
registered, a code is on the way."_ Distinguishing the two would let anyone enumerate which
agents the company works with.

Rate limit: 5 requests per hour per email, matching the existing supplier flow.

### Sessions

- 32 bytes of randomness, sent as the cookie value.
- The database stores only the **SHA-256 hash**, so a database dump does not yield live
  sessions.
- Cookies are `httpOnly`, `Secure`, `SameSite=Lax`.
- Separate cookie names per audience so an admin session can never be read as an agent one.
- Admin session: 8 hours. Agent session: 24 hours.

### Authorisation

| Path        | Requires            |
| ----------- | ------------------- |
| `/admin/*`  | valid admin session |
| `/portal/*` | valid agent session |

Enforced server-side in a shared helper on every request. Never in client code.

**The rule that enforces sealed bidding:** every agent-side query filters by the agent id
taken from the session, never from a URL parameter or request body. Written this way, agent A
cannot load agent B's quote even by guessing an id. The UI hiding it is not enforcement.

## Screens

### Admin

| Route                      | Purpose                                     |
| -------------------------- | ------------------------------------------- |
| `/admin/login`             | Email + password                            |
| `/admin`                   | Requirements, open first, with quote counts |
| `/admin/requirements/new`  | Post a requirement                          |
| `/admin/requirements/[id]` | Comparison table                            |
| `/admin/agents`            | Add / deactivate approved agents            |

Posting captures scope of work, project, selling price, currency, closing date and time, and
a checkbox list of agents to invite. Can be saved as `DRAFT` or posted (`OPEN`).

The comparison screen shows one column per agent with price, computed rank, remarks, and
attachments. Only `SUBMITTED` quotes appear — an unsubmitted draft is not a quote.

### Agent

| Route                       | Purpose                                              |
| --------------------------- | ---------------------------------------------------- |
| `/portal/login`             | Email, then 6-digit code                             |
| `/portal`                   | Invited, still-open requirements with time remaining |
| `/portal/requirements/[id]` | Quote form                                           |

The quote form shows scope of work and project. It does **not** show selling price. Fields:
new price, remarks, attachments. Buttons: **Save draft** and **Submit**.

After submitting, editing stays open until the deadline. The screen states this plainly:
_"Submitted. You can still change this until 5 Sept, 6:00 PM."_

The agent list query is: invited to this agent, `status = OPEN`, and `closesAt > now()`. The
requirement "disappears" because it stops matching the query — no scheduled job is involved.

### Edge cases

- **Deadline extended.** Allowed while open. All invited agents are emailed about the change;
  a silent change would be unfair to anyone who already submitted.
- **Link opened after closing.** A clear page: _"This requirement closed on 5 Sept at
  6:00 PM."_ Not a 404, which reads as a broken system.

## Files

Agent uploads go through a Next.js route to Cloudflare R2 (the bucket already exists for the
PDF CDN).

- Limits: 10 MB per file, 5 files per quote.
- Accepted: PDF, JPG, PNG, DOC/DOCX. Type is checked server-side, not trusted from the client.
- The route verifies the agent owns the quote before accepting the upload.
- Files are served through short-lived signed links, so a leaked URL does not expose a quote
  document indefinitely.

## Email

Sent via the existing Worker, reusing its SMTP configuration and HTML template so branding
matches the current OTP emails.

**Ordering: the requirement is committed first, emails are sent afterwards in the background**
(`ctx.waitUntil`). A slow or failing SMTP server must never block the admin's Post action or
roll back a saved requirement.

Each `RequirementInvite` carries its own `emailStatus`. One bad address must not stop the
other recipients. The admin screen shows failures and offers **Resend**.

Email contents: scope of work, project, deadline, link to the quote form. It does **not**
contain the selling price.

Two emails in v1:

1. Requirement posted
2. Deadline changed

## Error handling

- **Deadline race.** The server re-checks `closesAt` inside the same write that saves the
  quote. The on-screen countdown is display only; the browser clock is never trusted.
- **Double submit.** The unique constraint on `(requirementId, agentId)` makes the write an
  upsert, so a double-click cannot create two quotes.
- **Upload rejection.** Messages name the actual limit: _"This file is 14 MB. The limit is
  10 MB."_ — not "upload failed".
- **Locked account.** _"Too many failed attempts. Try again in 15 minutes."_ Never "wrong
  password" once locked.
- **Expired or wrong OTP.** _"That code is invalid or has expired. Request a new one."_

## Testing

Run against a real local Postgres instance, not mocks.

Unit:

- Password hash and verify round-trip; wrong password fails; lockout after 5 attempts.
- Rank calculation, **including ties** — two agents at 80 both rank 1.
- `closesAt` boundary: one second before and one second after.
- Submitting with no price is rejected; a `SUBMITTED` quote always has a positive price.

Integration:

- Full path: post → invite → agent login → draft → submit → edit → deadline passes →
  disappears from the agent list, remains for admin.
- Email failure on one invite does not block the others.
- Upload rejects oversized files and disallowed types.

**Must never be skipped:** agent A, authenticated, requests agent B's quote by id directly and
receives not-found. This test is what proves sealed bidding holds.

## Open items

None. All decisions above are settled.
