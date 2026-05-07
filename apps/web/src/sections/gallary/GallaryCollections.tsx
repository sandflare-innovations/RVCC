"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { AnimatePresence, motion } from "framer-motion";

import { Icons } from "@repo/ui";

import { GALLARY_PROJECTS, GallaryProject } from "@/data/gallary";

export const GallaryCollections = () => {
  const [selectedProject, setSelectedProject] = useState<GallaryProject | null>(null);

  return (
    <section className="bg-background py-24">
      <div className="container mx-auto px-6">
        <div className="mb-16">
          <h2 className="text-foreground mb-4 text-4xl font-bold md:text-5xl">
            Project Collections
          </h2>
          <div className="bg-brand-blue h-1 w-20" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {GALLARY_PROJECTS.map((project, index) => (
            <Link
              key={project.id}
              href={`/gallary/${project.slug}`}
              className="group block cursor-pointer"
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="hover:border-brand-blue/20 border border-transparent bg-white p-4 shadow-sm transition-all duration-500 group-hover:shadow-2xl dark:bg-white/5"
              >
                {/* Image Container Stack */}
                <div className="mb-6 space-y-2">
                  {/* Main Large Image */}
                  <div className="bg-muted relative aspect-[5/3] overflow-hidden">
                    <Image
                      src={project.thumbnail}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      quality={80}
                    />
                  </div>

                  {/* Three Sub-Images Row */}
                  <div className="grid grid-cols-3 gap-2">
                    {project.images.slice(0, 3).map((img, i) => (
                      <div key={i} className="bg-muted relative aspect-square overflow-hidden">
                        <Image
                          src={img}
                          alt={`${project.title} preview ${i}`}
                          fill
                          className="object-cover transition-opacity duration-500 group-hover:opacity-90"
                          sizes="10vw"
                          quality={50}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="border-foreground/5 flex items-center justify-between border-t pt-2">
                  <h3 className="text-black group-hover:text-brand-blue font-primary text-lg font-bold tracking-tighter uppercase transition-colors duration-300">
                    {project.title}
                  </h3>
                  <div className="text-foreground/40 group-hover:text-brand-blue flex items-center gap-2 transition-colors">
                    <Icons.Gallery className="h-4 w-4" />
                    <span className="font-primary text-xs font-bold">{project.images.length}</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
