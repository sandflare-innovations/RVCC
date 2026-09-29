import { documentCategorySchema, type DocumentCategory, z } from "@rvcc/schemas";

export const documentCategoryEnum = documentCategorySchema;
export type { DocumentCategory };

export const createDocumentSchema = z.object({
  title: z.string().min(1, "Document title is required."),
  slug: z.string().optional(),
  category: documentCategoryEnum.default("Profile"),
  description: z.string().optional().default(""),
  fileSize: z.string().optional().default("0 MB"),
  sizeBytes: z.number().int().nonnegative().optional().default(0),
  pageCount: z.number().int().nonnegative().optional().default(0),
  fileUrl: z.string().min(1, "File URL is required."),
  storageKey: z.string().optional().default(""),
  filePath: z.string().nullable().optional(),
  coverImage: z.string().optional().default(""),
  sortOrder: z.number().int().optional(),
  isPublished: z.boolean().optional().default(true),
  visibleToVendors: z.boolean().optional().default(false),
  requiresAuth: z.boolean().optional().default(false),
  pinCode: z.string().nullable().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

export const updateDocumentSchema = createDocumentSchema.partial();
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

export const reorderDocumentsSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1, "No document IDs provided."),
});

export type ReorderDocumentsInput = z.infer<typeof reorderDocumentsSchema>;
