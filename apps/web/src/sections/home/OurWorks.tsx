"use client";

import React, { useEffect, useRef, useState } from "react";

import Image from "next/image";

import { type WorkItem, works } from "@data/projects/works";
import {
  AnimatePresence,
  MotionValue,
  Variants,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

import { Button } from "@/components/ui/Button";

const imageVariants: Variants = {
  enter: (direction: number) => ({
    clipPath: direction > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)",
    zIndex: 20,
    opacity: 1,
  }),
  center: {
    clipPath: "inset(0 0 0 0%)",
    zIndex: 20,
    opacity: 1,
    transition: {
      type: "tween",
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    zIndex: 10,
    opacity: 1,
    transition: {
      duration: 1.2,
    },
  },
};

const innerImageVariants: Variants = {
  enter: {
    scale: 1.1,
  },
  center: {
    scale: 1,
    transition: {
      type: "tween",
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    scale: 1.05,
    transition: {
      duration: 1.2,
    },
  },
};

const contentVariants: Variants = {
  initial: { clipPath: "inset(0 0 100% 0)", opacity: 0, y: 40 },
  animate: {
    clipPath: "inset(0 0 0% 0)",
    opacity: 1,
    y: 0,
    transition: { duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.4 } },
};

interface SlideImageProps {
  work: (typeof works)[0];
  direction: number;
  moveX: MotionValue<string>;
  moveY: MotionValue<string>;
}

const SlideImage = ({ work, direction, moveX, moveY }: SlideImageProps) => {
  return (
    <motion.div
      custom={direction}
      variants={imageVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="absolute inset-0 overflow-hidden"
    >
      <motion.div variants={innerImageVariants} className="absolute inset-0">
        <motion.div
          style={{ x: moveX, y: moveY }}
          className="absolute inset-[-5%] h-[110%] w-[110%]"
        >
          <Image
            src={work.image}
            alt={work.title1}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/50" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export const OurWorks = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [[index, direction], setPage] = useState([0, 0]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPage([(index + 1) % works.length, 1]);
    }, 8000);
    return () => clearInterval(timer);
  }, [index]);

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
  const radius = useTransform(smoothProgress, [0, 0.8], ["50px", "0px"]);

  const next = () => setPage([(index + 1) % works.length, 1]);
  const prev = () => setPage([(index - 1 + works.length) % works.length, -1]);

  return (
    <div className="bg-background relative flex w-full flex-col items-center overflow-visible">
      {/* Mobile View - Special Card Design */}
      <section className="section-padding container md:hidden">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 2, ease: [0.19, 1, 0.22, 1] }}
          className="header-margin flex flex-col items-center gap-6 text-center"
        >
          <h2 className="text-brand-blue font-primary text-[5rem] leading-[0.7] font-normal tracking-tighter uppercase">
            Our <br /> Works
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-500">
            Building the future with sustainable engineering and unparalleled craftsmanship across
            the region.
          </p>
        </motion.div>

        <div className="flex flex-col gap-32">
          {works.map((work, idx) => (
            <div key={work.id} className="relative flex w-full flex-col">
              {/* Image Layer - Slides from Left */}
              <motion.div
                initial={{ x: -80, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: false, amount: 0.1 }}
                transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
                className="relative z-10 aspect-[16/10] w-[92%] overflow-hidden bg-zinc-200 shadow-2xl"
              >
                <Image
                  src={work.image}
                  alt={work.title1}
                  fill
                  className="object-cover transition-transform duration-[5s] group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-black/5" />
              </motion.div>

              {/* Content Card - Slides from Right, Overlaps 25% */}
              <motion.div
                initial={{ x: 80, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: false, amount: 0.1 }}
                transition={{ duration: 1.5, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
                className="border-brand-blue relative z-20 -mt-24 ml-auto w-[85%] border-l-[12px] bg-white p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)]"
              >
                <div className="flex flex-col">
                  <div className="bg-brand-blue/10 mb-6 h-1 w-12" />
                  <h3 className="mb-6 text-5xl leading-[0.8] font-medium tracking-normal text-zinc-900 uppercase">
                    {work.title1} <br />
                    <span className="text-brand-blue font-black">{work.title2}</span>
                  </h3>
                  <p className="mb-8 text-xs leading-relaxed text-zinc-500">{work.description}</p>
                  <Button
                    borderColor="border-brand-blue"
                    textColor="text-brand-blue"
                    bgColor="bg-transparent"
                    hoverFillColor="bg-brand-blue"
                    hoverTextColor="group-hover:text-background"
                    className="h-14 w-full text-[10px] font-black tracking-widest"
                  >
                    {work.cta}
                  </Button>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* Desktop View - Existing Slider */}
      <motion.section
        id="works"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        style={{ width: containerWidth, borderRadius: radius }}
        className="bg-brand-black relative z-20 mx-auto hidden h-screen min-h-[700px] flex-col items-center overflow-hidden md:flex"
      >
        {/* Dual Container Reveal Layer */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence custom={direction} initial={false}>
            <SlideImage
              key={index}
              work={works[index]}
              direction={direction}
              moveX={moveX}
              moveY={moveY}
            />
          </AnimatePresence>
        </div>

        <div className="p-section-py-mobile md:p-section-py relative z-20 flex h-full w-full flex-col justify-between">
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
          <div className="flex flex-col items-start md:flex-row md:items-end md:gap-12">
            <div className="relative flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={works[index].id}
                  variants={contentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <h3 className="font-heading text-5xl leading-[0.8] text-white md:text-7xl lg:text-9xl">
                    <span className="block opacity-60">{works[index].title1}</span>
                    <span className="block font-bold">{works[index].title2}</span>
                  </h3>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div className="flex flex-col items-end justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-md">
              <AnimatePresence mode="wait">
                <motion.div
                  key={works[index].id}
                  variants={contentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <p className="mb-8 text-sm leading-relaxed font-light text-white/80 md:text-base">
                    {works[index].description}
                  </p>
                  <Button
                    borderColor="border-white/30"
                    textColor="text-white"
                    bgColor="bg-transparent"
                    hoverFillColor="bg-white"
                    hoverTextColor="group-hover:text-brand-blue"
                  >
                    {works[index].cta}
                  </Button>
                </motion.div>
              </AnimatePresence>
            </div>
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
