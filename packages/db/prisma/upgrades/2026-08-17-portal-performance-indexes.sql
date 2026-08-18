-- ============================================================================
-- Production upgrade: portal performance indexes
--
-- Generated 2026-08-17 for the portal operations cockpit work.
--
-- SAFETY: additive only. Three CREATE INDEX statements and one DROP INDEX.
-- There is no DROP TABLE, DROP COLUMN, TRUNCATE or DELETE in this file.
--
-- The one DROP is "RequirementInvite_vendorUserId_idx", replaced on the line
-- above it by a composite that leads with the same column. Any query the old
-- index served, the new one serves too; nothing loses coverage.
--
-- CONCURRENTLY keeps writes flowing while these build. Each statement must be
-- run outside a transaction block — psql does that by default, so run this
-- file with:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f <this file>
-- ============================================================================

-- Serves the per-vendor quote counts on both dashboards.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Quote_vendorUserId_status_idx"
  ON "Quote" ("vendorUserId", "status");

-- Serves the registrations list: filter by status, sort by submittedAt desc.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "SupplierRegistration_status_submittedAt_idx"
  ON "SupplierRegistration" ("status", "submittedAt");

-- Serves the 90-day invite window on the supplier performance report.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "RequirementInvite_vendorUserId_createdAt_idx"
  ON "RequirementInvite" ("vendorUserId", "createdAt");

DROP INDEX CONCURRENTLY IF EXISTS "RequirementInvite_vendorUserId_idx";
