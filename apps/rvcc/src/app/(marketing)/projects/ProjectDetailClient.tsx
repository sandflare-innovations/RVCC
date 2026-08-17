"use client";

import Image from "next/image";
import Link from "next/link";

import { motion } from "framer-motion";

import { Icons } from "@/lib/ui";

import { DetailedProject } from "@/data/projects/detailed";
import { cn } from "@/lib/utils";

interface ProjectDetailClientProps {
  project: DetailedProject;
}

export const ProjectDetailClient: React.FC<ProjectDetailClientProps> = ({ project }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Cinematic Hero */}
      <section className="relative h-screen min-h-[700px] w-full overflow-hidden bg-black">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src={project.image}
            alt={project.title}
            fill
            priority
            className="object-cover opacity-60 grayscale-[20%]"
          />
          <div className="absolute inset-0 bg-black/30 md:bg-black/10" />
        </motion.div>

        <div className="relative z-10 container mx-auto flex h-full flex-col justify-center px-6 pt-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
          >
            <div className="mb-8 flex items-center space-x-4">
              <div className="bg-brand-blue h-[2px] w-12" />
              <span className="text-brand-blue text-[12px] font-bold tracking-[0.5em] uppercase">
                {project.category}
              </span>
            </div>

            <h1 className="font-heading mb-10 text-6xl font-normal tracking-tighter text-white uppercase md:text-8xl lg:text-[10rem] lg:leading-[0.8em]">
              {project.title.split(" ").map((word, i) => (
                <span key={i} className={i % 2 === 1 ? "opacity-90" : ""}>
                  {word} {i === 0 && project.title.split(" ").length > 1 && <br />}
                </span>
              ))}
            </h1>

            <Link
              href="/projects"
              className="group inline-flex items-center space-x-4 text-[10px] font-bold tracking-[0.4em] text-white/50 uppercase transition-colors hover:text-white"
            >
              <Icons.ArrowRight className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-2" />
              <span>Back to all projects</span>
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-12 hidden md:block">
          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-bold tracking-[0.5em] text-white/30 uppercase">
              EXPLORE
            </span>
            <div className="h-px w-24 bg-white/20" />
          </div>
        </div>
      </section>

      {/* Architectural Stats Bar */}
      <section className="relative z-20 -mt-24 pb-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border-border grid grid-cols-2 gap-1 border bg-white shadow-2xl lg:grid-cols-4"
          >
            {[
              { label: "Location", value: project.location },
              { label: "Client", value: project.client },
              { label: "Year", value: project.year },
              { label: "Status", value: project.status, isStatus: true },
            ].map((stat, i) => (
              <div
                key={i}
                className="border-border p-10 transition-colors last:border-0 hover:bg-zinc-50 lg:border-r"
              >
                <span className="mb-4 block text-[10px] font-bold tracking-[0.4em] text-zinc-400 uppercase">
                  {stat.label}
                </span>
                <p
                  className={cn(
                    "text-xl font-bold tracking-tight uppercase",
                    stat.isStatus ? "text-brand-blue" : "text-zinc-900"
                  )}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Project Content */}
      <section className="section-padding pt-0">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 gap-20 lg:grid-cols-12">
            {/* Description & Gallery */}
            <div className="lg:col-span-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-20"
              >
                <h2 className="font-heading mb-10 text-4xl leading-tight uppercase md:text-5xl lg:text-6xl">
                  Design <br />
                  <span className="text-brand-blue">Philosophy</span>
                </h2>
                <p className="text-xl leading-relaxed font-light text-zinc-600 lg:text-2xl">
                  {project.description}
                </p>
              </motion.div>

              {/* Asymmetrical Gallery */}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {project.gallery.slice(1).map((img, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                    className={cn(
                      "relative overflow-hidden bg-zinc-100",
                      idx % 3 === 0 ? "aspect-[16/10] md:col-span-2" : "aspect-[4/5]"
                    )}
                  >
                    <Image
                      src={img}
                      alt={`${project.title} detailed view`}
                      fill
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Scope & CTA */}
            <div className="lg:col-span-4">
              <div className="sticky top-32 space-y-20">
                {/* Scope */}
                <div>
                  <div className="mb-10 flex items-center space-x-3">
                    <div className="bg-brand-blue h-1.5 w-1.5" />
                    <span className="text-brand-blue text-[10px] font-bold tracking-[0.5em] uppercase">
                      Scope of Work
                    </span>
                  </div>
                  <ul className="space-y-6">
                    {project.scope.map((item, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="group flex items-start"
                      >
                        <span className="text-brand-blue/30 group-hover:text-brand-blue mr-6 text-[10px] font-bold transition-colors">
                          0{idx + 1}
                        </span>
                        <span className="w-full border-b border-zinc-100 pb-2 text-lg font-medium tracking-wide text-zinc-800 uppercase">
                          {item}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Contact CTA */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="relative overflow-hidden bg-zinc-900 p-12 text-white"
                >
                  <div className="relative z-10">
                    <h3 className="font-heading mb-6 text-3xl leading-tight uppercase">
                      Start your <br />
                      own project
                    </h3>
                    <p className="mb-10 text-sm leading-relaxed font-light text-white/60">
                      Leverage our architectural expertise to transform your vision into a landmark
                      reality.
                    </p>
                    <Link href="/#contact" className="group flex items-center space-x-6">
                      <div className="bg-brand-blue flex h-14 w-14 items-center justify-center text-white transition-transform group-hover:scale-110">
                        <Icons.ArrowRight className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-bold tracking-[0.4em] uppercase">
                        Get in touch
                      </span>
                    </Link>
                  </div>
                  {/* Decorative background logo */}
                  <div className="pointer-events-none absolute -right-10 -bottom-10 h-48 w-48 opacity-5 grayscale invert">
                    <Image src="/images/logo/logo.webp" alt="" fill className="object-contain" />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
