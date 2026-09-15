import type { Env } from "../../../config/env";
import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";
import {
  getSecureDocument,
  isPreviewableMime,
  keyFromStoredUrl,
  MAX_SOURCING_UPLOAD_BYTES,
  putUpload,
  resolveSourcingMime,
  sanitizeFileName,
  storedUrlForKey,
  storageKeyForManualQuote,
  storageKeyForQuote,
  storageKeyForRequirement,
  uploadStorageConfigured,
} from "../../../lib/storage";

export type SourcingFileKind = "requirement" | "manual" | "quote";

export function attachmentDto(input: {
  id: string;
  requirementId: string;
  kind: SourcingFileKind;
  fileName: string;
  mimeType?: string | null;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy?: string | null;
  category?: string;
  vendorId?: string | null;
}) {
  const mimeType = input.mimeType || "application/octet-stream";
  return {
    id: input.id,
    fileName: input.fileName,
    mimeType,
    fileSize: input.fileSize,
    uploadedAt: input.uploadedAt.toISOString(),
    uploadedBy: input.uploadedBy || null,
    category: input.category || input.kind,
    requirementId: input.requirementId,
    vendorId: input.vendorId || null,
    previewable: isPreviewableMime(mimeType),
    downloadPath: `/api/requirements/${input.requirementId}/files/${input.id}?kind=${input.kind}`,
  };
}

async function readValidatedFile(file: File): Promise<
  { error: string; status: number } | { bytes: Uint8Array; mimeType: string; fileName: string }
