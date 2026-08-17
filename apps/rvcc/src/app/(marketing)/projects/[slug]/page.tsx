import { notFound } from "next/navigation";

import { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { PROJECTS } from "@/data/projects/detailed";

import { ProjectDetailClient } from "../ProjectDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);

  if (!project) return { title: "Project Not Found" };

  return {
    title: `${project.title} | RVCC Projects`,
    description: project.description,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      <ProjectDetailClient project={project} />
      <Footer />
    </>
  );
}
