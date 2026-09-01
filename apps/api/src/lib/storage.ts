import { AwsClient } from "aws4fetch";

import type { Env } from "../config/env";
import { cuid } from "./sql";

const DEFAULT_PUBLIC = "https://pub-7f8ca337d3ac4e7f9f6ed54470da92a0.r2.dev";

export const REGISTRATION_ATTACHMENT_SECTIONS = [
  "commercial_registration",
  "vat_certificate",
  "bank_confirmation",
  "iso_certificate",
  "other",
] as const;

export type RegistrationAttachmentSection = (typeof REGISTRATION_ATTACHMENT_SECTIONS)[number];

const PDF = "application/pdf";
const JPEG = "image/jpeg";
const PNG = "image/png";

export const ALLOWED_UPLOAD_MIMES = new Set([PDF, JPEG, PNG]);

export const MAX_CV_BYTES = 10 * 1024 * 1024;
export const MAX_REGISTRATION_ATTACHMENT_BYTES = 15 * 1024 * 1024;

export function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "file";
  const cleaned = base.replace(/[^\w.\-()+ ]/g, "_").trim();
  return cleaned.slice(0, 120) || "file";
}

export function publicUploadUrl(env: Env, key: string): string {
  const base = (env.R2_PUBLIC_URL || DEFAULT_PUBLIC).replace(/\/$/, "");
  const normalized = key.startsWith("/") ? key.slice(1) : key;
  return `${base}/${normalized}`;
}

export function storageKeyForCareer(jobId: string, fileName: string): string {
  return `uploads/careers/${jobId}/${cuid()}-${sanitizeFileName(fileName)}`;
}

export function storageKeyForRegistration(
  registrationId: string,
  section: string,
  fileName: string
): string {
  return `uploads/registrations/${registrationId}/${section}/${cuid()}-${sanitizeFileName(fileName)}`;
}

export function extractStorageKeyFromUrl(env: Env, fileUrl: string): string | null {
  const base = (env.R2_PUBLIC_URL || DEFAULT_PUBLIC).replace(/\/$/, "");
  if (!fileUrl.startsWith(`${base}/`)) return null;
  return fileUrl.slice(base.length + 1);
}

function s3Configured(env: Env): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME
  );
}

export function uploadStorageConfigured(env: Env): boolean {
  return Boolean(env.uploadsBucket) || s3Configured(env);
}

export async function putUpload(
  env: Env,
  key: string,
  body: ArrayBuffer | ReadableStream | Uint8Array,
  contentType: string
): Promise<void> {
  if (env.uploadsBucket) {
    await env.uploadsBucket.put(key, body, { httpMetadata: { contentType } });
    return;
  }

  if (!s3Configured(env)) {
    throw new Error(
      "Upload storage not configured — bind R2 UPLOADS in wrangler.toml or set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME"
    );
  }

  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
  });
  const url = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${key}`;
  const res = await client.fetch(url, {
    method: "PUT",
    body: body as BodyInit,
    headers: { "Content-Type": contentType },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`R2 upload failed (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }
}

export async function deleteUpload(env: Env, key: string): Promise<void> {
  if (env.uploadsBucket) {
    await env.uploadsBucket.delete(key);
    return;
  }

  if (!s3Configured(env)) return;

  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
  });
  const url = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${key}`;
  await client.fetch(url, { method: "DELETE" }).catch(() => undefined);
}

export function detectMagicMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 4) {
    // PDF signature: %PDF- (0x25 0x50 0x44 0x46)
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return PDF;
    }
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return PNG;
    }
    // JPEG signature: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return JPEG;
    }
  }
  return null;
}

export function validateUploadBytes(
  bytes: Uint8Array,
  opts: { maxBytes: number; allowedMimes?: Set<string> }
): string | null {
  if (!bytes.length) return "File is empty";
  if (bytes.length > opts.maxBytes) {
    const mb = Math.round(opts.maxBytes / (1024 * 1024));
    return `File must be ${mb} MB or smaller`;
  }
  const detected = detectMagicMime(bytes);
  const allowed = opts.allowedMimes ?? ALLOWED_UPLOAD_MIMES;
  if (!detected || !allowed.has(detected)) {
    return "File content signature is invalid or not allowed — only authentic PDF, JPEG, or PNG files are accepted";
  }
  return null;
}

export function validateUploadFile(
  file: File,
  opts: { maxBytes: number; allowedMimes?: Set<string> }
): string | null {
  if (!file.size) return "File is empty";
  if (file.size > opts.maxBytes) {
    const mb = Math.round(opts.maxBytes / (1024 * 1024));
    return `File must be ${mb} MB or smaller`;
  }
  const mime = file.type || "application/octet-stream";
  const allowed = opts.allowedMimes ?? ALLOWED_UPLOAD_MIMES;
  if (!allowed.has(mime)) {
    return "File type not allowed — use PDF, JPEG, or PNG";
  }
  return null;
}

export function isRegistrationSection(section: string): section is RegistrationAttachmentSection {
  return (REGISTRATION_ATTACHMENT_SECTIONS as readonly string[]).includes(section);
}
