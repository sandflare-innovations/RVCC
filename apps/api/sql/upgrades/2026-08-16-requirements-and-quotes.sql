-- ============================================================================
-- Production upgrade: supplier accounts, industries, requirements and quotes
--
-- Generated 2026-08-16 by:
--   npx prisma migrate diff \
--     --from-schema-datamodel <schema at origin/main 1890240> \
--     --to-schema-datamodel   apps/api/prisma/schema.prisma \
--     --script
--
-- SAFETY: additive only. Audited line by line — there is no DROP TABLE,
-- DROP COLUMN, TRUNCATE or DELETE anywhere in this file. Existing suppliers,
-- registrations, admin accounts and job postings are untouched.
--
-- The one apparent exception is the VendorUser block below: it drops and
-- re-adds a FOREIGN KEY constraint in order to change its delete behaviour
-- from CASCADE to SET NULL, and makes registrationId optional. Dropping NOT
-- NULL is a widening change; no row loses its value. This is what allows an
-- admin to create a supplier who never used the public registration wizard,
-- and it stops a deleted registration from destroying a working login.
--
-- Run inside a transaction so a failure leaves nothing half-applied:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f this-file
--
-- Then apply CHECK constraints from apps/api/sql/constraints.sql if needed.
-- ============================================================================

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('DRAFT', 'OPEN', 'CANCELLED', 'AWARDED');

-- CreateEnum
CREATE TYPE "InviteEmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- DropForeignKey
ALTER TABLE "VendorUser" DROP CONSTRAINT "VendorUser_registrationId_fkey";

-- AlterTable
ALTER TABLE "VendorUser" ALTER COLUMN "registrationId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Industry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "scopeOfWork" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "sellingPrice" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "closesAt" TIMESTAMP(3) NOT NULL,
    "status" "RequirementStatus" NOT NULL DEFAULT 'DRAFT',
    "createdByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementInvite" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "vendorUserId" TEXT NOT NULL,
    "emailStatus" "InviteEmailStatus" NOT NULL DEFAULT 'PENDING',
    "emailError" TEXT,
    "emailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequirementInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "vendorUserId" TEXT NOT NULL,
    "newPrice" DECIMAL(14,2),
    "remarks" TEXT NOT NULL DEFAULT '',
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_IndustryToVendorUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Industry_name_key" ON "Industry"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Industry_slug_key" ON "Industry"("slug");

-- CreateIndex
CREATE INDEX "Industry_isActive_idx" ON "Industry"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Requirement_referenceNumber_key" ON "Requirement"("referenceNumber");

-- CreateIndex
CREATE INDEX "Requirement_status_closesAt_idx" ON "Requirement"("status", "closesAt");

-- CreateIndex
CREATE INDEX "RequirementInvite_vendorUserId_idx" ON "RequirementInvite"("vendorUserId");

-- CreateIndex
CREATE UNIQUE INDEX "RequirementInvite_requirementId_vendorUserId_key" ON "RequirementInvite"("requirementId", "vendorUserId");

-- CreateIndex
CREATE INDEX "Quote_requirementId_status_idx" ON "Quote"("requirementId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_requirementId_vendorUserId_key" ON "Quote"("requirementId", "vendorUserId");

-- CreateIndex
CREATE UNIQUE INDEX "_IndustryToVendorUser_AB_unique" ON "_IndustryToVendorUser"("A", "B");

-- CreateIndex
CREATE INDEX "_IndustryToVendorUser_B_index" ON "_IndustryToVendorUser"("B");

-- AddForeignKey
ALTER TABLE "VendorUser" ADD CONSTRAINT "VendorUser_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "SupplierRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementInvite" ADD CONSTRAINT "RequirementInvite_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementInvite" ADD CONSTRAINT "RequirementInvite_vendorUserId_fkey" FOREIGN KEY ("vendorUserId") REFERENCES "VendorUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_vendorUserId_fkey" FOREIGN KEY ("vendorUserId") REFERENCES "VendorUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IndustryToVendorUser" ADD CONSTRAINT "_IndustryToVendorUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IndustryToVendorUser" ADD CONSTRAINT "_IndustryToVendorUser_B_fkey" FOREIGN KEY ("B") REFERENCES "VendorUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

