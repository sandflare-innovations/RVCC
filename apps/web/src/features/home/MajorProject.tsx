"use client";

import { useRef } from "react";

import Image from "next/image";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";

import { Button } from "@/components/ui/Button";

const PROJECTS = [
  {
    id: "01",
    title: "The Heritage Residences",
    location: "RIYADH, KSA",
    image: "/images/projects/major-left.png",
    description:
      "Ultra-luxury residential complex featuring traditional Najdi architectural elements.",
  },
  {
    id: "02",
    title: "KAFD Iconic Tower",
    location: "RIYADH, KSA",
    image: "/images/projects/major-center.png",
    description: "Setting new benchmarks for luxury and sustainability in commercial architecture.",
  },
  {
    id: "03",
    title: "The Prism Commercial Hub",
    location: "JEDDAH, KSA",
    image: "/images/projects/major-right.png",
    description: "A pinnacle of modern geometric design, redefining corporate environments.",
  },
];

export const MajorProject = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Cards logic - Expansion only
  const leftX = useTransform(smoothProgress, [0.1, 0.6], ["0%", "-120%"]);
  const rightX = useTransform(smoothProgress, [0.1, 0.6], ["0%", "120%"]);

  const centerWidth = useTransform(smoothProgress, [0.1, 0.6], ["33.33vw", "100vw"]);
  const centerHeight = useTransform(smoothProgress, [0.1, 0.6], ["60vh", "100vh"]);

  // Content Overlay Reveal
  const overlayOpacity = useTransform(smoothProgress, [0.6, 0.8], [0, 1]);
  const textY = useTransform(smoothProgress, [0.7, 0.9], [50, 0]);
  const textOpacity = useTransform(smoothProgress, [0.7, 0.9], [0, 1]);

  return (
    <div className="bg-background">
      {/* 1. Header Section - OUTSIDE the animation frame */}
      <section className="container mx-auto px-4 pt-32 pb-16 md:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-brand-blue font-primary pt-20 text-[5rem] leading-[0.8] font-normal tracking-tighter uppercase md:text-[8rem]"
        >
          Major
          <br /> Projects
        </motion.h2>
      </section>

      {/* 2. Sticky Animation Section - Takes Full Width/Height */}
      <section ref={containerRef} className="relative h-[250vh]">
        <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
          {/* Animation Wrapper */}
          <div className="relative flex h-full w-full items-center justify-center">
            {/* Left Card */}
            <motion.div
              style={{ x: leftX }}
              className="absolute left-0 z-10 h-[60vh] w-[33.33vw] px-2"
            >
              <div className="relative h-full w-full overflow-hidden">
                <Image
                  src={PROJECTS[0].image}
                  alt={PROJECTS[0].title}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-8 left-8 z-20 text-white">
                  <span className="text-[10px] font-black tracking-widest uppercase opacity-60">
                    {PROJECTS[0].location}
                  </span>
                  <h3 className="text-2xl font-light">{PROJECTS[0].title}</h3>
                </div>
                <div className="absolute inset-0 bg-black/20" />
              </div>
            </motion.div>

            {/* Center Card - GROWS to Full Screen */}
            <motion.div
              style={{
                width: centerWidth,
                height: centerHeight,
                zIndex: 30,
              }}
              className="relative overflow-hidden"
            >
              <Image
                src={PROJECTS[1].image}
                alt={PROJECTS[1].title}
                fill
                className="object-cover"
                priority
              />

              <motion.div
                style={{ opacity: overlayOpacity }}
                className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80"
              />

              <motion.div
                style={{ y: textY, opacity: textOpacity }}
                className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center md:p-24"
              >
                <span className="text-brand-blue mb-4 text-[10px] font-black tracking-[0.6em] uppercase">
                  Flagship Milestone
                </span>
                <h3 className="mb-8 text-4xl font-light tracking-tight text-white md:text-7xl">
                  {PROJECTS[1].title}
                </h3>
                <p className="mb-12 max-w-2xl text-lg leading-relaxed font-light text-zinc-300 md:text-2xl">
                  {PROJECTS[1].description}
                </p>
                <div className="flex flex-col gap-6 md:flex-row">
                  <Button variant="white" className="min-w-[240px] rounded-none">
                    EXPLORE CASE STUDY
                  </Button>
                  <Button
                    variant="brand-outline"
                    className="min-w-[240px] rounded-none border-white text-white hover:bg-white hover:text-black"
                  >
                    VIEW ALL WORKS
                  </Button>
                </div>
              </motion.div>

              {/* Static Card Info */}
              <motion.div
                style={{ opacity: useTransform(smoothProgress, [0, 0.2], [1, 0]) }}
                className="absolute bottom-8 left-8 z-20 text-white"
              >
                <span className="text-[10px] font-black tracking-widest uppercase opacity-60">
                  {PROJECTS[1].location}
                </span>
                <h3 className="text-2xl font-light">{PROJECTS[1].title}</h3>
              </motion.div>
            </motion.div>

            {/* Right Card */}
            <motion.div
              style={{ x: rightX }}
              className="absolute right-0 z-10 h-[60vh] w-[33.33vw] px-2"
            >
              <div className="relative h-full w-full overflow-hidden">
                <Image
                  src={PROJECTS[2].image}
                  alt={PROJECTS[2].title}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-8 left-8 z-20 text-white">
                  <span className="text-[10px] font-black tracking-widest uppercase opacity-60">
                    {PROJECTS[2].location}
                  </span>
                  <h3 className="text-2xl font-light">{PROJECTS[2].title}</h3>
                </div>
                <div className="absolute inset-0 bg-black/20" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};
