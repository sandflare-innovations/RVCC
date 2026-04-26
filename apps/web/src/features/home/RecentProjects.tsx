"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@ui/Button";

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

export const RecentProjects = () => {
  return (
    <section className="bg-background relative w-full px-8 py-24 md:px-16 lg:px-24" id="projects">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-20 flex flex-col items-start justify-between gap-8 md:flex-row">
          <div className="flex-1">
            <h2 className="text-brand-blue text-5xl font-bold uppercase tracking-[0.4em] md:text-7xl">
              Recent <br /> Projects
            </h2>
          </div>

          <div className="max-w-sm flex-1 pt-4">
            <p className="text-xs font-medium leading-relaxed tracking-wider text-gray-700 uppercase">
              Showcasing our latest achievements in architectural excellence and 
              precision construction across global landscapes.
            </p>
          </div>

          <div className="flex flex-1 justify-end pt-4">
            <Button variant="outline" href="#projects">
              View All
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {PROJECTS.map((project, index) => (
            <div key={index} className="group flex flex-col gap-8">
              <div className="cursor-image-trigger relative aspect-[3.5/4] w-full overflow-hidden bg-gray-100">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <motion.div
                  initial={{ height: "100%" }}
                  whileInView={{ height: "0%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeInOut", delay: index * 0.2 }}
                  className="absolute bottom-0 left-0 z-10 w-full bg-white"
                />
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-[1px] w-8 bg-brand-blue" />
                  <span className="text-[10px] font-bold tracking-[0.3em] text-brand-blue uppercase">0{index + 1}</span>
                </div>
                <h3 className="text-xl font-bold uppercase tracking-[0.1em] text-black">
                  {project.title}
                </h3>
                <p className="text-sm leading-relaxed tracking-wide text-gray-600">
                  {project.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
