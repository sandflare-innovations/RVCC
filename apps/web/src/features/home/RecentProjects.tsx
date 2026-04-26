"use client";

import Image from "next/image";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";

const PROJECTS = [
  {
    title: "Alexander City, New York",
    image: "/images/home-hero.png",
    description:
      "A stunning residential complex blending modern aesthetics with sustainable design principles.",
  },
  {
    title: "Lake Havasu City, Washington",
    image: "/images/home-hero.png",
    description:
      "An innovative commercial space featuring open layouts and natural lighting to boost productivity.",
  },
  {
    title: "North Little Rock, California",
    image: "/images/home-hero.png",
    description:
      "A contemporary urban development creating harmonious living spaces within a bustling city.",
  },
];

const ProjectMask = () => (
  <svg width="0" height="0" className="absolute">
    <defs>
      <clipPath id="project-mask" clipPathUnits="objectBoundingBox">
        <path
          d="
            M 0 0 
            L 0.15 0 
            C 0.2 0, 0.22 0.03, 0.28 0.03 
            L 0.72 0.03 
            C 0.78 0.03, 0.8 0, 0.85 0 
            L 1 0 
            L 1 1 
            L 0.85 1 
            C 0.8 1, 0.78 0.97, 0.72 0.97 
            L 0.28 0.97 
            C 0.22 0.97, 0.2 1, 0.15 1 
            L 0 1 
            Z
          "
        />
      </clipPath>
    </defs>
  </svg>
);

export const RecentProjects = () => {
  return (
    <section className="bg-background relative w-full px-8 py-24 md:px-16 lg:px-24">
      <ProjectMask />

      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-20 flex flex-col items-start justify-between gap-8 md:flex-row md:items-start">
          <div className="flex-1">
            <h2 className="text-brand-blue flex flex-col text-[4rem] leading-[0.6] tracking-tighter md:text-[5.5rem]">
              <span className="font-medium">
                Recent <br /> Projects
              </span>
            </h2>
          </div>

          <div className="max-w-sm flex-1 pt-4">
            <p className="text-sm leading-relaxed font-medium text-gray-700">
              After completing your year 12 education and earning the necessary scores, you may
              apply for a bachelor&apos;s degree in architecture. To qualify, students can complete
              one of three entrance exams:
            </p>
          </div>

          <div className="flex flex-1 justify-end pt-4">
            <Button href="#contact" className="bg-brand-blue h-12 w-[180px]">
              View All
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {PROJECTS.map((project, index) => (
            <div key={index} className="flex flex-col gap-5">
              <div
                className="relative aspect-[3.5/4] w-full overflow-hidden rounded-2xl bg-gray-100"
                style={{ clipPath: "url(#project-mask)" }}
              >
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
                <motion.div
                  initial={{ height: "100%" }}
                  whileInView={{ height: "0%" }}
                  viewport={{ once: false }}
                  transition={{ duration: 0.8, ease: "easeInOut", delay: index * 0.2 }}
                  className="absolute bottom-0 left-0 z-10 w-full bg-white"
                />
              </div>
              <div className="flex flex-col gap-2 px-1">
                <div className="font-heading text-brand-blue flex items-center gap-3 text-3xl font-semibold tracking-wide">
                  <span>{project.title}</span>
                </div>
                <p className="text-md leading-relaxed text-gray-600">{project.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
