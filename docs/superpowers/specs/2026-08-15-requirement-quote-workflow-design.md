# Requirement → Quote Workflow — Design

**Date:** 2026-08-15
**Status:** Approved, ready for implementation planning
**Supersedes:** the "Work" section of `2026-08-13-vendor-agent-portal-design.md` (that spec assumed
agents were the only audience, and predates the monorepo restructure in `ca4c0ab`).

## Purpose

An admin posts a work requirement — scope of work, project, an internal selling price, a closing
time, and supporting documents. Invited **agents and registered suppliers** log into their own
portals, submit a price with remarks and attachments, and can revise it until the deadline. No
participant sees another's price. The admin compares every submitted quote side by side, in one
mixed ranking.

After the deadline the requirement disappears from participant portals, the admin evaluates the
quotes and awards one, and the winner is told by email and in-app notification. Every privileged
step is recorded.

Admins also create supplier and agent accounts directly — most of RVCC's suppliers already exist as
companies and should never have to fill in the public registration wizard.

Invited participants are emailed when a requirement is posted, and also see it in an in-app
notification bell. Several requirements can be open at once; a participant quotes each
independently.

## Base and prerequisites

This is built on `main` (`1890240` or later), whose layout is:

```
apps/       web (marketing + /enquire) · admin · vendor (supplier portal) · docs
packages/   db (shared Prisma schema) · auth-password (scrypt) · ui · eslint-config
workers/    admin-api · enquire-api · pdf-cdn · vendor-api
```

`main` has admins and suppliers but **no agents**. The agent work (models, OTP login, portal shell)
exists only on the `prod` lineage, which predates the restructure. Phase 0 below ports it across.

### Two risks to resolve before Phase 1

These are recorded because they affect the work but are not decided by it:

1. **`main` and `prod` carry incompatible Prisma schemas against what appears to be the same
   `DATABASE_URL`.** Which lineage owns the production database must be settled before any
   migration in this spec is applied.
2. **Password hashing differs between lineages** — `main` uses scrypt (`packages/auth-password`),
   `prod` uses PBKDF2-SHA256. This matters only if admin accounts are carried from one to the
   other. If they are, `verifyPassword` must accept both prefixes and re-hash on next successful
   login. Both encodings already lead with a scheme identifier, so this is a dual-verify, not a
   password reset.

## Architecture

`main` already uses a **backend-for-frontend** split, and this spec follows it rather than
introducing a second pattern:

- `workers/admin-api` and `workers/vendor-api` own authentication, password hashing, and all
  database access (`src/{auth,db,handlers,password}.ts`).
- `apps/admin` and `apps/vendor` are thin Next.js front-ends. Their API routes forward to the
  Worker with the session cookie (`adminWorkerFetch` / `vendorWorkerFetch`) and pass the response
  through. `apps/vendor` resolves identity from `GET /auth/me`, cached in-process for 45 seconds.

So new server logic goes in the Workers; new screens go in the Next apps; `packages/db` holds the
one shared Prisma schema both sides generate from.

Rationale: consistency beats preference here. A second data-access pattern would mean two places to
look for an authorisation rule, and the sealed-bidding rule below is exactly the kind of thing that
must stay in one obvious place.

Agents get a fifth app, `apps/agent`, plus `workers/agent-api`, mirroring the vendor pair.

Rejected alternatives:

- **Serve agents from `apps/vendor`.** Two unrelated login systems in one app makes the
  authorisation rules harder to read.
- **Put the new logic in the Next apps against `packages/db` directly.** This is what an earlier
  draft of this spec proposed, before the BFF structure was understood. It would leave admin and
  vendor data access split across two patterns.

## Participants

Prisma has no native polymorphic relations. `RequirementInvite`, `Quote`, and `Notification` each
carry **two nullable foreign keys with a database-level check that exactly one is set**:

```
agentId       String?  -> Agent
vendorUserId  String?  -> VendorUser
```

