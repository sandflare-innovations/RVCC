import { Metadata } from "next";

import { ClientLogos } from "@/components/common/ClientLogos";
import { FloatingContact } from "@/components/common/FloatingContact";
import { Footer } from "@/components/layout/Footer";
import { ProjectHero } from "@/sections/projects/ProjectHero";
import { ProjectList } from "@/sections/projects/ProjectList";
import { ProjectMetrics } from "@/sections/projects/ProjectMetrics";

export const metadata: Metadata = {
  title: "Projects | RVCC - Our Architectural Portfolio",
  description:
    "Explore our complete portfolio of premier projects across Saudi Arabia, including commercial towers, luxury residences, and urban landscaping.",
};

export default function ProjectsPage() {
  return (
    <div className="relative min-h-screen">
      <ProjectHero />
      <ProjectMetrics />
      <ClientLogos />
      <ProjectList />
      <Footer />
      <FloatingContact />
    </div>
  );
}
