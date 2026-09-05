import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import {
  putPublicAsset,
  publicUploadUrl,
  slugify,
  generateUniqueToken,
} from "../../lib/storage";
import { requireAdmin, writeAudit } from "./auth";
import { cuid } from "./db";

async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// ── Admin Documents Handlers ────────────────────────────────────────────────

export async function handleAdminDocumentsList(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const docs = await (prisma as any).companyDocument.findMany({
    where: { deletedAt: null },
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
  });

  return json(env, request, {
    ok: true,
    documents: docs.map((d: any) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      category: d.category,
      description: d.description,
      fileSize: d.fileSize,
      sizeBytes: Number(d.sizeBytes),
      pageCount: d.pageCount,
      fileUrl: d.fileUrl,
      storageKey: d.storageKey,
      filePath: d.filePath,
      coverImage: d.coverImage,
      sortOrder: d.sortOrder,
      isPublished: d.isPublished,
      requiresAuth: d.requiresAuth,
      pinCode: d.pinCode,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
  });
}

export async function handleAdminDocumentGet(
  _sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "REVIEWER");
  if (deny) return deny;

  const doc = await (prisma as any).companyDocument.findFirst({
    where: { id, deletedAt: null },
  });

  if (!doc) {
    return json(env, request, { error: "Document not found." }, 404);
  }

  return json(env, request, {
    ok: true,
    document: {
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      category: doc.category,
      description: doc.description,
      fileSize: doc.fileSize,
      sizeBytes: Number(doc.sizeBytes),
      pageCount: doc.pageCount,
      fileUrl: doc.fileUrl,
      storageKey: doc.storageKey,
      filePath: doc.filePath,
      coverImage: doc.coverImage,
      sortOrder: doc.sortOrder,
      isPublished: doc.isPublished,
      requiresAuth: doc.requiresAuth,
      pinCode: doc.pinCode,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    },
  });
}

export async function handleAdminDocumentCreate(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = (await readJson(request)) as {
    title?: string;
    slug?: string;
    category?: "Profile" | "Standard" | "Report" | "Catalog";
    description?: string;
    fileSize?: string;
    sizeBytes?: number;
    pageCount?: number;
    fileUrl?: string;
    storageKey?: string;
    filePath?: string;
    coverImage?: string;
    sortOrder?: number;
    isPublished?: boolean;
    requiresAuth?: boolean;
    pinCode?: string;
  } | null;

  if (!body) return json(env, request, { error: "Invalid JSON body" }, 400);

  const title = String(body.title ?? "").trim();
  if (!title) return json(env, request, { error: "Document title is required." }, 400);

  const fileUrl = String(body.fileUrl ?? "").trim();
  if (!fileUrl) return json(env, request, { error: "File URL is required." }, 400);

  const rawSlug = body.slug ? slugify(String(body.slug)) : slugify(title);
  const slug = rawSlug || `doc-${generateUniqueToken(6)}`;

  // Ensure unique slug
  let uniqueSlug = slug;
  const existing = await (prisma as any).companyDocument.findFirst({
    where: { slug: uniqueSlug, deletedAt: null },
  });
  if (existing) {
    uniqueSlug = `${slug}-${generateUniqueToken(4)}`;
  }

  // Find max sort order if not specified
  let sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : 0;
  if (body.sortOrder === undefined) {
    const highest = await (prisma as any).companyDocument.findFirst({
      where: { deletedAt: null },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    sortOrder = highest ? highest.sortOrder + 1 : 0;
  }

  const doc = await (prisma as any).companyDocument.create({
    data: {
      id: cuid(),
      slug: uniqueSlug,
      title,
      category: body.category || "Profile",
      description: String(body.description ?? "").trim(),
      fileSize: String(body.fileSize ?? "0 MB").trim(),
      sizeBytes: BigInt(body.sizeBytes ?? 0),
      pageCount: Number(body.pageCount ?? 0),
      fileUrl,
      storageKey: String(body.storageKey ?? "").trim(),
      filePath: body.filePath ? String(body.filePath).trim() : null,
      coverImage: String(body.coverImage ?? "").trim(),
      sortOrder,
      isPublished: body.isPublished ?? true,
      requiresAuth: Boolean(body.requiresAuth),
      pinCode: body.pinCode ? String(body.pinCode).trim() : null,
    },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    action: "CREATE_DOCUMENT",
    entityType: "CompanyDocument",
    entityId: doc.id,
    newStatus: doc.isPublished ? "PUBLISHED" : "DRAFT",
    note: `Created document "${doc.title}"`,
  });

  return json(
    env,
    request,
    {
      ok: true,
      document: {
        ...doc,
        sizeBytes: Number(doc.sizeBytes),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      },
    },
    201
  );
}

export async function handleAdminDocumentUpdate(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const existing = await (prisma as any).companyDocument.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) return json(env, request, { error: "Document not found." }, 404);

  const body = (await readJson(request)) as {
    title?: string;
    slug?: string;
    category?: "Profile" | "Standard" | "Report" | "Catalog";
    description?: string;
    fileSize?: string;
    sizeBytes?: number;
    pageCount?: number;
    fileUrl?: string;
    storageKey?: string;
    filePath?: string;
    coverImage?: string;
    sortOrder?: number;
    isPublished?: boolean;
    requiresAuth?: boolean;
    pinCode?: string;
  } | null;

  if (!body) return json(env, request, { error: "Invalid JSON body" }, 400);

  const updateData: any = {};
  if (body.title !== undefined) updateData.title = String(body.title).trim();
  if (body.slug !== undefined) {
    const s = slugify(String(body.slug));
    if (s && s !== existing.slug) {
      const conflict = await (prisma as any).companyDocument.findFirst({
        where: { slug: s, id: { not: id }, deletedAt: null },
      });
      if (!conflict) updateData.slug = s;
    }
  }
  if (body.category !== undefined) updateData.category = body.category;
  if (body.description !== undefined) updateData.description = String(body.description).trim();
  if (body.fileSize !== undefined) updateData.fileSize = String(body.fileSize).trim();
  if (body.sizeBytes !== undefined) updateData.sizeBytes = BigInt(body.sizeBytes);
  if (body.pageCount !== undefined) updateData.pageCount = Number(body.pageCount);
  if (body.fileUrl !== undefined) updateData.fileUrl = String(body.fileUrl).trim();
  if (body.storageKey !== undefined) updateData.storageKey = String(body.storageKey).trim();
  if (body.filePath !== undefined) updateData.filePath = body.filePath ? String(body.filePath).trim() : null;
  if (body.coverImage !== undefined) updateData.coverImage = String(body.coverImage).trim();
  if (typeof body.sortOrder === "number") updateData.sortOrder = body.sortOrder;
  if (typeof body.isPublished === "boolean") updateData.isPublished = body.isPublished;
  if (typeof body.requiresAuth === "boolean") updateData.requiresAuth = body.requiresAuth;
  if (body.pinCode !== undefined) updateData.pinCode = body.pinCode ? String(body.pinCode).trim() : null;

  const doc = await (prisma as any).companyDocument.update({
    where: { id },
    data: updateData,
  });

  await writeAudit(sql, {
    adminId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    action: "UPDATE_DOCUMENT",
    entityType: "CompanyDocument",
    entityId: doc.id,
    note: `Updated document "${doc.title}"`,
  });

  return json(env, request, {
    ok: true,
    document: {
      ...doc,
      sizeBytes: Number(doc.sizeBytes),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    },
  });
}

export async function handleAdminDocumentDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "SUPER_ADMIN");
  if (deny) return deny;

  const existing = await (prisma as any).companyDocument.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) return json(env, request, { error: "Document not found." }, 404);

  await (prisma as any).companyDocument.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    action: "DELETE_DOCUMENT",
    entityType: "CompanyDocument",
    entityId: id,
    note: `Deleted document "${existing.title}"`,
  });

  return json(env, request, { ok: true });
}

