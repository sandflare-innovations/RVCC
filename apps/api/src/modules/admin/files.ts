import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import {
  putPublicAsset,
  deletePublicAsset,
  storageKeyForFileManager,
  publicUploadUrl,
  ALLOWED_FILE_MANAGER_MIMES,
  MAX_FILE_MANAGER_BYTES,
  validateUploadBytes,
  detectMagicMime,
  slugify,
} from "../../lib/storage";
import { requireAdmin, writeAudit } from "./auth";

function determineFileType(mime: string, ext: string): "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO" | "OTHER" {
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) {
    return "IMAGE";
  }
  if (mime.startsWith("video/") || ["mp4", "webm", "mov", "mkv", "avi"].includes(ext)) {
    return "VIDEO";
  }
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a"].includes(ext)) {
    return "AUDIO";
  }
  if (
    mime.includes("pdf") ||
    mime.includes("word") ||
    mime.includes("officedocument") ||
    mime.includes("excel") ||
    mime.includes("presentation") ||
    ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"].includes(ext)
  ) {
    return "DOCUMENT";
  }
  return "OTHER";
}

// ── Folders Handlers ─────────────────────────────────────────────────────────

export async function handleAdminFoldersList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const url = new URL(request.url);
  const parentId = url.searchParams.get("parentId") || null;

  // Retrieve folders
  const folders = await (prisma as any).managedFolder.findMany({
    where: {
      parentId: parentId === "root" || !parentId ? null : parentId,
      deletedAt: null,
    },
    include: {
      _count: {
        select: {
          files: { where: { deletedAt: null } },
          subfolders: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return json(env, request, { ok: true, folders });
}

export async function handleAdminFolderCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  let body: { name?: string; color?: string; parentId?: string | null };
  try {
    body = await request.json();
  } catch {
    return json(env, request, { error: "Invalid JSON body" }, 400);
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return json(env, request, { error: "Folder name is required" }, 400);
  }

  const slug = slugify(name);
  const parentId = body.parentId?.trim() || null;
  const color = body.color?.trim() || "indigo";

  // Check if folder name exists under this parent
  const existing = await (prisma as any).managedFolder.findFirst({
    where: {
      name,
      parentId,
      deletedAt: null,
    },
  });

  if (existing) {
    return json(env, request, { error: "A folder with this name already exists here." }, 409);
  }

  const folder = await (prisma as any).managedFolder.create({
    data: {
      name,
      slug,
      parentId,
      color,
    },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "file_manager.folder_created",
    entityType: "ManagedFolder",
    entityId: folder.id,
    metadata: { name, parentId },
  });

  return json(env, request, { ok: true, folder }, 201);
}

export async function handleAdminFolderUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  let body: { name?: string; color?: string; parentId?: string | null };
  try {
    body = await request.json();
  } catch {
    return json(env, request, { error: "Invalid JSON body" }, 400);
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const trimmed = String(body.name).trim();
    if (!trimmed) return json(env, request, { error: "Folder name cannot be empty" }, 400);
    data.name = trimmed;
    data.slug = slugify(trimmed);
  }
  if (body.color !== undefined) data.color = String(body.color).trim();
  if (body.parentId !== undefined) data.parentId = body.parentId?.trim() || null;

  const folder = await (prisma as any).managedFolder.update({
    where: { id },
    data,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "file_manager.folder_updated",
    entityType: "ManagedFolder",
    entityId: id,
    metadata: { changed: Object.keys(data) },
  });

  return json(env, request, { ok: true, folder });
}

export async function handleAdminFolderDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const folder = await (prisma as any).managedFolder.findUnique({
    where: { id },
  });
  if (!folder) return json(env, request, { error: "Folder not found" }, 404);

  // Soft delete folder and cascade softly
  const now = new Date();
  await (prisma as any).managedFolder.update({
    where: { id },
    data: { deletedAt: now },
  });

  await (prisma as any).managedFile.updateMany({
    where: { folderId: id },
    data: { deletedAt: now },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "file_manager.folder_deleted",
    entityType: "ManagedFolder",
    entityId: id,
    metadata: { name: folder.name },
  });

  return json(env, request, { ok: true });
}

// ── Files Handlers ───────────────────────────────────────────────────────────

export async function handleAdminFilesList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const url = new URL(request.url);
  const folderId = url.searchParams.get("folderId");
  const search = url.searchParams.get("search")?.trim();
  const fileType = url.searchParams.get("type")?.trim();

  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { originalName: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  } else if (folderId !== undefined) {
    where.folderId = folderId === "root" || !folderId ? null : folderId;
  }

  if (fileType && ["IMAGE", "VIDEO", "DOCUMENT", "AUDIO", "OTHER"].includes(fileType)) {
    where.fileType = fileType;
  }

  const files = await (prisma as any).managedFile.findMany({
    where,
    include: {
      folder: {
        select: { id: true, name: true, slug: true, color: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Convert BigInt sizeBytes to regular Number for JSON serialization
  const serialized = files.map((f: any) => ({
    ...f,
    sizeBytes: Number(f.sizeBytes),
  }));

  return json(env, request, { ok: true, files: serialized });
}

export async function handleAdminFileUpload(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(env, request, { error: "Expected multipart form data" }, 400);
  }

  const file = form.get("file");
  const folderId = String(form.get("folderId") ?? "").trim() || null;
  const customName = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim() || null;

  if (!(file instanceof File)) {
    return json(env, request, { error: "File is required." }, 400);
  }

  const bytes = await file.arrayBuffer();
  const uint8 = new Uint8Array(bytes);

  const byteError = validateUploadBytes(uint8, {
    maxBytes: MAX_FILE_MANAGER_BYTES,
    allowedMimes: ALLOWED_FILE_MANAGER_MIMES,
    relaxed: true,
  });
  if (byteError) return json(env, request, { error: byteError }, 400);

  // Determine extension and folder slug path
  const parts = file.name.split(".");
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase().replace(/[^a-z0-9]/g, "") : "bin";
  const originalBaseName = parts.join(".");
  const displayName = customName || file.name;

  let folderSlugPath = "";
  if (folderId) {
    const folder = await (prisma as any).managedFolder.findUnique({
      where: { id: folderId },
    });
    if (folder) {
      folderSlugPath = folder.slug;
    }
  }

  const detectedMime = detectMagicMime(uint8);
  const mimeType = file.type || detectedMime || "application/octet-stream";
  const fileType = determineFileType(mimeType, ext);

  // Construct R2 public key inside file-manager/
  const key = storageKeyForFileManager(folderSlugPath, originalBaseName, ext);

  try {
    await putPublicAsset(env, key, bytes, mimeType);
  } catch (err) {
    console.error("[file_manager] R2 upload error", err);
    return json(env, request, { error: "Failed to upload file to Cloudflare storage." }, 500);
  }

  const fileUrl = publicUploadUrl(env, key);

  const createdFile = await (prisma as any).managedFile.create({
    data: {
      folderId,
      name: displayName,
      originalName: file.name,
      fileUrl,
      storageKey: key,
      fileType,
      mimeType,
      sizeBytes: BigInt(file.size),
      extension: ext,
      description,
    },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "file_manager.file_uploaded",
    entityType: "ManagedFile",
    entityId: createdFile.id,
    metadata: { name: displayName, key, sizeBytes: file.size, fileType },
  });

  return json(
    env,
    request,
    {
      ok: true,
      file: {
        ...createdFile,
        sizeBytes: Number(createdFile.sizeBytes),
      },
    },
    201
  );
}

export async function handleAdminFileUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  let body: { name?: string; description?: string | null; folderId?: string | null; tags?: string[] };
  try {
    body = await request.json();
  } catch {
    return json(env, request, { error: "Invalid JSON body" }, 400);
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const trimmed = String(body.name).trim();
    if (!trimmed) return json(env, request, { error: "File name cannot be empty" }, 400);
    data.name = trimmed;
  }
  if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
  if (body.folderId !== undefined) data.folderId = body.folderId?.trim() || null;
  if (Array.isArray(body.tags)) data.tags = body.tags;

  const updated = await (prisma as any).managedFile.update({
    where: { id },
    data,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "file_manager.file_updated",
    entityType: "ManagedFile",
    entityId: id,
    metadata: { changed: Object.keys(data) },
  });

  return json(env, request, {
    ok: true,
    file: {
      ...updated,
      sizeBytes: Number(updated.sizeBytes),
    },
  });
}

export async function handleAdminFileDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const file = await (prisma as any).managedFile.findUnique({
    where: { id },
  });
  if (!file) return json(env, request, { error: "File not found" }, 404);

  // Soft delete in database
  await (prisma as any).managedFile.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  // Also clean up Cloudflare R2 object
  if (file.storageKey) {
    await deletePublicAsset(env, file.storageKey).catch((err) => {
      console.warn("[file_manager] delete asset error:", err);
    });
  }

  await writeAudit(sql, {
    adminId: admin.id,
    action: "file_manager.file_deleted",
    entityType: "ManagedFile",
    entityId: id,
    metadata: { name: file.name, key: file.storageKey },
  });

  return json(env, request, { ok: true });
}
