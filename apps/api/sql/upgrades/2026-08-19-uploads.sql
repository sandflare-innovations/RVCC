-- Job applications (careers CV upload) + indexes for attachment lookups.

CREATE TABLE IF NOT EXISTS "JobApplication" (
  id TEXT PRIMARY KEY,
  "jobPostingId" TEXT NOT NULL REFERENCES "JobPosting"(id) ON DELETE CASCADE,
  "fullName" TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  "cvFileName" TEXT NOT NULL,
  "cvFileUrl" TEXT NOT NULL,
  "cvMimeType" TEXT NOT NULL DEFAULT 'application/pdf',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "JobApplication_jobPostingId_idx" ON "JobApplication"("jobPostingId");
CREATE INDEX IF NOT EXISTS "JobApplication_createdAt_idx" ON "JobApplication"("createdAt" DESC);