```sql
CHECK ((agentId IS NOT NULL)::int + (vendorUserId IS NOT NULL)::int = 1)
```

Postgres permits multiple NULLs in a unique index, so `@@unique([requirementId, agentId])` and
`@@unique([requirementId, vendorUserId])` correctly prevent duplicate invites within each audience
without interfering with each other.

Rejected: a single `participantId String` plus a type enum — it cannot be a foreign key, so nothing
stops a quote pointing at a deleted participant. Also rejected: a unified `Participant` identity
table that both `Agent` and `VendorUser` extend — it would mean migrating two working, live login
systems for one feature's convenience.

One helper resolves whoever is authenticated:

```ts
// packages/rfq — a new shared package consumed by apps/vendor and apps/agent,
// alongside the quote-form components both apps render.
export type Participant = { kind: "AGENT" | "SUPPLIER"; id: string };
export function getParticipantFromSession(): Promise<Participant | null>;
```

A new `packages/rfq` rather than duplicating the helper in each app: two copies of the rule that
enforces sealed bidding is two chances to get it wrong.

**The rule that enforces sealed bidding:** every participant-facing query filters by the id this
helper returns, never by a value from a URL parameter or request body. Written that way, agent A
cannot load supplier B's quote even by guessing an id. A UI that merely hides it is not enforcement.

## Data model

New models in `packages/db/prisma/schema.prisma`.

### Ported from the `prod` lineage (Phase 0)

`Agent`, `AgentOtp`, `AgentSession` — carried over unchanged in shape. `AgentOtp` stays separate
from `RegistrationOtp`; that table belongs to supplier registration, and mixing two logins into it
would make both harder to reason about.

### New

```
enum RequirementStatus { DRAFT OPEN CANCELLED AWARDED }
enum InviteEmailStatus { PENDING SENT FAILED }
enum QuoteStatus       { DRAFT SUBMITTED }
enum NotificationType  { REQUIREMENT_POSTED DEADLINE_CHANGED QUOTE_SUBMITTED QUOTE_AWARDED }

Requirement
  id, referenceNumber String? @unique
  scopeOfWork       String
  project           String
  sellingPrice      Decimal? @db.Decimal(14,2)   // admin reference, never sent to participants
  currency          String   @default("SAR")
  closesAt          DateTime
  status            RequirementStatus @default(DRAFT)
  createdByAdminId  -> AdminUser
  industries        Industry[]                    // optional targeting, see Industries
  awardedQuoteId    String?  @unique -> Quote     // see Awarding
  awardedAt         DateTime?
  awardedByAdminId  String?  -> AdminUser
  createdAt, updatedAt
  @@index([status, closesAt])

RequirementAttachment                 // admin's drawings / BOQ / scope documents
  id, requirementId -> Requirement
  fileName, r2Key, mimeType, sizeBytes Int
  createdAt
  @@index([requirementId])

RequirementInvite
  id, requirementId -> Requirement
  agentId String? -> Agent
  vendorUserId String? -> VendorUser
  emailStatus       InviteEmailStatus @default(PENDING)
  emailError        String?
  emailedAt         DateTime?
  @@unique([requirementId, agentId])
  @@unique([requirementId, vendorUserId])

Quote
  id, requirementId -> Requirement
  agentId String? -> Agent
  vendorUserId String? -> VendorUser
  newPrice          Decimal? @db.Decimal(14,2)
  remarks           String   @default("")
  status            QuoteStatus @default(DRAFT)
  submittedAt       DateTime?
  createdAt, updatedAt
  @@unique([requirementId, agentId])
  @@unique([requirementId, vendorUserId])

QuoteAttachment
  id, quoteId -> Quote
  fileName, r2Key, mimeType, sizeBytes Int
  createdAt
  @@index([quoteId])

Industry
  id, name String @unique, slug String @unique
  isActive Boolean @default(true)
  createdAt, updatedAt
  vendors      VendorUser[]      // implicit many-to-many
  agents       Agent[]
  requirements Requirement[]

Notification
  id
  agentId String? -> Agent
  vendorUserId String? -> VendorUser
  adminId String? -> AdminUser
  type              NotificationType
  title, body       String
  linkPath          String
  readAt            DateTime?
  createdAt
  @@index([agentId, readAt])
  @@index([vendorUserId, readAt])
  @@index([adminId, readAt])
```

