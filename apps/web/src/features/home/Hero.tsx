"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

import { AnimatePresence, motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa6";

import { Button } from "@ui/Button";

import { cn } from "@lib/utils";

const HERO_CONTENT = [
  {
    subtitle: "Excellence in Construction",
    title1: "Building",
    title2: "Legacy",
    description:
      "Redefining the architectural landscape through precision engineering and visionary design. We build structures that define generations.",
    img: "/images/hero-bg.png",
  },
  {
    subtitle: "Precision Engineering",
    title1: "Shaping",
    title2: "Reality",
    description:
      "Turning ambitious concepts into solid architectural achievements with unparalleled technical expertise and innovative construction methods.",
    img: "/images/home-hero.png",
  },
  {
    subtitle: "Visionary Design",
    title1: "Beyond",
    title2: "Limits",
    description:
      "Creating iconic environments that inspire and endure. Our commitment to quality ensures every project becomes a landmark of excellence.",
    img: "/images/hero-bg.png",
  },
];

const SLIDE_DURATION = 6000;

export const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev: number) => (prev + 1) % HERO_CONTENT.length);
      setProgress(0);
    }, SLIDE_DURATION);

    const progressTimer = setInterval(() => {
      setProgress((prev: number) => Math.min(prev + 100 / (SLIDE_DURATION / 100), 100));
    }, 100);

    return () => {
      clearInterval(timer);
      clearInterval(progressTimer);
    };
  }, [currentIndex]);

  const content = HERO_CONTENT[currentIndex];

  return (
    <section className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-black">
      {/* Background Image Slider with Cinematic Motion */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: [0.19, 1, 0.22, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={content.img}
              alt={`Architecture Slide ${currentIndex + 1}`}
              fill
              priority
              className="scale-105 object-cover transition-transform duration-[6000ms] ease-out group-hover:scale-100"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/90" />
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="relative z-30 container flex h-full flex-col justify-center px-6 md:px-16 lg:px-24">
        <div className="max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={`subtitle-${currentIndex}`}
            className="mb-8 flex items-center gap-4"
          >
            <div className="bg-brand-blue h-[1px] w-12" />
            <span className="text-brand-blue text-xs font-black tracking-[0.5em] uppercase">
              {content.subtitle}
            </span>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
                exit: { opacity: 0, transition: { duration: 0.5 } },
              }}
            >
              <h1 className="font-heading mb-10 flex flex-col -space-y-4 leading-[0.8] text-white md:-space-y-8">
                <div className="overflow-hidden">
                  <motion.span
                    variants={{
                      hidden: { y: "100%", rotate: 5 },
                      visible: {
                        y: 0,
                        rotate: 0,
                        transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
                      },
                    }}
                    className="block text-[15vw] tracking-tighter uppercase md:text-[10rem] lg:text-[12rem]"
                  >
                    {content.title1}
                  </motion.span>
                </div>
                <div className="overflow-hidden">
                  <motion.span
                    variants={{
                      hidden: { y: "100%", rotate: -5 },
                      visible: {
                        y: 0,
                        rotate: 0,
                        transition: { duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] },
                      },
                    }}
                    className="text-brand-blue block text-[15vw] tracking-tighter uppercase italic md:text-[10rem] lg:text-[12rem]"
                  >
                    {content.title2}
                  </motion.span>
                </div>
              </h1>

              <div className="mt-12 flex flex-col items-start gap-12 md:flex-row md:items-center">
                <motion.p
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0, transition: { duration: 1, delay: 0.4 } },
                  }}
                  className="max-w-md text-base leading-relaxed font-medium text-zinc-400 md:text-lg"
                >
                  {content.description}
                </motion.p>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, x: 20 },
                    visible: { opacity: 1, x: 0, transition: { duration: 1, delay: 0.6 } },
                  }}
                  className="flex flex-wrap gap-6"
                >
                  <Button
                    variant="primary"
                    href="#projects"
                    className="group bg-brand-blue hover:text-brand-blue h-16 rounded-none px-10 transition-all duration-500 hover:bg-white"
                  >
                    <span className="flex items-center gap-3 text-xs font-bold tracking-widest uppercase">
                      Explore Works{" "}
                      <FaArrowRight className="transition-transform group-hover:translate-x-2" />
                    </span>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Decorative Architectural Line */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: "100vh" }}
        transition={{ duration: 2, ease: "easeInOut" }}
        className="absolute top-0 left-1/2 z-20 hidden w-[1px] bg-white/5 lg:block"
      />

      {/* Luxury Stats - Floating Bottom Right */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute right-12 bottom-20 z-40 hidden flex-col items-end gap-2 md:flex"
      >
        <div className="bg-brand-blue/50 mb-4 h-12 w-[1px]" />
        <div className="font-heading text-5xl font-bold tracking-tighter text-white">25+</div>
        <div className="text-brand-blue text-[10px] font-black tracking-[0.4em] uppercase">
          Years of Legacy
        </div>
      </motion.div>

      {/* Pagination - SpaceX Style Minimalist */}
      <div className="absolute bottom-12 left-1/2 z-50 flex -translate-x-1/2 items-center space-x-12">
        {HERO_CONTENT.map((_, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setProgress(0);
              }}
              className="group relative flex h-10 w-16 items-center"
            >
              <div className="relative h-[2px] w-full bg-white/10 transition-all duration-300 group-hover:bg-white/30">
                {isActive && (
                  <motion.div
                    className="bg-brand-blue absolute inset-y-0 left-0"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear" }}
                  />
                )}
              </div>
              <span
                className={cn(
                  "absolute -top-6 left-0 text-[10px] font-black tracking-widest transition-all duration-300",
                  isActive
                    ? "text-brand-blue opacity-100"
                    : "text-white/20 opacity-0 group-hover:opacity-100"
                )}
              >
                0{idx + 1}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
