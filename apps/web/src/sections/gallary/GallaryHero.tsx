"use client";

import { useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";

import { GALLARY_PROJECTS, GallaryProject } from "@/data/gallary";

import { cn } from "@lib/utils";

export const GallaryHero = () => {
  const [activeProject, setActiveProject] = useState<GallaryProject>(GALLARY_PROJECTS[0]);

  const router = useRouter();

  return (
    <section className="bg-background relative min-h-screen w-full overflow-hidden pt-32 pb-20">
      <div className="container mx-auto h-full px-6">
        <div className="grid h-full grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* Content & Main Image Display */}
          <div className="relative flex h-full flex-col justify-center lg:col-span-8">
            <div className="z-10 mb-8 max-w-2xl">
              <motion.span
                key={`loc-${activeProject.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-brand-blue mb-4 block text-xs font-bold tracking-[0.3em] uppercase"
              >
                Featured Project
              </motion.span>
              <motion.h1
                key={`title-${activeProject.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-foreground mb-6 text-5xl leading-tight font-bold md:text-7xl"
              >
                {activeProject.title}
              </motion.h1>
              <motion.p
                key={`desc-${activeProject.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-foreground/70 text-lg leading-relaxed md:text-xl"
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
          <div className="flex flex-col justify-center lg:col-span-4">
            <div className="space-y-4">
              <h3 className="text-foreground/40 mb-6 text-[10px] font-bold tracking-widest uppercase">
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
                        ? "ring-brand-blue ring-offset-background ring-2 ring-offset-4"
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
                    <div className="bg-brand-blue/20 absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="absolute right-2 bottom-2 left-2 translate-y-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                      <span className="bg-brand-blue px-2 py-1 text-[8px] font-black text-white uppercase">
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
      <div className="bg-brand-blue/5 absolute top-1/4 -right-20 -z-10 h-96 w-96 rounded-full blur-[100px]" />
      <div className="bg-brand-blue/10 absolute bottom-1/4 -left-20 -z-10 h-96 w-96 rounded-full blur-[100px]" />
    </section>
  );
};
