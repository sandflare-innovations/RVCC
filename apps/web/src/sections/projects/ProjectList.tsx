"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import { DetailedProject } from "@/data/projects/detailed";
import { Icons } from "@/lib/icons";

import { useState } from "react";
import { useProjectFilters } from "../../hooks/useProjectFilters";
import { ProjectFilters } from "./ProjectFilters";

export const ProjectListSkeleton = () => {
  return (
    <div className="container mx-auto min-h-[400px] px-6 pb-20 pt-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-5 lg:gap-y-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col border border-brand-blue/15 bg-white overflow-hidden shadow-xs"
          >
            {/* Image Skeleton */}
            <div className="relative aspect-[16/8] w-full overflow-hidden bg-gradient-to-br from-brand-blue/10 via-white to-brand-blue/5">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-blue/15 to-transparent animate-pulse" />
            </div>

            {/* Middle Data Bar Skeleton */}
            <div className="bg-brand-blue/90 flex w-full items-center px-3 py-3 gap-4">
              <div className="h-2.5 w-20 rounded-sm bg-white/40 animate-pulse" />
              <div className="h-3 w-[1px] bg-white/30" />
              <div className="h-2.5 w-24 rounded-sm bg-white/40 animate-pulse" />
            </div>

            {/* Content Skeleton */}
            <div className="p-6 flex flex-col space-y-4">
              <div className="h-7 w-3/4 rounded-sm bg-gradient-to-r from-brand-blue/20 to-brand-blue/10 animate-pulse" />
              <div className="h-4 w-full rounded-sm bg-zinc-100 animate-pulse" />
              <div className="h-4 w-2/3 rounded-sm bg-zinc-100 animate-pulse" />

              <div className="flex items-center justify-between pt-6">
                <div className="h-[1px] w-12 bg-brand-blue/20" />
                <div className="h-3 w-16 rounded-sm bg-brand-blue/20 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProjectCard = ({ project }: { project: DetailedProject }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group relative flex flex-col border border-zinc-100 bg-white transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,115,188,0.15)]"
    >
      {/* Top: Cinematic Image Section with Skeleton Animation */}
      <div className="relative aspect-[16/8] w-full overflow-hidden bg-gradient-to-br from-brand-blue/10 via-white to-brand-blue/5">
        {/* Skeleton animation while image is loading */}
        <div
          className={`absolute inset-0 z-10 bg-gradient-to-r from-transparent via-brand-blue/15 to-transparent transition-opacity duration-700 ${
            imageLoaded ? "opacity-0 pointer-events-none" : "opacity-100 animate-pulse"
          }`}
        />
        <Image
          src={project.image || (project as any).coverImage || "/images/projects/13.webp"}
          alt={project.title || "Project"}
          fill
          onLoad={() => setImageLoaded(true)}
          className={`object-cover transition-all duration-700 group-hover:scale-105 ${
            imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Middle: Architectural Data Bar */}
      <div className="bg-brand-blue flex w-full items-center px-3 py-3">
        <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">
          {project.category}
        </span>
        <div className="mx-6 h-3 w-[1px] bg-white/30" />
        <span className="text-[10px] font-bold tracking-[0.2em] text-white uppercase">
          {project.location}
        </span>
      </div>

      {/* Bottom: Content & Narrative Section */}
      <div className="flex flex-col space-y-4 p-6">
        <h3 className="font-heading group-hover:text-brand-blue text-3xl leading-[1.1] tracking-tight text-zinc-900 uppercase transition-colors md:text-4xl">
          {project.title}
        </h3>

        <p className="line-clamp-3 text-sm leading-relaxed font-light text-zinc-400">
          {project.description}
        </p>

        <div className="flex items-center justify-between pt-6">
          {/* Left: Architectural Accent Line */}
          <div className="group-hover:bg-brand-blue h-[1px] w-12 bg-zinc-100 transition-all duration-700 group-hover:w-20" />

          {/* Right: Explicit Action */}
          <div className="group-hover:text-brand-blue flex items-center gap-3 text-[10px] font-black tracking-[0.4em] text-zinc-900 uppercase transition-colors">
            EXPLORE{" "}
            <Icons.ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" />
          </div>
        </div>
      </div>

      {/* Interactive Border Overlay */}
      <div className="group-hover:border-brand-blue/10 absolute inset-0 border-2 border-transparent transition-colors duration-500" />
    </Link>
  );
};

export const ProjectList = ({ initialProjects }: { initialProjects?: DetailedProject[] }) => {
  if (initialProjects === undefined) {
    return <ProjectListSkeleton />;
  }

  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    projects,
  } = useProjectFilters(initialProjects);

  return (
    <section className="bg-background">
      <ProjectFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
      />

      <div className="container mx-auto min-h-[400px] px-6 pb-20">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-5 lg:gap-y-10">
          <AnimatePresence mode="popLayout">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {projects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <Icons.Search className="text-foreground/10 mb-6 h-12 w-12" />
            <h3 className="font-primary text-2xl font-bold uppercase">No Projects Found</h3>
            <p className="text-foreground/40 mt-2">Try adjusting your search or filters.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="text-brand-blue border-brand-blue hover:text-foreground hover:border-foreground mt-8 border-b pb-1 text-[10px] font-bold tracking-widest uppercase transition-colors"
            >
              CLEAR ALL FILTERS
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
};
