import { AwsClient } from "aws4fetch";

import type { Env } from "../config/env";

const DEFAULT_PUBLIC = "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev";

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
const WEBP = "image/webp";

export const ALLOWED_UPLOAD_MIMES = new Set([PDF, JPEG, PNG, WEBP]);

export const MAX_CV_BYTES = 10 * 1024 * 1024;
export const MAX_REGISTRATION_ATTACHMENT_BYTES = 15 * 1024 * 1024;

/**
 * Converts arbitrary text into a clean, lowercased, hyphen-separated SEO slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^\w\s-]/g, "") // Remove non-alphanumeric chars (except spaces & hyphens)
    .replace(/[\s_-]+/g, "-") // Collapse whitespace and underscores to single hyphen
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
}

/**
 * Generates a short, random alphanumeric collision-resistant token (4 to 6 chars).
 */
export function generateUniqueToken(length = 4): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Strips directory traversal characters and sanitizes a raw file name.
 */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "file";
  const cleaned = base.replace(/[^\w.\-()+ ]/g, "_").trim();
  return cleaned.slice(0, 120) || "file";
}

/**
 * Extracts file extension cleanly.
 */
export function getFileExtension(fileName: string, fallback = "pdf"): string {
  const parts = fileName.split(".");
  if (parts.length > 1) {
    const ext = parts.pop()?.toLowerCase() || fallback;
    return ext.replace(/[^a-z0-9]/g, "");
  }
  return fallback;
}

/**
 * Generates full public CDN URL for public assets.
 */
export function publicUploadUrl(env: Env, key: string): string {
  const base = (env.R2_PUBLIC_URL || DEFAULT_PUBLIC).replace(/\/$/, "");
  const normalized = key.startsWith("/") ? key.slice(1) : key;
  return `${base}/${normalized}`;
}

/* =========================================================================
   PUBLIC ASSETS STORAGE KEYS (Gallery, Projects, Company Profiles, Logos)
   ========================================================================= */

/** Public Hero Slide Image: hero/{imageTitle}-{tag}.webp */
export function storageKeyForHero(
  imageTitle: string,
  ext = "webp"
): string {
  const name = slugify(imageTitle) || "slide";
  const tag = generateUniqueToken(4);
  return `hero/${name}-${tag}.${ext}`;
}

/** Public Client Partner Logo: clients/{clientName}-{tag}.webp */
export function storageKeyForClient(
  clientName: string,
  ext = "webp"
): string {
  const name = slugify(clientName) || "client";
  const tag = generateUniqueToken(4);
  return `clients/${name}-${tag}.${ext}`;
}

/** Public Gallery Image: gallery/{gallerySlug}/{imageTitle}-{tag}.webp */
export function storageKeyForGallery(
  gallerySlug: string,
  imageTitle: string,
  ext = "webp"
): string {
  const folder = slugify(gallerySlug) || "general";
  const name = slugify(imageTitle) || "photo";
  const tag = generateUniqueToken(4);
  return `gallery/${folder}/${name}-${tag}.${ext}`;
}

/** Public Project Image: projects/{projectSlug}/{imageTitle}-{tag}.webp */
export function storageKeyForProject(
  projectSlug: string,
  imageTitle: string,
  ext = "webp"
): string {
  const folder = slugify(projectSlug) || "project";
  const name = slugify(imageTitle) || "view";
  const tag = generateUniqueToken(4);
  return `projects/${folder}/${name}-${tag}.${ext}`;
}

/** Public Service Image: services/{serviceSlug}/{imageTitle}-{tag}.webp */
export function storageKeyForService(
  serviceSlug: string,
  imageTitle: string,
  ext = "webp"
): string {
  const folder = slugify(serviceSlug) || "service";
  const name = slugify(imageTitle) || "cover";
  const tag = generateUniqueToken(4);
  return `services/${folder}/${name}-${tag}.${ext}`;
}

/** Public Company Profile PDF: company/profiles/{title}-{tag}.pdf */
export function storageKeyForCompanyProfile(title: string): string {
  const name = slugify(title) || "rvcc-profile";
  const tag = generateUniqueToken(4);
  return `company/profiles/${name}-${tag}.pdf`;
}

/** Public Brand Logo: company/logos/{logoName}-{tag}.webp */
export function storageKeyForLogo(logoName: string, ext = "webp"): string {
  const name = slugify(logoName) || "logo";
  const tag = generateUniqueToken(4);
  return `company/logos/${name}-${tag}.${ext}`;
}

/* =========================================================================
   SECURE DOCUMENTS STORAGE KEYS (Vendor KYC, RFQs, PRs, Resumes)
   ========================================================================= */

/** Secure Vendor KYC: vendors/{registrationId}/{section}/{cleanFileName}-{tag}.{ext} */
export function storageKeyForRegistration(
  registrationId: string,
  section: string,
  fileName: string
): string {
  const ext = getFileExtension(fileName, "pdf");
  const baseName = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
  const cleanName = slugify(baseName) || "document";
  const tag = generateUniqueToken(4);
  return `vendors/${registrationId}/${section}/${cleanName}-${tag}.${ext}`;
}

/** Secure RFQ Quote: procurement/quotes/{requirementId}/{quoteId}/{cleanFileName}-{tag}.{ext} */
export function storageKeyForQuote(
  requirementId: string,
  quoteId: string,
  fileName: string
): string {
  const ext = getFileExtension(fileName, "pdf");
  const baseName = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
  const cleanName = slugify(baseName) || "quote-doc";
  const tag = generateUniqueToken(4);
  return `procurement/quotes/${requirementId}/${quoteId}/${cleanName}-${tag}.${ext}`;
}

