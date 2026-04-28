"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";

import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "framer-motion";
import { FaArrowRight, FaChevronLeft, FaChevronRight } from "react-icons/fa6";

import { Button } from "@/components/ui/Button";

import { cn } from "@lib/utils";

const HERO_CONTENT = [
  {
    title1: "Building",
    title2: "Legacy",
    description:
      "Redefining the architectural landscape through precision engineering and visionary design. We build structures that define generations.",
    img: "/images/projects/major-center.png",
  },
  {
    title1: "Shaping",
    title2: "Reality",
    description:
      "Turning ambitious concepts into solid architectural achievements with unparalleled technical expertise and innovative construction methods.",
    img: "/images/projects/major-left.png",
  },
  {
    title1: "Beyond",
    title2: "Limits",
    description:
      "Creating iconic environments that inspire and endure. Our commitment to quality ensures every project becomes a landmark of excellence.",
    img: "/images/projects/major-right.png",
  },
];

export const Hero = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const PROGRESS_DURATION = 5000; // 5 seconds per slide

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();

  // Parallax / Scroll Animations
  const bgScale = useTransform(scrollY, [0, 1000], [1, 1.25]);
  const contentY = useTransform(scrollY, [0, 800], [0, -150]);
  const contentOpacity = useTransform(scrollY, [0, 600], [1, 0]);
  const blurValue = useTransform(scrollY, [0, 800], [0, 4]);

  useEffect(() => {
    const expandTimer = setTimeout(() => {
      setIsExpanded(true);
    }, 800);

    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 2800);

    return () => {
      clearTimeout(expandTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  useEffect(() => {
    if (!showContent) return;

    let startTime = Date.now();
    let animationFrame: number;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / PROGRESS_DURATION) * 100;

      if (newProgress >= 100) {
        setCurrentIndex((prev) => (prev + 1) % HERO_CONTENT.length);
        startTime = Date.now();
        setProgress(0);
      } else {
        setProgress(newProgress);
      }

      animationFrame = requestAnimationFrame(updateProgress);
    };

    animationFrame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrame);
  }, [showContent, currentIndex]);

  const handleSlideChange = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  const content = HERO_CONTENT[currentIndex];

  const baseHeight = "75vh";
  const baseWidth = "calc(75vh * 3 / 4)";
  const expandedHeight = "100vh";
  const expandedWidth = "calc(100vh * 3 / 4)";

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black"
    >
      {/* Background & Growth Layer */}
      <div className="relative flex h-full w-full items-center justify-center">
        {/* Left Side Card */}
        <motion.div
          initial={{ y: "100vh", x: "-120%", width: baseWidth, height: baseHeight }}
          animate={{
            y: "0vh",
            x: isExpanded ? "-220%" : "-120%",
            width: isExpanded ? expandedWidth : baseWidth,
            height: isExpanded ? expandedHeight : baseHeight,
            opacity: isExpanded ? 0 : 1,
          }}
          transition={{
            y: { duration: 1.5, ease: [0.16, 1, 0.3, 1] },
            x: { duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 },
            width: { duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 },
            height: { duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 },
            opacity: { duration: 1.2, ease: "easeInOut", delay: 1.8 },
          }}
          className="absolute z-10 overflow-hidden"
        >
          <Image src={HERO_CONTENT[1].img} alt="Side 1" fill className="object-cover" />
        </motion.div>

        {/* Center Card / Parallax Background */}
        <motion.div
          initial={{ y: "100vh", x: "0%", width: baseWidth, height: baseHeight }}
          animate={{
            y: "0vh",
            width: isExpanded ? "100vw" : baseWidth,
            height: isExpanded ? "100vh" : baseHeight,
          }}
          style={{ scale: isExpanded ? bgScale : 1 }}
          transition={{
            y: { duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 },
            width: { duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 },
            height: { duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 },
          }}
          className="relative z-10 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              <Image
                src={content.img}
                alt={content.title1}
                fill
                className="object-cover"
                priority
              />
              <motion.div
                style={{ backdropFilter: `blur(${blurValue}px)` }}
                className="absolute inset-0 bg-black/40"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Right Side Card */}
        <motion.div
          initial={{ y: "100vh", x: "120%", width: baseWidth, height: baseHeight }}
          animate={{
            y: "0vh",
            x: isExpanded ? "220%" : "-120%",
            width: isExpanded ? expandedWidth : baseWidth,
            height: isExpanded ? expandedHeight : baseHeight,
            opacity: isExpanded ? 0 : 1,
          }}
          transition={{
            y: { duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 },
            x: { duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 },
            width: { duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 },
            height: { duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 },
            opacity: { duration: 1.2, ease: "easeInOut", delay: 1.8 },
          }}
          className="absolute z-10 overflow-hidden"
        >
          <Image src={HERO_CONTENT[2].img} alt="Side 2" fill className="object-cover" />
        </motion.div>
      </div>

      {/* Hero Content Overlay with Scroll Parallax */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ y: contentY, opacity: contentOpacity }}
            className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-center p-8 md:p-16 lg:p-24"
          >
            <div className="mx-auto flex w-full max-w-[120rem] flex-col justify-center gap-12">
              <div className="pointer-events-auto w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
                    className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between"
                  >
                    <div className="flex-1">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="bg-brand-blue h-px w-8" />
                        <span className="text-[10px] font-bold tracking-[0.4em] text-white/40 uppercase">
                          Architecture & Design
                        </span>
                      </div>

                      <h1 className="font-heading flex flex-col -space-y-4 leading-[0.8] text-white md:-space-y-8">
                        <span className="block text-[15vw] tracking-tighter uppercase md:text-[8rem] lg:text-[10rem]">
                          {content.title1}
                        </span>
                        <span className="text-brand-blue block text-[15vw] tracking-tighter uppercase italic md:text-[8rem] lg:text-[10rem]">
                          {content.title2}
                        </span>
                      </h1>
                    </div>

                    <div className="flex flex-1 flex-col items-start gap-8 lg:max-w-xl lg:items-end lg:text-right">
                      <p className="max-w-md text-base leading-relaxed font-medium text-zinc-300 md:text-xl">
                        {content.description}
                      </p>

                      <Button
                        variant="primary"
                        href="#projects"
                        className="group hover:bg-brand-blue hover:border-brand-blue h-16 rounded-none border border-white bg-transparent px-10 text-white transition-all duration-500"
                      >
                        <span className="flex items-center gap-3 text-xs font-bold tracking-widest uppercase">
                          Explore Works{" "}
                          <FaArrowRight className="transition-transform group-hover:translate-x-2" />
                        </span>
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Line Based Navigation with Timer - Repositioned under content */}
                <div className="pointer-events-auto mt-16 w-full max-w-sm">
                  <div className="grid grid-cols-3 gap-6">
                    {HERO_CONTENT.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSlideChange(idx)}
                        className="group relative flex flex-col gap-3 py-2 text-left transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "text-[10px] font-bold tracking-widest transition-colors",
                              currentIndex === idx
                                ? "text-white"
                                : "text-white/20 group-hover:text-white/40"
                            )}
                          >
                            0{idx + 1}
                          </span>
                        </div>

                        {/* Line Background - More Visible but Slimmer */}
                        <div className="relative h-px w-full bg-white/10">
                          {/* Progress Indicator Line */}
                          {currentIndex === idx && (
                            <motion.div
                              className="bg-brand-blue absolute top-0 left-0 h-full"
                              style={{ width: `${progress}%` }}
                              transition={{ type: "tween", ease: "linear" }}
                            />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client Logos - Bottom Center */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="pointer-events-none absolute bottom-8 left-1/2 z-30 w-full -translate-x-1/2 overflow-hidden px-6 md:bottom-12"
          >
            <div className="mx-auto flex flex-col items-center gap-4">
              <span className="text-[9px] font-bold tracking-[0.4em] text-white/30 uppercase">
                Our Strategic Partners
              </span>

              {/* Infinite Logo Ticker */}
              <div className="relative w-full max-w-xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
                <motion.div
                  animate={{
                    x: ["0%", "-50%"],
                  }}
                  transition={{
                    duration: 30,
                    ease: "linear",
                    repeat: Infinity,
                  }}
                  className="flex w-max items-center gap-10 py-4"
                >
                  {[1, 2, 3, 4, 5, 6, 7].concat([1, 2, 3, 4, 5, 6, 7]).map((i, index) => (
                    <div key={index} className="relative h-7 w-24 brightness-0 invert">
                      <Image
                        src={`/images/concern-companies/logos/${i}.png`}
                        alt={`Partner Logo ${i}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
