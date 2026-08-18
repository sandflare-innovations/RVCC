-- Constraints Prisma cannot express. Idempotent: safe to run after every
-- `prisma db push`, which does not create or preserve these itself.

-- A submitted quote without a positive price is not a quote. Enforcing it here
-- means no code path can create one, however the submit endpoint changes later.
ALTER TABLE "Quote" DROP CONSTRAINT IF EXISTS "Quote_submitted_needs_price";
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_submitted_needs_price"
  CHECK (status <> 'SUBMITTED' OR ("newPrice" IS NOT NULL AND "newPrice" > 0));

-- The former "exactly one participant" checks on RequirementInvite and Quote are
-- gone: there is only one kind of participant. "Agent" at RVCC just means vendor,
-- so both tables now carry a plain required vendorUserId and the database
-- enforces that by itself.
ALTER TABLE "RequirementInvite" DROP CONSTRAINT IF EXISTS "RequirementInvite_one_participant";
ALTER TABLE "Quote" DROP CONSTRAINT IF EXISTS "Quote_one_participant";
