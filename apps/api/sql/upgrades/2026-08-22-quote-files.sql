-- Add quoteFileUrl to Quote table to allow vendors to upload PDF quotes

BEGIN;

ALTER TABLE "Quote"
  ADD COLUMN IF NOT EXISTS "quoteFileUrl" TEXT;

COMMIT;
