-- Admin OTP table for password change verification
CREATE TABLE IF NOT EXISTS "AdminOtp" (
  id         TEXT PRIMARY KEY,
  "adminId"  TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "consumedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_otp_admin_id ON "AdminOtp" ("adminId");
