"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GALLARY_PROJECTS, GallaryProject } from "@/data/gallary";
import { Icons } from "@repo/ui";

export const GallaryCollections = () => {
  const [selectedProject, setSelectedProject] = useState<GallaryProject | null>(null);

  return (
    <section className="bg-background py-24">
      <div className="container mx-auto px-6">
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Project Collections</h2>
          <div className="h-1 w-20 bg-brand-blue" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLARY_PROJECTS.map((project, index) => (
            <Link
              key={project.id}
              href={`/gallary/${project.slug}`}
              className="group cursor-pointer block"
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-white/5 p-4 shadow-sm group-hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-brand-blue/20"
              >
                {/* Image Container Stack */}
                <div className="space-y-2 mb-6">
                  {/* Main Large Image */}
                  <div className="relative aspect-[5/3] overflow-hidden bg-muted">
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
                      <div key={i} className="relative aspect-square overflow-hidden bg-muted">
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
                <div className="flex items-center justify-between pt-2 border-t border-foreground/5">
                  <h3 className="text-3xl font-bold text-brand-blue transition-colors uppercase">
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-2 text-foreground/40 group-hover:text-brand-blue transition-colors">
                    <Icons.Gallery className="w-4 h-4" />
                    <span className="text-xs font-bold font-primary">{project.images.length}</span>
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
