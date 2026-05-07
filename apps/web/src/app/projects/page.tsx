import { Metadata } from "next";
import { ProjectHero } from "@/sections/projects/ProjectHero";
import { ProjectList } from "@/sections/projects/ProjectList";
import { Footer } from "@/components/layout/Footer";
import { FloatingContact } from "@/components/common/FloatingContact";

export const metadata: Metadata = {
  title: "Projects | RVCC - Our Architectural Portfolio",
  description:
    "Explore our complete portfolio of premier projects across Saudi Arabia, including commercial towers, luxury residences, and urban landscaping.",
};

export default function ProjectsPage() {
  return (
    <main className="relative min-h-screen">
      <ProjectHero />
      <ProjectList />
      <Footer />
      <FloatingContact />
    </main>
  );
}
