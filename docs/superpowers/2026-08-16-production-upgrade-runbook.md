# Production upgrade runbook — requirements and quotes

**Script:** `packages/db/prisma/upgrades/2026-08-16-requirements-and-quotes.sql`
**Adds:** 5 tables (`Industry`, `Requirement`, `RequirementInvite`, `Quote`, `_IndustryToVendorUser`), 3 enum types, 11 indexes.
**Changes:** `VendorUser.registrationId` becomes optional, and its foreign key changes from `CASCADE` to `SET NULL`.
**Removes:** nothing. There is no `DROP TABLE`, `DROP COLUMN`, `TRUNCATE` or `DELETE` in the executable SQL.

## Before anything else: the password rotation

Changing the database password invalidates the old one **everywhere it was used**. If the live
apps still hold the old string, they are already failing to reach the database.

Check and update the `DATABASE_URL` environment variable in all three Vercel projects
(`rvcc-web`, `rvcc-app`, `rvcc-admin`) and in the Cloudflare Workers
(`wrangler secret put DATABASE_URL` for `admin-api`, `vendor-api`, `enquire-api`). Redeploy after
updating, because Vercel bakes environment variables in at build time.

Do this before the upgrade. A half-reachable database makes every later step harder to diagnose.

## Which connection string to use

Prisma Postgres gives out two kinds, and they are not interchangeable:

| Kind                | Looks like                                                          | Use it for                                               |
| ------------------- | ------------------------------------------------------------------- | -------------------------------------------------------- |
| **Direct**          | `postgresql://USER:PASS@db.prisma.io:5432/postgres?sslmode=require` | This upgrade, `psql`, `prisma db push`, `prisma migrate` |
| Pooled / Accelerate | `prisma+postgres://accelerate.prisma-data.net/?api_key=…`           | The running application only                             |

**This runbook needs the direct one.** Schema changes cannot go through the pooled endpoint.

Put it in a file that is already gitignored rather than pasting it into a shell where it lands in
your history:

```bash
# from the repo root
printf 'DATABASE_URL="postgresql://USER:PASS@db.prisma.io:5432/postgres?sslmode=require"\n' > .env.production.local
git check-ignore .env.production.local   # must print the filename
```

## 1. Take a backup

Non-negotiable. The script is additive, but a backup costs a minute and removes all doubt.

```bash
export $(grep DATABASE_URL .env.production.local | xargs)
pg_dump "$DATABASE_URL" -Fc -f "rvcc-backup-$(date +%Y%m%d-%H%M).dump"
ls -lh rvcc-backup-*.dump
```

If `pg_dump` reports a server version mismatch, use Prisma Console's own backup/export instead.
Do not skip this step.

## 2. Confirm the database is the one you expect

```bash
psql "$DATABASE_URL" -tAc \
  "SELECT count(*) FROM pg_tables WHERE schemaname='public'"
```

Expected: **15**. If you see 20, the upgrade has already been applied — stop, nothing to do.
If you see anything else, stop and re-check which database the string points at.

## 3. Apply the upgrade

`--single-transaction` means a failure anywhere rolls the whole thing back, leaving the database
exactly as it was.

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction \
  -f packages/db/prisma/upgrades/2026-08-16-requirements-and-quotes.sql
```

## 4. Apply the CHECK constraint

Prisma cannot express this one, so it lives in its own file and must be run separately. It is what
makes a submitted quote without a price impossible to store.

```bash
npm run -w @repo/db constraints
```

## 5. Verify

```bash
psql "$DATABASE_URL" -tAc \
  "SELECT count(*) FROM pg_tables WHERE schemaname='public'"          # expect 20

psql "$DATABASE_URL" -tAc \
  "SELECT count(*) FROM \"VendorUser\""                                # unchanged from before

psql "$DATABASE_URL" -tAc \
  "SELECT conname FROM pg_constraint WHERE conname = 'Quote_submitted_needs_price'"
```

The middle query matters most: your existing supplier logins must still be there, and the same
count as before.

## 6. Deploy the code

Only now. The new screens reference tables that must already exist.

Merge the branch into `main` and let the three Vercel projects redeploy.

## If something goes wrong

The transaction in step 3 rolls back on its own, so a failure there leaves nothing behind — read
the error, fix it, run it again.

If a problem surfaces after the upgrade, the new tables are unused by the old code, so the fastest
recovery is to redeploy the previous commit and leave the tables in place. Restore from the step-1
backup only if data is actually wrong.

## Rehearsal already performed

On 2026-08-16 this exact script was run against a throwaway database built from production's
current schema, seeded with an admin, a registration and a vendor linked to it:

- script succeeded inside a single transaction
- tables went 15 → 20
- all three seeded rows survived, and the vendor kept its `registrationId` rather than being nulled
- the CHECK constraint applied cleanly

That is not a substitute for the backup in step 1, but it does mean the script is known to run.
