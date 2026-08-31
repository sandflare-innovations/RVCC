"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import { Icons } from "@/lib/icons";

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
                <Link
                  href={`/projects/${project.slug}`}
                  className="group relative flex flex-col border border-zinc-100 bg-white transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)]"
                >
                  {/* Top: Cinematic Image Section */}
                  <div className="relative aspect-[16/8] w-full overflow-hidden">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
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
                  <div className="group-hover:border-brand-blue/5 absolute inset-0 border-2 border-transparent transition-colors duration-500" />
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
