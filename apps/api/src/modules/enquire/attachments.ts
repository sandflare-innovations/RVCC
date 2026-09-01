import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import {
  deleteUpload,
  extractStorageKeyFromUrl,
  isRegistrationSection,
  MAX_REGISTRATION_ATTACHMENT_BYTES,
  publicUploadUrl,
  putUpload,
  storageKeyForRegistration,
  uploadStorageConfigured,
  validateUploadFile,
  detectMagicMime,
  validateUploadBytes,
} from "../../lib/storage";
import { cuid } from "../../lib/sql";
import { loadRegistration } from "./db";
import { prisma } from "../../lib/prisma";

type ResolveRegistration = (
  sql: unknown,
  env: Env,
  request: Request
) => Promise<Awaited<ReturnType<typeof loadRegistration>>>;

export function createAttachmentHandlers(resolveRegistration: ResolveRegistration) {
  return {
    async handleAttachmentUpload(sql: unknown, env: Env, request: Request): Promise<Response> {
      if (!uploadStorageConfigured(env)) {
        return json(env, request, { error: "Upload storage not configured" }, 503);
      }

      const registration = await resolveRegistration(sql, env, request);
      if (!registration) {
        return json(env, request, { error: "Not authenticated — verify your email again." }, 401);
      }
      if (registration.status !== "DRAFT") {
        return json(
          env,
          request,
          { error: "Attachments cannot be changed after submission." },
          403
        );
      }

      let form: FormData;
      try {
        form = await request.formData();
      } catch {
        return json(env, request, { error: "Expected multipart form data" }, 400);
      }

      const section = String(form.get("section") ?? "").trim();
      const file = form.get("file");

      if (!isRegistrationSection(section)) {
        return json(env, request, { error: "Invalid attachment section" }, 400);
      }
      if (!(file instanceof File)) {
        return json(env, request, { error: "File is required" }, 400);
      }

      const fileError = validateUploadFile(file, { maxBytes: MAX_REGISTRATION_ATTACHMENT_BYTES });
      if (fileError) return json(env, request, { error: fileError }, 400);

      const key = storageKeyForRegistration(registration.id, section, file.name);
      const bytes = await file.arrayBuffer();
      const byteError = validateUploadBytes(new Uint8Array(bytes), {
        maxBytes: MAX_REGISTRATION_ATTACHMENT_BYTES,
      });
      if (byteError) return json(env, request, { error: byteError }, 400);

      const detectedMime = detectMagicMime(new Uint8Array(bytes));
      const mimeType = detectedMime || file.type || "application/octet-stream";

      try {
        await putUpload(env, key, bytes, mimeType);
      } catch (err) {
        console.error("[enquire/attachments] upload", err);
        return json(env, request, { error: "Failed to store file" }, 500);
      }

      const id = cuid();
      const fileUrl = publicUploadUrl(env, key);

      await prisma.registrationAttachment.create({
        data: {
          id,
          registrationId: registration.id,
          section,
          fileName: file.name,
          fileUrl,
          mimeType,
        },
      });

      const updated = await loadRegistration(sql, registration.id);
      return json(env, request, { ok: true, attachmentId: id, registration: updated });
    },

    async handleAttachmentDelete(
      sql: unknown,
      env: Env,
      request: Request,
      attachmentId: string
    ): Promise<Response> {
      const registration = await resolveRegistration(sql, env, request);
      if (!registration) {
        return json(env, request, { error: "Not authenticated — verify your email again." }, 401);
      }
      if (registration.status !== "DRAFT") {
        return json(
          env,
          request,
          { error: "Attachments cannot be changed after submission." },
          403
        );
      }

      const row = await prisma.registrationAttachment.findFirst({
        where: { id: attachmentId, registrationId: registration.id },
        select: { id: true, fileUrl: true },
      });

      if (!row) return json(env, request, { error: "Attachment not found" }, 404);

      const key = extractStorageKeyFromUrl(env, row.fileUrl);
      if (key) {
        try {
          await deleteUpload(env, key);
        } catch (err) {
          console.error("[enquire/attachments] delete storage", err);
        }
      }

      await prisma.registrationAttachment.delete({ where: { id: attachmentId } });

      const updated = await loadRegistration(sql, registration.id);
      return json(env, request, { ok: true, registration: updated });
    },
  };
}
