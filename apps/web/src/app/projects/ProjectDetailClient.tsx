"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { DetailedProject } from "@/data/projects/detailed";
import { cn } from "@lib/utils";
import { Icons } from "@repo/ui";

interface ProjectDetailClientProps {
  project: DetailedProject;
}

export const ProjectDetailClient: React.FC<ProjectDetailClientProps> = ({ project }) => {
  return (
    <main className="bg-background min-h-screen">
      {/* Detail Hero */}
      <section className="relative h-[70vh] w-full overflow-hidden">
        <Image
          src={project.image}
          alt={project.title}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="container relative z-10 mx-auto flex h-full items-end pb-24 px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link 
              href="/projects"
              className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-blue hover:text-white transition-colors"
            >
              <Icons.ArrowRight className="h-4 w-4 rotate-180" /> 
              Back to Projects
            </Link>
            <span className="mb-4 block text-xs font-bold uppercase tracking-[0.4em] text-brand-blue">
              {project.category}
            </span>
            <h1 className="text-5xl font-bold leading-tight tracking-tighter text-white md:text-7xl lg:text-8xl uppercase font-primary">
              {project.title}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Project Info Bar */}
      <section className="border-b border-foreground/10 bg-white dark:bg-white/5 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                Location
              </span>
              <p className="font-bold text-foreground">{project.location}</p>
            </div>
            <div>
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                Client
              </span>
              <p className="font-bold text-foreground">{project.client}</p>
            </div>
            <div>
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                Year
              </span>
              <p className="font-bold text-foreground">{project.year}</p>
            </div>
            <div>
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                Status
              </span>
              <p className="font-bold text-brand-blue">{project.status}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Project Content */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-24">
            {/* Description */}
            <div className="lg:col-span-2">
              <h2 className="mb-8 text-4xl font-bold tracking-tighter uppercase font-primary">
                About the Project
              </h2>
              <p className="text-xl leading-relaxed text-foreground/70">
                {project.description}
              </p>
              
              <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12">
                {project.gallery.slice(1).map((img, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative aspect-video overflow-hidden bg-muted"
                  >
                    <Image
                      src={img}
                      alt={`${project.title} detail ${idx}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 40vw"
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Scope of Work */}
            <div>
              <h2 className="mb-8 text-2xl font-bold tracking-tighter uppercase font-primary">
                Scope of Work
              </h2>
              <ul className="space-y-4">
                {project.scope.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-blue" />
                    <span className="text-lg font-medium text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-16 bg-brand-blue/5 p-8 border-l-4 border-brand-blue">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-brand-blue">
                  Interested in similar work?
                </h3>
                <p className="mb-6 text-sm text-foreground/60 leading-relaxed">
                  Our experts are ready to bring your architectural vision to life with precision and excellence.
                </p>
                <Link 
                  href="/#contact"
                  className="inline-block bg-brand-blue px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-transform hover:scale-105"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
