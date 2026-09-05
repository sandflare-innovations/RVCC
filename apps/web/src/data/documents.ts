export type DocumentCategory = "Profile" | "Standard" | "Report" | "Catalog";

export interface DocumentItem {
  id: string;
  slug: string;
  title: string;
  category: DocumentCategory;
  description: string;
  fileSize: string;
  updatedAt: string;
  filePath: string;
  fileUrl: string;
  image: string;
  sizeBytes?: number;
  pageCount?: number;
  requiresAuth?: boolean;
}
