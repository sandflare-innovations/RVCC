"use client";

import {
  AnimatePresence,
  motion,
  MotionValue,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  Variants,
} from "framer-motion";
import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";

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
    scale: 1,
  },
  center: {
    scale: 1,
    transition: {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    scale: 1,
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

export interface OurWorkItem {
  id: string | number;
  title1: string;
  title2: string;
  description: string;
  image: string;
  number?: string;
  cta?: string;
  slug?: string;
}

interface SlideImageProps {
  work: OurWorkItem;
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
          {work.image && (
            <Image
              src={work.image}
              alt={work.title1}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-black/50" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export const OurWorksSkeleton = () => {
  return (
    <div className="h-screen w-full bg-white relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-tr from-white via-brand-blue/10 to-white animate-pulse" />
      <div className="container relative z-10 mx-auto p-12 flex flex-col gap-6">
        <div className="h-4 w-36 rounded-full bg-gradient-to-r from-brand-blue/25 to-brand-blue/10 animate-pulse" />
        <div className="h-20 w-80 bg-gradient-to-r from-brand-blue/20 via-brand-blue/10 to-brand-blue/15 animate-pulse md:h-28" />
        <div className="h-6 w-96 max-w-full bg-gradient-to-r from-zinc-200 via-brand-blue/10 to-zinc-200 animate-pulse" />
      </div>
    </div>
  );
};

export const OurWorks = ({ initialProjects }: { initialProjects?: any[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [[index, direction], setPage] = useState([0, 0]);

  const worksList: OurWorkItem[] = useMemo(() => {
    if (!initialProjects || initialProjects.length === 0) return [];
    return initialProjects.map((p, i) => {
      const words = (p.title || "").split(" ");
      return {
        id: p.id || i,
        title1: words[0] || "Featured",
        title2: words.slice(1).join(" ") || "Project",
        description: p.description || "",
        image: p.image || p.coverImage || "",
        number: String(i + 1).padStart(2, "0"),
        cta: "Explore project",
        slug: p.slug,
      };
    });
  }, [initialProjects]);

  useEffect(() => {
    if (worksList.length === 0) return;
    const timer = setInterval(() => {
      setPage([(index + 1) % worksList.length, 1]);
    }, 8000);
    return () => clearInterval(timer);
  }, [index, worksList.length]);

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

  const next = () => {
    if (worksList.length === 0) return;
    setPage([(index + 1) % worksList.length, 1]);
  };
  const prev = () => {
    if (worksList.length === 0) return;
    setPage([(index - 1 + worksList.length) % worksList.length, -1]);
  };

  if (worksList.length === 0) {
    return <OurWorksSkeleton />;
  }

  const currentWork = worksList[index] || worksList[0];

  return (
    <div className="bg-background relative flex w-full flex-col items-center overflow-hidden">
      {/* Mobile View - Special Card Design */}
      <section className="section-padding container md:hidden">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 2, ease: [0.19, 1, 0.22, 1] }}
          className="header-margin flex flex-col items-center gap-6 text-center"
        >
          <span className="text-brand-blue text-xs font-bold tracking-[0.4em] uppercase">
            Featured Portfolio
          </span>
          <h2 className="font-heading text-6xl leading-none text-zinc-900 uppercase">Our Works</h2>
        </motion.div>

        <div className="flex flex-col gap-16">
          {worksList.map((work) => (
            <div key={work.id} className="group relative flex flex-col overflow-hidden bg-white">
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                {work.image && (
                  <Image
                    src={work.image}
                    alt={work.title1}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="100vw"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute top-6 right-6 font-mono text-xl font-light text-white/40">
                  {work.number}
                </span>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative z-10 -mt-12 mx-4 bg-white p-8 shadow-xl"
              >
                <div className="flex flex-col">
                  <div className="bg-brand-blue/10 mb-6 h-1 w-12" />
                  <h3 className="mb-6 text-5xl leading-[0.8] font-medium tracking-normal text-zinc-900 uppercase">
                    {work.title1} <br />
                    <span className="text-brand-blue font-black">{work.title2}</span>
                  </h3>
                  <p className="mb-8 text-xs leading-relaxed text-zinc-500">{work.description}</p>
                  <Button
                    href={work.slug ? `/projects/${work.slug}` : "/projects"}
                    borderColor="border-brand-blue"
                    textColor="text-brand-blue"
                    bgColor="bg-transparent"
                    hoverFillColor="bg-brand-blue"
                    hoverTextColor="group-hover:text-background"
                    className="h-14 w-full text-[10px] font-black tracking-widest"
                  >
                    {work.cta || "View project"}
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
              work={currentWork}
              direction={direction}
              moveX={moveX}
              moveY={moveY}
            />
          </AnimatePresence>
        </div>

        <div className="py-section-py-mobile md:py-section-py relative z-20 container mx-auto flex h-full w-full flex-col justify-between">
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
                  key={currentWork.id}
                  variants={contentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <h3 className="font-heading text-5xl leading-[0.8] text-white md:text-7xl lg:text-9xl">
                    <span className="block opacity-60">{currentWork.title1}</span>
                    <span className="block font-bold">{currentWork.title2}</span>
                  </h3>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div className="flex flex-col items-end justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-md">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentWork.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="line-clamp-3 text-xs leading-relaxed font-light text-white/70 md:text-sm"
                >
                  {currentWork.description}
                </motion.p>
              </AnimatePresence>
              <div className="mt-8 flex gap-4">
                <Button
                  href={currentWork.slug ? `/projects/${currentWork.slug}` : "/projects"}
                  borderColor="border-white"
                  textColor="text-white"
                  bgColor="bg-transparent"
                  hoverFillColor="bg-white"
                  hoverTextColor="group-hover:text-brand-black"
                  className="rounded-none px-8"
                >
                  {currentWork.cta || "View project"}
                </Button>
                <Button
                  href="/projects"
                  borderColor="border-white/30"
                  textColor="text-white/60"
                  bgColor="bg-transparent"
                  hoverFillColor="bg-white/10"
                  hoverTextColor="group-hover:text-white"
                  className="rounded-none px-8"
                >
                  All Projects
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className="font-mono text-5xl font-light text-white/40 md:text-7xl">
                {currentWork.number}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={prev}
                  className="flex h-12 w-12 items-center justify-center border border-white/20 text-white transition-colors hover:border-white hover:bg-white hover:text-black"
                >
                  ←
                </button>
                <button
                  onClick={next}
                  className="flex h-12 w-12 items-center justify-center border border-white/20 text-white transition-colors hover:border-white hover:bg-white hover:text-black"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};