> {
  if (!file.size) return { error: "File is empty.", status: 400 };
  if (file.size > MAX_SOURCING_UPLOAD_BYTES) {
    return { error: "File must be 25 MB or smaller.", status: 400 };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = resolveSourcingMime(file.name, file.type || "", bytes);
  if (!mimeType) {
    return {
      error: "Only PDF, Word, Excel, JPEG, PNG, or WEBP files are accepted.",
      status: 400,
    };
  }
  return { bytes, mimeType, fileName: sanitizeFileName(file.name) };
}

function fileResponse(
  _env: Env,
  _request: Request,
  file: { body: ArrayBuffer; contentType: string },
  fileName: string,
  asDownload: boolean
) {
  const disposition = `${asDownload ? "attachment" : "inline"}; filename="${fileName.replace(/"/g, "")}"`;
  return new Response(file.body, {
    status: 200,
    headers: {
      "Content-Type": file.contentType || "application/octet-stream",
      "Content-Disposition": disposition,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export class SourcingFilesService {
  static async uploadRequirementFile(env: Env, requirementId: string, adminName: string, file: File) {
    if (!uploadStorageConfigured(env)) return { error: "Upload storage is not configured.", status: 503 as const };
    const requirement = await prisma.requirement.findFirst({
      where: { id: requirementId, deletedAt: null },
      select: { id: true },
    });
    if (!requirement) return { error: "Requirement not found.", status: 404 as const };

    const validated = await readValidatedFile(file);
    if ("error" in validated) return validated;

    const key = storageKeyForRequirement(requirementId, validated.fileName);
    await putUpload(env, key, validated.bytes, validated.mimeType);
    const row = await prisma.requirementAttachment.create({
      data: {
        id: cuid(),
        requirementId,
        name: validated.fileName,
        url: storedUrlForKey(key),
        sizeBytes: validated.bytes.byteLength,
        mimeType: validated.mimeType,
      },
    });
    return {
      ok: true as const,
      attachment: attachmentDto({
        id: row.id,
        requirementId,
        kind: "requirement",
        fileName: row.name,
        mimeType: row.mimeType,
        fileSize: row.sizeBytes,
        uploadedAt: row.uploadedAt,
        uploadedBy: adminName,
        category: "requirement",
      }),
    };
  }

  static async uploadManualQuoteFile(
    env: Env,
    requirementId: string,
    quotationId: string,
    adminName: string,
    file: File
  ) {
    if (!uploadStorageConfigured(env)) return { error: "Upload storage is not configured.", status: 503 as const };
    const quotation = await prisma.manualQuotation.findFirst({
      where: { id: quotationId, requirementId, deletedAt: null },
      select: { id: true, vendorUserId: true },
    });
    if (!quotation) return { error: "Quotation not found.", status: 404 as const };

    const validated = await readValidatedFile(file);
    if ("error" in validated) return validated;

    const key = storageKeyForManualQuote(requirementId, quotationId, validated.fileName);
    await putUpload(env, key, validated.bytes, validated.mimeType);
    const row = await prisma.manualQuotationAttachment.create({
      data: {
        id: cuid(),
        manualQuotationId: quotationId,
        fileName: validated.fileName,
        fileUrl: storedUrlForKey(key),
        fileSize: validated.bytes.byteLength,
        mimeType: validated.mimeType,
      },
    });
    return {
      ok: true as const,
      attachment: attachmentDto({
        id: row.id,
        requirementId,
        kind: "manual",
        fileName: row.fileName,
        mimeType: row.mimeType,
        fileSize: row.fileSize,
        uploadedAt: row.uploadedAt,
        uploadedBy: adminName,
        category: "quotation",
        vendorId: quotation.vendorUserId,
      }),
    };
  }

  static async downloadAdminFile(
    env: Env,
    request: Request,
    requirementId: string,
    attachmentId: string,
    kind: SourcingFileKind,
    asDownload: boolean
  ) {
    if (kind === "requirement") {
      const row = await prisma.requirementAttachment.findFirst({
        where: { id: attachmentId, requirementId, deletedAt: null },
      });
      if (!row) return { error: "File not found.", status: 404 as const };
      const key = keyFromStoredUrl(env, row.url);
      if (!key) return { error: "File is not available.", status: 404 as const };
      const file = await getSecureDocument(env, key);
      if (!file) return { error: "File is not available.", status: 404 as const };
      return { response: fileResponse(env, request, file, row.name, asDownload) };
    }

    if (kind === "manual") {
      const row = await prisma.manualQuotationAttachment.findFirst({
        where: { id: attachmentId, manualQuotation: { requirementId, deletedAt: null } },
      });
      if (!row) return { error: "File not found.", status: 404 as const };
      const key = keyFromStoredUrl(env, row.fileUrl);
      if (!key) return { error: "File is not available.", status: 404 as const };
      const file = await getSecureDocument(env, key);
      if (!file) return { error: "File is not available.", status: 404 as const };
      return { response: fileResponse(env, request, file, row.fileName, asDownload) };
    }

    const row = await prisma.quoteAttachment.findFirst({
      where: { id: attachmentId, quote: { requirementId } },
    });
    if (!row) return { error: "File not found.", status: 404 as const };
    const key = keyFromStoredUrl(env, row.fileUrl);
    if (!key) return { error: "File is not available.", status: 404 as const };
    const file = await getSecureDocument(env, key);
    if (!file) return { error: "File is not available.", status: 404 as const };
    return { response: fileResponse(env, request, file, row.fileName, asDownload) };
  }

  static async downloadVendorQuoteFile(
    env: Env,
    request: Request,
    requirementId: string,
    attachmentId: string,
    vendorUserId: string,
    asDownload: boolean
  ) {
    const quoteRow = await prisma.quoteAttachment.findFirst({
      where: {
        id: attachmentId,
        quote: { requirementId, vendorUserId },
      },
    });
    if (quoteRow) {
      const key = keyFromStoredUrl(env, quoteRow.fileUrl);
      if (!key) return { error: "File is not available.", status: 404 as const };
      const file = await getSecureDocument(env, key);
      if (!file) return { error: "File is not available.", status: 404 as const };
      return { response: fileResponse(env, request, file, quoteRow.fileName, asDownload) };
    }

    const manualRow = await prisma.manualQuotationAttachment.findFirst({
      where: {
        id: attachmentId,
        manualQuotation: { requirementId, vendorUserId, deletedAt: null },
      },
    });
    if (!manualRow) return { error: "File not found.", status: 404 as const };
    const key = keyFromStoredUrl(env, manualRow.fileUrl);
    if (!key) return { error: "File is not available.", status: 404 as const };
    const file = await getSecureDocument(env, key);
    if (!file) return { error: "File is not available.", status: 404 as const };
    return { response: fileResponse(env, request, file, manualRow.fileName, asDownload) };
  }

  static storageKeyForVendorQuote(requirementId: string, quoteId: string, fileName: string) {
    return storageKeyForQuote(requirementId, quoteId, fileName);
  }
}
