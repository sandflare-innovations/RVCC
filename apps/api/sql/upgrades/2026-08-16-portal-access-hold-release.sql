-- 2026-08-16: registration completeness + portal access hold/release
-- Safe to run once against production after backup.

DO $$ BEGIN
  CREATE TYPE "PortalAccess" AS ENUM ('HELD', 'RELEASED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "VendorUser"
  ADD COLUMN IF NOT EXISTS "portalAccess" "PortalAccess" NOT NULL DEFAULT 'HELD';

-- Existing accounts that already signed in / were admin-created keep working.
UPDATE "VendorUser"
SET "portalAccess" = 'RELEASED'
WHERE "portalAccess" = 'HELD'
  AND ("registrationId" IS NULL OR "mustChangePassword" = false OR "lastLoginAt" IS NOT NULL);

ALTER TABLE "SupplierRegistration"
  ADD COLUMN IF NOT EXISTS "registrationComplete" BOOLEAN NOT NULL DEFAULT false;

UPDATE "SupplierRegistration"
SET "registrationComplete" = true
WHERE status IN ('SUBMITTED', 'APPROVED', 'REJECTED');

CREATE INDEX IF NOT EXISTS "VendorUser_portalAccess_idx" ON "VendorUser" ("portalAccess");
CREATE INDEX IF NOT EXISTS "SupplierRegistration_registrationComplete_idx"
  ON "SupplierRegistration" ("registrationComplete");
