"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@lib/utils";
import { Icons } from "@repo/ui";
import { useProjectFilters } from "../../hooks/useProjectFilters";
import { ProjectFilters } from "./ProjectFilters";

export const ProjectList = () => {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    projects,
  } = useProjectFilters();

  return (
    <section className="bg-background">
      <ProjectFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
      />

      <div className="container mx-auto px-6 py-12 min-h-[400px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <AnimatePresence mode="popLayout">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
              >
                <Link
                  href={`/projects/${project.slug}`}
                  className="group block"
                >
                  <div className="relative overflow-hidden">
                    {/* Image Container */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />

                      {/* Category Tag */}
                      <div className="absolute top-6 left-6 z-10">
                        <span className="bg-brand-blue px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                          {project.category}
                        </span>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-500 group-hover:opacity-100 flex items-center justify-center">
                        <div className="h-20 w-20 rounded-full bg-transparent border-2 border-white cursor-pointer flex items-center justify-center text-white scale-0 transition-transform duration-500 group-hover:scale-100">
                          <Icons.ArrowRight className="h-8 w-8" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="pt-8">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">
                          {project.location}
                        </span>
                        <span className="text-xs font-medium text-foreground/40">
                          {project.year}
                        </span>
                      </div>
                      <h3 className="text-3xl font-bold transition-colors group-hover:text-brand-blue uppercase font-primary tracking-tighter md:text-4xl">
                        {project.title}
                      </h3>
                      <p className="mt-4 max-w-xl text-foreground/60 line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                  </div>
                </Link>
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
            <Icons.Search className="h-12 w-12 text-foreground/10 mb-6" />
            <h3 className="text-2xl font-bold uppercase font-primary">No Projects Found</h3>
            <p className="text-foreground/40 mt-2">Try adjusting your search or filters.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-8 text-[10px] font-bold uppercase tracking-widest text-brand-blue border-b border-brand-blue pb-1 hover:text-foreground hover:border-foreground transition-colors"
            >
              CLEAR ALL FILTERS
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
};