/** Secure Purchase Requisition: procurement/requisitions/{purchaseRequestId}/{cleanFileName}-{tag}.{ext} */
export function storageKeyForRequisition(
  purchaseRequestId: string,
  fileName: string
): string {
  const ext = getFileExtension(fileName, "pdf");
  const baseName = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
  const cleanName = slugify(baseName) || "pr-attachment";
  const tag = generateUniqueToken(4);
  return `procurement/requisitions/${purchaseRequestId}/${cleanName}-${tag}.${ext}`;
}

/** Secure Candidate Resume: careers/{jobId}/{applicantName}-cv-{tag}.pdf */
export function storageKeyForCareer(
  jobId: string,
  fileName: string,
  applicantName?: string
): string {
  const baseLabel = applicantName ? `${applicantName}-cv` : fileName.replace(/\.[^/.]+$/, "");
  const cleanName = slugify(baseLabel) || "resume";
  const tag = generateUniqueToken(4);
  return `careers/${jobId}/${cleanName}-${tag}.pdf`;
}

export function extractStorageKeyFromUrl(env: Env, fileUrl: string): string | null {
  const base = (env.R2_PUBLIC_URL || DEFAULT_PUBLIC).replace(/\/$/, "");
  if (!fileUrl.startsWith(`${base}/`)) return null;
  return fileUrl.slice(base.length + 1);
}

function s3Configured(env: Env): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY
  );
}

export function uploadStorageConfigured(env: Env): boolean {
  return (
    Boolean(env.publicAssetsBucket) ||
    Boolean(env.secureAssetsBucket) ||
    Boolean(env.uploadsBucket) ||
    s3Configured(env)
  );
}

/* =========================================================================
   PUBLIC ASSETS UPLOAD / DELETE (rvcc-public-assets)
   ========================================================================= */

export async function putPublicAsset(
  env: Env,
  key: string,
  body: ArrayBuffer | ReadableStream | Uint8Array,
  contentType: string
): Promise<void> {
  if (env.publicAssetsBucket) {
    await env.publicAssetsBucket.put(key, body, {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
    return;
  }

  const bucketName = "rvcc-public-assets";
  if (!s3Configured(env)) {
    throw new Error(`Upload storage not configured for public assets (${bucketName})`);
  }

  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
  });
  const url = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${key}`;
  const res = await client.fetch(url, {
    method: "PUT",
    body: body as BodyInit,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`R2 public asset upload failed (${res.status}): ${detail.slice(0, 200)}`);
  }
}

export async function deletePublicAsset(env: Env, key: string): Promise<void> {
  if (env.publicAssetsBucket) {
    await env.publicAssetsBucket.delete(key);
    return;
  }

  const bucketName = "rvcc-public-assets";
  if (!s3Configured(env)) return;

  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
  });
  const url = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${key}`;
  await client.fetch(url, { method: "DELETE" }).catch(() => undefined);
}

/* =========================================================================
   SECURE DOCUMENTS UPLOAD / DELETE (rvcc-secure-assets)
   ========================================================================= */

export async function putSecureDocument(
  env: Env,
  key: string,
  body: ArrayBuffer | ReadableStream | Uint8Array,
  contentType: string
): Promise<void> {
  const bucket = env.secureAssetsBucket || env.uploadsBucket;
  if (bucket) {
    await bucket.put(key, body, {
      httpMetadata: { contentType, cacheControl: "private, no-cache, no-store" },
    });
    return;
  }

  const bucketName = "rvcc-secure-assets";
  if (!s3Configured(env)) {
    throw new Error(`Upload storage not configured for secure assets (${bucketName})`);
  }

  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
  });
  const url = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${key}`;
  const res = await client.fetch(url, {
    method: "PUT",
    body: body as BodyInit,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, no-cache, no-store",
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`R2 secure upload failed (${res.status}): ${detail.slice(0, 200)}`);
  }
}

export async function deleteSecureDocument(env: Env, key: string): Promise<void> {
  const bucket = env.secureAssetsBucket || env.uploadsBucket;
  if (bucket) {
    await bucket.delete(key);
    return;
  }

  const bucketName = "rvcc-secure-assets";
  if (!s3Configured(env)) return;

  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
  });
  const url = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${key}`;
  await client.fetch(url, { method: "DELETE" }).catch(() => undefined);
}

/** Backward-compatible upload alias (routes to secure documents by default) */
export const putUpload = putSecureDocument;
/** Backward-compatible delete alias (routes to secure documents by default) */
export const deleteUpload = deleteSecureDocument;

/* =========================================================================
   BINARY VALIDATION & MIME DETECTION
   ========================================================================= */

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
    // WEBP signature: RIFF ... WEBP (0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50)
    if (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return WEBP;
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
    return "File content signature is invalid or not allowed — only authentic PDF, JPEG, PNG, or WEBP files are accepted";
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
    return "File type not allowed — use PDF, JPEG, PNG, or WEBP";
  }
  return null;
}

export function isRegistrationSection(section: string): section is RegistrationAttachmentSection {
  return (REGISTRATION_ATTACHMENT_SECTIONS as readonly string[]).includes(section);
}
