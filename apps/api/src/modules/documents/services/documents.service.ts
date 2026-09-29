import type { Env } from "../../../config/env";
import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";
import {
  generateUniqueToken,
  publicUploadUrl,
  putPublicAsset,
  slugify,
} from "../../../lib/storage";
import type { CreateDocumentInput, UpdateDocumentInput } from "../schemas/documents.schema";
import type { SerializedDocument } from "../types/documents.types";

export function serializeDocument(
  doc: any,
  options?: { includePrivateFields?: boolean }
): SerializedDocument {
  const result: SerializedDocument = {
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    category: doc.category,
    description: doc.description,
    fileSize: doc.fileSize,
    sizeBytes: Number(doc.sizeBytes ?? 0),
    pageCount: doc.pageCount,
    fileUrl: doc.fileUrl,
    storageKey: doc.storageKey,
    filePath: doc.filePath,
    coverImage: doc.coverImage,
    sortOrder: doc.sortOrder,
    requiresAuth: doc.requiresAuth,
    visibleToVendors: Boolean(doc.visibleToVendors),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt),
  };

  if (options?.includePrivateFields) {
    result.isPublished = doc.isPublished;
    result.visibleToVendors = Boolean(doc.visibleToVendors);
    result.pinCode = doc.pinCode;
  }

  return result;
}

export class DocumentsService {
  /**
   * List all documents (admin can see all, public sees only published)
   */
  static async listDocuments(options?: {
    publishedOnly?: boolean;
    vendorPortalOnly?: boolean;
  }): Promise<SerializedDocument[]> {
    const whereClause: any = { deletedAt: null };
    if (options?.publishedOnly) {
      whereClause.isPublished = true;
    }
    if (options?.vendorPortalOnly) {
      whereClause.visibleToVendors = true;
    }

    const docs = await (prisma as any).companyDocument.findMany({
      where: whereClause,
      orderBy: [
        { sortOrder: "asc" },
        options?.publishedOnly ? { createdAt: "asc" } : { createdAt: "desc" },
      ],
    });

    return docs.map((d: any) =>
      serializeDocument(d, { includePrivateFields: !options?.publishedOnly })
    );
  }

  /**
   * Get single document by ID
   */
  static async getDocumentById(id: string): Promise<SerializedDocument | null> {
    const doc = await (prisma as any).companyDocument.findFirst({
      where: { id, deletedAt: null },
    });
    if (!doc) return null;
    return serializeDocument(doc, { includePrivateFields: true });
  }

  /**
   * Get single document by Slug (for public access)
   */
  static async getDocumentBySlug(
    slug: string,
    options?: { publishedOnly?: boolean }
  ): Promise<SerializedDocument | null> {
    const whereClause: any = { slug, deletedAt: null };
    if (options?.publishedOnly) {
      whereClause.isPublished = true;
    }

    const doc = await (prisma as any).companyDocument.findFirst({
      where: whereClause,
    });
    if (!doc) return null;
    return serializeDocument(doc, { includePrivateFields: !options?.publishedOnly });
  }

