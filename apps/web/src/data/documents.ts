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
    fileUrl: "/pdf/books/RVCC-General-Profile.pdf",
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
    fileUrl: "/pdf/books/RVCC-COPMANY-PROFILE-SIGNATURE-PROJECT.pdf",
    image: "/images/books/company-profile.png",
  },
  {
    id: "3",
    slug: "infrastructure-capabilities",
    title: "Infrastructure Capabilities",
    category: "Profile",
    description: "Detailed analysis of our heavy infrastructure and utility development services.",
    fileSize: "8.2 MB",
    updatedAt: "February 2026",
    fileUrl: "#",
    image: "/images/books/company-profile.png",
  },
  {
    id: "4",
    slug: "quality-management-system",
    title: "Quality Management System",
    category: "Standard",
    description:
      "Documentation of our ISO-aligned quality assurance and project management procedures.",
    fileSize: "5.5 MB",
    updatedAt: "December 2025",
    fileUrl: "#",
    image: "/images/books/company-profile.png",
  },
];