### Changed on an existing model

`VendorUser.registrationId` becomes **optional**:

```
registrationId String?
registration   SupplierRegistration? @relation(..., onDelete: SetNull)
```

Today it is required with a cascading delete, which means a supplier who never registered through
the website cannot be represented at all — and deleting a registration would silently delete the
login. Both are wrong once admins create accounts directly. `SetNull` replaces `Cascade` so
removing a registration record never destroys a working account.

A vendor is admin-created exactly when `registrationId IS NULL`. No extra `source` column: a second
field that must agree with the first is a second field that can disagree with it.

### Decisions encoded above

**Rank is never stored.** It is computed when the admin opens the comparison: submitted quotes
sorted by `newPrice` ascending, lowest is rank 1, equal prices share a rank. A stored rank goes
stale the moment a participant edits their price.

**Money is `Decimal`, never `Float`.** Floating point loses precision on currency.

**There is no `CLOSED` status.** Closed means `closesAt < now()`. Storing it as well would let the
flag and the clock disagree. `CANCELLED` is stored because the clock cannot express it.

**`Notification` allows an admin recipient** so staff are told when a quote lands. It is the only
one of the three tables where the check constraint permits `adminId`.

### Field rules

- `referenceNumber` is generated when the requirement moves to `OPEN`, format `REQ-YYYYMMDD-NNNN`,
  matching `makeReferenceNumber()` in `workers/enquire-api/src/db.ts`. Drafts have none.
- `sellingPrice` is optional — an admin may post without a reference price.
- `newPrice` is optional while `DRAFT` and **required to reach `SUBMITTED`**. The submit endpoint
  rejects a missing or non-positive price with _"Enter a price before submitting."_ A `SUBMITTED`
  quote with no price must not be representable.
- Quotes are always in the requirement's `currency`; participants do not choose one.

## Admin-created accounts

Most of RVCC's suppliers already exist as companies; they should not have to fill in the public
registration wizard to get a login.

An admin creates an account from `apps/admin` with: name, email, company, phone, and one or more
industries. The server generates a temporary password with the existing
`generateTempPassword()` (14 characters, look-alike characters like `0/O` and `1/l/I` excluded),
hashes it with `packages/auth-password`, and sets `mustChangePassword = true`.

**The temporary password is shown to the admin exactly once, on the creation response, and is never
stored in plaintext or emailed.** Emailing an unexpired credential puts a working login in an inbox
forever; the admin hands it over through whatever channel they already trust.

On first login the vendor is forced to `/password` before any other route — this already exists on
`main` and needs no new work. After they set their own password, `mustChangePassword` clears and
they reach the portal normally.

The same flow creates agent accounts, except agents authenticate by OTP and so have no password
step at all.

Reused as-is from `main`: `mustChangePassword`, `generateTempPassword()`, the force-change page,
and the existing reset-password endpoint. New work is the create endpoint, the create form, and
industry assignment.

## Industries

An industry is a category like _Civil Works_, _MEP_, _Landscaping_. Admins manage the list, assign
one or more to each vendor and agent at creation time (editable later), and optionally tag a
requirement with industries.

Tagging a requirement pre-selects every active participant in those industries on the invite
screen. It is a **pre-selection, not a rule** — the admin can tick and untick freely before
posting. Invites are always stored per participant in `RequirementInvite`, never resolved from
industry at read time. Otherwise, moving a vendor between industries would retroactively rewrite
who was invited to a requirement that closed months ago.

## Awarding

Once quoting closes, the admin evaluates the comparison table and awards the requirement to one
submitted quote.