  /**
   * Create a new company document
   */
  static async createDocument(input: CreateDocumentInput): Promise<SerializedDocument> {
    const title = input.title.trim();
    const rawSlug = input.slug ? slugify(input.slug) : slugify(title);
    const baseSlug = rawSlug || `doc-${generateUniqueToken(6)}`;

    // Ensure unique slug
    let uniqueSlug = baseSlug;
    const existing = await (prisma as any).companyDocument.findFirst({
      where: { slug: uniqueSlug, deletedAt: null },
    });
    if (existing) {
      uniqueSlug = `${baseSlug}-${generateUniqueToken(4)}`;
    }

    // Determine sort order
    let sortOrder = input.sortOrder;
    if (sortOrder === undefined) {
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
        category: input.category || "Profile",
        description: input.description?.trim() ?? "",
        fileSize: input.fileSize?.trim() ?? "0 MB",
        sizeBytes: BigInt(input.sizeBytes ?? 0),
        pageCount: input.pageCount ?? 0,
        fileUrl: input.fileUrl.trim(),
        storageKey: input.storageKey?.trim() ?? "",
        filePath: input.filePath ? input.filePath.trim() : null,
        coverImage: input.coverImage?.trim() ?? "",
        sortOrder,
        isPublished: input.isPublished ?? true,
        visibleToVendors: Boolean(input.visibleToVendors),
        requiresAuth: Boolean(input.requiresAuth),
        pinCode: input.pinCode ? input.pinCode.trim() : null,
      },
    });

    return serializeDocument(doc, { includePrivateFields: true });
  }

  /**
   * Update an existing company document
   */
  static async updateDocument(
    id: string,
    input: UpdateDocumentInput
  ): Promise<SerializedDocument | null> {
    const existing = await (prisma as any).companyDocument.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return null;

    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.slug !== undefined) {
      const s = slugify(input.slug);
      if (s && s !== existing.slug) {
        const conflict = await (prisma as any).companyDocument.findFirst({
          where: { slug: s, id: { not: id }, deletedAt: null },
        });
        if (!conflict) updateData.slug = s;
      }
    }
    if (input.category !== undefined) updateData.category = input.category;
    if (input.description !== undefined) updateData.description = input.description.trim();
    if (input.fileSize !== undefined) updateData.fileSize = input.fileSize.trim();
    if (input.sizeBytes !== undefined) updateData.sizeBytes = BigInt(input.sizeBytes);
    if (input.pageCount !== undefined) updateData.pageCount = Number(input.pageCount);
    if (input.fileUrl !== undefined) updateData.fileUrl = input.fileUrl.trim();
    if (input.storageKey !== undefined) updateData.storageKey = input.storageKey.trim();
    if (input.filePath !== undefined)
      updateData.filePath = input.filePath ? input.filePath.trim() : null;
    if (input.coverImage !== undefined) updateData.coverImage = input.coverImage.trim();
    if (typeof input.sortOrder === "number") updateData.sortOrder = input.sortOrder;
    if (typeof input.isPublished === "boolean") updateData.isPublished = input.isPublished;
    if (typeof input.visibleToVendors === "boolean")
      updateData.visibleToVendors = input.visibleToVendors;
    if (typeof input.requiresAuth === "boolean") updateData.requiresAuth = input.requiresAuth;
    if (input.pinCode !== undefined)
      updateData.pinCode = input.pinCode ? input.pinCode.trim() : null;

    const doc = await (prisma as any).companyDocument.update({
      where: { id },
      data: updateData,
    });

    return serializeDocument(doc, { includePrivateFields: true });
  }

  /**
   * Soft delete a document
   */
  static async deleteDocument(id: string): Promise<{ title: string } | null> {
    const existing = await (prisma as any).companyDocument.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return null;

    await (prisma as any).companyDocument.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { title: existing.title };
  }

  /**
   * Reorder documents by batch IDs
   */
  static async reorderDocuments(orderedIds: string[]): Promise<void> {
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        (prisma as any).companyDocument.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );
  }

  /**
   * Upload a document file (PDF) or cover image to Cloudflare R2
   */
  static async uploadAsset(
    env: Env,
    file: File,
    docType: string,
    title: string
  ): Promise<{ fileUrl: string; storageKey: string; fileSize: string; sizeBytes: number }> {
    const arrayBuffer = await file.arrayBuffer();
    const cleanTitle = slugify(title) || "document";
    const tag = generateUniqueToken(4);

    let storageKey = "";
    let contentType = file.type;

    if (docType === "cover" || file.type.startsWith("image/")) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
      storageKey = `documents/covers/${cleanTitle}-${tag}.${ext}`;
      contentType = file.type || "image/webp";
    } else {
      storageKey = `documents/${cleanTitle}-${tag}.pdf`;
      contentType = "application/pdf";
    }

    await putPublicAsset(env, storageKey, arrayBuffer, contentType);
    const fileUrl = publicUploadUrl(env, storageKey);

    return {
      fileUrl,
      storageKey,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      sizeBytes: file.size,
    };
  }
}
