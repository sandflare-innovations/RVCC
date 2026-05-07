"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { PROJECTS } from "@/data/projects/detailed";
import { cn } from "@lib/utils";
import { Icons } from "@repo/ui";

export const ProjectList = () => {
  return (
    <section className="bg-background py-24">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {PROJECTS.map((project, index) => (
            <Link 
              key={project.id} 
              href={`/projects/${project.slug}`}
              className="group block"
            >
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="relative overflow-hidden"
              >
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
                    <div className="h-16 w-16 rounded-full bg-brand-blue flex items-center justify-center text-white scale-0 transition-transform duration-500 group-hover:scale-100">
                      <Icons.ArrowRight className="h-6 w-6" />
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
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