- Awarding sets `awardedQuoteId`, `awardedAt`, `awardedByAdminId`, and moves `status` to `AWARDED`.
- `awardedQuoteId` is `@unique` and validated to belong to _this_ requirement and to be
  `SUBMITTED`. A draft cannot win.
- `AWARDED` is a stored decision the clock cannot express, exactly like `CANCELLED` — this does not
  reintroduce the rejected `CLOSED` status, which was merely a restatement of `closesAt`.
- Awarding is permitted while the requirement is still open. Doing so stops further quoting, and
  the screen says so before confirming: _"This requirement is still open until 5 Sept, 6:00 PM.
  Awarding now closes it early."_
- Re-awarding a different quote is allowed and re-notifies; every change lands in `AuditLog`.

**Who is told what:** the winner receives an email and a `QUOTE_AWARDED` notification. Every admin
receives the same notification, so the decision is visible to staff who did not make it.
Non-winning participants are **not** notified in v1 — a "you lost" email is a commercial decision
RVCC should make deliberately, not one this spec makes for them.

## Recording

Everything privileged goes to the existing `AuditLog` model, which already carries
`adminId`, `action`, `entityType`, `entityId`, `metadata Json`, `createdAt`. No schema change.

Actions written: `requirement.created`, `requirement.posted`, `requirement.deadline_changed`,
`requirement.cancelled`, `requirement.awarded`, `quote.submitted`, `quote.updated`,
`vendor.created`, `vendor.deactivated`, `vendor.password_reset`, `agent.created`,
`agent.deactivated`.

`metadata` carries the before/after for anything that changed a number or a date — an award records
the winning price and the losing prices at that moment, so the decision can be reconstructed even
after quotes are edited.

Participant actions have `adminId = NULL`; the actor is identified in `metadata`. The column is
`AdminUser?` with `onDelete: SetNull`, so the trail survives staff turnover.

## KPIs

The admin dashboard reads these. All are computed with aggregate queries — nothing is denormalised,
because a stored counter that drifts from the rows it counts is worse than no counter.

**Headline:** active vendors, active agents, open requirements, requirements closing in 48 hours,
and **closed but not yet awarded** — the last is the one that represents work waiting on staff.

**Per requirement:** invited, submitted, response rate, lowest price, spread between lowest and
highest, and lowest price against `sellingPrice`.

**Per participant:** invitations received, quotes submitted, response rate, quotes won, win rate,
and average submission time before deadline. Response rate is the number that identifies suppliers
who are invited constantly and never reply.

Supporting indexes: `Quote(requirementId, status)`, `RequirementInvite(agentId)`,
`RequirementInvite(vendorUserId)`, and the existing `Requirement(status, closesAt)`.

Every KPI is scoped to a date range, defaulting to the last 90 days. An all-time average hides a
supplier who was reliable last year and has stopped responding this year.

## Sealed pricing

`sellingPrice` is admin-only. Participant-facing queries use an explicit `select` that omits the
column, rather than loading the row and trusting the UI not to render it. A test asserts it never
appears in any participant response payload.

## Screens

### Admin (`apps/admin`)

| Route                | Purpose                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `/` (dashboard)      | KPI headline, closing soon, awaiting award                       |
| `/requirements`      | List, open first, with quote counts                              |
| `/requirements/new`  | Post a requirement                                               |
| `/requirements/[id]` | Comparison table and award action                                |
| `/vendors`           | List with per-vendor KPIs; **create account**; deactivate; reset |
| `/agents`            | Same, for agents                                                 |
| `/industries`        | Manage the industry list                                         |

Posting captures scope of work, project, selling price, currency, closing date and time,
attachments, and a checkbox list of **agents and suppliers** to invite. Saved as `DRAFT` or posted
(`OPEN`).

The comparison shows one row per participant with name, audience, price, computed rank, remarks,
and attachments — a single mixed ranking across both audiences. Only `SUBMITTED` quotes appear; an
unsubmitted draft is not a quote. Invite rows with `emailStatus = FAILED` are shown with a
**Resend** action.

