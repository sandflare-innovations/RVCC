"use client";

import { useRef } from "react";

import Image from "next/image";

import { MAJOR_PROJECTS as PROJECTS } from "@data/projects/major";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

import { Button } from "@/components/ui/Button";

export const MajorProject = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // RAW scrollYProgress for 1:1 movement

  // Phase 0: Arrival (Starts from closer to the top to reduce initial gap)
  const cardsY = useTransform(scrollYProgress, [0, 0.1], ["30vh", "0vh"]);

  // Phase 1: Expansion (Grows to FULL 100vh)
  const p1Width = useTransform(scrollYProgress, [0.15, 0.35], ["33.33vw", "100vw"]);
  const p1Height = useTransform(scrollYProgress, [0.15, 0.35], ["80vh", "100vh"]);
  const leftX = useTransform(scrollYProgress, [0.15, 0.35], ["0vw", "-50vw"]);
  const rightX = useTransform(scrollYProgress, [0.15, 0.35], ["0vw", "50vw"]);

  // Phase 2 & 3: Stacking (Full 100vh cards)
  const p2Y = useTransform(scrollYProgress, [0.45, 0.65], ["100vh", "0vh"]);
  const p3Y = useTransform(scrollYProgress, [0.75, 0.95], ["100vh", "0vh"]);

  // Spring for text reveals
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 150, damping: 30 });
  const p1ContentOpacity = useTransform(smoothProgress, [0.35, 0.45], [0, 1]);
  const p1ContentY = useTransform(smoothProgress, [0.35, 0.45], [30, 0]);
  const p2ContentOpacity = useTransform(smoothProgress, [0.6, 0.7], [0, 1]);
  const p3ContentOpacity = useTransform(smoothProgress, [0.9, 1], [0, 1]);

  return (
    <div className="bg-background">
      {/* 1. Header Section - Tightened up to reduce gap */}
      <section className="container mx-auto px-4 md:px-8">
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

      {/* 2. Unified Animation Frame - Takes 100vh for full-screen imagery */}
      <section id="works" ref={containerRef} className="relative -mt-40 h-[600vh]">
        <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
          <motion.div
            style={{ y: cardsY }}
            className="relative flex h-full w-full items-center justify-center"
          >
            {/* Grid Side Card (Project 02) */}
            <motion.div
              style={{ x: leftX }}
              className="absolute left-0 z-20 h-[80vh] w-[33.33vw] px-2"
            >
              <div className="relative h-full w-full overflow-hidden">
                <Image
                  src={PROJECTS[1].image}
                  alt="Grid Left"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute bottom-8 left-8 text-white">
                  <h3 className="text-2xl font-light">{PROJECTS[1].title}</h3>
                </div>
              </div>
            </motion.div>

            {/* PROJECT 01 - Expands to 100vh */}
            <motion.div
              style={{ width: p1Width, height: p1Height, zIndex: 10 }}
              className="relative flex items-center justify-center overflow-hidden bg-black"
            >
              <Image
                src={PROJECTS[0].image}
                alt={PROJECTS[0].title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1200px) 100vw, 90vw"
              />
              <motion.div
                style={{ opacity: p1ContentOpacity }}
                className="absolute inset-0 z-30 bg-black/10"
              />

              <div className="relative z-40 container mx-auto px-4 md:px-8">
                <motion.div
                  style={{ opacity: p1ContentOpacity, y: p1ContentY }}
                  className="max-w-4xl text-left"
                >
                  <span className="text-brand-blue mb-4 block text-[10px] font-black tracking-widest uppercase">
                    Project 01
                  </span>
                  <h3 className="font-primary mb-10 text-[3.5rem] leading-[0.75] font-normal tracking-tighter text-white uppercase md:text-[5.5rem] lg:text-[7rem]">
                    {PROJECTS[0].title.split(" ").map((word, i) => (
                      <span key={i} className="block">
                        {word}
                      </span>
                    ))}
                  </h3>
                  <p className="mb-12 max-w-md text-lg font-light text-zinc-300 md:text-xl">
                    {PROJECTS[0].description}
                  </p>
                  <div className="flex flex-col gap-6 sm:flex-row">
                    <Button
                      borderColor="border-white"
                      textColor="text-brand-blue"
                      bgColor="bg-white"
                      hoverFillColor="bg-brand-blue"
                      hoverTextColor="group-hover:text-background"
                      className="h-16 rounded-none px-10"
                    >
                      Explore Work
                    </Button>
                    <Button
                      borderColor="border-white"
                      textColor="text-white"
                      bgColor="bg-transparent"
                      hoverFillColor="bg-white"
                      hoverTextColor="group-hover:text-brand-blue"
                      className="h-16 rounded-none px-10"
                    >
                      View Portfolio
                    </Button>
                  </div>
                </motion.div>
              </div>

              <motion.div
                style={{ opacity: useTransform(scrollYProgress, [0.25, 0.35], [1, 0]) }}
                className="absolute bottom-8 left-8 z-20 text-white"
              >
                <h3 className="text-2xl font-light">{PROJECTS[0].title}</h3>
              </motion.div>
            </motion.div>

            {/* Grid Side Card (Project 03) */}
            <motion.div
              style={{ x: rightX }}
              className="absolute right-0 z-20 h-[80vh] w-[33.33vw] px-2"
            >
              <div className="relative h-full w-full overflow-hidden">
                <Image
                  src={PROJECTS[2].image}
                  alt="Grid Right"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute bottom-8 left-8 text-white">
                  <h3 className="text-2xl font-light">{PROJECTS[2].title}</h3>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Stacking Layers (Full 100vh) */}
          <motion.div
            style={{ y: p2Y, zIndex: 50 }}
            className="absolute inset-0 flex h-screen w-full items-center justify-center overflow-hidden border-t border-white/5 bg-black"
          >
            <Image
              src={PROJECTS[1].image}
              alt={PROJECTS[1].title}
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 z-10 bg-black/10" />
            <div className="relative z-20 container mx-auto px-4 md:px-8">
              <motion.div style={{ opacity: p2ContentOpacity }} className="max-w-4xl text-left">
                <span className="text-brand-blue mb-4 block text-[10px] font-black tracking-widest uppercase">
                  Project 02
                </span>
                <h3 className="font-primary mb-10 text-[3.5rem] leading-[0.75] font-normal tracking-tighter text-white uppercase md:text-[5.5rem] lg:text-[7rem]">
                  {PROJECTS[1].title.split(" ").map((word, i) => (
                    <span key={i} className="block">
                      {word}
                    </span>
                  ))}
                </h3>
                <p className="mb-12 max-w-md text-lg font-light text-zinc-300 md:text-xl">
                  {PROJECTS[1].description}
                </p>
                <div className="flex flex-col gap-6 sm:flex-row">
                  <Button
                    borderColor="border-white"
                    textColor="text-brand-blue"
                    bgColor="bg-white"
                    hoverFillColor="bg-brand-blue"
                    hoverTextColor="group-hover:text-background"
                    className="h-16 rounded-none px-10"
                  >
                    Explore Work
                  </Button>
                  <Button
                    borderColor="border-white"
                    textColor="text-white"
                    bgColor="bg-transparent"
                    hoverFillColor="bg-white"
                    hoverTextColor="group-hover:text-brand-blue"
                    className="h-16 rounded-none px-10"
                  >
                    View Portfolio
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            style={{ y: p3Y, zIndex: 60 }}
            className="absolute inset-0 flex h-screen w-full items-center justify-center overflow-hidden border-t border-white/5 bg-black"
          >
            <Image
              src={PROJECTS[2].image}
              alt={PROJECTS[2].title}
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 z-10 bg-black/10" />
            <div className="relative z-20 container mx-auto px-4 md:px-8">
              <motion.div style={{ opacity: p3ContentOpacity }} className="max-w-4xl text-left">
                <span className="text-brand-blue mb-4 block text-[10px] font-black tracking-widest uppercase">
                  Project 03
                </span>
                <h3 className="font-primary mb-10 text-[3.5rem] leading-[0.75] font-normal tracking-tighter text-white uppercase md:text-[5.5rem] lg:text-[7rem]">
                  {PROJECTS[2].title.split(" ").map((word, i) => (
                    <span key={i} className="block">
                      {word}
                    </span>
                  ))}
                </h3>
                <p className="mb-12 max-w-md text-lg font-light text-zinc-300 md:text-xl">
                  {PROJECTS[2].description}
                </p>
                <div className="flex flex-col gap-6 sm:flex-row">
                  <Button
                    borderColor="border-white"
                    textColor="text-brand-blue"
                    bgColor="bg-white"
                    hoverFillColor="bg-brand-blue"
                    hoverTextColor="group-hover:text-background"
                    className="h-16 rounded-none px-10"
                  >
                    Explore Work
                  </Button>
                  <Button
                    borderColor="border-white"
                    textColor="text-white"
                    bgColor="bg-transparent"
                    hoverFillColor="bg-white"
                    hoverTextColor="group-hover:text-brand-blue"
                    className="h-16 rounded-none px-10"
                  >
                    View Portfolio
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
