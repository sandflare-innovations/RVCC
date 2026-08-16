import { cdnUrl } from "@/lib/cdn";

export interface DocumentItem {
  id: string;
  slug: string;
  title: string;
  category: "Profile" | "Standard" | "Report" | "Catalog";
  description: string;
  fileSize: string;
  updatedAt: string;
  /** Logical path key under the S3/Tigris bucket (also used as CDN path). */
  filePath: string;
  /** Absolute URL on the public PDF CDN (S3/Tigris). */
  fileUrl: string;
  image: string;
}

const books = [
  {
    id: "1",
    slug: "rvcc-general-profile",
    title: "RVCC General Profile",
    category: "Profile" as const,
    description:
      "A comprehensive overview of our history, expertise, and landmark projects in the Saudi Kingdom.",
    fileSize: "12.4 MB",
    updatedAt: "March 2026",
    filePath: "/pdf/books/rvcc-general-profile.pdf",
    image: "/images/books/company-profile.webp",
  },
  {
    id: "2",
    slug: "rvcc-signature-projects",
    title: "Signature Projects Profile",
    category: "Profile" as const,
    description:
      "A curated showcase of our most ambitious and structurally significant projects across the region.",
    fileSize: "21.4 MB",
    updatedAt: "April 2026",
    filePath: "/pdf/books/rvcc-signature-project-profile.pdf",
    image: "/images/books/company-profile.webp",
  },
  {
    id: "3",
    slug: "rvcc-water-feature-landscape",
    title: "Water Feature & Landscape Profile",
    category: "Profile" as const,
    description:
      "A specialized showcase of our elite water feature engineering and architectural landscape masterworks.",
    fileSize: "166.2 MB",
    updatedAt: "May 2026",
    filePath: "/pdf/books/rvcc-water-feature-landscape-profile.pdf",
    image: "/images/books/company-profile.webp",
  },
  {
    id: "4",
    slug: "rvmf-metal-factory-steel-work",
    title: "Metal Factory & Steel Work Profile",
    category: "Profile" as const,
    description:
      "Comprehensive documentation of our high-precision metal fabrication and structural steel engineering capabilities.",
    fileSize: "8.8 MB",
    updatedAt: "May 2026",
    filePath: "/pdf/books/rvmf-metal-factory-steel-work-profile.pdf",
    image: "/images/books/company-profile.webp",
  },
];

export const DOCUMENTS: DocumentItem[] = books.map((doc) => ({
  ...doc,
  fileUrl: cdnUrl(doc.filePath),
}));
