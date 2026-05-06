"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GALLARY_PROJECTS, GallaryProject } from "@/data/gallary";
import { cn } from "@lib/utils";

export const GallaryHero = () => {
  const [activeProject, setActiveProject] = useState<GallaryProject>(GALLARY_PROJECTS[0]);

  const router = useRouter();

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background pt-32 pb-20">
      <div className="container mx-auto px-6 h-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 h-full items-center">
          
          {/* Content & Main Image Display */}
          <div className="lg:col-span-8 flex flex-col justify-center h-full relative">
            <div className="z-10 mb-8 max-w-2xl">
              <motion.span
                key={`loc-${activeProject.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-brand-blue font-bold tracking-[0.3em] uppercase text-xs mb-4 block"
              >
                Featured Project
              </motion.span>
              <motion.h1
                key={`title-${activeProject.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight"
              >
                {activeProject.title}
              </motion.h1>
              <motion.p
                key={`desc-${activeProject.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-foreground/70 text-lg md:text-xl leading-relaxed"
              >
                {activeProject.description}
              </motion.p>
            </div>

            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-none shadow-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeProject.id}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.8, ease: "circOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={activeProject.thumbnail}
                    alt={activeProject.title}
                    fill
                    className="object-cover"
                    priority
                    quality={85}
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Project Selection Grid */}
          <div className="lg:col-span-4 flex flex-col justify-center">
            <div className="space-y-4">
              <h3 className="text-foreground/40 font-bold tracking-widest uppercase text-[10px] mb-6">
                Explore Collections
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {GALLARY_PROJECTS.map((project) => (
                  <motion.button
                    key={project.id}
                    onHoverStart={() => setActiveProject(project)}
                    onClick={() => router.push(`/gallary/${project.slug}`)}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-none transition-all duration-500",
                      activeProject.id === project.id 
                        ? "ring-2 ring-brand-blue ring-offset-4 ring-offset-background" 
                        : "opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                    )}
                  >
                    <Image
                      src={project.thumbnail}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 1024px) 25vw, 10vw"
                      quality={60}
                    />
                    <div className="absolute inset-0 bg-brand-blue/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 left-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                        <span className="text-[8px] font-black uppercase text-white bg-brand-blue px-2 py-1">
                            {project.title}
                        </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-brand-blue/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-brand-blue/10 rounded-full blur-[100px] -z-10" />
    </section>
  );
};
