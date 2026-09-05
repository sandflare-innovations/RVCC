import { Metadata } from "next";

import { ClientLogos } from "@/components/common/ClientLogos";
import { FloatingContact } from "@/components/common/FloatingContact";
import { Footer } from "@/components/layout/Footer";
import { ProjectHero } from "@/sections/projects/ProjectHero";
import { ProjectList } from "@/sections/projects/ProjectList";
import { ProjectMetrics } from "@/sections/projects/ProjectMetrics";
import { getProjects } from "@/lib/content/projects";
import { getClientPartners } from "@/lib/content/clients";

export const metadata: Metadata = {
  title: "Projects | RVCC - Our Architectural Portfolio",
  description:
    "Explore our complete portfolio of premier projects across Saudi Arabia, including commercial towers, luxury residences, and urban landscaping.",
};

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([
    getProjects(),
    getClientPartners(),
  ]);

  return (
    <main className="relative min-h-screen">
      <ProjectHero />
      <ProjectMetrics />
      <ClientLogos initialLogos={clients} />
      <ProjectList initialProjects={projects} />
      <Footer />
      <FloatingContact />
    </main>
  );
}

