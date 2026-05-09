"use client";

import Image from "next/image";
import Link from "next/link";

import { AnimatePresence, motion } from "framer-motion";

import { Icons } from "@repo/ui";

import { cn } from "@lib/utils";

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

      <div className="container mx-auto min-h-[400px] px-6 py-12">
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
                  className="group block flex flex-col items-center justify-center transition-all"
                >
                  {/* Top: Image Section */}
                  <div className="relative aspect-[16/10] w-[92%] overflow-hidden">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>

                  <div className="relative flex flex-col items-center justify-center shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)]">
                    {/* Middle: Data Strip */}
                    <div className="bg-brand-blue z-40 flex w-[92%] items-center justify-between px-6 py-2 md:px-8">
                      <div className="flex w-full items-center justify-between">
                        <span className="text-[9px] font-black tracking-[0.3em] text-white uppercase">
                          {project.category}
                        </span>
                        <div className="h-3 w-px bg-zinc-200" />
                        <span className="text-[9px] font-bold tracking-[0.3em] text-white uppercase">
                          {project.location}
                        </span>
                      </div>
                    </div>

                    {/* Bottom: Content Section */}
                    <div className="group-hover:border-brand-blue z-30 -mt-7 w-full space-y-3 rounded-lg border-2 bg-white p-6 transition-colors duration-1500 ease-in-out md:p-8">
                      <h3 className="font-heading group-hover:text-brand-blue mt-6 text-2xl leading-[0.85] text-zinc-900 uppercase transition-colors md:text-3xl lg:text-4xl">
                        {project.title}
                      </h3>

                      <p className="line-clamp-2 text-sm leading-relaxed font-medium text-gray-500">
                        {project.description}
                      </p>

                      <div className="flex items-center justify-between pt-4">
                        <div className="group-hover:bg-brand-blue h-[2px] w-12 bg-zinc-100 transition-all group-hover:w-24" />
                        <div className="group-hover:text-brand-blue flex items-center gap-3 text-[9px] font-black tracking-[0.4em] text-zinc-900 transition-colors">
                          EXPLORE <Icons.ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
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
