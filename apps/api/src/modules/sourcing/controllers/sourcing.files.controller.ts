import type { Env } from "../../../config/env";
import { json } from "../../../lib/http";
import { requireAdmin, writeAudit } from "../../auth";
import { SourcingFilesService, type SourcingFileKind } from "../services/sourcing-files.service";

function parseKind(raw: string | null): SourcingFileKind {
  if (raw === "manual" || raw === "quote" || raw === "requirement") return raw;
  return "requirement";
}

export async function handleRequirementAttachmentUpload(
  sql: unknown,
  env: Env,
  request: Request,
  requirementId: string
) {
  const { admin, deny } = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (deny) return deny;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(env, request, { error: "Expected multipart form data." }, 400);
  }
  const file = form.get("file");
  const { isUploadFile } = await import("../../../lib/storage");
  if (!isUploadFile(file)) return json(env, request, { error: "File is required." }, 400);

  try {
    const result = await SourcingFilesService.uploadRequirementFile(
      env,
      requirementId,
      admin.name || admin.email,
      file
    );
    if ("error" in result) return json(env, request, { error: result.error }, result.status);
    await writeAudit(sql, {
      adminId: admin.id,
      action: "requirement.document_uploaded",
      entityType: "Requirement",
      entityId: requirementId,
      metadata: { attachmentId: result.attachment.id, fileName: result.attachment.fileName },
    });
    return json(env, request, result, 201);
  } catch (err) {
    console.error("[requirement attachment upload]", err);
    return json(env, request, { error: "Failed to store document." }, 500);
  }
}

export async function handleManualQuoteAttachmentUpload(
  sql: unknown,
  env: Env,
  request: Request,
  requirementId: string,
  quotationId: string
) {
  const { admin, deny } = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (deny) return deny;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(env, request, { error: "Expected multipart form data." }, 400);
  }
  const file = form.get("file");
  const { isUploadFile } = await import("../../../lib/storage");
  if (!isUploadFile(file)) return json(env, request, { error: "File is required." }, 400);

  try {
    const result = await SourcingFilesService.uploadManualQuoteFile(
      env,
      requirementId,
      quotationId,
      admin.name || admin.email,
      file
    );
    if ("error" in result) return json(env, request, { error: result.error }, result.status);
    await writeAudit(sql, {
      adminId: admin.id,
      action: "quotation.attachment_uploaded",
      entityType: "Requirement",
      entityId: requirementId,
      metadata: { quotationId, attachmentId: result.attachment.id },
    });
    return json(env, request, result, 201);
  } catch (err) {
    console.error("[manual quote attachment upload]", err);
    return json(env, request, { error: "Failed to store document." }, 500);
  }
}

export async function handleAdminFileDownload(
  sql: unknown,
  env: Env,
  request: Request,
  requirementId: string,
  attachmentId: string
) {
  const { deny } = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (deny) return deny;
  const url = new URL(request.url);
  const kind = parseKind(url.searchParams.get("kind"));
  const asDownload = url.searchParams.get("download") === "1";
  const result = await SourcingFilesService.downloadAdminFile(
    env,
    request,
    requirementId,
    attachmentId,
    kind,
    asDownload
  );
  if ("error" in result) return json(env, request, { error: result.error }, result.status);
  return result.response;
}