export async function handleAdminDocumentsReorder(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;

  const body = (await readJson(request)) as { orderedIds?: string[] } | null;
  const ids = Array.isArray(body?.orderedIds) ? body!.orderedIds : [];

  if (!ids.length) {
    return json(env, request, { error: "No document IDs provided." }, 400);
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      (prisma as any).companyDocument.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  await writeAudit(sql, {
    adminId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    action: "REORDER_DOCUMENTS",
    entityType: "CompanyDocument",
    entityId: "batch",
    note: `Reordered ${ids.length} documents`,
  });

  return json(env, request, { ok: true });
}

export async function handleAdminDocumentUpload(
  _sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(null, env, request, "ADMIN");
  if (deny) return deny;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const docType = (formData.get("type") as string) || "document"; // "document" (pdf) | "cover" (image)
    const title = (formData.get("title") as string) || "document";

    if (!file || typeof file === "string") {
      return json(env, request, { error: "No valid file uploaded." }, 400);
    }

    const blob = file as File;
    const arrayBuffer = await blob.arrayBuffer();
    const cleanTitle = slugify(title) || "document";
    const tag = generateUniqueToken(4);

    let storageKey = "";
    let contentType = blob.type;

    if (docType === "cover" || blob.type.startsWith("image/")) {
      const ext = blob.name.split(".").pop()?.toLowerCase() || "webp";
      storageKey = `documents/covers/${cleanTitle}-${tag}.${ext}`;
      contentType = blob.type || "image/webp";
    } else {
      // PDF or Document
      storageKey = `documents/${cleanTitle}-${tag}.pdf`;
      contentType = "application/pdf";
    }

    await putPublicAsset(env, storageKey, arrayBuffer, contentType);
    const fileUrl = publicUploadUrl(env, storageKey);

    return json(env, request, {
      ok: true,
      fileUrl,
      storageKey,
      fileSize: `${(blob.size / (1024 * 1024)).toFixed(1)} MB`,
      sizeBytes: blob.size,
    });
  } catch (err: any) {
    console.error("[admin/documents/upload]", err);
    return json(env, request, { error: err?.message || "Upload failed." }, 500);
  }
}
