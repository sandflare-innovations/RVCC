-- Idempotent production upgrade: portal access + requirements/quotes/notifications
-- Safe additive migration for DBs that only have registration + careers so far.

BEGIN;

DO $$ BEGIN
  CREATE TYPE "PortalAccess" AS ENUM ('HELD', 'RELEASED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RequirementStatus" AS ENUM ('DRAFT', 'OPEN', 'CANCELLED', 'AWARDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InviteEmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SUBMITTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('REQUIREMENT_POSTED', 'QUOTE_SUBMITTED', 'QUOTE_AWARDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Portal access / registration complete
ALTER TABLE "VendorUser"
  ADD COLUMN IF NOT EXISTS "portalAccess" "PortalAccess" NOT NULL DEFAULT 'HELD';

ALTER TABLE "SupplierRegistration"
  ADD COLUMN IF NOT EXISTS "registrationComplete" BOOLEAN NOT NULL DEFAULT false;

-- registrationId optional (admin-created vendors)
ALTER TABLE "VendorUser" ALTER COLUMN "registrationId" DROP NOT NULL;

ALTER TABLE "VendorUser" DROP CONSTRAINT IF EXISTS "VendorUser_registrationId_fkey";
ALTER TABLE "VendorUser"
  ADD CONSTRAINT "VendorUser_registrationId_fkey"
  FOREIGN KEY ("registrationId") REFERENCES "SupplierRegistration"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "VendorUser"
SET "portalAccess" = 'RELEASED'
WHERE "portalAccess" = 'HELD'
  AND ("registrationId" IS NULL OR "mustChangePassword" = false OR "lastLoginAt" IS NOT NULL);

UPDATE "SupplierRegistration"
SET "registrationComplete" = true
WHERE status IN ('SUBMITTED', 'APPROVED', 'REJECTED')
  AND "registrationComplete" = false;

CREATE INDEX IF NOT EXISTS "VendorUser_portalAccess_idx" ON "VendorUser" ("portalAccess");
CREATE INDEX IF NOT EXISTS "SupplierRegistration_registrationComplete_idx"
  ON "SupplierRegistration" ("registrationComplete");

CREATE TABLE IF NOT EXISTS "Industry" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Industry_name_key" ON "Industry"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Industry_slug_key" ON "Industry"("slug");
CREATE INDEX IF NOT EXISTS "Industry_isActive_idx" ON "Industry"("isActive");

CREATE TABLE IF NOT EXISTS "Requirement" (
  "id" TEXT NOT NULL,
  "referenceNumber" TEXT,
  "scopeOfWork" TEXT NOT NULL,
  "project" TEXT NOT NULL,
  "sellingPrice" DECIMAL(14,2),
  "currency" TEXT NOT NULL DEFAULT 'SAR',
  "closesAt" TIMESTAMP(3) NOT NULL,
  "status" "RequirementStatus" NOT NULL DEFAULT 'DRAFT',
  "createdByAdminId" TEXT NOT NULL,
  "awardedQuoteId" TEXT,
  "awardedAt" TIMESTAMP(3),
  "awardedByAdminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Requirement_referenceNumber_key" ON "Requirement"("referenceNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "Requirement_awardedQuoteId_key" ON "Requirement"("awardedQuoteId");
CREATE INDEX IF NOT EXISTS "Requirement_status_closesAt_idx" ON "Requirement"("status", "closesAt");

CREATE TABLE IF NOT EXISTS "RequirementInvite" (
  "id" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "vendorUserId" TEXT NOT NULL,
  "emailStatus" "InviteEmailStatus" NOT NULL DEFAULT 'PENDING',
  "emailError" TEXT,
  "emailedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RequirementInvite_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RequirementInvite_vendorUserId_idx" ON "RequirementInvite"("vendorUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "RequirementInvite_requirementId_vendorUserId_key"
  ON "RequirementInvite"("requirementId", "vendorUserId");

CREATE TABLE IF NOT EXISTS "Quote" (
  "id" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "vendorUserId" TEXT NOT NULL,
  "newPrice" DECIMAL(14,2),
  "remarks" TEXT NOT NULL DEFAULT '',
  "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Quote_requirementId_status_idx" ON "Quote"("requirementId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "Quote_requirementId_vendorUserId_key"
  ON "Quote"("requirementId", "vendorUserId");

CREATE TABLE IF NOT EXISTS "_IndustryToVendorUser" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "_IndustryToVendorUser_AB_unique" ON "_IndustryToVendorUser"("A", "B");
CREATE INDEX IF NOT EXISTS "_IndustryToVendorUser_B_index" ON "_IndustryToVendorUser"("B");

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "vendorUserId" TEXT,
  "adminId" TEXT,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL DEFAULT '',
  "linkPath" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Notification_vendorUserId_readAt_idx" ON "Notification"("vendorUserId", "readAt");
CREATE INDEX IF NOT EXISTS "Notification_adminId_readAt_idx" ON "Notification"("adminId", "readAt");

-- FKs (ignore if already present)
DO $$ BEGIN
  ALTER TABLE "Requirement"
    ADD CONSTRAINT "Requirement_createdByAdminId_fkey"
    FOREIGN KEY ("createdByAdminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Requirement"
    ADD CONSTRAINT "Requirement_awardedByAdminId_fkey"
    FOREIGN KEY ("awardedByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Requirement"
    ADD CONSTRAINT "Requirement_awardedQuoteId_fkey"
    FOREIGN KEY ("awardedQuoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "RequirementInvite"
    ADD CONSTRAINT "RequirementInvite_requirementId_fkey"
    FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "RequirementInvite"
    ADD CONSTRAINT "RequirementInvite_vendorUserId_fkey"
    FOREIGN KEY ("vendorUserId") REFERENCES "VendorUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Quote"
    ADD CONSTRAINT "Quote_requirementId_fkey"
    FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Quote"
    ADD CONSTRAINT "Quote_vendorUserId_fkey"
    FOREIGN KEY ("vendorUserId") REFERENCES "VendorUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_IndustryToVendorUser"
    ADD CONSTRAINT "_IndustryToVendorUser_A_fkey"
    FOREIGN KEY ("A") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_IndustryToVendorUser"
    ADD CONSTRAINT "_IndustryToVendorUser_B_fkey"
    FOREIGN KEY ("B") REFERENCES "VendorUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_vendorUserId_fkey"
    FOREIGN KEY ("vendorUserId") REFERENCES "VendorUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Quote" DROP CONSTRAINT IF EXISTS "Quote_submitted_needs_price";
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_submitted_needs_price"
  CHECK (status <> 'SUBMITTED' OR ("newPrice" IS NOT NULL AND "newPrice" > 0));

COMMIT;
