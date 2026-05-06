import { Metadata } from "next";
import { notFound } from "next/navigation";
import { GALLARY_PROJECTS } from "@/data/gallary";
import { Footer } from "@layout/Footer";
import { FloatingContact } from "@/components/common/FloatingContact";
import ProjectClient from "./ProjectClient";

interface Props {
  params: Promise<{ project: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { project: projectSlug } = await params;
  const project = GALLARY_PROJECTS.find((p) => p.slug === projectSlug);
  if (!project) return { title: "Project Not Found" };

  return {
    title: `${project.title} | RVCC Gallery`,
    description: project.description,
  };
}

export default async function ProjectGallaryPage({ params }: Props) {
  const { project: projectSlug } = await params;
  const project = GALLARY_PROJECTS.find((p) => p.slug === projectSlug);

  if (!project) {
    notFound();
  }

  return (
    <div className="relative min-h-screen bg-background">
      <ProjectClient project={project} />
      <Footer />
      <FloatingContact />
    </div>
  );
}