### Participants (`apps/vendor` for suppliers, new `apps/agent` for agents)

| Route                | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `/requirements`      | Invited, still-open requirements, time remaining |
| `/requirements/[id]` | Quote form                                       |

Both apps render the **same components**, differing only in which session resolved the participant.
The form shows scope of work, project, and the admin's attachments. It does **not** show selling
price. Fields: new price, remarks, attachments. Buttons: **Save draft** and **Submit**.

After submitting, editing stays open until the deadline, stated plainly:
_"Submitted. You can still change this until 5 Sept, 6:00 PM."_

The list query is: invited to this participant, `status = OPEN`, `closesAt > now()`. A requirement
"disappears" because it stops matching the query — no scheduled job is involved.

### Notification bell

A header bell in `apps/admin`, `apps/vendor`, and `apps/agent`, showing unread count and a list
linking to `linkPath`. Marked read on click. Server-rendered on load and refreshed on navigation —
no polling and no websockets at this volume.

### Edge cases

- **Deadline extended.** Allowed while open. Every invited participant is emailed and notified; a
  silent change would be unfair to anyone who already submitted.
- **Link opened after closing.** A clear page: _"This requirement closed on 5 Sept at 6:00 PM."_
  Not a 404, which reads as a broken system.

## Files

Uploads go through a Next.js route to Cloudflare R2 (the bucket already exists for the PDF CDN).

- Limits: 10 MB per file, 5 files per quote, 10 per requirement.
- Accepted: PDF, JPG, PNG, DOC/DOCX, XLS/XLSX. Type is checked server-side, never trusted from the
  client.
- The route verifies the caller owns the quote — or is an admin, for requirement attachments —
  before accepting the upload.
- Files are served through short-lived signed links, so a leaked URL does not expose a document
  indefinitely.

## Email

Sent via the existing Workers, reusing their SMTP configuration and HTML template so branding
matches the current OTP mail.

**The requirement is committed first; email is sent afterwards in the background** (`ctx.waitUntil`).
A slow or failing SMTP server must never block the admin's Post action or roll back a saved
requirement.

Each `RequirementInvite` carries its own `emailStatus`, so one bad address cannot stop the others.

Two emails: **requirement posted** and **deadline changed**. Neither contains the selling price.

## Error handling

- **Deadline race.** The server re-checks `closesAt` inside the same write that saves the quote.
  The on-screen countdown is display only; the browser clock is never trusted.
- **Double submit.** The unique constraints make the write an upsert, so a double-click cannot
  create two quotes.
- **Upload rejection.** Messages name the actual limit: _"This file is 14 MB. The limit is 10 MB."_
  — never "upload failed".
- **Stale session cookie.** When a server-side guard rejects a session, it **clears the cookie
  before redirecting to login**. Without this the edge proxy — which only sees that a cookie exists
  — bounces the user straight back, producing an infinite redirect loop. This is a live bug on the
  `prod` lineage (`apps/web/src/proxy.ts` vs the protected layouts) and must not be carried forward.

## Performance

These screens are read-heavy and list-shaped, which is where this kind of app usually gets slow.

- **Server Components by default.** Client components only where there is real interaction — the
  quote form, the invite picker, the notification bell. A comparison table does not need to ship
  JavaScript to be read.
- **No N+1 queries.** List screens use one query with the needed relations selected explicitly.
  The comparison table loads a requirement, its quotes, and each quote's participant and
  attachments in a single round trip.
- **`select`, never the whole row.** This is enforced for `sellingPrice` by the sealed-pricing rule
  above; the same discipline keeps payloads small everywhere else.
- **KPIs are aggregate queries**, not rows fetched and counted in JavaScript.
- **Indexes** as listed under KPIs, added in the same migration as the models they serve.
- **Pagination** on every list that grows without bound — requirements, vendors, agents, audit log.
  Default 25 per page.
- Attachments are served from R2 through signed links, so documents never pass through the app
  server.

## Testing

Run against a real local Postgres instance, not mocks.

Unit:

