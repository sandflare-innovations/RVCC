export interface DocumentItem {
  id: string;
  slug: string;
  title: string;
  category: "Profile" | "Standard" | "Report" | "Catalog";
  description: string;
  fileSize: string;
  updatedAt: string;
  fileUrl: string;
  image: string;
}

export const DOCUMENTS: DocumentItem[] = [
  {
    id: "1",
    slug: "rvcc-general-profile",
    title: "RVCC General Profile",
    category: "Profile",
    description:
      "A comprehensive overview of our history, expertise, and landmark projects in the Saudi Kingdom.",
    fileSize: "12.4 MB",
    updatedAt: "March 2026",
    fileUrl: "/pdf/books/rvcc-general-profile.pdf",
    image: "/images/books/company-profile.png",
  },
  {
    id: "2",
    slug: "rvcc-signature-projects",
    title: "Signature Projects Profile",
    category: "Profile",
    description:
      "A curated showcase of our most ambitious and structurally significant projects across the region.",
    fileSize: "21.4 MB",
    updatedAt: "April 2026",
    fileUrl: "/pdf/books/rvcc-signature-project-profile.pdf",
    image: "/images/books/company-profile.png",
  },
  {
    id: "3",
    slug: "rvcc-water-feature-landscape",
    title: "Water Feature & Landscape Profile",
    category: "Profile",
    description:
      "A specialized showcase of our elite water feature engineering and architectural landscape masterworks.",
    fileSize: "166.2 MB",
    updatedAt: "May 2026",
    fileUrl: "/pdf/books/rvcc-water-feature-landscape-profile.pdf",
    image: "/images/books/company-profile.png",
  },
  {
    id: "4",
    slug: "rvmf-metal-factory-steel-work",
    title: "Metal Factory & Steel Work Profile",
    category: "Profile",
    description:
      "Comprehensive documentation of our high-precision metal fabrication and structural steel engineering capabilities.",
    fileSize: "8.8 MB",
    updatedAt: "May 2026",
    fileUrl: "/pdf/books/rvmf-metal-factory-steel-work-profile.pdf",
    image: "/images/books/company-profile.png",
  },
];
