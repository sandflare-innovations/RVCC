"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import { motion } from "framer-motion";
import { Icons } from "@repo/ui";

import { Button } from "@/components/ui/Button";
import { cn } from "@lib/utils";

const PROJECTS = [
  {
    title: "Luxury Skyline",
    location: "Berlin, Germany",
    year: "2025",
    category: "RESIDENTIAL",
    type: "SINGLE HOME",
    image: "/images/home-hero.png",
  },
  {
    title: "Bohemian Rhapsody",
    location: "Berlin, Germany",
    year: "2025",
    category: "RESIDENTIAL",
    type: "SINGLE HOME",
    image: "/images/hero-bg.png",
  },
  {
    title: "Vintage Glamour",
    location: "Berlin, Germany",
    year: "2025",
    category: "RESIDENTIAL",
    type: "SINGLE HOME",
    image: "/images/home-hero.png",
  },
  {
    title: "Modern Sanctuary",
    location: "Berlin, Germany",
    year: "2025",
    category: "RESIDENTIAL",
    type: "SINGLE HOME",
    image: "/images/hero-bg.png",
  },
  {
    title: "Urban Oasis",
    location: "London, UK",
    year: "2024",
    category: "COMMERCIAL",
    type: "OFFICE",
    image: "/images/home-hero.png",
  },
  {
    title: "Nordic Minimal",
    location: "Oslo, Norway",
    year: "2024",
    category: "RESIDENTIAL",
    type: "APARTMENT",
    image: "/images/hero-bg.png",
  },
];

export const RecentProjects = () => {
  // 5x projects for a truly seamless loop
  const INFINITE_PROJECTS = [...PROJECTS, ...PROJECTS, ...PROJECTS, ...PROJECTS, ...PROJECTS];
  const middleIndex = PROJECTS.length * 2;
  const [startIndex, setStartIndex] = useState(middleIndex);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const nextSlide = () => {
    setIsTransitioning(true);
    setStartIndex((prev) => prev + 1);
  };

  const prevSlide = () => {
    setIsTransitioning(true);
    setStartIndex((prev) => prev - 1);
  };

  // Seamless jump logic
  useEffect(() => {
    const handleLoop = () => {
      if (startIndex >= PROJECTS.length * 3) {
        setIsTransitioning(false);
        setStartIndex(PROJECTS.length * 2);
      } else if (startIndex <= PROJECTS.length) {
        setIsTransitioning(false);
        setStartIndex(PROJECTS.length * 2);
      }
    };

    const timer = setTimeout(handleLoop, 800); // Match transition duration
    return () => clearTimeout(timer);
  }, [startIndex]);

  return (
    <section className="bg-background relative w-full px-8 py-24 md:px-16 lg:px-24" id="projects">
      <div className="mx-auto max-w-[100rem]">
        {/* Header Section */}
        <div className="mb-20 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="flex-1">
            <h2 className="text-brand-blue flex flex-col text-[4rem] leading-[0.8] font-bold tracking-tighter md:text-[6rem]">
              <span>RECENT</span>
              <span>PROJECTS</span>
            </h2>
          </div>
          <Button href="#contact" variant="outline" className="hidden h-14 w-[180px] border-brand-blue text-brand-blue md:inline-flex">
            VIEW ALL
          </Button>
        </div>

        {/* Projects Slider Container */}
        <div className="group relative min-h-[650px] md:min-h-[750px]">
          {/* Side Navigation Buttons - Centered on Image Area (Top 35%) */}
          <button
            onClick={prevSlide}
            className="absolute -left-6 top-[35%] z-50 flex h-16 w-16 -translate-y-1/2 items-center justify-center bg-white/10 text-brand-blue backdrop-blur-xl transition-all hover:bg-brand-blue hover:text-white md:-left-12"
          >
            <Icons.ChevronRight className="h-8 w-8 rotate-180" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute -right-6 top-[35%] z-50 flex h-16 w-16 -translate-y-1/2 items-center justify-center bg-white/10 text-brand-blue backdrop-blur-xl transition-all hover:bg-brand-blue hover:text-white md:-right-12"
          >
            <Icons.ChevronRight className="h-8 w-8" />
          </button>

          <div className="overflow-hidden px-1">
            <motion.div
              className="flex"
              animate={{ x: `-${startIndex * 25}%` }}
              transition={{
                duration: isTransitioning ? 0.8 : 0,
                ease: [0.19, 1, 0.22, 1]
              }}
            >
              {INFINITE_PROJECTS.map((project, index) => {
                const isEven = (index - startIndex) % 2 === 0;

                return (
                  <motion.div
                    key={index}
                    layout
                    initial={{ paddingTop: 0 }}
                    whileInView={{ paddingTop: isEven ? 48 : 0 }}
                    viewport={{ once: false }}
                    transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
                    className="group w-1/4 flex-shrink-0 flex flex-col gap-6"
                  >
                    {/* Internal Wrapper for Padding/Gaps */}
                    <div className="px-2">
                      {/* Image Container */}
                      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100">
                        <Image
                          src={project.image}
                          alt={project.title}
                          fill
                          className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                        />

                        <div className="absolute top-4 left-4 z-20 flex gap-2">
                          <span className="bg-white/20 px-3 py-1 text-[8px] font-bold tracking-widest text-white backdrop-blur-md uppercase">
                            {project.category}
                          </span>
                          <span className="bg-white/20 px-3 py-1 text-[8px] font-bold tracking-widest text-white backdrop-blur-md uppercase">
                            {project.type}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      </div>

                      <div className="mt-6 flex flex-col space-y-1">
                        <h3 className="text-brand-blue text-xl font-bold tracking-tight uppercase">
                          {project.title}
                        </h3>
                        <div className="flex flex-col text-[10px] font-medium tracking-widest text-brand-blue/50 uppercase">
                          <span>{project.location}</span>
                          <span>{project.year}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
