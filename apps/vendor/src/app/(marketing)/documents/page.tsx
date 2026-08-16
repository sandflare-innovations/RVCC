import { Metadata } from "next";

import { FloatingContact } from "@/components/common/FloatingContact";
import { Footer } from "@/components/layout/Footer";
import { DocumentHero } from "@/sections/documents/DocumentHero";
import { DocumentList } from "@/sections/documents/DocumentList";

export const metadata: Metadata = {
  title: "Documents & Resources | RVCC - Professional Repository",
  description:
    "Access our comprehensive collection of company profiles, health and safety standards, and operational documents. Professional resources for partners and clients.",
};

export default function DocumentsPage() {
  return (
    <div className="relative min-h-screen">
      <DocumentHero />
      <DocumentList />
      <Footer />
      <FloatingContact />
    </div>
  );
}
