import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import {
  MAX_CV_BYTES,
  publicUploadUrl,
  putUpload,
  storageKeyForCareer,
  uploadStorageConfigured,
  validateUploadFile,
} from "../../lib/storage";
import type { Sql } from "../../lib/sql";
import { cuid } from "../../lib/sql";

export async function handleCareerApply(
  sql: Sql,
  env: Env,
  request: Request
): Promise<Response> {
  if (!uploadStorageConfigured(env)) {
    return json(env, request, { error: "Upload storage not configured" }, 503);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(env, request, { error: "Expected multipart form data" }, 400);
  }

  const jobPostingId = String(form.get("jobPostingId") ?? "").trim();
  const fullName = String(form.get("fullName") ?? "").trim();
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phone = String(form.get("phone") ?? "").trim();
  const cv = form.get("cv");

  if (!jobPostingId) return json(env, request, { error: "jobPostingId is required" }, 400);
  if (!fullName) return json(env, request, { error: "Full name is required" }, 400);
  if (!email.includes("@")) return json(env, request, { error: "Valid email is required" }, 400);
  if (!(cv instanceof File)) return json(env, request, { error: "CV file is required" }, 400);

  const fileError = validateUploadFile(cv, {
    maxBytes: MAX_CV_BYTES,
    allowedMimes: new Set(["application/pdf"]),
  });
  if (fileError) return json(env, request, { error: fileError }, 400);

  const [job] = await sql`
    SELECT id FROM "JobPosting"
    WHERE id = ${jobPostingId} AND "isPublished" = true
    LIMIT 1
  `;
  if (!job) return json(env, request, { error: "Job not found or not accepting applications" }, 404);

  const key = storageKeyForCareer(jobPostingId, cv.name);
  const bytes = await cv.arrayBuffer();

  try {
    await putUpload(env, key, bytes, cv.type || "application/pdf");
  } catch (err) {
    console.error("[careers/apply] upload", err);
    return json(env, request, { error: "Failed to store CV" }, 500);
  }

  const id = cuid();
  const fileUrl = publicUploadUrl(env, key);
  const mimeType = cv.type || "application/pdf";

  await sql`
    INSERT INTO "JobApplication" (
      id, "jobPostingId", "fullName", email, phone,
      "cvFileName", "cvFileUrl", "cvMimeType", "createdAt"
    ) VALUES (
      ${id}, ${jobPostingId}, ${fullName}, ${email}, ${phone},
      ${cv.name}, ${fileUrl}, ${mimeType}, NOW()
    )
  `;

  return json(env, request, { ok: true, applicationId: id });
}