- Rank calculation, **including ties** — two participants at 80 both rank 1.
- Rank across audiences — an agent and a supplier at the same price tie.
- `closesAt` boundary: one second before and one second after.
- Submitting with no price is rejected; a `SUBMITTED` quote always has a positive price.
- The exactly-one-participant check rejects a row with both ids set, and one with neither.
- Awarding a `DRAFT` quote is rejected; awarding a quote from a different requirement is rejected.
- A generated temporary password is never returned twice and never appears in any stored field.

Integration:

- Full path: post → invite both audiences → each logs in → draft → submit → edit → deadline passes
  → disappears from participant lists, remains for admin.
- Award path: close → award → winner sees it in portal and receives email, admins are notified,
  `AuditLog` records the winning and losing prices.
- Admin creates a vendor with no registration → vendor logs in with the temporary password → is
  forced to `/password` → sets their own → reaches the portal.
- Email failure on one invite does not block the others.
- Upload rejects oversized files and disallowed types.
- A rejected session is redirected to login **once**, with the cookie cleared — no loop.

**Must never be skipped:** an authenticated participant requests another participant's quote by id
directly and receives not-found — tested in both directions, agent→supplier and supplier→agent.
This test is what proves sealed bidding holds.

## Build order

| Phase | Scope                                                                                                                                                                                               |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Port `Agent`/`AgentOtp`/`AgentSession` into `packages/db`; create `apps/agent` with OTP login, mirroring `apps/vendor`; reuse `packages/auth-password`. Includes the stale-cookie fix. No RFQ code. |
| 1     | `Industry`; make `VendorUser.registrationId` optional; admin create-account flow for vendors and agents; industry management.                                                                       |
| 2     | `Requirement`, `RequirementAttachment`, `RequirementInvite`; admin post + list screens; invite email; audit entries.                                                                                |
| 3     | `Quote`, `QuoteAttachment`; quote form in both portal apps; sealed-bidding tests.                                                                                                                   |
| 4     | Comparison table, computed ranking, and awarding.                                                                                                                                                   |
| 5     | `Notification` and the bell in all three apps.                                                                                                                                                      |
| 6     | KPI dashboard and per-participant metrics.                                                                                                                                                          |

Each phase is independently shippable and reviewable. Phase 1 comes before requirements because
there is nothing to invite until accounts exist.

## Out of scope for v1

- WhatsApp / SMS / browser push notifications
- Agent or supplier self-registration for requirements (admin invites)
- Quote version history (participants edit in place)
- Manual rank override
- Notifying non-winning participants
- Multi-round re-bidding (admin re-opens with a new deadline instead)
- Exporting the comparison to Excel or PDF

---

## Correction, 2026-08-16: there is no agent audience

The user confirmed that **"agent" at RVCC simply means vendor/supplier**. They are not two
audiences and never were. Everything above describing agents as a distinct participant type is
wrong, and the implementation has been simplified accordingly.

What this changed:

- **`Agent`, `AgentOtp`, `AgentSession` are gone**, along with `apps/agent` and
  `workers/agent-api`. Vendors sign in with a password, as they already did; the emailed
  six-digit code was removed with the rest.
- **The polymorphic participant is gone.** `RequirementInvite` and `Quote` each carry a plain,
  required `vendorUserId`. The two-nullable-FK pattern, the "exactly one participant" CHECK
  constraints, and the per-audience unique indexes were all scaffolding for a distinction that
  does not exist.
- **`Participant` is now `{ vendorUserId: string }`.** The comparison table has no audience
  column, and ranking is a single list of vendor quotes.

What did **not** change: admin-created supplier accounts, industries, requirements with a closing
time, sealed pricing, the ranking rule, and every safety constraint that was not about telling two
audiences apart. `Quote_submitted_needs_price` remains.

This correction supersedes the _Participants_, _Industries_, and _Screens_ sections above wherever
they mention agents, and it supersedes `2026-08-15-agent-portal.md` in full — that plan built
something RVCC does not need.
