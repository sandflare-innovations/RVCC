"use client";

import React, { useRef, useState } from "react";

import Image from "next/image";

import {
  AnimatePresence,
  Variants,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

import { Button } from "@/components/ui/Button";

const works = [
  {
    id: 1,
    title1: "Civil",
    title2: "Construction",
    description:
      "RVCC is unconditionally dedicated to achieving excellence in the marketplace by understanding and exceeding customer expectations through integrity, commitment and ethical conduct.",
    image: "/images/home-hero.png",
    number: "01",
    cta: "View project",
    iconId: "civil",
  },
  {
    id: 2,
    title1: "Urban",
    title2: "Landscaping",
    description:
      "RVCC Landscaping has been giving life to public and private outdoor spaces by providing landscaping architecture, construction, and maintenance services.",
    image: "/images/home-hero.png",
    number: "02",
    cta: "View project",
    iconId: "landscaping",
  },
  {
    id: 3,
    title1: "Heavy",
    title2: "Earth Works",
    description:
      "RVCC undertakes different types of earth works. In the petroleum industry, RVCC works with ARAMCO in sand removal services and access-related operations.",
    image: "/images/home-hero.png",
    number: "03",
    cta: "View project",
    iconId: "earthworks",
  },
  {
    id: 4,
    title1: "Premier",
    title2: "Artificial Grass",
    description:
      "Considering the great advantages in artificial grass, RVCC offers alternative solutions to natural grass installation with a near accurate match and long-term durability.",
    image: "/images/home-hero.png",
    number: "04",
    cta: "View project",
    iconId: "grass",
  },
  {
    id: 5,
    title1: "Precision",
    title2: "Land Survey",
    description:
      "RVCC uses the latest technologies in survey and topography, including advanced global positioning systems (GPS) for accurate and efficient results.",
    image: "/images/home-hero.png",
    number: "05",
    cta: "View project",
    iconId: "survey",
  },
];

const imageVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    scale: 1.2,
  }),
  center: {
    x: 0,
    scale: 1.1,
    transition: {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-20%" : "20%",
    opacity: 0.5,
    transition: {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const contentVariants: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const OurWorks = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [[index, direction], setPage] = useState([0, 0]);

  // Mouse Parallax Logic
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const moveX = useTransform(smoothMouseX, [0, 1], ["-2%", "2%"]);
  const moveY = useTransform(smoothMouseY, [0, 1], ["-2%", "2%"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "start start"],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const containerWidth = useTransform(smoothProgress, [0, 0.8], ["70%", "100%"]);
  const radius = useTransform(smoothProgress, [0, 0.8], ["40px", "0px"]);

  const next = () => setPage([(index + 1) % works.length, 1]);
  const prev = () => setPage([(index - 1 + works.length) % works.length, -1]);

  return (
    <div className="bg-background relative flex w-full flex-col items-center overflow-visible">
      <motion.section
        id="works"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        style={{
          width: containerWidth,
          borderRadius: radius,
        }}
        className="relative z-20 mx-auto flex h-screen min-h-[700px] flex-col items-center overflow-hidden bg-black"
      >
        {/* Full Screen Background Image Slider with Parallax */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{
                x: moveX,
                y: moveY,
                scale: 1.1,
              }}
              className="absolute inset-0 -top-[5%] -left-[5%] h-[110%] w-[110%]"
            >
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/20 to-black/70" />
              <Image
                src={works[index].image}
                alt={works[index].title1}
                fill
                className="object-cover"
                priority
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Content Overlay */}
        <div className="relative z-20 flex h-full w-full flex-col justify-between p-8 md:p-16 lg:p-24">
          {/* Header Area */}
          <div className="flex w-full items-start justify-between">
            <div className="flex flex-col">
              <span className="mb-2 text-xs font-bold tracking-[0.4em] text-white/60 uppercase">
                Featured Portfolio
              </span>
              <h2 className="font-heading text-4xl leading-none text-white md:text-6xl lg:text-7xl">
                Our Works
              </h2>
            </div>

            <div className="hidden max-w-xs md:block">
              <p className="text-sm leading-relaxed font-light text-white/60">
                Building the future with sustainable engineering and unparalleled craftsmanship
                across the region.
              </p>
            </div>
          </div>

          {/* Center Content: Project Title & Big Number */}
          <div className="flex flex-col items-start md:flex-row md:items-end md:gap-12">
            <div className="relative flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  variants={contentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h3 className="font-heading text-5xl leading-[0.8] text-white md:text-7xl lg:text-9xl">
                    <span className="block opacity-60">{works[index].title1}</span>
                    <span className="block font-bold">{works[index].title2}</span>
                  </h3>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="hidden md:block">
              <AnimatePresence mode="wait">
                <motion.span
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 0.1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="font-heading pointer-events-none absolute right-24 bottom-12 text-[20rem] leading-none text-white"
                >
                  {works[index].number}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Area: Description, CTA and Nav */}
          <div className="flex flex-col items-end justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-md">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  variants={contentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.8, delay: 0.1 }}
                >
                  <p className="mb-8 text-sm leading-relaxed font-light text-white/80 md:text-base">
                    {works[index].description}
                  </p>
                  <Button
                    variant="outline"
                    className="border-white/30 text-white hover:border-white"
                  >
                    {works[index].cta}
                  </Button>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Premium Navigation Controls */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
                  Progress
                </span>
                <div className="mt-2 h-[2px] w-32 bg-white/10">
                  <motion.div
                    className="h-full bg-white"
                    animate={{ width: `${((index + 1) / works.length) * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={prev}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 text-white transition-all hover:bg-white hover:text-black"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={next}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 text-white transition-all hover:bg-white hover:text-black"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};
