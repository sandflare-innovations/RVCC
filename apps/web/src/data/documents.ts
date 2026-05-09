export interface DocumentItem {
  id: string;
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
    title: "RVCC Company Profile 2026",
    category: "Profile",
    description: "A comprehensive overview of our history, expertise, and landmark projects in the Saudi Kingdom.",
    fileSize: "12.4 MB",
    updatedAt: "March 2026",
    fileUrl: "/pdf/RVCC COPMANY PROFILE SIGNATURE PROJECT.pdf",
    image: "/images/books/company-profile.png",
  },
  {
    id: "2",
    title: "Health & Safety Standards",
    category: "Standard",
    description: "Our rigorous safety protocols and compliance standards for all construction and civil sites.",
    fileSize: "4.8 MB",
    updatedAt: "January 2026",
    fileUrl: "#",
    image: "/images/books/company-profile.png",
  },
  {
    id: "3",
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
    title: "Quality Management System",
    category: "Standard",
    description: "Documentation of our ISO-aligned quality assurance and project management procedures.",
    fileSize: "5.5 MB",
    updatedAt: "December 2025",
    fileUrl: "#",
    image: "/images/books/company-profile.png",
  },
];
