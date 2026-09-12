import { z } from "zod";

// ── Hero Slide Schemas ──────────────────────────────────────────────────────

export const heroSlideSchema = z.object({
  id: z.string(),
  page: z.string().default("home"),
  badge: z.string(),
  title1: z.string(),
  title2: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  primaryBtnText: z.string().nullable(),
  primaryBtnLink: z.string().nullable(),
  secondaryBtnText: z.string().nullable(),
  secondaryBtnLink: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type HeroSlideDTO = z.infer<typeof heroSlideSchema>;

export const heroSlideInputSchema = z.object({
  page: z.string().optional(),
  badge: z.string().optional(),
  title1: z.string(),
  title2: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  primaryBtnText: z.string().nullable().optional(),
  primaryBtnLink: z.string().nullable().optional(),
  secondaryBtnText: z.string().nullable().optional(),
  secondaryBtnLink: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export type HeroSlideInput = z.infer<typeof heroSlideInputSchema>;

// ── Client Partner Schemas ──────────────────────────────────────────────────

export const clientPartnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string(),
  industry: z.string(),
  websiteUrl: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ClientPartnerDTO = z.infer<typeof clientPartnerSchema>;

export const clientPartnerInputSchema = z.object({
  name: z.string(),
  logoUrl: z.string(),
  industry: z.string().optional(),
  websiteUrl: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export type ClientPartnerInput = z.infer<typeof clientPartnerInputSchema>;

// ── Sister Concern Company Schemas ──────────────────────────────────────────

export const sisterCompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string(),
  industry: z.string(),
  websiteUrl: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SisterCompanyDTO = z.infer<typeof sisterCompanySchema>;

export const sisterCompanyInputSchema = z.object({
  name: z.string(),
  logoUrl: z.string(),
  industry: z.string().optional(),
  websiteUrl: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export type SisterCompanyInput = z.infer<typeof sisterCompanyInputSchema>;

// ── Project & Gallery Schemas ───────────────────────────────────────────────

export const projectStatusSchema = z.enum(["Completed", "In Progress", "Upcoming"]);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const galleryImageSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  projectTitle: z.string().optional(),
  projectSlug: z.string().optional(),
  imageUrl: z.string(),
  caption: z.string(),
  serviceSlugs: z.array(z.string()).optional(),
  isCover: z.boolean().optional(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type GalleryImageDTO = z.infer<typeof galleryImageSchema>;

export const galleryImageInputSchema = z.object({
  projectId: z.string(),
  imageUrl: z.string(),
  caption: z.string().optional(),
  serviceSlugs: z.array(z.string()).optional(),
  isCover: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export type GalleryImageInput = z.infer<typeof galleryImageInputSchema>;

export const projectSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  category: z.string(),
  serviceSlugs: z.array(z.string()).optional(),
  client: z.string(),
  location: z.string(),
  year: z.string(),
  status: projectStatusSchema,
  description: z.string(),
  coverImage: z.string(),
  scope: z.array(z.string()),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  gallery: z.array(galleryImageSchema).optional(),
  _count: z.object({ gallery: z.number().int() }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProjectDTO = z.infer<typeof projectSchema>;

export const projectInputSchema = z.object({
  title: z.string(),
  slug: z.string().optional(),
  category: z.string(),
  serviceSlugs: z.array(z.string()).optional(),
  client: z.string().optional(),
  location: z.string().optional(),
  year: z.string().optional(),
  status: projectStatusSchema.optional(),
  description: z.string().optional(),
  coverImage: z.string(),
  scope: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

// ── Service Schemas ─────────────────────────────────────────────────────────

export const serviceSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  longDescription: z.string(),
  image: z.string(),
  iconName: z.string(),
  features: z.array(z.string()),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  galleryImages: z.array(galleryImageSchema).optional(),
  _count: z
    .object({
      galleryImages: z.number().int().optional(),
      projects: z.number().int().optional(),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ServiceDTO = z.infer<typeof serviceSchema>;

export const serviceInputSchema = z.object({
  title: z.string(),
  slug: z.string().optional(),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  image: z.string(),
  iconName: z.string().optional(),
  features: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export type ServiceInput = z.infer<typeof serviceInputSchema>;

// ── Company Document Schemas ────────────────────────────────────────────────

export const documentCategorySchema = z.enum(["Profile", "Standard", "Report", "Catalog"]);
export type DocumentCategory = z.infer<typeof documentCategorySchema>;

export const companyDocumentSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  category: documentCategorySchema,
  description: z.string(),
  fileSize: z.string(),
  sizeBytes: z.number().int(),
  pageCount: z.number().int(),
  fileUrl: z.string(),
  storageKey: z.string(),
  filePath: z.string().nullable().optional(),
  coverImage: z.string(),
  sortOrder: z.number().int(),
  isPublished: z.boolean(),
  requiresAuth: z.boolean(),
  pinCode: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CompanyDocumentDTO = z.infer<typeof companyDocumentSchema>;

export const companyDocumentInputSchema = z.object({
  title: z.string(),
  slug: z.string().optional(),
  category: documentCategorySchema.optional(),
  description: z.string().optional(),
  fileSize: z.string().optional(),
  sizeBytes: z.number().int().optional(),
  pageCount: z.number().int().optional(),
  fileUrl: z.string(),
  storageKey: z.string(),
  filePath: z.string().nullable().optional(),
  coverImage: z.string(),
  sortOrder: z.number().int().optional(),
  isPublished: z.boolean().optional(),
  requiresAuth: z.boolean().optional(),
  pinCode: z.string().nullable().optional(),
});
export type CompanyDocumentInput = z.infer<typeof companyDocumentInputSchema>;

// ── News & Events Schemas ───────────────────────────────────────────────────

export const newsEventSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  date: z.string(),
  excerpt: z.string(),
  content: z.string().nullable().optional(),
  imageUrl: z.string(),
  category: z.string(),
  edition: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type NewsEventDTO = z.infer<typeof newsEventSchema>;

export const newsEventInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  date: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().nullable().optional(),
  imageUrl: z.string().min(1, "Image URL is required"),
  category: z.string().optional(),
  edition: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export type NewsEventInput = z.infer<typeof newsEventInputSchema>;

// ── About Content Schemas ───────────────────────────────────────────────────

export const homeStatItemSchema = z.object({
  value: z.number(),
  label: z.string(),
  suffix: z.string().default(""),
});
export type HomeStatItem = z.infer<typeof homeStatItemSchema>;

export const aboutStatMetricSchema = z.object({
  value: z.string(),
  description: z.string(),
});
export type AboutStatMetric = z.infer<typeof aboutStatMetricSchema>;

export const aboutContentSchema = z.object({
  id: z.string(),
  videoUrl: z.string(),
  videoPosterUrl: z.string().nullable().optional(),
  homeStats: z.array(homeStatItemSchema),
  aboutStats: z.array(aboutStatMetricSchema),
  overviewImages: z.array(z.string()),
  overviewTitle: z.string().optional(),
  overviewSubtitle: z.string().optional(),
  overviewDescription1: z.string().optional(),
  overviewDescription2: z.string().optional(),
  classABadge: z.string().optional(),
  classADescription: z.string().optional(),
  deliveriesCount: z.string().optional(),
  yearsCount: z.string().optional(),
  updatedAt: z.string(),
});
export type AboutContentDTO = z.infer<typeof aboutContentSchema>;

export const aboutContentInputSchema = z.object({
  videoUrl: z.string().optional(),
  videoPosterUrl: z.string().nullable().optional(),
  homeStats: z.array(homeStatItemSchema).optional(),
  aboutStats: z.array(aboutStatMetricSchema).optional(),
  overviewImages: z.array(z.string()).optional(),
  overviewTitle: z.string().optional(),
  overviewSubtitle: z.string().optional(),
  overviewDescription1: z.string().optional(),
  overviewDescription2: z.string().optional(),
  classABadge: z.string().optional(),
  classADescription: z.string().optional(),
  deliveriesCount: z.string().optional(),
  yearsCount: z.string().optional(),
});
export type AboutContentInput = z.infer<typeof aboutContentInputSchema>;

